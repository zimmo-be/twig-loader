var Twig = require("twig");
var _ = require("underscore");
var path = require("path");
var loaderUtils = require("loader-utils");

Twig.extend(function(Twig) {
    var compiler = Twig.compiler;

    compiler.module['webpack'] = function(id, tokens, pathToTwig) {
        var includes = [],
            dirname = path.dirname(id);

        var hasTwigExtension = function(filepath) {
            return filepath.substring(filepath.length - 5) === ".twig";
        };

        // remove the file extension which should be '.twig'
        if (hasTwigExtension(id)) {
            id = id.substring(0, id.length - 5);
        }

        // filepath is relative if it begins with './'
        var isRelative = function(filepath) {
            return filepath.substring(0, 2) === "./";
        };

        var processInclude = function(token) {
            var template = token.value;

            // if the template reference is relative
            // then we must expand it out to the full
            // id that will be registered with twig
            if (isRelative(token.value)) {
                token.value = dirname + template.substring(1);
            }

            if (hasTwigExtension(template)) {
                // if the template reference has the twig extension
                // then remove it.
                token.value = token.value.substring(0, token.value.length - 5);
            } else {
                template += ".twig";
            }

            includes.push(template);
        };

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
                        _.each(token.token.stack, processInclude);
                        break;
                    case 'Twig.logic.type.import':
                        if (token.token.expression != '_self') {
                            throw new Error("Twig-loader: Importing macro's is not yet supported");
                        }
                        break;
                    case 'Twig.logic.type.include':
                        _.each(token.token.stack, processInclude);
                        break;
                }
            }
        };

        parsedTokens = JSON.parse(tokens);
        _.each(parsedTokens, processToken);
        tokens = JSON.stringify(parsedTokens);

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
        query = loaderUtils.parseQuery(this.query),
        tpl;

    this.cacheable && this.cacheable();

    if (query.templateRoot) {
        // remove the templateRoot from the path to the template
        id = id.replace(query.templateRoot, '');
    }

    if (id.substring(0, 1) === '/') {
        id = id.substring(1);
    }

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
