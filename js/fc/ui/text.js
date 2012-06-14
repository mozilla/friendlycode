"use strict";

define(["lscache"], function(lscache) {
  // Amount of time, in minutes, to store text size setting.
  var CACHE_TIME_LIMIT = 9000;
  var DEFAULT_CACHE_KEY = "ThimbleTextSize";

  return function(options) {
    var codeMirror = options.codeMirror;
    var navItem = options.navItem;
    var cacheKey = options.cacheKey || DEFAULT_CACHE_KEY;
    var menu = navItem.find("ul");
    
    /**
     * established font sizes - note: must correspond to editor.css [data-size=...] rules
     */
    var smallSize = 12,
        normalSize = 14,
        largeSize = 18;

    /**
     * Show or hide the font size drop-down menu
     */
    navItem.hover(function() {
      var t = $(this),
          lp = t.position().left;
      menu.css("display","inline")
        .css("left", (lp-1) + "px").css("top","7px");
      return false;
    }, function() {
      menu.hide();
    });

    /**
     * bind the resize behaviour to the various text resize options
     */
    $("li", menu).each(function() {
      var t = $(this),
          size = t.attr("data-size"),
          base = (size==="small" ? smallSize : size==="normal" ? normalSize : largeSize),
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
        // reparse as well, in case there were any errors
        codeMirror.reparse();
        lscache.set(cacheKey, size, CACHE_TIME_LIMIT);
        // mark text size in drop-down
        $("li", menu).removeClass("selected");
        $("li[data-size="+size+"]", menu).addClass("selected");
        menu.hide();
      }
      t.click(fn);
    });
    
    var defaultSize = $("li[data-default-size]", menu).attr("data-size");
    var lastSize = lscache.get(cacheKey);
    if (lastSize && $("li[data-size="+lastSize+"]", menu).length)
      defaultSize = lastSize;
    
    $("li[data-size="+defaultSize+"]", menu).click();
  };
});
