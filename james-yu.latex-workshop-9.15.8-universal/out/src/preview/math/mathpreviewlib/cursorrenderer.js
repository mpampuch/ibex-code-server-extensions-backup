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
exports.testTools = exports.renderCursor = void 0;
const vscode = __importStar(require("vscode"));
const lw_1 = require("../../../lw");
const selection_1 = require("../../../language/selection");
const logger = lw_1.lw.log('Preview', 'Math', 'Cursor');
const cache = {};
// Test whether cursor is in tex command strings
// like \begin{...} \end{...} \xxxx{ \[ \] \( \) or \\
function isCursorInTeXCommand(document) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return false;
    }
    const cursor = editor.selection.active;
    const r = document.getWordRangeAtPosition(cursor, /\\(?:begin|end|label)\{.*?\}|\\[a-zA-Z]+\{?|\\[()[\]]|\\\\/);
    if (r && r.start.isBefore(cursor) && r.end.isAfter(cursor)) {
        return true;
    }
    return false;
}
function findCursorPosInSnippet(texMath, cursorPos) {
    const line = cursorPos.line - texMath.range.start.line;
    const character = line === 0 ? cursorPos.character - texMath.range.start.character : cursorPos.character;
    return new vscode.Position(line, character);
}
async function insertCursor(texMath, cursorPos, cursor) {
    const findResult = await findNodeAt(texMath, cursorPos);
    if (findResult === undefined || cache.ast === undefined) {
        return texMath.texString;
    }
    if (findResult.find(node => node.type === 'macro' && node.content === 'text')) {
        return texMath.texString;
    }
    const cursorNode = findResult[findResult.length - 1];
    if (cursorNode?.type === 'macro') {
        return texMath.texString;
    }
    const texLines = texMath.texString.split('\n');
    texLines[cursorPos.line] = texLines[cursorPos.line].slice(0, cursorPos.character) + cursor + texLines[cursorPos.line].slice(cursorPos.character);
    return texLines.join('\n');
}
async function findNodeAt(texMath, cursorPos) {
    let ast;
    if (texMath.texString === cache.texString && cache.ast) {
        logger.log(`Use previous AST of ${texMath.texString} .`);
        ast = cache.ast;
    }
    else {
        logger.log(`Parse LaTeX AST from ${texMath.texString} .`);
        ast = await lw_1.lw.parse.tex(texMath.texString);
        cache.ast = ast;
        cache.texString = texMath.texString;
    }
    if (!ast) {
        logger.log('Failed parsing LaTeX AST.');
        return;
    }
    const cursorPosInSnippet = findCursorPosInSnippet(texMath, cursorPos);
    const result = (0, selection_1.findNode)(cursorPosInSnippet, ast);
    return result;
}
async function renderCursor(document, texMath, thisColor) {
    const configuration = vscode.workspace.getConfiguration('latex-workshop');
    const cursorEnabled = configuration.get('hover.preview.cursor.enabled');
    if (!cursorEnabled) {
        return texMath.texString;
    }
    const texMathRange = texMath.range;
    const cursorPos = vscode.window.activeTextEditor?.selection.active;
    if (!cursorPos) {
        return texMath.texString;
    }
    if (!isCursorInsideTexMath(texMathRange, cursorPos)) {
        return texMath.texString;
    }
    if (isCursorInTeXCommand(document)) {
        return texMath.texString;
    }
    const symbol = configuration.get('hover.preview.cursor.symbol');
    const color = configuration.get('hover.preview.cursor.color');
    const cursorString = color === 'auto' ? `{\\color{${thisColor}}${symbol}}` : `{\\color{${color}}${symbol}}`;
    return insertCursor(texMath, cursorPos, cursorString);
}
exports.renderCursor = renderCursor;
function isCursorInsideTexMath(texMathRange, cursorPos) {
    return texMathRange.contains(cursorPos) && !texMathRange.start.isEqual(cursorPos) && !texMathRange.end.isEqual(cursorPos);
}
exports.testTools = {
    insertCursor,
    isCursorInsideTexMath,
};
//# sourceMappingURL=cursorrenderer.js.map