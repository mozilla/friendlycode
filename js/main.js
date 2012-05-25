"use strict";

// This is a simple [RequireJS plugin][] that waits for a few resources
// to load before we execute any of the app's main logic.
//
//  [RequireJS plugin]: http://requirejs.org/docs/plugins.html#apiload
(function() {
  var errorsLoaded = jQuery.Deferred();
  
  define("appReady", [], {
    load: function(name, req, load, config) {
      jQuery.when(errorsLoaded).then(load);
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
      HistoryUI = require("fc/ui/history"),
      PublishUI = require("fc/ui/publish"),
      Relocator = require("fc/ui/relocator"),
      ShareUI = require("fc/ui/share"),
      SocialMedia = require("fc/ui/social-media"),
      HelpTemplate = require("template!help"),
      ErrorTemplate = require("template!error"),
      AppReady = require("appReady!"),
      publishURL = $("meta[name='publish-url']").attr("content"),
      remixURL = $("meta[name='remix-url']").attr("content");
  
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
  var cursorHelp = ContextSensitiveHelp({
    codeMirror: codeMirror,
    helpIndex: Help.Index(),
    template: HelpTemplate,
    helpArea: $(".help"),
    relocator: relocator
  });
  var errorHelp = ErrorHelp({
    codeMirror: codeMirror,
    template: ErrorTemplate,
    errorArea: $(".error"),
    relocator: relocator
  });
  var preview = LivePreview({
    codeMirror: codeMirror,
    ignoreErrors: true,
    previewArea: $("#preview-holder")
  });
  var publisher = Publisher(publishURL);
  
  var currentPage = {
    path: null,
    defaultPath: "default",
    remixTemplate: location.protocol + "//" + location.host + 
                   location.pathname + "#{{VIEW_URL}}",
    cache: {},
    change: function(newPath) {
      function triggerLoad() {
        if (self.path != newPath) {
          // Oops, another page change has already been requested.
          return;
        }
        codeMirror.setValue(self.cache[self.path]);
        self.trigger("load");
      }

      var self = this;

      if (!newPath)
        newPath = self.defaultPath;

      self.trigger("before-change");
      self.path = newPath;
      self.trigger("change");

      if (self.path in self.cache) {
        triggerLoad();
      } else {
        if (self.path == "default") {
          jQuery.get("default-content.html", function(html) {
            self.cache[self.path] = html;
            triggerLoad();
          }, "text");
        } else
          publisher.loadCode(self.path, function(err, data, url) {
            if (err)
              // TODO: Put nicer error here.
              alert('Sorry, an error occurred while trying to get ' +
                    'the page.');
            else {
              self.cache[self.path] = data;
              triggerLoad();
            }
          });
      }
    },
    remixURL: function(path) {
      return this.remixTemplate.replace("{{VIEW_URL}}", escape(path));
    }
  };
  _.extend(currentPage, Backbone.Events);

  if (remixURL != "use-url-hash") {
    // A server is serving us as the custom edit URL for a web page.
    currentPage.defaultPath = remixURL;
    currentPage.remixTemplate = location.protocol + "//" + location.host +
                                "{{VIEW_URL}}/edit";
  }
  
  $(window).on("hashchange", function() {
    currentPage.change(window.location.hash.slice(1));
  });
  
  var publishUI = PublishUI({
    codeMirror: codeMirror,
    publisher: publisher,
    dialog: $("#publish-dialog"),
    currentPage: currentPage
  });
  var historyUI = HistoryUI({
    codeMirror: codeMirror,
    undo: $("#undo-nav-item"),
    redo: $("#redo-nav-item")
  });
  var socialMedia = SocialMedia({
    jQuery: jQuery,
    getURL: function() {
      return $("#share-container .link-to-this a.view")[0].href;
    },
    container: $("#share-container")
  });
  //var shareUI = ShareUI({
  //  codeMirror: codeMirror,
  //  dialog: $('#share-dialog'),
  //  socialMedia: socialMedia,
  //  publisher: publisher
  //});
  
  var parachute = Parachute(window, codeMirror, currentPage);

/*
  $("#save-draft-button").click(function() { publishUI.saveCode(); });
  $("#publish-button").click(function() { shareUI.shareCode(); });
*/

  $("#hints-nav-item").click(function() {
    var hints = $(this);
    if (hints.hasClass("on")) {
      hints.removeClass("on").addClass("off");
    } else {
      hints.removeClass("off").addClass("on");
    }
  });

  // prevent CodeMirror for hijacking clicks on the help and error notices
  $("div.help, div.error").each(function(){
    this.onmousedown = function(event) {
      if (event.cancelBubble) {
        event.cancelBubble = true;
      } else if (event.stopPropagation) {
        event.stopPropagation();
      }
      return false;
    };
  });
  
  // TEMP TEMP TEMP TEMP TEMP -- HOOK UP VIA publishUI INSTEAD
  $("#publish-button").click(function(){
    $("#confirm-dialog").show();
  });
  $("#confirm-publication").click(function(){
    $("#confirm-dialog").hide();
    $("#publish-dialog").show();
    publishUI.saveCode(function(viewURL, remixURL, path, code) {
      $("a.remix").text("Here");
      currentPage.cache[path] = code;
      window.location.hash = "#" + path;
    });
  });
  $("#modal-close-button, #cancel-publication").click(function(){ 
    $(".modal-overlay").hide();
  });
  // TEMP TEMP TEMP TEMP TEMP -- HOOK UP VIA publishUI INSTEAD

  currentPage.on("change", function() {
    $("#editor").addClass("loading");
  });
  
  currentPage.on("load", function() {
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
  });

  preview.on("refresh", function(event) {
    var title = event.window.document.title;
    if (title.length)
      $(".preview-title").text(title).show();
    else
      $(".preview-title").hide();
  });
  
  $(window).trigger("hashchange");

  return {
    codeMirror: codeMirror,
    parachute: parachute
  };
});
