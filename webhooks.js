/**
 * Webhook instance
 *
 * @author Ezra K <ezra@atwoki.com>
 */
var unirest   = require('unirest');

exports.instance = function(endpoint, creds) {

    var h = {};

    var base = endpoint + 'token/' + creds.token;

    var client = function(method, body, command, callback) {
        var proxy = unirest(method, base + command);
        proxy.header('Accept', 'application/json').header('Content-Type', 'application/json');
        proxy.query({
            'key': creds.key
        });
        if (method != 'GET') {
            proxy.send(body);
        }
        proxy.end(function (response) {
            callback(response.body);
        });
    };
    var marshal = function(id, desc, url) {
        return { 'idModel': id, 'description': desc, 'callbackURL': url };
    };

    h.register = function(id, desc, url, callback) {
        // POST /1/webhooks
        client('POST', marshal(id, desc, url), '/webhooks', callback);
    };

    h.update = function(id, desc, url, callback) {
        // PUT /1/webhooks
        client('PUT', marshal(id, desc, url), '/webhooks', callback);
    };

    h.active = function(whid, state, callback) {
        // PUT /1/webhooks/[wedbhookid]/active
        client('PUT', { 'value': state }, '/webhooks/' + whid + '/active', callback);
    };

    h.all = function(callback) {
        // GET /1/webhooks
        client('GET', {}, '/webhooks', callback);
    };

    h.query = function(whid, callback) {
        // GET /1/webhooks/[idWebhook]
        client('GET', {}, '/webhooks/' + whid, callback);
    };

    h.field = function(whid, field, callback) {
        // GET /1/webhooks/[idWebhook]/[field]
        client('GET', {}, '/webhooks/' + whid + '/' + field, callback);
    };

    h.remove = function(whid, callback) {
        // DELETE /1/webhooks/[idWebhook]
        client('DELETE', {}, '/webhooks/' + whid, callback);
    };

    return h;
};
