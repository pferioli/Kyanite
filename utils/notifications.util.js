const Enum = require('enum');

module.exports.notifications = class {

    constructor() { }

    static get Severity() {
        return ["Resuelta", "Alta", "Mediana", "Baja", "Aviso"];
    }

    static get eSeverity() {
        return new Enum({ 'clear': 0, 'fatal': 1, 'critical': 2, 'minor': 3, 'warning': 4 })
    }

    static get Type() {
        return ["General", "Propietarios"];
    }

    static get eType() {
        return new Enum({ 'general': 0, 'homeOwners': 1 })
    }
}
