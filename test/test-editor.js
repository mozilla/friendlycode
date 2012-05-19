(function() {
  module("LivePreview");
  
  function lpTest(name, cb) {
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
        cm.trigger('reparse', {
          error: null,
          sourceCode: '<p>hi <em>there</em></p>'
        });
        try {
          cb(previewArea, preview, cm);
        } finally {
          previewArea.remove();
        }
        start();
      });
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
})();
