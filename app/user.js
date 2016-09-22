'use strict'

const mongoose = require('mongoose'),
    bcrypt   = require('bcrypt-nodejs')

// define schema for user model
let userSchema = mongoose.Schema({
    local: {
        email: String,
        password: String,
    },
    slack: {
        id: String,
        token: String,
        displayname: String,
        url: String,
        team: String,
        user: String,
        team_id: String,
        user_id: String
    },
    readability: {
        id: String,
        token: String,
        username: String,
        kindle: String,
        readEmail: String,
        email: String,
        avatarURL: String
    }
})

// generate hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

// check if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password)
}

// create the model for users and expose it to app
module.exports = mongoose.model('User', userSchema)
