var test = require("tap").test;
var rootDir = require('path').resolve(__dirname, '..', '..');
var bundles = require(rootDir + '/bin/build-i18n').bundles;

test("ensure bundles contain inline-l10n strings", function(t) {
  t.equal(bundles['fc/nls/ui'].root['Yes'], 'Yes');
  t.end();
});

test("ensure bundles contain HTML help", function(t) {
  t.ok('body' in bundles["fc/nls/html-element-docs"].root);
  t.end();
});

test("ensure bundles contain slowparse errors", function(t) {
  t.ok('UNEXPECTED_CLOSE_TAG' in bundles['slowparse-errors/nls/base'].root);
  t.end();
});
