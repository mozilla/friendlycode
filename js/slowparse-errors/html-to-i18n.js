define(["text"], function(text) {
  var buildMap = {};
  
  function htmlToI18nBundle(document, html) {
    var result = {};
    var div = document.createElement('div');

    div.innerHTML = html;
    [].slice.call(div.querySelectorAll('.error-msg')).forEach(function(el) {
      var name = el.className.split(' ').slice(-1)[0];
      result[name] = el.innerHTML;
    });

    return result;
  };

  return {
    load: function(name, req, onLoad, config) {
      var url = req.toUrl(name).replace(".js", ".html");
      
      text.get(url, function(html) {
        var template;
        if (config.isBuild) {
          buildMap[name] = htmlToI18nBundle(config.makeDocument(), html);
          onLoad();
        } else {
          onLoad(htmlToI18nBundle(document, html));
        }
      });
    },
    write: function(pluginName, moduleName, write) {
      var content = JSON.stringify(buildMap[moduleName]);
      write.asModule(pluginName + "!" + moduleName,
                     "define(function() { return " + content + "; });\n");
    }
  };
});
