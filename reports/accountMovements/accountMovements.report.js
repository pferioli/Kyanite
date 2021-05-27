const PDFDocument = require("pdfkit");
const path = require("path");

const CollectionStatus = require('../../utils/statusMessages.util').Collection;

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

var pageCounter = 0;

function createReport(movements, client, billingPeriod, res) {

    let doc = new PDFDocument({
        size: "A4", margin: 50, bufferPages: true, autoFirstPage: false,
        info: {
            Title: 'Detalle de movimientos',
            Author: 'AAII Administraciones Integrales', // the name of the author
            Subject: '', // the subject of the document
            Keywords: 'pdf;javascript', // keywords associated with the document
        },
    });

    doc.on('pageAdded', () => { pageCounter++; generateFooter(doc, pageCounter) });

    doc.addPage();

    generateHeader(doc);
    generateCustomerInformation(doc, movements, client, billingPeriod);

    doc.moveDown();

    let table0 = {
        headers: ['Fecha', 'Tipo', 'Importe'],
        rows: [
        ]
    };

    let accountId = undefined;

    let index = 0;

    do {

        const movement = movements[index];

        if (accountId === undefined) {

            accountId = movement.accountId; index++;

            console.log("inicio del grupo : " + accountId + " - fila : " + index);
        }

        if (movement.accountId === accountId) {
            table0.rows.push([movement.createdAt, movement.categoryName, movement.amount]); index++;
        }

        if (movement.accountId !== accountId) {

            accountId = undefined;

            console.log("fin del grupo - fila : " + index)

            createTable(doc, table0);
        }


    } while (index < movements.length);

    const reportName = "movimientos_" + client.internalCode + "_" + billingPeriod.name + ".pdf"
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

function generateCustomerInformation(doc, movements, client, billingPeriod) {

    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Detalle de movimientos", 50, 105, { width: 500, align: 'center' });

    common.generateHr(doc, 130);

    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(client.name, 50, 140, { width: 500, align: 'center' });

    doc
        .fontSize(12)
        .font("Helvetica")
        .text(`período ${billingPeriod.name} comprendido entre ${billingPeriod.startDate} y ${billingPeriod.endDate}`, 50, 160, { width: 500, align: 'center' });

    common.generateHr(doc, 180);

    doc.moveDown();
}

// <----- PIE DE PAGINA ----->

function generateFooter(doc, pageCounter) {

    common.generateHr(doc, doc.page.height - 60)

    doc
        .fontSize(10)
        .text(common.formatDateTime(new Date)
            , doc.page.margins.left + 10, doc.page.height - 50, {
            lineBreak: false
        });

    doc
        .fontSize(10)
        .text(`pagina ${pageCounter}` // de ${doc.bufferedPageRange().count
            , doc.page.width - doc.page.margins.right - 50, doc.page.height - 50,
            {
                align: "right",
                lineBreak: false
            }
        );
}

function createTable(doc, table) {

    let startX = doc.page.margins.left, startY = doc.y;

    const usableWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right);

    const columnCount = table.headers.length, columnSpacing = 15, rowSpacing = 5;

    const columnContainerWidth = usableWidth / columnCount;

    const columnWidth = columnContainerWidth - columnSpacing;

    const maxY = doc.page.height - doc.page.margins.bottom;

    let rowBottomY = 0;

    const computeRowHeight = (row) => {
        let result = 0;

        row.forEach((cell) => {
            const cellHeight = doc.heightOfString(cell, {
                width: columnWidth,
                align: 'left'
            });
            result = Math.max(result, cellHeight);
        });

        return result + rowSpacing;
    };

    // Check to have enough room for header and first rows
    if (startY + 3 * computeRowHeight(table.headers) > maxY)
        this.addPage();

    // Print all headers
    table.headers.forEach((header, i) => {
        doc.text(header, startX + i * columnContainerWidth, startY, {
            width: columnWidth,
            align: 'left'
        });
    });

    // Refresh the y coordinate of the bottom of the headers row
    rowBottomY = Math.max(startY + computeRowHeight(table.headers), rowBottomY);

    // Separation line between headers and rows
    doc.moveTo(startX, rowBottomY - rowSpacing * 0.5)
        .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
        .lineWidth(2)
        .stroke();

}

module.exports = {
    createReport: createReport
};
