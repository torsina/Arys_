// create the module and name it scotchApp
var app = angular.module('app', ['ngRoute']);

// configure our routes
app.config(function($routeProvider) {
    $routeProvider

    // route for the home page
        .when('/', {
            templateUrl : 'pages/home.html',
            controller  : 'mainController'
        })

        // route for the about page
        .when('/about', {
            templateUrl : 'pages/home.html',
            controller  : 'aboutController'
        })

        // route for the contact page
        .when('/contact', {
            templateUrl : 'pages/home.html',
            controller  : 'contactController'
        })
        .when('/servers',{
            templateUrl : 'pages/servers.html' ,
            controller : 'serversController'
        })

        .when('/server',{
            templateUrl : 'pages/server.html' ,
            controller : 'serverController'
        });
});

// create the controller and inject Angular's $scope
app.controller("mainController", ($scope) => {
    // create a message to display in our view
    $scope.message = "Everyone come and see how good I look!";
});

app.controller("aboutController", ($scope) => {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://localhost:5000/API/servers");
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.setRequestHeader("Cookie", "connect.sid=" + getCookie("connect.sid"));
    xhttp.send();
    xhttp.onload = function (data) {
        if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
                console.log(xhr.responseText);
            } else {
                console.error(xhttp.statusText);
            }
        }
    };
    var response = JSON.parse(xhttp.responseText);
    $scope.message = "Look! I am an about page.";
});

app.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

app.controller('serverController', function($scope) {
    $scope.money = '200';
})


app.controller('serversController', function($scope) {
    $scope.money = '200';
})