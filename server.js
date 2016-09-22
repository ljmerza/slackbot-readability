'use strict'

let express  = require('express')
let	mongoose = require('mongoose')
let	passport = require('passport')
let	flash = require('connect-flash')
let	http = require('http')
let	cookieParser = require('cookie-parser')
let	bodyParser = require('body-parser')
let	path = require('path')
let	session = require('express-session')

let app = express()


const port = process.env.PORT || 3000
const configDB = 'mongodb://localhost/slackread'

mongoose.connect(configDB)
require('./config/passport')(passport) // pass passport object to auth functions



app.use(cookieParser()) // cookies for auth
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({ 
	name: 'slackBotReadSessions',
	secret: 'fghd4w45456fghgdtr5h',
	resave: true,
	saveUninitialized: true
}))




app.use(passport.initialize())
app.use(passport.session()) // persistent login sessions
app.use(flash()) // use for flash messages stored in session



// load routes and pass in app and configure passport
require('./app/routes.js')(app, passport)


app.get('/api', function (req, res, next) {
	console.log(req.cookies)
	res.send(req.cookies)
})






// create server object
let server = http.createServer(app)
// booting up server function
let boot = function() {
	server.listen(port, function() {
		console.log('Express server listening on port ', port)
	})
}
// shutdown server function
let shutdown = function() {
	server.close()
}

// if main module then start server else pass to exports
if(require.main === module){
	boot()
} else {
	console.log('Running readSlackBot app as module')
	module.exports = {
		boot: boot,
		shutdown: shutdown,
		port: port,
		server: server,
		app: app
	}
}