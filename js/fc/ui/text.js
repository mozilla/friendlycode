"use strict";

define(function() {

  return function(options) {
    var codeMirror = options.codeMirror;
    var tzo = $("#text-size-options");

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
          lp = t.position().left,
          lw = t.width(),
          ico = $(".icon",t),
          iw = ico.width();
      tzo.css("display","inline").css("left", (lp-1) + "px").css("top","7px").css("width", lw + "px");
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
          base = (size==="small" ? 12 : size==="normal" ? 16 : 22),
          height = base * 1.125,
          cheight = height - 1,
          lp = parseInt($("#text-nav-item li").css("padding-left")),
          rp = parseInt($("#text-nav-item li").css("padding-right")), 
          bwidth = 1;
      
      t.css("width", (t.width()) + "px");
      
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
        // update localstorage
        if (supportsLocalStorage()) { localStorage["ThimbleTextSize"] = size; }
        // mark text size in drop-down
        $("#text-nav-item li").removeClass("selected");
        $("#text-nav-item li[data-size="+size+"]").addClass("selected");
      }
      t.click(fn);
    });
    
    /**
     * If there is a thimble text size set, trigger it.
     */
    if (supportsLocalStorage()) {
      if (typeof localStorage["ThimbleTextSize"] !== "undefined") {
        var textSize = localStorage["ThimbleTextSize"];
        $("#text-nav-item li[data-size="+textSize+"]").click();
      }
    }
  };
});
