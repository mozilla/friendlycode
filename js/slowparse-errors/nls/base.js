define([
  '../html-to-i18n-bundle',
  'text!slowparse/spec/errors.base.html'
], function(htmlToI18nBundle, base) {
  return {
    description: '<a href="http://mozilla.github.com/slowparse/spec/">Slowparse errors</a> shown when the user makes basic mistakes like forgetting to close a tag.',
    root: htmlToI18nBundle(base)
  };
});
