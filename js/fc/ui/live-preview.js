"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(function() {  
  function LivePreview(options) {
    var self = {
      codeMirror: options.codeMirror
    };
    var codeMirror = options.codeMirror;

    codeMirror.on("reparse", function(event) {
      if (!event.error || options.ignoreErrors) {
        // Update the preview area with the given HTML.
        var doc = options.previewArea.contents()[0];
        var docFrag = event.document;
        var wind = doc.defaultView;
        var x = wind.pageXOffset;
        var y = wind.pageYOffset;

        doc.open();
        doc.write(event.sourceCode);
        doc.close();

        // Insert a BASE TARGET tag so that links don't open in
        // the iframe.
        var baseTag = doc.createElement('base');
        baseTag.setAttribute('target', '_blank');
        doc.querySelector("head").appendChild(baseTag);

        self.trigger("refresh", {
          window: wind,
          documentFragment: event.document
        });
        
        // TODO: If the document has images that take a while to load
        // and the previous scroll position of the document depends on
        // their dimensions being set on load, we may need to refresh
        // this scroll position after the document has loaded.
        wind.scroll(x, y);
      }
    });

    _.extend(self, Backbone.Events);
    
    return self;
  };
  
  return LivePreview;
});
