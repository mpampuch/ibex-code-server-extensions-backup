"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SizeStatusBarEntry = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const ownedStatusBarEntry_1 = require("./ownedStatusBarEntry");
const localize = nls.loadMessageBundle();
class SizeStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super("status.svgPreview.size", localize("sizeStatusBar.name", "Image Size"), vscode.StatusBarAlignment.Right, 101 /* to the left of editor status (100) */);
    }
    show(owner, text) {
        this.showItem(owner, text);
    }
}
exports.SizeStatusBarEntry = SizeStatusBarEntry;
