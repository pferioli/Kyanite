function populateReceiptTypes(fieldID, selectedId) {
    selectField = document.getElementById(fieldID);
    selectField.options.length = 0;

    if (selectedId === undefined)
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
                if (receiptTypes[i].id === Number.parseInt(selectedId)) {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + receiptTypes[i].id + "\" selected>" + receiptTypes[i].name + "</option>"
                } else {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + receiptTypes[i].id + "\">" + receiptTypes[i].name + "</option>"
                }

            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}