type Id = [agent: string, seq: number]

type Item = {
    content: string , // 1 character only
    id: Id,
    originLeft: Id | null,
    originRight: Id | null,
    isDeleted: boolean,
} 

type Version = Record<string, number>

type Doc = {
    content: Item[],
    version: Version,
}

function createDoc(): Doc {
    return {
        content: [],
        version: {}
    }
}

function getContent(doc: Doc): string {
    //doc.content.filter(item => !item.deleted)
    //.map(item => item.content)
    //.join('')
    let content = ''
    for(const item of doc.content){
    if(!item.isDeleted){
            content += item.content
        }
    }
    return content
}

const findItemAtPos = (doc: Doc, pos: number, stick_end: boolean = false): number => {
    let i = 0
    for(; i <doc.content.length; i++){
        const item = doc.content[i]
        if(stick_end && pos ===0) return i
        else if(item?.isDeleted) continue
        else if(pos === 0) return i
        pos--
    }
    if(pos === 0) return i
    else throw Error('Position out of bounds')
}

function localInsertOne(doc: Doc, agent: string, pos: number, text: string){

    const idx = findItemAtPos(doc, pos, true) 
    const seq = (doc.version[agent] ?? -1) + 1
    integrate(doc,{
        content:text,
        id:[agent, seq],
        isDeleted:false,
        originLeft: doc.content[idx - 1]?.id || null,
        originRight: doc.content[idx]?.id || null,
    })
}

function localInsert(doc: Doc, agent: string, pos: number, text: string){
    const content = [...text]
    for(const c of content){
        const seq = (doc.version[agent] ?? -1) + 1
        localInsertOne(doc, agent, pos, c)
        pos++
    }
} 

function remoteInsert(doc: Doc, item:Item){
    integrate(doc, item)
}



function localDelete(doc: Doc,pos: number, delLen: number){
    while(delLen > 0){
        const idx = findItemAtPos(doc, pos, false)
        doc.content[idx].isDeleted = true
        delLen--

    }
}

const idEq = (a: Id | null, b: Id | null): boolean => {
    if(a === null && b === null) return true
    if(a === null || b === null) return false
    return a[0] === b[0] && a[1] === b[1]
}

function findItemIdxAtId(doc: Doc, id: Id | null): number | null{
    if(id === null) return null

    for (let i=0 ; i < doc.content.length; i++){
        if(idEq(doc.content[i].id, id)) return i
    }

    throw Error("cannot find item with id: " + id)
}

function integrate(doc: Doc, newItem: Item) {
    // add newItem into doc at the right location with deterministic order
    const [agent, seq] = newItem.id;
    const lastSeen = doc.version[agent] ?? -1;
    if (seq != lastSeen + 1) throw Error('Operation out of order');
    doc.version[agent] = seq;

    let left = findItemIdxAtId(doc, newItem.originLeft) ?? -1;
    let right = newItem.originRight == null ? doc.content.length : findItemIdxAtId(doc, newItem.originRight);

    // Scan forward from left+1 to right, looking for the correct deterministic position
    let destIdx = left + 1;
    while (destIdx < right) {
        const other = doc.content[destIdx];
        const oleft = findItemIdxAtId(doc, other.originLeft) ?? -1;
        const oright = other.originRight == null ? doc.content.length : findItemIdxAtId(doc, other.originRight);

        if (
            oleft > left ||
            (oleft === left && (oright > right ||
                (oright === right && newItem.id[0] < other.id[0])))
        ) {
            break;
        }
        destIdx++;
    }
    doc.content.splice(destIdx, 0, newItem);
}

function isInVersion(id: Id | null, version: Version):boolean {
    if(id == null) return true
    const [agent, seq] = id
    const highestSeq = version[agent]
    if(highestSeq == null)return false
    else return highestSeq >= seq
}

function canInsertNow(item: Item, doc: Doc): boolean {
    const [agent, seq] = item.id
    return !isInVersion(item.id, doc.version) && (seq===0 || isInVersion([agent, seq-1], doc.version)) && isInVersion(item.originLeft, doc.version) && isInVersion(item.originRight, doc.version)
}


function mergeInto(dest: Doc, src: Doc){
    const missing: (Item | null)[] = src.content.filter(op => !isInVersion(op.id, dest.version))
    let remaining = missing.length
    while(remaining > 0){
        let mergedOnThisPass = 0
        for (let i=0 ; i<missing.length; i++){
            const item = missing[i]
            if(item == null) continue
            if(!canInsertNow(item, dest))continue

            //inser item into dest
            remoteInsert(dest, item)
            missing[i] = null
            remaining--
            mergedOnThisPass++
        }

        if(mergedOnThisPass === 0) throw Error('Not Making Progress')
    }

    let srcIdx = 0, destIdx = 0
    while(srcIdx < src.content.length){
        const srcItem = src.content[srcIdx]
        let destItem = src.content[destIdx]
        while(!idEq(srcItem.id , destItem.id)){
            destIdx++
            destItem = dest.content[destIdx]
        }
        if(srcItem?.isDeleted){
            destItem.isDeleted = true
        }

        srcIdx++
        destIdx++
    }
}



const doc1 = createDoc()
const doc2 = createDoc()

localInsert(doc1, 'a', 0, 'A')
localInsert(doc2, 'b', 0, 'B')

mergeInto(doc1, doc2)
mergeInto(doc2, doc1)

console.log(getContent(doc1))

console.log(getContent(doc2))
