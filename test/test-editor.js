module("Editor");

test("IndexableCodeMirror works", function() {
  var place = $("<div></div>").appendTo(document.body);
  var cm = IndexableCodeMirror(place[0], {mode: "text/plain"});
  var content = "hello\nthere";
  cm.setValue(content);
  equal(cm.indexFromCoords({line: 0, ch: 0}), 0);
  equal(cm.indexFromCoords({line: 1, ch: 0}), content.indexOf("there"));
  cm.setCursor({line: 1, ch: 0});
  equal(cm.getCursorIndex(), content.indexOf("there"));
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
  ]);
  events = [];

  cm.on("reparse", function(arg) {
    equal(arg.document, "here is a document");
    equal(arg.error, "here is an error");
    equal(arg.sourceCode, "hello");
  });
  cm.reparse();
  deepEqual(events, [
    "cm.trigger('reparse')",
    "cm.trigger('cursor-activity')",
  ]);
  cm.off("reparse");
  events = [];

  cm.setValue("hello goober");
  deepEqual(events, [
    "cm.trigger('change')",
    "time.clearTimeout(0)",
    "time.setTimeout(fn, 1) -> 1"
  ]);
  events = [];

  cm.on("reparse", function(event) {
    equal(event.sourceCode, "hello goober");
  });
  fakeTime.cb();
  deepEqual(events, [
    "cm.trigger('reparse')",
    "cm.trigger('cursor-activity')"
  ]);
  events = [];
  
  cm.setCursor({line: 0, ch: 2});
  deepEqual(events, ["cm.trigger('cursor-activity')"]);

  place.remove();
});
