// Require library

var Excel = require('excel4node');

module.exports.generateExcel = async function (client, paymentOrders, periods, user, res) {

    var workbook = new Excel.Workbook();

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

    var styleRowGroupLevel1Start = workbook.createStyle({
        font: {
            color: 'black',
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
            bgColor: 'gray-50',
            fgColor: 'gray-50',
        }
    });

    var styleRowGroupLevel2 = workbook.createStyle({
        font: {
            color: 'black',
            size: 10,
            bold: false,
        },
        alignment: {
            wrapText: true,
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

    var styleRowGroupLevel2End = workbook.createStyle({
        font: {
            color: 'black',
            size: 12,
            bold: true,
        },
        alignment: {
            wrapText: true,
            horizontal: 'right',
            vertical: 'center'
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            bgColor: 'gray-50',
            fgColor: 'gray-50',
        }
    });

    var styleRowGroupLevel2SubTotal = workbook.createStyle({
        numberFormat: '$#,##0.00; -$#,##0.00; 0',
        font: {
            color: 'black',
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
            bgColor: 'gray-50',
            fgColor: 'gray-50',
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

    let rowIndex = 1; rowOffset = 0; let subTotal = 0.0; let total = 0.0;

    let lastGroupId = 0; group = ""; let lastAccountImputationId = 0; accountingImputation = ""; isGroupOpen = false;

    //Headers

    const HEADER_COL_PAYMENT_ORDER = 1;
    const HEADER_COL_SUPPLIER = 2;
    const HEADER_COL_PAYMENT_RECEIPT = 3;
    const HEADER_COL_DATE = 4;
    const HEADER_COL_DESCRIPTION = 5;
    const HEADER_COL_ACCOUNT = 6;
    const HEADER_COL_CHECK = 7;
    const HEADER_COL_AMOUNT = 8;

    let periodName = ""; for (const period of periods) { periodName += period.name + " "; }; periodName = periodName.slice(0, -1);

    const worksheet = workbook.addWorksheet(`Reporte de gastos ${client.internalCode}`);

    worksheet.row(rowIndex).setHeight(30);

    worksheet.cell(rowIndex, 1, rowIndex, 8, true).string(client.name + ' [' + client.internalCode + '] - Período de Liquidación ' + periodName)
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

    rowIndex += 1; worksheet.cell(rowIndex, HEADER_COL_PAYMENT_ORDER).string("");

    rowIndex += 1;

    worksheet.column(HEADER_COL_PAYMENT_ORDER).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_PAYMENT_ORDER).string("Orden de Pago").style(styleRowHeader);

    worksheet.column(HEADER_COL_SUPPLIER).setWidth(50);
    worksheet.cell(rowIndex, HEADER_COL_SUPPLIER).string("Proveedor").style(styleRowHeader);

    worksheet.column(HEADER_COL_PAYMENT_RECEIPT).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_PAYMENT_RECEIPT).string("Factura").style(styleRowHeader);

    worksheet.column(HEADER_COL_DATE).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_DATE).string("Fecha").style(styleRowHeader);

    worksheet.column(HEADER_COL_DESCRIPTION).setWidth(100);
    worksheet.cell(rowIndex, HEADER_COL_DESCRIPTION).string("Descripcion").style(styleRowHeader);

    worksheet.column(HEADER_COL_ACCOUNT).setWidth(30);
    worksheet.cell(rowIndex, HEADER_COL_ACCOUNT).string("Cuenta").style(styleRowHeader);

    worksheet.column(HEADER_COL_CHECK).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_CHECK).string("Cheque").style(styleRowHeader);

    worksheet.column(HEADER_COL_AMOUNT).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_AMOUNT).string("Importe").style(styleRowHeader);

    for (const paymentOrder of paymentOrders) {

        if (lastGroupId !== paymentOrder.paymentReceipt.accountingImputation.accountingGroup.id) {

            if (lastGroupId !== 0) { //cambio de grupo

                rowIndex += 1;

                worksheet.cell(rowIndex, 1, rowIndex, 7, true).string("subtotal para " + group + ":").style(styleRowGroupLevel2End);
                worksheet.cell(rowIndex, HEADER_COL_AMOUNT).number(Number.parseFloat(subTotal)).style(styleRowGroupLevel2SubTotal);
                rowIndex += 1;

                subTotal = 0.0; isGroupOpen = false;

                worksheet.cell(rowIndex, 1, rowIndex, 8, true).string("");
            }

            rowIndex += 1; isGroupOpen = true;

            lastGroupId = paymentOrder.paymentReceipt.accountingImputation.accountingGroup.id;

            group = paymentOrder.paymentReceipt.accountingImputation.accountingGroup.name;

            worksheet.cell(rowIndex, 1, rowIndex, 8, true).string(paymentOrder.paymentReceipt.accountingImputation.accountingGroup.name).style(styleRowGroupLevel1Start);
        }

        if (lastAccountImputationId !== paymentOrder.paymentReceipt.accountingImputationId) {

            rowIndex += 1;

            lastAccountImputationId = paymentOrder.paymentReceipt.accountingImputation.id;

            worksheet.cell(rowIndex, 1, rowIndex, 8, true).string(paymentOrder.paymentReceipt.accountingImputation.name).style(styleRowGroupLevel2);
        }

        rowIndex += 1; subTotal += Number.parseFloat(paymentOrder.amount); total += Number.parseFloat(paymentOrder.amount);

        worksheet.cell(rowIndex, HEADER_COL_PAYMENT_ORDER).string(paymentOrder.poNumberFormatted).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            },
        });

        worksheet.cell(rowIndex, HEADER_COL_SUPPLIER).string(paymentOrder.paymentReceipt.supplier.name).style({
            alignment: {
                wrapText: true,
                horizontal: 'left',
                vertical: 'center'
            }
        });

        worksheet.cell(rowIndex, HEADER_COL_PAYMENT_RECEIPT).string('[' + paymentOrder.paymentReceipt.receiptType.receiptType + '] ' + paymentOrder.paymentReceipt.receiptNumber).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            }
        });

        worksheet.cell(rowIndex, HEADER_COL_DATE).date(paymentOrder.paymentDate).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            },
            numberFormat: 'dd/mm/yyyy'
        });

        worksheet.cell(rowIndex, HEADER_COL_DESCRIPTION).string(paymentOrder.paymentReceipt.description).style({
            alignment: {
                wrapText: true,
                horizontal: 'left',
                vertical: 'center'
            }
        });

        worksheet.cell(rowIndex, HEADER_COL_ACCOUNT).string(paymentOrder.account.accountType.account + ' (ID:' + paymentOrder.accountId + ')').style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            }
        });

        worksheet.cell(rowIndex, HEADER_COL_CHECK).string(paymentOrder.checkId ? paymentOrder.checkSplitted.check.number : '').style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            }
        });

        worksheet.cell(rowIndex, HEADER_COL_AMOUNT).number(Number.parseFloat(paymentOrder.amount)).style(styleCurrencyFormat);
    }

    //Cerramos el ultimo grupo

    if (isGroupOpen === true) {
        rowIndex += 1;
        worksheet.cell(rowIndex, 1, rowIndex, 7, true).string("subtotal para " + group + ":").style(styleRowGroupLevel2End);
        worksheet.cell(rowIndex, HEADER_COL_AMOUNT).number(Number.parseFloat(subTotal)).style(styleRowGroupLevel2SubTotal);
    }

    rowIndex += 1; worksheet.cell(rowIndex, 1, rowIndex, 8, true).string("");

    rowIndex += 1; worksheet.cell(rowIndex, 1, rowIndex, 7, true).string("Total:").style(
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

    worksheet.cell(rowIndex, 8).number(Number.parseFloat(total)).style(
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


    workbook.write(`Reporte de Gastos ${client.internalCode}.xlsx`, res);

}
