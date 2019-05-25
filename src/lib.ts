import { window, workspace } from "vscode";
import fs = require("fs");
import path = require("path");

let dotProp = require("dot-prop-immutable");

export abstract class GenerateTranslation {
  private static _editor = window.activeTextEditor;

  public static generate(key: string) {
    GenerateTranslation.fromSelectedText(key);
  }

  public static async fromSelectedText(textSelection: string) {
    try {

      const path: string = workspace
        .getConfiguration("generate-translation")
        .get("path");

      let pathToFind = `${workspace.rootPath}${path}`;

      const translateFiles = GenerateTranslation.getFiles(
        pathToFind,
        ".json",
        null,
        []
      );

      for (let i = 0; i < translateFiles.length; i++) {
        const file = translateFiles[i];
        let translateObject = JSON.parse(fs.readFileSync(file, "utf-8"));

        const translateObjectName = file.replace(`${pathToFind}/`, "");

        if (dotProp.get(translateObject, textSelection)) {
          window.showErrorMessage(
            `${textSelection} already exists in the file ${translateObjectName}.`
          );
        } else {
          const value = await window.showInputBox({
            prompt: `What is value in ${translateObjectName} ?`,
            placeHolder: textSelection
          });

          if (value) {
            const arrTextSelection = textSelection.split(".");
            arrTextSelection.pop();

            const valueLastKey = dotProp.get(
              translateObject,
              arrTextSelection.join(".")
            );
            if (valueLastKey && typeof valueLastKey === "string") {
              const newObject = {
                [arrTextSelection[arrTextSelection.length - 1]]: valueLastKey
              };

              translateObject = dotProp.set(
                translateObject,
                arrTextSelection.join("."),
                newObject
              );
            }

            translateObject = dotProp.set(
              translateObject,
              GenerateTranslation.normalizeKey(textSelection),
              value
            );

            await GenerateTranslation.updateFile(
              file,
              translateObject,
              translateObjectName
            );

            window.showInformationMessage(
              `${textSelection} added in the file ${translateObjectName}.`
            );

            GenerateTranslation.replaceOnTranslate(textSelection);
          }
        }
      }
    } catch (error) {
      window.showErrorMessage(error.message);
    }
  }

  public static async generateFiles() {

    return new Promise(async (resolve) => {
      const path: string = workspace
        .getConfiguration("generate-translation")
        .get("path");

      let pathToFind = `${workspace.rootPath}${path}`;

      if (!fs.existsSync(pathToFind)) {

        let pathToSaveFile = await window.showInputBox({
          prompt: `What is the way to save the translation file? root: \n ${workspace.rootPath}`,
          placeHolder: 'path (default: src/assets/i18n)'
        });

        if (!pathToSaveFile)
          pathToSaveFile = path;

        GenerateTranslation.mkdirSyncRecursive(pathToFind);

        const fileName: string = workspace
          .getConfiguration("generate-translation")
          .get("filename");

        let fileNameToSave = await window.showInputBox({
          prompt: `What is the name of the translation file?`,
          placeHolder: 'filename (default: messages)'
        });

        if (!fileNameToSave)
          fileNameToSave = fileName;

        fs.appendFileSync(`${pathToFind}/${fileNameToSave}.en.json`, '{}');
        fs.appendFileSync(`${pathToFind}/${fileNameToSave}.pt-br.json`, '{}');
      }

      resolve(true);
    })
  }

  private static replaceOnTranslate(textSelection: string) {
    const editor = window.activeTextEditor;
    const replaceForExtensions = <Array<string>>(
      workspace
        .getConfiguration("generate-translation")
        .get("replaceForExtensions")
    );
    const templateSnippetToReplace = <string>(
      workspace
        .getConfiguration("generate-translation")
        .get("templateSnippetToReplace")
    );

    if (editor && editor.document && editor.document.fileName) {
      const extname = path.extname(editor.document.fileName);

      if (
        editor &&
        replaceForExtensions.indexOf(extname.replace(".", "")) > -1 &&
        templateSnippetToReplace
      ) {
        editor.edit(editBuilder => {
          editBuilder.replace(
            editor.selection,
            templateSnippetToReplace.replace("i18n", textSelection)
          );
        });
      }
    }
  }

  private static async updateFile(
    file: string,
    translateObject: any,
    translateObjectName: string
  ) {
    try {
      let tabSizeEditor: string | number = 4;
      if (
        GenerateTranslation._editor &&
        GenerateTranslation._editor.options.tabSize
      ) {
        tabSizeEditor = GenerateTranslation._editor.options.tabSize;
      }

      const sort = workspace
        .getConfiguration("generate-translation")
        .get("sort");
      if (sort) {
        translateObject = GenerateTranslation.sortObject(translateObject);
      }

      fs.writeFile(
        file,
        JSON.stringify(translateObject, null, tabSizeEditor),
        (err: any) => {
          if (err) {
            throw err;
          }
        }
      );
    } catch {
      throw new Error(`Error saving file ${translateObjectName}.`);
    }
  }

  private static getFiles = (
    basePath: string,
    ext: string,
    files: any,
    result: any[]
  ): any => {
    try {
      files = files || fs.readdirSync(basePath);
      result = result || [];

      files.forEach((file: string) => {
        const newbase = <never>path.join(basePath, file);

        if (fs.statSync(newbase).isDirectory()) {
          result = GenerateTranslation.getFiles(
            newbase,
            ext,
            fs.readdirSync(newbase),
            result
          );
        } else if (file.includes(ext)) {
          result.push(newbase);
        }
      });
      return result;
    } catch {
      throw new Error(
        "No translation file was found. Check the path configured in the extension."
      );
    }
  };

  private static sortObject = (object: any): any => {
    if (Array.isArray(object)) {
      return object.sort().map(GenerateTranslation.sortObject);
    } else if (GenerateTranslation.isPlainObject(object)) {
      return Object.keys(object)
        .sort()
        .reduce((a: any, k: any) => {
          a[k] = GenerateTranslation.sortObject(object[k]);
          return a;
        }, {});
    }

    return object;
  };

  private static isPlainObject = (object: any): boolean =>
    "[object Object]" === Object.prototype.toString.call(object);

  private static normalizeKey = (key: string) => key.replace(" ", "_");

  private static mkdirSyncRecursive = (directory: any) => {
    var path = directory.replace(/\/$/, '').split('/');
    for (var i = 1; i <= path.length; i++) {
      var segment = path.slice(0, i).join('/');
      segment.length > 0 && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
    }
  };
}
