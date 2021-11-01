const express = require('express');
const router = express.Router();
const path = require('path')


//中间件

const multer = require("multer")// + multer
//routes文件
const UserSingup = require('./from/UserSingup')
const UserSingups = require('./from/UserSingups')

//util文件
const link_mongo = require('../util/mongodb');//数据库名称user  数据集：admin
const md5_pas = require('../util/md5_pas');
const send_email = require('../util/Send_Email');

const { ObjectId } = require('mongodb');


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

const storage = multer.diskStorage({
  //过滤功能没写
  destination: function (req, file, cb) {//是用来确定上传的文件应该存储在哪个文件夹中
    cb(null, path.join(__dirname, '../public/images'))
  },
  filename: function (req, file, cb) {//用来确定上传文件的名称
    cb(null, file.fieldname + '-' + Date.now() + path.parse(file.originalname).ext)
  },

})
const uploader = multer({
  storage: storage
  //如果不设置保存目录会生成一个buffer字段
  //multer使用流的方式 边接收 边写入磁盘
  // dest: path.join(__dirname,'../public/images')//指定文件的上传目录
})

//接口 返回个人信息、修改个人信息、退出后台、上传头像
//用户管理接口 修改用户信息、增加一个用户信息、删除用户信息、查询用户信息
router.get('/', (req, res) => {
  res.end("niha")
})
//返回总体用户数据
router.get('/user', async (req, res) => {

  let { skips = 1, limit = 2, sort = 1, startTime, endTime, query } = req.query
  //客户端通过get方式传递的参数一定是string类型的，所以一定要强制转换类型
  skips = Number(skips)
  limit = Number(limit)
  /*
  id | number | 用户的 _id | 可选 如果有则按照 id查询
  account | String | 账号| 可选 如果有则按照 account查询
  email | String | 邮箱| 可选 如果有则按照 email查询
  phone | String | 手机| 可选 如果有则按照 phone查询
  sortName | string | 排序字段 | 可选 默认为 _id
  order | number | 排序方式 | 可选 默认为-1 
  page | number | 页码 | 当前页码 默认1
  limit | number | 查询条数 | 查询条数限制 默认 10
    */
  let querys = {

  };
  //过滤 如果当前(session)的权限等于1的话
  if (req.session.userinfo.role === 1) {
    querys = {
      show: true,
      role: 1
    }
  }
  //模糊查询
  if (query) {
    querys.account = {
      $regex: new RegExp(query)
    }
  }
  //连接数据库
  const db = await link_mongo("user:admin")
  //总条数
  const result_count = await db.count(querys)
  //过滤数据
  const datas = await db.find(querys).skip((skips - 1) * limit).limit(limit).sort({ "CreateTime": sort })
  //过滤总条数
  const result_data = await datas.count()
  //过滤toarray数据
  let data = await datas.toArray()


  /* 
    result_count 总数据条数
    result_data 过滤总条数
    page        当前页码
    result_page 总页码
    data_page   过滤后的页码
    data        过滤后的数据
    limit       显示条数
  */

  return res.json({
    result_count,
    result_data,
    page: skips,
    result_page: Math.ceil(result_count / limit),
    data_page: Math.ceil(result_data / limit),
    data,
    limit,
    success: true,
    msg: "查询成功"
  })
})
//---------修改个人信息
  //返回个人信息
  router.get('/userinfo', (req, res) => {
    //返回session
    return res.json({
      data: req.session.userinfo,
      success: true,
      msg: "成功返回"
    })
  })
  //根据id返回信息
  router.get('/userinfos/:id', async (req, res) => {

    const { id } = req.params
    //根据id返回session
    const data = await (await link_mongo("user:admin")).findOne({ "account": id })
    if (data) {
      return res.json({
        data,
        success: true,
        msg: "成功返回"
      })
    }
  })
  //退出后台
  router.get('/sinout', async (req, res) => {
    //清空session并返回
    req.session.userinfo = null;
    res.redirect("/login.html")
  })
  //上传头像
  router.post('/upload', uploader.single('upload'), async (req, res) => {
    //uploader.single('upload')这里的'upload'是客户端传输过来数据的name信息
    const { filename } = req.file
    //req.file:传输文件的所有信息
    //filename:传输文件的名称
    
    //存进数据库中的信息 url连接
    const url = "localhost:3100/images/" + filename 

    const result = await (await link_mongo("user:admin")).updateOne({
      email: req.session.userinfo.email
    }, {
      $set: {
        upic: url
      }
    })
    if (result.acknowledged) {
      return res.json({
        imgsrc: url,
        msg: "上传成功",
        success: true,
      })
    } else {
      return res.json({
        success: false,
        msg: "上传失败",
        err: err.message,

      })
    }


  })
  //修改个人信息
  router.post('/updateuser', async (req, res, next) => {
    //account
    try {
      var { accounts, email, phone, password } = new UserSingups(req.body)
     
    } catch (err) {
      return res.json({
        msg: "类型有误！",
        success: false,
        err: err.message,
      })
    }
    //将session中的account提取出来
    const { account } = req.session.userinfo;

    const db = await link_mongo("user:admin");

    let query = {}
    //判断字段在数据库中是否存在

    if (accounts) {
      const accountsw = await db.findOne({ account: accounts })
        if (accountsw) {
          return res.json({
            msg: "账号已被注册。",
            success: false,
          })
        }
      query.account = accounts
    }


    if (email) {
      const emails = await db.findOne({ email })

      if (emails) {
        return res.json({
          msg: "邮箱已被注册。",
          success: false,
        })
      }
      query.email = email
    }


    if (phone) {
      const phones = await db.findOne({ phone })
      if (phones) {
        return res.json({
          msg: "手机已被注册。",
          success: false,
        })
      }
      query.phone = phone
    }
    //如果经过加密的password不等于session中的 并且passwrd不为空则添加password
    if (md5_pas(password) !== req.session.userinfo.password && password !== "") {
      query.password = md5_pas(password)
    } else {
      return res.json({
        msg: "请检查密码， 密码格式或密码重复",
        success: false,
      })
    }

    //修改
    const result = await db.updateOne({ "account": account }, { $set: query })
    if (result.acknowledged) {
      //修改成功更新session  因为这是修改自身账号密码
      req.session.userinfo = await db.findOne(query)

      return res.json({
        msg: "修改成功",
        success: true,
      })

    } else {
      return res.json({
        msg: "修改失败",
        success: false,
      })
    }
  })
//---------------选择修改子信息
  //查看当前用户权限
  router.post('/user/:id', async (req, res, next) => {
    const { role } = req.session.userinfo
    if (role !== 0) {
      return res.json({
        msg: "您的权限不够请联系管理人员",
        success: false
      })
    }
    next()
  })
  //修改选择用户
  router.post('/user/update', async (req, res) => {
    let { id, isActive = false, show = false } = req.body;
    //强制转换类型
    if (isActive === "true") {
      isActive = true
    }
    if (show === "true") {
      show = true
    }

    try {
      //判断类型
      var { accounts, phone, email, password } = new UserSingups(req.body)

    } catch (err) {
      return res.json({
        err: err.message,
        success: false,
        msg: "格式有误",
      })
    }
    
    if (!(Boolean(accounts || phone || email))) {
      return res.json({
        success: false,
        msg: "更改成功~",
      })

    }

    const db = await link_mongo("user:admin");
    //查询传递过来的id是否存在
    const result = await db.findOne({ "_id": ObjectId(id) })
    //不存在返回错误
    if (!result) {
      return res.json({
        success: false,
        msg: "id有误 未知错误请联系管理员",
      })
    }
  
      let querys = {
        isActive,
        show
      }
      //将存在的参数放进querys中
      if (accounts) {
        querys.account = accounts
      }
      if (phone) {
        querys.phone = phone
      }
      if (email) {
        querys.email = email
      }
      if (password) {
        querys.password = md5_pas(password)
      }
      //修改
    const upd = await db.updateOne({
      "_id": ObjectId(id)
    }, {
      $set: querys
    })

    if (upd.acknowledged) {
      return res.json({
        success: true,
        msg: "修改成功",
      })
    } else {
      return res.json({
        success: false,
        msg: "修改失败",
      })
    }

  })
  //删除选择用户
  router.get('/user/delete/:id', async (req, res) => {

    //数据无价 删除等于修改
    const { id } = req.params;
    const db = await link_mongo("user:admin");
    const fin = await db.findOne({ "account": id });
    //拒绝重复删除
    if (fin.show === false) {
      return res.json({
        msg: "已删除请，勿重复删除",
        success: false,
      })
    }

    const result = await db.updateOne({
      "account": id
    }, {
      $set: {
        "show": false,
      }
    })
    if (result.acknowledged) {
      return res.json({
        msg: "删除成功",
        success: true,
      })
    } else {
      return res.json({
        msg: "删除失败",
        success: false,
      })
    }

  })
  //增加选择用户
  router.post('user/inser', async (req, res) => {
    //增加没做
    try {
      var { account, email, phone } = new UserSingup(req.body)
    } catch (err) {
      return res.json({
        message: "格式有误",
        success: false,
        err: err.message
      })
    }
    let querys = {
      account,
      email,
      password,
      CreateTime: new Date(),
      isActive: false,
      show: true,
      role: 1,
    }
    if(phone){
      querys.phone = phone
    }
    const result = await (await link_mongo("user:admin")).insertOne(querys)
   //添加成功发送邮箱
    if (result.acknowledged) {
      send_email.send({

        from: '天使的翅膀<1036161883@qq.com>',
        to: email,
        text: "验证地址为：localhost:3100/updateActive/" + result.insertedId,//正文
        subject: "邮箱验证码",//标题
        // cc:,附件

      }, (err, message) => {
        console.log(err || message);
      })

    // _id:'xxx' // 返回用户已添加用户的的id
    // account:'xxx', // 返回已添加用户的账号
    // email:'X@qq.com', // 返回已添加用户的邮箱
    // phone:'1320000000', // 返回已添加用户的手机
    // create_time:'2018-05-16' // 返回已添加用户的创建日期
      return res.json({
        _id: result._id,
        account,
        email,
        phone,
        CreateTime: new Date(result.CreateTime).toLocaleString(),
        success: true,
        msg: "添加成功"
      })
    } else {
      return res.json({
        success: false,
        msg: "添加失败"
      })
    }
  })
module.exports = router;
