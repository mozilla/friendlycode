var test = require("tap").test;
var jsdom = require("jsdom").jsdom;
var rootDir = require('path').resolve(__dirname, '..', '..');
var buildI18n = require(rootDir + '/bin/build-i18n');
var bundles = buildI18n.bundles;

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

test("ensure makePlist() works for every bundle module", function(t) {
  Object.keys(bundles).forEach(function(moduleName) {
    var plist = buildI18n.makePlist(bundles[moduleName]);
    var doc = jsdom(plist);
    var dicts = doc.getElementsByTagName('dict');
    var dict = {};
  
    if (dicts.length != 1)
      throw new Error("expected plist to have 1 dict");
  
    for (var i = 0; i < dicts[0].children.length; i += 2) {
      if (dicts[0].children[i].nodeName != "KEY")
        throw new Error("expected key");
      if (dicts[0].children[i+1].nodeName != "STRING")
        throw new Error("expected string");
      var key = dicts[0].children[i].textContent;
      var value = dicts[0].children[i+1].textContent;
      dict[key] = value;
    }
  
    t.deepEqual(dict, bundles[moduleName].root,
                "plist for " + moduleName + " is valid");
  });
  t.end();
});
