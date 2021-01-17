
async function getClientAccounts(clientId, accountType) {

    let fetchUrl = '/accounts/getByCustomerID/' + clientId
    if (accountType !== undefined) { fetchUrl = fetchUrl + '?' + 'accountType=' + accountType }

    try {
        const response = await fetch(fetchUrl)
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
