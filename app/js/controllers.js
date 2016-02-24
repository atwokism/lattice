/**
 * Created with JetBrains WebStorm.
 * User: atwoki
 * Date: 2013/10/28
 * Time: 11:33 PM
 * To change this template use File | Settings | File Templates.
 */
angular

    .module(
        'lattice.controllers',
        [],
        function() {
            // config
        }
    )
    
    .controller('LatticeController', function($scope, $q, $http, latticeFactory, hydroFactory) {
        
        /* ==== CONTROLLER: NAVIGATION ==== */
        
        $scope.navto = function(name) {
            latticeFactory.nav(name);
        };
        
        $scope.navclick = function(ref, entity) {
            latticeFactory.setviewitem(ref, entity);
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

        $scope.boardvisible = function(board) {
            if (!board.lattice) {
                board.lattice = {};
                board.lattice.visible = false;
            }
            board.lattice.visible = !board.lattice.visible;
        };
        
        /* ==== CONTROLLER: SESSION ==== */

        $scope.connect = function(route, validity) {
            latticeFactory.signon(route, validity);
        };
        
        $scope.disconnect = function() {
            latticeFactory.signoff();
        };
        
        $scope.isConnected = function() {
            return latticeFactory.authenticated();
        };
        
        /* ==== CONTROLLER: INIT ==== */
        
        var boot = function() {
            latticeFactory.touch(function() {
                if (latticeFactory.authenticated()) {
                    $q.all(latticeFactory.sync([
                        'members/me', 
                        'members/me/boards', 
                        'members/me/cards', 
                        'members/me/notifications'
                    ])).then(function(viewmodel) {
                        $scope.viewmodel = latticeFactory.viewmodel();
                        // TODO - send key and token to server
                        $http.post('/auth/trello', {
                            'key': latticeFactory.key(),
                            'token': latticeFactory.token()
                        }).success(function(data, status, headers, config) {
                            hydroFactory.log({
                                'status': status,
                                'msg': 'auth regsitered token and key'
                            });
                        });
                    });
                } else {
                    $scope.disconnect();
                }    
            });    
        };
        
        $scope.init = function() {
            boot();
        };
        
        $scope.viewmodel = latticeFactory.viewmodel();
        $scope.viewmodel.cardboards = latticeFactory.cardmodel($scope.viewmodel.boards, $scope.viewmodel.cards).boards;
        
    })
    
;