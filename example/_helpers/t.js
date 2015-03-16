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
