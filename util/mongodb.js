const {MongoClient} = require('mongodb')

const url = "mongodb://localhost:27017/runoob";

let Clien = null;
async function link_mongo(dbName){
    const [db,name] = dbName.split(":")
    if (!Clien) {
        Clien = await MongoClient.connect(url)
        
    }
    return Clien.db(db).collection(name)
}
module.exports = link_mongo;
