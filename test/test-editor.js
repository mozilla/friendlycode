(function() {
  module("IndexableCodeMirror");
  
  function icmTest(cb) {
    return function() {
      var place = $("<div></div>").appendTo(document.body);
      var cm = IndexableCodeMirror(place[0], {mode: "text/plain"});
      var content = "hello\nthere";
      cm.setValue(content);
      try {
        cb(cm, content);
      } finally {
        place.remove();
      }
    };
  }
  
  test("indexFromCoords() works", icmTest(function(cm, content) {
    equal(cm.indexFromCoords({line: 0, ch: 0}), 0,
          "index of line 0, char 0 is 0");
    equal(cm.indexFromCoords({line: 1, ch: 0}), content.indexOf("there"),
          "index of line 1, char 0 works");
  }));
  
  test("getCursorIndex() works", icmTest(function(cm, content) {
    cm.setCursor({line: 1, ch: 0});
    equal(cm.getCursorIndex(), content.indexOf("there"));
  }));
})();

(function() {
  module("ParsingCodeMirror");
  
  function pcmTest(cb) {
    return function() {
      var place = $("<div></div>").appendTo(document.body);
      var events = [];
      var fakeTime = {
        id: 0,
        setTimeout: function(cb, ms) {
          this.cb = cb;
          events.push("time.setTimeout(fn, " + ms + ") -> " + this.id);
          return this.id++;
        },
        clearTimeout: function(id) {
          events.push("time.clearTimeout(" + id + ")");
        }
      };
      var cm = ParsingCodeMirror(place[0], {
        mode: "text/plain",
        parseDelay: 1,
        parse: function(code) {
          return {
            error: "here is an error",
            document: "here is a document"
          };
        },
        time: fakeTime
      });
      cm.on("all", function(eventName, arg) {
        events.push("cm.trigger('" + eventName + "')");
      });
      try {
        cb(cm, events, fakeTime);
      } finally {
        place.remove();
      }
    };
  }
  
  test("change triggered and timeout set on codeMirror.setValue()",
       pcmTest(function(cm, events, fakeTime) {
         cm.setValue("hello");
         deepEqual(events, [
           "cm.trigger('change')",
           "time.setTimeout(fn, 1) -> 0",
         ]);
       }));

  test("reparse() triggers events and passes expected arguments",
       pcmTest(function(cm, events, fakeTime) {
         cm.setValue("hello"); events.splice(0);
         cm.on("reparse", function(arg) {
           equal(arg.document, "here is a document", "document passed");
           equal(arg.error, "here is an error", "error passed");
           equal(arg.sourceCode, "hello", "source code passed");
         });
         cm.reparse();
         deepEqual(events, [
           "cm.trigger('reparse')",
           "cm.trigger('cursor-activity')",
          ]);
       }));
  
  test("old timeout cancelled on multiple content changes",
       pcmTest(function(cm, events, fakeTime) {
         cm.setValue("hello"); events.splice(0);
         cm.setValue("hello goober");
         deepEqual(events, [
           "cm.trigger('change')",
           "time.clearTimeout(0)",
           "time.setTimeout(fn, 1) -> 1"
         ]);
       }));

  test("timeout function triggers events w/ expected args",
       pcmTest(function(cm, events, fakeTime) {
         cm.setValue("hello goober"); events.splice(0);
         cm.on("reparse", function(event) {
           equal(event.sourceCode, "hello goober",
                 "correct source code is passed on reparse event");
         });
         fakeTime.cb();
         deepEqual(events, [
           "cm.trigger('reparse')",
           "cm.trigger('cursor-activity')"
         ], "events are triggered");
       }));

  test("cursor-activity event is triggered by codeMirror.setCursor()",
       pcmTest(function(cm, events, fakeTime) {
         cm.setValue("hello"); events.splice(0);
         cm.setCursor({line: 0, ch: 2});
         deepEqual(events, ["cm.trigger('cursor-activity')"]);
       }));
})();

module("Editor");

test("MarkTracker works", function() {
  var place = $("<div></div>").appendTo(document.body);
  var cm = CodeMirror(place[0], {mode: "text/plain"});
  var mt = MarkTracker(cm);
  
  cm.setValue("hello");
  mt.mark(2, 4, "blah");
  equal(place.find(".blah").text(), "ll", "source code is marked w/ class");
  mt.clear();
  equal(place.find(".blah").length, 0, "source code class is cleared");

  var thing = $("<div></div>");
  mt.mark(1, 4, "foo", thing[0]);
  ok(thing.hasClass("foo"), "related element is marked w/ class");
  mt.clear();
  ok(!thing.hasClass("foo"), "related element class is cleared");

  place.remove();
});

asyncTest("LivePreview works", function() {
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
      sourceCode: '<p style="font-size: 400px">hi <em>there</em></p>'
    });
    equal($("p", previewArea.contents()).html(),
          "hi <em>there</em>",
          "HTML source code is written into preview area");
    equal($('base[target="_blank"]', previewArea.contents()).length, 1,
          '<base target="_blank"> is inserted into document');

    var wind = previewArea.contents()[0].defaultView;
    wind.scroll(5, 6);
    cm.trigger('reparse', {
      error: null,
      sourceCode: '<p style="font-size: 400px">hi <em>dood</em></p>'
    });
    wind = previewArea.contents()[0].defaultView;
    equal(wind.pageXOffset, 5, "x scroll is preserved across refresh");
    equal(wind.pageYOffset, 6, "y scroll is preserved across refresh");
    previewArea.remove();
    start();
  });
});
