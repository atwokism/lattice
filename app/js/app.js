/**
 * Angular JS SPA for Lattice.io.
 * @author: Ezra Kahimbaara <ezra@atwoki.com>
 */
angular.module('lattice',['ngResource','ngRoute','lattice.services','lattice.controllers', 'lattice.directives' ], function() {
        // configure services
    }
).config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/card/:id', {
            templateUrl: '/lattice/app/views/card.html',
            controller: 'LatticeController'
        })
        .when('/cards', {
            templateUrl: '/lattice/app/views/cards.html',
            controller: 'LatticeController'
        })
        .when('/board/:id', {
            templateUrl: '/lattice/app/views/board.html',
            controller: 'LatticeController'
        })
        .when('/boards', {
            templateUrl: '/lattice/app/views/boards.html',
            controller: 'LatticeController'
        })
        .when('/action/:id', {
            templateUrl: '/lattice/app/views/action.html',
            controller: 'LatticeController'
        })
        .when('/activity', {
            templateUrl: '/lattice/app/views/actions.html',
            controller: 'LatticeController'
        });
}]);
