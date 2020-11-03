
function getActiveBillingPeriod(clientId) {

    let billingPeriod = document.getElementById('billingPeriod');
    let billingPeriodId = document.getElementById('billingPeriodId');

    billingPeriodId.value = '';
    billingPeriod.value = '';

    fetch('/periods/active/' + clientId)
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {

            if (response === '') {
                var _elem = document.getElementById('modalBillingPeriod');
                var modal = M.Modal.getInstance(_elem);
                modal.open();
            } else {
                const period = JSON.parse(response);
                billingPeriodId.value = period.id;
                billingPeriod.value = period.name
                M.updateTextFields();
                if (period.id) {
                    document.getElementById('add_button').disabled = false;
                    document.getElementById('add_next_button').disabled = false;
                }
            }
        })
        .catch(err => {
            console.log(err);
        });
}

function getBillingPeriodsByClient(clientId) {

    let selectField = document.getElementById('billingPeriodSelect');
    selectField.options.length = 0;

    let periodId = document.getElementById('periodId');
    periodId.value = ""

    fetch('/periods/byCustomer/' + clientId)
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {

            const period = JSON.parse(response);

            if (period.length > 0) {
                for (i = 0; i < period.length; i++) {
                    switch (period[i].statusId) {
                        case 1: {
                            selectField.innerHTML = selectField.innerHTML + "<option value=\"" + period[i].id + "\" selected>" + period[i].name + "</option>";
                            periodId.value = period[i].id
                        } break;
                        case 2: { selectField.innerHTML = selectField.innerHTML + "<option value=\"" + period[i].id + "\">" + period[i].name + "</option>" } break;
                    }
                }
            } else {
                selectField.innerHTML = "<option value=\"\" disabled selected> No se encontraron Periodos de Liquidación para el cliente seleccionado </option>"
            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}