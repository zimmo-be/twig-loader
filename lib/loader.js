var Twig = require("twig");
var path = require("path");
var async = require("async");

var utils = require('./utils');

Twig.cache(false);

// shared resolve map to store includes that are resolved by webpack
// so they can be used in the compiled templates
var resolveMap = {};

module.exports = function (source) {
    var loaderApi = this;
    var loaderAsyncCallback = this.async();
    this.cacheable && this.cacheable();

    var tpl;
    // the path is saved to resolve other includes from
    var path = require.resolve(this.resource);
    // this will be the template id for this resource,
    // this id is also be generated in the copiler when this resource is included
    var id = utils.generateTemplateId(path, loaderApi.options.context);

    // compile function that can be called resursively to do multiple
    // compilation passes when doing async webpack resolving
    (function compile(templateData) {
        // store all the paths that need to be resolved
        var resolveQueue = [];
        var resolve = function (value) {
            if (!resolveQueue.includes(value) && !resolveMap[value]) {
                resolveQueue.push(value);
            }
        };

        Twig.extend(function (Twig) {
            var compiler = Twig.compiler;
            // pass values to the compiler, and return the compiler function
            compiler.module['webpack'] = require("./compiler")({
                loaderApi: loaderApi,
                resolve: resolve,
                resolveMap: resolveMap,
                path: path
            });
        });

        tpl = Twig.twig({
            id: id,
            path: path,
            data: templateData,
            allowInlineIncludes: true
        });

        tpl = tpl.compile({
            module: 'webpack',
            twig: 'twig'
        });

        // called when we are done resolving all template paths
        var doneResolving = function doneResolving() {
            // re-feed the parsed tokens into the next pass so Twig can skip the token parse step
            compile(Twig.twig({ ref: id }).tokens);
        };

        // resolve all template async
        var resolveTemplates = function resolveTemplates() {
            async.each(resolveQueue, function (req, cb) {
                loaderApi.resolve(loaderApi.context, req, function (err, res) {
                    resolveMap[req] = res;
                    // also store the resolved value to be used
                    resolveMap[res] = res;
                    cb();
                });
            }, doneResolving);
        };

        // if we have resolve items in our queue that have been added by this compilation pass, we need
        // to resolve them and do another compilation pass
        if (resolveQueue.length) {
            resolveTemplates();
        } else {
            // nothing to resolve anymore, return the template source
            loaderAsyncCallback(null, tpl);
        }
    })(source);
};
