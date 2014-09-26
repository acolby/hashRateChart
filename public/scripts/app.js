'use strict';

angular.module('shouldImine', [
  'ngRoute',
  'ngCookies'
])
.config(function ($routeProvider) {
$routeProvider
  .when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  })
  .otherwise({
    redirectTo: '/'
  });
});