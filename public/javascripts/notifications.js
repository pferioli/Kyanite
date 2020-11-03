const SEV_FATAL = 1;
const SEV_CRITICAL = 2;
const SEV_MINOR = 3;
const SEV_WARNING = 4;

var notificationsTimer;

function notificationsTimerStart() {
    notificationsTimer = setInterval(checkNotifications, 60 * 1000);
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

            let pendingNotifications = JSON.parse(responseText);

            let color;

            switch (pendingNotifications.lowestSeverity) {
                case SEV_FATAL: { color = "red"; } break;
                case SEV_CRITICAL: { color = "amber"; } break;
                case SEV_MINOR: { color = "purple"; } break;
                case SEV_WARNING: { color = "blue"; } break;
                default: { color = "red" } break;
            }

            let notifications = document.getElementById("notifications");

            notifications.firstElementChild.innerHTML = '<i class="material-icons tiny left ' + color + '-text" data-position="bottom"' +
                ' data-delay="50" data-tooltip="Alertas Pendientes">notification_important</i>' +
                '<span style="margin-left:-7px; vertical-align: 2px;" class="new badge ' + color + '" data-badge-caption="nuevas">' + pendingNotifications.sevCount + '</span>';

            if (pendingNotifications.length === 0) {
                notifications.style.visibility = "hidden";
            } else {
                notifications.style.visibility = "initial";
                M.toast({ html: 'Tiene nuevas notificaciones pendientes', classes: 'rounded' })
            }

        })
        .catch(err => {
            console.log(err);
        });
}