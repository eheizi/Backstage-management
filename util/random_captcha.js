function random_captcha(num){
    let str = ``;
    for (let i = 0; i < num; i++) {
        str += Math.floor(Math.random()*10)
    }
    return str
}
module.exports = random_captcha