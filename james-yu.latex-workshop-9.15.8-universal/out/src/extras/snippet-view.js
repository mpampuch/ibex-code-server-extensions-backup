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
exports.provider = exports.render = exports.state = void 0;
const vscode = __importStar(require("vscode"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const lw_1 = require("../lw");
const webview_1 = require("../utils/webview");
lw_1.lw.onDispose({ dispose: () => {
        vscode.window.onDidChangeActiveTextEditor(e => {
            state.lastActiveTextEditor = lw_1.lw.file.hasTexLangId(e?.document.languageId ?? '') ? e : undefined;
        });
    } });
async function render(pdfFileUri, opts) {
    if (!state.view?.webview) {
        return;
    }
    const uri = state.view.webview.asWebviewUri(pdfFileUri).toString();
    let disposable;
    const promise = new Promise((resolve) => {
        disposable = on((e) => {
            if (e.type !== 'png') {
                return;
            }
            if (e.uri === uri) {
                resolve(e);
            }
        });
        setTimeout(() => {
            disposable?.dispose();
            resolve(undefined);
        }, 3000);
        void state.view?.webview.postMessage({
            type: 'pdf',
            uri,
            opts
        });
    });
    try {
        const renderResult = await promise;
        return renderResult?.data;
    }
    finally {
        disposable?.dispose();
    }
}
exports.render = render;
function on(cb) {
    state.callbacks.add(cb);
    return {
        dispose: () => state.callbacks.delete(cb)
    };
}
function receive(message) {
    if (message.type === 'insertSnippet') {
        const editor = state.lastActiveTextEditor;
        if (editor) {
            editor.insertSnippet(new vscode.SnippetString(message.snippet.replace(/\\\n/g, '\\n'))).then(() => { }, err => {
                void vscode.window.showWarningMessage(`Unable to insert symbol, ${err}`);
            });
        }
        else {
            void vscode.window.showWarningMessage('Unable get document to insert symbol into');
        }
    }
}
class SnippetViewProvider {
    resolveWebviewView(webviewView) {
        state.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.onDidDispose(() => {
            state.view = undefined;
        });
        const webviewSourcePath = path.join(lw_1.lw.extensionRoot, 'resources', 'snippetview', 'snippetview.html');
        let webviewHtml = (0, fs_1.readFileSync)(webviewSourcePath, { encoding: 'utf8' });
        webviewHtml = (0, webview_1.replaceWebviewPlaceholders)(webviewHtml, state.view.webview);
        webviewView.webview.html = webviewHtml;
        webviewView.webview.onDidReceiveMessage((e) => {
            state.callbacks.forEach((cb) => void cb(e));
            receive(e);
        });
    }
}
const provider = new SnippetViewProvider();
exports.provider = provider;
const state = {
    view: undefined,
    lastActiveTextEditor: lw_1.lw.file.hasTexLangId(vscode.window.activeTextEditor?.document.languageId ?? '') ? vscode.window.activeTextEditor : undefined,
    callbacks: new Set()
};
exports.state = state;
//# sourceMappingURL=snippet-view.js.map