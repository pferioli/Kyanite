const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const TotpStrategy = require('passport-totp').Strategy;

const User = require('../models').user;

// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user

    passport.deserializeUser(function (id, done) {
        User.findByPk(id).then(function (user) {
            if (user) {
                done(null, user);
            } else {
                done(user.errors, null);
            }
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        "local-login",
        new LocalStrategy(
            {
                // by default, local strategy uses username and password, we will override with email
                usernameField: "email",
                passwordField: "password",
                passReqToCallback: true, // allows us to pass back the entire request to the callback
                failureFlash: true
            },
            async function (req, email, password, done) {

                // callback with email and password from our form

                const user = await User.findOne({ where: { email: email, enabled: true } }).then(function (user) {

                    if (user === null) {
                        return done(
                            null,
                            false,
                            req.flash(
                                "warning",
                                "No se encontró el usuario en la base de datos"
                            )
                        ); // req.flash is the way to set flashdata using connect-flash
                    };

                    bcrypt.compare(password, user.password, function (err, result) {

                        if (err) return done(err);

                        if (result === false) {
                            // if the user is found but the password is wrong
                            return done(
                                null,
                                false,
                                req.flash("warning", "La contraseña ingresada es incorrecta")
                            ); // create the loginMessage and save it to session as flashdata
                        } else {
                            return done(null, user); // all is well, return successful user
                        }
                    });
                });
            }));

    passport.use('local-topt', new TotpStrategy({ codeField: 'otpToken', window: 30 },
        function (user, done) {
            if (!user.secret)
                return done('missing secret');
            return done(null, user.secret, 30);
        }
    ));

    module.exports = passport;
};