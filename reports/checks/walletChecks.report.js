const PDFDocument = require("pdfkit");
const path = require("path");

const image_folder = path.join(__dirname, "..", "..", "public", "images")

const common = require('../common.report');

var maxY = 0; var rowBottomY = 0; var startX, startY;

var totalAmount = 0.00;

function createReport(checks, client, user, res) {

    totalAmount = 0.00;

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

        maxY = doc.page.height - doc.page.margins.bottom;

        startX = doc.page.margins.left;

        startY = doc.page.margins.top; rowBottomY = 0;

        doc.y = startY; doc.x = startX;
    });

    doc.addPage();

    generateHeader(doc);

    generateCustomerInformation(doc, client);

    doc.moveDown();



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

function populateTable(doc, paymentOrders) {

    let table0 = {
        headers: ['Número', 'Detalle', 'Cuenta', 'Fecha de Emisión', 'Fecha de Pago', 'Fecha de Vencimiento', 'Importe'],
        rows: [],
        primaryGroup: "",
        secondaryGroup: "",
        columns: [
            { width: '10%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '15%', align: 'left' },
            { width: '15%', align: 'right' }
        ]
    };

    const new_group = (doc, groupname) => {

        console.log("opening group " + groupname);

        isGroupOpen = true; amount.subTotalGroup = 0.00;

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

    const close_group = (doc) => {

        if (isGroupOpen === false) return;

        console.log("close group");

        isGroupOpen = false;

        doc
            .moveDown(1)
            .fontSize(10)
            .fillColor("#000000")
            .font("Helvetica-Bold")
            .text(`subtotal para el grupo ${table0.primaryGroup}: ${common.formatCurrency(amount.subTotalGroup)}`, doc.page.margins.left, doc.y, { align: 'center' })
            .moveDown(1);
    };

    const add_row = (check) => {
        table0.rows.push(
            [
                
                common.formatCurrency(check.amount)
            ]);

        amount.total += Number.parseFloat(check.amount);
        amount.subTotalGroup += Number.parseFloat(check.amount);
    }

    let lastBankId = 0, isGroupOpen = false; let index = 0;

    do {

        const check = checks[index];

        if (lastBankId !== checks.bank.id) {

            lastBankId = checks.bank.id;

            close_group(doc); //cerramos cualquier grupo que pudiera estar abierto previamente

            new_group(doc, checks.bank.name);
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

    doc.text(`Importe total ${common.formatCurrency(totalAmount)}`, 80, doc.y, { align: 'left' });

    doc.moveDown(2);

    common.generateSignature(doc, user, { linesize: 174, startLine: 350, signatureHeight: doc.y });
}

module.exports = {
    createReport: createReport
};
