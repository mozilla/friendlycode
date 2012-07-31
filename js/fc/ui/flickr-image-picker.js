"use strict";

/**
 * Flickr searching of CC-at(-sa/-nc/-nd) photo content.
 */
define(["jquery"], function($) {

  return function FlickrImagePicker(options)
  {
    var flickrFinder = options.flickrFinder,
        previewMapper = options.previewMapper;

    var showResults = function(finder, codeMirror, interval) {
      // TEST
      document.body.appendChild(finder.template);
      // TEST
      var contentPane = $("div.images", finder.template),
          entry, href, link, i, last;
      for(i=finder.lastCount, last=finder.entries.length; i<last; i++) {
        entry = finder.entries[i];

        link = document.createElement("span");
        link.appendChild(entry.img);
        link.title = entry.title;
        link.onclick = (function(i,h,interval) {
          return function() {
            i = i.replace("http://","//");
            var imgHTML = "&lt;img src=\"<a href='"+i+"'>"+i+"</a>\" alt=\"Found on: <a href='"+h+"'>"+h+"</a>\"&gt;",
                imageDiv = $("div.imgCode div", finder.template),
                start = codeMirror.posFromIndex(interval.start),
                end = codeMirror.posFromIndex(interval.end);

            imageDiv.html(imgHTML);
            
            // modify codemirror side of things
            codeMirror.setSelection(start, end);
            var originalCode = codeMirror.getSelection();
            codeMirror.replaceSelection(imageDiv.text());

            // update "end" marker for the image interval
            interval.end = interval.start + imageDiv.text().length;
          };
        }(entry.dataUrlB, entry.href, interval));
        contentPane.append(link);
      }
      finder.moreOnScroll = true;
    }
    
    /**
     * callback handler for result retrieval
     */
    finder.setCallback(function(finder) {
      console.log(finder);
    })

    // tricker whenever the mapper signals a refresh
    previewMapper.on("PreviewToEditorMapping:refresh", function(e) {
      var tagName = e.tagName;
      if (tagName !== "img") return;
      showResults(flickrFinder, e.codeMirror, e.interval);
    });

  }
});