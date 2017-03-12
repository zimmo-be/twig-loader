var path = require('path');
var hashGenerator = require("hasha");

// This prefix is used in the compiler to detect already resolved include paths
// when dealing with multiple compilation passes where some of the resources could
// already be resolved, and others might not.
var HASH_PREFIX = '$resolved:';

/**
 * Generate a template id from a path, so the source path is not visible in the output
 * @param templatePath {string} A resolved path by webpack
 * @param context {string} The webpack context path
 * @return {string}
 */
function generateTemplateId(templatePath, context) {
    // strip context (base path) to remove any 'local' filesystem values in the path
    // also generate a hash to hide the path
    // add the source filename for debugging purposes
    return HASH_PREFIX + hashGenerator(templatePath.replace(context, '')) + ':' + path.basename(templatePath);
}

module.exports = {
    HASH_PREFIX: HASH_PREFIX,
    generateTemplateId: generateTemplateId
};
