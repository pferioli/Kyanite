function populateAccountingGroups(fieldID, selectedId) {
    let selectField = document.getElementById(fieldID);
    selectField.options.length = 0;

    if (selectedId === undefined)
        selectField.innerHTML = selectField.innerHTML + "<option value=\"\" selected disabled>" + "Seleccione el grupo de cuentas" + "</option>"

    fetch('/accountingImputations/groups')
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {

            let groups = JSON.parse(response);

            for (i = 0; i < groups.length; i++) {
                if (Number.parseInt(selectedId) === groups[i].id) {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + groups[i].id + "\" selected>" + groups[i].name + "</option>"
                } else {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + groups[i].id + "\">" + groups[i].name + "</option>"
                }
            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}

function populateImputations(fieldID, groupId, selectedId) {

    if ((typeof groupId === 'undefined') || (groupId === '')) return;

    let selectField = document.getElementById(fieldID);
    selectField.options.length = 0;

    return fetch('/accountingImputations/byGroup/' + groupId)
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {

            let imputations = JSON.parse(response);

            for (i = 0; i < imputations.length; i++) {
                if (Number.parseInt(selectedId) === imputations[i].id) {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + imputations[i].id + "\" selected>" + imputations[i].name + "</option>"
                } else {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + imputations[i].id + "\">" + imputations[i].name + "</option>"
                }
            }
            M.FormSelect.init(selectField, {});

            return selectField.value
        })
        .catch(err => {
            console.log(err);
        });
}

async function getaccountingImputationsbyGroup(groupId) {

    try {
        const response = await fetch('/accountingImputations/byGroup/' + groupId)
        if (response.status == 200) {
            var data = await response.json();
            return data;
        } else {
            throw "Respuesta incorrecta del servidor"
        }
    } catch (err) {
        console.log(err);
    }
}