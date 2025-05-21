var LOGO_USUARIO = null
var tiempo_para_expirar, URL_BACKEND;
var URL_SITE = window.location.href;

if(ENVIROMENT == "development"){
    //URL_LOGIN = "http://localhost:5500/login.html" // LOCALHOST
    URL_LOGIN = `${window.location.origin}/login.html`;
    tiempo_para_expirar = 720;
    URL_BACKEND = "http://localhost:5001";

}else if(ENVIROMENT == "testing"){
    URL_LOGIN = "https://www.trebolapp.cl/login.html";
    tiempo_para_expirar = 720;
    URL_BACKEND = "http://api.trebolapp.cl";
    
}else if(ENVIROMENT == "production"){
    URL_LOGIN = "https://www.trebolapp.cl/login.html";
    URL_BACKEND = "https://api.trebolapp.cl";
    tiempo_para_expirar = 720;
}
