const PDFDocument = require("pdfkit");
const path = require("path");

const common = require('../common.report');

var maxY = 0; var rowBottomY = 0; var startX, startY; var pageNumber = 0;

// const fs = require('fs');

const { webSocket } = require('../../bin/server');

const image_folder = path.join(__dirname, "..", "..", "public", "images")

function createReport(supplier, client, accountMovements, user, res) {

    pageNumber = 0;

    let doc = new PDFDocument(
        {
            size: "A4",
            margin: 35, //50,
            layout: 'portrait', // can be 'landscape'
            info: {
                Title: 'Cuenta Corriente Proveedor',
                Author: 'AAII Administraciones Integrales', // the name of the author
                Subject: '', // the subject of the document
                Keywords: 'pdf;javascript', // keywords associated with the document
            },
            bufferPages: true,
            autoFirstPage: false
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

    generateCustomerInformation(doc, supplier, client);

    doc.moveDown();

    populateTable(doc, accountMovements);

    finalInformation(doc, user)

    generateFooter(doc);

    const reportName = "ccp" + /* el ID del proveedor */ + ".pdf"
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

function generateCustomerInformation(doc, supplier, client) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .font("Helvetica")
        .text("Cuenta Corriente de Proveedor", 50, 125, { width: 500, align: 'center' })
        .fontSize(10)
        .text("Nombre del Cliente: " + client.name + " (" + client.cuit + ")", 50, 170, { width: 500, align: 'left' })
        .text("Nombre del Proveedor: " + supplier.name + " (" + supplier.cuit + ")", 50, 190, { width: 500, align: 'left' })
        .text("Fecha de Emisión: " + common.formatDateTime(Date.now()), 50, 210, { width: 500, align: 'left' })
        .moveDown()

    common.generateHr(doc, 230);
}

// <----- PIE DE PAGINA ----->

async function generateFooter(doc) {

    const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }

    const reportDate = new Date;

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

// <----- TABLA DE MOVIMIENTOS  ----->

function populateTable(doc, accountMovements) {

    amount = { totalSupplier: 0.00, totalClient: 0.00, subTotal: 0.00 };

    let table = {
        headers: ['Fecha', 'Factura', 'OP', 'NC', 'Cuenta', 'Facturado', 'Abonado', 'Saldo'],
        rows: [],
        columns: [
            { width: '10%', align: 'center' }, //Fecha
            { width: '16%', align: 'center' }, //FC
            { width: '6%', align: 'center' }, //OP
            { width: '6%', align: 'center' }, //NC
            { width: '15%', align: 'left' }, //CTA
            { width: '15%', align: 'right' }, //FACTURADO
            { width: '15%', align: 'right' }, //ABONADO
            { width: '15%', align: 'right' }, //SALDO
        ]
    };

    const add_row = (accountMovement) => {

        let creditNotes = []; creditNotesAmount = 0; let movementAmount = 0;

        if (accountMovement.type === undefined) {   // -----> FACTURA

            amount.totalSupplier += Number.parseFloat(accountMovement.amount); //Comprobantes (Facturado)

            movementAmount = Number.parseFloat(accountMovement.amount);

            amount.subTotal += Number.parseFloat(movementAmount);

            table.rows.push(
                [
                    common.formatDate(accountMovement.date),
                    accountMovement.receiptType + " " + accountMovement.receiptNumber,
                    (accountMovement.poNumber ? accountMovement.poNumber : ""),
                    creditNotes.join(),
                    (accountMovement.account ? accountMovement.account : ""),
                    common.formatCurrency(movementAmount),
                    "", //common.formatCurrency(0),
                    common.formatCurrency(amount.subTotal),
                ]);


        } else {    // -----> OPs y NCs

            // NOTAS DE CREDITO

            for (const creditNote of accountMovement.creditNotes) {

                creditNotes.push(creditNote.creditNote.id); creditNotesAmount += Number.parseFloat(creditNote.creditNote.amount);

                const creditNoteAmount = Number.parseFloat(creditNote.creditNote.amount) * (-1);

                amount.subTotal += creditNoteAmount;

                let account = (creditNote.creditNote.paymentOrder.account.bankId ?
                    `(${creditNote.creditNote.paymentOrder.account.accountType.account}) ${creditNote.creditNote.paymentOrder.account.accountNumber}` :
                    `(${creditNote.creditNote.paymentOrder.account.accountType.account}) ${creditNote.creditNote.paymentOrder.account.accountType.description}`);

                table.rows.push(
                    [
                        common.formatDate(creditNote.creditNote.emissionDate),
                        accountMovement.receiptType + " " + accountMovement.receiptNumber,
                        (creditNote.creditNote.paymentOrderId ? creditNote.creditNote.paymentOrder.poNumber : ""),
                        creditNote.creditNote.id,
                        (creditNote.creditNote.accountId ? account : ""),
                        common.formatCurrency(Number.parseFloat(creditNoteAmount)),
                        "", //common.formatCurrency(0),
                        common.formatCurrency(amount.subTotal),
                    ]);

                amount.totalClient += Number.parseFloat(creditNoteAmount) * (-1); //OPs y NCs (Abonado)   //si es una OP hay que restarle las NCs

            }

            //ORDEN DE PAGO
            
            movementAmount = Number.parseFloat(accountMovement.amount) + creditNotesAmount;

            amount.subTotal += Number.parseFloat(movementAmount);

            amount.totalClient += Number.parseFloat(movementAmount) * (-1); //OPs y NCs (Abonado)   //si es una OP hay que restarle las NCs

            table.rows.push(
                [
                    common.formatDate(accountMovement.date),
                    accountMovement.receiptType + " " + accountMovement.receiptNumber,
                    (accountMovement.poNumber ? /*accountMovement.type + " " + */ accountMovement.poNumber : ""),
                    creditNotes.join(),
                    (accountMovement.account ? accountMovement.account : ""),
                    "", //common.formatCurrency(0),
                    common.formatCurrency(movementAmount),
                    common.formatCurrency(amount.subTotal),
                ]);

        }
    }

    let index = 0;

    do {

        const accountMovement = accountMovements[index];

        add_row(accountMovement);

        index += 1;

    } while (index < accountMovements.length);

    createTable(doc, table);
}

async function createTable(doc, table) {

    const usableWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right);

    const rowSpacing = 5; const colSpacing = 5; var columnWidth = [];

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
            offset = offset + Number.parseFloat(columnWidth[i]) + colSpacing;

        if (index === (table.columns.length - 1))
            offset -= colSpacing;

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
                align: 'center'
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

    startY = doc.y;

    printHeaders();

    printRows();

    doc.x = startX; doc.y = rowBottomY + rowSpacing
}

// <----- RESUMEN FINAL ----->

function finalInformation(doc, user) {

    if (doc.y + 200 > maxY) //verificamos que queda espacio para el resumen y la firma
        doc.addPage();

    doc.moveDown(2);

    doc.font('Helvetica-Bold')
        .fillColor("#000000")
        .fontSize(12)
        .text(`Total Facturado = ${common.formatCurrency(amount.totalSupplier)}`, 60, doc.y, { align: 'left' })
        .text(`Total Abonado = ${common.formatCurrency(amount.totalClient)}`, 60, doc.y + 15, { align: 'left' })

    doc
        .fontSize(14)
        .text(`Saldo = ${common.formatCurrency(Number.parseFloat(amount.totalSupplier - amount.totalClient))}`, 60, doc.y + 30, { align: 'left' });

    doc.moveDown(2);

    common.generateSignature(doc, user, { linesize: 174, startLine: 350, signatureHeight: doc.y });
}

module.exports = {
    createReport: createReport,
};
