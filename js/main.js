"use strict";

// This is a simple [RequireJS plugin][] that waits for a few resources
// to load before we execute any of the app's main logic.
//
//  [RequireJS plugin]: http://requirejs.org/docs/plugins.html#apiload
(function() {
  var iframeLoaded = jQuery.Deferred();
  var errorsLoaded = jQuery.Deferred();
  var blankURL = $("meta[name='blank-url']").attr("content");
  var iframe = $('<iframe id="preview" src="' + blankURL + '"></iframe>');
  
  define("appReady", [], {
    load: function(name, req, load, config) {
      jQuery.when(errorsLoaded, iframeLoaded).then(function() {
        load({previewArea: iframe});
      });
    }
  });
  iframe.appendTo("#preview-holder").load(function() {
    iframeLoaded.resolve();
  });
  jQuery.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
    errorsLoaded.resolve();
  });
})();

// All of this module's exports are only being exposed for debugging
// purposes. Other parts of our code should never cite this module
// as a dependency.
define("main", function(require) {
  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return unescape(pair[1]);
      }
    }
  }

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
      ShareUI = require("fc/ui/share"),
      SocialMedia = require("fc/ui/social-media"),
      HelpTemplate = require("template!help"),
      ErrorTemplate = require("template!error"),
      AppReady = require("appReady!"),
      publishURL = $("meta[name='publish-url']").attr("content");
  
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
  var cursorHelp = ContextSensitiveHelp({
    codeMirror: codeMirror,
    helpIndex: Help.Index(),
    template: HelpTemplate,
    helpArea: $(".help")
  });
  var errorHelp = ErrorHelp({
    codeMirror: codeMirror,
    template: ErrorTemplate,
    errorArea: $(".error")
  });
  var preview = LivePreview({
    codeMirror: codeMirror,
    ignoreErrors: true,
    previewArea: AppReady.previewArea
  });
  var previewToEditorMapping = PreviewToEditorMapping(preview);
  var publisher = Publisher(publishURL);
  var publishUI = PublishUI({
    codeMirror: codeMirror,
    publisher: publisher,
    dialog: $("#publish-dialog")
  });
  var historyUI = HistoryUI({
    codeMirror: codeMirror,
    undo: $("#undo_button"),
    redo: $("#redo_button")
  });
  var socialMedia = SocialMedia({
    jQuery: jQuery,
    getURL: function() {
      return $("#share-container .link-to-this a.view")[0].href;
    },
    container: $("#share-container")
  });
  var shareUI = ShareUI({
    codeMirror: codeMirror,
    dialog: $('#share-dialog'),
    socialMedia: socialMedia,
    publisher: publisher
  });
  var pageToLoad = getQueryVariable('p') || "default";
  var parachute = Parachute(window, codeMirror, pageToLoad);

  $("#save_button").click(function() { publishUI.saveCode(); });
  $("#share_button").click(function() { shareUI.shareCode(); });

  function doneLoading() {
    $("#editor").removeClass("loading");
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
      $("#undo_button").tipsy({
        gravity: 'n',
        fade: true,
        trigger: 'manual',
        title: 'data-restore-help'
      }).tipsy("show");
      setTimeout(function() { $("#undo_button").tipsy("hide"); }, 6000);
    } else {
      // Only save data on page unload if it's different from
      // the URL we just (hopefully) loaded.
      parachute.refresh();
    }
    codeMirror.reparse();
    codeMirror.focus();
  }

  if (pageToLoad == "default") {
    jQuery.get("default-content.html", function(html) {
      codeMirror.setValue(html.trim());
      doneLoading();
    }, "text");
  } else
    publishUI.loadCode(pageToLoad, doneLoading);

  return {
    codeMirror: codeMirror,
    parachute: parachute
  };
});
