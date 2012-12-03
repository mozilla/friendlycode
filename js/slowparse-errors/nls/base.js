define([
  '../html-to-i18n-bundle',
  'text!slowparse/spec/errors.base.html'
], function(htmlToI18nBundle, base) {
  return {root: htmlToI18nBundle(base)};
});
