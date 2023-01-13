// Require library

var Excel = require('excel4node');

module.exports.generateExcel = async function (client, rows, user, res) {

    var workbook = new Excel.Workbook();

    var worksheet = workbook.addWorksheet(`Cuenta Corriente ${client.internalCode}`);

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

    let rowIndex = 1, rowOffset = 0;

    // ----------------------------------------------------------------------//
    // DESTINATION FILE
    // ----------------------------------------------------------------------//

    //Headers

    const HEADERS_LENGTH = 7;

    const HEADER_COL_DATE = 1;
    const HEADER_COL_BILLING_PERIOD = 2;
    const HEADER_COL_LOT = 3;
    const HEADER_COL_HOME_OWNER = 4;
    const HEADER_COL_CHARGE = 5;
    const HEADER_COL_CHARGE_ID = 6;
    const HEADER_COL_IMPUTATION = 7;

    //<---- HEADERS ----->

    worksheet.row(rowIndex).setHeight(30);

    worksheet.cell(rowIndex, 1, rowIndex, HEADERS_LENGTH, true).string(client.name + ' [' + client.internalCode + '] - CTA CTE PROPIETARIOS')
        .style({
            font: {
                color: 'black',
                size: 12,
                bold: true,
            },
            alignment: {
                wrapText: true,
                horizontal: 'left',
                vertical: 'center'
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: 'white',
                fgColor: 'white',
            }
        });

    rowIndex += 1;

    worksheet.column(HEADER_COL_DATE).setWidth(30);
    worksheet.cell(rowIndex, HEADER_COL_DATE).string("FECHA").style(styleRowHeader);

    worksheet.column(HEADER_COL_BILLING_PERIOD).setWidth(30);
    worksheet.cell(rowIndex, HEADER_COL_BILLING_PERIOD).string("PERIODO").style(styleRowHeader);

    worksheet.column(HEADER_COL_LOT).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_LOT).string("LOTE Nº").style(styleRowHeader);

    worksheet.column(HEADER_COL_HOME_OWNER).setWidth(70);
    worksheet.cell(rowIndex, HEADER_COL_HOME_OWNER).string("PROPIETARIO").style(styleRowHeader);

    worksheet.column(HEADER_COL_CHARGE).setWidth(50);
    worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("CARGO").style(styleRowHeader);

    worksheet.column(HEADER_COL_CHARGE_ID).setWidth(20);
    worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).string("ID CARGO").style(styleRowHeader);

    worksheet.column(HEADER_COL_IMPUTATION).setWidth(30);
    worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).string("IMPUTACION").style(styleRowHeader);

    rowIndex += 1;

    //<----- DATA ROWS ----->

    const writeDefaultCells = (row) => {

        const SOURCE_COL_DATE = 1;
        const SOURCE_COL_LOT = 2;
        const SOURCE_COL_HOME_OWNER = 4;

        //FECHA
        worksheet.cell(rowIndex, HEADER_COL_DATE).date(row.rowValues[SOURCE_COL_DATE]).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            },
            numberFormat: 'mm-yyyy'
        });

        //PERIODO
        worksheet.cell(rowIndex, HEADER_COL_BILLING_PERIOD).date(row.rowValues[SOURCE_COL_DATE].toString()).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            },
            numberFormat: 'mm-yyyy'
        });

        //LOTE
        worksheet.cell(rowIndex, HEADER_COL_LOT).number(row.rowValues[SOURCE_COL_LOT]).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            }
        });

        //PROPIETARIO
        worksheet.cell(rowIndex, HEADER_COL_HOME_OWNER).string(row.rowValues[SOURCE_COL_HOME_OWNER].toString()).style({
            alignment: {
                wrapText: false,
                horizontal: 'center',
                vertical: 'center'
            }
        });
    }

    for (const row of rows) {

        if (row.rowValues.length === 0) break;

        //SALDO ANTERIOR
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Saldo Anterior").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(1).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[6])).style(styleCurrencyFormat);
        rowIndex += 1;

        //PAGOS DEL PERIODO
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Pagos del Período").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(2).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[7])).style(styleCurrencyFormat);
        rowIndex += 1;

        //PAGOS DE PERIODO ANTERIOR
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Pagos del Período Anterior").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(3).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[8])).style(styleCurrencyFormat);
        rowIndex += 1;

        //AJUSTE PRONTO PAGO
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Ajuste Pronto Pago").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(4).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[9])).style(styleCurrencyFormat);
        rowIndex += 1;

        //PUNITORIOS 3%
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Punitorios 3%").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(5).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[11])).style(styleCurrencyFormat);
        rowIndex += 1;

        //GASTOS DEL MES
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Gastos del Mes").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(6).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[13])).style(styleCurrencyFormat);
        rowIndex += 1;

        //CUOTA EXTRAORDINARIA
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Cuota Extraordinaria").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(7).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[14])).style(styleCurrencyFormat);
        rowIndex += 1;

        //GASTOS TEMPORADA DE VERANO
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Gastos temporada de verano").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(8).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[15])).style(styleCurrencyFormat);
        rowIndex += 1;

        //CORTE DE PASTO LOTE BALDIO/OBRAS
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Corte de pasto lote baldío/obra").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(9).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[16])).style(styleCurrencyFormat);
        rowIndex += 1;

        //CANON DE OBRA / EXCESOS PLAZO DE OBRA
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Canon de obra / Excesos plazo de obra").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(10).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[17])).style(styleCurrencyFormat);
        rowIndex += 1;

        //VISADOS DE OBRAS / APROB. DE PLANOS
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Visados de Obras / Aprox. de planos").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(11).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[18])).style(styleCurrencyFormat);
        rowIndex += 1;

        //MULTAS
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Multas").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(12).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[19])).style(styleCurrencyFormat);
        rowIndex += 1;

        //SUM
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("SUM").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(13).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[20])).style(styleCurrencyFormat);
        rowIndex += 1;

        //CESTOS DE RESIDUOS
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Cestos de Residuos").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(14).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[21])).style(styleCurrencyFormat);
        rowIndex += 1;

        //COLONIA
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Colonia").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(15).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[22])).style(styleCurrencyFormat);
        rowIndex += 1;

        //ACT. DEPORTICAS Y DE RECREACION
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Act. Deportivas y de recreación").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(16).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[23])).style(styleCurrencyFormat);
        rowIndex += 1;

        //GASTOS PARTIC. LEGALES / OTROS
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Gastos Partic. Legales / Otros").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(17).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[24])).style(styleCurrencyFormat);
        rowIndex += 1;

        //REDONDEO
        writeDefaultCells(row);
        worksheet.cell(rowIndex, HEADER_COL_CHARGE).string("Redondeo").style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_CHARGE_ID).number(18).style({ alignment: { wrapText: false, horizontal: 'center', vertical: 'center' } });
        worksheet.cell(rowIndex, HEADER_COL_IMPUTATION).number(Number.parseFloat(row.rowValues[26])).style(styleCurrencyFormat);
        rowIndex += 1;
    }

    workbook.write(`Cuenta Corriente Propietarios ${client.internalCode}.xlsx`, res);
}
