"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeXElementType = void 0;
var TeXElementType;
(function (TeXElementType) {
    TeXElementType[TeXElementType["Environment"] = 0] = "Environment";
    TeXElementType[TeXElementType["Command"] = 1] = "Command";
    TeXElementType[TeXElementType["Section"] = 2] = "Section";
    TeXElementType[TeXElementType["SectionAst"] = 3] = "SectionAst";
    TeXElementType[TeXElementType["SubFile"] = 4] = "SubFile";
    TeXElementType[TeXElementType["BibItem"] = 5] = "BibItem";
    TeXElementType[TeXElementType["BibField"] = 6] = "BibField";
})(TeXElementType || (exports.TeXElementType = TeXElementType = {}));
//# sourceMappingURL=types.js.map