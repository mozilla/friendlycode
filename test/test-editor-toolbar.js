"use strict";

defineTests([
  "jquery",
  "fc/ui/two-paned-editor",
  "fc/ui/editor-toolbar"
], function($, TwoPanedEditor, EditorToolbar) {
  var parentDiv, editorDiv, toolbarDiv, editor, options;

  module("EditorToolbar", {
    setup: function() {
      parentDiv = $('<div></div>').appendTo("#qunit-fixture").hide();
      editorDiv = $('<div></div>').appendTo(parentDiv);
      toolbarDiv = $('<div></div>').appendTo(parentDiv);
      editor = TwoPanedEditor({container: editorDiv});
      options = {editor: editor, container: toolbarDiv};
    },
    teardown: function() {
      parentDiv.remove();
    }
  });
  
  test("shows page title when <title> is present", function() {
    var toolbar = EditorToolbar(options);
    editor.codeMirror.setValue("<title>supdog</title>");
    editor.codeMirror.reparse();
    ok(!$(".preview-title", toolbarDiv).attr("style"),
          "navbar preview title is not hidden");
    equal($(".preview-title", toolbarDiv).text(), "supdog",
          "navbar preview title is 'supdog'");
  });
  
  test("doesn't show page title when <title> is absent", function() {
    var toolbar = EditorToolbar(options);
    editor.codeMirror.setValue("<p>hello</p>");
    editor.codeMirror.reparse();
    ok($(".preview-title", toolbarDiv).attr("style").match(/display:\s*none/),
          "navbar preview title is hidden");
  });
});
