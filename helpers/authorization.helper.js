const UserPrivilegeLevel = require('../utils/userPrivilegeLevel.util').UserPrivilegeLevel;

function lastVisitedUrl() {
    return function (req, res, next) {
        req.session.referrer = req.protocol + '://' + req.get('host') + req.originalUrl;
        console.log(req.session.referrer);
        next();
    }
}

function checkPrivileges(requiredPrivilegeLevel, options = {}) {
    return function (req, res, next) {

        // no se requiren privilegios para esa URL...

        if (requiredPrivilegeLevel === UserPrivilegeLevel.eLevel.get('ALL').value) {
            next(); return;
        }

        // el nivel de privilegios del usuario es menor que el requerido, se redirecciona

        if (req.user.securityLevel > requiredPrivilegeLevel) {
            req.flash("warning", `No tiene privilegios suficientes para realizar la acción solicitada (requerido nivel ${requiredPrivilegeLevel})`);
            if (options.failureRedirect) {
                res.redirect(options.failureRedirect);
            } else {
                if (req.session.referrer) {
                    console.log(req.session.referrer); res.redirect(req.session.referrer);
                } else {
                    res.redirect('/');
                }
            }
            return;
        }

        next(); // el nivel de privilegios esta OK, pasamos al siguiente...
    }
}

module.exports = { lastVisitedUrl, checkPrivileges, UserPrivilegeLevel };