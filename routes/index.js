const express = require('express');
const router = express.Router();
const path = require('path')
//中间件
const svgcaptcha = require('svg-captcha');
const validator = require('validator')



//routes文件
const UserLoginFrom = require('./from/UserLoginFrom')
const UserSingup = require('./from/UserSingup')

//util文件
const link_mongo = require('../util/mongodb');//数据库名称user  数据集：admin
const md5_pas = require('../util/md5_pas');
const send_email = require('../util/Send_Email');
const nu_cap = require('../util/random_captcha')

const { ObjectId } = require('mongodb');      


/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('./login.html')
});
// 功能：登录(login)、注册(sinup)、发送验证码(sendcaptcha)、
//激活active(updateactive)、后台用户管理(admin)、找回密码(getpassword)

//发送验证码
router.get('/sendcaptcha', (req, res) => {
  const captcha = svgcaptcha.create({
    size: 4,//验证码位数
    noise: 1,//一条干扰线
    color: true,//字符将具有不同的颜色
    ignoreChars: '0o1i'//过滤字符
  });//创建验证码
  
  req.session.captcha = captcha.text.toLocaleLowerCase();//将转换为小写的文本写入session中

  console.log(req.session.captcha)
  res.type('svg');//类型一定要加
  res.status(200).send(captcha.data);//将状态码设置成200并发送
})
//------------登录
router.post('/login', async (req, res) => {
  //将读取到的body数据传递进userlogin组件中并实例传给UserLogin
  
  let query = {};//注意这里是let
  const UserLogin = new UserLoginFrom(req.body)//将数据导入userloginfrom中
  try {
    var { account, password } = UserLogin //因为作用域的原因 这里使用的是var声明符
    UserLogin.setcaptcha = req.session.captcha
    req.session.captcha = null
    UserLogin.getcaptcha()


    //验证账号类型
      //判断用户传入的是email还是account或phone 
      
      if (validator.isEmail(account)) {
        query.email = {
          email: account
        }
      }else{
        query = {
          account,
        
        }
      }
      if (validator.isMobilePhone(account)) {
        query = {
          phone: account
        }
      }
      

  } catch (err) {
    //检测错误并返回
    return res.json({
      success: false,
      msg: err.message
    })
  }
 
  
  //连接数据库
  const db = await link_mongo("user:admin");

  
  //查询与之匹配的数据

  const userss = await db.findOne(query);
  //如果没查到则返回错误
  if(!userss){
    return res.json({
      msg: "该用户未注册",
      success: false,
    })
  }
  //最后添加经过md5格式化的密码
  query.password = md5_pas(password)
 
  const result = await db.findOne(query);

  if (result) {
    //查询成功并将当前用户信息存入session
      req.session.userinfo = result;
      //判断 账户是否验证邮箱或是否被删除
      if (result.isActive && result.show) {
        return res.json({
          msg: "登录成功",
          success: true,
        })
      }else if (!result.show){
        return res.json({
          msg: "该账号已经被删除请联系管理员",
          success: false,
        })
      }else {
        return res.json({
          msg: "请立即实名验证邮箱",
          success: false,
        })
      }

  } else {
    //查询失败
    return res.json({
      msg: "密码错误",
      success: false,
    })
  }


})
//------------注册
router.post('/sinup', async (req, res) => {
  //实例UserLoginFrom

  const usersin = new UserSingup(req.body)
 

  try {
    //解构赋值 ：判断字符类型是否错误
    var { accounts, password, email} = usersin
    usersin.setcaptcha = req.session.captcha
    usersin.getcaptcha();
  } catch (err) {
    return res.json({
      success: false,
      msg: err.message
    })
  }

  //链接数据库
  const db = await link_mongo("user:admin");
  //查询当前注册账号是否存在
  const result = await db.findOne({
    account:accounts,
  })
  //查询当前注册邮箱是否存在
  const result_email = await db.findOne({
    email:email,
  })
  //result或email查询到了 就返回错误
  if (result || result_email) {
    return res.json({
      success: false,
      msg: "账号或邮箱已被注册 请您更换其他账号或邮箱"
    })
  }

  //添加
  
  const inserts = await db.insertOne({
    account:accounts,//账号
    email,//邮箱
    password: md5_pas(password),//加密的密码
    isActive: false,//是否激活邮箱
    show: true,//是否显示
    CreateTime: new Date(),//创建时间
    role:1,//当前用户权限
  })
  
     //添加成功 发送邮箱
  if (inserts.acknowledged) {
 
      send_email.send({
        from: '天使的翅膀<1036161883@qq.com>',
        to: email,
        text: "验证地址为：localhost:3100/updateActive/" + inserts.insertedId,//正文
        subject: "邮箱验证码",//标题
        // cc:,附件

      }, (err, message) => {
        console.log(err || message);
      })
      return res.json({
        msg: "注册成功，请及时查看验证邮箱文件哟.",
        success: true
      })
  } else {
      //添加失败 返回
      return res.json({
        msg: "注册失败",
        success: false
      })
  }



})
//------------激活Active
router.get('/updateActive/:id',async (req,res)=>{
  const { id } = req.params;//动态参数
  //连接并查询
  const db = await link_mongo("user:admin")

  const result = await db.findOne({
    "_id" : ObjectId(id)
  })
  //如果没有查询到当前用户信息 就代表该用户没有注册
  if(!result){
    return res.json({
    msg:"该用户未注册",
    success:false
  })}
  //修改isActive
    const updateOne = await db.updateOne({
      "_id" : ObjectId(id)
    },
    {
      $set:{
        isActive:true
      }
    })
    //修改成功返回成功，负责则为失败
    if(updateOne.acknowledged){
      return res.json({
        msg:"验证成功",
        success:true,
      })
    }else{
      return res.json({
        msg:"验证失败",
        success:false
    })}
    
  
  
})
//------------过滤(没有登录则不允许进入)
router.get('/admin.html',async(req,res,next)=>{
  if(!req.session.userinfo){
    res.redirect("/login.html")
    
  }
  next();

})
//------------过滤(admin子页面也需要登录)
router.get('/admin/:id',async(req,res,next)=>{
 
  
  if(!req.session.userinfo){
    res.redirect("/login.html")
    
  }
  next()
  
})
//------------找回密码
    //-----查找邮箱是否存在
    router.get('/getpassword',async(req,res)=>{
      //客户端使用get方式访问 通过query获取数据
      const { email } = req.query;
      //如果email没有或格式不对则返回错误
      if(!email || !validator.isEmail(email)){
        return res.json({
          msg:"email格式有误，请确认格式",
          success:false,
        })
      }
      //连接数据库并查找有没有这个邮箱
      const result = await (await link_mongo("user:admin")).findOne({email})
      //result为空返回错误
      if(!result){
        return res.json({
          msg:"发送失败,该邮箱未注册",
          success:false
        })
      } 
      //生成一个验证码，并将验证码放进session中
      const get_paswd = nu_cap(6);
      req.session.get_paswd = get_paswd;
      //发送邮箱
      send_email.send({

        from: '天使的翅膀<1036161883@qq.com>',
        to: email,
        text: '验证码为：' + get_paswd,//正文
        subject: "找回密码",//标题
        // cc:,附件

      }, (err, message) => {
        console.log(err || message);
      })

      return res.json({
        msg:"发送成功请注意查收,有效时间：五分钟",
        success:true,
      })
      
    })
    //-----验证 验证码
    router.post('/sendpassword', async(req,res)=>{

       const {email,textcaptcha} = req.body
      //判断email,textcaptcha的格式
      //判断session的验证码是否与客户端传递的验证码是否一致
       if(!validator.isLength(textcaptcha,{min:6,max:6})|| textcaptcha !== req.session.get_paswd){
         return res.json({
            msg:"验证码错误.",
            success:false
         })
       }
       if(!validator.isEmail(email) ){
        return res.json({
           msg:"邮箱错误",
           success:false
        })
      }
      //连接数据库并查询账号
      const db =await (await link_mongo("user:admin")).findOne({email});
      
      if(db){
        //清空session中存贮的验证码
        req.session.get_paswd = null
        //将当前email存进session中
        req.session.db_email = email
        //设置锁机制
        req.session._ids = true

        return res.json({
          msg:"验证码正确",
          success:true,
        })
      }

    })
    //------过滤(没带钥匙不让进)
    router.get('/username/repassword.html',(req,res,next)=>{
      if(!req.session._ids){
        return res.json({
          msg:"您没有权限访问",
          success:false
        })
       }
       next()
    })
    //------修改密码(带了钥匙访问接口)
    router.post('/updatepassword',async(req,res)=>{
      //判断是否带了钥匙
      if(!req.session._ids){
        return res.json({
          msg:"您没有权限访问",
          success:false
        })
       }
       //判断格式
       const { password } = req.body;
       if(!validator.isLength(password,{min:6,max:15})){
          return res.json({
            msg:"格式有误",
            success:false,
          })
       }
       //查询并修改密码
       const db = await (await link_mongo('user:admin')).updateOne({
         email:req.session.db_email
       },{
         $set:{
           password
         }
       })
       //成功 清空锁

       //失败 返回提示信息
       if(db.acknowledged){
        req.session._ids = false
         return res.json({
           msg:"修改成功",
           success:true
         })
       }else{
        return res.json({
          msg:"修改失败",
          success:false
        })
       }
       
    })


//后台管理页面
module.exports = router;
