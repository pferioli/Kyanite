function getClientAccounts(clientId, fieldID, skipValue) {

    let selectField = document.getElementById(fieldID);
    selectField.options.length = 0;
    selectField.innerHTML = selectField.innerHTML + "<option value=\"\" selected disabled>" + "Seleccione la cuenta de Destino" + "</option>"

    fetch('/accounts/getByCustomerID/' + clientId)
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {
            const accounts = JSON.parse(response);
            for (i = 0; i < accounts.length; i++) {
                if (skipValue != accounts[i].id) {
                    selectField.innerHTML = selectField.innerHTML + "<option value=\"" + accounts[i].id + "\">" +
                        "[" + accounts[i].accountType.account + "] " + accounts[i].accountType.description + " (ID:" + accounts[i].id + ")" + "</option>"
                }
            }

            M.FormSelect.init(selectField, {});
        })
        .catch(err => {
            console.log(err);
        });
}

async function getClientAccountsInfo(accountId) {

    try {
        const response = await fetch('/accounts/getByAccountID/' + accountId)
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