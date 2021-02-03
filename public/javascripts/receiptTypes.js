function populateReceiptTypes(fieldID) {
    selectField = document.getElementById(fieldID);
    selectField.options.length = 0;
    selectField.innerHTML = "<option value=\"\" selected disabled>" + "Seleccione el Tipo de Factura" + "</option>"
    fetch('/expenses/paymentReceipts/ajax/types')
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {

            let receiptTypes = JSON.parse(response);

            for (i = 0; i < receiptTypes.length; i++) {
                selectField.innerHTML = selectField.innerHTML + "<option value=\"" + receiptTypes[i].id + "\">" + receiptTypes[i].name + "</option>"
            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}