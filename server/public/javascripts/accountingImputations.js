function populateGroups(fieldID) {
    let selectField = document.getElementById(fieldID);
    selectField.options.length = 0;

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
                selectField.innerHTML = selectField.innerHTML + "<option value=\"" + groups[i].id + "\">" + groups[i].name + "</option>"
            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}

function populateImputations(fieldID, groupId) {

    if ((typeof groupId === 'undefined') || (groupId === '')) return;

    let selectField = document.getElementById(fieldID);
    selectField.options.length = 0;

    fetch('/accountingImputations/byGroup/' + groupId)
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
                selectField.innerHTML = selectField.innerHTML + "<option value=\"" + imputations[i].id + "\">" + imputations[i].name + "</option>"
            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}