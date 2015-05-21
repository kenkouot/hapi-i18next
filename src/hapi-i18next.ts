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
	lng: 'en',
	cookieName: 'i18next',
	useCookie: true,
	detectLngFromPath: 0,
	detectLngFromQueryString: false,
	detectLngFromHeaders: false,
	detectLngQS: 'setLng',
	forceDetectLngFromPath: false
};

export var register: HapiPluginRegister = function (server, options: any, next): void {
	var i18nextOptions: I18nextOptions = util._extend(defaults, options.i18nextOptions);

	if (i18nextOptions.useCookie) {
		server.state(i18nextOptions.cookieName, util._extend({
			strictHeader: false,
			isSecure: false,
			isHttpOnly: false,
			clearInvalid: true
		}, options.cookieOptions));
	}

	/**
	 * i18n.getInstance
	 * @description Returns fresh i18next instance for each request, to prevent cache pollution
	 */
	server.method('i18n.getInstance', (): any => {
		return require('i18next');
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
			headerLangs: any,
			fromPath: string,
			language: string,
			temp: string;

		if (!language && typeof i18nextOptions.detectLngFromPath === 'number') {
			// if force is true, then we set lang even if it is not in supported languages list
			temp = detectLanguageFromPath(request);
			if (i18nextOptions.forceDetectLngFromPath || isLanguageSupported(temp)) {
				language = temp;
			}
		}

		if (!language && i18nextOptions.detectLngFromQueryString) {
			temp = detectLanguageFromQS(request);
			language = trySetLanguage(temp);
		}

		if (!language && i18nextOptions.useCookie) {
			// Reads language if it was set from previous session or recently by client
			temp = detectLanguageFromCookie(request);
			language = trySetLanguage(temp);
		}

		if (!language && i18nextOptions.detectLngFromHeaders) {
			headerLangs = detectLanguageFromHeaders(request);
			headerLangs.some(function (headerLang): boolean {
				language = trySetLanguage(headerLang);
				return !!language;
			});
		}

		language = language || i18nextOptions.fallbackLng;

		i18n.setLng(language, () => {
			reply.continue();
		});
	});

	function trySetLanguage (language): string|typeof undefined {
		return isLanguageSupported(language) ? language : undefined;
	}

	function isLanguageSupported (language: string): boolean {
		var supported: string[] = i18nextOptions.supportedLngs;
		if ((!supported.length && language) || (supported.indexOf(language) > -1)) {
			return true;
		}
		return false;
	}

	function detectLanguageFromHeaders (request): any[] {
		var langs: any[],
			langHeader: string = request.headers['accept-language'];

		if (langHeader) {
			langs = acceptLanguageParser.parse(langHeader);
			langs.sort((a, b) => {
				return b.q - a.q;
			});
			return langs;
		}

		return [];
	}

	function detectLanguageFromQS (request) {
		// Use the query param name specified in options, defaults to lang
		return request.query[i18nextOptions.detectLngQS];
	}

	function detectLanguageFromPath (request): string {
		var parts = request.url.path.slice(1).split('/');
		if (parts.length > i18nextOptions.detectLngFromPath) {
			return parts[i18nextOptions.detectLngFromPath];
		}
	}

	function detectLanguageFromCookie (request): string {
		return request.state[i18nextOptions.cookieName] || null;
	}

	next();
};

register.attributes = {
	name: 'hapi-i18next',
	version: '2.0.2'
};
