var Twig = require("twig");
var _ = require("underscore");
var path = require("path");
var loaderUtils = require("loader-utils");

Twig.extend(function(Twig) {
    var compiler = Twig.compiler;

    compiler.module['webpack'] = function(id, tokens, pathToTwig) {
        id = path.basename(id, ".twig");
        var includes = [];
        _.each(JSON.parse(tokens), function(token) {
            if (token.type == "logic" && token.token.type) {
                switch(token.token.type) {
                    case 'Twig.logic.type.extends':
                        _.each(token.token.stack, function(token) {
                            includes.push("./" + token.value + ".twig");
                        });
                        break;
                    case 'Twig.logic.type.import':
                        if (token.token.expression != '_self') {
                            throw new Error("Twig-loader: Importing macro's is not yet supported");
                            //console.dir(token.token);
                        }
                        break;
                    case 'Twig.logic.type.include':
                        throw new Error("Twig-loader: Including templates is not yet supported");
                    //console.dir(token.token.stack);
                    //break;
                }
            }
        });

        var output = [
            '    var twig = require("' + pathToTwig + '").twig,',
            '        template = twig({id:"'+id +'", data:'+tokens+', allowInlineIncludes: true});\n',
//            '    template.options.autoescape = ' + moduleConfig.autoescape + ';\n',
            '    module.exports = function(context) { return template.render(context); }'
        ];
        if (includes.length > 0) {
            var includesOutput = "require("+ JSON.stringify(includes) +");";
            output.unshift(includesOutput);
        }
        //console.log(output.join('\n'));

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
