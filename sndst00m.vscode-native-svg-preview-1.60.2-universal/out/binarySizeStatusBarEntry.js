"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinarySizeStatusBarEntry = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const ownedStatusBarEntry_1 = require("./ownedStatusBarEntry");
const localize = nls.loadMessageBundle();
class BinarySize {
    static formatSize(size) {
        if (size < BinarySize.kb) {
            return localize("sizeB", "{0}B", size);
        }
        if (size < BinarySize.mb) {
            return localize("sizeKB", "{0}KB", (size / BinarySize.kb).toFixed(2));
        }
        if (size < BinarySize.gb) {
            return localize("sizeMB", "{0}MB", (size / BinarySize.mb).toFixed(2));
        }
        if (size < BinarySize.tb) {
            return localize("sizeGB", "{0}GB", (size / BinarySize.gb).toFixed(2));
        }
        return localize("sizetb", "{0}tb", (size / BinarySize.tb).toFixed(2));
    }
}
BinarySize.kb = 1024;
BinarySize.mb = BinarySize.kb * BinarySize.kb;
BinarySize.gb = BinarySize.mb * BinarySize.kb;
BinarySize.tb = BinarySize.gb * BinarySize.kb;
class BinarySizeStatusBarEntry extends ownedStatusBarEntry_1.PreviewStatusBarEntry {
    constructor() {
        super("status.svgPreview.binarySize", localize("sizeStatusBar.name", "Image Binary Size"), vscode.StatusBarAlignment.Right, 100);
    }
    show(owner, size) {
        if (typeof size === "number") {
            super.showItem(owner, BinarySize.formatSize(size));
        }
        else {
            this.hide(owner);
        }
    }
}
exports.BinarySizeStatusBarEntry = BinarySizeStatusBarEntry;
