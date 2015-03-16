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
        i18nextOptions: {
            resGetPath: path.join(__dirname, 'locales/__lng__/__ns__.json'),
            ns: 'translations'
        }
    }
}, function () {});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply(server.methods.i18n.translateWithCache('hello-world'));
    }
})

server.start();

