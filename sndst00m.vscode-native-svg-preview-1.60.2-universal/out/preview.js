"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPreviewManager = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const dispose_1 = require("./dispose");
const localize = nls.loadMessageBundle();
class SvgPreviewManager {
    constructor(extensionRoot, sizeStatusBarEntry, binarySizeStatusBarEntry, zoomStatusBarEntry) {
        this.extensionRoot = extensionRoot;
        this.sizeStatusBarEntry = sizeStatusBarEntry;
        this.binarySizeStatusBarEntry = binarySizeStatusBarEntry;
        this.zoomStatusBarEntry = zoomStatusBarEntry;
        this._previews = new Set();
    }
    async openCustomDocument(uri) {
        return { dispose: () => { }, uri };
    }
    async resolveCustomEditor(document, webviewEditor) {
        const preview = new SvgPreview(this.extensionRoot, document.uri, webviewEditor, this.sizeStatusBarEntry, this.binarySizeStatusBarEntry, this.zoomStatusBarEntry);
        this._previews.add(preview);
        this.setActivePreview(preview);
        webviewEditor.onDidDispose(() => {
            this._previews.delete(preview);
        });
        webviewEditor.onDidChangeViewState(() => {
            if (webviewEditor.active) {
                this.setActivePreview(preview);
            }
            else if (this._activePreview === preview && !webviewEditor.active) {
                this.setActivePreview(undefined);
            }
        });
    }
    get activePreview() {
        return this._activePreview;
    }
    showPreview(uri) {
        const viewColumn = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Active
            : vscode.ViewColumn.One;
        if (uri instanceof vscode.Uri) {
            void vscode.commands.executeCommand("vscode.openWith", uri, SvgPreviewManager.viewType, viewColumn);
            return;
        }
        const resource = vscode.window.activeTextEditor?.document.uri;
        if (resource instanceof vscode.Uri) {
            void vscode.commands.executeCommand("vscode.openWith", resource, SvgPreviewManager.viewType, viewColumn);
        }
    }
    showPreviewToSide(uri) {
        const viewColumn = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.Two;
        if (uri instanceof vscode.Uri) {
            void vscode.commands.executeCommand("vscode.openWith", uri, SvgPreviewManager.viewType, viewColumn);
            return;
        }
        const resource = vscode.window.activeTextEditor?.document.uri;
        if (resource instanceof vscode.Uri) {
            void vscode.commands.executeCommand("vscode.openWith", resource, SvgPreviewManager.viewType, viewColumn);
        }
    }
    setActivePreview(value) {
        this._activePreview = value;
        this.setPreviewActiveContext(!!value);
    }
    setPreviewActiveContext(value) {
        void vscode.commands.executeCommand("setContext", "svgPreviewFocus", value);
    }
}
exports.SvgPreviewManager = SvgPreviewManager;
SvgPreviewManager.viewType = "svgPreview.previewEditor";
class SvgPreview extends dispose_1.Disposable {
    constructor(extensionRoot, resource, webviewEditor, sizeStatusBarEntry, binarySizeStatusBarEntry, zoomStatusBarEntry) {
        super();
        this.extensionRoot = extensionRoot;
        this.resource = resource;
        this.webviewEditor = webviewEditor;
        this.sizeStatusBarEntry = sizeStatusBarEntry;
        this.binarySizeStatusBarEntry = binarySizeStatusBarEntry;
        this.zoomStatusBarEntry = zoomStatusBarEntry;
        this.id = `${Date.now()}-${Math.random().toString()}`;
        this.emptySvgDataUri = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMSIgd2lkdGg9IjEiPjwvc3ZnPg==";
        this._previewState = 1 /* Visible */;
        const resourceRoot = resource.with({
            path: resource.path.replace(/\/[^\/]+?\.\w+$/, "/"),
        });
        webviewEditor.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                resourceRoot,
                extensionRoot,
            ]
        };
        this._register(webviewEditor.webview.onDidReceiveMessage(message => {
            if (!isMessage(message)) {
                return;
            }
            switch (message.type) {
                case "size": {
                    this._imageSize = message.value;
                    this.update();
                    break;
                }
                case "zoom": {
                    this._imageZoom = message.value;
                    this.update();
                    break;
                }
                case "reopen-as-text": {
                    void vscode.commands.executeCommand("vscode.openWith", resource, "default", webviewEditor.viewColumn);
                    break;
                }
                case "max-scale": {
                    this.setZoomContext("max", message.value);
                    break;
                }
                case "min-scale": {
                    this.setZoomContext("min", message.value);
                    break;
                }
            }
        }));
        this._register(this.zoomStatusBarEntry.onDidChangeScale(e => {
            if (this._previewState === 2 /* Active */) {
                void this.webviewEditor.webview.postMessage({
                    scale: e.scale,
                    type: "setScale"
                });
            }
        }));
        this._register(this.webviewEditor.onDidChangeViewState(() => {
            this.update();
            void this.webviewEditor.webview.postMessage({
                type: "setActive", value: this.webviewEditor.active
            });
        }));
        this._register(this.webviewEditor.onDidDispose(() => {
            if (this._previewState === 2 /* Active */) {
                this.sizeStatusBarEntry.hide(this.id);
                this.binarySizeStatusBarEntry.hide(this.id);
                this.zoomStatusBarEntry.hide(this.id);
            }
            this._previewState = 0 /* Disposed */;
        }));
        const watcher = this._register(vscode.workspace.createFileSystemWatcher(resource.fsPath));
        this._register(watcher.onDidChange(e => {
            if (e.toString() === this.resource.toString()) {
                void this.render();
            }
        }));
        this._register(watcher.onDidDelete(e => {
            if (e.toString() === this.resource.toString()) {
                this.webviewEditor.dispose();
            }
        }));
        void vscode.workspace.fs.stat(resource).then(({ size }) => {
            this._imageBinarySize = size;
            this.update();
        });
        void this.render();
        this.update();
        void this.webviewEditor.webview.postMessage({
            type: "setActive",
            value: this.webviewEditor.active
        });
    }
    showSource(uri) {
        if (uri instanceof vscode.Uri) {
            return vscode.workspace.openTextDocument(uri).then(document => {
                void vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
            });
        }
        if (this.resource) {
            return vscode.workspace.openTextDocument(this.resource).then(document => {
                void vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
            });
        }
        return undefined;
    }
    zoomIn() {
        if (this._previewState === 2 /* Active */) {
            void this.webviewEditor.webview.postMessage({ type: "zoomIn" });
        }
    }
    zoomOut() {
        if (this._previewState === 2 /* Active */) {
            void this.webviewEditor.webview.postMessage({ type: "zoomOut" });
        }
    }
    setZoomContext(bound, value) {
        switch (bound) {
            case "max":
                void vscode.commands.executeCommand("setContext", "svgPreviewMaxZoom", value);
                break;
            case "min":
                void vscode.commands.executeCommand("setContext", "svgPreviewMinZoom", value);
                break;
        }
    }
    async render() {
        if (this._previewState !== 0 /* Disposed */) {
            this.webviewEditor.webview.html = await this.getWebviewContents();
        }
    }
    update() {
        if (this._previewState === 0 /* Disposed */) {
            return;
        }
        if (this.webviewEditor.active) {
            this._previewState = 2 /* Active */;
            this.sizeStatusBarEntry.show(this.id, this._imageSize || "");
            this.binarySizeStatusBarEntry.show(this.id, this._imageBinarySize);
            this.zoomStatusBarEntry.show(this.id, this._imageZoom || "fit");
        }
        else {
            if (this._previewState === 2 /* Active */) {
                this.sizeStatusBarEntry.hide(this.id);
                this.binarySizeStatusBarEntry.hide(this.id);
                this.zoomStatusBarEntry.hide(this.id);
            }
            this._previewState = 1 /* Visible */;
        }
    }
    async getWebviewContents() {
        const version = Date.now().toString();
        const settings = {
            isMac: isMac(),
            src: await this.getResourcePath(this.webviewEditor, this.resource, version),
        };
        const nonce = getNonce();
        const cspSource = this.webviewEditor.webview.cspSource;
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">

	<!-- Disable pinch zooming -->
	<meta name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">

	<title>SVG Preview</title>

	<link rel="stylesheet" href="${escapeAttribute(this.extensionResource("/media/main.css"))}" type="text/css" media="screen" nonce="${nonce}">

	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${cspSource}; script-src 'nonce-${nonce}'; style-src ${cspSource} 'nonce-${nonce}';">
	<meta id="svg-preview-settings" data-settings="${escapeAttribute(JSON.stringify(settings))}">
</head>
<body class="container svg scale-to-fit loading">
	<div class="loading-indicator"></div>
	<div class="svg-load-error">
		<p>${localize("preview.svgLoadError", "An error occurred while loading the SVG.")}</p>
		<a href="#" class="open-file-link">${localize("preview.svgLoadErrorLink", "Open file using VS Code's standard text/binary editor?")}</a>
	</div>
	<script src="${escapeAttribute(this.extensionResource("/media/main.js"))}" nonce="${nonce}"></script>
</body>
</html>`;
    }
    async getResourcePath(webviewEditor, resource, version) {
        if (resource.scheme === "git") {
            const stat = await vscode.workspace.fs.stat(resource);
            if (stat.size === 0) {
                return this.emptySvgDataUri;
            }
        }
        // Avoid adding cache busting if there is already a query string
        if (resource.query) {
            return webviewEditor.webview.asWebviewUri(resource).toString();
        }
        return webviewEditor.webview.asWebviewUri(resource).with({ query: `version=${version}` }).toString();
    }
    extensionResource(path) {
        return this.webviewEditor.webview.asWebviewUri(this.extensionRoot.with({
            path: this.extensionRoot.path + path
        }));
    }
}
function isMessage(m) {
    return (typeof m === "object" &&
        typeof m.type === "string");
}
function isMac() {
    if (typeof process === "undefined") {
        return false;
    }
    return process.platform === "darwin";
}
function escapeAttribute(value) {
    return value.toString().replace(/"/g, "&quot;");
}
function getNonce() {
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 64; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
