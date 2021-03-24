const PDFDocument = require("pdfkit");
const path = require("path");
const dateFormat = require("dateformat");

// const fs = require('fs');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(paymentOrder, res) {

    let doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });

    generateHeader(doc);
    generateCustomerInformation(doc, paymentOrder);
    paymentOrderSection(doc, paymentOrder, 155);
    paymentReceiptSection(doc, paymentOrder, 280);
    accountingImputationSection(doc, paymentOrder, 400);
    paymentSection(doc, paymentOrder, 470);
    generateSignature(doc, paymentOrder.user);
    generateSupplierSignature(doc);
    generateFooter(doc);

    const reportName = "op_" + paymentOrder.paymentReceipt.client.internalCode + "_" + paymentOrder.poNumberFormatted + ".pdf"
    // doc.end();
    // doc.pipe(fs.createWriteStream(path));

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

    generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)

        .font("Helvetica")
        .text("Consorcio: " + paymentOrder.paymentReceipt.client.name, 50, sectionTopOffset + 35)
        .text("Proveedor: " + paymentOrder.paymentReceipt.supplier.name, 50, sectionTopOffset + 60)
        .font("Helvetica-Bold")
        .text("Orden de Pago Nº: " + paymentOrder.poNumberFormatted, 50, sectionTopOffset + 85)
        .font("Helvetica")
        .text("Cód. Interno: " + ("00000000" + paymentOrder.id).slice(-8), 200, sectionTopOffset + 85)
        .text("Fecha de Pago: " + formatDate(paymentOrder.paymentDate), 320, sectionTopOffset + 85)
        .text("Estado: " + paymentOrder.status, 460, sectionTopOffset + 85)
}

function paymentReceiptSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Factura o comprobante", 50, sectionTopOffset);

    generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Número de Factura: " + "[" + paymentOrder.paymentReceipt.receiptType.receiptType + "] " + paymentOrder.paymentReceipt.receiptNumber, 50, sectionTopOffset + 35)

        .font("Helvetica-Bold")
        .text("Importe: " + formatCurrency(paymentOrder.paymentReceipt.amount), 340, sectionTopOffset + 35)
        .font("Helvetica")

        .text("Fecha de emisión: " + formatDate(paymentOrder.paymentReceipt.emissionDate), 50, sectionTopOffset + 60)
        .text("Estado: " + paymentOrder.paymentReceipt.status, 340, sectionTopOffset + 60)
        .text("Descripción del servicio: " + paymentOrder.paymentReceipt.description, 50, sectionTopOffset + 85);
}

function accountingImputationSection(doc, paymentOrder, y) {

    const sectionTopOffset = y;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Imputación contable", 50, sectionTopOffset);

    generateHr(doc, sectionTopOffset + 20);

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

    generateHr(doc, sectionTopOffset + 20);

    doc
        .fontSize(10)
        .font("Helvetica")

        .text("Tipo de cuenta: " + "[" + paymentOrder.account.accountType.account + "] " + paymentOrder.account.accountType.description, 50, sectionTopOffset + 35)
        .text("Número de cuenta: " + (paymentOrder.account.accountNumber != null ? paymentOrder.account.accountNumber : ""), 340, sectionTopOffset + 35)

        .text("Banco: " + (paymentOrder.account.bank != null ? paymentOrder.account.bank.name : ""), 50, sectionTopOffset + 60)
        .text("CBU: " + (paymentOrder.account.cbu != null ? paymentOrder.account.cbu : ""), 340, sectionTopOffset + 60)

        .text("Número de cheque: " + (paymentOrder.checkSplitted != null ? paymentOrder.checkSplitted.check.number : ""), 50, sectionTopOffset + 85)
        .text("Fecha de pago: " + (paymentOrder.checkSplitted != null ? formatDate(paymentOrder.checkSplitted.check.paymentDate) : ""), 340, sectionTopOffset + 85)

        .text("Importe del cheque: " + (paymentOrder.checkSplitted != null ? formatCurrency(paymentOrder.checkSplitted.check.amount) : ""), 50, sectionTopOffset + 110)

        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Total abonado: " + formatCurrency(paymentOrder.amount), 50, sectionTopOffset + 150, { align: "center" })

        .fontSize(10)
        .font("Helvetica")
}

// <----- PIE DE PAGINA ----->

function generateFooter(doc) {

    generateHr(doc, doc.page.height - 60)

    doc
        .font("Helvetica")
        .fontSize(10)
        .text(formatDateTime(new Date)
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
    const startLine1 = 80;
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

function generateSupplierSignature(doc) {

    const lineSize = 174;
    const startLine1 = 350;
    const endLine1 = startLine1 + lineSize;
    const signatureHeight = 735;

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
            "firma del proveedor",
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
    // doc
    //     .font('fonts/NotoSansJP-Light.otf')
    //     .fontSize(8)
    //     .fill('#021c27')
    //     .text(
    //         user.email,
    //         startLine1,
    //         signatureHeight + 20,
    //         {
    //             columns: 1,
    //             columnGap: 0,
    //             height: 40,
    //             width: lineSize,
    //             align: 'center',
    //         }
    //     );
}

module.exports = {
    createReport: createReport
};
