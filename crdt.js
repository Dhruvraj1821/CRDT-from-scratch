"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createDoc() {
    return {
        content: [],
        version: {}
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
function localInsertOne(doc, agent, pos, text) {
    const seq = (doc.version[agent] ?? -1) + 1;
    integrate(doc, {
        content: text,
        id: [agent, seq],
        deleted: false,
        originLeft: doc.content[pos - 1]?.id || null,
        originRight: doc.content[pos]?.id || null,
    });
}
function localInsert(doc, agent, pos, text) {
    const content = [...text];
    for (const c of content) {
        localInsertOne(doc, agent, seq, pos, c);
        pos++;
    }
}
function remoteInsert(doc, item) {
    integrate(doc, item);
}
const idEq = (a, b) => {
    if (a === null && b === null)
        return true;
    if (a === null || b === null)
        return false;
    return a[0] === b[0] && a[1] === b[1];
};
function findItemIdxAtId(doc, id) {
    if (id === null)
        return null;
    for (let i = 0; i < doc.content.length; i++) {
        if (idEq(doc.content[i].id, id))
            return i;
    }
    throw Error("cannot find item with id: " + id);
}
function integrate(doc, newItem) {
    // add newItem into doc at the right localtion
    const [agent, seq] = newItem.id;
    const lastSeen = doc.version[agent] ?? -1;
    if (seq != lastSeen + 1)
        throw Error('Operation out of order');
    doc.version[agent] = seq;
    let left = findItemIdxAtId(doc, newItem.originLeft) ?? -1;
    let destIdx = left + 1;
    let right = newItem.originRight == null ? doc.content.length : findItemIdxAtId(doc, newItem.originRight);
    let scanning = false;
    for (let i = destIdx;; i++) {
        if (!scanning) {
            if (i === doc.content.length)
                break;
            if (i === right)
                break;
            let other = doc.content[i];
            let oleft = findItemIdxAtId(doc, other.originLeft) ?? -1;
            let oright = other?.originRight == null ? doc.content.length : findItemIdxAtId(doc, other.originRight);
            if (oleft < left || (oleft === left && oright === right && newItem.id[0] < other.id[0]))
                break;
            if (oleft === left)
                scanning = oright < right;
        }
    }
    doc.content.splice(destIdx, 0, newItem);
}
const doc = createDoc();
localInsertOne(doc, 'seph', 0, 'a');
localInsertOne(doc, 'seph', 1, 'b');
localInsertOne(doc, 'seph', 0, 'c');
console.log('Doc has content : ', getContent(doc));
console.table(doc.content);
//# sourceMappingURL=crdt.js.map