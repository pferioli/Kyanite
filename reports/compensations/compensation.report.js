const PDFDocument = require("pdfkit");
const path = require("path");

const common = require('../common.report');

const PaymentOrderStatus = require('../../utils/statusMessages.util').PaymentOrder;

// const fs = require('fs');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(doc, compensation) {

    generateHeader(doc);
    generateCustomerInformation(doc, compensation);
    compensationSection(doc, compensation, 180);
    accountingImputationSection(doc, compensation, 340);
    paymentSection(doc, compensation, 430);

    common.generateSignature(doc, compensation.user, { linesize: 174, startLine: 80, signatureHeight: 735 });
    common.generateGenericSignature(doc, { linesize: 174, startLine: 350, signatureHeight: 735 });

    generateFooter(doc);

    if (compensation.statusId === PaymentOrderStatus.eStatus.get('deleted').value)
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

function generateCustomerInformation(doc, compensation) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .font("Helvetica")
        .text("Recibo de Compensación", 50, 125, { width: 500, align: 'center' })
}

function compensationSection(doc, compensation, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Compensación", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)

        .font("Helvetica")
        .text("Consorcio: " + compensation.client.name, 50, sectionTopOffset + 35)
        .text("Descripción: " + compensation.comments, 50, sectionTopOffset + 60)
        .font("Helvetica-Bold")
        .text("Compensación Nº: " + compensation.receiptNumberFormatted, 50, sectionTopOffset + 85)
        .font("Helvetica")
        .text("Cód. Interno: " + ("00000000" + compensation.id).slice(-8), 250, sectionTopOffset + 85)
        .text("Fecha: " + common.formatDate(compensation.emissionDate), 440, sectionTopOffset + 85)

        .font("Helvetica-Bold")
        .text("Estado: " + compensation.status, 50, sectionTopOffset + 110)
        .font("Helvetica")

}

function accountingImputationSection(doc, compensation, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Imputación contable", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Grupo de cuentas / Imputación contable: " + compensation.accountingImputation.name + " - " + compensation.accountingImputation.accountingGroup.name, 50, sectionTopOffset + 35)
}

function paymentSection(doc, compensation, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Pago", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Tipo de cuenta: " + "[" + compensation.account.accountType.account + "] " + compensation.account.accountType.description, 50, sectionTopOffset + 35)
        .text("Número de cuenta: " + (compensation.account.accountNumber != null ? compensation.account.accountNumber : ""), 340, sectionTopOffset + 35)

        .text("Banco: " + (compensation.account.bank != null ? compensation.account.bank.name : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (compensation.account.cbu != null ? compensation.account.cbu : ""), 340, sectionTopOffset + 60)

        // .text("Número de cheque: " + (compensation.checkSplitted != null ? compensation.checkSplitted.check.number : ""), 50, sectionTopOffset + 85)
        // .text("Fecha de pago: " + (compensation.checkSplitted != null ? common.formatDate(compensation.checkSplitted.check.paymentDate) : ""), 340, sectionTopOffset + 85)
        // .text("Importe del cheque: " + (compensation.checkSplitted != null ? common.formatCurrency(compensation.checkSplitted.check.amount) : ""), 50, sectionTopOffset + 110)

        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Total abonado: " + common.formatCurrency(compensation.amount), 50, sectionTopOffset + 150, { align: "center" })

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
};
