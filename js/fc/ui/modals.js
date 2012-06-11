"use strict";

define(function() {
  return function(options) {
    var codeMirror = options.codeMirror,
        publishUI = options.publishUI,
        socialMedia = options.socialMedia;

    var hideModals = function() {
      $(".modal-overlay").fadeOut();
    }

    /**
     * When someone clicks on the darkening-overlay, rather
     * than the modal dialog, close the modal dialog again.
     */
    $(".modal-overlay").click(function(event) { 
      if (event.target === this) { 
        $(this).fadeOut(); 
      }
    });

    /**
     * The escape key should univerally close modal dialogs
     */ 
    $(document).keyup(function(event) {
      if (event.keyCode == 27) {
        hideModals();
      }
    });

    /**
     * Add accordion behaviour to the publication dialog.
     */
    var accordion = $(".thimble-menu-content div.accordion");
    var clickHandler = function(item) {
      accordion.addClass("collapsed");
      $(item).removeClass("collapsed");
    }
    accordion.click(function() { clickHandler(this); });

    /**
     * modal dialog interaction sequence
     */
    codeMirror.on("change", function() {
      var isEnabled = codeMirror.getValue().trim().length ? true : false;
      $("#publish-button").toggleClass("enabled", isEnabled);
    });
    
    codeMirror.on("reparse", function(event) {
      var hasErrors = event.error ? true : false;
      $("#confirm-dialog").toggleClass("has-errors", hasErrors);
    });
    
    $("#publish-button").click(function(){
      if ($(this).hasClass("enabled")) $("#confirm-dialog").fadeIn();
    });

    // CONFIRM DIALOG IS IN MAIN.JS FOR THE MOMENT DUE TO
    // ITS NEED TO CALL A PUBLICATION CALLBACK IN MAIN.JS

    $("#modal-close-button, #cancel-publication").click(function(){ 
      hideModals();
    });

    /**
     * Late-loading for social media
     */
    $("#share-result").click(function() {
      var mediaList = $("#share-result li");
      mediaList.each(function() {
        var element = $(this),
             medium = element.attr("data-medium");
        if (!element.hasClass("hotloaded") && medium && socialMedia[medium]) {
          socialMedia.hotLoad($, element, socialMedia[medium]);
          element.addClass("hotloaded");
          // Facebook needs additional help, because it needs
          // to be told that it has to refresh its button, rather
          // than simply reloading.
          if (medium === "facebook" && FB && FB.XFBML && FB.XFBML.parse) {
            FB.XFBML.parse();
          }
        }
      });
    });
    
    return {
      /**
       * Reset the publish modal dialog
       */
      resetPublishModal: function() {
        $("script#twitter-wjs, script#google-plus, script#facebook-jssdk").remove();
        $("a.view, a.remix").text("[we're busy publishing your page...]");
        $(".accordion").addClass("collapsed");
        $("#publication-result").removeClass("collapsed");
        $("#share-result .thimble-additionals").html("<ul><li data-medium='twitter'>Twitter</li><li data-medium='google'>Google+</li><li data-medium='facebook'>Facebook</li></ul>");
      }
    }
  };
});
