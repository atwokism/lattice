angular

    .module(
        'lattice.directives',
        [],
        function() {
            // config 
        }
    )
    
    .directive('lattice-board-title', function($scope) {
        return {
            "restrict": 'E',
            "template": '<p>' + $scope.currentboard().id + '</p>'
        };
    })

;
    