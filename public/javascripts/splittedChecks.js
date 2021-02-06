async function getCheckRemainingBalance(checkId, splitType) {

    const response = await fetch('/checks/split/ajax/remainingBalance/' + checkId + '?' + new URLSearchParams({ splitType: splitType }));

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;
}

async function getSplittedCheckInfo(checkId) {

    const response = await fetch('/checks/split/ajax/info/' + checkId);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;
}

async function getAvailableSplittedChecks(type, id, statusId) {

    let url = '/checks/split/ajax/getAvailableChecks/' + id + '?splitType=' + type;

    if (statusId != undefined) {
        url = url + '&statusId=' + statusId
    }

    const response = await fetch(url);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;
}