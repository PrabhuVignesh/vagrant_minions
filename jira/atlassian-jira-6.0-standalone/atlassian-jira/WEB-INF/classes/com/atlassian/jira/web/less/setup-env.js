var runLessRun, init;

(function() {
    var ourImporter = function (path, paths, callback, env)
    {
        path = env.ourLoader.resolve(env.relpath, path);

        var match = /^(.*\/)([^/]+)?$/.exec(path); // basename of path becomes new relpath
        var newrelpath = match ? match[1] : "";

        var data;
        if (env.alreadySeen[path]) {
            data = "/* skipping already included " + path + " */\n";
        } else {
            env.alreadySeen[path] = true;
            data = env.ourLoader.load(path);
            data = data + ""; // converts to proper native string
        }

        var newenv = {
            ourLoader: env.ourLoader,
            relpath: newrelpath,
            alreadySeen: env.alreadySeen,
            filename: path
        };


        var parser = new less.Parser(newenv);
        parser.parse(data, function(e, root)
        {
            if (e) {
                throw e;
            }
            var sheet = { href: path, title: path, type: env && env.mime };
            var env = { local: false, lastModified: 0, remaining: undefined };
            callback(e, root, data, sheet, env);
        });
    };

    var patchLess = function() {

        // disable inline Javascript in less for now (by default: no remote code exploits)
        tree.JavaScript.prototype.toCSS = tree.JavaScript.prototype.eval = function () {
            throw { message: "JavaScript evaluation in Less is disabled",
                index: this.index };
        };

        // custom functions (all names are lowercased before lookup in tree.functions)
        tree.functions.encodeuricomponent = function(a) {
            var str = encodeURIComponent(a.value ? a.value : a.toCSS());
            return new(tree.Quoted)('"' + str + '"', str);
        };
        tree.functions.encodeuri= function(a) {
            var str = encodeURI(a.value ? a.value : a.toCSS());
            return new(tree.Quoted)('"' + str + '"', str);
        };
        tree.functions.inlineimageunoptim = function(a) {
            var inlineImage = Packages.com.atlassian.jira.web.less.inlineimage.InlineImageEncoder.encode(a.value);
            if (inlineImage !== null) {
                return new tree.URL(new(tree.Anonymous)(inlineImage.toDataUri() + ""),[])
            } else {
                return new(tree.URL)(a, []);
            }
        };
        tree.functions.inlineimage = function(a) {
            var inlineImage = Packages.com.atlassian.jira.web.less.inlineimage.InlineImageEncoder.encodeOptimized(a.value);
            if (inlineImage !== null) {
                return new tree.URL(new(tree.Anonymous)(inlineImage.toDataUri() + ""),[])
            } else {
                return new(tree.URL)(a, []);
            }
        };

//        tree.functions.encodeURI = ;
//            tree.functions.spud = function(a) { return new(tree.Anonymous)(a.toSource())}; // example custom function
    };

    init = function() {
        less.Parser.importer = ourImporter;
        patchLess();
    };

    runLessRun = function(srcUrl, loader, css, compress) {
        var alreadySeen = {};
        var env = {
            ourLoader: loader,
            relpath: srcUrl, // start our relative resolve url from our original urls
            filename: srcUrl,
            alreadySeen: alreadySeen
        };
        var parser = new less.Parser(env);

        var result;
        parser.parse(css + "", function (e, root) {
            if (e) {
                throw e;
            }
            result = root.toCSS({compress: compress});
        });
        return result;
    };

})();
