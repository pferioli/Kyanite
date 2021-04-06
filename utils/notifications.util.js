const Enum = require('enum');


module.exports = class Notifications {

    constructor() {
        this.enumSeverity = new Enum({ 'clear': 0, 'fatal': 1, 'critical': 2, 'minor': 3, 'warning': 4 });
        this.enumType = new Enum({ 'general': 0, 'homeOwners': 1, 'collections': 2, 'fixedTermDeposits': 3 });
    }

    get Severity() {
        return ["Resuelta", "Alta", "Mediana", "Baja", "Aviso"];
    }

    get eSeverity() {
        return this.enumSeverity;
    }

    get Type() {
        return ["General", "Propietarios", "Cobranzas", "Plazo Fijos"];
    }

    get eType() {
        return this.enumType;
    }

    fatal(type, message, user) { this.sendNotification(type, 'fatal', message, user) };
    critical(type, message, user) { this.sendNotification(type, 'critical', message, user) };
    minor(type, message, user) { this.sendNotification(type, 'minor', message, user) };
    warning(type, message, user) {
        this.sendNotification(type, 'warning', message, user)
    };

    sendNotification(type, severity, message, user) {

        const notification = {
            type: this.enumType.get(type).value,
            severity: this.enumSeverity.get(severity).value,
            userId: (user === undefined ? 0 : user), // 0 = all users
            description: message,
            enabled: true
        };

        const Model = require('../models');

        Model.notification.create(notification).then((result) => { return result });
    };
}
