"use strict";

require(["fc/ui/live-preview"], function(LivePreview) {
  module("LivePreview");
  
  function lpTest(name, cb) {
    test(name, function() {
      var div = $('<div></div>').appendTo('body').css({visibility: "hidden"});
      var cm = {};
      _.extend(cm, Backbone.Events);
      var preview = LivePreview({
        codeMirror: cm,
        previewArea: div
      });
      cm.trigger('reparse', {
        error: null,
        sourceCode: '<p>hi <em>there</em></p>'
      });
      try {
        var iframe = div.find("iframe");
        if (iframe.length != 1)
          ok(false, "preview area should contain 1 iframe");
        cb(iframe, preview, cm);
      } finally {
        div.remove();
      }
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
      var wind;
      preview.on('refresh', function(event) {
        wind = event.window;
      });
      
      cm.trigger('reparse', {
        error: null,
        sourceCode: '<p style="font-size: 400px">hi <em>there</em></p>'
      });
      wind.scroll(5, 6);
      var oldWind = wind;
      cm.trigger('reparse', {
        error: null,
        sourceCode: '<p style="font-size: 400px">hi <em>dood</em></p>'
      });
      ok(oldWind != wind, "window changes across reparse");
      equal(wind.pageXOffset, 5, "x scroll is preserved across refresh");
      equal(wind.pageYOffset, 6, "y scroll is preserved across refresh");
    });
});
