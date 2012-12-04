// This is a simple RequireJS plugin that loads an underscore.js template.
define([
  "module",
  "text",
  "underscore",
  "inline-l10n",
  "i18n!fc/nls/templates"
], function (module, text, _, InlineL10n, i18nBundle) {
  var buildMap = {},
      masterConfig = module.config();

  return {
    load: function(name, req, onLoad, config) {
      var url = req.toUrl("templates/" + name).replace(".js", ".html");

      text.get(url, function (data) {
        var template;
        if (config.isBuild) {
          template = buildMap[name] = "_.template(InlineL10n(" +
                     JSON.stringify(data) + ", i18nBundle))";
        } else {
          template = _.template(InlineL10n(data, i18nBundle));
        }

        onLoad(template);
      });
    },
    write: function (pluginName, moduleName, write) {
      if (buildMap[moduleName]) {
        var content = buildMap[moduleName];
        write.asModule(pluginName + "!" + moduleName,
          "define(['underscore', 'inline-l10n', 'i18n!fc/nls/templates'], " +
          "function (_, InlineL10n, i18nBundle) { \n  return " + content +
          ";});\n");
      }
    }
  };
});