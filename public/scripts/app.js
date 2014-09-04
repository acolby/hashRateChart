'use strict';

angular.module('shouldImine', [
  'ngRoute'
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