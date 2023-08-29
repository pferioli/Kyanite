const dateFormat = require("dateformat");

// ----------------------------------
// <----- FUNCIONES AUXILIARES ----->
// ----------------------------------

module.exports.generateHr = function (doc, y) {
    doc
        .opacity(1)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(doc.page.margins.left, y)
        .lineTo((doc.page.width - doc.page.margins.right), y)
        .stroke();
}

module.exports.heightMeassure = function (doc, text, options) {

    const cellHeight = doc.heightOfString(text, options);

    return cellHeight;
}

module.exports.widthMeassure = function (doc, text, options) {

    const cellWidth = doc.widthOfString(text, options);

    return cellWidth;
}

module.exports.formatCurrency = function (number) {
    const _number = Math.abs(number) < 0.001 ? 0.00 : number;

    return new Intl.NumberFormat('es',
        { currency: 'ARS', style: 'currency', currencyDisplay: 'narrowSymbol', /*currencyDisplay: "symbol"*/ }).format(_number);
}

module.exports.formatDateTime = function (date) {
    return dateFormat(date, "HH:MM:ss dd/mm/yyyy");;
}

module.exports.formatDate = function (date) {
    return dateFormat(date, "dd/mm/yyyy");
}

module.exports.addWaterMark = function (doc, text) {
    drawTexts(doc, text);
}

module.exports.generateSignature = function (doc, user, config) {

    const lineSize = config.linesize; //174;
    const startLine1 = config.startLine; //80;
    const endLine1 = startLine1 + lineSize;
    const signatureHeight = config.signatureHeight; //735;

    try {

        if (user.userSignature) {

            const sizeOf = require('image-size')

            const dimensions = sizeOf.imageSize(user.userSignature.image);

            const widthScale = (dimensions.width * 0.75) / 150;

            const vertOffset = (dimensions.height * 0.75) / widthScale;

            doc.image(user.userSignature.image, (startLine1 + (lineSize / 2) - (150 / 2)), signatureHeight - vertOffset + 10, { width: 150 })

        }

    } catch (error) {
        console.log(error);
    }

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

module.exports.generateGenericSignature = function (doc, config, message) {

    const lineSize = config.linesize; //174;
    const startLine1 = config.startLine; //350;
    const endLine1 = startLine1 + lineSize;
    const signatureHeight = config.signatureHeight; //735;

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
            (message === undefined ? "firma y aclaración" : message),
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
}

// ----------------------------------
// <----- ROTACION ----->
// ----------------------------------

function doTransform(x, y, angle) {
    var rads = angle / 180 * Math.PI;
    var newX = x * Math.cos(rads) + y * Math.sin(rads);
    var newY = y * Math.cos(rads) - x * Math.sin(rads);

    return {
        x: newX,
        y: newY,
        rads: rads,
        angle: angle
    };
};

function drawTexts(doc, texts) {

    const _ = require("underscore");

    _.each(texts, t => {
        doc.save();
        doc.fontSize(t.size);
        var loc = doTransform(t.x, t.y, t.rotation);
        doc.rotate(t.rotation);
        doc.opacity(0.3)
        doc.fillColor('gray')
        doc.text(t.text, loc.x, loc.y);
        doc.restore();
    });

};
