"use strict";

/**
 * Flickr searching of CC-at(-sa/-nc/-nd) photo content.
 */
define(["jquery"], function($) {

  return function FlickrImagePicker(options, undef)
  {
    var flickrFinder = options.flickrFinder,
        previewMapper = options.previewMapper,
        codeMirror = options.codeMirror,
        interval = undef;

    var showResults = function(finder) {

      // this does not seem the best way to inject?
      if(finder.template.parentNode !== document.body) {
        document.body.appendChild(finder.template);
      }

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
    };
    
    /**
     * callback handler for "more results" retrieval
     */
    flickrFinder.setCallback(showResults);

    // tricker whenever the mapper signals a refresh
    previewMapper.on("PreviewToEditorMapping:refresh", function(e) {
      var tagName = e.tagName;
      if (tagName !== "img") return;
      interval = e.interval;
      showResults(flickrFinder);
    });

  }
});