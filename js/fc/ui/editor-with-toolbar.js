define([
  "jquery",
  "./two-paned-editor",
  "./editor-toolbar"
], function($, TwoPanedEditor, EditorToolbar) {
  return function EditorWithToolbar(options) {
    var value = options.value,
        container = options.container.empty()
          .addClass("friendlycode-base"),
        toolbarDiv = $('<div class="friendlycode-toolbar"></div>')
          .appendTo(container),
        editorDiv = $('<div class="friendlycode-editor"></div>')
          .appendTo(container);
    
    var editor = TwoPanedEditor({
      container: editorDiv,
      value: value
    });
    var toolbar = EditorToolbar({
      container: toolbarDiv,
      editor: editor
    });
    
    container.removeClass("friendlycode-loading");
    editor.codeMirror.refresh();
    
    return {
      container: container,
      editor: editor,
      toolbar: toolbar
    };
  };
});
