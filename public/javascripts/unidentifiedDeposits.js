
async function getNotesByDepositId(depositId) {

    let url = '/incomes/unidentifiedDeposits/ajax/getNotesByDepositId/' + depositId;

    const response = await fetch(url);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    return await response.json();
}