var Twig = require("twig");
var loaderUtils = require("loader-utils");

Twig.extend(function(Twig) {
    var compiler = Twig.compiler;

    compiler.module['webpack'] = function(id, tokens, pathToTwig) {
        var output = [
            '    var twig = require("' + pathToTwig + '").twig,',
            '        template = ' + compiler.wrap(id, tokens) + ';\n',
//            '    template.options.autoescape = ' + moduleConfig.autoescape + ';\n',
            '    module.exports = function(context) { return template.render(context); }'
        ];

        return output.join('\n');
    };
});

module.exports = function(source) {
    var id = this.resource;

    this.cacheable();
    var tpl = Twig.twig({id: id, data: source, allowInlineIncludes: true});

    tpl = tpl.compile({
        module: 'webpack',
        twig: 'twig'
    });
    return tpl;
};
