"use strict";

define(function() {

  return function(options) {
    var codeMirror = options.codeMirror,
        helpArea = options.helpArea,
        errorArea = options.errorArea,
        relocator = options.relocator;

    var tzo = $("#text-size-options"),
        sizeNames = [];

    /**
     * Check is local storage is supported, and if so, whether
     * the font size has already been stored previously.
     */
    var supportsLocalStorage = function() {
      try {
        return 'localStorage' in window && window['localStorage'] !== null;
      } catch (e) {
        return false;
      }
    };

    /**
     * when we mouseover any not-text-size options,
     * hide the text sizing selection menu.
     */
    $("#header").mouseover(function() {
      tzo.hide(); 
    });

    /**
     * Show or hide the font size drop-down menu
     */
    $("#text-nav-item").mouseover(function() {
      var t = $(this),
          lp = t.position().left;
      tzo.css("display","inline").css("left", (lp-1) + "px").css("top","7px");
      tzo.mouseout(function() { $(this).hide(); });
      tzo.click(function() { $(this).hide(); });
      return false;
    });

    /**
     * bind the resize behaviour to the various text resize options
     */
    $("#text-nav-item li").each(function() {
      var t = $(this),
          size = t.attr("data-size");
      
      sizeNames.push(size);
      
      var fn = function() {
        sizeNames.forEach(function(sizeName) {
          var enabled = (sizeName == size),
              wrapper = $(codeMirror.getWrapperElement());
          wrapper.toggleClass("size-" + sizeName, enabled);
        });
        codeMirror.refresh();
        // update localstorage
        if (supportsLocalStorage())
          // TODO: Consider using lscache here, as it automatically deals
          // w/ edge cases like out-of-space exceptions.
          try {
            localStorage["ThimbleTextSize"] = size;
          } catch (e) { /* Out of storage space, no big deal. */ }
        // mark text size in drop-down
        $("#text-nav-item li").removeClass("selected");
        $("#text-nav-item li[data-size="+size+"]").addClass("selected");
        // hide any help/error messages when the font changes
        helpArea.hide();
        errorArea.hide();
        relocator.cleanup();
      }
      t.click(fn);
    });
    
    var defaultSize = $("#text-nav-item li[data-size-default]")
      .attr("data-size");
    var lastSize = supportsLocalStorage() && localStorage["ThimbleTextSize"];
    if (lastSize && $("#text-nav-item li[data-size="+lastSize+"]").length)
      defaultSize = lastSize;
    
    $("#text-nav-item li[data-size="+defaultSize+"]").click();
  };
});
