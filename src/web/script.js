// create the module and name it scotchApp
var app = angular.module('app', ['ngRoute', "ngResource"]);

// configure our routes
app.config(function($routeProvider) {
    $routeProvider

    // route for the home page
        .when('/', {
            templateUrl : 'pages/home.html',
            controller  : 'mainController'
        })

        .when('/servers',{
            templateUrl : 'pages/servers.html' ,
            controller : 'serversController'
        })

        .when('/server/:guildID',{
            templateUrl : 'pages/server.html' ,
            controller : 'serverController'
        });
});

app.factory("API", function($http, $q) {
    return {
        servers: function() {
            var deferred = $q.defer();
            $http.get('/api/servers').then((data) => {
                deferred.resolve(data.data);
            }, deferred.reject);
            return deferred.promise;
        },
        server: function(serverID) {
            var deferred = $q.defer();
            $http.get('/api/servers/' + serverID).then((data) => {
                deferred.resolve(data.data);
            }, deferred.reject);
            return deferred.promise;
        }
    };
});

// create the controller and inject Angular's $scope
app.controller('mainController', function($scope) {
    // create a message to display in our view
    $scope.message = 'Everyone come and see how good I look!';
});

app.controller('serverController', ["$scope", "$routeParams", "API", function($scope, $routeParams, API) {
    API.server($routeParams.guildID).then(function (data) {
        $scope.server = data;
    });
}]);


app.controller('serversController', ["$scope", "API", function($scope, API) {
    API.servers().then(function (data) {
        $scope.servers = data;
    });
}]);