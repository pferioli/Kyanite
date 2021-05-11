async function getBanks() {

    const response = await fetch('/checks/ajax/getBanks');

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const banks = await response.json();

    return banks;
}
