const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const mysql = require("../lib/db");

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
        mysql.connection.query("select * from usuario where id = ?", [id], function (
            err,
            user
        ) {
            done(err, user[0]);
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
                failureFlash: true,
                successFlash: "Hey, Welcome back",
            },
            function (req, email, password, done) {
                // callback with email and password from our form

                mysql.connection.query(
                    "select * from usuario where email = ?",
                    [email],
                    function (err, rows) {
                        if (err) return done(err);
                        if (!rows.length) {
                            return done(
                                null,
                                false,
                                req.flash(
                                    "error",
                                    "No se encontró el usuario en la base de datos"
                                )
                            ); // req.flash is the way to set flashdata using connect-flash
                        }

                        bcrypt.compare(password, rows[0].clave, function (err, result) {
                            if (err) return done(err);

                            if (result === false) {
                                // if the user is found but the password is wrong
                                return done(
                                    null,
                                    false,
                                    req.flash("error", "La contraseña ingresada es incorrecta")
                                ); // create the loginMessage and save it to session as flashdata
                            } else {
                                return done(null, rows[0]); // all is well, return successful user
                            }
                        });
                    }
                );
            }
        )
    );

    module.exports = passport;
}
