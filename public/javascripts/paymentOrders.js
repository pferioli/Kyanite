
async function calculateRemainingBalance(paymentReceiptId) {

    try {
        const response = await fetch('/expenses/paymentOrders/ajax/calculateRemainingBalance/' + paymentReceiptId)
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

async function getPaymentOrdersByReceiptId(paymentReceiptId) {

    try {

        if (paymentReceiptId === undefined) return;

        let url = '/expenses/paymentOrders/ajax/byReceiptId/' + paymentReceiptId;

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