/**
 * Main Angular JS controller for Lattice.io.
 * @author: Ezra Kahimbaara <ezra@atwoki.com>
 */
angular

    .module(
        'lattice.controllers',
        [],
        function() {
            // config
        }
    )
    
    .controller('LatticeController', function($scope, $q, $window, latticeFactory) {
        
        /* ==== CONTROLLER: NAVIGATION ==== */
        
        $scope.navto = function(name) {
            latticeFactory.nav(name);
        };
        
        $scope.navclick = function(ref, entity) {
            latticeFactory.setviewitem(ref, entity);
        };  
        
        $scope.navback = function() {
            $window.history.back();
        };         
        
        /* ==== CONTROLLER: VIEW MODEL ==== */
        
        $scope.currentcard = function() {
            return latticeFactory.currentview($scope.viewmodel.cards);
        }; 

        $scope.currentaction = function() {
            return latticeFactory.currentview($scope.viewmodel.actions);
        };
        
        $scope.currentboard = function() {
            return latticeFactory.currentview($scope.viewmodel.boards);
        };        

        $scope.boardactive = function(board) {
            // board.active = !board.active;
            $('#' + board.id).toggleClass('active');
        };
        
        $scope.active = function(board) {
            if (board.active == true) return 'active';
            return '';
        };
        
        /* ==== CONTROLLER: SESSION ==== */

        $scope.connect = function(route, validity) {
            latticeFactory.signon(route, validity);
        };
        
        $scope.disconnect = function() {
            latticeFactory.signoff();
        };
        
        $scope.isconnected = function() {
            return latticeFactory.authenticated();
        };
        
        $scope.tag = function() {
            if (!$scope.viewmodel) return ' ...';
            return $scope.viewmodel.member.fullName + ' (@' + $scope.viewmodel.member.username + ')';
        };
        
        /* ==== CONTROLLER: INIT ==== */
        
        var boot = function() {
            latticeFactory.touch(function() {
                if (latticeFactory.authenticated()) {
                    $('#flashmodal').modal('show');
                    $q.all(latticeFactory.sync([
                        'members/me', 
                        'members/me/boards', 
                        'members/me/cards', 
                        'members/me/notifications'
                    ])).then(function(viewmodel) {
                        $scope.viewmodel = latticeFactory.viewmodel();
                        $('#flashmodal').modal('hide');
                    });
                } else {
                    $scope.disconnect();
                }    
            });    
        };
        
        $scope.init = function() {
            boot();
        };
        
        if (latticeFactory.authenticated()) {
            $scope.viewmodel = latticeFactory.viewmodel();
            $scope.viewmodel.cardboards = latticeFactory.cardmodel($scope.viewmodel.boards, $scope.viewmodel.cards).boards;
        } else {
            $scope.disconnect();
        }
        
    })
    
;