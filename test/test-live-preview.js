"use strict";

defineTests([
  "jquery",
  "test/lptest"
], function($, lpTest) {
  module("LivePreview");
  
  lpTest("HTML is written into document", function(previewArea, preview, cm) {
    equal($("body", previewArea.contents()).html(),
          "<p>hi <em>there</em></p>",
          "HTML source code is written into preview area");
  });
  
  lpTest('<base target="_blank"> inserted', function(previewArea) {
    equal($('base[target="_blank"]', previewArea.contents()).length, 1);
  });
  
  lpTest("refresh event is triggered", function(previewArea, preview, cm) {
    var refreshTriggered = false;
    equal(preview.codeMirror, cm, "codeMirror property exists");
    preview.on("refresh", function(event) {
      equal(event.documentFragment, "blop", "documentFragment is passed");
      ok(event.window, "window is passed");
      refreshTriggered = true;
    });
    cm.trigger('reparse', {
      error: null,
      sourceCode: '',
      document: "blop"
    });
    ok(refreshTriggered, "refresh event is triggered");
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
  
  return {
    lpTest: lpTest
  };
});
