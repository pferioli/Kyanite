const PDFDocument = require("pdfkit");
const path = require("path");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

const _ = require("underscore");

async function createReport(collections, res) {

    let doc = new PDFDocument(
        {
            size: [595.28, 420.945],
            margins: {
                top: 30, bottom: 30, left: 30, right: 30
            },
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Recibo de Cobranza',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: false
        });

    for (i = 0; i < collections.length; i++) {

        const collection = collections[i];

        doc.addPage();

        generateFrame(doc);

        generateHeader(doc, collection)

        generateMessage(doc, collection);

        const qrURL = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(collection.collection.securityCode);

        const qrImage = await fetchImage(qrURL);

        doc.image(qrImage, 490, 110, { width: 55, height: 55 });

        doc.fontSize(7)
            .font("Helvetica")
            .text("CÓDIGO DE SEGURIDAD: " + collection.collection.securityCode, 330, 375, { width: 300, align: "left" });

        common.generateSignature(doc, collection.collection.user, { linesize: 174, startLine: 50, signatureHeight: 350 });

        generateConceptsTable(doc, collection, 185);

        generateSecuritiesTable(doc, collection, 185);

        generateFooter(doc);
    };

    const reportName = "recibos_cobranzas.pdf"

    //doc.end();
    //doc.pipe(fs.createWriteStream(path));

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

const fetchImage = async (src) => {

    const fetch = require('node-fetch');

    const response = await fetch(src);

    const image = await response.buffer();

    return image;
};

function generateFrame(doc) {

    doc.lineWidth(1)
        .rect(30, 30, 535, 360)
        .stroke();

    doc.moveTo(30, 100)
        .lineTo(565, 100)
        .stroke();
}

// <----- HEADER ----->

function generateHeader(doc, collection) {

    doc
        .image(path.join(image_folder, "aaii.png"), 40, 40, { width: 50 })
        .fillColor("#444444")

        .fontSize(8)
        .font("Helvetica")
        .text("RECIBO DE COBRANZA", 50, 40, { width: 420, align: "center" });

    doc.fontSize(11)
        .font("Helvetica-Bold")
        .text(collection.collection.client.name, 50, 58, { width: 420, align: "center" });

    doc.fontSize(7)
        .font("Helvetica")
        .text(`C.U.I.T. ${collection.collection.client.cuit} - ${collection.collection.client.address}, ${collection.collection.client.city} (${collection.collection.client.zipCode})`,
            50, 75, { width: 420, align: "center" });


    let receiptNumber = ("0000000000" + collection.collection.receiptNumber).slice(-8);

    if (collection.receiptNumber !== null) {
        receiptNumber = receiptNumber + "-" + ("0000" + collection.receiptNumber).slice(-4);
    }

    doc.fontSize(12)
        .font("Helvetica-Bold")
        .text("Nº " + receiptNumber, 440, 40, { width: 110, align: "center" });

    doc.fontSize(12)
        .font("Helvetica-Bold")
        .text(common.formatDate(collection.collection.receiptDate), 440, 62, { width: 110, align: "center" });

    doc.fontSize(8)
        .font("Helvetica")
        .text("ORIGINAL", 440, 85, { width: 110, align: "center" });

    doc.moveDown();
}

// <----- CUSTOMER INFORMATION ----->

function generateMessage(doc, collection) {

    let amount = collection.collection.amountSecurities;

    if (collection.receiptNumber !== null) {
        amount = collection.amount;
    }

    doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Recibimos de los siguientes titulares de la Unidad Funcional ${collection.homeOwner.property} de ${collection.homeOwner.name} la cantidad de pesos ${common.formatCurrency(amount)} percibidos por los conceptos detallados y con los valores que se describen a continuación:`,
            45, 120, { width: 400, align: 'justify' })

        .moveDown();
}

// <----- CONCEPTOS ----->

function generateConceptsTable(doc, collection, y) {

    let i; const x = 50;

    doc.font("Helvetica-Bold");

    generateTableRowConcepts(doc, y, ["Concepto", "Importe"]);

    doc
        .opacity(1)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(x, y + 15)
        .lineTo(x + 160, y + 15)
        .stroke();

    doc.font("Helvetica");

    let subTotal = collection.collection.amountConcepts;

    for (i = 0; i < collection.collection.Concepts.length; i++) {
        const item = collection.collection.Concepts[i];
        const position = y + (i + 1) * 20;

        let amount = item.amount;

        if (collection.receiptNumber !== null) {
            amount = collection.amount; subTotal = collection.amount;
        }
        generateTableRowConcepts(doc, position, [item.description, common.formatCurrency(amount)]);

        doc
            .opacity(1)
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(x, position + 15)
            .lineTo(x + 160, position + 15)
            .stroke();
    }

    const subtotalPosition = y + (i + 1) * 20;

    doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("Total en Conceptos: ", 50, subtotalPosition)
        .text(common.formatCurrency(subTotal), 150, subtotalPosition, { width: 70, align: 'left' });

    doc.font("Helvetica");
}

function generateTableRowConcepts(doc, y, rowItem) {
    doc
        .fontSize(8)
        .text(rowItem[0], 50, y)
        .text(rowItem[1], 150, y, { width: 70, align: "left" })
}

// <----- VALORES ----->

function generateSecuritiesTable(doc, collection, y) {

    let i; const x = 240;

    doc.font("Helvetica-Bold");

    generateTableRowValues(doc, x, y, ["Valor", "Cta.", "Detalle", "Importe"]);

    doc
        .opacity(1)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(x, y + 15)
        .lineTo(x + 300, y + 15)
        .stroke();

    doc.font("Helvetica");

    let subTotal = collection.collection.amountSecurities;

    for (i = 0; i < collection.collection.Securities.length; i++) {

        const item = collection.collection.Securities[i];
        const position = y + (i + 1) * 20;

        let valueDesc = ""; let description = "";

        switch (item.type) {
            case 'EF': { valueDesc = "Efectivo"; description = description = `${item.account.accountType.description}`; } break;
            case 'DC': { valueDesc = "Depósito en Cuenta"; description = `CBU: ${item.account.cbu}`; } break;
            case 'CH': { valueDesc = "Cheque"; description = `Nº ${item.checkSplitted.check.number} ($${item.checkSplitted.check.amount}) ${common.formatDate(new Date(item.checkSplitted.check.paymentDate))}`; } break;
        }

        let amount = item.amount;

        if (collection.receiptNumber !== null) {
            amount = collection.amount; subTotal = collection.amount;
        }

        generateTableRowValues(doc, x, position, [valueDesc, item.account.accountType.account, description, common.formatCurrency(amount)]);

        doc
            .opacity(1)
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(x, position + 15)
            .lineTo(x + 300, position + 15)
            .stroke();
    }

    const subtotalPosition = y + (i + 1) * 20;

    doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("Total en Valores: ", x, subtotalPosition)
        .text(common.formatCurrency(subTotal), x + 240, subtotalPosition, { width: 70, align: 'left' });

    doc.font("Helvetica");

    return subtotalPosition;
}

function generateTableRowValues(doc, x, y, rowItem) {
    doc
        .fontSize(8)
        .text(rowItem[0], x, y)
        .text(rowItem[1], x + 85, y)
        .text(rowItem[2], x + 111, y)
        .text(rowItem[3], x + 240, y, { width: 70, align: "left" })
}

// <----- PIE DE PAGINA ----->

function generateFooter(doc) {

    doc.fontSize(7)
        .font("Helvetica")

        .text("1 - En el caso de abonar con cheques quedará sujeto la imputación a la acreditación efectiva de fondos en cuenta.",
            250, 325, { width: 300, align: "left" })

        .text("2- De existir deudas de períodos anteriores, la imputación de este monto será aplicada a la cancelación de intereses y capitales mas antigüos.",
            250, 350, { width: 300, align: "left" });
}

module.exports = {
    createReport: createReport
};
