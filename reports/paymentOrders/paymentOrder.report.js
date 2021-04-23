const PDFDocument = require("pdfkit");
const path = require("path");

const common = require('../common.report');

const PaymentOrderStatus = require('../../utils/statusMessages.util').PaymentOrder;

// const fs = require('fs');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(doc, paymentOrder) {

    generateHeader(doc);
    generateCustomerInformation(doc, paymentOrder);
    paymentOrderSection(doc, paymentOrder, 155);
    paymentReceiptSection(doc, paymentOrder, 280);
    accountingImputationSection(doc, paymentOrder, 400);
    paymentSection(doc, paymentOrder, 470);

    common.generateSignature(doc, paymentOrder.user, { linesize: 174, startLine: 80, signatureHeight: 735 });
    common.generateGenericSignature(doc, { linesize: 174, startLine: 350, signatureHeight: 735 });

    generateFooter(doc);

    if (paymentOrder.statusId === PaymentOrderStatus.eStatus.get('deleted').value)
        common.addWaterMark(doc, [{ text: "ANULADA", x: 100, y: 500, rotation: 315, size: 100 }]);
};

function createSingleReport(paymentOrder, res) {

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Orden de Pago',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: true
        });

    createReport(doc, paymentOrder);

    const reportName = "op_" + paymentOrder.paymentReceipt.client.internalCode + "_" + paymentOrder.poNumberFormatted + ".pdf"
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

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Orden de Pago',
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
    }

    const reportName = "recibos_ordenes_de_pago.pdf"

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
        .text("Orden de Pago", 50, 125, { width: 500, align: 'center' })
}

function paymentOrderSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Orden de pago", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)

        .font("Helvetica")
        .text("Consorcio: " + paymentOrder.paymentReceipt.client.name, 50, sectionTopOffset + 35)
        .text("Proveedor: " + paymentOrder.paymentReceipt.supplier.name, 50, sectionTopOffset + 60)
        .font("Helvetica-Bold")
        .text("Orden de Pago Nº: " + paymentOrder.poNumberFormatted, 50, sectionTopOffset + 85)
        .font("Helvetica")
        .text("Cód. Interno: " + ("00000000" + paymentOrder.id).slice(-8), 195, sectionTopOffset + 85)
        .text("Fecha de Pago: " + common.formatDate(paymentOrder.paymentDate), 310, sectionTopOffset + 85)

        .font("Helvetica-Bold")
        .text("Estado: " + paymentOrder.status, 440, sectionTopOffset + 85)
        .font("Helvetica")

}

function paymentReceiptSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Factura o comprobante", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Número de Factura: " + "[" + paymentOrder.paymentReceipt.receiptType.receiptType + "] " + paymentOrder.paymentReceipt.receiptNumber, 50, sectionTopOffset + 35)

        .font("Helvetica-Bold")
        .text("Importe: " + common.formatCurrency(paymentOrder.paymentReceipt.amount), 340, sectionTopOffset + 35)

        .font("Helvetica")
        .text("Fecha de emisión: " + common.formatDate(paymentOrder.paymentReceipt.emissionDate), 50, sectionTopOffset + 60)
        .text("Estado: " + paymentOrder.paymentReceipt.status, 340, sectionTopOffset + 60)
        .text("Descripción del servicio: " + paymentOrder.paymentReceipt.description, 50, sectionTopOffset + 85);
}

function accountingImputationSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Imputación contable", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Grupo de cuentas / Imputación contable: " + paymentOrder.paymentReceipt.accountingImputation.name + " - " + paymentOrder.paymentReceipt.accountingImputation.accountingGroup.name, 50, sectionTopOffset + 35)
}

function paymentSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Pago", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Tipo de cuenta: " + "[" + paymentOrder.account.accountType.account + "] " + paymentOrder.account.accountType.description, 50, sectionTopOffset + 35)
        .text("Número de cuenta: " + (paymentOrder.account.accountNumber != null ? paymentOrder.account.accountNumber : ""), 340, sectionTopOffset + 35)

        .text("Banco: " + (paymentOrder.account.bank != null ? paymentOrder.account.bank.name : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (paymentOrder.account.cbu != null ? paymentOrder.account.cbu : ""), 340, sectionTopOffset + 60)

        .text("Número de cheque: " + (paymentOrder.checkSplitted != null ? paymentOrder.checkSplitted.check.number : ""), 50, sectionTopOffset + 85)
        .text("Fecha de pago: " + (paymentOrder.checkSplitted != null ? common.formatDate(paymentOrder.checkSplitted.check.paymentDate) : ""), 340, sectionTopOffset + 85)

        .text("Importe del cheque: " + (paymentOrder.checkSplitted != null ? common.formatCurrency(paymentOrder.checkSplitted.check.amount) : ""), 50, sectionTopOffset + 110)

        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Total abonado: " + common.formatCurrency(paymentOrder.amount), 50, sectionTopOffset + 150, { align: "center" })

        .fontSize(10)
        .font("Helvetica")
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
