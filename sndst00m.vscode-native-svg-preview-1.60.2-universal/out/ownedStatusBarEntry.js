"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewStatusBarEntry = void 0;
const vscode = require("vscode");
const dispose_1 = require("./dispose");
class PreviewStatusBarEntry extends dispose_1.Disposable {
    constructor(id, name, alignment, priority) {
        super();
        this.entry = this._register(vscode.window.createStatusBarItem(id, alignment, priority));
        this.entry.name = name;
    }
    hide(owner) {
        if (owner === this._showOwner) {
            this.entry.hide();
            this._showOwner = undefined;
        }
    }
    showItem(owner, text) {
        this._showOwner = owner;
        this.entry.text = text;
        this.entry.show();
    }
}
exports.PreviewStatusBarEntry = PreviewStatusBarEntry;
