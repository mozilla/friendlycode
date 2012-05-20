"use strict";

// This class is responsible for the UI behind saving and loading published
// code.
define(function() {
  return function PublishUI(options) {
    var defaultRemixURL = location.protocol + "//" + location.host + 
                          location.pathname;
    var baseRemixURL = options.remixURL || defaultRemixURL;
    var dlg = options.dialog;
    var codeMirror = options.codeMirror;
    var publisher = options.publisher;
    var currURL;

    dlg.find('.close-icon').click(function(){ dlg.hide(); });

    return {
      loadCode: function(path, cb) {
        publisher.loadCode(path, function(err, data, url) {
          if (err)
            // TODO: Put nicer error here.
            alert('Sorry, an error occurred while trying to get ' +
                  'the page. :(');
          else {
            codeMirror.setValue(data);
            currURL = url;
          }
          cb();
        });
      },
      saveCode: function(callback) {
        var code = codeMirror.getValue();
        dlg.show();
        $(".done", dlg).hide();
        publisher.saveCode(code, currURL, function(err, info) {
          if (err) {
            // TODO: Put nicer error here.
            alert("Sorry, an error occurred while trying to publish. :(");
            dlg.hide();
          } else {
            var viewURL = info.url;
            var remixURL = baseRemixURL + '?p=' + escape(info.path);
            $(".done", dlg).fadeIn();
            $('a.view', dlg).attr('href', viewURL).text(viewURL);
            $('a.remix', dlg).attr('href', remixURL).text(remixURL);
            if (callback) {
              callback(viewURL, remixURL);
            }
          }
        });
      }
    };
  };
});
