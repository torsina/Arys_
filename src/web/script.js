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