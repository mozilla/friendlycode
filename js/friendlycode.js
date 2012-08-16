define(function(require) {
  var $ = require("jquery"),
      TwoPanedEditor = require("fc/ui/two-paned-editor"),
      EditorToolbar = require("fc/ui/editor-toolbar"),
      Modals = require("fc/ui/modals"),
      Parachute = require("fc/parachute"),
      CurrentPageManager = require("fc/current-page-manager"),
      Publisher = require("fc/publisher"),
      PublishUI = require("fc/ui/publish"),
      DefaultContentTemplate = require("template!default-content");

  return function FriendlycodeEditor(options) {
    var publishURL = options.publishURL,
        pageToLoad = options.pageToLoad,
        defaultContent = options.defaultContent || DefaultContentTemplate(),
        remixURLTemplate = options.remixURLTemplate ||
          location.protocol + "//" + location.host + 
          location.pathname + "#{{VIEW_URL}}",
        container = options.container.empty()
          .addClass("friendlycode-base friendlycode-loading"),
        toolbarDiv = $('<div class="friendlycode-toolbar"></div>')
          .appendTo(container),
        editorDiv = $('<div class="friendlycode-editor"></div>')
          .appendTo(container),
        ready = $.Deferred();
    
    var editor = TwoPanedEditor({
      container: editorDiv
    });
    var modals = Modals({
      container: $('<div class="friendlycode-base"></div>')
        .appendTo(document.body)
    });
    var publisher = Publisher(publishURL);
    var publishUI = PublishUI({
      modals: modals,
      codeMirror: editor.codeMirror,
      publisher: publisher,
      remixURLTemplate: remixURLTemplate
    });
    var toolbar = EditorToolbar({
      container: toolbarDiv,
      editor: editor,
      startPublish: publishUI.start
    });
    var parachute = Parachute(window, editor.codeMirror);
    var pageManager = CurrentPageManager({
      window: window,
      currentPage: pageToLoad,
      publishUI: publishUI,
      parachute: parachute
    });
    
    function doneLoading() {
      container.removeClass("friendlycode-loading");
      editor.codeMirror.clearHistory();
      toolbar.refresh();
      if (parachute.restore()) {
        toolbar.showDataRestoreHelp();
      } else {
        // Only save data on page unload if it's different from
        // the URL we just (hopefully) loaded.
        parachute.refresh();
      }
      editor.codeMirror.reparse();
      editor.codeMirror.focus();
      editor.codeMirror.refresh();
      ready.resolve();
    }

    if (!pageManager.currentPage()) {
      setTimeout(function() {
        editor.codeMirror.setValue(defaultContent);
        doneLoading();
      }, 0);
    } else
      publisher.loadCode(pageManager.currentPage(), function(err, data, url) {
        if (err) {
          modals.showErrorDialog({
            text: 'Sorry, an error occurred while trying to get the page.'
          });
        } else {
          editor.codeMirror.setValue(data);
          publishUI.setCurrentURL(url);
          doneLoading();
        }
      });
    
    return {
      codeMirror: editor.codeMirror,
      parachute: parachute,
      ready: ready
    };
  };
});
