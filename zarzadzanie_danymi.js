//Uzyskanie dostepu do bazy danych
const encryptedAPIkey = "U2FsdGVkX18Ikhl8uGAj3j/+XdcYdUjGGbomZZUPR2BZyAPaVIXPGpNJFlr+OPjxiwWvRlQ6wnnlqqUXMtXN4w==";
let passcode = "";
let APIkey = "";
const url = "https://aplikacja-ac0d.restdb.io/rest/";
const settings = {
    "async": true,
    "crossDomain": true,
    "url": "",
    "method": "",
    "headers": {
      "content-type": "application/json",
      "x-apikey": APIkey,
      "cache-control": "no-cache"
    }
  }

// Obsługa kolekcji
function pobierzListeElementow(kolekcja, onSuccess) {
    settings.method = "GET";
    settings.url = url+kolekcja;
    try {
        $.ajax(settings).done( response => {
            if(typeof(onSuccess)=="function") {
                onSuccess(response);
            }
        })
    }
    catch(e) {
        console.log(e);
    }
}

function dodajElement(kolekcja, element, onSuccess) {
    settings.method = "POST";
    settings.url = url+kolekcja;
    settings.processData = false;
    settings.data = JSON.stringify(element);
    try {
        $.ajax(settings).done( response => {
            if(typeof(onSuccess)=="function") {
                onSuccess(response);
            }
        });
    }
    catch(e) {
        console.log(e);
    }
}

function pobierzElement(kolekcja, elementId, onSuccess) {
    settings.method = "GET";
    settings.url = url+kolekcja+"/"+elementId;
    try {
        $.ajax(settings).done( response => {
            if(typeof(onSuccess)=="function") {
                onSuccess(response);
            }
        })
    }
    catch(e) {
        console.log(e);
    }
}

function aktualizujElement(kolekcja, element, onSuccess) {
    settings.method = "PUT";
    settings.url = url+kolekcja+"/"+element._id;
    settings.data = JSON.stringify(element);
    try {
        $.ajax(settings).done( response => {
            if(typeof(onSuccess)=="function") {
                onSuccess(response);
            }
        });
    }
    catch(e) {
        console.log(e);
    }
}


function usunElement(kolekcja, elementId,onSuccess) {
    settings.method = "DELETE";
    settings.url = url+kolekcja+"/"+elementId;
    try {
        $.ajax(settings).done( response => {
            if(typeof(onSuccess)=="function") {
                onSuccess(response);
            }
        });
    }
    catch(e) {
        console.log(e);
    }
}

// Klasy do obsługi danych

class Klient {
    id;
    Imie = "";
    Nazwisko = "";
    Tel = "";
}

class Zabieg {
    id;
    Nazwa = "";
    Czasochlonnosc = 0;
    Opis = "";
}

class Zamowienia {
    id;
    idKlienta;
    idZabiegu;
    Termin = "";
}

function encrypt(content, password) { 
    return CryptoJS.AES.encrypt(JSON.stringify({ content }), password).toString();
}

function decrypt(crypted, password) {
    try {
        return JSON.parse(CryptoJS.AES.decrypt(crypted, password).toString(CryptoJS.enc.Utf8)).content;
    }
    catch(e) {
        return "";
    }
}

function dodaj(a,b) {
    return a+b;
}

module.exports = {
    dodaj,
    pobierzListeElementow,
    dodajElement,
    pobierzElement,
    aktualizujElement,
    usunElement,
    Klient,
    Zabieg,
    Zamowienia,
    encrypt,
    decrypt
}