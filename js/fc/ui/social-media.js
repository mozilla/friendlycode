"use strict";

/**
 * A tiny library for load-loading social media share buttons.
 * If we don't do this, social media will track users even before
 * they click the like button and we don't like that kind of
 * monitoring behaviour.
 */
define(function() {
  return function SocialMedia(options) {
    var $ = options.jQuery;
    var parent = options.container;
    var getURL = options.getURL;
    var urlPlaceHolder = "__URL__PLACE__HOLDER__";

    /**
     * The various social media all have the same API.
     */
    var self = {
      facebook: {
        class: "facebook",
        id: "facebook-jssdk",
        src: "http://connect.facebook.net/en_US/all.js#xfbml=1&appId=1",
        html: "<div class='fb-like' data-href='"+urlPlaceHolder+"' data-send='false' data-action='recommend' data-layout='button_count' data-show-faces='false' data-font='tahoma'></div>"
      },



      google: {
        class: "google",
        id: "google-plus",
        src: "https://apis.google.com/js/plusone.js",
        html: "<g:plusone annotation='none' href='"+urlPlaceHolder+"'></g:plusone>"
      },

      twitter: {
        class: "twitter",
        id: "twitter-wjs",
        src: "http://platform.twitter.com/widgets.js",
        html: "<a href='https://twitter.com/share'class='twitter-share-button' data-text='Check out the #MozThimble page I just made: ' data-url='"+urlPlaceHolder+"' data-via='Mozilla' data-count='none'>Tweet</a>"
      },

      /**
       * Hot-load a social medium's button by first
       * injecting the necessary HTML for the medium
       * to perform its own iframe replacements, and
       * then late-loading the script required for
       * the medium to load up its functionality.
       */
      hotLoad:  function($, element, socialMedium) {
        // TODO: Should we escape the return value of getURL()? It's likely
        // to not contain any characters that need escaping, and its value
        // is trusted, but we may still want to do it.
        element.html(socialMedium.html.replace(urlPlaceHolder, getURL()));
        (function(document, id, src, url) {
          var script = document.createElement("script");
          script.type = "text/javascript";
          script.id = id;
          script.src = src;
          document.head.appendChild(script);
        }(document, socialMedium.id, socialMedium.src));
      }
    };

    return self;
  };
});
