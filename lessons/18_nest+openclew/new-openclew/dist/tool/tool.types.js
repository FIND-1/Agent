"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toToolMessageContent = toToolMessageContent;
exports.invokeAppTool = invokeAppTool;
function toToolMessageContent(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (value == null) {
        return '';
    }
    return JSON.stringify(value);
}
async function invokeAppTool(tool, args) {
    const result = (await tool.invoke(args));
    return toToolMessageContent(result);
}
//# sourceMappingURL=tool.types.js.map