"use strict";

// This is a simple [RequireJS plugin][] that waits for a few resources
// to load before we execute any of the app's main logic.
//
//  [RequireJS plugin]: http://requirejs.org/docs/plugins.html#apiload
(function() {
  var errorsLoaded = jQuery.Deferred();
  var typekitFinished = jQuery.Deferred();
  
  function finishTypekit() { typekitFinished.resolve(); }
  
  try {
    Typekit.load({
      active: finishTypekit,
      inactive: finishTypekit
    });
  } catch(e) { finishTypekit(); }

  define("appReady", [], {
    load: function(name, req, load, config) {
      jQuery.when(errorsLoaded, typekitFinished).then(load);
    }
  });
  jQuery.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
    errorsLoaded.resolve();
  });
})();

// All of this module's exports are only being exposed for debugging
// purposes. Other parts of our code should never cite this module
// as a dependency.
define("main", function(require) {
  var Help = require("fc/help"),
      Parachute = require("fc/parachute"),
      Publisher = require("fc/publisher"),
      Slowparse = require("../slowparse/slowparse"),
      TreeInspectors = require("../slowparse/tree-inspectors"),
      ParsingCodeMirror = require("fc/ui/parsing-codemirror"),
      ContextSensitiveHelp = require("fc/ui/context-sensitive-help"),
      ErrorHelp = require("fc/ui/error-help"),
      LivePreview = require("fc/ui/live-preview"),
      PreviewToEditorMapping = require("fc/ui/preview-to-editor-mapping"),
      HistoryUI = require("fc/ui/history"),
      PublishUI = require("fc/ui/publish"),
      Relocator = require("fc/ui/relocator"),
      SocialMedia = require("fc/ui/social-media"),
      HelpTemplate = require("template!help"),
      ErrorTemplate = require("template!error"),
      AppReady = require("appReady!"),
      publishURL = $("meta[name='publish-url']").attr("content"),
      pageToLoad = $("meta[name='remix-url']").attr("content"),
      deploymentType = $("meta[name='deployment-type']").attr("content"),
      Modals = require("fc/ui/modals"),
      TextUI = require("fc/ui/text"),
      supportsPushState = window.history.pushState ? true : false,
      remixURLTemplate = null,
      ready = jQuery.Deferred();

  $("html").addClass("deployment-type-" + deploymentType);
  if (pageToLoad) {
    // A server is serving us as the custom edit URL for a web page.
    remixURLTemplate = location.protocol + "//" + location.host +
                       "{{VIEW_URL}}/edit";
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
    relocator: relocator
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
  var publishUI = PublishUI({
    codeMirror: codeMirror,
    publisher: publisher,
    dialog: $("#publish-dialog"),
    error: $("#error-dialog"),
    remixURLTemplate: remixURLTemplate
  });
  var historyUI = HistoryUI({
    codeMirror: codeMirror,
    undo: $("#undo-nav-item"),
    redo: $("#redo-nav-item")
  });
  var socialMedia = SocialMedia({
    jQuery: jQuery,
    getURL: function() {
      return $("#publication-result a.view")[0].href;
    },
    container: $("#share-result")
  });
  var modals = Modals({
    codeMirror: codeMirror,
    publishUI: publishUI,
    socialMedia: socialMedia
  });
  var textUI = TextUI({
    codeMirror: codeMirror,
    navItem: $("#text-nav-item")
  });
  var parachute = Parachute(window, codeMirror, pageToLoad);

  // make hints on/off actually work
  $("#hints-nav-item").click(function() {
    var hints = $(".checkbox", this);
    if (hints.hasClass("on")) {
      hints.removeClass("on").addClass("off");
      // make sure to hide the help, in case it's active when this option's selected
      $("div.help").hide();
      relocator.cleanup();
    } else {
      hints.removeClass("off").addClass("on");
    }
  });

  
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
  
  function onPostPublish(url, newPageToLoad) {
    // If the browser supports history.pushState, set the URL to
    // be the new URL to remix the page they just published, so they
    // can share/bookmark the URL and it'll be what they expect it
    // to be.
    pageToLoad = newPageToLoad;
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
      window.history.pushState({pageToLoad: pageToLoad}, "", url);
    else
      window.location.hash = "#" + pageToLoad;
  }
  
  // TEMP TEMP TEMP TEMP TEMP -- HOOK UP VIA publishUI INSTEAD
  $("#confirm-publication").click(function(){
    // Start the actual publishing process, so that hopefully by the
    // time the transition has finished, the user's page is published.
    modals.resetPublishModal();
    publishUI.saveCode(function(viewURL, remixURL, path) {
      onPostPublish(remixURL, path);
    });
    // We want the dialogs to transition while the page-sized translucent
    // overlay stays in place. Because each dialog has its own overlay,
    // however, this is a bit tricky. Eventually we might want to move
    // to a DOM structure where each modal dialog shares the same overlay.
    $("#confirm-dialog .thimble-modal-menu").slideUp(function() {
      $(this).show();
      $("#confirm-dialog").hide();
      // suppress publish dialog if an error occurred
      if ($("#error-dialog:hidden").length !== 0) {
        $("#publish-dialog").show();
        $("#publish-dialog .thimble-modal-menu").hide().slideDown();
      }
    });
  });
  // TEMP TEMP TEMP TEMP TEMP -- HOOK UP VIA publishUI INSTEAD

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
    jQuery.get("default-content.html", function(html) {
      codeMirror.setValue(html.trim());
      doneLoading();
    }, "text");
  } else
    publishUI.loadCode(pageToLoad, doneLoading);

  return {
    codeMirror: codeMirror,
    parachute: parachute,
    ready: ready
  };
});
