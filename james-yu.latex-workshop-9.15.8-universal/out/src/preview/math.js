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
exports.math = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const workerpool = __importStar(require("workerpool"));
const lw_1 = require("../lw");
const utils = __importStar(require("../utils/svg"));
const theme_1 = require("../utils/theme");
const cursorrenderer_1 = require("./math/mathpreviewlib/cursorrenderer");
const textdocumentlike_1 = require("./math/mathpreviewlib/textdocumentlike");
const newcommandfinder_1 = require("./math/mathpreviewlib/newcommandfinder");
const texmathenvfinder_1 = require("./math/mathpreviewlib/texmathenvfinder");
const hoverpreviewonref_1 = require("./math/mathpreviewlib/hoverpreviewonref");
const mathpreviewutils_1 = require("./math/mathpreviewlib/mathpreviewutils");
const logger = lw_1.lw.log('Preview', 'Math');
exports.math = {
    getColor,
    onRef,
    onTeX,
    findRef,
    findTeX,
    findMath,
    generateSVG,
    renderSvgOnRef,
    renderCursor,
    typeset
};
const pool = workerpool.pool(path.join(__dirname, 'math', 'mathjax.js'), { minWorkers: 1, maxWorkers: 1, workerType: 'process' });
const proxy = pool.proxy();
lw_1.lw.onConfigChange('*', getColor);
lw_1.lw.onConfigChange('hover.preview.mathjax.extensions', initialize);
lw_1.lw.onDispose({ dispose: async () => { await pool.terminate(true); } });
void initialize();
async function initialize() {
    const extensions = vscode.workspace.getConfiguration('latex-workshop').get('hover.preview.mathjax.extensions', []);
    const extensionsToLoad = extensions.filter((ex) => lw_1.lw.constant.MATHJAX_EXT.includes(ex));
    void (await proxy).loadExtensions(extensionsToLoad);
}
let color = '#000000';
async function onTeX(document, tex, newCommand) {
    const configuration = vscode.workspace.getConfiguration('latex-workshop');
    const scale = configuration.get('hover.preview.scale');
    let s = await renderCursor(document, tex);
    s = mathpreviewutils_1.MathPreviewUtils.mathjaxify(s, tex.envname);
    const typesetArg = newCommand + mathpreviewutils_1.MathPreviewUtils.stripTeX(s, newCommand);
    const typesetOpts = { scale, color };
    try {
        const xml = await typeset(typesetArg, typesetOpts);
        const md = utils.svgToDataUrl(xml);
        return new vscode.Hover(new vscode.MarkdownString(mathpreviewutils_1.MathPreviewUtils.addDummyCodeBlock(`![equation](${md})`)), tex.range);
    }
    catch (e) {
        logger.logError(`Failed rendering MathJax ${typesetArg} .`, e);
        throw e;
    }
}
async function onRef(document, position, refData, token, ctoken) {
    const configuration = vscode.workspace.getConfiguration('latex-workshop');
    const line = refData.position.line;
    const link = vscode.Uri.parse('command:latex-workshop.synctexto').with({ query: JSON.stringify([line, refData.file]) });
    const mdLink = new vscode.MarkdownString(`[View on pdf](${link})`);
    mdLink.isTrusted = true;
    if (configuration.get('hover.ref.enabled')) {
        const tex = texmathenvfinder_1.TeXMathEnvFinder.findHoverOnRef(document, position, refData, token);
        if (tex) {
            const newCommands = await (0, newcommandfinder_1.findProjectNewCommand)(ctoken);
            return hoverpreviewonref_1.HoverPreviewOnRefProvider.provideHoverPreviewOnRef(tex, newCommands, refData, color);
        }
    }
    const md = '```latex\n' + refData.documentation + '\n```\n';
    const refRange = document.getWordRangeAtPosition(position, /\{.*?\}/);
    const refMessage = refNumberMessage(refData);
    if (refMessage !== undefined && configuration.get('hover.ref.number.enabled')) {
        return new vscode.Hover([md, refMessage, mdLink], refRange);
    }
    return new vscode.Hover([md, mdLink], refRange);
}
function refNumberMessage(refData) {
    if (refData.prevIndex) {
        const refNum = refData.prevIndex.refNumber;
        const refMessage = `numbered ${refNum} at last compilation`;
        return refMessage;
    }
    return;
}
async function generateSVG(tex, newCommandsArg) {
    const newCommands = newCommandsArg ?? await (0, newcommandfinder_1.findProjectNewCommand)();
    const configuration = vscode.workspace.getConfiguration('latex-workshop');
    const scale = configuration.get('hover.preview.scale');
    const s = mathpreviewutils_1.MathPreviewUtils.mathjaxify(tex.texString, tex.envname);
    const xml = await typeset(newCommands + mathpreviewutils_1.MathPreviewUtils.stripTeX(s, newCommands), { scale, color });
    return { svgDataUrl: utils.svgToDataUrl(xml), newCommands };
}
function getColor() {
    const lightness = (0, theme_1.getCurrentThemeLightness)();
    if (lightness === 'light') {
        color = '#000000';
    }
    else {
        color = '#ffffff';
    }
}
async function typeset(arg, opts) {
    return (await proxy).typeset(arg, opts).timeout(3000);
}
function renderCursor(document, texMath) {
    return (0, cursorrenderer_1.renderCursor)(document, texMath, color);
}
function findTeX(document, position) {
    return texmathenvfinder_1.TeXMathEnvFinder.findHoverOnTex(document, position);
}
function findRef(refData, token) {
    const document = textdocumentlike_1.TextDocumentLike.load(refData.file);
    const position = refData.position;
    return texmathenvfinder_1.TeXMathEnvFinder.findHoverOnRef(document, position, refData, token);
}
async function renderSvgOnRef(tex, refData, ctoken) {
    const newCommand = await (0, newcommandfinder_1.findProjectNewCommand)(ctoken);
    return hoverpreviewonref_1.HoverPreviewOnRefProvider.renderSvgOnRef(tex, newCommand, refData, color);
}
function findMath(document, position) {
    return texmathenvfinder_1.TeXMathEnvFinder.findMathEnvIncludingPosition(document, position);
}
//# sourceMappingURL=math.js.map