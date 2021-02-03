function getSupplierCategory(supplierId) {

    let supplierCategory = document.getElementById('supplierCategory');

    fetch('/suppliers/ajax/raw/' + supplierId)
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
            M.updateTextFields();
        })
        .catch(err => {
            console.log(err);
        });
}