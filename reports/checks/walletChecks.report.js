const PDFDocument = require("pdfkit");
const path = require("path");
const moment = require('moment');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');
const { now } = require("moment");

var maxY = 0; var rowBottomY = 0; var startX, startY; var pageNumber = 0;

var amount = { total: 0.00, subTotalGroup: 0.00, subTotal: 0.00 };

function createReport(checks, client, user, res) {

    pageNumber = 0; amount = { total: 0.00, subTotal: 0.00 }

    let doc = new PDFDocument({
        size: "A4", margin: 50, bufferPages: true, autoFirstPage: false,
        info: {
            Title: 'Cheques en cartera',
            Author: 'AAII Administraciones Integrales', // the name of the author
            Subject: '', // the subject of the document
            Keywords: 'pdf;javascript', // keywords associated with the document
        },
    });

    doc.on('pageAdded', () => {

        maxY = doc.page.height - doc.page.margins.bottom - 60; // header y footer

        if (pageNumber > 0) {

            doc
                .fillColor("#444444")
                .font("Helvetica")
                .fontSize(8)
                .text("Detalle de movimientos (cont...)", doc.page.margins.left, doc.page.margins.top + 5,
                    {
                        width: (doc.page.width - doc.page.margins.left - doc.page.margins.right),
                        align: 'center'
                    });

            common.generateHr(doc, doc.y + 5);
        }

        pageNumber++;

        startY = doc.page.margins.top + 35; rowBottomY = 0;

        startX = doc.page.margins.left;

        doc.y = startY; doc.x = startX;
    });

    doc.addPage();

    generateHeader(doc);

    generateCustomerInformation(doc, client);

    doc.moveDown();

    populateTable(doc, checks)

    finalInformation(doc, user);

    generateFooter(doc)

    //-----------------------------------------------------------------------//

    const reportName = "cheques_cartera" + client.internalCode + ".pdf"
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

function generateCustomerInformation(doc, client) {

    doc
        .fillColor("#000000")
        .fontSize(20)
        .text("Cheques en cartera", 50, 105, { width: 500, align: 'center' });

    common.generateHr(doc, 130);

    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(client.name, 50, 140, { width: 500, align: 'center' });

    common.generateHr(doc, 160);

    doc.moveDown();
}

// <----- PIE DE PAGINA ----->

async function generateFooter(doc) {

    const reportDate = new Date;

    const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }

    for (i = range.start, end = range.start + range.count, range.start <= end; i < end; i++) {
        doc.switchToPage(i);

        common.generateHr(doc, doc.page.height - 50)

        doc
            .fontSize(8)
            .fillColor("#444444")
            .text(common.formatDateTime(reportDate),
                doc.page.margins.left + 10,
                doc.page.height - 45,
                {
                    align: "left",
                    lineBreak: false
                }
            );

        const textWidth = doc.widthOfString(`página ${i + 1} de ${range.count}`, { align: "right" });

        doc
            .fontSize(8)
            .fillColor("#444444")
            .text(`página ${i + 1} de ${range.count}`,
                doc.page.width - doc.page.margins.right - Number.parseFloat(textWidth * 1.1),
                doc.page.height - 45,
                {
                    align: "right", lineBreak: false
                }
            );
    }
}


// <----- TABLA DE CHEQUES EN CARTERA ----->

function populateTable(doc, checks) {

    let table0 = {
        headers: ['Número', 'Detalle', 'Fecha de Emisión', 'Fecha de Pago', 'Fecha de Vencimiento', 'Importe'],
        rows: [],
        primaryGroup: "",
        secondaryGroup: "",
        columns: [
            { width: '15%', align: 'left' },
            { width: '20%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '20%', align: 'left' },
            { width: '15%', align: 'right' }
        ]
    };

    const new_group = (doc, groupname) => {

        console.log("opening group " + groupname);

        isGroupOpen = true;

        amount.subTotal = 0.00;

        table0.rows = [];

        table0.primaryGroup = groupname;
    };

    const close_group = (doc) => {

        if (isGroupOpen === false) return;

        console.log("close group");

        isGroupOpen = false;

        createTable(doc, table0);

        // doc
        //     .moveDown(1)
        //     .fontSize(10)
        //     .fillColor("#000000")
        //     .font("Helvetica-Bold")
        //     .text(`subtotal para el grupo ${table0.primaryGroup}: ${common.formatCurrency(amount.subTotal)}`, doc.page.margins.left, doc.y, { align: 'center' })
        //     .moveDown(1);

    };

    const add_row = (check) => {

        var dueDate = moment(check.dueDate);

        table0.rows.push(
            [
                check.number,
                check.comments,
                common.formatDate(check.emissionDate),
                common.formatDate(check.paymentDate),
                `${common.formatDate(check.dueDate)} (${dueDate.diff(now(), 'days')} días)`,
                common.formatCurrency(check.amount)
            ]);

        amount.total += Number.parseFloat(check.amount);
        amount.subTotal += Number.parseFloat(check.amount);
    }

    let lastBankId = 0, isGroupOpen = false; let index = 0;

    do {

        const check = checks[index];

        if (lastBankId !== check.bank.id) {

            lastBankId = check.bank.id;

            close_group(doc); //cerramos cualquier grupo que pudiera estar abierto previamente

            new_group(doc, check.bank.name);
        }

        add_row(check);

        index += 1;

        if (index === checks.length) close_group(doc);

    } while (index < checks.length);
}


async function createTable(doc, table) {

    const usableWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right);

    const rowSpacing = 5; const colSpacing = 10; var columnWidth = [];

    const prepareColWidth = () => {

        columnWidth = [];

        table.columns.forEach((column, i) => {

            const colWidth = (usableWidth - table.columns.length * rowSpacing) * Number.parseFloat(column.width.replace("%", "") / 100); // - colSpacing

            columnWidth.push(colWidth)
        })
    }

    const computeColumnOffset = (index) => {
        let offset = startX;
        for (i = 0; i < index; i++)
            offset = offset + Number.parseFloat(columnWidth[i]) + rowSpacing;

        if (index === (table.columns.length - 1))
            offset -= rowSpacing;

        return offset;
    };

    const computeRowHeight = (row) => {

        let maxHeight = 0;

        row.forEach((cell, i) => {

            const options = {
                width: columnWidth[i], //columnWidth,
                align: table.columns[i].align //'left'
            };

            const cellHeight = doc.heightOfString(cell, options);
            const cellWidth = doc.widthOfString(cell, options);

            maxHeight = Math.max(maxHeight, cellHeight);
        });

        return maxHeight + rowSpacing;
    };

    startY = doc.y;

    prepareColWidth();

    const printHeaders = () => {

        const prepareHeader = () => {
            doc
                .font('Helvetica-Bold')
                .fillColor("#000000")
                .fontSize(10);
        }

        prepareHeader(); // Allow the user to override style for headers

        // Print all headers
        table.headers.forEach((header, i) => {
            const offset = computeColumnOffset(i);
            doc.text(header, offset, startY, { //i * columnContainerWidth
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
            .strokeColor("#444444")
            .stroke();
    }

    const printRows = () => {

        const prepareRow = (row, i) => {
            doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor("#000000");
        };

        table.rows.forEach((row, i) => {

            prepareRow();

            const rowHeight = computeRowHeight(row);

            // Switch to next page if we cannot go any further because the space is over.
            // For safety, consider 3 rows margin instead of just one
            if (startY + 2 * rowHeight < maxY)
                startY = rowBottomY + rowSpacing;
            else {
                doc.addPage();

                printHeaders();

                startY = rowBottomY + rowSpacing;
            }

            // Allow the user to override style for rows
            prepareRow(row, i);

            // Print all cells of the current row
            row.forEach((cell, i) => {
                const offset = computeColumnOffset(i);

                doc
                    .fillColor("#000000")
                    .text(cell, offset, startY,
                        {
                            width: columnWidth[i],
                            align: table.columns[i].align
                        }
                    );
            });

            // Refresh the y coordinate of the bottom of this row
            rowBottomY = Math.max(startY + rowHeight, rowBottomY);

            // Separation line between rows
            doc.moveTo(startX, rowBottomY - rowSpacing * 0.5)
                .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
                .lineWidth(1)
                .opacity(0.7)
                .strokeColor("#444444")
                .stroke()
                .opacity(1); // Reset opacity after drawing the line
        });

    }

    // Check to have enough room for header and first rows

    if (doc.y + common.heightMeassure(doc, table.primaryGroup, { align: "left" }) + 100 > maxY)
        doc.addPage();

    doc
        .fontSize(12)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text(table.primaryGroup, doc.page.margins.left, doc.y, { align: 'left' });

    doc.moveDown(1);

    startY = doc.y;

    printHeaders();

    printRows();

    doc.x = startX; doc.y = rowBottomY + rowSpacing

    doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(`subtotal para ${table.primaryGroup}: ${common.formatCurrency(amount.subTotal)}`, doc.page.margins.left, doc.y, { align: 'right' })
        .moveDown(1);
}
// <----- RESUMEN FINAL ----->

function finalInformation(doc, user) {

    if (doc.y + 200 > maxY) //verificamos que queda espacio para el resumen y la firma
        doc.addPage();

    doc
        .moveDown(2)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text('Resumen general:', { align: 'left' })
        .moveDown()
        .fontSize(10);

    doc.text(`Importe total ${common.formatCurrency(amount.total)}`, 80, doc.y, { align: 'left' });

    doc.moveDown(2);

    common.generateSignature(doc, user, { linesize: 174, startLine: 350, signatureHeight: doc.y });
}

module.exports = {
    createReport: createReport
};
