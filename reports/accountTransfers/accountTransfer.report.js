const PDFDocument = require("pdfkit");
const path = require("path");

const common = require('../common.report');

const AccountTransferStatus = require('../../utils/statusMessages.util').AccountTransfer;

// const fs = require('fs');

const { webSocket } = require('../../bin/server');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(doc, accountTransfer) {

    generateHeader(doc);
    generateCustomerInformation(doc, accountTransfer);
    accountTransferSection(doc, accountTransfer, 170);
    sourceAccountSection(doc, accountTransfer, 300);
    destinationAccountSection(doc, accountTransfer, 435);

    common.generateSignature(doc, accountTransfer.user, { linesize: 174, startLine: 80, signatureHeight: 735 });
    common.generateGenericSignature(doc, { linesize: 174, startLine: 350, signatureHeight: 735 });

    generateFooter(doc);

    if (accountTransfer.statusId === AccountTransferStatus.eStatus.get('deleted').value)
        common.addWaterMark(doc, [{ text: "ANULADA", x: 100, y: 500, rotation: 315, size: 100 }]);
};

function createSingleReport(accountTransfer, res) {

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Transferencia entre cuentas',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: true
        });

    createReport(doc, accountTransfer);

    const reportName = "tf_" + accountTransfer.client.internalCode + "_" + accountTransfer.id + ".pdf"
    // doc.end();
    // doc.pipe(fs.createWriteStream(path));

    // Set some headers
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Header to force download
    //res.setHeader('Content-disposition', 'attachment; filename=' + reportName);

    doc.pipe(res).on('finish', function () {
        console.log('PDF closed');
    });

    doc.end();

    return true;

}

function createMultipleReport(paymentOrders, res) {

    webSocket.io.emit("accountTransfersPrint", JSON.stringify({ status: 'started' }));

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Transferencia entre cuentas',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: false
        });

    for (i = 0; i < paymentOrders.length; i++) {

        const paymentOrder = paymentOrders[i];

        doc.addPage();

        createReport(doc, paymentOrder);

        let progress = Number.parseInt(Number.parseFloat((i + 1) / paymentOrders.length) * 100);

        webSocket.io.emit("accountTransfersPrint", JSON.stringify({ status: 'inprogress', progress: progress }));

        //console.log(progress.toFixed(2))
    }

    webSocket.io.emit("accountTransfersPrint", JSON.stringify({ status: 'finished' }));

    const reportName = "recibos_transferencias.pdf"

    // doc.end();
    // doc.pipe(fs.createWriteStream(path));

    // Set some headers
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Header to force download
    //res.setHeader('Content-disposition', 'attachment; filename=' + reportName);

    doc.pipe(res).on('finish', function () {
        console.log('PDF closed');
    });

    doc.end();

    return true;


}

// <----- HEADER ----->

function generateHeader(doc) {
    doc
        .image(path.join(image_folder, "aaii.png"), 50, 40, { width: 70 })
        .fillColor("#444444")
        // .fontSize(20)
        // .text("AAII", 110, 57)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("AAII Administraciones Integrales", 200, 50, { align: "right" })
        .font("Helvetica")
        .text("San Martín 136, Pilar Centro", 200, 65, { align: "right" })
        .text("Buenos Aires, B1629ETD", 200, 80, { align: "right" })
        .moveDown();
}

// <----- CUSTOMER INFORMATION ----->

function generateCustomerInformation(doc, paymentOrder) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .font("Helvetica")
        .text("Detalle de transferencia entre cuentas", 50, 125, { width: 500, align: 'center' })
}

function accountTransferSection(doc, accountTransfer, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Transferencia", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Consorcio: " + accountTransfer.client.name, 50, sectionTopOffset + 35)

        .text("Número de Identificación: " + new String("00000000" + accountTransfer.id.toString()).slice(-8), 50, sectionTopOffset + 60)
        .text("Fecha de emisión: " + common.formatDate(accountTransfer.transferDate), 250, sectionTopOffset + 60)
        .text("Estado: " + accountTransfer.status, 430, sectionTopOffset + 60)

        // .font("Helvetica-Bold")
        // .text("Importe: " + common.formatCurrency(accountTransfer.amount), 50, sectionTopOffset + 85)

        .font("Helvetica")
        .text("Comentarios: " + accountTransfer.comments, 50, sectionTopOffset + 85)

        //el importe lo repetimos en grande al final de la pagina

        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Total transferido: " + common.formatCurrency(accountTransfer.amount), 50, sectionTopOffset + 420, { align: "center" })
}

function sourceAccountSection(doc, accountTransfer, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Cuenta de Origen", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Código Interno: " + accountTransfer.sourceAccountId, 50, sectionTopOffset + 35)
        .text("Tipo de Cuenta: " + `[${accountTransfer.sourceAccount.accountType.account}] ${accountTransfer.sourceAccount.accountType.description}`, 250, sectionTopOffset + 35)

        .text("Banco: " + (accountTransfer.sourceAccount.bank != null ? accountTransfer.sourceAccount.bank.name : ""), 50, sectionTopOffset + 85)
        .text("Número de cuenta: " + (accountTransfer.sourceAccount.accountNumber != null ? accountTransfer.sourceAccount.accountNumber : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (accountTransfer.sourceAccount.cbu != null ? accountTransfer.sourceAccount.cbu : ""), 250, sectionTopOffset + 60)
}

function destinationAccountSection(doc, accountTransfer, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Cuenta de Destino", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Código Interno: " + accountTransfer.destinationAccountId, 50, sectionTopOffset + 35)
        .text("Tipo de Cuenta: " + `[${accountTransfer.destinationAccount.accountType.account}] ${accountTransfer.destinationAccount.accountType.description}`, 250, sectionTopOffset + 35)

        .text("Banco: " + (accountTransfer.destinationAccount.bank != null ? accountTransfer.destinationAccount.bank.name : ""), 50, sectionTopOffset + 85)
        .text("Número de cuenta: " + (accountTransfer.destinationAccount.accountNumber != null ? accountTransfer.destinationAccount.accountNumber : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (accountTransfer.destinationAccount.cbu != null ? accountTransfer.destinationAccount.cbu : ""), 250, sectionTopOffset + 60)
}

// <----- PIE DE PAGINA ----->

function generateFooter(doc) {

    common.generateHr(doc, doc.page.height - 60)

    doc
        .font("Helvetica")
        .fontSize(10)
        .text(common.formatDateTime(new Date)
            , doc.page.margins.left + 10, doc.page.height - 50, {
            lineBreak: false
        });

    doc
        .font("Helvetica")
        .fontSize(10)
        .text("página 1 de " + doc.bufferedPageRange().count
            , doc.page.width - doc.page.margins.right - 50, doc.page.height - 50,
            {
                align: "right",
                lineBreak: false
            }
        );
}

module.exports = {
    createSingleReport: createSingleReport,
    createMultipleReport: createMultipleReport
};
