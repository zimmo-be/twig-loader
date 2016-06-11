var Twig = require("twig");
var path = require("path");

Twig.cache(false);

Twig.extend(function(Twig) {
    var compiler = Twig.compiler;
    compiler.module['webpack'] = require("./compiler");
});

module.exports = function(source) {
    var id = require.resolve(this.resource),
        tpl;
    this.cacheable && this.cacheable();

    tpl = Twig.twig({
        id: id,
        data: source,
        allowInlineIncludes: true
    });

    tpl = tpl.compile({
        module: 'webpack',
        twig: 'twig'
    });

    this.callback(null, tpl);
};
