var path = require("path");
var _ = require("underscore");

var utils = require('./utils');

module.exports = function(options) {
	return function (id, tokens, pathToTwig) {

		var loaderApi = options.loaderApi;
		var resolve = options.resolve;
		var resolveMap = options.resolveMap;
		var resourcePath = options.path;

		var includes = [];
		var processDependency = function (token) {
			if (token.value.indexOf(utils.HASH_PREFIX) === 0) {
				// ignore already replaced value
			} else {
				// if we normalize this value, we:
				// 1) can reuse this in the resolveMap for other components
				// 2) we don't accidently reuse relative paths that would resolve differently
				var normalizedTokenValue = path.resolve(path.dirname(resourcePath), token.value);

				// if not resolved before, add it to the list
				if (!resolveMap[normalizedTokenValue]) {
					options.resolve(normalizedTokenValue);
				} else {
					// this path will be added as JS require in the template
					includes.push(token.value);
					// use the resolved path as token value, later on the template will be registered with this same id
					token.value = utils.generateTemplateId(resolveMap[normalizedTokenValue], loaderApi.options.context);
				}
			}
		};

		var processToken = function (token) {
			if (token.type === "logic" && token.token.type) {
				switch (token.token.type) {
					case 'Twig.logic.type.block':
					case 'Twig.logic.type.if':
					case 'Twig.logic.type.elseif':
					case 'Twig.logic.type.else':
					case 'Twig.logic.type.for':
					case 'Twig.logic.type.spaceless':
					case 'Twig.logic.type.macro':
						_.each(token.token.output, processToken);
						break;
					case 'Twig.logic.type.extends':
					case 'Twig.logic.type.include':
						// only process includes by webpack if they are strings
						// otherwise just leave them for runtime to be handled
						// since it's possible to pre-register templates that
						// will be resolved during runtime
						if (token.token.stack.every(function (token) {
							return token.type === 'Twig.expression.type.string';
						})) {
							_.each(token.token.stack, processDependency);
						}
						break;
					case 'Twig.logic.type.embed':
						_.each(token.token.output, processToken);
						_.each(token.token.stack, processDependency);
						break;
					case 'Twig.logic.type.import':
					case 'Twig.logic.type.from':
						if (token.token.expression !== '_self') {
							_.each(token.token.stack, processDependency);
						}
						break;
				}
			}
		};

		var parsedTokens = JSON.parse(tokens);

		_.each(parsedTokens, processToken);

		var output = [
			'var twig = require("' + pathToTwig + '").twig,',
			'    tokens = ' + JSON.stringify(parsedTokens) + ',',
			'    template = twig({id:' + JSON.stringify(id) + ', data: tokens, allowInlineIncludes: true, rethrow: true});\n',
			'module.exports = function(context) { return template.render(context); }\n',
			'module.exports.tokens = tokens;'
		];
		// we export the tokens on the function as well, so they can be used to re-register this template
		// under a different id. This is useful for dynamic template support when loading the templates
		// with require.context in your application bootstrap and registering them beforehand at runtime

		if (includes.length > 0) {
			_.each(_.uniq(includes), function (file) {
				output.unshift("require(" + JSON.stringify(file) + ");\n");
			});
		}

		return output.join('\n');
	};
};
