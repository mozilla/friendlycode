"use strict";

define([
  "./mark-tracker",
  "slowparse/slowparse"
], function(MarkTracker, Slowparse) {
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
    var parallelNode = getParallelNode(node, docFrag);
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

  function getParallelNode(node, docFrag) {
    var root, i;
    var htmlNode = docFrag.querySelector("html");
    var origDocFrag = docFrag;
    var parallelNode = null;
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
    parallelNode = docFrag.querySelector(path);
    if (origDocFrag != docFrag) {
      for (i = 0; i < htmlNode.childNodes.length; i++)
        origDocFrag.appendChild(htmlNode.childNodes[i]);
    }
    return parallelNode;
  }

  function addOrChangeAttrInCode(codeMirror, name, node, parallelNode) {
    var attrValue = node.getAttribute(name);
      if (parallelNode.hasAttribute(name)) {
        for (var i = 0; i < parallelNode.attributes.length; i++) {
          var attr = parallelNode.attributes[i];
          if (attr.nodeName == name) {
            var from = codeMirror.posFromIndex(attr.parseInfo.value.start + 1);
            var to = codeMirror.posFromIndex(attr.parseInfo.value.end - 1);
            codeMirror.noReparseDuring(function() {
              codeMirror.replaceRange(attrValue, from, to);
            });
          }
        }
      } else {
        var beforeOpenTagEnd = parallelNode.parseInfo.openTag.end - 1;
        beforeOpenTagEnd = codeMirror.posFromIndex(beforeOpenTagEnd);
        codeMirror.noReparseDuring(function() {
          codeMirror.replaceRange(' ' + name + '="' + attrValue +
                                  '"', beforeOpenTagEnd);
        });
      }
  }
  
  function startMovableDrag(codeMirror, mouseDownEvent, movable, parallelNode) {
    if (!parallelNode)
      return;
    
    function onMouseMove(event) {
      var relMove = {
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      };
      movable.style.position = "absolute";
      movable.style.top = (startBounds.top + relMove.y) + "px";
      movable.style.left = (startBounds.left + relMove.x) + "px";
      mirrorChangesToCode();
    }
    
    function mirrorChangesToCode() {
      addOrChangeAttrInCode(codeMirror, "style", movable, parallelNode);
      var newHTML = codeMirror.getValue();
      var result = Slowparse.HTML(document, newHTML);
      parallelNode = getParallelNode(movable, result.document);
    }
    
    var dragStart = {
      x: mouseDownEvent.clientX,
      y: mouseDownEvent.clientY
    };
    var startBounds = movable.getBoundingClientRect();
    var window = movable.ownerDocument.defaultView;
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("mouseup", function() {
      mirrorChangesToCode();
      window.removeEventListener("mousemove", onMouseMove, false);
      setTimeout(function() {
        codeMirror.reparse();
      }, 10);
    }, false);
  }
  
  function PreviewToEditorMapping(livePreview, codeMirrorAreas) {
    var codeMirror = livePreview.codeMirror;
    var marks = MarkTracker(codeMirror);
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

          var movable;
          if ($(event.target).hasClass(".thimble-movable"))
            movable = $(event.target);
          else
            movable = $(event.target).closest(".thimble-movable");
          if (movable.length)
            startMovableDrag(codeMirror, event, movable[0],
                             getParallelNode(movable[0], docFrag));

          event.preventDefault();
          event.stopPropagation();
        }
      });
    });
  }
  
  PreviewToEditorMapping._pathTo = pathTo;
  PreviewToEditorMapping._nodeToCode = nodeToCode;
  
  return PreviewToEditorMapping;
});
