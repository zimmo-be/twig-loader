var Twig = require("twig");
var path = require("path");
var hashGenerator = require("./hashGenerator");

Twig.cache(false);

Twig.extend(function(Twig) {
    var compiler = Twig.compiler;
    compiler.module['webpack'] = require("./compiler");
});

module.exports = function(source) {
    var id = require.resolve(this.resource),
        hash = hashGenerator(id),
        tpl;
    this.cacheable && this.cacheable();

    tpl = Twig.twig({
        id: hash,
        data: source,
        allowInlineIncludes: true
    });

    tpl = tpl.compile({
        module: 'webpack',
        twig: 'twig'
    });

    this.callback(null, tpl);
};
