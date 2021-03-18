const PDFDocument = require("pdfkit");
const path = require("path");
const dateFormat = require("dateformat");

// const fs = require('fs');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(paymentOrder, res) {

    let doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

    generateHeader(doc);
    generateCustomerInformation(doc, paymentOrder);
    paymentOrderSection(doc, paymentOrder, 180);
    paymentReceiptSection(doc, paymentOrder, 310);

    //const tablePaymentOrderHeight = generatePaymentOrderTable(doc, paymentOrder, 240);

    // const tableSecuritiesHeight = generateSecuritiesTable(doc, collection, tableConceptsHeight + 45);
    generateSignature(doc, paymentOrder.user);
    generateFooter(doc);

    const reportName = "op_" + paymentOrder.paymentReceipt.client.internalCode + "_" + paymentOrder.poNumberFormatted + ".pdf"
    // doc.end();
    // doc.pipe(fs.createWriteStream(path));

    // Set some headers
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // // Header to force download
    // res.setHeader('Content-disposition', 'attachment; filename=' + reportName);

    doc.pipe(res).on('finish', function () {
        console.log('PDF closed');
    });

    doc.end();

    return true;
}

// <----- HEADER ----->

function generateHeader(doc) {
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
        .text("Detalles de la orden de pago", 50, sectionTopOffset);

    generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)

        .font("Helvetica-Bold")
        .font("Helvetica")
        .text("Proveedor: ", 50, sectionTopOffset + 35)

        .font("Helvetica-Bold")
        .text(paymentOrder.paymentReceipt.supplier.name, 105, sectionTopOffset + 35)

        .font("Helvetica")
        .text("Consorcio: " + paymentOrder.paymentReceipt.client.name, 50, sectionTopOffset + 60)

        .text("Número de Orden:", 50, sectionTopOffset + 85)
        .text("Código Interno:", 200, sectionTopOffset + 85)
        .text("Fecha:", 350, sectionTopOffset + 85);
}

function paymentReceiptSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Detalles de la factura o comprobante", 50, sectionTopOffset);

    generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Tipo:", 50, sectionTopOffset + 35)
        .text("Número:", 200, sectionTopOffset + 35)
        .text("Fecha Recepcion:", 350, sectionTopOffset + 35)

        .text("Descripción del servicio:", 50, sectionTopOffset + 60);
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
