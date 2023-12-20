"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const binarySizeStatusBarEntry_1 = require("./binarySizeStatusBarEntry");
const preview_1 = require("./preview");
const sizeStatusBarEntry_1 = require("./sizeStatusBarEntry");
const zoomStatusBarEntry_1 = require("./zoomStatusBarEntry");
function activate(context) {
    const svgSizeStatusBarEntry = new sizeStatusBarEntry_1.SizeStatusBarEntry();
    context.subscriptions.push(svgSizeStatusBarEntry);
    const svgBinarySizeStatusBarEntry = new binarySizeStatusBarEntry_1.BinarySizeStatusBarEntry();
    context.subscriptions.push(svgBinarySizeStatusBarEntry);
    const svgZoomStatusBarEntry = new zoomStatusBarEntry_1.ZoomStatusBarEntry();
    context.subscriptions.push(svgZoomStatusBarEntry);
    const svgPreviewManager = new preview_1.SvgPreviewManager(context.extensionUri, svgSizeStatusBarEntry, svgBinarySizeStatusBarEntry, svgZoomStatusBarEntry);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider(preview_1.SvgPreviewManager.viewType, svgPreviewManager, {
        supportsMultipleEditorsPerDocument: true
    }));
    context.subscriptions.push(vscode.commands.registerCommand("svgPreview.showPreviewToSide", (uri) => {
        svgPreviewManager.showPreviewToSide(uri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("svgPreview.showPreview", (uri) => {
        svgPreviewManager.showPreview(uri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("svgPreview.showSource", (uri) => {
        svgPreviewManager.activePreview?.showSource(uri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("svgPreview.zoomIn", () => {
        svgPreviewManager.activePreview?.zoomIn();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("svgPreview.zoomOut", () => {
        svgPreviewManager.activePreview?.zoomOut();
    }));
}
exports.activate = activate;
