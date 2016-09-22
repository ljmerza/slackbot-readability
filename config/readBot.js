'use strict'

var util = require('util')
var fs = require('fs')
var bot = require('slackbots')


// add constructor method to save the name and user id of bot
var readBot = function Constructor(settings) {
	this.settings = settings
	this.settings.name = this.settings.name || 'readBot'

	this.user
}
// inhert from slackbot module
util.inherits(readBot, bot)



// start bot and add start/message event listeners
readBot.prototype.run = function () {
	readBot.super_.call(this, this.settings)

	this.on('start', this._onStart)
	this.on('message', this._onMessage)
}

// on start of bot, sve the bot user id and display welcome message
readBot.prototype._onStart = function () {
	this._loadBotUser()
	this._welcomeMessage()
}


// on message event, check if chat message in a channel and is not from the bot
readBot.prototype._onMessage = function (message) {
	console.log(message)
	console.log(this._isChatMessage(message), this._isChannelConversation(message), this._isFromReadBot(message))
	console.log('---------')

	if (this._isChatMessage(message) && this._isChannelConversation(message) && this._isFromReadBot(message)) {
		this._reply(message)
	}
}
// reply with message in same channel
readBot.prototype._reply = function (originalMessage) {
	var channel = this._getChannelById(originalMessage.channel)
	console.log('channel:', channel)

	this.postMessageToChannel(channel.name, 'Hello in ' + originalMessage.channel, {
		"as_user": true,
		"attachments": [{
			"text": "Choose a game to play",
			"fallback": "An Error has occured.",
			"callback_id": "wopr_game",
			"color": "#3AA3E3",
			"attachment_type": "default",
			"actions": [
				{
					"name": "Interested",
					"text": "Interested",
					"type": "button",
					"value": "Interested"
				}
			]
		}]
	}).then(function(data) {
	})
}



// internal method to get the bot user id
readBot.prototype._loadBotUser = function () {
	var self = this
	this.user = this.users.filter(function (user) {
		return user.name === self.name
	})[0]
}
// welcome message when first starting bot
readBot.prototype._welcomeMessage = function () {
	this.postMessageToChannel(this.channels[0].name, "Hello I'm " + this.name, {as_user: true})
}



// internal methods to check chat message, if message is in a channel, and if message is from readBot
readBot.prototype._isChatMessage = function (message) {
	return message.type === 'message' && Boolean(message.text)
}
readBot.prototype._isChannelConversation = function (message) {
	return typeof message.channel === 'string' && message.channel[0] === 'C'
}
readBot.prototype._isFromReadBot = function (message) {
	return message.user === this.user.id
}



// get the channel by its id
readBot.prototype._getChannelById = function (channelId) {
	return this.channels.filter(function (item) {
		return item.id === channelId
	})[0]
}



module.exports = readBot