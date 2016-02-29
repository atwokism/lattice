#!/bin/env node
/**
 * Lattice server (expressjs)
 *
 * @author Ezra K <ezra@atwoki.com>
 */
var fs          = require('fs');
var express     = require('express');
var unirest     = require('unirest');
var uuid        = require('node-uuid');
var webhooks    = require('./webhooks.js');
var utils       = require('./utils.js').factory();
var middleware  = require('./utils.js').middleware();
/**
 *  Container
 *  @author: Ezra K (ezra@atwoki.com)
 */
var Container = function(configuration) {

    var self = this;

    self.api = configuration;

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.variables = function() {
        self.ipaddress = self.api.server.host;
        self.port = self.api.server.port;
    };

    /**
     *  Populate the cache.
     */
    self.cache = function() {
        if (typeof self.zcache === 'undefined') {
            self.zcache = {
                'index.html': '',
                'provider.api.key': '',
                'provider.api.client': '',
                'provider.creds': ''
            };
        }
        self.zcache['index.html'] = fs.readFileSync('./app/index.html'); //  Local cache for static content.
        self.zcache['provider.api.key'] = fs.readFileSync('./app/key');
        self.zcache['provider.api.client'] = self.api.client('provider.api.key'); //  provider API key = todo read sync url
    };

    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.get = function(key) {
        return self.zcache[key];
    };

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig) {
        if (typeof sig === 'string') {
            utils.log('received signal - terminating app', { 'trace': sig });
            process.exit(1);
        }
        utils.log(self.api.name + ' server stopped.', 'ok');
    };

    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.termination = function() {
        process.on('exit', function() { self.terminator(); }); //  Process on exit and signals.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.routes = function() {
        self.routes = {};
        self.routes['/'] = { // spa home
            'process': function(req, res) {
                res.setHeader('Content-Type', 'text/html');
                res.send(self.cache_get('index.html') );
            },
            'verb': 'GET',
            'secure': false
        };
        self.routes['/client/' + self.api.provider] = { // api client
            'process': function(req, res) {
                res.setHeader('Content-Type', 'text/javascript');
                res.redirect(self.get('provider.api.client'));
            },
            'verb': 'GET',
            'secure': false
        };
        self.routes['/auth/' + self.api.provider] = { // api key and token
            'process': function(req, res) {
                self.zcache['provider.creds'] = req.body;
                utils.log('cached creds', { 'cache': self.get('provider.creds'), 'api': self.api } );
            },
            'verb': 'POST',
            'secure': false
        };
        self.routes['/cache/' + self.api.provider] = { // cache provider data set
            'process': function(req, res) {
                self.zcache['lattice.viewmodel'] = req.body;
                utils.log('cached viewmodel', { 'cache': self.get('lattice.viewmodel') } );
                // TODO - cache angular provider data set model
            },
            'verb': 'POST',
            'secure': false
        };
        self.routes['/callback/' + self.api.provider] = { // api callback url
            'process': function(req, res) {
                // TODO - process webhook callback
            },
            'verb': 'POST',
            'secure': false
        };
        self.routes['/webhooks/' + self.api.provider + '/:command'] = { // api callback url
            'process': function(req, res) {
                var creds = self.get('provider.creds');
                var payload = req.body;
                var cmd = req.param('command');
                self.webhooks(creds, cmd, payload, function(data) {
                    res.setHeader('Content-Type', 'text/javascript');
                    res.send(data);
                });
            },
            'verb': 'POST',
            'secure': false
        };
    };

    self.webhooks = function(creds, command, payload, callback) {
        var endpoint = self.api.endpoint;
        var hook = webhooks.instance(endpoint, creds);
        switch(command) { // TODO - all commands
            case 'register':
                hook.register(payload.model, payload.name, payload.cburl, function(data) {
                    self.receive(data, function(msg) {
                        var result = { 'output': msg, 'input': payload };
                        callback(result);
                        utils.log('webhook registered', { 'res': result });
                    });
                });
                break;
            default:
                callback({ 'error': 'command not recognised', 'input': payload});
                break;
        };
    };

    self.receive = function(message, handler) {
        handler(message);
        utils.log('receive processed', { 'data': message });
    };

    /**
     *  Add handlers for the app (from the routes).
     */
    self.handlers = function() {
        self.app.use(express.json()); // to support JSON-encoded bodies
        self.app.use(express.urlencoded()); // to support URL-encoded bodies
        self.app.use(express.static('app'));
        for (var r in self.routes) {
            var verb = self.routes[r].verb;
            var proc = self.routes[r].process;
            if (verb === 'POST') {
                if (self.routes[r].secure === true) {
                    self.app.post(r, middleware.ssl, proc);
                } else {
                    self.app.post(r, proc);
                }
            } else if (verb === 'GET') {
                if (self.routes[r].secure === true) {
                    self.app.get(r, middleware.ssl, proc);
                } else {
                    self.app.get(r, proc);
                }
            }
        }
    };

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.server = function() {
        self.app = express();
        self.routes();
        self.handlers();
    };

    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.variables();
        self.cache(); // resources
        self.termination(); // handlers
        self.server(); // create the express server and routes, and connect to mongo.
        self.start();
    };

    /**
     *  Start the server (starts up the sample application).Start the app on the
     *  specific interface (and port).
     */
    self.start = function() {
        self.app.listen(self.port, self.ipaddress, function() {
            utils.log(self.api.name + ' server started', { "ip": self.ipaddress, "port": self.port });
        });
    };

};   /*  Container  */
/**
 *  main():  Main code.
 */
new Container({
    'name': 'lattice',
    'provider': 'trello',
    'endpoint': 'https://api.trello.com/1/',
    'client': function(key) {
        return this.endpoint + 'client.js?key=' + key;
    },
    'server': {
        'host': '127.0.0.1',
        'port': 8080
    }).initialize();
/* the end */
