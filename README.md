# twig-loader [![Build Status](https://travis-ci.org/zimmo-be/twig-loader.svg)](https://travis-ci.org/zimmo-be/twig-loader)
Webpack loader for compiling Twig.js templates. This loader will allow you to require Twig.js views to your code.

## Installation

`npm install twig-loader`

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html?branch=master)

``` javascript

module.exports = {
    //...

    module: {
        loaders: [
            { test: /\.twig$/, loader: "twig-loader" }
        ]
    },

    node: {
        fs: "empty" // avoids error messages
    }
};
```

## Loading templates

```twig
{# File: dialog.html.twig #}
<p>{{title}}</p>
```

```javascript
// File: app.js
var template = require("dialog.html.twig");
// => returns pre-compiled template as a function and automatically includes Twig.js to your project

var html = template({title: 'dialog title'});
// => Render the view with the given context

```

When you extend another view, it will also be added as a dependency. Include and Import are not yet supported (check back soon).

## Changelog

0.2.0 / 2016-01-21
==================

* Add support for import statements (useful for Macro's)
* Correctly resolve dependencies from include/import/extend statements with relative path support: [\#3] and [\#5]
* CHANGE: No longer add the `.twig` file extension. After upgrading twig-loader, you may need to update your files and add `.twig` manually

