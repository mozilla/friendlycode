"use strict";

// This class is responsible for the UI behind saving and loading published
// code.
define(function() {
  return function PublishUI(options) {
    var defaultRemixURL = location.protocol + "//" + location.host + 
                          location.pathname + "#{{VIEW_URL}}";
    var baseRemixURL = options.remixURLTemplate || defaultRemixURL;
    var dlg = options.dialog;
    var codeMirror = options.codeMirror;
    var publisher = options.publisher;
    var currURL;

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
        publisher.saveCode(code, currURL, function(err, info) {
          if (err) {
            // TODO: Put nicer error here.
            alert("Sorry, an error occurred while trying to publish. :(");
            dlg.hide();
          } else {
            var viewURL = info.url;
            var remixURL = baseRemixURL.replace("{{VIEW_URL}}",
                                                escape(info.path));
            $('a.view', dlg).attr('href', viewURL).text(viewURL);
            $('a.remix', dlg).attr('href', remixURL).text(remixURL);

            // The user is now effectively remixing the page they just
            // published.
            currURL = viewURL;

            if (callback) {
              callback(viewURL, remixURL, info.path);
            }
          }
        });
      }
    };
  };
});
