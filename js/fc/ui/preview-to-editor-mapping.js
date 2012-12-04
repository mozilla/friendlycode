"use strict";

define(["jquery", "./mark-tracker"], function($, MarkTracker) {
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
  
  function nodeToCode(parallelNode) {
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
    return result;
  }

  function initParent(livePreview) {
    var codeMirror = livePreview.codeMirror;
    var docFrag = null;
    var marks = MarkTracker(codeMirror);
    $(".CodeMirror-lines", codeMirror.getWrapperElement())
      .on("mouseup", marks.clear);
    livePreview.on("channel:created", function() {
      livePreview.channel.bind("ptem:highlight", function(trans, params) {
        marks.clear();
        if (!docFrag) return;
        var element = docFrag.querySelector(params);
        if (!element) return;
        var interval = nodeToCode(element);
        if (!interval) return;
        var start = codeMirror.posFromIndex(interval.start);
        var end = codeMirror.posFromIndex(interval.end);
        var contentStart = codeMirror.posFromIndex(interval.contentStart);
        var startCoords = codeMirror.charCoords(start, "local");
        codeMirror.scrollTo(startCoords.x, startCoords.y);
        marks.mark(interval.start, interval.end,
                   "preview-to-editor-highlight");
        codeMirror.focus();
      });
    });
    codeMirror.on("reparse", function(event) {
      docFrag = event.document;
      marks.clear();
    });
  }
  
  function initChild(livePreview) {
    livePreview.on("refresh", function(event) {
      var docFrag = event.documentFragment;
      $(event.window).on("mousedown", function(event) {
        var tagName = event.target.tagName.toLowerCase();
        var interval = null;
        if (tagName !== "html" && tagName !== "body") {
          var htmlElement = event.target.ownerDocument.documentElement;
          livePreview.channel.notify({
            method: "ptem:highlight",
            params: "html " + pathTo(htmlElement, event.target)
          });
        }
      });
    });
  }
  
  function PreviewToEditorMapping(livePreview) {
    if (livePreview.inEditor)
      initParent(livePreview);
    else
      initChild(livePreview);
  }
  
  PreviewToEditorMapping._pathTo = pathTo;
  PreviewToEditorMapping._nodeToCode = nodeToCode;
  
  return PreviewToEditorMapping;
});
