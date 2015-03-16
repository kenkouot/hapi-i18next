/// <reference path="../typings/hapi/hapi.d.ts" />
/// <reference path="../typings/i18next//i18next.d.ts" />
var i18n = require('i18next');
var util = require('util');
var defaults = {
    supportedLngs: ['en'],
    fallbackLng: 'en',
    lng: 'en',
    detectLngFromPath: false,
    detectLngFromHeaders: false,
    forceDetectLngFromPath: false
};
exports.register = function (server, options, next) {
    var i18nextOptions = util._extend(defaults, options.i18nextOptions);
    /**
     * i18n.getInstance
     * @description
     */
    server.method('i18n.getInstance', function () {
        return i18n;
    });
    /**
     * i18n.translateWithCache
     * @description This method is a facade for i18next's bundled 't' method. We wrap it so that we can
     * pass an extra language parameter for Hapi server.method caching (so you can generate keys based on languages
     * and avoid cache pollution)
     */
    server.method('i18n.translateWithCache', function (key, lng, opts) {
        return i18n.t(key, opts);
    });
    i18n.init(i18nextOptions);
    server.ext('onPreHandler', function (request, reply) {
        var translations = {}, cookie;
        cookie = request.state[options.cookieName || 'i18next'] || null;
        if (cookie) {
            if (cookie !== i18n.lng() && i18nextOptions[cookie]) {
                i18n.setLng(request.state.i18next, function () {
                    reply.continue();
                });
            }
        }
        reply.continue();
    });
    next();
};
exports.register.attributes = {
    name: 'hapi-i18next',
    version: '0.0.1'
};
