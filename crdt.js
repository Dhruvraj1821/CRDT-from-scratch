"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createDoc() {
    return {
        content: [],
    };
}
function getContent(doc) {
    //doc.content.filter(item => !item.deleted)
    //.map(item => item.content)
    //.join('')
    let content = '';
    for (const item of doc.content) {
        if (!item.deleted) {
            content += item.content;
        }
    }
    return content;
}
const doc = createDoc();
console.log('Doc has content : ', getContent(doc));
//# sourceMappingURL=crdt.js.map