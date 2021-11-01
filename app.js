const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const redis = require ( 'redis' ) // + redis
const session = require('express-session')// + session




let RedisStore = require('connect-redis')(session)//通过connect-redis连接session
let redisClient = redis.createClient()


const app = express();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// view engine setup
app.set('views', path.join(__dirname, 'views'));//连接views文件夹并输出
app.set('view engine', 'pug');



app.use(logger('dev'));
app.use(express.json());//处理json数据
app.use(express.urlencoded({ extended: false }));//处理表单数据
app.use(cookieParser());//过滤cookie


app.use(session({
    store: new RedisStore({ client: redisClient }),//链接redis
    secret: 'zjx',//彩虹算法的秘钥
    resave: false,//是否每次请求都重新保存session 
    saveUninitialized: true,//是否设置 需要保存一次session 才设置cookie
   cookie:{
     maxAge:10*60*1000,//过期时间
     secure:false,//是否为https协议
     httpOnly:true,//设置只能服务器修改cookie
     
   },
   rolling:true//每刷新一次cookie  就增加时间
  })
)
//----------

app.use('/', indexRouter);
app.use('/admin', usersRouter);

app.use(express.static(path.join(__dirname, 'public')));//设置根目录

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//3100端口
app.listen('3100',()=>{
  console.log("localhost:3100")
})



module.exports = app;
