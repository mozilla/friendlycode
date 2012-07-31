"use strict";

// All of this module's exports are only being exposed for debugging
// purposes. Other parts of our code should never cite this module
// as a dependency.
define("main", function(require) {
  var $ = require("jquery-tipsy"),
      htmlCodeMirror = require("codemirror/html"),
      Help = require("fc/help"),
      Parachute = require("fc/parachute"),
      Publisher = require("fc/publisher"),
      Slowparse = require("slowparse/slowparse"),
      TreeInspectors = require("slowparse/tree-inspectors"),
      ParsingCodeMirror = require("fc/ui/parsing-codemirror"),
      ContextSensitiveHelp = require("fc/ui/context-sensitive-help"),
      ErrorHelp = require("fc/ui/error-help"),
      LivePreview = require("fc/ui/live-preview"),
      PreviewToEditorMapping = require("fc/ui/preview-to-editor-mapping"),
      HistoryUI = require("fc/ui/history"),
      Relocator = require("fc/ui/relocator"),
      HelpTemplate = require("template!help"),
      ErrorTemplate = require("template!error"),
      publishURL = $("meta[name='publish-url']").attr("content"),
      pageToLoad = $("meta[name='remix-url']").attr("content"),
      deploymentType = $("meta[name='deployment-type']").attr("content"),
      Modals = require("fc/ui/modals"),
      TextUI = require("fc/ui/text"),
      supportsPushState = window.history.pushState ? true : false,
      remixURLTemplate = null,
      ready = $.Deferred();

  require("typekit-ready!");
  require('slowparse-errors');

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
    
  var codeMirror = ParsingCodeMirror($("#source")[0], {
    mode: "text/html",
    theme: "jsbin",
    tabMode: "indent",
    lineWrapping: true,
    lineNumbers: true,
    parse: function(html) {
      return Slowparse.HTML(document, html, [TreeInspectors.forbidJS]);
    }
  });
  var relocator = Relocator(codeMirror);
  var helpArea = $(".help");
  var cursorHelp = ContextSensitiveHelp({
    codeMirror: codeMirror,
    helpIndex: Help.Index(),
    template: HelpTemplate,
    helpArea: helpArea,
    relocator: relocator,
    checkbox: $("#hints-nav-item")
  });
  var errorArea =  $(".error");
  var errorHelp = ErrorHelp({
    codeMirror: codeMirror,
    template: ErrorTemplate,
    errorArea: errorArea,
    relocator: relocator
  });
  var preview = LivePreview({
    codeMirror: codeMirror,
    ignoreErrors: true,
    previewArea: $("#preview-holder")
  });
  var previewToEditorMapping = PreviewToEditorMapping(preview, $(".CodeMirror-lines"));
  var publisher = Publisher(publishURL);
  var historyUI = HistoryUI({
    codeMirror: codeMirror,
    undo: $("#undo-nav-item"),
    redo: $("#redo-nav-item")
  });
  var modals = Modals({
    codeMirror: codeMirror,
    publisher: publisher,
    confirmDialog: $("#confirm-dialog"),
    publishDialog: $("#publish-dialog"),
    errorDialog: $("#error-dialog"),
    publishButton: $("#publish-button"),
    remixURLTemplate: remixURLTemplate
  });
  var textUI = TextUI({
    codeMirror: codeMirror,
    navItem: $("#text-nav-item")
  });
  var parachute = Parachute(window, codeMirror, pageToLoad);
  
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
  
  modals.on("publish", function(info) {
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
    $("body").removeClass("loading");
    codeMirror.clearHistory();
    historyUI.refresh();
    if (parachute.restore()) {
      // Display a non-modal message telling the user that their
      // previous data has been restored, and that they can click 'undo'
      // to go back to the original version of the editor content.
      // This is just a temporary workaround to avoid confusion until
      // we figure out a better solution; see this issue for more
      // discussion:
      //
      // https://github.com/mozilla/webpagemaker/issues/53
      $("#undo-nav-item").tipsy({
        gravity: 'n',
        fade: true,
        trigger: 'manual',
        title: 'data-restore-help'
      }).tipsy("show");
      setTimeout(function() { $("#undo-nav-item").tipsy("hide"); }, 6000);
    } else {
      // Only save data on page unload if it's different from
      // the URL we just (hopefully) loaded.
      parachute.refresh();
    }
    codeMirror.reparse();
    codeMirror.focus();
    ready.resolve();
  }

  preview.on("refresh", function(event) {
    var title = event.window.document.title;
    if (title.length)
      $(".preview-title").text(title).show();
    else
      $(".preview-title").hide();
  });
  
  if (!pageToLoad) {
    $.get("default-content.html", function(html) {
      codeMirror.setValue(html.trim());
      doneLoading();
    }, "text");
  } else
    publisher.loadCode(pageToLoad, function(err, data, url) {
      if (err) {
        alert('Sorry, an error occurred while trying to get the page.');
      } else {
        codeMirror.setValue(data);
        preview.baseURL = url;
        modals.setCurrentURL(url);
        doneLoading();
      }
    });

  return {
    codeMirror: codeMirror,
    parachute: parachute,
    ready: ready
  };
});

require(['main'], function () {});
