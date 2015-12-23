var Twig = require("twig");
var _ = require("underscore");
var path = require("path");
var loaderUtils = require("loader-utils");

Twig.extend(function(Twig) {
    var compiler = Twig.compiler;

    compiler.module['webpack'] = function(id, tokens, pathToTwig) {
        id = path.basename(id, ".twig");
        var includes = [];

        var processToken = function(token) {
            if (token.type == "logic" && token.token.type) {
                switch(token.token.type) {
                    case 'Twig.logic.type.block':
                    case 'Twig.logic.type.if':
                    case 'Twig.logic.type.elseif':
                    case 'Twig.logic.type.else':
                    case 'Twig.logic.type.for':
                    case 'Twig.logic.type.spaceless':
                        _.each(token.token.output, processToken);
                        break;
                    case 'Twig.logic.type.extends':
                        _.each(token.token.stack, function(token) {
                            includes.push("twig!" + token.value + ".twig");
                        });
                        break;
                    case 'Twig.logic.type.import':
                        if (token.token.expression != '_self') {
                            throw new Error("Twig-loader: Importing macro's is not yet supported");
                        }
                        break;
                    case 'Twig.logic.type.include':
                        _.each(token.token.stack, function(token) {
                            includes.push("twig!" + token.value + ".twig");
                        });
                        break;
                }
            }
        };

        _.each(JSON.parse(tokens), processToken);

        var output = [
            'var twig = require("' + pathToTwig + '").twig,',
            '    template = twig({id:"' + id + '", data:' + tokens + ', allowInlineIncludes: true});\n',
            'module.exports = function(context) { return template.render(context); }'
        ];

        if (includes.length > 0) {
            _.each(includes, function(file) {
                output.unshift("require("+ JSON.stringify(file) +");\n");
            });
        }

        return output.join('\n');
    };
});

module.exports = function(source) {
    var id = this.resource,
        tpl;

    this.cacheable && this.cacheable();

    // check if template already exists
    tpl = Twig.twig({ ref: id });
    if (!tpl) {
        tpl = Twig.twig({
            id: id,
            data: source,
            allowInlineIncludes: true
        });
    }

    tpl = tpl.compile({
        module: 'webpack',
        twig: 'twig'
    });

    this.callback(null, tpl);
};
