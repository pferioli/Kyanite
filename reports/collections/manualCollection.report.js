const PDFDocument = require("pdfkit");
const path = require("path");
const dateFormat = require("dateformat");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(collection, res) {

    let doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

    generateHeader(doc);
    generateCustomerInformation(doc, collection);
    const tableConceptsHeight = generateConceptsTable(doc, collection, 240);
    const tableSecuritiesHeight = generateSecuritiesTable(doc, collection, tableConceptsHeight + 45);
    generateSignature(doc, collection.user);
    generateFooter(doc);

    const reportName = "cobranza_" + collection.client.internalCode + "_" + collection.homeOwner.property + "_" + collection.receiptNumber + ".pdf"
    //doc.end();
    //doc.pipe(fs.createWriteStream(path));

    // Set some headers
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Header to force download
    res.setHeader('Content-disposition', 'attachment; filename=' + reportName);

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
        .text("Recibo de cobranza provisoria", 50, 125, { width: 500, align: 'center' });


    const customerInformationTop = 170;

    generateHr(doc, customerInformationTop);

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Barrio:", 50, customerInformationTop + 10)
        .font("Helvetica-Bold")
        .text(collection.client.name, 110, customerInformationTop + 10)

        .font("Helvetica")
        .text("Fecha:", 450, customerInformationTop + 10)
        .text(collection.receiptDate, 490, customerInformationTop + 10)
        .text("Propiedad:", 50, customerInformationTop + 25)
        .text(`${collection.homeOwner.property} - ${collection.homeOwner.name}`, 110, customerInformationTop + 25)
        .text("Recibo:", 450, customerInformationTop + 25)
        .text(("00000000" + collection.receiptNumber).slice(-8), 490, customerInformationTop + 25)

        .moveDown();

    generateHr(doc, 215);
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
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < collection.Concepts.length; i++) {
        const item = collection.Concepts[i];
        const position = invoiceTableTop + (i + 1) * 30;

        generateTableRowConcepts(
            doc,
            position,
            [item.description, formatCurrency(item.amount)]
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + formatCurrency(collection.amountConcepts), 400, subtotalPosition, { align: "right" });

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
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < collection.Securities.length; i++) {
        const item = collection.Securities[i];
        const position = invoiceTableTop + (i + 1) * 30;

        let valueDesc = ""; let description = "";

        switch (collection.Securities[i].type) {
            case 'EF': { valueDesc = "Efectivo"; description = description = `${item.account.accountType.description}`; } break;
            case 'DC': { valueDesc = "Deposito en Cuenta"; description = `CBU: ${item.account.cbu}`; } break;
            case 'CH': { valueDesc = "Cheque"; description = `Nº ${item.checkSplitted.check.number} ($${item.checkSplitted.check.amount}) ${formatDate(new Date(item.checkSplitted.check.paymentDate))}`; } break;
        }

        generateTableRowValues(
            doc,
            position,
            [valueDesc, item.account.accountType.account, description, formatCurrency(item.amount)]
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + formatCurrency(collection.amountSecurities), 400, subtotalPosition, { align: "right" });

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

    generateHr(doc, doc.page.height - 60)

    doc
        .fontSize(10)
        .text(formatDateTime(new Date)
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

// ----------------------------------
// <----- FUNCIONES AUXILIARES ----->
// ----------------------------------

function generateHr(doc, y) {
    doc
        .opacity(1)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(number) {
    return new Intl.NumberFormat('es',
        { currency: 'ARS', style: 'currency', currencyDisplay: 'narrowSymbol', /*currencyDisplay: "symbol"*/ }).format(number);
}

function formatDateTime(date) {
    return dateFormat(date, "HH:MM:ss dd/mm/yyyy");;
}

function formatDate(date) {
    return dateFormat(date, "dd/mm/yyyy");
}

function generateSignature(doc, user) {

    const lineSize = 174;
    const startLine1 = 350;
    const endLine1 = startLine1 + lineSize;
    const signatureHeight = 735;

    if (user.userSignature)
        doc.image(user.userSignature.image, (startLine1 + (lineSize / 2) - (150 / 2)), signatureHeight - 60, { width: 150 })

    doc
        .lineWidth(1)
        .dash(5, { space: 5 })
        .fillAndStroke('#021c27')
        .strokeOpacity(0.2);

    // Creates a line
    doc
        .moveTo(startLine1, signatureHeight)
        .lineTo(endLine1, signatureHeight)
        .stroke();

    doc.undash();

    // Evaluator info
    doc
        .font('fonts/NotoSansJP-Bold.otf')
        .fontSize(8)
        .fill('#021c27')
        .text(
            user.name,
            startLine1,
            signatureHeight + 5,
            {
                columns: 1,
                columnGap: 0,
                height: 40,
                width: lineSize,
                align: 'center',
            }
        );
    doc
        .font('fonts/NotoSansJP-Light.otf')
        .fontSize(8)
        .fill('#021c27')
        .text(
            user.email,
            startLine1,
            signatureHeight + 20,
            {
                columns: 1,
                columnGap: 0,
                height: 40,
                width: lineSize,
                align: 'center',
            }
        );
}
module.exports = {
    createReport: createReport
};
