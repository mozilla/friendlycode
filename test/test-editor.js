module("Editor");

test("IndexableCodeMirror works", function() {
  var place = $("<div></div>").appendTo(document.body);
  var cm = IndexableCodeMirror(place[0], {mode: "text/plain"});
  var content = "hello\nthere";
  cm.setValue(content);
  equal(cm.indexFromCoords({line: 0, ch: 0}), 0,
        "index of line 0, char 0 is 0");
  equal(cm.indexFromCoords({line: 1, ch: 0}), content.indexOf("there"),
        "index of line 1, char 0 works");
  cm.setCursor({line: 1, ch: 0});
  equal(cm.getCursorIndex(), content.indexOf("there"),
        "getCursorIndex() works");
  place.remove();
});

test("ParsingCodeMirror works", function() {
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

  cm.setValue("hello");
  deepEqual(events, [
    "cm.trigger('change')",
    "time.setTimeout(fn, 1) -> 0",
  ], "change event is triggered and timeout function is set");
  events = [];

  cm.on("reparse", function(arg) {
    equal(arg.document, "here is a document", "document passed on reparse");
    equal(arg.error, "here is an error", "error passed on reparse");
    equal(arg.sourceCode, "hello", "source code passed on reparse");
  });
  cm.reparse();
  deepEqual(events, [
    "cm.trigger('reparse')",
    "cm.trigger('cursor-activity')",
  ], "reparse and cursor activity events are triggered");
  cm.off("reparse");
  events = [];

  cm.setValue("hello goober");
  deepEqual(events, [
    "cm.trigger('change')",
    "time.clearTimeout(0)",
    "time.setTimeout(fn, 1) -> 1"
  ], "old timeout function is cleared");
  events = [];

  cm.on("reparse", function(event) {
    equal(event.sourceCode, "hello goober",
          "correct source code is passed on reparse event");
  });
  fakeTime.cb();
  deepEqual(events, [
    "cm.trigger('reparse')",
    "cm.trigger('cursor-activity')"
  ], "reparse/cursor-activity events are triggered by timeout function");
  events = [];
  
  cm.setCursor({line: 0, ch: 2});
  deepEqual(events, ["cm.trigger('cursor-activity')"],
            "cursor-activity event is triggered by setCursor()");

  place.remove();
});

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
