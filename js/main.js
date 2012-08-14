"use strict";

// All of this module's exports are only being exposed for debugging
// purposes. Other parts of our code should never cite this module
// as a dependency.
define("main", function(require) {
  var $ = require("jquery"),
      TwoPanedEditor = require("fc/ui/two-paned-editor"),
      EditorToolbar = require("fc/ui/editor-toolbar"),
      Modals = require("fc/ui/modals"),
      Parachute = require("fc/parachute"),
      Publisher = require("fc/publisher"),
      PublishUI = require("fc/ui/publish"),
      publishURL = $("meta[name='publish-url']").attr("content"),
      pageToLoad = $("meta[name='remix-url']").attr("content"),
      deploymentType = $("meta[name='deployment-type']").attr("content"),
      supportsPushState = window.history.pushState ? true : false,
      remixURLTemplate = null,
      container = $("#friendlycode-holder").empty()
        .addClass("friendlycode-loading"),
      toolbarDiv = $('<div class="friendlycode-toolbar"></div>')
        .appendTo(container),
      editorDiv = $('<div class="friendlycode-editor"></div>')
        .appendTo(container),
      ready = $.Deferred();

  require("typekit-ready!");

  $("html").addClass("deployment-type-" + deploymentType);
  if (pageToLoad) {
    // A server is serving us as the custom edit URL for a web page.
    remixURLTemplate = location.protocol + "//" + location.host +
                       "{{VIEW_URL}}/edit";
  } else {
    // Base the edit URLs off a hash on the current page.
    remixURLTemplate = location.protocol + "//" + location.host + 
                       location.pathname + "#{{VIEW_URL}}";
  }
  
  // If a URL hash is specified, it should override anything provided by
  // a server.
  if (window.location.hash.slice(1))
    pageToLoad = window.location.hash.slice(1);

  if (supportsPushState)
    window.history.replaceState({pageToLoad: pageToLoad}, "", location.href);

  var editor = TwoPanedEditor({
    container: editorDiv
  });
  var modals = Modals({
    container: $('<div></div>').appendTo(document.body)
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
  var parachute = Parachute(window, editor.codeMirror, pageToLoad);

  window.addEventListener("hashchange", function(event) {
    // We don't currently support dynamically changing the URL
    // without a full page reload, unfortunately, so just trigger a
    // reload if the user clicked the 'back' button after we pushed
    // a new URL to it.
    var newPageToLoad = window.location.hash.slice(1);
    if (newPageToLoad != pageToLoad)
      window.location.reload();
  }, false);
  
  if (supportsPushState)
    window.addEventListener("popstate", function(event) {
      // We don't currently support dynamically changing the URL
      // without a full page reload, unfortunately, so just trigger a
      // reload if the user clicked the 'back' button after we pushed
      // a new URL to it.
      //
      // Also, for some reason Webkit is sending a spurious popstate with
      // state == null on page load, so we want to check that it's
      // non-null first (see #39).
      if (event.state && event.state.pageToLoad != pageToLoad)
        window.location.reload();
    }, false);
  
  publishUI.on("publish", function(info) {
    // If the browser supports history.pushState, set the URL to
    // be the new URL to remix the page they just published, so they
    // can share/bookmark the URL and it'll be what they expect it
    // to be.
    pageToLoad = info.path;
    // If the user clicks their back button, we don't want to show
    // them the page they just published--we want to show them the
    // page the current page is based on.
    parachute.clearCurrentPage();
    parachute.changePage(pageToLoad);
    // It's possible that the server sanitized some stuff that the
    // user will be confused by, so save the new state of the page
    // to be what they expect it to be, just in case.
    parachute.save();
    if (supportsPushState)
      window.history.pushState({pageToLoad: pageToLoad}, "", info.remixURL);
    else
      window.location.hash = "#" + pageToLoad;
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
    ready.resolve();
  }
  
  if (!pageToLoad) {
    $.get("default-content.html", function(html) {
      editor.codeMirror.setValue(html.trim());
      doneLoading();
    }, "text");
  } else
    publisher.loadCode(pageToLoad, function(err, data, url) {
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
});

require(['main'], function () {});
