// function getHomeOwnersByClient(clientId, selectFieldId) {

//     let selectField = document.getElementById(selectFieldId);
//     selectField.options.length = 0;
//     selectField.innerHTML = selectField.innerHTML + "<option value=\"\" selected disabled>" + "Seleccione una propiedad o propietario" + "</option>"

//     fetch('/homeOwners/getByClient/' + clientId)
//         .then(response => {
//             if (response.status == 200) {
//                 return response.text();
//             } else {
//                 throw "Respuesta incorrecta del servidor"
//             }
//         })
//         .then(response => {
//             const homeOwners = JSON.parse(response);
//             for (i = 0; i < homeOwners.length; i++) {

//                 selectField.innerHTML = selectField.innerHTML + "<option value=\"" + homeOwners[i].id + "\">" +
//                     "[" + homeOwners[i].property + "] " + homeOwners[i].name + "</option>";
//             }
//             M.FormSelect.init(selectField, {});
//         })
//         .catch(err => {
//             console.log(err);
//         });
// }

async function getHomeOwnersByClient(clientId) {

    const response = await fetch('/homeOwners/getByClient/' + clientId);

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const homeOwners = await response.json();

    return homeOwners;
}