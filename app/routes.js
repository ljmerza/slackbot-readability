'use strict'

module.exports = function(app, passport) {


	/******************************normal routes***************************************/
	// show home page
	app.get('/', function(req, res) {
		res.render('index.ejs')
	})
	// show profile page
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		})
	})
	// logout page
	app.get('/logout', function(req, res) {
		req.logout()
		res.redirect('.')
	})



	/*******************************local authentication****************************/
	// show login page
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') })
	})

	// process a login
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : 'profile', // if success redirect to profile page
		failureRedirect : 'login', // if failure rediect to login page
		failureFlash : true // allow flash messages
	}))
	// show sign up page
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') })
	})

	// process a sign up
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : 'profile',
		failureRedirect : 'signup',
		failureFlash : true
	}))


	/*******************************slack authentication****************************/
	app.get('/auth/slack', passport.authenticate('slack'))

	app.get('/auth/slack/callback', 
		passport.authorize('slack', { failureRedirect: './../../profile' }),
		function(req, res) {
			// Successful authentication
			res.redirect('./../../profile')
	})

	app.get('/connect/slack', passport.authorize('slack'))

	app.get('/connect/slack/callback', passport.authorize('slack', {
		successRedirect : './../../profile',
		failureRedirect : './../../profile'
	}))

	app.get('/unlink/slack', function(req, res) {
		let user = req.user
		user.slack.token = undefined
		user.save(function(err) {
			res.redirect('./../../profile')
		})
	})

	/*******************************readability authentication****************************/
	app.get('/auth/read', passport.authenticate('readability'))

	app.get('/auth/read/callback',
		passport.authenticate('readability', { failureRedirect: './../../profile' }),
		function(req, res) {
			// Successful authentication
			res.redirect('./../../profile')
	})

	app.get('/connect/read', passport.authorize('readability'))

	app.get('/connect/readabreadility/callback', passport.authorize('readability', {
		successRedirect : './../../profile',
		failureRedirect : './../../profile'
	}))

	app.get('/unlink/read', function(req, res) {
		let user = req.user
		user.readability.token = undefined
		user.save(function(err) {
			res.redirect('./../../profile')
		})
	})
}



function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next() // if authenticated then go to next middleware
	res.redirect('/') // if not authenticated then redirect to home page
}
