(function() {
  module("MarkTracker");
  
  function mtTest(name, cb) {
    test(name, function() {
      var place = $("<div></div>").appendTo(document.body);
      var cm = CodeMirror(place[0], {mode: "text/plain"});
      var mt = MarkTracker(cm);
      try {
        cb(place, cm, mt);
      } finally {
        place.remove();
      }
    });
  }
  
  mtTest("codeMirror content mark/clear works", function(place, cm, mt) {
    cm.setValue("hello");
    mt.mark(2, 4, "blah");
    equal(place.find(".blah").text(), "ll", "source code is marked w/ class");
    mt.clear();
    equal(place.find(".blah").length, 0, "source code class is cleared");
  });
  
  mtTest("related element mark/clear works", function(place, cm, mt) {
    var thing = $("<div></div>");
    cm.setValue("hello");
    mt.mark(1, 4, "foo", thing[0]);
    ok(thing.hasClass("foo"), "related element is marked w/ class");
    mt.clear();
    ok(!thing.hasClass("foo"), "related element class is cleared");
  });
})();

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
