/**
 * webpagemaker modal dialogs
 */
function bindModalJS() {
  // don't leak event handlers
  document.removeEventListener("DOMContentLoaded", bindModalJS, false);


  // persistent CSS selector - since we can only have one
  // modal dialog open at a time, we can entangle, although
  // an object wrapping rewrite might be cleaner.
  var defaultSelector = ".link-to-this";
  var selector = defaultSelector;
  var selectorImg = '';

  var selectItem = function(sel) {
    $(sel).show();
  };

  var unselectItem = function(sel) {
    $(sel).hide();
  };

  // show the modal dialog
  $("#share_button").click(function() {
    $('#share-dialog').show();
    selectItem(selector);
  });

  // clicking the "close" button
  $('.modal-box .close-icon').click(function(){
    unselectItem(selector);
    selector = defaultSelector;
    var shareDialog = this.parentNode.parentNode;
    $(shareDialog).hide();
  });

  // content "tabs"
  $('#share-buttons a').each(function() {
    var a = this;
    
    // mouseover content replacements
    $(a).mouseover(function() {
      if (selector !== '') {
        if (selectorImg !== '') {
          selectorImg.src = selectorImg.src.replace("/selected","");
        }
        unselectItem(selector);
      }
      selector = "." + a.id;
      selectItem(selector);

      selectorImg = $("img",$(a))[0];
      selectorImg.src = selectorImg.src.replace("chopped","chopped/selected");
    });

    // prevent links from being resolved, since the
    // <a> elements have no href content
    $(a).click(function() {
      return false; 
    });
  });
}

document.addEventListener("DOMContentLoaded", bindModalJS, false);