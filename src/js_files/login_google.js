
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTJATnrqqDNge8rrz5sfH1_lsdObPm1XM",
    authDomain: "inventario-3a182.firebaseapp.com",
    projectId: "inventario-3a182",
    storageBucket: "inventario-3a182.appspot.com",
    messagingSenderId: "822013380768",
    appId: "1:822013380768:web:e002f8ca8eb3fe6188e1c5",
    measurementId: "G-5N1DEB7H7N"
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Iniciar sesion con email y password
// const submit = document.getElementById("submit");
// submit.addEventListener("click", function(event){
//     event.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     //const hashedPassword = sha256(password);
//     signInWithEmailAndPassword(auth, email, password)
//     .then((userCredential) => {
//         console.log(userCredential)
//         alert(userCredential)
//         var token = userCredential.user.accessToken
//         //window.location.href = 'index.html';
//         // ...
//     })
//     .catch((error) => {
//         const errorCode = error.code;
//         const errorMessage = error.message;
//         toastr.warning("Datos incorrectos ("+errorCode+")")
//     });
// })

//Iniciar Sesion con Correo USACH
const googleButton = document.querySelector('#googleLogin')
googleButton.addEventListener('click', e =>{
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
    .then((result) => {
        const email = result._tokenResponse.email;
        const name = result._tokenResponse.name;
        if (email.split('@')[1] !== "usach.cl") {
            Swal.fire({
                title: 'Acceso denegado',
                text: 'Lo sentimos el correo que has ingresado no se encuentra autorizado',
                icon: 'error',
                allowEscapeKey: false,
                allowOutsideClick: false,
                confirmButtonColor: '#40CFFF',
                confirmButtonText: 'CONTINUAR',
                footer: '<a href="http://mail.usach.cl" Target="_blank"><IMG SRC="images/logo_verde_h.png" width="192px" height="60px"></a>'
            }).then(() => {
                window.location.href = '/login.html';
            })
        } else {
            var token = result.user.accessToken
            sessionStorage.setItem('email', email);
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('name', result.user.displayName);
            window.location.href = '/index.html';
        };
    })
    .catch(error => {
        console.log(error);
    })
})