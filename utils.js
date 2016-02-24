/**
 * @author Ezra K <ezra@atwoki.com>
 *
 * Utilities
 */
exports.middleware = function() {
    var m = {};
    m.ssl = function (req, res, next) {
        // http ssl redirect
        if (req.headers['x-forwarded-proto'] == 'http') {
            res.redirect('https://' + req.headers.host + req.path);
        } else {
            return next();
        }
    };
    return m;
};

exports.factory = function() {
    var f = {};
    f.log = function(message, data) {
        console.log('%s: %s > %s', Date(Date.now()), message, JSON.stringify(data));
    };
    f.respond = function(res, data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    };
    return f;
};
