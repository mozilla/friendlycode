// This class is responsible for the UI behind saving and loading published
// code.
function PublishUI(options) {
  var baseRemixURL = options.remixURL || $('<a href="."></a>')[0].href;
  var dlg = options.dialog;
  var codeMirror = options.codeMirror;
  var publisher = options.publisher;
  
  $(".close", dlg).click(function() {
    dlg.hide();
    return false;
  });

  return {
    loadCode: function(path, cb) {
      publisher.loadCode(path, function(err, data) {
        if (err)
          // TODO: Put nicer error here.
          alert('Sorry, an error occurred while trying to get the page. :(');
        else {
          codeMirror.setValue(data);
          codeMirror.reparse();
        }
        cb();
      });
    },
    saveCode: function() {
      dlg.show();
      $(".done", dlg).hide();
      publisher.saveCode(codeMirror.getValue(), function(err, info) {
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
      jQuery.ajax({
        type: 'GET',
        url: baseURL + path,
        crossDomain: true,
        dataType: 'text',
        error: function() {
          cb("ERROR");
        },
        success: function(data) {
          cb(null, data);
        }
      });
    },
    saveCode: function(data, cb) {
      $.ajax({
        type: 'POST',
        url: baseURL + '/api/page',
        crossDomain: true,
        data: data,
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
