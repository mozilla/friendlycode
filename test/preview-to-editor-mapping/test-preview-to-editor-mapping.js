require([
  "jquery",
  "fc/ui/preview-to-editor-mapping",
  "test/test-live-preview",
  "text!test/preview-to-editor-mapping/path-to.html"
], function($, PreviewToEditorMapping, testLivePreview, pathToHTML) {
  module("PreviewToEditorMapping");
  
  var nodeToCode = PreviewToEditorMapping._nodeToCode;
  var pathTo = PreviewToEditorMapping._pathTo;
  
  function n2cTest(options) {
    var desc = "in " + JSON.stringify(options.html) + ", selector " +
               JSON.stringify(options.selector) + " ";
    testLivePreview.lpTest(options.name,
      options.html,
      function(previewArea, preview, cm, docFrag, html) {
        var wind = previewArea.contents()[0].defaultView;
        var p = wind.document.querySelector(options.selector);
        if (!p)
          throw new Error("selector doesn't map to anything");
        var interval = nodeToCode(p, docFrag);
        if (!options.expect)
          ok(interval === null, desc + "doesn't map to any code");
        else
          equal(html.slice(interval.start, interval.end), options.expect,
                desc + "maps to code " + JSON.stringify(options.expect));
      });
  }

  n2cTest({
    name: "nodeToCode() works on HTML w/ explicit <html> and <body>",
    html: "<html><body><p>u</p></body></html>",
    selector: "p",
    expect: "<p>u</p>"
  });

  n2cTest({
    name: "nodeToCode() works on HTML w/ no <html> and <body>",
    html: "<p>u</p>",
    selector: "p",
    expect: "<p>u</p>"
  });

  n2cTest({
    name: "nodeToCode() works on HTML w/ <html> but no <body>",
    html: "<html><p>u</p></html>",
    selector: "p",
    expect: "<p>u</p>"
  });

  n2cTest({
    name: "nodeToCode() works on void element",
    html: '<html><img id="foo"></html>',
    selector: "img",
    expect: '<img id="foo">'
  });

  n2cTest({
    name: "nodeToCode() can't map to anything from implied <html>",
    html: "<p>hi</p>",
    selector: "html",
    expect: null
  });

  test("pathTo() works", function() {
    var div = $('<div></div>').html(pathToHTML);
    div.find(".test-case").each(function() {
      var root = this;

      var expect = $(root).attr("data-expect");
      var target = $(root).find('[data-target="true"]').get(0);
      var actual = pathTo(root, target);
      equal(actual, expect, "actual CSS path is same as expected");

      var matches = $(root).find(expect);
      if (matches.length != 1)
        throw new Error("expected path does not uniquely identify element!");
      if (matches.get(0) !== target)
        throw new Error("expected path is not actually valid!");
    });
  });
});
