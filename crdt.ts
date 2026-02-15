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

function integrate(doc: Doc, newItem: Item) {
    
}



const doc = createDoc()
console.log('Doc has content : ', getContent(doc))
