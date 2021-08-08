async function calculateRemainingBalance(categoryId) {

    try {
        const response = await fetch('/investments/ajax/getCategoryDetailsById/' + categoryId)
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
