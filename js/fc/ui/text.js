"use strict";

define(function() {

  return function(options) {
    var codeMirror = options.codeMirror;
    
    var tzo = $("#text-size-options");
    
    /**
     * when we mouseover any not-text-size options,
     * hide the text sizing selection menu.
     */
    $(".nav-item").mouseover(function() {
      tzo.hide(); 
    });


    /**
     * Show or hide the font size drop-down menu
     */
    $("#text-nav-item").mouseover(function() {
      var t = $(this),
          lp = t.position().left,
          lm = parseInt(t.css("padding-left")),
          lw = t.width(),
          tzop = parseInt(tzo.css("padding-left"));
      tzo.css("display","inline").css("left",(lp-lm)+"px").css("width",(lw+lm-tzop)+"px");
      tzo.mouseout(function() { $(this).hide(); });
      tzo.click(function() { $(this).hide(); });
    });


    /**
     * bind the resize behaviour to the various text resize options
     */
    $("#text-nav-item li").each(function() {
      var t = $(this),
          size = t.attr("data-size"),
          base = (size==="small" ? 12 : size==="normal" ? 16 : 22),
          height = base * 1.125,
          cheight = height - 1;
          
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
      }
      t.click(fn);
    });
  };
});
