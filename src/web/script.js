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

        .when("/test", {
            templateUrl: "pages/test.html",
            controller: "testController"
        })

        .when('/server',{
            templateUrl : 'pages/server.html' ,
            controller : 'serverController',
            resolve: {
                api: function() {
                    var xhttp = new XMLHttpRequest();
                    xhttp.open("GET", "http://localhost:5000/API/servers");
                    xhttp.setRequestHeader("Content-type", "application/json");
                    xhttp.send();
                    xhttp.onload = function (data) {
                        if (xhttp.readyState === 4) {
                            if (xhttp.status === 200) {
                                var response = xhttp.responseText;
                                return response;
                                // ici, response est un tableau
                                // chaque élément du tableau sera un serveur
                                // chaque index de ce tableau sera un objet
                                // chaque objet aura les propriétés : guildID, iconURL, guildName
                            } else {
                                console.error(xhttp.statusText);
                            }
                        }
                    };
                }
            }
        });
});

app.controller("testController", (api) => {
    $scope.servers = api;
});

// create the controller and inject Angular's $scope
app.controller('mainController', function($scope) {
    // create a message to display in our view
    $scope.message = 'Everyone come and see how good I look!';
});

app.controller('aboutController', function($scope) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://lovalhosy:5000/API/", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
    var response = JSON.parse(xhttp.responseText);
    $scope.message = 'Look! I am an about page.';
});

app.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

app.controller('serverController', function($scope) {
    $scope.money = '200';
});


app.controller('serversController', function($scope) {
    $scope.money = '200';
});

/*


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
        })

        .when("/test", {
            templateUrl: "pages/test.html",
            controller: "testController"
        });
});

app.controller("testController", ($scope) => {

});

// create the controller and inject Angular's $scope
app.controller("mainController", ($scope) => {
    // create a message to display in our view
    $scope.message = "Everyone come and see how good I look!";
});

app.controller("aboutController", ($scope) => {
    $scope.message = "Look! I am an about page.";
});

app.controller('contactController', function($scope) {
    $scope.message = 'Contact us! JK. This is just a demo.';
});

app.controller('serverController', function($scope) {
    $scope.money = '200';
});


app.controller('serversController', function($scope) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://localhost:5000/API/servers");
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
    xhttp.onload = function (data) {
        if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
                var response = xhttp.responseText;
                // ici, response est un tableau
                // chaque élément du tableau sera un serveur
                // chaque index de ce tableau sera un objet
                // chaque objet aura les propriétés : guildID, iconURL, guildName
            } else {
                console.error(xhttp.statusText);
            }
        }
    };
    $scope.money = '200';
});
 */