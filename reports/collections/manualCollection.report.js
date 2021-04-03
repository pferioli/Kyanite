const PDFDocument = require("pdfkit");
const path = require("path");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

function createReport(collection, res) {

    let doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

    generateHeader(doc);
    generateCustomerInformation(doc, collection);

    let tableConceptsVerticalOffset = 0;

    if (collection.Properties.length > 1) {
        const tablePropertiesHeight = generatePropertiesTable(doc, collection, 240); tableConceptsVerticalOffset = tablePropertiesHeight + 45;
    } else {
        tableConceptsVerticalOffset = 240;
    }

    const tableConceptsHeight = generateConceptsTable(doc, collection, tableConceptsVerticalOffset);
    const tableSecuritiesHeight = generateSecuritiesTable(doc, collection, tableConceptsHeight + 45);

    common.generateSignature(doc, collection.user, { linesize: 174, startLine: 80, signatureHeight: 735 });
    generateFooter(doc);

    const reportName = "cobranza_" + collection.client.internalCode + "_" + collection.Properties[0].homeOwner.property + "_" + collection.receiptNumber + ".pdf"
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

// <----- HEADER ----->

function generateHeader(doc, collection) {
    doc
        .image(path.join(image_folder, "aaii.png"), 50, 45, { width: 50 })
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

function generateCustomerInformation(doc, collection) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Recibo provisorio de cobranza", 50, 125, { width: 500, align: 'center' });


    const customerInformationTop = 170;

    common.generateHr(doc, customerInformationTop);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Barrio:", 50, customerInformationTop + 10)
        .font("Helvetica-Bold")
        .text(collection.client.name, 110, customerInformationTop + 10)

        .font("Helvetica")
        .text("Fecha:", 450, customerInformationTop + 10)
        .text(collection.receiptDate, 490, customerInformationTop + 10);

    if (collection.Properties.length === 1) {
        doc
            .text("Propiedad:", 50, customerInformationTop + 25)
            .text(`${collection.Properties[0].homeOwner.property} - ${collection.Properties[0].homeOwner.name}`, 110, customerInformationTop + 25);
    }

    doc
        .text("Recibo:", 450, customerInformationTop + 25)
        .text(("00000000" + collection.receiptNumber).slice(-8), 490, customerInformationTop + 25)

        .moveDown();

    common.generateHr(doc, 215);
}

// <----- PROPIEDADES ----->

function generatePropertiesTable(doc, collection, y) {
    let i;
    const invoiceTableTop = y; let subTotal = 0;

    doc
        .fontSize(10)
        .font("Helvetica-Bold");

    generateTableRowProperties(
        doc,
        invoiceTableTop,
        ["Propiedad", "Propietario", "Recibo Parcial", "Importe"]
    );

    common.generateHr(doc, invoiceTableTop + 20);

    doc.font("Helvetica");

    for (i = 0; i < collection.Properties.length; i++) {
        const item = collection.Properties[i];
        const position = invoiceTableTop + (i + 1) * 30;
        subTotal += parseFloat(item.amount);

        generateTableRowProperties(
            doc,
            position,
            [
                item.homeOwner.property,
                item.homeOwner.name,
                item.receiptNumber != null ? receiptNumber = ("00000000" + collection.receiptNumber).slice(-8) + "-" + ("0000" + item.receiptNumber).slice(-4) : "",
                common.formatCurrency(item.amount)]
        );

        common.generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + common.formatCurrency(subTotal), 400, subtotalPosition, { align: "right" });

    return subtotalPosition;
}

function generateTableRowProperties(
    doc,
    y,
    rowItem
) {
    doc
        .fontSize(10)
        .text(rowItem[0], 50, y)
        .text(rowItem[1], 130, y)
        .text(rowItem[2], 390, y)
        .text(rowItem[3], 450, y, { width: 90, align: "right" })
}

// <----- CONCEPTOS ----->

function generateConceptsTable(doc, collection, y) {
    let i;
    const invoiceTableTop = y;

    doc
        .fontSize(10)
        .font("Helvetica-Bold");

    generateTableRowConcepts(
        doc,
        invoiceTableTop,
        ["Concepto", "Importe"]
    );

    common.generateHr(doc, invoiceTableTop + 20);

    doc.font("Helvetica");

    for (i = 0; i < collection.Concepts.length; i++) {
        const item = collection.Concepts[i];
        const position = invoiceTableTop + (i + 1) * 30;

        generateTableRowConcepts(
            doc,
            position,
            [item.description, common.formatCurrency(item.amount)]
        );

        common.generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + common.formatCurrency(collection.amountConcepts), 400, subtotalPosition, { align: "right" });

    doc.font("Helvetica");

    return subtotalPosition;
}

function generateTableRowConcepts(
    doc,
    y,
    rowItem
) {
    doc
        .fontSize(10)
        .text(rowItem[0], 50, y)
        .text(rowItem[1], 450, y, { width: 90, align: "right" })
}

// <----- VALORES ----->

function generateSecuritiesTable(doc, collection, y) {
    let i;
    const invoiceTableTop = y;

    doc
        .fontSize(10)
        .font("Helvetica-Bold");

    generateTableRowValues(
        doc,
        invoiceTableTop,
        ["Valor", "Cuenta", "Detalle", "Importe"]
    );

    common.generateHr(doc, invoiceTableTop + 20);

    doc.font("Helvetica");

    for (i = 0; i < collection.Securities.length; i++) {
        const item = collection.Securities[i];
        const position = invoiceTableTop + (i + 1) * 30;

        let valueDesc = ""; let description = "";

        switch (collection.Securities[i].type) {
            case 'EF': { valueDesc = "Efectivo"; description = description = `${item.account.accountType.description}`; } break;
            case 'DC': { valueDesc = "Depósito en Cuenta"; description = `CBU: ${item.account.cbu}`; } break;
            case 'CH': { valueDesc = "Cheque"; description = `Nº ${item.checkSplitted.check.number} ($${item.checkSplitted.check.amount}) ${common.formatDate(new Date(item.checkSplitted.check.paymentDate))}`; } break;
        }

        generateTableRowValues(
            doc,
            position,
            [valueDesc, item.account.accountType.account, description, common.formatCurrency(item.amount)]
        );

        common.generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + common.formatCurrency(collection.amountSecurities), 400, subtotalPosition, { align: "right" });

    doc.font("Helvetica");

    return subtotalPosition;
}

function generateTableRowValues(
    doc,
    y,
    rowItem
) {
    doc
        .fontSize(10)
        .text(rowItem[0], 50, y)
        .text(rowItem[1], 160, y)
        .text(rowItem[2], 220, y)
        .text(rowItem[3], 450, y, { width: 90, align: "right" })
}

// <----- PIE DE PAGINA ----->

function generateFooter(doc) {

    common.generateHr(doc, doc.page.height - 60)

    doc
        .fontSize(10)
        .text(common.formatDateTime(new Date)
            , doc.page.margins.left + 10, doc.page.height - 50, {
            lineBreak: false
        });

    doc
        .fontSize(10)
        .text("pagina 1 de " + doc.bufferedPageRange().count
            , doc.page.width - doc.page.margins.right - 50, doc.page.height - 50,
            {
                align: "right",
                lineBreak: false
            }
        );
}

module.exports = {
    createReport: createReport
};
