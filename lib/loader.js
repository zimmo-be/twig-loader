var Twig = require("twig");
var path = require("path");
var hashGenerator = require("hasha");
var mapcache = require("./mapcache");
var getOptions = require("loader-utils").getOptions;
var compilerFactory = require("./compiler");

Twig.cache(false);

module.exports = function(source) {
    var path = require.resolve(this.resource),
        id = hashGenerator(path),
        options = getOptions(this),
        tpl;

    Twig.extend(function(Twig) {
        var compiler = Twig.compiler;
        compiler.module['webpack'] = compilerFactory(options);
    });

    mapcache.set(id, path)

    this.cacheable && this.cacheable();

    var opts = Object.assign({}, options, {
        id: id,
        path: path,
        data: source,
        allowInlineIncludes: true
    });
    tpl = Twig.twig(opts);

    opts = Object.assign({}, options, {
        module: 'webpack',
        twig: 'twig'
    });
    tpl = tpl.compile(opts);

    this.callback(null, tpl);
};
