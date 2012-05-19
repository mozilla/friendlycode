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
  
  define("app-readiness", [], {
    load: function(name, req, load, config) {
      jQuery.when(errorsLoaded, iframeLoaded).then(function() {
        load(null);
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

// This is a simple RequireJS plugin that loads an underscore.js template.
define("template", [], {
  load: function(name, req, load, config) {
    req(["text!../templates/" + name], function(text) {
      load(_.template(text));
    });
  }
});

require([
  "./help",
  "./parachute",
  "./publisher",
  "../slowparse/slowparse",
  "../slowparse/tree-inspectors",
  "./ui/parsing-codemirror",
  "./ui/context-sensitive-help",
  "./ui/error-help",
  "./ui/live-preview",
  "./ui/history",
  "./ui/publish",
  "./ui/share",
  "./ui/social-media",
  "template!help.html",
  "template!error.html",
  "app-readiness!"
], function(
  Help,
  Parachute,
  Publisher,
  Slowparse,
  TreeInspectors,
  ParsingCodeMirror,
  ContextSensitiveHelp,
  ErrorHelp,
  LivePreview,
  HistoryUI,
  PublishUI,
  ShareUI,
  SocialMedia,
  HelpTemplate,
  ErrorTemplate
) {
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

  var publishURL = $("meta[name='publish-url']").attr("content");
  
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
    previewArea: $("#preview")
  });
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

  // We're only exposing these as globals so we can debug via
  // the console. Other parts of our code should never reference them.
  window._codeMirror = codeMirror;
  window._parachute = parachute;
});
