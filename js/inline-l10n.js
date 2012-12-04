define(function() {
  var L10N_RE = /L10N(?:\:([a-z\-]+))?\[\[\[([\s\S]+?)\]\]\]/g;
    
  var InlineL10n = function InlineL10n(str, l10n) {
    return str.replace(L10N_RE, function(match, key, value) {
      if (!key)
        key = value;
      if (key in l10n)
        return l10n[key];
      return value;
    });
    return str;
  };
  
  InlineL10n.parse = function InlineL10n_parse(str) {
    var defaultValues = {};
    str.replace(L10N_RE, function(match, key, value) {
      if (!key)
        key = value;
      defaultValues[key] = value;
    });
    return defaultValues;
  };
  
  return InlineL10n;
});
