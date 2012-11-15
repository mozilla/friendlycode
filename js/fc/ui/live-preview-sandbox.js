"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(function(require) {
  var $ = require("jquery"),
      BackboneEvents = require("backbone-events"),
      Channel = require("jschannel");

  function LivePreviewSandbox(options) {
    var self = {codeMirror: options.codeMirror, title: ""},
        codeMirror = options.codeMirror,
        sandboxURL = options.sandboxURL,
        readyToSendLatestReparse = false,
        iframeSandbox,
        channel,
        latestReparse;

    if (!sandboxURL)
      sandboxURL = require.toUrl("templates/live-preview-sandbox.html");

    function sendLatestReparse() {
      channel.call({
        method: "setHTML",
        params: {
          error: latestReparse.error,
          sourceCode: latestReparse.sourceCode
        },
        error: function(e) {
          if (window.console)
            window.console.log("setHTML() error", e);
          readyToSendLatestReparse = true;
        },
        success: function(v) {
          readyToSendLatestReparse = true;
        }
      });
    }
    
    function setupIframeSandbox() {
      iframeSandbox = document.createElement("iframe");
      iframeSandbox.setAttribute("src", sandboxURL);
      options.previewArea.append(iframeSandbox);
      channel = Channel.build({
        window: iframeSandbox.contentWindow,
        origin: "*",
        scope: "friendlycode",
        onReady: sendLatestReparse
      });
      channel.bind("change:title", function(trans, title) {
        self.trigger("change:title", title);
      });
    }
    
    codeMirror.on("reparse", function(event) {
      var isPreviewInDocument = $.contains(document.documentElement,
                                           options.previewArea[0]);
      if (!isPreviewInDocument) {
        if (window.console)
          window.console.log("reparse triggered, but preview area is not " +
                             "attached to the document.");
        return;
      }
      if (!iframeSandbox)
        setupIframeSandbox();
      latestReparse = event;
      if (readyToSendLatestReparse)
        sendLatestReparse();
    });
    
    BackboneEvents.mixin(self);
    return self;
  };
  
  return LivePreviewSandbox;
});
