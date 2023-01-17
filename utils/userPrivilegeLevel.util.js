const Enum = require('enum');

module.exports.UserPrivilegeLevel = class {

    constructor() { }

    static get Level() {
        return ["Administrador", "Avanzado", "Regular"];
    }

    static get eLevel() {
        return new Enum({
            'ADMINISTRATOR': 1,
            'ADVANCED': 2,
            'REGULAR': 3,
            'ALL': 9,
        })
    }
}
