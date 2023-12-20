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
exports.watcher = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const lw_1 = require("../lw");
const logger = lw_1.lw.log('Cacher', 'Watcher');
class Watcher {
    /**
     * Creates a new Watcher instance.
     *
     * @param {'.*' | '.bib' | '.pdf'} [fileExt='.*'] - The file extension to watch.
     */
    constructor(fileExt = '.*') {
        this.fileExt = fileExt;
        /**
         * Map of folder paths to watcher information. Each folder has its own
         * watcher to save resources.
         */
        this.watchers = {};
        /**
         * Set of handlers to be called when a file is created.
         */
        this.onCreateHandlers = new Set();
        /**
         * Set of handlers to be called when a file is changed.
         */
        this.onChangeHandlers = new Set();
        /**
         * Set of handlers to be called when a file is deleted.
         */
        this.onDeleteHandlers = new Set();
        /**
         * Map of file paths to polling information. This may be of particular use
         * when large binary files are progressively write to disk, and multiple
         * 'change' events are therefore emitted in a short period of time.
         */
        this.polling = {};
    }
    /**
     * Adds a handler for file creation events.
     *
     * @param {(filePath: string) => void} handler - The handler function.
     */
    onCreate(handler) {
        this.onCreateHandlers.add(handler);
    }
    /**
     * Adds a handler for file change events.
     *
     * @param {(filePath: string) => void} handler - The handler function.
     */
    onChange(handler) {
        this.onChangeHandlers.add(handler);
    }
    /**
     * Adds a handler for file deletion events.
     *
     * @param {(filePath: string) => void} handler - The handler function.
     */
    onDelete(handler) {
        this.onDeleteHandlers.add(handler);
    }
    /**
     * Creates a new file system watcher based on the provided glob pattern.
     *
     * @param {vscode.GlobPattern} globPattern - The glob pattern for the
     * watcher.
     * @returns {vscode.FileSystemWatcher} - The created file system watcher.
     */
    createWatcher(globPattern) {
        const watcher = vscode.workspace.createFileSystemWatcher(globPattern);
        watcher.onDidCreate((uri) => this.onDidChange('create', uri));
        watcher.onDidChange((uri) => this.onDidChange('change', uri));
        watcher.onDidDelete((uri) => this.onDidDelete(uri));
        return watcher;
    }
    /**
     * Handles file change events.
     *
     * @param {'create' | 'change'} event - The type of event.
     * @param {vscode.Uri} uri - The URI of the changed file.
     */
    onDidChange(event, uri) {
        const folder = path.dirname(uri.fsPath);
        const fileName = path.basename(uri.fsPath);
        const watcherInfo = this.watchers[folder];
        if (!watcherInfo?.files.has(fileName)) {
            return;
        }
        if (!lw_1.lw.file.hasBinaryExt(path.extname(uri.fsPath))) {
            this.handleNonBinaryFileChange(event, uri);
        }
        else if (!this.polling[uri.fsPath]) {
            this.initiatePolling(uri);
        }
    }
    /**
     * Handles non-binary file (e.g., TeX and Bib) change events.
     *
     * @param {'create' | 'change'} event - The type of event.
     * @param {vscode.Uri} uri - The URI of the changed file.
     */
    handleNonBinaryFileChange(event, uri) {
        const filePath = uri.fsPath;
        logger.log(`"${event}" emitted on ${filePath}.`);
        this.onChangeHandlers.forEach(handler => handler(filePath));
        lw_1.lw.event.fire(lw_1.lw.event.FileChanged, filePath);
    }
    /**
     * Initiates polling for a binary file.
     *
     * This function is triggered when a non-binary file is changed, and polling
     * is required to accurately detect the change. It sets up an interval to
     * periodically check for changes in the file's size. When a change is
     * detected, the `handlePolling` function is called to further validate the
     * change and trigger the appropriate handlers.
     *
     * @param {vscode.Uri} uri - The URI of the changed file.
     */
    initiatePolling(uri) {
        const filePath = uri.fsPath;
        const firstChangeTime = Date.now();
        const size = fs.statSync(filePath).size;
        this.polling[filePath] = { size, time: firstChangeTime };
        const pollingInterval = setInterval(() => {
            this.handlePolling(filePath, size, firstChangeTime, pollingInterval);
        }, vscode.workspace.getConfiguration('latex-workshop').get('latex.watch.pdf.delay'));
    }
    /**
     * Handles polling.
     *
     * This function is responsible for polling a file to accurately detect
     * changes when the file is non-binary and other events have initiated
     * polling. It compares the current size of the file with the recorded size
     * during the initiation of polling. If the size remains unchanged for a
     * specified time (200 milliseconds), it is considered a valid change, and
     * the appropriate handlers are triggered.
     *
     * @param {string} filePath - The path of the changed file.
     * @param {number} size - The size of the file.
     * @param {number} firstChangeTime - The timestamp of the first change.
     * @param {NodeJS.Timeout} interval - The polling interval.
     */
    handlePolling(filePath, size, firstChangeTime, interval) {
        if (!fs.existsSync(filePath)) {
            clearInterval(interval);
            delete this.polling[filePath];
            return;
        }
        const currentSize = fs.statSync(filePath).size;
        if (currentSize !== size) {
            this.polling[filePath].size = currentSize;
            this.polling[filePath].time = Date.now();
            return;
        }
        if (Date.now() - this.polling[filePath].time >= 200) {
            logger.log(`"change" emitted on ${filePath} after polling for ${Date.now() - firstChangeTime} ms.`);
            clearInterval(interval);
            delete this.polling[filePath];
            this.onChangeHandlers.forEach(handler => handler(filePath));
            lw_1.lw.event.fire(lw_1.lw.event.FileChanged, filePath);
        }
    }
    /**
     * Handles file deletion events.
     *
     * @param {vscode.Uri} uri - The URI of the deleted file.
     */
    onDidDelete(uri) {
        const folder = path.dirname(uri.fsPath);
        const fileName = path.basename(uri.fsPath);
        const watcherInfo = this.watchers[folder];
        if (!watcherInfo?.files.has(fileName)) {
            return;
        }
        const filePath = uri.fsPath;
        logger.log(`"delete" emitted on ${filePath}.`);
        this.onDeleteHandlers.forEach(handler => handler(filePath));
        watcherInfo.files.delete(fileName);
        if (watcherInfo.files.size === 0) {
            this.disposeWatcher(folder);
        }
        lw_1.lw.event.fire(lw_1.lw.event.FileRemoved, filePath);
    }
    /**
     * Disposes of a watcher for a specific folder.
     *
     * @param {string} folder - The path of the folder.
     */
    disposeWatcher(folder) {
        const watcherInfo = this.watchers[folder];
        watcherInfo.watcher.dispose();
        delete this.watchers[folder];
        logger.log(`Unwatched folder ${folder}.`);
    }
    /**
     * Adds a file to be watched.
     *
     * This function is responsible for adding a file to the list of watched
     * files. It checks whether a watcher for the file's folder already exists.
     * If not, a new watcher is created for the folder, and the file is added to
     * the set of files being watched. If a watcher already exists, the file is
     * simply added to the set of files being watched by the existing watcher.
     *
     * @param {string} filePath - The path of the file to watch.
     */
    add(filePath) {
        const fileName = path.basename(filePath);
        const folder = path.dirname(filePath);
        if (!this.watchers[folder]) {
            this.watchers[folder] = {
                watcher: this.createWatcher(new vscode.RelativePattern(folder, `*${this.fileExt}`)),
                files: new Set([fileName])
            };
            this.onCreateHandlers.forEach(handler => handler(filePath));
            logger.log(`Watched ${filePath} with a new watcher on ${folder} .`);
        }
        else {
            this.watchers[folder].files.add(fileName);
            this.onCreateHandlers.forEach(handler => handler(filePath));
            logger.log(`Watched ${filePath} .`);
        }
        lw_1.lw.event.fire(lw_1.lw.event.FileWatched, filePath);
    }
    /**
     * Removes a file from being watched.
     *
     * @param {string} filePath - The path of the file to stop watching.
     */
    remove(filePath) {
        this.watchers[path.basename(filePath)]?.files.delete(path.basename(filePath));
    }
    /**
     * Checks if a file is currently being watched.
     *
     * @param {string} filePath - The path of the file to check.
     * @returns {boolean} - Indicates whether the file is being watched.
     */
    has(filePath) {
        return this.watchers[path.dirname(filePath)]?.files.has(path.basename(filePath));
    }
    /**
     * Resets all watchers.
     */
    reset() {
        Object.entries(this.watchers).forEach(([folder, watcher]) => {
            watcher.watcher.dispose();
            delete this.watchers[folder];
        });
        logger.log('Reset.');
    }
}
exports.watcher = {
    src: new Watcher(),
    pdf: new Watcher('.pdf'),
    bib: new Watcher('.bib')
};
//# sourceMappingURL=watcher.js.map