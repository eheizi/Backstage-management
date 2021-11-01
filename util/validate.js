class validate {
    constructor(data) {
        this._data = data
    }
    //获取值
    get(key) {
        return this._data[key] || ""
    }
    //设置值
    set(key, val) {
        this._data[key] = val
    }
    //返回布尔值
    has(key) {
        return Boolean(this._data[key])
    }
}
module.exports = validate