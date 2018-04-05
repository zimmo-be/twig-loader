var Twig = require("twig");
var path = require("path");
var hashGenerator = require("hasha");
var mapcache = require("./mapcache");
var getOptions = require("loader-utils").getOptions;
var validateOptions = require("schema-utils");
var compilerFactory = require("./compiler");

var schema = {
    type: "object",
    properties: {
        twigOptions: {
            type: "object",
        },
    },
};

Twig.cache(false);

module.exports = function(source) {
    var path = require.resolve(this.resource),
        id = hashGenerator(path),
        options = getOptions(this),
        tpl;

    if (options) {
        validateOptions(schema, options, "twig-loader");
    } else {
        options = {};
    }

    Twig.extend(function(Twig) {
        var compiler = Twig.compiler;
        compiler.module['webpack'] = compilerFactory(options);
    });

    mapcache.set(id, path)

    this.cacheable && this.cacheable();

    tpl = Twig.twig({
        id: id,
        path: path,
        data: source,
        allowInlineIncludes: true
    });

    tpl = tpl.compile({
        module: 'webpack',
        twig: 'twig'
    });

    this.callback(null, tpl);
};
