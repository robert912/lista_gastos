var data_usuario = sessionStorage.getItem('idUsuario') ? sessionStorage.getItem('idUsuario') : 0;
var token = sessionStorage.getItem('access_token');

$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        xhr.setRequestHeader("Authorization", token);
        xhr.setRequestHeader("idUsuario", data_usuario);
        if (sessionStorage.getItem('access_token') == null || sessionStorage.getItem('session_expirate') == null) {
            redirect_cierre_sesion(URL_LOGIN);
        } else {
            expiration_time = sessionStorage.getItem('session_expirate')
            now = new Date();
            var expiration = new Date(expiration_time)
            if (now.getTime() > expiration.getTime()) {
                let timerInterval;
                Swal.fire({
                    icon: "info",
                    title: "El tiempo de la sesión ha expirado",
                    html: "Volverá a la página de inicio en <b>3</b> segundos",
                    timer: 3000,
                    timerProgressBar: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                        const timer = Swal.getPopup().querySelector("b");
                        timerInterval = setInterval(() => {
                            timer.textContent -= 1;
                        }, 1000);
                    },
                    willClose: () => {
                        clearInterval(timerInterval);
                    }
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.timer) {
                        redirect_cierre_sesion(URL_LOGIN);
                    }
                });
            } else {
                updateExpiration();
            }
        }
        xhr.setRequestHeader("Authorization", sessionStorage.getItem('access_token'));
    },
    complete: function (xhr, stat) {
        if (xhr.status == 403) {
            redirect_cierre_sesion(URL_LOGIN);
        }
    }
});
