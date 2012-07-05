"use strict";

define(["jquery", "lscache"], function($, lscache) {
  // Amount of time, in minutes, to store text size setting.
  var CACHE_TIME_LIMIT = 9000;
  var DEFAULT_CACHE_KEY = "ThimbleTextSize";

  return function(options) {
    var codeMirror = options.codeMirror;
    var navItem = options.navItem;
    var cacheKey = options.cacheKey || DEFAULT_CACHE_KEY;
    var menu = navItem.find("ul");
    var menuItems = menu.find("li");
    
    function menuItem(size) {
      var item = $("li[data-size=" + size + "]", menu);
      return item.length ? item : null;
    }
    
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
    menuItems.click(function() {
      var t = $(this),
          size = t.attr("data-size");
      
      $(codeMirror.getWrapperElement()).attr("data-size", size);
      
      // refesh code mirror
      codeMirror.refresh();
      // reparse as well, in case there were any errors
      codeMirror.reparse();
      lscache.set(cacheKey, size, CACHE_TIME_LIMIT);
      // mark text size in drop-down
      menuItems.removeClass("selected");
      $(this).addClass("selected");
      menu.hide();
    });
    
    var defaultSize = $("li[data-default-size]", menu).attr("data-size");
    var lastSize = lscache.get(cacheKey);
    if (lastSize && menuItem(lastSize))
      defaultSize = lastSize;
    
    menuItem(defaultSize).click();
  };
});
