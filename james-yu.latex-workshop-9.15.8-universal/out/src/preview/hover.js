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
exports.provider = void 0;
const vscode = __importStar(require("vscode"));
const lw_1 = require("../lw");
const tokenizer_1 = require("../utils/tokenizer");
const newcommandfinder_1 = require("../preview/math/mathpreviewlib/newcommandfinder");
class HoverProvider {
    async provideHover(document, position, ctoken) {
        lw_1.lw.preview.math.getColor();
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        const hov = configuration.get('hover.preview.enabled');
        const hovReference = configuration.get('hover.ref.enabled');
        const hovCitation = configuration.get('hover.citation.enabled');
        const hovCommand = configuration.get('hover.command.enabled');
        if (hov) {
            const tex = lw_1.lw.preview.math.findTeX(document, position);
            if (tex) {
                const newCommands = await (0, newcommandfinder_1.findProjectNewCommand)(ctoken);
                const hover = await lw_1.lw.preview.math.onTeX(document, tex, newCommands);
                return hover;
            }
            const graphicsHover = await lw_1.lw.preview.hover(document, position);
            if (graphicsHover) {
                return graphicsHover;
            }
        }
        const token = (0, tokenizer_1.tokenizer)(document, position);
        if (!token) {
            return;
        }
        // Test if we are on a command
        if (token.startsWith('\\')) {
            if (!hovCommand) {
                return;
            }
            return this.provideHoverOnCommand(token);
        }
        if ((0, tokenizer_1.onAPackage)(document, position, token)) {
            const packageName = encodeURIComponent(JSON.stringify(token));
            const md = `Package **${token}** \n\n`;
            const mdLink = new vscode.MarkdownString(`[View documentation](command:latex-workshop.texdoc?${packageName})`);
            mdLink.isTrusted = true;
            const ctanUrl = `https://ctan.org/pkg/${token}`;
            const ctanLink = new vscode.MarkdownString(`[${ctanUrl}](${ctanUrl})`);
            return new vscode.Hover([md, mdLink, ctanLink]);
        }
        const refData = lw_1.lw.completer.reference.getRef(token);
        if (hovReference && refData) {
            const hover = await lw_1.lw.preview.math.onRef(document, position, refData, token, ctoken);
            return hover;
        }
        const cite = lw_1.lw.completer.citation.getEntryWithDocumentation(token, document.uri);
        if (hovCitation && cite) {
            const range = document.getWordRangeAtPosition(position, /\{.*?\}/);
            const md = cite.documentation || cite.detail;
            if (md) {
                return new vscode.Hover(md, range);
            }
        }
        return;
    }
    provideHoverOnCommand(token) {
        const signatures = [];
        const packageNames = [];
        const tokenWithoutSlash = token.substring(1);
        const packageCmds = [];
        const configuration = vscode.workspace.getConfiguration('latex-workshop');
        if ((configuration.get('intellisense.package.enabled'))) {
            const packages = lw_1.lw.completer.package.getPackagesIncluded('latex-expl3');
            Object.entries(packages).forEach(([packageName, options]) => {
                lw_1.lw.completer.command.provideCmdInPkg(packageName, options, packageCmds);
                lw_1.lw.completer.environment.provideEnvsAsCommandInPkg(packageName, options, packageCmds);
            });
        }
        const checkCmd = (cmd) => {
            const cmdName = cmd.name();
            if (cmdName.startsWith(tokenWithoutSlash) && (cmdName.length === tokenWithoutSlash.length)) {
                if (typeof cmd.documentation !== 'string') {
                    return;
                }
                const doc = cmd.documentation;
                const packageName = cmd.package;
                if (packageName && packageName !== 'user-defined' && (!packageNames.includes(packageName))) {
                    packageNames.push(packageName);
                }
                signatures.push(doc);
            }
        };
        packageCmds.forEach(checkCmd);
        lw_1.lw.cache.getIncludedTeX().forEach(cachedFile => {
            lw_1.lw.cache.get(cachedFile)?.elements.command?.forEach(checkCmd);
        });
        let pkgLink = '';
        if (packageNames.length > 0) {
            pkgLink = '\n\nView documentation for package(s) ';
            packageNames.forEach(p => {
                const packageName = encodeURIComponent(JSON.stringify(p));
                pkgLink += `[${p}](command:latex-workshop.texdoc?${packageName}),`;
            });
            pkgLink = pkgLink.substring(0, pkgLink.lastIndexOf(',')) + '.';
        }
        if (signatures.length > 0) {
            const mdLink = new vscode.MarkdownString(signatures.join('  \n')); // We need two spaces to ensure md newline
            mdLink.appendMarkdown(pkgLink);
            mdLink.isTrusted = true;
            return new vscode.Hover(mdLink);
        }
        return;
    }
}
const provider = new HoverProvider();
exports.provider = provider;
//# sourceMappingURL=hover.js.map