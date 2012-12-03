define([
  '../html-to-i18n-bundle',
  'text!slowparse/spec/errors.forbidjs.html'
], function(htmlToI18nBundle, forbidjs) {
  return {root: htmlToI18nBundle(forbidjs)};
});
