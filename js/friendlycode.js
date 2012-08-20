define(function(require) {
  var $ = require("jquery"),
      EditorWithToolbar = require("fc/ui/editor-with-toolbar"),
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
        ewt = EditorWithToolbar({container: options.container}),
        ready = $.Deferred();
    
    var modals = Modals({
      container: $('<div class="friendlycode-base"></div>')
        .appendTo(document.body)
    });
    var publisher = Publisher(publishURL);
    var publishUI = PublishUI({
      modals: modals,
      codeMirror: ewt.editor.codeMirror,
      publisher: publisher,
      remixURLTemplate: remixURLTemplate
    });
    var parachute = Parachute(window, ewt.editor.codeMirror);
    var pageManager = CurrentPageManager({
      window: window,
      currentPage: pageToLoad
    });
    
    function doneLoading() {
      ewt.container.removeClass("friendlycode-loading");
      ewt.editor.codeMirror.clearHistory();
      ewt.toolbar.refresh();
      if (parachute.restore()) {
        ewt.toolbar.showDataRestoreHelp();
      } else {
        // Only save data on page unload if it's different from
        // the URL we just (hopefully) loaded.
        parachute.refresh();
      }
      ewt.editor.codeMirror.reparse();
      ewt.editor.codeMirror.focus();
      ewt.editor.codeMirror.refresh();
      ready.resolve();
    }

    ewt.toolbar.setStartPublish(publishUI.start);
    ewt.container.addClass("friendlycode-loading");
    publishUI.on("publish", function(info) {
      // If the user clicks their back button, we don't want to show
      // them the page they just published--we want to show them the
      // page the current page is based on.
      parachute.clearCurrentPage();
      parachute.changePage(info.path);
      // It's possible that the server sanitized some stuff that the
      // user will be confused by, so save the new state of the page
      // to be what they expect it to be, just in case.
      parachute.save();
      // Set the URL to be the new URL to remix the page the user just
      // published, so they can share/bookmark the URL and it'll be what 
      // they expect it to be.
      pageManager.changePage(info.path, info.remixURL);
    });
    
    parachute.changePage(pageManager.currentPage());

    if (!pageManager.currentPage()) {
      setTimeout(function() {
        ewt.editor.codeMirror.setValue(defaultContent);
        doneLoading();
      }, 0);
    } else
      publisher.loadCode(pageManager.currentPage(), function(err, data, url) {
        if (err) {
          modals.showErrorDialog({
            text: 'Sorry, an error occurred while trying to get the page.'
          });
        } else {
          ewt.editor.codeMirror.setValue(data);
          publishUI.setCurrentURL(url);
          doneLoading();
        }
      });
    
    return {
      codeMirror: ewt.editor.codeMirror,
      parachute: parachute,
      ready: ready
    };
  };
});
