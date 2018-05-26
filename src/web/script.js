// create the module and name it scotchApp
var app = angular.module("app", ["ngRoute"]);

// configure our routes
app.config(($routeProvider) => {
    $routeProvider

    // route for the home page
        .when("/", {
            templateUrl: "pages/home.html",
            controller: "mainController"
        })

        // route for the about page
        .when("/about", {
            templateUrl: "pages/home.html",
            controller: "aboutController"
        })

        // route for the contact page
        .when("/contact", {
            templateUrl: "pages/home.html",
            controller: "contactController"
        });
});

// create the controller and inject Angular's $scope
app.controller("mainController", ($scope) => {
    // create a message to display in our view
    $scope.message = "Everyone come and see how good I look!";
});

function cookie(name) {
    var cookie = document.cookie;
    var index = cookie.indexOf(name);
    var indexEndCookieName = index + name.length + 1;
    if (index ==! -1) {
        var indexEnd = cookie.indexOf(" ", indexEndCookieName);
        if (indexEnd !== -1) {
            return cookie.slice(indexEndCookieName, indexEnd);
        }
        return "";
    }
    return "";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

app.controller("aboutController", ($scope) => {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://lovalhosy:5000/API/", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
    var response = JSON.parse(xhttp.responseText);
    $scope.message = "Look! I am an about page.";
});

app.controller("contactController", ($scope) => {
    $scope.message = "Contact us! JK. This is just a demo.";
});