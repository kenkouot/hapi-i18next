# hapi-i18next
[i18next integration](https://github.com/i18next/i18next-node) for [hapijs](https://github.com/hapijs/hapi)

This plugin sets up and registers two methods in your hapi server: `server.methods.i18n.getInstance()` and `server.methods.i18n.translateWithCache`. Using hapi server methods allows us to set up caching schemes for the translate method. Examples of how to integrate these server methods into your application:
```js

// Registering plugin exposes two server methods that you can use immediately in your handlers
// server.methods.i18n.getInstance
// server.methods.i18n.translateWithCache
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
    },
    cookieOptions: {
      // http://hapijs.com/tutorials/cookies
    }
}, function (err) {});

// Using it in views requires a few additional steps
server.views({
    // pass our server methods to global view context, so that we may use it in helpers
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
```

In your helper:
```hbs

function i18nHelper(key, options) {
    var translateWithCache = this.i18n.translateWithCache,
        params = {},
        namespace = '',
        instance = this.i18n.getInstance();

    Object.keys(options.hash).forEach(function (key) {
        if (key === 'ns') {
            namespace = options.hash[key] + ':';
        }
        else if (options.hasOwnProperty(key)) {
            params[key] = String(options.hash[key]);
        }
    });
    return translateWithCache(namespace + key, instance.lng(), params);
}
module.exports = i18nHelper;
```
