const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

function createInvoice(req, res, invoice, path) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });

    generateHeader(doc);
    generateCustomerInformation(doc, invoice);
    const tableConceptsHeight = generateConceptsTable(doc, invoice, 260);
    generateSecuritiesTable(doc, invoice, tableConceptsHeight + 50);
    generateFooter(doc);

    //doc.end();
    //doc.pipe(fs.createWriteStream(path));

    doc.pipe(res).on('finish', function () {
        console.log('PDF closed');
    });

    doc.end();

    return true;
}

function generateHeader(doc) {
    doc
        .image(path.join(__dirname, "..", "public", "images", "aaii.png"), 50, 45, { width: 50 })
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

function generateCustomerInformation(doc, invoice) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Recibo de cobranza provisoria", 50, 125, { width: 500, align: 'center' });

    generateHr(doc, 160);

    const customerInformationTop = 170;

    doc
        .fontSize(10)
        .font("Helvetica")
        .text("Barrio:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.client.name, 110, customerInformationTop)

        .font("Helvetica")
        .text("Fecha:", 450, customerInformationTop)
        .text(invoice.receiptDate, 490, customerInformationTop)
        .text("Propiedad:", 50, customerInformationTop + 15)
        .text(`${invoice.homeOwner.property} - ${invoice.homeOwner.name}`, 110, customerInformationTop + 15)
        .text("Recibo:", 450, customerInformationTop + 15)
        .text(("00000000" + invoice.receiptNumber).slice(-8), 490, customerInformationTop + 15)

        .moveDown();

    generateHr(doc, 205);
}

function generateConceptsTable(doc, invoice, y) {
    let i;
    const invoiceTableTop = y;

    doc
        .fontSize(14)
        .font("Helvetica")
        .text("Conceptos:", 50, 230);
    doc
        .fontSize(10)
        .font("Helvetica-Bold");

    generateTableRowConcepts(
        doc,
        invoiceTableTop,
        "Tipo",
        "Concepto",
        "Importe",
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.Concepts.length; i++) {
        const item = invoice.Concepts[i];
        const position = invoiceTableTop + (i + 1) * 30;

        generateTableRowConcepts(
            doc,
            position,
            item.type,
            item.description,
            formatCurrency(item.amount),
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + formatCurrency(invoice.amountConcepts), 400, subtotalPosition, { align: "right" });

    doc.font("Helvetica");

    return subtotalPosition;
}

function generateSecuritiesTable(doc, invoice, y) {
    let i;
    const invoiceTableTop = y;

    doc
        .fontSize(14)
        .font("Helvetica")
        .text("Conceptos:", 50, 230);
    doc
        .fontSize(10)
        .font("Helvetica-Bold");

    generateTableRowConcepts(
        doc,
        invoiceTableTop,
        "Tipo",
        "Concepto",
        "Importe",
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.Concepts.length; i++) {
        const item = invoice.Concepts[i];
        const position = invoiceTableTop + (i + 1) * 30;

        generateTableRowConcepts(
            doc,
            position,
            item.type,
            item.description,
            formatCurrency(item.amount),
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Subtotal: " + formatCurrency(invoice.amountConcepts), 400, subtotalPosition, { align: "right" });

    doc.font("Helvetica");

    return subtotalPosition;
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            formatDate(new Date),
            50,
            780,
            { align: "center", width: 500 }
        );
}

function generateTableRowConcepts(
    doc,
    y,
    item,
    description,
    amount
) {
    doc
        .fontSize(10)
        .text(item, 50, y)
        .text(description, 150, y)
        .text(amount, 450, y, { width: 90, align: "right" })
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(value) {
    return "$" + parseFloat(value).toFixed(2);
}

function formatDate(m) {
    var dateString =
        m.getUTCFullYear() + "/" +
        ("0" + (m.getUTCMonth() + 1)).slice(-2) + "/" +
        ("0" + m.getUTCDate()).slice(-2) + " " +
        ("0" + m.getUTCHours()).slice(-2) + ":" +
        ("0" + m.getUTCMinutes()).slice(-2) + ":" +
        ("0" + m.getUTCSeconds()).slice(-2);
    return dateString;
}

// function formatDate(date) {
//     const day = date.getDate();
//     const month = date.getMonth() + 1;
//     const year = date.getFullYear();

//     return day + "/" + month + "/" + year;
// }

function generateSignature(doc) {
    const lineSize = 174;
    const signatureHeight = 390;
    doc.lineWidth(1);
    doc.fillAndStroke('#021c27');
    doc.strokeOpacity(0.2);
    const startLine1 = 128;
    const endLine1 = 128 + lineSize;
    // Creates a line
    doc
        .moveTo(startLine1, signatureHeight)
        .lineTo(endLine1, signatureHeight)
        .stroke();
    // Evaluator info
    doc
        .font('fonts/NotoSansJP-Bold.otf')
        .fontSize(10)
        .fill('#021c27')
        .text(
            'John Doe',
            startLine1,
            signatureHeight + 10,
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
        .fontSize(10)
        .fill('#021c27')
        .text(
            'Associate Professor',
            startLine1,
            signatureHeight + 25,
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
    createInvoice
};
