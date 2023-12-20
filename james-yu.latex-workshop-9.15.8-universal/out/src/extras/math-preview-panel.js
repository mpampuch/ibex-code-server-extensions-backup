"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggle = exports.serializer = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const webview_1 = require("../utils/webview");
const lw_1 = require("../lw");
const logger = lw_1.lw.log('Preview', 'Math');
function resourcesFolder(extensionRoot) {
    const folder = path.join(extensionRoot, 'resources', 'mathpreviewpanel');
    return vscode.Uri.file(folder);
}
class MathPreviewPanelSerializer {
    deserializeWebviewPanel(panel) {
        initializePanel(panel);
        panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [resourcesFolder(lw_1.lw.extensionRoot)]
        };
        panel.webview.html = getHtml(panel.webview);
        logger.log('Math preview panel: restored');
        return Promise.resolve();
    }
}
const serializer = new MathPreviewPanelSerializer();
exports.serializer = serializer;
const state = {
    panel: undefined,
    prevEditTime: 0,
    prevDocumentUri: undefined,
    prevCursorPosition: undefined,
    prevNewCommands: undefined,
};
function open() {
    const activeDocument = vscode.window.activeTextEditor?.document;
    if (state.panel) {
        if (!state.panel.visible) {
            state.panel.reveal(undefined, true);
        }
        return;
    }
    lw_1.lw.preview.math.getColor();
    const panel = vscode.window.createWebviewPanel('latex-workshop-mathpreview', 'Math Preview', { viewColumn: vscode.ViewColumn.Active, preserveFocus: true }, {
        enableScripts: true,
        localResourceRoots: [resourcesFolder(lw_1.lw.extensionRoot)],
        retainContextWhenHidden: true
    });
    initializePanel(panel);
    panel.webview.html = getHtml(panel.webview);
    const configuration = vscode.workspace.getConfiguration('latex-workshop');
    const editorGroup = configuration.get('mathpreviewpanel.editorGroup');
    if (activeDocument) {
        void (0, webview_1.moveWebviewPanel)(panel, editorGroup);
    }
    logger.log('Math preview panel: opened');
}
function initializePanel(panel) {
    const disposable = vscode.Disposable.from(vscode.workspace.onDidChangeTextDocument((event) => {
        void update({ type: 'edit', event });
    }), vscode.window.onDidChangeTextEditorSelection((event) => {
        void update({ type: 'selection', event });
    }));
    state.panel = panel;
    panel.onDidDispose(() => {
        disposable.dispose();
        clearCache();
        state.panel = undefined;
        logger.log('Math preview panel: disposed');
    });
    panel.onDidChangeViewState((ev) => {
        if (ev.webviewPanel.visible) {
            void update();
        }
    });
    panel.webview.onDidReceiveMessage(() => {
        logger.log('Math preview panel: initialized');
        void update();
    });
}
function close() {
    state.panel?.dispose();
    state.panel = undefined;
    clearCache();
    logger.log('Math preview panel: closed');
}
function toggle(action) {
    if (action) {
        if (action === 'open') {
            open();
        }
        else {
            close();
        }
    }
    else if (state.panel) {
        close();
    }
    else {
        open();
    }
}
exports.toggle = toggle;
function clearCache() {
    state.prevEditTime = 0;
    state.prevDocumentUri = undefined;
    state.prevCursorPosition = undefined;
    state.prevNewCommands = undefined;
}
function getHtml(webview) {
    const jsPath = vscode.Uri.file(path.join(lw_1.lw.extensionRoot, './resources/mathpreviewpanel/mathpreview.js'));
    const jsPathSrc = webview.asWebviewUri(jsPath);
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; script-src ${webview.cspSource}; img-src data:; style-src 'unsafe-inline';">
        <meta charset="UTF-8">
        <style>
            body {
                padding: 0;
                margin: 0;
            }
            #math {
                padding-top: 35px;
                padding-left: 50px;
            }
        </style>
        <script src='${jsPathSrc}' defer></script>
    </head>
    <body>
        <div id="mathBlock"><img src="" id="math" /></div>
    </body>
    </html>`;
}
async function update(ev) {
    if (!state.panel || !state.panel.visible) {
        return;
    }
    if (!vscode.workspace.getConfiguration('latex-workshop').get('mathpreviewpanel.cursor.enabled', false)) {
        if (ev?.type === 'edit') {
            state.prevEditTime = Date.now();
        }
        else if (ev?.type === 'selection') {
            if (Date.now() - state.prevEditTime < 100) {
                return;
            }
        }
    }
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    if (!editor || !document?.languageId || !lw_1.lw.file.hasTexLangId(document.languageId)) {
        clearCache();
        return;
    }
    const documentUri = document.uri.toString();
    if (ev?.type === 'edit' && documentUri !== ev.event.document.uri.toString()) {
        return;
    }
    const position = editor.selection.active;
    const texMath = getTexMath(document, position);
    if (!texMath) {
        clearCache();
        return state.panel.webview.postMessage({ type: 'mathImage', src: '' });
    }
    let cachedCommands;
    if (position.line === state.prevCursorPosition?.line && documentUri === state.prevDocumentUri) {
        cachedCommands = state.prevNewCommands;
    }
    if (vscode.workspace.getConfiguration('latex-workshop').get('mathpreviewpanel.cursor.enabled', false)) {
        await renderCursor(document, texMath);
    }
    const result = await lw_1.lw.preview.math.generateSVG(texMath, cachedCommands).catch(() => undefined);
    if (!result) {
        return;
    }
    state.prevDocumentUri = documentUri;
    state.prevNewCommands = result.newCommands;
    state.prevCursorPosition = position;
    return state.panel.webview.postMessage({ type: 'mathImage', src: result.svgDataUrl });
}
function getTexMath(document, position) {
    const texMath = lw_1.lw.preview.math.findMath(document, position);
    if (texMath) {
        if (texMath.envname !== '$') {
            return texMath;
        }
        if (texMath.range.start.character !== position.character && texMath.range.end.character !== position.character) {
            return texMath;
        }
    }
    return;
}
async function renderCursor(document, tex) {
    const s = await lw_1.lw.preview.math.renderCursor(document, tex);
    tex.texString = s;
}
//# sourceMappingURL=math-preview-panel.js.map