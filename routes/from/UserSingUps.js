const validator = require('validator')
const UserLoginFrom = require('./UserLoginFrom')
class UserSingups extends UserLoginFrom{
    /*传入 account  passowrd email captcha 
        phone 才可以找回
      数据库  createTime show isActive role
    */
    get accounts(){
        
       if(this.get("account")){
           
        if(!validator.isLength(this.get("account"),{min:5,max:15})){
            console.log(this.get("account"))
            throw Error("账号格式有误")
        }
       
        return this.get("account")
       }
    }
   
    get email(){
       if(this.get("email")){
        if(!validator.isEmail(this.get("email"))){
            throw Error("邮箱有误")
        }
        return this.get("email")
       }
    }
    get phone(){
       if(this.get("phone")){
        if(!validator.isMobilePhone(this.get("phone"))){
            throw new Error("手机格式有误")
        }
        return this.get("phone")
       }
    }
}

module.exports = UserSingups