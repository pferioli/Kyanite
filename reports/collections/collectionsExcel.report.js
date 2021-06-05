// Require library

var Excel = require('excel4node');

const CollectionStatus = require('../../utils/statusMessages.util').Collection;

module.exports.generateExcel = async function (client, collections, period, user, res) {

    var workbook = new Excel.Workbook();

    var worksheet = workbook.addWorksheet(`Reporte de Cobranzas ${client.internalCode}`);

    var styleRowHeader = workbook.createStyle({
        font: {
            color: 'black',
            size: 12,
            bold: true,
        },
        alignment: {
            wrapText: false,
            horizontal: 'center',
            vertical: 'center'
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            bgColor: 'gray-25',
            fgColor: 'gray-25',
        }
    });

    var styleCurrencyFormat = workbook.createStyle({
        numberFormat: '$#,##0.00; -$#,##0.00; 0',
        alignment: {
            wrapText: false,
            horizontal: 'center',
            vertical: 'center'
        },
        font: {
            color: 'black',
            size: 12,
        },
    })

    let rowIndex = 1, rowOffset = 0, total = 0.00;

    //Headers

    const HEADERS_LENGTH = 7;

    const HEADER_COL_DATE = 1;
    const HEADER_COL_PAYMENT_RECEIPT = 2;
    const HEADER_COL_PROPERTY = 3;
    const HEADER_COL_HOME_OWNER = 4;
    const HEADER_COL_STATUS = 5;
    const HEADER_COL_AMOUNT_CONCEPTS = 6;
    const HEADER_COL_AMOUNT_SECURITIES = 7;

    worksheet.row(rowIndex).setHeight(30);

    worksheet.cell(rowIndex, 1, rowIndex, HEADERS_LENGTH, true).string(client.name + ' [' + client.internalCode + '] - Período de Liquidación ' + period.name)
        .style({
            font: {
                color: 'white',
                size: 12,
                bold: true,
            },
            alignment: {
                wrapText: true,
                horizontal: 'center',
                vertical: 'center'
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: 'pale blue',
                fgColor: 'pale blue',
            }
        });

    rowIndex += 1;

    //<---- HEADERS ----->

    worksheet.column(HEADER_COL_DATE).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_DATE).string("Fecha").style(styleRowHeader);

    worksheet.column(HEADER_COL_PAYMENT_RECEIPT).setWidth(30);
    worksheet.cell(rowIndex, HEADER_COL_PAYMENT_RECEIPT).string("Número de Recibo").style(styleRowHeader);

    worksheet.column(HEADER_COL_PROPERTY).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_PROPERTY).string("Propiedad").style(styleRowHeader);

    worksheet.column(HEADER_COL_HOME_OWNER).setWidth(50);
    worksheet.cell(rowIndex, HEADER_COL_HOME_OWNER).string("Propietario").style(styleRowHeader);

    worksheet.column(HEADER_COL_STATUS).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_STATUS).string("Estado").style(styleRowHeader);

    worksheet.column(HEADER_COL_AMOUNT_CONCEPTS).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_AMOUNT_CONCEPTS).string("Importe Conceptos").style(styleRowHeader);

    worksheet.column(HEADER_COL_AMOUNT_SECURITIES).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_AMOUNT_SECURITIES).string("Importe Valores").style(styleRowHeader);

    //<----- DATA ROWS ----->

    for (const collection of collections) {

        rowIndex += 1;

        worksheet.cell(rowIndex, HEADER_COL_DATE).date(collection.receiptDate).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            },
            numberFormat: 'dd/mm/yyyy'
        });

        worksheet.cell(rowIndex, HEADER_COL_STATUS).string(collection.status).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            }
        });

        let amount = 0.00;

        if (collection.statusId === CollectionStatus.eStatus.get('deleted').value) {
            amount = (-1) * Number.parseFloat(collection.amountSecurities);
        } else {
            amount = Number.parseFloat(collection.amountSecurities);
        }

        worksheet.cell(rowIndex, HEADER_COL_AMOUNT_SECURITIES).number(amount).style(styleCurrencyFormat);

        total += Number.parseFloat(amount);

        //Verificamos si es una cobranza unica, un DNI o una cobranza dividida en varias propiedades...

        if ((collection.Properties === null)||(collection.Properties.length === 0)) { //Deposito no identificado

            worksheet.cell(rowIndex, HEADER_COL_PAYMENT_RECEIPT).string(collection.receiptNumber).style({
                alignment: {
                    wrapText: false,
                    horizontal: 'center',
                    vertical: 'center'
                },
            });

            worksheet.cell(rowIndex, HEADER_COL_PROPERTY).string("DNI").style({
                alignment: {
                    wrapText: true,
                    horizontal: 'center',
                    vertical: 'center'
                }
            });

            worksheet.cell(rowIndex, HEADER_COL_HOME_OWNER).string("Depósito no identificado").style({
                alignment: {
                    wrapText: false,
                    horizontal: 'center',
                    vertical: 'center'
                }
            });

            worksheet.cell(rowIndex, HEADER_COL_AMOUNT_CONCEPTS).number(Number.parseFloat(collection.amountConcepts)).style(styleCurrencyFormat);

        } else if (collection.Properties.length === 1) { //Un unico propietario

            worksheet.cell(rowIndex, HEADER_COL_PAYMENT_RECEIPT).string(collection.receiptNumber).style({
                alignment: {
                    wrapText: false,
                    horizontal: 'center',
                    vertical: 'center'
                },
            });

            worksheet.cell(rowIndex, HEADER_COL_PROPERTY).string(collection.Properties[0].homeOwner.property).style({
                alignment: {
                    wrapText: true,
                    horizontal: 'center',
                    vertical: 'center'
                }
            });

            worksheet.cell(rowIndex, HEADER_COL_HOME_OWNER).string(collection.Properties[0].homeOwner.name).style({
                alignment: {
                    wrapText: false,
                    horizontal: 'center',
                    vertical: 'center'
                }
            });

            worksheet.cell(rowIndex, HEADER_COL_AMOUNT_CONCEPTS).number(Number.parseFloat(collection.amountConcepts)).style(styleCurrencyFormat);

        } else { //expensa dividida en multiples propietarios

            let rowIndexOffset = 0;

            for (const property of collection.Properties) {

                worksheet.cell(rowIndex + rowIndexOffset, HEADER_COL_PAYMENT_RECEIPT).string(collection.receiptNumber + "-" + property.receiptNumber).style({
                    alignment: {
                        wrapText: false,
                        horizontal: 'center',
                        vertical: 'center'
                    },
                });

                worksheet.cell(rowIndex + rowIndexOffset, HEADER_COL_PROPERTY).string(property.homeOwner.property).style({
                    alignment: {
                        wrapText: true,
                        horizontal: 'center',
                        vertical: 'center'
                    }
                });

                worksheet.cell(rowIndex + rowIndexOffset, HEADER_COL_HOME_OWNER).string(property.homeOwner.name).style({
                    alignment: {
                        wrapText: false,
                        horizontal: 'center',
                        vertical: 'center'
                    }
                });

                worksheet.cell(rowIndex + rowIndexOffset, HEADER_COL_AMOUNT_CONCEPTS).number(Number.parseFloat(property.amount)).style(styleCurrencyFormat);

                rowIndexOffset++;
            }

            worksheet.cell(rowIndex, HEADER_COL_DATE, (rowIndex + rowIndexOffset - 1), HEADER_COL_DATE, true)
            worksheet.cell(rowIndex, HEADER_COL_STATUS, (rowIndex + rowIndexOffset - 1), HEADER_COL_STATUS, true)
            worksheet.cell(rowIndex, HEADER_COL_AMOUNT_SECURITIES, (rowIndex + rowIndexOffset - 1), HEADER_COL_AMOUNT_SECURITIES, true)

            rowIndex += rowIndexOffset - 1;
        }

    }

    rowIndex += 1; worksheet.cell(rowIndex, 1, rowIndex, HEADERS_LENGTH - 1, true).string("Total Valores:").style(
        {
            font: {
                color: 'black',
                size: 12,
                bold: true,
            },
            alignment: {
                wrapText: false,
                horizontal: 'right',
                vertical: 'center'
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: 'pale blue',
                fgColor: 'pale blue',
            }
        });

    worksheet.cell(rowIndex, HEADERS_LENGTH).number(Number.parseFloat(total)).style(
        {
            numberFormat: '$#,##0.00; -$#,##0.00; 0',
            font: {
                color: 'black',
                size: 12,
                bold: true,
            },
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: 'pale blue',
                fgColor: 'pale blue',
            }
        });

    workbook.write(`Reporte de Cobranzas ${client.internalCode}-${period.name}.xlsx`, res);
}
