define([
  "inline-l10n"
], function(InlineL10n) {  
  var root = {};
  if (typeof(document) == "undefined") {
    // We're running in node. Parse all inline l10n strings out
    // of all templates.
    var fs = require('fs');
    fs.readdirSync('templates').forEach(function(filename) {
      var content = fs.readFileSync('templates/' + filename, 'utf8');
      var defaultValues = InlineL10n.parse(content);
      for (var key in defaultValues) {
        var value = defaultValues[key];
        if (key in root && root[key] != value)
          throw new Error("conflicting definitions for key: " + key);
        root[key] = value;
      }
    });
  }
  return {
    description: "Strings for the UI defined in template files.",
    root: root
  };
});
