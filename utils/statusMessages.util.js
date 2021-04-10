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

module.exports.PaymentOrder = class {

    constructor() { }

    static get Status() {
        return ["Deshabilitada", "Pendiente", "En Proceso", "Procesada", "Anulada"];
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

module.exports.AccreditedCheck = class {

    constructor() { }

    static get Status() {
        return ["Pendiente", "Acreditado", "Rechazado"];
    }

    static get eStatus() {
        return new Enum({ 'pending': 0, 'accredited': 1, 'rejected': 2, })
    }
}

module.exports.SplitCheck = class {

    constructor() { }

    static get Status() {
        return ["Pendiente", "Asignado", "Anulado"];
    }

    static get eStatus() {
        return new Enum({ 'pending': 0, 'assigned': 1, 'deleted': 2 })
    }
}

module.exports.Collection = class {

    constructor() { }

    static get Status() {
        return ["Deshabilitada", "Pendiente", "En Proceso", "Procesada", "Anulada"];
    }

    static get eStatus() {
        return new Enum({ 'disabled': 0, 'pending': 1, 'inprogress': 2, 'processed': 3, 'deleted': 4 })
    }
}

module.exports.ImportCollection = class {

    constructor() { }

    static get Status() {
        return ["Detenido", "Iniciado", "Importando", "Procesando", "Completado", "Fallido", "Cancelado"];
    }

    static get eStatus() {
        return new Enum({ 'stopped': 0, 'started': 1, 'importing': 2, 'processing': 3, 'completed': 4, 'failed': 5, 'cancelled': 6 })
    }
}

module.exports.UnidentifiedDeposit = class {

    constructor() { }

    static get Status() {
        return ["Pendiente", "Asignado", "Anulado"];
    }

    static get eStatus() {
        return new Enum({ 'pending': 0, 'assigned': 1, 'cancelled': 2 })
    }
}

module.exports.FixedTermDeposits = class {

    constructor() { }

    static get Status() {
        return ["Pendiente", "Creado", "Renovado", "Expirado", "Acreditado", "Anulado"];
    }

    static get eStatus() {
        return new Enum({ 'pending': 0, 'created': 1, 'renewed': 2, 'expired': 3, 'accredited': 4, 'cancelled': 5 })
    }
}

