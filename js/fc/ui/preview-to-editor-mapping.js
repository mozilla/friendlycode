"use strict";

define(["jquery", "./mark-tracker", "./flickrfindr"], function($, MarkTracker, FlickrFindr) {

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
          event.preventDefault();
          event.stopPropagation();
          
          // TEMP TEST (webmaker flickr api_key)
          if (tagName === "img")
          {
            var showResults = function(finder) {
              var contentPane = $("#FlickrFindrPane div.images"),
                  entry, href, link, i, last;
              for(i=finder.lastCount, last=finder.entries.length; i<last; i++) {
                entry = finder.entries[i];

                link = document.createElement("span");
                link.appendChild(entry.img);
                link.title = entry.title;
                link.onclick = (function(i,h) {
                  return function() {
                    i = i.replace("http://","//");
                    var imgHTML = "&lt;img src=\"<a href='"+i+"'>"+i+"</a>\" alt=\"Found on: <a href='"+h+"'>"+h+"</a>\"&gt;",
                        imageDiv = $("#FlickrFindrPane div.imgCode div");
                    imageDiv.html(imgHTML);
                    
                    // modify codemirror side of things
                    codeMirror.setSelection(start, end);
                    var originalCode = codeMirror.getSelection();
                    codeMirror.replaceSelection(imageDiv.text());
                    
                    // update "end"
                    end = codeMirror.posFromIndex(interval.start + imageDiv.text().length);
                  };
                }(entry.dataUrlB,entry.href));
                contentPane.append(link);
              }
              finder.moreOnScroll = true;
            }
          
            // inject image picker
            var f = new FlickrFindr("b939e5bd8aa696db965888a31b2f1964", showResults),
                template = f.buildTemplate();
            document.body.appendChild(template[0]);
            document.body.appendChild(template[1]);
            var ffPane = $(template[1]),
                tWidth = ffPane.width();
            ffPane.css({position: "absolute", zIndex: 999999, top: "20%", left: "50%", marginLeft: "-"+(tWidth/2)+"px"});
          }
          // TEMP TEST (webmaker flickr api_key)

        }
      });
    });
  }
  
  PreviewToEditorMapping._pathTo = pathTo;
  PreviewToEditorMapping._nodeToCode = nodeToCode;
  
  return PreviewToEditorMapping;
});
