/// <reference path="../typings/hapi/hapi.d.ts" />
/// <reference path="../typings/i18next//i18next.d.ts" />
/// <reference path="../typings/accept-language-parser.d.ts" />
import i18n = require('i18next');
import util = require('util');
import acceptLanguageParser = require('accept-language-parser');

interface HapiPluginRegister {
	(server: any, options: any, next: Function): void;
	attributes?: {
		name: string;
		version: string;
	};
}

var defaults: I18nextOptions = {
	supportedLngs: ['en'],
	fallbackLng: 'en',
	lng: 'en'
};

export var register: HapiPluginRegister = function (server, options: any, next): void {
    var i18nextOptions: I18nextOptions = util._extend(defaults, options.i18nextOptions);

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
	server.method('i18n.getInstance', (): any => {
		return i18n;
	});

	/**
	 * i18n.translateWithCache
	 * @description This method is a facade for i18next's bundled 't' method. We wrap it so that we can
	 * pass an extra language parameter for Hapi server.method caching (so you can generate keys based on languages
	 * and avoid cache pollution)
	 */
	server.method('i18n.translateWithCache', (key: string, lng: string, opts: any): string => {
		return i18n.t(key, opts);
	});

	i18n.init(i18nextOptions);

	server.ext('onPreHandler', (request: Hapi.Request, reply: any): void => {
		var translations = {},
            headerLang: any,
            language: string;

        if (!language && options.detectLngFromHeaders) {
            headerLang = detectLngFromHeaders(request);
            language = headerLang[0].code + (headerLang.region ? '-' + headerLang.region : '');
        }

        if (!language && options.useCookie) {
            language = detectLanguageFromCookie(request);
        }

        if (!language && options.forceDetectLngFromPath) {}
        if (!language && options.detectLngFromQueryString) {}
        if (!language && options.detectLngFromPath) {}

        i18n.setLng(language, () => {
            return reply.continue();
        });
	});

    function detectLngFromHeaders (request) {
        var langs: any[],
            langHeader: string = request.headers['accept-language'];

        langs = acceptLanguageParser.parse(langHeader);
        langs.sort((a, b) => {
            return b.q - a.q;
        });
        return langs;
    }

    function detectLanguageFromCookie (request) {
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

register.attributes = {
	name: 'hapi-i18next',
	version: '0.0.1'
};

