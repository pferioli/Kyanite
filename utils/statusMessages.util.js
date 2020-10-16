const Enum = require('enum');

module.exports.AccountTransfer = class {

    constructor() { }

    static get Status() {
        return ["Deshabilitada", "Pendiente", "En Proceso", "Procesada", "Anulada"];
    }

    static get eStatus() {
        return new Enum({ 'disabled': 0, 'pending': 1, 'inprogress': 2, 'processed': 3, 'deleted': 4 })
    }
}

module.exports.BillingPeriod = class {

    constructor() { }

    static get Status() {
        return ["Creado", "Abierto", "Cerrado", "Anulado"];
    }

    static get eStatus() {
        return new Enum({ 'created': 0, 'opened': 1, 'closed': 2, 'disabled': 3 })
    }
}

module.exports.PaymentReceipt = class {

    constructor() { }

    static get Status() {
        return ["Deshabilitado", "Pendiente", "En Proceso", "Procesado", "Anulado"];
    }

    static get eStatus() {
        return new Enum({ 'disabled': 0, 'pending': 1, 'inprogress': 2, 'processed': 3, 'deleted': 4 })
    }
}

module.exports.Check = class {

    constructor() { }

    static get Status() {
        return ["En Cartera", "Depositado", "Acreditado", "Entregado", "Rechazado", "Anulado"];
    }

    static get eStatus() {
        return new Enum({ 'wallet': 0, 'deposited': 1, 'accredited': 2, 'delivered': 3, 'rejected': 4, 'cancelled': 5 })
    }
}