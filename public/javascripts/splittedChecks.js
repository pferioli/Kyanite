async function getCheckRemainingBalance(checkId, splitType) {

    const response = await fetch('/checks/split/remainingBalance/' + checkId + '?' + new URLSearchParams({ splitType: splitType }));

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const balance = await response.json();

    return balance;

    // fetch('/checks/split/remainingBalance/' + checkId + '?' + new URLSearchParams({ splitType: splitType })
    //     // , {
    //     //     method: 'POST',
    //     //     headers: {
    //     //         'Accept': 'application/json',
    //     //         'Content-Type': 'application/json'
    //     //     },
    //     //     body: JSON.stringify({ a: 1, b: 'Textual content' })
    //     // }
    // )
    //     .then(response => {
    //         if (response.status == 200) {
    //             return response.text();
    //         } else {
    //             throw "Respuesta incorrecta del servidor"
    //         }
    //     })
    //     .then(response => {

    //         if (response != '') {
    //             const value = JSON.parse(response); return value;
    //         } else {
    //             return -1;
    //         }
    //     })
    //     .catch(err => {
    //         console.log(err);
    //     });
}