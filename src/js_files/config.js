var LOGO_USUARIO = null
var tiempo_para_expirar, URL_BACKEND;
var URL_SITE = window.location.href;

if(ENVIROMENT == "development"){
    //URL_LOGIN = "http://localhost:5500/login.html" // LOCALHOST
    URL_LOGIN = `${window.location.origin}/login.html`;
    tiempo_para_expirar = 720
    URL_BACKEND = "http://localhost:5000";

}else if(ENVIROMENT == "testing"){
    URL_LOGIN = "http://158.170.80.113/login.html";
    tiempo_para_expirar = 720
    URL_BACKEND = "http://ec2-52-13-105-137.us-west-2.compute.amazonaws.com:5000";
    
}else if(ENVIROMENT == "production"){
    URL_LOGIN = "https://www.cideusach.cl/login.html"
    URL_BACKEND = "https://api.cideusach.cl"
    tiempo_para_expirar = 720
}
