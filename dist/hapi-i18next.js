/// <reference path="../typings/hapi/hapi.d.ts" />
/// <reference path="../typings/i18next//i18next.d.ts" />
/// <reference path="../typings/accept-language-parser.d.ts" />
var i18n = require('i18next');
var util = require('util');
var acceptLanguageParser = require('accept-language-parser');
var defaults = {
    supportedLngs: ['en'],
    fallbackLng: 'en',
    lng: 'en'
};
exports.register = function (server, options, next) {
    var i18nextOptions = util._extend(defaults, options.i18nextOptions);
    i18nextOptions = util._extend(i18nextOptions, {
        // Support for these features only exist in i18next-node for express, so let's
        // always set them to false in init, and support them ourselves if they are enabled
        detectLngFromPath: false,
        detectLngFromQueryString: false,
        detectLngFromHeaders: false,
        forceDetectLngFromPath: false
    });
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
        var translations = {}, headerLang, langs;
        function setLang(lang) {
            i18n.setLng(lang, function () {
                return reply.continue();
            });
        }
        if (options.forceDetectLngFromPath) {
        }
        if (options.detectLngFromHeaders) {
            headerLang = detectLngFromHeaders(request);
            setLang(headerLang[0].code + (headerLang.region ? '-' + headerLang.region : ''));
        }
        if (options.detectLngFromQueryString) {
        }
        if (options.detectLngFromPath) {
        }
        if (options.useCookie) {
            setLang(detectLanguageFromCookie(request));
        }
        reply.continue();
    });
    function detectLngFromHeaders(request) {
        var langs, langHeader = request.headers['accept-language'];
        langs = acceptLanguageParser.parse(langHeader);
        langs.sort(function (a, b) {
            return b.q - a.q;
        });
        return langs;
    }
    function detectLanguageFromCookie(request) {
        var cookie = request.state[options.cookieName || 'i18next'] || null;
        if (cookie) {
            if (cookie !== i18n.lng() && i18nextOptions[cookie]) {
                return request.state.i18next;
            }
        }
        throw 'Cookie not found!';
    }
    next();
};
exports.register.attributes = {
    name: 'hapi-i18next',
    version: '0.0.1'
};
