"use strict";

function ShareUI(options) {
  var codeMirror = options.codeMirror;
  var dialog = options.dialog;
  var publisher = options.publisher;
  var socialMedia = options.socialMedia;

  var self = {
    shareCode: function() {
      dialog.show();
      select.call(dialog.find('a.link')[0]);
      $("#modal-source-code").text(codeMirror.getValue());
      PublishUI({
        codeMirror: codeMirror,
        publisher: publisher,
        dialog: $("#quick-save")
      }).saveCode(function(viewURL,remixURL) {
        $("#share-container a.mailto").attr('href', 'mailto:?subject=Check out the page I just remixed!?body=You can check it out here: '+viewURL);
      });
    }
  };

  function select() {
    var target = $(this).attr("data-id");
    var content = dialog.find(".modal-selection." + target);
    dialog.find('#share-buttons a').removeClass("selected");
    dialog.find(".modal-selection").removeClass("selected");
    $(this).addClass("selected");
    content.addClass("selected");
    
    // immediately hotload social media, where applicable
    if (!content.hasClass("hotloaded") && target.indexOf("-widget") > -1) {
      target = target.replace("-widget",'');
      if (socialMedia[target]) {
        socialMedia.hotLoad($, content.find(".content-box"), socialMedia[target]);
      }
      content.addClass("hotloaded");
    }
  }

  // clicking the "close" button
  dialog.find('.close-icon').click(function(){ dialog.hide(); });

  // content "tabs"
  dialog.find('#share-buttons a').mouseover(select).click(function() {
    // prevent links from being resolved, since the
    // <a> elements have no href content
    return false;
  });
  
  return self;
}