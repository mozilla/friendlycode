"use strict";

define(["underscore", "jquery", "backbone", "./mark-tracker"], function(_, $, Backbone, MarkTracker) {

  // Given a descendant of the given root element, returns a CSS
  // selector that uniquely selects only the descendant from the
  // root element.
  function pathTo(root, descendant) {
    var target = $(descendant).get(0);
    var parts = [];
    var node, nodeName, n, selector;

    for (node = target; node && node != root; node = node.parentNode) {
      nodeName = node.nodeName.toLowerCase();
      n = $(node).prevAll(nodeName).length + 1;
      selector = nodeName + ':nth-of-type(' + n + ')';
      parts.push(selector);
    }
    
    parts.reverse();
    return ' > ' + parts.join(' > ');
  }
  
  function nodeToCode(node, docFrag) {
    var root, i;
    var htmlNode = docFrag.querySelector("html");
    var origDocFrag = docFrag;
    if (htmlNode && docFrag.querySelector("body")) {
      root = node.ownerDocument.documentElement;
    } else {
      if (!htmlNode) {
        docFrag = document.createDocumentFragment();
        htmlNode = document.createElement("html");
        docFrag.appendChild(htmlNode);
        for (i = 0; i < origDocFrag.childNodes.length; i++)
          htmlNode.appendChild(origDocFrag.childNodes[i]);
      }
      root = node.ownerDocument.body;
    }
    var path = "html " + pathTo(root, node);
    var parallelNode = docFrag.querySelector(path);
    var result = null;
    if (parallelNode) {
      var pi = parallelNode.parseInfo;
      var isVoidElement = !pi.closeTag;
      result = {
        start: pi.openTag.start,
        end: isVoidElement ? pi.openTag.end : pi.closeTag.end,
        contentStart: isVoidElement ? pi.openTag.start : pi.openTag.end
      };
    }
    if (origDocFrag != docFrag) {
      for (i = 0; i < htmlNode.childNodes.length; i++)
        origDocFrag.appendChild(htmlNode.childNodes[i]);
    }
    return result;
  }

  function PreviewToEditorMapping(options) {
    var livePreview = options.livePreview,
        codeMirrorAreas = options.codeMirrorAreas,
        codeMirror = livePreview.codeMirror,
        marks = MarkTracker(codeMirror);
    
    var self = {};
    _.extend(self, Backbone.Events);

    codeMirrorAreas.on("mouseup", marks.clear);
    livePreview.on("refresh", function(event) {
      var docFrag = event.documentFragment;
      marks.clear();
      $(event.window).on("mousedown", function(event) {
        marks.clear();
        var tagName = event.target.tagName.toLowerCase();
        var interval = null;
        if (tagName !== "html" && tagName !== "body")
          interval = nodeToCode(event.target, docFrag);
        if (interval) {
          var start = codeMirror.posFromIndex(interval.start);
          var end = codeMirror.posFromIndex(interval.end);
          var contentStart = codeMirror.posFromIndex(interval.contentStart);
          var startCoords = codeMirror.charCoords(start, "local");
          codeMirror.scrollTo(startCoords.x, startCoords.y);
          marks.mark(interval.start, interval.end,
                     "preview-to-editor-highlight");
          codeMirror.focus();
          event.preventDefault();
          event.stopPropagation();
          
          // trigger an event for further components
          self.trigger("PreviewToEditorMapping:refresh", {
            tagName: tagName,
            interval: interval,
            codeMirror: codeMirror
          });
        }
      });
    });
    _.extend(livePreview, Backbone.Events);
    
    return self;
  }
  
  PreviewToEditorMapping._pathTo = pathTo;
  PreviewToEditorMapping._nodeToCode = nodeToCode;

  return PreviewToEditorMapping;
});
