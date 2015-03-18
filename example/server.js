'use strict';
var Hapi = require('hapi');
var path = require('path');

var server = new Hapi.Server();

server.connection({
    port: '3333'
});

server.register({
    register: require('../dist/hapi-i18next'),
    options: {
        // Standard options passed into i18next initialization
        i18nextOptions: {
            resGetPath: path.join(__dirname, 'locales/__lng__/__ns__.json'),
            ns: 'translations',
            detectLngFromQueryString: 'lang',
            detectLngFromPath: 0,
            cookieName: 'test',
            supportedLngs: ['en', 'de']
        }
    }
}, function () {});

server.views({
    engines: {
        hbs: require('handlebars'),
    },
    path: path.join(__dirname),
    helpersPath: path.join(__dirname, '_helpers'),
    context: {
        i18n: {
            // This step is left up to the developer, but the most declarative way to use this plugin is to add it's methods
            // to the global context of your views. That way you can declare a template helper such as the {{t 'hello-world'}}
            // in this folder to use as common interface for i18n messages.
            translateWithCache: server.methods.i18n.translateWithCache,
            getInstance: server.methods.i18n.getInstance
        }
    }
});


server.route({
    method: 'GET',
    path: '/test',
    handler: function (request, reply) {
        reply.view('test');
    }
});

server.start();
