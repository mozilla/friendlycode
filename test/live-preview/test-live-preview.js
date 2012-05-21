"use strict";

require([
  "fc/ui/live-preview",
  "../slowparse/slowparse",
  "text!test/live-preview/path-to.html"
], function(LivePreview, Slowparse, pathToHTML) {
  module("LivePreview");
  
  function lpTest(name, html, cb) {
    if (typeof(html) == 'function') {
      cb = html;
      html = '<p>hi <em>there</em></p>';
    }
    asyncTest(name, function() {
      var previewArea = $('<iframe src="../blank.html"></iframe>');
      previewArea.appendTo(document.body).css({
        visibility: "hidden"
      }).load(function() {
        var cm = {};
        _.extend(cm, Backbone.Events);
        var preview = LivePreview({
          codeMirror: cm,
          previewArea: previewArea
        });
        var result = Slowparse.HTML(document, html);
        cm.trigger('reparse', {
          error: result.error,
          sourceCode: html,
          document: result.document
        });
        try {
          cb(previewArea, preview, cm, result.document, html);
        } finally {
          previewArea.remove();
        }
        start();
      });
    });
  }
  
  function n2cTest(options) {
    var desc = "in " + JSON.stringify(options.html) + ", selector " +
               JSON.stringify(options.selector) + " ";
    lpTest(options.name,
      options.html,
      function(previewArea, preview, cm, docFrag, html) {
        var wind = previewArea.contents()[0].defaultView;
        var p = wind.document.querySelector(options.selector);
        if (!p)
          throw new Error("selector doesn't map to anything");
        var interval = LivePreview._nodeToCode(p, docFrag);
        if (!options.expect)
          ok(interval === null, desc + "doesn't map to any code");
        else
          equal(html.slice(interval.start, interval.end), options.expect,
                desc + "maps to code " + JSON.stringify(options.expect));
      });
  }
  
  lpTest("HTML is written into document", function(previewArea, preview, cm) {
    equal($("body", previewArea.contents()).html(),
          "<p>hi <em>there</em></p>",
          "HTML source code is written into preview area");
  });
  
  lpTest('<base target="_blank"> inserted', function(previewArea) {
    equal($('base[target="_blank"]', previewArea.contents()).length, 1);
  });
  
  lpTest('scrolling is preserved across refresh',
    function(previewArea, preview, cm) {
      cm.trigger('reparse', {
        error: null,
        sourceCode: '<p style="font-size: 400px">hi <em>there</em></p>'
      });
      var wind = previewArea.contents()[0].defaultView;
      wind.scroll(5, 6);
      cm.trigger('reparse', {
        error: null,
        sourceCode: '<p style="font-size: 400px">hi <em>dood</em></p>'
      });
      wind = previewArea.contents()[0].defaultView;
      equal(wind.pageXOffset, 5, "x scroll is preserved across refresh");
      equal(wind.pageYOffset, 6, "y scroll is preserved across refresh");
    });
    
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
      var actual = LivePreview._pathTo(root, target);
      equal(actual, expect, "actual CSS path is same as expected");

      var matches = $(root).find(expect);
      if (matches.length != 1)
        throw new Error("expected path does not uniquely identify element!");
      if (matches.get(0) !== target)
        throw new Error("expected path is not actually valid!");
    });
  });
});
