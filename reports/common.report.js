const dateFormat = require("dateformat");

// ----------------------------------
// <----- FUNCIONES AUXILIARES ----->
// ----------------------------------

module.exports.generateHr = function (doc, y) {
    doc
        .opacity(1)
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

module.exports.formatCurrency = function (number) {
    return new Intl.NumberFormat('es',
        { currency: 'ARS', style: 'currency', currencyDisplay: 'narrowSymbol', /*currencyDisplay: "symbol"*/ }).format(number);
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

module.exports.generateSignature = function(doc, user, config) {

    const lineSize = config.linesize; //174;
    const startLine1 = config.startLine; //80;
    const endLine1 = startLine1 + lineSize;
    const signatureHeight = config.signatureHeight; //735;

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

module.exports.generateGenericSignature = function(doc, config) {

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
