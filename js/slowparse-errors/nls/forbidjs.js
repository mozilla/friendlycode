define([
  '../html-to-i18n-bundle',
  'text!slowparse/spec/errors.forbidjs.html'
], function(htmlToI18nBundle, forbidjs) {
  return {
    description: '<a href="http://mozilla.github.com/slowparse/spec/">Slowparse errors</a> shown when the user tries to use JavaScript but it\'s not allowed.',
    root: htmlToI18nBundle(forbidjs)
  };
});
