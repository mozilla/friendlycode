"use strict";

define([
  "inline-l10n"
], function(InlineL10n) {  
  var root = {
    "page-load-err": 'Sorry, an error occurred while trying to get the page.',
    "publish-err": 'Sorry, an error occurred while trying to publish.',
    "facebook-locale": "en_US",
    "default-tweet": "Check out the #MozThimble page I just made:",
    "tweet": "Tweet"
  };

  var metadata = {
    "facebook-locale": {
      help: "Locale passed to Facebook for social media actions."
    }
  };
  
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
        metadata[key] = {
          help: 'This string appears in ' +
                '<a href="https://github.com/mozilla/friendlycode/blob/gh-pages/templates/' + filename + '">' +
                filename + '</a>.'
        };
      }
    });
  }

  return {
    description: "Strings for the user interface.",
    root: root,
    metadata: metadata
  };
});
