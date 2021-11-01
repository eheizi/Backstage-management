const {SMTPClient} = require("emailjs")

const client = new SMTPClient({
	user: '1036161883@qq.com',//邮箱
	password: 'gplmlrdsxgpobcih',//POP3/SMTP服务 秘钥
	host: 'smtp.qq.com',//邮箱地址
	// ssl: true,是否使用ssl 连接
   
});
module.exports = client