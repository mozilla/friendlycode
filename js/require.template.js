// This is a simple RequireJS plugin that loads an underscore.js template.
define([
  "module",
  "text",
  "underscore",
  "inline-l10n"
], function (module, text, _, InlineL10n) {
  var buildMap = {},
      masterConfig = module.config(),
      i18nModuleName = "i18n!" + masterConfig.i18nPath;

  function templatePath(require, name) {
    return require.toUrl(masterConfig.htmlPath + "/" + name)
      .replace(".js", ".html");
  }
  
  return {
    load: function(name, req, onLoad, config) {
      text.get(templatePath(req, name), function (data) {
        if (config.isBuild) {
          buildMap[name] = JSON.stringify(data);
          return onLoad();
        }
        req([i18nModuleName], function(i18nBundle) {
          onLoad(_.template(InlineL10n(data, i18nBundle)));
        });
      });
    },
    write: function (pluginName, moduleName, write) {
      if (buildMap[moduleName]) {
        var content = buildMap[moduleName];
        write.asModule(pluginName + "!" + moduleName,
          "define(['underscore', 'inline-l10n', " +
                  "'" + i18nModuleName + "'], " +
          "function (_, InlineL10n, i18nBundle) { \n  return " + 
          "_.template(InlineL10n(" + content + ", i18nBundle));});\n"
        );
      }
    }
  };
});