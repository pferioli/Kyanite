const PDFDocument = require("pdfkit");
const path = require("path");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

var maxY = 0; var rowBottomY = 0; var startX, startY;

var amount = { total: 0.00, subTotalGroup: 0.00, subTotal: 0.00 };

function createReport(paymentOrders, client, period, user, res) {

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

        startY = doc.page.margins.top; rowBottomY = 0;

        startX = doc.page.margins.left;

        doc.y = startY; doc.x = startX;
    });

    doc.addPage();

    generateHeader(doc);

    generateCustomerInformation(doc, client, period);

    doc.moveDown();

    populateTable(doc, paymentOrders);

    finalInformation(doc, user);

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
            .fillColor("#444444")
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
            .fillColor("#444444")
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
            { name: 'OP', width: '10%', align: 'left' },
            { name: 'Fecha', width: '10%', align: 'left' },
            { name: 'Factura', width: '17%', align: 'left' },
            { name: 'Proveedor', width: '23%', align: 'left' },
            { name: 'Detalle', width: '25%', align: 'left' },
            { name: 'Importe', width: '15%', align: 'center' }
        ],
        rows: [],
        primaryGroup: "",
        secondaryGroup: ""
    };

    const new_group = (doc, groupname) => {

        console.log("opening group " + groupname);

        isGroupOpen = true; isSubgroupOpen = false; amount.subTotalGroup = 0.00;

        table0.primaryGroup = groupname;

        doc
            .fontSize(12)
            .font("Helvetica-Bold");

        if (doc.y + 15 * common.heightMeassure(doc, groupname, { align: "left" }) > maxY)
            doc.addPage();

        doc.text(groupname, doc.page.margins.left, doc.y, { align: 'left' });
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

    const rowSpacing = 5; const colSpacing = 5; var columnWidth = [];

    const prepareHeader = () => {
        doc
            .font('Helvetica-Bold')
            .fillColor("#000000")
            .fontSize(10);

    }
    const prepareRow = (row, i) => {
        doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor("#000000");
    };

    const prepareColWidth = () => {

        columnWidth = [];

        table.headers.forEach((header, i) => {

            const colWidth = (usableWidth - (table.headers.length * colSpacing)) * Number.parseFloat(header.width.replace("%", "") / 100)

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
    if (startY + 3 * computeRowHeight(table.headers) > maxY)
        doc.addPage();

    doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(table.secondaryGroup, doc.page.margins.left, doc.y, { align: 'left' })
        .moveDown(1);

    startY = doc.y;

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
        .strokeColor("#444444")
        .stroke();

    table.rows.forEach((row, i) => {

        const rowHeight = computeRowHeight(row);

        // Switch to next page if we cannot go any further because the space is over.
        // For safety, consider 3 rows margin instead of just one
        if (startY + 3 * rowHeight < maxY)
            startY = rowBottomY + rowSpacing;
        else
            doc.addPage();

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
                        align: table.headers[i].align
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
