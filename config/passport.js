// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy,
    PublicKeyStrategy = require('passport-publickey').Strategy,
    crypto = require('crypto'),
    User = require('../models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, done);
    });

  // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

            // if there is no user with that email
            // create the user
            var newUser = new User({
                email: email
            });

            newUser.password = newUser.generateHash(password);
            
            // save the user
            newUser.save(function(err) {
                console.log("new user saved, err", err);
                if (err) {
                    if(err.name === 'ValidationError' && err.errors) {
                        for(var p in err.errors) {
                            if(err.errors.hasOwnProperty(p)) {
                                req.flash('error', err.errors[p].type || err.errors[p].message);
                            }
                        }
                        return done(null, false);
                    } else if(err.code === 11000) {
                        if(err.index.slice(-1 * 'email_1') === 'email_1') {
                            return done(null, false, req.flash('error', 'That email is already taken.'));
                        }
                    }
                    return done(err);
                }

                return done(null, newUser);
            });   

        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ email: email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('error', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('error', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));
};
