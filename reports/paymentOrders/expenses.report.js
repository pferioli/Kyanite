const PDFDocument = require("pdfkit");
const path = require("path");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

var pageCounter = 0; var maxY = 0; var rowBottomY = 0; var startX, startY;

var totalAmount = 0.00; var accountsCounter = 0; var totalMovementsCounter = 0;

function createReport(paymentOrders, client, period, user, res) {

    totalAmount = 0.00; accountsCounter = 0; totalMovementsCounter = 0; pageCounter = 0;

    let doc = new PDFDocument({
        size: "A4", margin: 50, bufferPages: true, autoFirstPage: false,
        info: {
            Title: 'Detalle de gastos',
            Author: 'AAII Administraciones Integrales', // the name of the author
            Subject: '', // the subject of the document
            Keywords: 'pdf;javascript', // keywords associated with the document
        },
    });

    doc.on('pageAdded', () => {

        maxY = doc.page.height - doc.page.margins.bottom;

        startX = doc.page.margins.left;

        startY = doc.page.margins.top; rowBottomY = 0;

        doc.y = startY; doc.x = startX;
    });

    doc.addPage();

    generateHeader(doc);

    generateCustomerInformation(doc, client, period);

    doc.moveDown();

    populateTable(doc, paymentOrders);

    generateFooter(doc)

    //-----------------------------------------------------------------------//

    const reportName = "gastos" + client.internalCode + "_" + period.name + ".pdf"
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

function generateCustomerInformation(doc, client, period) {

    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Detalle de gastos", 50, 105, { width: 500, align: 'center' });

    common.generateHr(doc, 130);

    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(client.name, 50, 140, { width: 500, align: 'center' });

    doc
        .fontSize(12)
        .font("Helvetica")
        .text(`período ${period.name} comprendido entre ${period.startDate} y ${period.endDate}`, 50, 160, { width: 500, align: 'center' });

    common.generateHr(doc, 180);

    doc.moveDown();
}

// <----- PIE DE PAGINA ----->

async function generateFooter(doc) {

    const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }

    const reportDate = new Date;

    for (i = range.start, end = range.start + range.count, range.start <= end; i < end; i++) {
        doc.switchToPage(i);

        common.generateHr(doc, doc.page.height - 60)

        doc
            .fontSize(10)
            .text(common.formatDateTime(reportDate),
                doc.page.margins.left + 10,
                doc.page.height - 50,
                {
                    align: "left",
                    lineBreak: false
                }
            );

        const textWidth = doc.widthOfString(`página ${i + 1} de ${range.count}`, { align: "right" });

        doc
            .fontSize(10)
            .text(`página ${i + 1} de ${range.count}`,
                doc.page.width - doc.page.margins.right - Number.parseFloat(textWidth * 1.1),
                doc.page.height - 50,
                {
                    align: "right", lineBreak: false
                }
            );
    }
}

// <----- TABLA DE ORDENES DE PAGO ----->

function populateTable(doc, paymentOrders) {

    let table0 = {
        headers: [
            { name: 'ID', width: '10%', align: 'left' },
            { name: 'Fecha', width: '20%', align: 'left' },
            { name: 'Tipo', width: '30%', align: 'left' },
            { name: 'Importe', width: '20%', align: 'left' },
            { name: 'Usuario', width: '25%', align: 'left' }
        ],
        rows: []
    };

    let lastGroupId = 0; group = ""; let lastAccountImputationId = 0; accountingImputation = ""; isGroupOpen = false;

    let index = 0; let groupName = "";

    do {

        const paymentOrder = paymentOrders[index];

        if (lastGroupId !== paymentOrder.paymentReceipt.accountingImputation.accountingGroup.id) {

            if (lastGroupId !== 0) { //cambio de grupo
                console.log('------------------');
            }

            isGroupOpen = true;

            lastGroupId = paymentOrder.paymentReceipt.accountingImputation.accountingGroup.id;

            group = paymentOrder.paymentReceipt.accountingImputation.accountingGroup.name;

            console.log(paymentOrder.paymentReceipt.accountingImputation.accountingGroup.name);
        }

        if (lastAccountImputationId !== paymentOrder.paymentReceipt.accountingImputationId) {

            lastAccountImputationId = paymentOrder.paymentReceipt.accountingImputation.id;

            console.log(`\t${paymentOrder.paymentReceipt.accountingImputation.name}`);
        }

        index += 1;

    } while (index < paymentOrders.length);
}

function createTable(doc, table) {

    const usableWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right);

    const rowSpacing = 5; var columnWidth = [];

    const prepareHeader = () => doc.font('Helvetica-Bold').fontSize(10);

    const prepareRow = (row, i) => doc.font('Helvetica').fontSize(8);

    const prepareColWidth = () => {

        columnWidth = [];

        table.headers.forEach((header, i) => {

            const colWidth = usableWidth * Number.parseFloat(header.width.replace("%", "") / 100)

            columnWidth.push(colWidth)
        })
    }

    const computeColumnOffset = (index) => {
        let offset = startX;
        for (i = 0; i < index; i++)
            offset = offset + Number.parseFloat(columnWidth[i]);
        return offset;
    };

    const computeRowHeight = (row) => {
        let result = 0;

        row.forEach((cell, i) => {
            const cellHeight = doc.heightOfString(cell, {
                width: columnWidth[i], //columnWidth,
                align: table.headers[i].align //'left'
            });
            result = Math.max(result, cellHeight);
        });

        return result + rowSpacing;
    };

    startY = doc.y;

    prepareColWidth();

    // Allow the user to override style for headers
    prepareHeader();

    // Check to have enough room for header and first rows
    if (startY + 5 * computeRowHeight(table.headers) > maxY)
        doc.addPage();

    // Print all headers
    table.headers.forEach((header, i) => {
        const offset = computeColumnOffset(i);
        doc.text(header.name, offset, startY, { //i * columnContainerWidth
            width: columnWidth[i], //columnWidth,
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

    table.rows.forEach((row, i) => {

        const rowHeight = computeRowHeight(row);

        // Switch to next page if we cannot go any further because the space is over.
        // For safety, consider 3 rows margin instead of just one
        if (startY + 5 * rowHeight < maxY)
            startY = rowBottomY + rowSpacing;
        else
            doc.addPage();

        // Allow the user to override style for rows
        prepareRow(row, i);

        // Print all cells of the current row
        row.forEach((cell, i) => {
            const offset = computeColumnOffset(i);

            doc.text(cell, offset, startY, {
                width: columnWidth[i], //columnWidth,
                align: table.headers[i].align //'left'
            });
        });

        // Refresh the y coordinate of the bottom of this row
        rowBottomY = Math.max(startY + rowHeight, rowBottomY);

        // Separation line between rows
        doc.moveTo(startX, rowBottomY - rowSpacing * 0.5)
            .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
            .lineWidth(1)
            .opacity(0.7)
            .stroke()
            .opacity(1); // Reset opacity after drawing the line
    });

    doc.x = startX;
    doc.moveDown();
}

module.exports = {
    createReport: createReport
};
