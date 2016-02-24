/**
 * Created with JetBrains WebStorm.
 * User: atwoki
 * Date: 2013/10/28
 * Time: 11:40 PM
 * To change this template use File | Settings | File Templates.
 */
angular

    .module(
        'lattice.services',
        [],
        function() {
            // config 
        }
    )
    
    .factory('hydroFactory', function($log) {
        
        var factory = {};
        
        var h = Helper;
        
        factory.application = function() {
            return 'lattice'
        };
        
        factory.log = function(thing) {
            console.log('[' + factory.application() + '] ' + JSON.stringify({ "log": thing }));    
        };
        
        factory.timer = function(timerFn, ms) {
            return setInterval(timerFn, ms);
        };
        
        factory.refresh = function() {
            return 30000;
        };
        
        factory.store = function(key, item) {
            h.cacheStore(key, JSON.stringify(item));    
        };
        
        factory.fetch = function(key) {
            return JSON.parse(h.cacheResolve(key));
        };
        
        factory.remove = function(key) {
            h.cacheDelete(key);
        };        
        
        return factory;
    })
    
    .factory('trelloFactory', function($http, $q) {
        
        var factory = {};
        var observers = [];

        var client = Trello;
        
        factory.token = function() {
            if (client) {
                return client.token();
            }
            return '';
        };
        
        factory.apikey = function() {
            if (client) {
                return client.key();
            }
            return '';
        };
        
        factory.touch = function(successFn) {
            client.authorize({ 
                "interactive": false,
                "success": successFn,
                "error": factory.disconnect
            });    
        };
        
        factory.connect = function(name, url, scope, expiry, successFn, errorFn) {
            if (client) {
                client.authorize({
                    "name": name,
                    "type": 'redirect',
                    "interactive": true,
                    "expiration": expiry,
                    "redirect_uri": url,
                    "persist": true,
                    "success": successFn,
                    "scope": scope,
                    "error": errorFn
                });
            } else {
                alert('Trello client undefined');
            }    
        };
        
        factory.disconnect = function() {
            if (client) {
                return client.deauthorize();
            }
            return undefined;
        };
        
        factory.isloggedin = function() {
            if (client) {
                return client.authorized();
            }
            return false;
        };
        
        factory.register = function(name, target, callback) {
            observers.push({
                "name": name,
                "target": target,
                "callback": callback
            });    
        };

        factory.notify = function(target, results) {
            $.each(observers, function(i, o) {
                if (o.target == target) {
                    o.callback(results);
                }    
            });    
        };
        
        factory.bind = function(target) {
            var deferred = $q.defer();
            client.get(target, function(results) {
                if (!results) {
                    deferred.reject('no results for target: ' + target)
                } else {
                    deferred.resolve({
                        "target": target,
                        "results": results
                    });    
                }
                factory.notify(target, results);
            }); 
            return deferred.promise;
        };
        
        return factory;
    })
    
    .factory('latticeFactory', function(hydroFactory, trelloFactory, $location, $route) {
    
        var factory = {};
        var viewmodel = {};
        
        var autherror = function() {
            alert('Trello authorization error');    
        }; 
        
        var init = function() {
            // register observers so we may bind(target) to them
            trelloFactory.register('member', 'members/me', function(member) {
                viewmodel.member = member;
            });
            
            trelloFactory.register('boards', 'members/me/boards', function(boards) {
                viewmodel.boards = boards;
                $.each(viewmodel.boards, function(i, board) {
                    trelloFactory.bind( 'boards/' + board.id + '/lists').then(function(payload) {
                        board.lists = payload.results;   
                    });
                });
            });
            
            trelloFactory.register('cards', 'members/me/cards', function(cards) {
                viewmodel.cards = cards;
            });
            
            trelloFactory.register('actions', 'members/me/notifications', function(actions) {
                viewmodel.actions = actions;
            });            
        };
        
        factory.helper = {
            "cardsperlist": function(list, cards) {
                var c = [];
                $.each(cards, function(i, e) {
                    if (e.idList == list.id) {
                        c.push(e);    
                    };    
                });
                return c;  
            },
            "cardsperboard": function(board, cards) {
                var c = [];
                $.each(cards, function(i, e) {
                    if (e.idBoard == board.id) {
                        c.push(e);    
                    };    
                });
                return c; 
            }
        };
        
        factory.touch = function(success) {
            trelloFactory.touch(success);
        };
        
        factory.viewmodel = function() {
            return viewmodel;
        };
        
        factory.sync = function(keys) {
            var promises = [];
            $.each(keys, function(i, key) {
                promises.push(trelloFactory.bind(key));
            });
            return promises;
        };
        
        factory.clear = function() {
            viewmodel = {};
        };  
        
        factory.signon = function(route, validity) {
            var permissions = { "write": false, "read": true };
            trelloFactory.connect(hydroFactory.application(), route, permissions, validity, function(){}, autherror);
        };
        
        factory.signoff = function() {
            trelloFactory.disconnect();
            factory.clear();
            $location.url('/lattice/app/index.html');            
        };
        
        factory.authenticated = function() {
            return trelloFactory.isloggedin();  
        };
        
        factory.setviewitem = function(ref, entity) {
            hydroFactory.store('lattice.bound.current.' + ref, entity);
            $location.url('/' + ref + '/' + entity.id);            
        };
        
        factory.viewitemid = function() {
            return $route.current.params.id;
        };
        
        factory.cardmodel = function(boards, cards) {
            var model = {
                "boards": []
            };
            if (!boards || !cards || boards.length <= 0) return model; // exit
            
            $.each(boards, function(i, b) {
                var board = {
                    "name": b.name,
                    "cards": []
                };
                if (!b.lists) return model; // exit
                var lists = b.lists;
                $.each(lists, function(x, l) {
                    var cardset = factory.helper.cardsperlist(l, cards);  
                    $.each(cardset, function(n, c) {
                        board.cards.push({
                            "name": c.name,
                            "list": l.name,
                            "id": c.id
                        });
                    });
                });
                model.boards.push(board);
            });
            return model; // exit
        };
        
        factory.currentview = function(elements) {
            var e;
            $.each(elements , function(i, n) {
                if (n.id == factory.viewitemid()) {
                    e = n;
                }
            });
            return e;    
        };        
        
        factory.nav = function(name) {
            var list = $('#navlist')[0].children;
            $.each(list, function(i, item) {
                $('#' + item.id).toggleClass('active', false);
            });
            $('#nav' + name).toggleClass('active');
            $location.url('/' + name);            
        };
        
        factory.token = function() {
            return trelloFactory.token();
        };
        
        factory.key = function() {
            return trelloFactory.apikey();
        };
        
        init();  

        return factory;
    })
    
    .factory('dbFactory', function(hydroFactory) {
        
        var factory = {};
        
        var remoteCouch = false;
        var db = new PouchDB(hydroFactory.application());

        factory.store = function(doc, id, rev, onresults) {
            db.put(doc, id, rev, { "local_seq": true })
                .then(function(error, res) {
                    if (error) {
                        hydroFactory.log(error);
                    } else {
                        hydroFactory.log(res);
                        onresults(res);
                    }
            });
        };
        
        factory.submit = function(doc, onresults) {
            db.post(doc, { "local_seq": true })
                .then(function(error, res) {
                    if (error) {
                        hydroFactory.log(error);
                    } else {
                        hydroFactory.log(res);
                        onresults(res);
                    }
            });
        };
        
        factory.all = function(doc, onresults) {
            var o = {
                "include_docs": true,
                "attachments": true,
                "keys": doc.keys
            };
            db.allDocs(o)
                .then(function(error, res) {
                    if (error) {
                        hydroFactory.log(error);
                    } else {
                        hydroFactory.log(res);
                        onresults(res);
                    }
            });
        };

        factory.fetch = function(doc, onresults) {
            var o = {
                "local_seq": true,
                "attachments": true
            };
            db.get(doc.id, o)
                .then(function(error, res) {
                    if (error) {
                        hydroFactory.log(error);
                    } else {
                        hydroFactory.log(res);
                        onresults(res);
                    }    
            });
        };
        
        db.info(function(err, info) {
            hydroFactory.log(info);
            db
                .changes({
                    "since": info.update_seq,
                    "live": true
                })
                .on('change', function(change) {
                    hydroFactory.log(change);
                });
        });        
        
        return factory;
    })

;
