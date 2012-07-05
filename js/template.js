// This is a simple RequireJS plugin that loads an underscore.js template.
define(["module", "text", "underscore"], function (module, text, _) {
  var buildMap = {},
      masterConfig = module.config();

  return {
    load: function(name, req, onLoad, config) {
      var url = req.toUrl(name).replace(".js", ".html");

      text.get("templates/" + name + ".html", function (data) {
        // remove break lines
        data = data.replace(/\r\n|\n|\r/g, '');

        var template;
        if (config.isBuild) {
          template = buildMap[name] = "_.template('" + data  + "')";
        } else {
          template = _.template(data);
        }

        onLoad(template);
      });
    },
    write: function (pluginName, moduleName, write) {
      if (buildMap[moduleName]) {
        var content = buildMap[moduleName];
        write.asModule(pluginName + "!" + moduleName,
          "define(['underscore'], function (_) { \n  return " + content + ";});\n");
      }
    }
  };
});