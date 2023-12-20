# Changelog

## 1.60.2

<a href="https://code.visualstudio.com/updates/v1_39" target="_blank"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Compatibility&message=>=v1.39.0&logo=visualstudio&logoColor=cacde2&labelColor=2c2c32&color=006daf" /></a> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/tree/v1.60.1%2B1/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Release%20Date&message=2021-09-18&logo=googlecalendar&logoColor=cacde2&labelColor=212121&color=006daf" /> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/projects/3/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Project%20Board&message=v1.60.1%2B1&logo=trello&logoColor=cacde2&labelColor=212121&color=006daf" /></a> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/milestone/3/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Milestone&message=v1.60.1%2B1&logo=github&logoColor=cacde2&labelColor=212121&color=006daf" /></a>

Move preview screenshot from `editor-overview.png` to `editor-preview.png` in repository.

## 1.60.1

<a href="https://code.visualstudio.com/updates/v1_39" target="_blank"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Compatibility&message=>=v1.39.0&logo=visualstudio&logoColor=cacde2&labelColor=2c2c32&color=006daf" /></a> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/tree/v1.60.1/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Release%20Date&message=2021-09-18&logo=googlecalendar&logoColor=cacde2&labelColor=212121&color=006daf" /> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/projects/2/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Project%20Board&message=v1.60.1&logo=trello&logoColor=cacde2&labelColor=212121&color=006daf" /></a> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/milestone/2/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Milestone&message=v1.60.1&logo=github&logoColor=cacde2&labelColor=212121&color=006daf" /></a>

- Disable preview actions in side-by-side diff view.
- Fix for broken 404 editor preview screenshot.

## 1.60.0

<a href="https://code.visualstudio.com/updates/v1_39" target="_blank"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Compatibility&message=>=v1.39.0&logo=visualstudio&logoColor=cacde2&labelColor=2c2c32&color=006daf" /></a> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/tree/v1.60.0/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Release%20Date&message=2021-09-16&logo=googlecalendar&logoColor=cacde2&labelColor=212121&color=006daf" /> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/projects/1/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Project%20Board&message=v1.60.0&logo=trello&logoColor=cacde2&labelColor=212121&color=006daf" /></a> <a href="https://github.com/SNDST00M/vscode-native-svg-preview/milestone/1/"><img src="https://img.shields.io/static/v1.svg?style=flat-square&label=Milestone&message=v1.60.0&logo=github&logoColor=cacde2&labelColor=212121&color=006daf" /></a>

Initial version:

- Support for SVGs that are renderable in the Chromium browser.
- Adaptive checkerboard background matching the native image preview.
- Reflow mode for SVG documents without a bounding box (`viewBox`).
- Editor preview screenshot to the documentation for end users.

## Roadmap

- Add [locked preview and locked side preview][markdown-vscode-locked-preview].
- Investigate action to switch diff between preview & text formats.

<!-- Roadmap -->
[markdown-vscode-locked-preview]: https://github.com/microsoft/vscode/blob/1.60.1/extensions/markdown-language-features/src/commands/showPreview.ts#L88-L102
