async function getPendingPaymentReceiptsSuppliersList(clientId, checkId) {

    try {

        let url = '/expenses/paymentReceipts/ajax/pending/getSuppliersList/' + clientId;

        if (checkId != undefined) { url = url + '?checkId=' + checkId; }

        const response = await fetch(url);

        if (response.status == 200) {
            var data = await response.json();
            return data;
        } else {
            throw "Respuesta incorrecta del servidor"
        }
    } catch (err) {
        console.log(err);
    }
}

async function getPendingPaymentReceiptsBySupplierId(clientId, supplierId) {

    try {
        const response = await fetch('/expenses/paymentReceipts/ajax/pending/client/' + clientId + '/bySupplierId/' + supplierId)
        if (response.status == 200) {
            var data = await response.json();
            return data;
        } else {
            throw "Respuesta incorrecta del servidor"
        }
    } catch (err) {
        console.log(err);
    }
}