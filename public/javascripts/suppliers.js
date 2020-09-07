function getSupplierCategory(supplierId, elementId) {

    let supplierCategory = document.getElementById(elementId);

    fetch('/suppliers/info/raw/' + supplierId)
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(response => {
            const supplier = JSON.parse(response);
            supplierCategory.value = supplier.supplierCategory.name
        })
        .catch(err => {
            console.log(err);
        });
}