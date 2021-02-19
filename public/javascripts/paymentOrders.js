
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
