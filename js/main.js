"use strict";

require(["./help"], function(Help) {
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

  $(window).load(function() {
    jQuery.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
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
        template: _.template($("#help-template").text()),
        helpArea: $(".help")
      });
      var errorHelp = ErrorHelp({
        codeMirror: codeMirror,
        template: _.template($("#error-template").text()),
        errorArea: $(".error")
      });
      var preview = LivePreview({
        codeMirror: codeMirror,
        ignoreErrors: true,
        previewArea: $("#preview")
      });
      var publisher = Publisher($("meta[name='publish-url']").attr("content"));
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
      var parachute = Parachute(window, codeMirror, pageToLoad, lscache);

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
        codeMirror.setValue($("#initial-html").text().trim());
        doneLoading();
      } else
        publishUI.loadCode(pageToLoad, doneLoading);

      // We're only exposing these as globals so we can debug via
      // the console. Other parts of our code should never reference them.
      window._codeMirror = codeMirror;
      window._parachute = parachute;
    });
  });
});
