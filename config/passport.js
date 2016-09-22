'use strict'

let LocalStrategy = require('passport-local').Strategy,
	SlackStrategy = require('passport-slack').Strategy,
	ReadabilityStrategy = require('passport-readability').Strategy


// load the user model
let User = require('./../app/user')

// load authorization keys
let configAuth = require('./auth')

module.exports = function(passport) {

	// serialize user from session cookie to use it
	passport.serializeUser(function(user, done) {
		done(null, user.id)
	})
	// deserialize the user from db and add to session cookie
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user)
		})
	})

	/******************************slack passport*****************************/
	passport.use(new SlackStrategy({
		clientID: configAuth.slackAuth.clientID,
		clientSecret: configAuth.slackAuth.clientSecret,
		callbackURL: configAuth.slackAuth.callbackURL,
		scope: configAuth.slackAuth.scope,
		passReqToCallback : true
	},
	// get token from params to get bot posting access
	function(req, accessToken, refreshToken, params, profile, done) {

		readBotStart(accessToken)
		console.log('params:', params)
		console.log('token:', accessToken)

		process.nextTick(function() {

			if (! req.user) {
				User.findOne({ 'slack.id' : profile.id }, function(err, user) {
					if (err) { return done(err) }
					if (user) {
						// if there is a user id already but no token 
						// then user was linked at one point and then removed
						if (! user.slack.token) {
							user.slack.token = accessToken
							user.slack.displayname = profile.displayName
							user.slack.url = profile._json.url
							user.slack.team = profile._json.team
							user.slack.user = profile._json.user
							user.slack.team_id = profile._json.team_id
							user.slack.user_id = profile._json.user_id

							user.save(function(err) {
								if (err) { throw err }
								return done(null, user)
							})
						}
						// user found return user
						return done(null, user)
					} else {
						// if there is no user then create
						let newUser = new User()
						newUser.slack.id = profile.id
						newUser.slack.token = accessToken
						newUser.slack.displayname = profile.displayName
						newUser.slack.url = profile._json.url
						newUser.slack.team = profile._json.team
						newUser.slack.user = profile._json.user
						newUser.slack.team_id = profile._json.team_id
						newUser.slack.user_id = profile._json.user_id

						newUser.save(function(err) {
							if (err) { throw err }
							return done(null, newUser)
						})
					}
				})
			} else {
				// user already exists and is logged in so link the accounts
				let user = req.user
				user.slack.id = profile.id
				user.slack.token = token
				user.slack.displayname = profile.displayName
				user.slack.url = profile._json.url
				user.slack.team = profile._json.team
				user.slack.user = profile._json.user
				user.slack.team_id = profile._json.team_id
				user.slack.user_id = profile._json.user_id

				user.save(function(err) {
					if (err) { throw err }
					return done(null, user)
				})
			}
		})
	}))


	/******************************readability passport*****************************/
	passport.use(new ReadabilityStrategy({
		consumerKey: configAuth.readAuth.consumerKey,
		consumerSecret: configAuth.readAuth.consumerSecret,
		callbackURL: configAuth.readAuth.callbackURL
	},
	function(req, token, refreshToken, profile, done) {
		process.nextTick(function() {

			if (! req.user) {
				User.findOne({ 'readability.id' : profile.id }, function(err, user) {
					if (err) { return done(err) }
					if (user) {
						// if there is a user id already but no token 
						// then user was linked at one point and then removed
						if (! user.readability.token) {
							user.readability.token = token
							user.readability.username = profile.username
							user.readability.kindle = profile._json.kindle_email_address
							user.readability.readEmail = profile._json.email_into_address
							user.readability.email = ''
							user.readability.avatarURL = profile._json.avatar_url

							user.save(function(err) {
								if (err) { throw err }
								return done(null, user)
							})
						}
						// user found return user
						return done(null, user)
					} else {
						// if there is no user then create
						let newUser = new User()

						newUser.readability.id = profile.id
						newUser.readability.token = token
						newUser.readability.username = profile.username
						newUser.readability.kindle = profile._json.kindle_email_address
						newUser.readability.readEmail = profile._json.email_into_address
						newUser.readability.email = ''
						newUser.readability.avatarURL = profile._json.avatar_url

						newUser.save(function(err) {
							if (err) { throw err }
							return done(null, newUser)
						})
					}
				})
			} else {
				// user already exists and is logged in so link the accounts
				let user = req.user
				user.readability.id = profile.id
				user.readability.token = token
				user.readability.username = profile.username
				user.readability.kindle = profile._json.kindle_email_address
				user.readability.readEmail = profile._json.email_into_address
				user.readability.email = ''
				user.readability.avatarURL = profile._json.avatar_url

				user.save(function(err) {
					if (err) { throw err }
					return done(null, user)
				})
			}
		})
	}))

	/******************************login login***************************/
	passport.use('local-login', new LocalStrategy({
		// override default fields in passport module
		usernameField : 'email',
		passwordField : 'password',
		// pass in request from route to check if a user is logged in
		passReqToCallback : true 
	},
	function(req, email, password, done) {
		// async for login to be done before db access
		process.nextTick(function() {
			// find user by email
			User.findOne({ 'local.email' :  email }, function(err, user) {
				if (err) { return done(err) }

				// if no user is found send flash
				if (!user) {
					return done(null, false, req.flash('loginMessage', 'No user found.'))
				}
				// if invalid password send flash
				if (!user.validPassword(password)) {
					return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'))
				}
				// else login successful
				else {
					return done(null, user)
				}
			})
		})
	}))

	/************************local sign up***************************************/
	passport.use('local-signup', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true
	},
	function(req, email, password, done) {

		process.nextTick(function() {
			// see if email is used already
			User.findOne({'local.email': email}, function(err, existingUser) {
				// if error stop db connection and return error
				if (err) { return done(err) }
				// if email exists then send flash
				if (existingUser) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'))
				}
				//  if login successful connect to new local account
				if(req.user) {
					let user = req.user
					user.local.email = email
					user.local.password = user.generateHash(password)
					user.save(function(err) {
						if (err) { throw err }
						return done(null, user)
					})
				} 
				// else create new local account
				else {
					// create user model
					let newUser = new User()
					newUser.local.email = email
					newUser.local.password = newUser.generateHash(password)
					newUser.save(function(err) {
						if (err) { throw err }
						return done(null, newUser)
					})
				}

			})
		})
	}))
}


function readBotStart (tokenp) {
	let ReadBot = require('./readBot')
	var readBot = new ReadBot({
		token: tokenp,
		name: 'readbot'
	})
	readBot.run()
}