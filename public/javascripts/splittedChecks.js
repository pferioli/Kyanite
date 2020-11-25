async function getCheckRemainingBalance(checkId, splitType) {

    const response = await fetch('/checks/split/remainingBalance/' + checkId + '?' + new URLSearchParams({ splitType: splitType }));

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;
}