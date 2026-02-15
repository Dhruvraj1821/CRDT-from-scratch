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
        const seq = (doc.version[agent] ?? -1) + 1;
        localInsertOne(doc, agent, pos, c);
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
    // add newItem into doc at the right location with deterministic order
    const [agent, seq] = newItem.id;
    const lastSeen = doc.version[agent] ?? -1;
    if (seq != lastSeen + 1)
        throw Error('Operation out of order');
    doc.version[agent] = seq;
    let left = findItemIdxAtId(doc, newItem.originLeft) ?? -1;
    let right = newItem.originRight == null ? doc.content.length : findItemIdxAtId(doc, newItem.originRight);
    // Scan forward from left+1 to right, looking for the correct deterministic position
    let destIdx = left + 1;
    while (destIdx < right) {
        const other = doc.content[destIdx];
        const oleft = findItemIdxAtId(doc, other.originLeft) ?? -1;
        const oright = other.originRight == null ? doc.content.length : findItemIdxAtId(doc, other.originRight);
        if (oleft > left ||
            (oleft === left && (oright > right ||
                (oright === right && newItem.id[0] < other.id[0])))) {
            break;
        }
        destIdx++;
    }
    doc.content.splice(destIdx, 0, newItem);
}
function isInVersion(id, version) {
    if (id == null)
        return true;
    const [agent, seq] = id;
    const highestSeq = version[agent];
    if (highestSeq == null)
        return false;
    else
        return highestSeq >= seq;
}
function canInsertNow(item, doc) {
    const [agent, seq] = item.id;
    return !isInVersion(item.id, doc.version) && (seq === 0 || isInVersion([agent, seq - 1], doc.version)) && isInVersion(item.originLeft, doc.version) && isInVersion(item.originRight, doc.version);
}
function mergeInto(dest, src) {
    const missing = src.content.filter(op => !isInVersion(op.id, dest.version));
    let remaining = missing.length;
    while (remaining > 0) {
        let mergedOnThisPass = 0;
        for (let i = 0; i < missing.length; i++) {
            const item = missing[i];
            if (item == null)
                continue;
            if (!canInsertNow(item, dest))
                continue;
            //inser item into dest
            remoteInsert(dest, item);
            missing[i] = null;
            remaining--;
            mergedOnThisPass++;
        }
        if (mergedOnThisPass === 0)
            throw Error('Not Making Progress');
    }
}
const doc1 = createDoc();
const doc2 = createDoc();
localInsert(doc1, 'a', 0, 'A');
localInsert(doc2, 'b', 0, 'B');
mergeInto(doc1, doc2);
mergeInto(doc2, doc1);
console.log(getContent(doc1));
console.log(getContent(doc2));
export {};
//# sourceMappingURL=crdt.js.map