"use strict";

define([
  "./social-media"
], function(SocialMedia) {
  function activateModalBehaviors(modals) {
    var hideModals = function() {
      modals.fadeOut();
    }

    /**
     * When someone clicks on the darkening-overlay, rather
     * than the modal dialog, close the modal dialog again.
     */
    modals.click(function(event) { 
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
    
    $("[data-close-modal]", modals).click(hideModals);
  }
  
  return function(options) {
    var codeMirror = options.codeMirror,
        publishUI = options.publishUI,
        publisher = options.publisher,
        baseRemixURL = options.remixURLTemplate,
        publishDialog = options.publishDialog,
        confirmDialog = options.confirmDialog,
        publishButton = options.publishButton,
        errorDialog = options.errorDialog,
        shareResult = $("#share-result", publishDialog),
        viewLink = $("a.view", publishDialog),
        remixLink = $("a.remix", publishDialog),
        accordions = $("div.accordion", publishDialog),
        origViewHTML = viewLink.html(),
        origRemixHTML = remixLink.html(),
        origShareHTML = $(".thimble-additionals", shareResult).html(),
        currURL = null,
        socialMedia = SocialMedia();

    var modals = publishDialog.add(confirmDialog).add(errorDialog);
    
    activateModalBehaviors(modals);
    
    // Add accordion behaviour to the publication dialog.
    accordions.click(function() {
      accordions.addClass("collapsed");
      $(this).removeClass("collapsed");
    });

    // If the editor has no content, disable the publish button.
    codeMirror.on("change", function() {
      var isEnabled = codeMirror.getValue().trim().length ? true : false;
      publishButton.toggleClass("enabled", isEnabled);
    });
    
    // If the user's code has errors, warn them before publishing.
    codeMirror.on("reparse", function(event) {
      var hasErrors = event.error ? true : false;
      confirmDialog.toggleClass("has-errors", hasErrors);
    });
    
    publishButton.click(function(){
      if ($(this).hasClass("enabled")) confirmDialog.fadeIn();
    });

    /**
     * Late-loading for social media.
     */
    shareResult.click(function() {
      // TODO: We should probably delay here if publishing is still
      // in-progress, since we don't yet have a URL to share!
      var mediaList = $("li", shareResult);
      var urlToShare = viewLink[0].href;
      mediaList.each(function() {
        var element = $(this),
             medium = element.attr("data-medium");
        if (!element.hasClass("hotloaded") && medium && socialMedia[medium]) {
          socialMedia.hotLoad(element[0], socialMedia[medium], urlToShare);
          element.addClass("hotloaded");
        }
      });
    });
    
    $("#confirm-publication", confirmDialog).click(function(){
      // Reset the publish modal.
      viewLink.html(origViewHTML);
      remixLink.html(origRemixHTML);
      $(".accordion", publishDialog).addClass("collapsed");
      $("#publication-result", publishDialog).removeClass("collapsed");
      $(".thimble-additionals", shareResult).html(origShareHTML);
      
      // Start the actual publishing process, so that hopefully by the
      // time the transition has finished, the user's page is published.
      var code = codeMirror.getValue();
      publisher.saveCode(code, currURL, function(err, info) {
        if (err) {
          var text = "Sorry, an error occurred while trying to publish. " +
                     err.responseText;
          $(".error-text", errorDialog).text(text);
          publishDialog.stop().hide();
          errorDialog.show();
        } else {
          var viewURL = info.url;
          var remixURL = baseRemixURL.replace("{{VIEW_URL}}",
                                              escape(info.path));
          viewLink.attr('href', viewURL).text(viewURL);
          remixLink.attr('href', remixURL).text(remixURL);

          // The user is now effectively remixing the page they just
          // published.
          currURL = viewURL;

          self.trigger("publish", {
            viewURL: viewURL,
            remixURL: remixURL,
            path: info.path
          });
        }
      });

      // We want the dialogs to transition while the page-sized translucent
      // overlay stays in place. Because each dialog has its own overlay,
      // however, this is a bit tricky. Eventually we might want to move
      // to a DOM structure where each modal dialog shares the same overlay.
      $(".thimble-modal-menu", confirmDialog).slideUp(function() {
        $(this).show();
        confirmDialog.hide();
        // suppress publish dialog if an error occurred
        if (errorDialog.filter(":hidden").length !== 0) {
          publishDialog.show();
          $(".thimble-modal-menu", publishDialog).hide().slideDown();
        }
      });
    });
    
    var self = {
      setCurrentURL: function(url) {
        currURL = url;
      }
    };
    
    _.extend(self, Backbone.Events);
    return self;
  };
});
