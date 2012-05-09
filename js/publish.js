// This class is responsible for the UI behind saving and loading published
// code.
function PublishUI(options) {
  var baseRemixURL = options.remixURL || $('<a href="."></a>')[0].href;
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
          alert('Sorry, an error occurred while trying to get the page. :(');
        else {
          codeMirror.setValue(data);
          currURL = url;
        }
        cb();
      });
    },
    saveCode: function(callback) {
      dlg.show();
      $(".done", dlg).hide();
      publisher.saveCode(codeMirror.getValue(), currURL, function(err, info) {
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
}

// This class is responsible for communicating with a publishing server
// to save and load published code.
function Publisher(baseURL) {
  return {
    loadCode: function(path, cb) {
      var url = baseURL + path;
      jQuery.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        dataType: 'text',
        error: function() {
          cb("ERROR");
        },
        success: function(data) {
          cb(null, fixDoctypeHeadBodyMunging(data), url);
        }
      });
    },
    saveCode: function(data, originalURL, cb) {
      $.ajax({
        type: 'POST',
        url: baseURL + '/api/page',
        crossDomain: true,
        data: {
          'html': data,
          'original-url': originalURL || ''
        },
        dataType: 'text',
        error: function() {
          cb("ERROR");
        },
        success: function(data) {
          cb(null, {path: data, url: baseURL + data});
        }
      });
    }
  };
}

// This is a fix for https://github.com/mozilla/webpagemaker/issues/20.
function fixDoctypeHeadBodyMunging(html) {
  var lines = html.split('\n');
  if (lines.length > 2 &&
      lines[0] == '<!DOCTYPE html><html><head>' &&
      lines[lines.length-1] == '</body></html>') {
    return '<!DOCTYPE html>\n<html>\n  <head>\n' +
           lines.slice(1, -1).join('\n') + '</body>\n</html>';
  }
  return html;
}
