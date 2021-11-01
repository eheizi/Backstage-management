# 三阶段考试
>这次写这个代码让我知道了 写啥一定要专注 不然你会因为一个单词大小写而查找半个小时的错误
## 安装项目环境
    - 安装express
    - 创建一个express应用并安装所有依赖
        express --view=pug myapp
        npm install

## 环境依赖
    + node-dev
    + redis
    + MongoDB

    
## 开发依赖
    中间件
    + svg-captcha
    + redis
    + express-session
    + multer //上传文件
    + validator
    + emailjs

## 数据库
> 用户信息

账号 | 邮箱 | 手机 | 密码
--|--|--|--
account | String | 账号| 必须
email | String | 邮箱| 必须
code | String | 使用邮箱发送验证码或者图片验证码| 必须
phone | String | 手机| 必须
password | String | 密码| 必须
role | number | 权限 | 必须 |
isActive |boolean|激活|必须|
show|boolean|是否展示|必须|
createTime|string|时间|创建时间|必须
upic|string|路径|头像路径|非必须
> 
## 实现的功能
- 登录
- 注册
- 后台管理
    - 增删改查
    - 上传头像




## 遇到的问题

1、 数据库连接问题
```js
link_mongo(dbName).collection(name)
     连接数据库中一直提示collection该函数不存在，但是后面要是不跟函数(find)之类的话就不会报错如果想在同一行就使用下面的解决方案
ERROR : Collection is not a function
解决方案:使用await包裹函数
(await link_mongo(dbName))
具体原因不明
```
2、 express-session没有生成cookie
```js
 secure:true,//是否为https协议
 当为true时他不会生成cookie 

 解决方案：设置为false
 
 具体原因不明
 可能是https不支持生成cookie

```
3、 管理员给自己改密码中的错误
    - 在修改接口中因为我们登陆之后是根据req.session.userinfo的信息来看的
    所以修改完毕之后需要重新传递给session中去


```js
三阶段考试
├── public/
│   ├── admin
│   │    ├── user
│   │    │   └── update.html      //功能：修改按钮实现页面
│   │    ├── admin_list.html    //数据展示并排版
│   │    ├── admin_update.html  //修改自己的密码
│   │    ├── admin_upload.html  //上传头像
│   │    └── admin_userinfo.html//返回自身信息页面
│   ├── images                  //图片
│   ├── javascripts             //js
│   ├── stylesheets             //css样式
│   ├── username                
│   │    ├── repassword.html    //找回密码
│   │    └── retrive.html       //修改页面
│   ├── admin.html              //后台
│   ├── login.html              //登录
│   └── sinup.html              //注册
├── routers/                    //组件
│   ├── from                    //样式判断
│   │    ├── UserLoginFrom.html //登录判断
│   │    ├── UserSingup.html    //注册判断 无数据返回错误(判断表单类型)
│   │    └── UserSingUps.html   //有数据才判断样式没数据直接返回
│   ├── index.html  //根接口  登录、注册、找回密码、发送验证码、过滤(admin)
│   └── users.html  //admin   返回数据、增删改查、  
├── util/
│   ├── md5_pas.js  //md5加密
│   ├── mongodb.js  //链接MongoDB
│   ├── random_captahca.js//随机验证码
│   ├── send_email.js   //发送邮箱
│   └── validate.js     //set get操作
└── app.js              //主体
```