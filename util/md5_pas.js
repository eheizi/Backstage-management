const crypto = require("crypto")

module.exports = (key)=>{
    
    return crypto.createHmac("md5",key).update("str").digest("base64")
}