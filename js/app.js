'use strict';

var groceryListApp = angular.module('groceryApp', ['groceryAppControllers']);

groceryListApp.config(['$routeProvider', 
function($routeProvider) {
    $routeProvider
    .when('/lists/:listId', {
        templateUrl: 'partials/list-detail.html',
        controller: 'GroceryListCtrl'
    })
    .when('/lists/:listId/edit', {
        templateUrl: 'partials/list-edit.html',
        controller: 'GroceryListCtrl'
    })
    .when('/create', {
        templateUrl: 'partials/list-edit.html',
        controller: 'GroceryListCtrl'
    })
    .otherwise({
        redirectTo: '/create'
    });
}]);