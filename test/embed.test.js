var should = require("should");

var fs = require("fs");
var path = require("path");

var runLoader = require("./fakeModuleSystem");
var twigLoader = require("../");

var fixtures = path.join(__dirname, "fixtures");

describe("embed", function() {
  it("should generate proper require embed tag", function(done) {
    var template = path.join(fixtures, "embed", "template.html.twig");
    runLoader(twigLoader, path.join(fixtures, "embed"), template, fs.readFileSync(template, "utf-8"), function(err, result) {
      if(err) throw err;

      result.should.have.type("string");

      // verify the generated module imports the `embed`d templates
      result.should.match(/require\(\"embed\.html\.twig\"\);/);

      done();
    });
  });

  it("should generate proper require include tag in block tag", function(done) {
    var template = path.join(fixtures, "embed", "template.html.twig");
    runLoader(twigLoader, path.join(fixtures, "embed"), template, fs.readFileSync(template, "utf-8"), function(err, result) {
      if(err) throw err;

      result.should.have.type("string");

      // verify the generated module imports the `include`d templates
      result.should.match(/require\(\"include\.html\.twig\"\);/);

      done();
    });
  });

  it("should work with namespaces", function(done) {
    var template = path.join(fixtures, "embed", "namespaces.html.twig");
    let loaderOptions = {
      namespaces: {
        namespace1: "/path/to/namespace1"
      }
    };
    runLoader(twigLoader, path.join(fixtures, "extend"), template, fs.readFileSync(template, "utf-8"), function(err, result) {
      if(err) throw err;

      result.should.have.type("string");

      const pathToEmbed = path.resolve(process.cwd(), loaderOptions.namespaces.namespace1);

      const regExp = new RegExp(`require\\("${pathToEmbed}/embed.html.twig"\\);`)
      // verify the generated module imports the `embed`d templates
      result.should.match(regExp);

      done();
    }, loaderOptions);
  });

});
