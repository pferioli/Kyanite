async function getCheckRemainingBalance(checkId, splitType) {

    const response = await fetch('/checks/split/remainingBalance/' + checkId + '?' + new URLSearchParams({ splitType: splitType }));

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;
}

async function getSplittedCheckInfo(checkId) {

    const response = await fetch('/checks/split/info/' + checkId);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;
}