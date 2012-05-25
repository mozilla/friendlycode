"use strict";

// This class is responsible for the UI behind saving and loading published
// code.
define(function() {
  return function PublishUI(options) {
    var currentPage = options.currentPage;
    var dlg = options.dialog;
    var codeMirror = options.codeMirror;
    var publisher = options.publisher;

    dlg.find('.close-icon').click(function(){ dlg.hide(); });

    return {
      saveCode: function(callback) {
        var code = codeMirror.getValue();
        var absoluteURL = publisher.baseURL + currentPage.path;
        dlg.show();
        $(".done", dlg).hide();
        publisher.saveCode(code, absoluteURL, function(err, info) {
          if (err) {
            // TODO: Put nicer error here.
            alert("Sorry, an error occurred while trying to publish. :(");
            dlg.hide();
          } else {
            var viewURL = info.url;
            var remixURL = currentPage.remixURL(info.path);
            $(".done", dlg).fadeIn();
            $('a.view', dlg).attr('href', viewURL).text(viewURL);
            $('a.remix', dlg).attr('href', remixURL).text(remixURL);
            if (callback) {
              callback(viewURL, remixURL, info.path, code);
            }
          }
        });
      }
    };
  };
});
