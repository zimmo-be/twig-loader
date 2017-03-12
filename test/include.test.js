var should = require("should");

var fs = require("fs");
var path = require("path");

var runLoader = require("./fakeModuleSystem");
var twigLoader = require("../");

var fixtures = path.join(__dirname, "fixtures");

describe("include", function () {
    it("should generate correct code", function (done) {
        var template = path.join(fixtures, "include", "template.html.twig");
        runLoader(twigLoader, path.join(fixtures, "include"), template, fs.readFileSync(template, "utf-8"), function (err, result) {
            if (err) throw err;

            result.should.have.type("string");

            // verify the generated module imports the `include`d templates
            result.should.match(/require\(\"\.\/a\.html\.twig\"\);/);
            result.should.match(/require\(\"\.\/b\.html\"\);/); // test webpack extension resolve
            result.should.match(/require\(\"\.\/c\.html\.twig\"\);/);
            result.should.match(/require\(\"\.\/d\.html\.twig\"\);/);
            result.should.match(/require\(\"\.\/e\.html\.twig\"\);/);
            result.should.match(/require\(\"\.\/f\.html\.twig\"\);/);
            result.should.match(/require\(\"\.\/g\.html\.twig\"\);/);

            done();
        });
    });

    // dynamic includes can never be resolved by webpack,
    // so they are probably registered at runtime by the end user
    it("should leave dynamic includes in tact", function (done) {
        var template = path.join(fixtures, "include", "template.dynamic.html.twig");
        runLoader(twigLoader, path.join(fixtures, "include"), template, fs.readFileSync(template, "utf-8"), function (err, result) {
            if (err) throw err;

            result.should.have.type("string");

            // verify the dynamic modules don't end up as require statements
            result.should.not.match(/require\("~"\);/);
            result.should.not.match(/require\(".\/"\);/);
            result.should.not.match(/require\("name"\);/);
            result.should.not.match(/require\("block\.name"\);/);
            // it might be better to test the actual result tokens, but since the output is a string,
            // it's tricky to do those matches.

            done();
        });
    });

    // testing for static includes that cannot be resolved by webpack,
    // so they are probably registered at runtime by the end user
    it("should leave non-existing includes in tact", function (done) {
        var template = path.join(fixtures, "include", "template.alias.html.twig");
        runLoader(twigLoader, path.join(fixtures, "include"), template, fs.readFileSync(template, "utf-8"), function (err, result) {
            if (err) throw err;

            result.should.have.type("string");

            // verify the dynamic modules don't end up as require statements
            result.should.not.match(/require\("foo"\);/);
            // it might be better to test the actual result tokens, but since the output is a string,
            // it's tricky to do those matches.

            done();
        });
    });

    // testing to see
    it("should generate same template id for resource and dependency", function (done) {
        var template = path.join(fixtures, "include", "template.nested.html.twig");
        runLoader(twigLoader, path.join(fixtures, "include"), template, fs.readFileSync(template, "utf-8"), function (err, result) {
            if (err) throw err;

            result.should.have.type("string");

            result.should.match(/require\("\.\/nested\.html"\);/);

            // the template id that is in the 'include' to reference 'nested.html.twig'
            var nestedTemplateId = result.match(/"value":"([^"]+)"/i)[1];

            // check template id of nested template
            var nestedTemplate = path.join(fixtures, "include", "nested.html.twig");
            runLoader(twigLoader, path.join(fixtures, "include"), nestedTemplate, fs.readFileSync(nestedTemplate, "utf-8"), function (err, result) {
                if (err) throw err;

                result.should.have.type("string");

                // the ID for the template 'nested.html.twig', this should match the one in the parent template
                // that references this template
                var templateId = result.match(/twig\({id:"([^"]+)"/i)[1];

                templateId.should.equal(nestedTemplateId);

                done();
            });
        });
    });
});
