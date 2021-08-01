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

async function listBillingPeriodsWithPendingPaymentReceipts(clientId) {

    try {
        const response = await fetch('/expenses/paymentReceipts/ajax/pending/client/' + clientId + '/billingPeriods')
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

async function getPaymentReceiptById(paymentReceiptId) {

    try {

        if (paymentReceiptId === undefined) return;

        let url = '/expenses/paymentReceipts/ajax/getPaymentReceiptById/' + paymentReceiptId;

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

async function checkPaymentReceiptExists(paymentReceipt) {

    try {

        if (paymentReceipt === undefined) return;

        let url = `/expenses/paymentReceipts/ajax/checkPaymentReceiptExists`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentReceipt)
        });

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

