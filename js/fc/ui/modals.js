"use strict";

define([
  "./social-media"
], function(SocialMedia) {
  return function(options) {
    var codeMirror = options.codeMirror,
        publishUI = options.publishUI,
        socialMedia = SocialMedia();

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

    $("#modal-close-button, #cancel-publication").click(function(){ 
      hideModals();
    });

    /**
     * Late-loading for social media
     */
    $("#share-result").click(function() {
      // TODO: We should probably delay here if publishing is still
      // in-progress, since we don't yet have a URL to share!
      var mediaList = $("#share-result li");
      var urlToShare = $("#publication-result a.view")[0].href;
      mediaList.each(function() {
        var element = $(this),
             medium = element.attr("data-medium");
        if (!element.hasClass("hotloaded") && medium && socialMedia[medium]) {
          socialMedia.hotLoad(element[0], socialMedia[medium], urlToShare);
          element.addClass("hotloaded");
        }
      });
    });
    
    $("#confirm-publication").click(function(){
      // Reset the publish modal.
      $("a.view, a.remix").text("[we're busy publishing your page...]");
      $(".accordion").addClass("collapsed");
      $("#publication-result").removeClass("collapsed");
      $("#share-result .thimble-additionals").html("<ul><li data-medium='twitter'>Twitter</li><li data-medium='google'>Google+</li><li data-medium='facebook'>Facebook</li></ul>");
      
      // Start the actual publishing process, so that hopefully by the
      // time the transition has finished, the user's page is published.
      publishUI.saveCode();

      // We want the dialogs to transition while the page-sized translucent
      // overlay stays in place. Because each dialog has its own overlay,
      // however, this is a bit tricky. Eventually we might want to move
      // to a DOM structure where each modal dialog shares the same overlay.
      $("#confirm-dialog .thimble-modal-menu").slideUp(function() {
        $(this).show();
        $("#confirm-dialog").hide();
        // suppress publish dialog if an error occurred
        if ($("#error-dialog:hidden").length !== 0) {
          $("#publish-dialog").show();
          $("#publish-dialog .thimble-modal-menu").hide().slideDown();
        }
      });
    });
    
    return {};
  };
});
