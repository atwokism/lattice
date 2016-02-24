/**
 * Angular bootstrap
 *
 * @author Ezra K <ezra@atwoki.com>
 */
angular.module('lattice',['ngResource','ngRoute','lattice.services','lattice.controllers', 'lattice.directives' ], function() {
        // configure services
    }
).config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/card/:id', {
            templateUrl: '/views/card.html',
            controller: 'LatticeController'
        })
        .when('/cards', {
            templateUrl: '/views/cards.html',
            controller: 'LatticeController'
        })
        .when('/board/:id', {
            templateUrl: '/views/board.html',
            controller: 'LatticeController'
        })
        .when('/boards', {
            templateUrl: '/views/boards.html',
            controller: 'LatticeController'
        })
        .when('/action/:id', {
            templateUrl: '/views/action.html',
            controller: 'LatticeController'
        })
        .when('/activity', {
            templateUrl: '/views/actions.html',
            controller: 'LatticeController'
        });
}]);
