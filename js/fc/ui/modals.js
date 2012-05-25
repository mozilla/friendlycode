"use strict";

define(function() {

  return function(options) {
    var publishUI = options.publishUI,
        socialMedia = options.socialMedia;

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
    $("#publish-button").click(function(){
      $("#confirm-dialog").show();
    });

    $("#confirm-publication").click(function(){
      $("#confirm-dialog").hide();
      publishUI.saveCode();
      $("#publish-dialog").show();
    });

    $("#modal-close-button, #cancel-publication").click(function(){ 
      $(".modal-overlay").hide();
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
        }
      });
    });
  };
});
