var notificationsTimer;

function notificationsTimerStart() {
    notificationsTimer = setInterval(checkNotifications, 10 * 1000);
}

function notificationsTimerStop() {
    console.log("stopping notifications timmer...");
    clearInterval(notificationsTimer);
}

function checkNotifications() {

    fetch('/notifications/user/' + userid)
        .then(response => {
            if (response.status == 200) {
                return response.text();
            } else {
                throw "Respuesta incorrecta del servidor"
            }
        })
        .then(responseText => {
            pendingNotifications = JSON.parse(responseText);

            if (pendingNotifications.length === 0) {
                document.getElementById("notifications").style.visibility = "hidden";
            } else {
                document.getElementById("notifications").style.visibility = "initial";
            }

        })
        .catch(err => {
            console.log(err);
        });
}