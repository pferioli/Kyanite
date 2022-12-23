async function getMovementDetail(url) {

    const response = await fetch(url);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const movementDetail = await response.json();

    return movementDetail;
}

function defaultHeader(tableRef, details) {

    var newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID del movimiento"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Tipo de movimiento"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.categoryName));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Cliente"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.client.name));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID del cliente"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.client.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Período de liquidación"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.billingPeriod.name));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado del período"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.billingPeriod.status));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la cuenta"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.account.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Alias de cuenta"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.account.accountType.account));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Tipo de cuenta"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.account.accountType.description));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Número de cuenta"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.movement.account.accountNumber ? details.movement.account.accountNumber : ''));
}


function paymentOrderDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Proveedor"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.paymentOrder.paymentReceipt.supplier.name));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Tipo de comprobante"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.paymentOrder.paymentReceipt.receiptType.name));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Número de comprobante"));
    newRow.insertCell(1).appendChild(document.createTextNode("[" + details.paymentOrder.paymentReceipt.receiptType.receiptType + "] " + details.paymentOrder.paymentReceipt.receiptNumber));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe del comprobante"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.paymentOrder.paymentReceipt.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Fecha de emisión"));
    newRow.insertCell(1).appendChild(document.createTextNode(moment(details.paymentOrder.paymentReceipt.emissionDate).format('DD/MM/YYYY')));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado del comprobante"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.paymentOrder.paymentReceipt.status));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Detalle del servicio"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.paymentOrder.paymentReceipt.description));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Órden de Pago"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.paymentOrder.poNumberFormatted));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe de la órden de pago"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.paymentOrder.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Fecha de Pago"));
    newRow.insertCell(1).appendChild(document.createTextNode(moment(details.paymentOrder.paymentDate).format('DD/MM/YYYY')));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado de la órden de Pago"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.paymentOrder.status));

    if (details.movement.deletedAt) {
        newRow = tableRef.insertRow(-1);
        newRow.insertCell(0).appendChild(document.createTextNode("Fecha de Eliminación"));
        newRow.insertCell(1).appendChild(document.createTextNode(moment(details.movement.deletedAt).format('DD/MM/YYYY HH:mm:ss')));
    }
}


function collectionDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la cobranza"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.collection.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Número de recibo"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.collection.receiptNumber));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe total de conceptos"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.collection.amountConcepts).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe total de valores"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.collection.amountSecurities).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Fecha de cobranza"));
    newRow.insertCell(1).appendChild(document.createTextNode(moment(details.collection.receiptDate).format('DD/MM/YYYY')));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado de la cobranza"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.collection.status));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Propiedades"));

    let homeOwners = ""

    if (details.collection.Properties) {
        for (const property of details.collection.Properties) {
            homeOwners = homeOwners + property.homeOwner.property + ",";
        }
        homeOwners = homeOwners.slice(0, -1)
    } else {
        homeOwners = "DNI"
    }

    newRow.insertCell(1).appendChild(document.createTextNode(homeOwners));
}


function investmentDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la inversion"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Categoría"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.depositType.description));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.investment.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Interéses ganados"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.interests !== undefined ? "$" + Number.parseFloat(details.investment.interests).toFixed(2) : ""));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la cuenta de origen"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.sourceAccount.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Alias cuenta de origen"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.sourceAccount.accountType.account));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la cuenta de destino"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.destinationAccount.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Alias cuenta de destino"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.destinationAccount.accountType.account));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Fecha de vencimiento"));
    newRow.insertCell(1).appendChild(document.createTextNode(moment(details.investment.expirationDate).format('DD/MM/YYYY')));


    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado de la inversión"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.investment.status));

}


function accountTransferDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la transferencia"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountTransfer.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.accountTransfer.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la cuenta de origen"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountTransfer.sourceAccount.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Alias cuenta de origen"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountTransfer.sourceAccount.accountType.account));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la cuenta de destino"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountTransfer.destinationAccount.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Alias cuenta de destino"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountTransfer.destinationAccount.accountType.account));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Fecha"));
    newRow.insertCell(1).appendChild(document.createTextNode(moment(details.accountTransfer.transferDate).format('DD/MM/YYYY')));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado de la transferencia"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountTransfer.status));

}

function monthlyBalanceDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID del saldo de inicio"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.monthlyBalance.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.monthlyBalance.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Cantidad de movimientos procesados"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.monthlyBalance.movements));
}

function manualAccountAdjustmentDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID del ajuste de saldo"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountAdjustment.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.accountAdjustment.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Comentarios"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.accountAdjustment.comments));
}

function compensationDetails(tableRef, details) {

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("ID de la compensación"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.compensation.id));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Importe"));
    newRow.insertCell(1).appendChild(document.createTextNode("$" + Number.parseFloat(details.compensation.amount).toFixed(2)));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Fecha"));
    newRow.insertCell(1).appendChild(document.createTextNode(moment(details.compensation.emissionDate).format('DD/MM/YYYY')));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Categoría"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.compensation.accountingImputation.name));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Comentarios"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.compensation.comments));

    newRow = tableRef.insertRow(-1);
    newRow.insertCell(0).appendChild(document.createTextNode("Estado"));
    newRow.insertCell(1).appendChild(document.createTextNode(details.compensation.status));

}