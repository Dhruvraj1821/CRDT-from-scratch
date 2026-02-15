type Id = [agent: string, seq: number]

type Item = {
    content: string , // 1 character only
    id: Id,
    originLeft: Id | null,
    originRight: Id | null,
    deleted: boolean,
}

type Doc = {
    content: Item[],
}

function createDoc(): Doc {
    return {
        content: [],
    }
}

function getContent(doc: Doc): string {
    //doc.content.filter(item => !item.deleted)
    //.map(item => item.content)
    //.join('')
    let content = ''
    for(const item of doc.content){
        if(!item.deleted){
            content += item.content
        }
    }
    return content
}

function localInsert(doc: Doc, agent: string, seq: number, pos: number, text: string){
    integrate(doc,{
        content:text,
        id:[agent, seq],
        deleted:false,
        originLeft: doc.content[pos - 1]?.id || null,
        originRight: doc.content[pos]?.id || null,
    })
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
    // add newItem into doc at the right localtion
    let left = findItemIdxAtId(doc, newItem.originLeft) ?? -1
    let destIdx = left + 1
    let right = newItem.originRight ==null ? doc.content.length : findItemIdxAtId(doc, newItem.originRight)
    let scanning = false

    for(let i = destIdx; ;i++){
        if(!scanning){
            if(i===doc.content.length) break
            if(i===right) break
            let other = doc.content[i]

            let oleft = findItemIdxAtId(doc, other.originLeft) ?? -1
            let oright = other?.originRight == null ? doc.content.length : findItemIdxAtId(doc, other.originRight)

            if(oleft < left || (oleft ===left && oright ===right && newItem.id[0]<other.id[0]))break
            if(oleft === left )scanning = oright <right
            
            doc.content.splice(destIdx, 0, newItem)
            
        }
    }
}



const doc = createDoc()
localInsert(doc,'seph',0,0,'a')
console.log('Doc has content : ', getContent(doc))
