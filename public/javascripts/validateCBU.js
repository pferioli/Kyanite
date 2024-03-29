function validarLargoCBU(cbu) {
    if (cbu.length != 22) { return false }
    return true
}

function validarCodigoBanco(codigo) {
    if (codigo.length != 8) { return false }
    var banco = codigo.substr(0, 3)
    var sucursal = codigo.substr(3, 4)
    var digitoVerificador = Number.parseInt(codigo[7])

    var suma = banco[0] * 7 + banco[1] * 1 + banco[2] * 3 + sucursal[0] * 9 + sucursal[1] * 7 + sucursal[2] * 1 + sucursal[3] * 3

    var diferencia = 10 - (suma % 10)

    if ((digitoVerificador !== 0) && (diferencia === digitoVerificador)) return true;

    if ((digitoVerificador === 0) && (diferencia === 10)) return true;

    return false;
}

function validarCuenta(cuenta) {
    if (cuenta.length != 14) { return false }
    var digitoVerificador = Number.parseInt(cuenta[13])
    var suma = cuenta[0] * 3 + cuenta[1] * 9 + cuenta[2] * 7 + cuenta[3] * 1 + cuenta[4] * 3 + cuenta[5] * 9 + cuenta[6] * 7 + cuenta[7] * 1 + cuenta[8] * 3 + cuenta[9] * 9 + cuenta[10] * 7 + cuenta[11] * 1 + cuenta[12] * 3
    var diferencia = 10 - (suma % 10)

    if ((digitoVerificador !== 0) && (diferencia === digitoVerificador)) return true;

    if ((digitoVerificador === 0) && (diferencia === 10)) return true;

    return false;
}

function validarCBU(cbu) {
    return validarLargoCBU(cbu) && validarCodigoBanco(cbu.substr(0, 8)) && validarCuenta(cbu.substr(8, 14))
}