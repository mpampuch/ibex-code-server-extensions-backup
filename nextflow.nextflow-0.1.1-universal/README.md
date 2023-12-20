# Nextflow language extension for Visual Studio Code

This extension adds the [Nextflow](https://www.nextflow.io/) language support 
to Visual Studio Code editor. 

## Features

It provides syntax highlighting for the Nextflow language and quick shortcuts for common code snippets.

![Nextflow syntax highlighting](https://github.com/nextflow-io/vscode-language-nextflow/raw/HEAD/images/vscode-nextflow.png)


## Local development 

Clone the project repository in your computer: 

    git clone https://github.com/nextflow-io/vscode-language-nextflow

Change in project directory and launch VS code: 

    cd vscode-language-nextflow    
    code . 

Hack the grammar and the snippet definition files. To quickly test changes use the `F5` key.     

## Publishing 

Update the extension version number in the `package.json` file,
then use the command: 

```
vsce publish
```

Read more at [this link](https://code.visualstudio.com/docs/extensions/publish-extension). 

## Contribution 

Contributions are greatly appreciated. Please fork [this repository](https://github.com/nextflow-io/vscode-language-nextflow), open a pull request to add snippets, make grammar tweaks, fix issues, etc.

## Useful links 

* https://manual.macromates.com/en/language_grammars
* https://code.visualstudio.com/docs/extensions/yocode
* https://code.visualstudio.com/docs/extensionAPI/extension-manifest
* https://marketplace.visualstudio.com/items?itemName=nextflow.nextflow


**Enjoy!**