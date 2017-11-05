var Twig = require("twig");
var path = require("path");
var hashGenerator = require("hasha");
var mapcache = require("./mapcache");
var compiler = require("./compiler")
var loaderUtils = require("loader-utils")

Twig.cache(false);

module.exports = function(source) {
  const loaderOptions = loaderUtils.getOptions(this) || {};
  Twig.extend(function(Twig) {
    // we want to have the loader context within the compiler, therefore we have
    // to bind the context to the compiler function
    Twig.compiler.module['webpack'] = compiler(loaderOptions);
  });

  var path = require.resolve(this.resource),
        id = hashGenerator(path),
        tpl;

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
