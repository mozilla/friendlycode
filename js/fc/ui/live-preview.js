"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(function() {
  // Given a descendant of the given root element, returns a CSS
  // selector that uniquely selects only the descendant from the
  // root element.
  function pathTo(root, descendant) {
    var target = $(descendant).get(0);
    var parts = [];

    for (var node = target; node && node != root; node = node.parentNode) {
      var n = $(node).prevAll(node.nodeName.toLowerCase()).length + 1;
      var selector = node.nodeName.toLowerCase() + ':nth-of-type(' + n + ')';
      parts.push(selector);
    }
    
    parts.reverse();
    return ' > ' + parts.join(' > ');
  }
  
  function LivePreview(options) {
    var self = {};

    options.codeMirror.on("reparse", function(event) {
      if (!event.error || options.ignoreErrors) {
        // Update the preview area with the given HTML.
        var doc = options.previewArea.contents()[0];
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

        // TODO: If the document has images that take a while to load
        // and the previous scroll position of the document depends on
        // their dimensions being set on load, we may need to refresh
        // this scroll position after the document has loaded.
        wind.scroll(x, y);
      }
    });

    return self;
  };
  
  LivePreview._pathTo = pathTo;
  return LivePreview;
});
