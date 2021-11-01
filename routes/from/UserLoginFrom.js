const validator = require('validator');
const validate = require('../../util/validate')
class UserLoginFrom extends validate {
    //传入account 、password 、captcha

    //判断传入的账号是普通账号还是邮箱或是手机
    get account(){
        //获取账号
        const account = this.get("account")
        //判断数据格式是否正确
        
        if(!validator.isEmail(account) && !validator.isMobilePhone(account) && !validator.isLength(account,{min:6,max:14}))
        {
            throw new Error("账号格式有误")
        }else{
            return account
        }
        
    }
    //判断密码格式是否有误
    get password(){
        if(!validator.isLength(this.get("password"),{main:6,max:14})){
            throw new Error("密码错误")
        }else{
            return this.get("password")
        }
    }
    //获取验证码
    get setcaptcha(){
        return this.get("captchas")
    }
    //传入验证码
    set setcaptcha(val){
        this.set("captchas",val)
    }
    //对比验证码
    getcaptcha(){
        if(this.get("captcha") !== this.get("captchas")){
            throw new Error("验证码错误")
        }else{
            return true
        }
    }

    
}
module.exports = UserLoginFrom