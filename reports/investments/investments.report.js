const PDFDocument = require("pdfkit");
const path = require("path");

const common = require('../common.report');

const InvestmentsStatus = require('../../utils/statusMessages.util').Investments;

// const fs = require('fs');

const { webSocket } = require('../../bin/server');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(doc, investment) {

    generateHeader(doc);
    generateCustomerInformation(doc, investment);
    investmentSection(doc, investment, 170);
    sourceAccountSection(doc, investment, 350);
    destinationAccountSection(doc, investment, 485);

    common.generateSignature(doc, investment.user, { linesize: 174, startLine: 80, signatureHeight: 735 });
    common.generateGenericSignature(doc, { linesize: 174, startLine: 350, signatureHeight: 735 });

    generateFooter(doc);

    if (investment.statusId === InvestmentsStatus.eStatus.get('cancelled').value) {
        common.addWaterMark(doc, [{ text: "ANULADA", x: 100, y: 500, rotation: 315, size: 100 }]);
    } else {
        if (investment.statusId !== InvestmentsStatus.eStatus.get('accredited').value)
            common.addWaterMark(doc, [{ text: "NO ACREDITADO", x: 50, y: 580, rotation: 315, size: 80 }]);
    }

};

function createSingleReport(investment, res) {

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Detalle de Inversión',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: true
        });

    createReport(doc, investment);

    const reportName = "in_" + investment.client.internalCode + "_" + investment.id + ".pdf"
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

function createMultipleReport(investments, res) {

    webSocket.io.emit("investmentsPrint", JSON.stringify({ status: 'started' }));

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Detalle de Inversión',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: false
        });

    for (i = 0; i < investments.length; i++) {

        const paymentOrder = investments[i];

        doc.addPage();

        createReport(doc, paymentOrder);

        let progress = Number.parseInt(Number.parseFloat((i + 1) / investments.length) * 100);

        webSocket.io.emit("investmentsPrint", JSON.stringify({ status: 'inprogress', progress: progress }));

        //console.log(progress.toFixed(2))
    }

    webSocket.io.emit("investmentsPrint", JSON.stringify({ status: 'finished' }));

    const reportName = "recibos_inversiones.pdf"

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
        .text("Detalle de inversiones", 50, 125, { width: 500, align: 'center' })
}

function investmentSection(doc, investment, y) {

    const sectionTopOffset = y; const totalAmount = parseFloat(investment.amount) + parseFloat(investment.interests);

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Inversión", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Consorcio: " + investment.client.name, 50, sectionTopOffset + 35)

        .text("Número de Identificación: " + new String("00000000" + investment.id.toString()).slice(-8), 50, sectionTopOffset + 60)
        .text("Tipo: " + investment.comments, 250, sectionTopOffset + 60)

        .text("Fecha de creación: " + common.formatDate(investment.creationDate), 50, sectionTopOffset + 85)
        .text("Fecha de vencimiento: " + common.formatDate(investment.expirationDate), 250, sectionTopOffset + 85)

        .font("Helvetica-Bold")
        .text("Importe de origen: " + common.formatCurrency(investment.amount), 50, sectionTopOffset + 110)
        .text("Intereses: " + common.formatCurrency(investment.interests), 250, sectionTopOffset + 110)
        .text("Estado: " + investment.status, 430, sectionTopOffset + 110)

        .font("Helvetica")
        .text("Comentarios: " + investment.comments, 50, sectionTopOffset + 135)

        //el importe lo repetimos en grande al final de la pagina

        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Total: " + common.formatCurrency(totalAmount), 50, sectionTopOffset + 450, { align: "center" })
}

function sourceAccountSection(doc, investment, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Cuenta de Origen", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Código Interno: " + investment.sourceAccountId, 50, sectionTopOffset + 35)
        .text("Tipo de Cuenta: " + `[${investment.sourceAccount.accountType.account}] ${investment.sourceAccount.accountType.description}`, 250, sectionTopOffset + 35)

        .text("Banco: " + (investment.sourceAccount.bank != null ? investment.sourceAccount.bank.name : ""), 50, sectionTopOffset + 85)
        .text("Número de cuenta: " + (investment.sourceAccount.accountNumber != null ? investment.sourceAccount.accountNumber : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (investment.sourceAccount.cbu != null ? investment.sourceAccount.cbu : ""), 250, sectionTopOffset + 60)
}

function destinationAccountSection(doc, investment, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Cuenta de Destino", 50, sectionTopOffset);

    common.generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Código Interno: " + investment.destinationAccountId, 50, sectionTopOffset + 35)
        .text("Tipo de Cuenta: " + `[${investment.destinationAccount.accountType.account}] ${investment.destinationAccount.accountType.description}`, 250, sectionTopOffset + 35)

        .text("Banco: " + (investment.destinationAccount.bank != null ? investment.destinationAccount.bank.name : ""), 50, sectionTopOffset + 85)
        .text("Número de cuenta: " + (investment.destinationAccount.accountNumber != null ? investment.destinationAccount.accountNumber : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (investment.destinationAccount.cbu != null ? investment.destinationAccount.cbu : ""), 250, sectionTopOffset + 60)
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
