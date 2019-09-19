import { ExtensionContext, commands, window, workspace } from 'vscode';
import { GenerateTranslation } from './lib';

export const activate = (context: ExtensionContext) => {
	const generateTranslationGenerate = commands.registerCommand('generateTranslation.generate', generate);
	context.subscriptions.push(generateTranslationGenerate);

	const generateTranslationFromSelectedTranslatedText = commands.registerCommand('generateTranslation.fromSelectedTranslatedText', fromSelectedTranslatedText);
	context.subscriptions.push(generateTranslationFromSelectedTranslatedText);

	const generateTranslationFromSelectedTranslationKey = commands.registerCommand('generateTranslation.fromSelectedTranslationKey', fromSelectedTranslationKey);
	context.subscriptions.push(generateTranslationFromSelectedTranslationKey);
};

const generate = async () => {
	const key = await window.showInputBox({
		prompt: `Which key do you want to use?`,
	});

	if (key) {
		GenerateTranslation.generate(key);
	}
};

const fromSelectedTranslatedText = async () => {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const selection = editor.selection;
	const textSelection = editor.document.getText(selection);
	if (!textSelection) {
		window.showWarningMessage('Nothing selected.');
		return;
  }

  const defaultLanguageFile = <string>workspace
    .getConfiguration("generate-translation")
    .get("defaultLanguageFile") || "";
  const selectionLanguage = await window.showInputBox({
    prompt: `What is the language file corresponding to the current selection's language?`,
    value: defaultLanguageFile
  });
	if (!selectionLanguage) {
		window.showWarningMessage('You must choose a language corresponding to the selection.');
		return;
  }

	const key = await window.showInputBox({
		prompt: `Which key do you want to use?`,
	});
	if (!key) {
		window.showWarningMessage('You must choose a key for the translation.');
		return;
  }

	GenerateTranslation.fromSelectedTranslatedText(key, textSelection, selectionLanguage);
};

const fromSelectedTranslationKey = () => {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	const selection = editor.selection;
	const textSelection = editor.document.getText(selection);

	if (!textSelection) {
		window.showWarningMessage('Nothing selected.');
		return;
	}

	GenerateTranslation.fromSelectedTranslationKey(textSelection);
};
