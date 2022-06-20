# Generate Translation :alien:

A visual studio code extension for you to generate the translations without leaving the current file.

## Usage

![Usage](/assets/generate-translation.gif)

## Extension Settings

This extension contributes the following settings:

- `generate-translation.flatten`: Use Flatten JSON format.
Some i18n files use a flatten format : 
i.e. 
```
{
"user.name": "Doe",
"user.firstname": "John"
}
```
instead of : 
``` 
{ "user": 
   { "name": "Doe",
     "firstname": "John"
  }
}
```
use this option to select your preferred format.

- `generate-translation.path`: Path to find your i18n files.
- `generate-translation.sort`: Sort object after inserting translation.
- `generate-translation.restrictToDefaultLanguage`: Restrict translations to the default language.
Developers are usually not the same team as translators, use this option to generate only the i18n configuration for the default language.   If left empty translation is done in all languages.
- `generate-translation.templateHtmlToReplace`: Template HTML to replace the selected text after generating a translation string. \n The string i18n will be replaced by the chosen key.



