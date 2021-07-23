const PDFDocument = require("pdfkit");
const path = require("path");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

var maxY = 0; var rowBottomY = 0; var startX, startY; var pageNumber = 0;

var amount = { total: 0.00, subTotalGroup: 0.00, subTotal: 0.00 };

function createReport(paymentOrders, client, periods, user, res) {

    pageNumber = 0;

    let doc = new PDFDocument({
        size: "A4",
        margins: {
            top: 50,
            bottom: 25,
            left: 35,
            right: 25,
        },
        bufferPages: true,
        autoFirstPage: false,
        info: {
            Title: 'Detalle de gastos',
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

    generateCustomerInformation(doc, client, periods);

    doc.moveDown();

    populateTable(doc, paymentOrders);

    finalInformation(doc, user);

    generateFooter(doc)

    //-----------------------------------------------------------------------//

    // const reportName = "gastos" + client.internalCode + "_" + period.name + ".pdf"
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

function generateCustomerInformation(doc, client, periods) {

    doc
        .fillColor("#000000") //444444
        .fontSize(20)
        .text("Detalle de gastos", 50, 105, { width: 500, align: 'center' });

    common.generateHr(doc, 130);

    doc
        .fontSize(14)
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text(client.name, 50, 140, { width: 500, align: 'center' });


    doc
        .fontSize(12)
        .fillColor("#000000")
        .font("Helvetica");

    if (periods.length === 1)
        doc.text(`período ${periods[0].name} comprendido entre ${periods[0].startDate} y ${periods[0].endDate}`, 50, 160, { width: 500, align: 'center' });
    else {
        let periodName = ""; for (const period of periods) { periodName += period.name + " "; }; periodName = periodName.slice(0, -1);
        doc.text(`períodos ${periodName}`, 50, 160, { width: 500, align: 'center' });
    }

    common.generateHr(doc, 180);

    doc.moveDown();
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

// <----- TABLA DE ORDENES DE PAGO ----->

function populateTable(doc, paymentOrders) {

    let table0 = {
        headers: ['OP', 'Fecha', 'Factura', 'Proveedor', 'Detalle', 'Importe'],
        rows: [],
        primaryGroup: "",
        secondaryGroup: "",
        columns: [
            { width: '12%', align: 'left' },
            { width: '12%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '25%', align: 'left' },
            { width: '23%', align: 'left' },
            { width: '15%', align: 'right' }
        ]
    };

    const new_group = (doc, groupname) => {

        console.log("opening group " + groupname);

        isGroupOpen = true; isSubgroupOpen = false; amount.subTotalGroup = 0.00;

        table0.primaryGroup = groupname;

        if (doc.y + common.heightMeassure(doc, groupname, { align: "left" }) + 100 > maxY)
            doc.addPage();

        doc
            .fontSize(12)
            .fillColor("#000000")
            .font("Helvetica-Bold")
            .text(groupname, doc.page.margins.left, doc.y, { align: 'left' });

        doc.moveDown(1);
    };

    const new_subgroup = (doc, subgroup) => {

        console.log(`\t${subgroup}`);

        isGroupOpen = true; isSubgroupOpen = true; amount.subTotal = 0.00;

        table0.secondaryGroup = subgroup; table0.rows = [];
    }

    const close_subgroup = (doc) => {

        if (isSubgroupOpen === false) return;

        console.log(`closing subgroup ${table0.secondaryGroup}`);

        isSubgroupOpen = false;

        createTable(doc, table0);
    };

    const close_group = (doc) => {

        if (isGroupOpen === false) return;

        console.log("close group");

        if (isSubgroupOpen === true) close_subgroup(doc); //si hay un subgrupo abierto, primero hay que cerrar la tabla

        isGroupOpen = false; isSubgroupOpen = false;

        doc
            .moveDown(1)
            .fontSize(10)
            .fillColor("#000000")
            .font("Helvetica-Bold")
            .text(`subtotal para el grupo ${table0.primaryGroup}: ${common.formatCurrency(amount.subTotalGroup)}`, doc.page.margins.left, doc.y, { align: 'center' })
            .moveDown(1);
    };

    const add_row = (paymentOrder) => {
        table0.rows.push(
            [
                paymentOrder.poNumberFormatted,
                paymentOrder.paymentDate,
                paymentOrder.paymentReceipt.receiptType.receiptType + " " + paymentOrder.paymentReceipt.receiptNumber,
                paymentOrder.paymentReceipt.supplier.name,
                paymentOrder.paymentReceipt.description,
                common.formatCurrency(paymentOrder.amount)
            ]);

        amount.total += Number.parseFloat(paymentOrder.amount);
        amount.subTotalGroup += Number.parseFloat(paymentOrder.amount);
        amount.subTotal += Number.parseFloat(paymentOrder.amount);
    }

    let lastGroupId = 0, lastAccountImputationId = 0, isGroupOpen = false, isSubgroupOpen = false; let index = 0;

    do {

        const paymentOrder = paymentOrders[index];

        if (lastGroupId !== paymentOrder.paymentReceipt.accountingImputation.accountingGroup.id) {

            lastGroupId = paymentOrder.paymentReceipt.accountingImputation.accountingGroup.id;

            close_group(doc); //cerramos cualquier grupo que pudiera estar abierto previamente

            new_group(doc, paymentOrder.paymentReceipt.accountingImputation.accountingGroup.name);
        }

        if (lastAccountImputationId !== paymentOrder.paymentReceipt.accountingImputationId) {

            lastAccountImputationId = paymentOrder.paymentReceipt.accountingImputation.id;

            close_subgroup(doc);

            new_subgroup(doc, paymentOrder.paymentReceipt.accountingImputation.name);
        }

        add_row(paymentOrder);

        index += 1;

        if (index === paymentOrders.length) close_group(doc);

    } while (index < paymentOrders.length);
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
    if (startY + common.heightMeassure(doc, table.secondaryGroup) + 50 > maxY)
        doc.addPage();

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(table.secondaryGroup, doc.page.margins.left, doc.y, { align: 'left' })
        .moveDown(1);

    startY = doc.y;

    printHeaders();

    printRows();

    doc.x = startX; doc.y = rowBottomY + rowSpacing

    doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(`subtotal para ${table.secondaryGroup}: ${common.formatCurrency(amount.subTotal)}`, doc.page.margins.left, doc.y, { align: 'right' })
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
