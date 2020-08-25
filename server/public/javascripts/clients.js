function populateClients(fieldID) {
    selectField = document.getElementById(fieldID);
    selectField.options.length = 0;

    fetch('/clients/populate')
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {

            let clients = JSON.parse(response);

            for (i = 0; i < clients.length; i++) {
                selectField.innerHTML = selectField.innerHTML + "<option value=\"" + clients[i].id + "\">" + clients[i].name + "</option>"
            }
            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}