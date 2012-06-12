"use strict";

define(function() {

  return function(options) {
    var codeMirror = options.codeMirror,
        helpArea = options.helpArea,
        errorArea = options.errorArea,
        relocator = options.relocator;

    var tzo = $("#text-size-options");
    
    /**
     * established font sizes - note: must correspond to editor.css [data-size=...] rules
     */
    var smallSize = 12,
        normalSize = 14,
        largeSize = 18;

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
          size = t.attr("data-size"),
          base = (size==="small" ? smallSize : size==="normal" ? normalSize : largeSize),
          height = base * 1.125,
          cheight = height - 1,
          lp = parseInt($("#text-nav-item li").css("padding-left")),
          rp = parseInt($("#text-nav-item li").css("padding-right")), 
          bwidth = 1;
      
      var fn = function() {
        // remove old fontsize stylesheet
        var stylesheets = document.getElementsByTagName("style"), s, len=stylesheets.length, stylesheet;
        for (s=0; s<len; s++) {
          stylesheet = stylesheets[s];
          if (stylesheet.id && stylesheet.id === "cmFontSizeOverride") {
            document.head.removeChild(stylesheet);
            break;
          }
        }
        // create new fontsize stylesheet
        stylesheet = document.createElement("style");
        stylesheet.id = "cmFontSizeOverride";
        stylesheet.innerHTML = " /* source code font size: "+size+" */\n";
        stylesheet.innerHTML += ".CodeMirror div, .CodeMirror pre { font-size: "+base+"px; line-height: "+height+"px; }\n";
        stylesheet.innerHTML += ".cm-s-jsbin span.cm-comment { font-size: "+base+"px; line-height: "+cheight+"px; }\n";
        document.head.appendChild(stylesheet);
        // refesh code mirror
        codeMirror.refresh();
        // reparse as well, in case there were any errors
        codeMirror.reparse();
        // update localstorage
        if (supportsLocalStorage()) try {
          // TODO: Consider using lscache here, as it automatically deals
          // w/ edge cases like out-of-space exceptions.
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
    
    var defaultSize = "normal";
    var lastSize = supportsLocalStorage() && localStorage["ThimbleTextSize"];
    if (lastSize && $("#text-nav-item li[data-size="+lastSize+"]").length)
      defaultSize = lastSize;
    
    $("#text-nav-item li[data-size="+defaultSize+"]").click();
  };
});
