// This class is responsible for publishing code and loading published
// code.
function Publisher(options) {
  var dlg = options.dialog;
  var baseURL = options.publishURL;
  var baseRemixURL = options.remixURL || $('<a href="."></a>')[0].href;
  var codeMirror = options.codeMirror;
  
  $(".close", dlg).click(function() {
    dlg.hide();
    return false;
  });
  
  return {
    loadCode: function(path) {
      codeMirror.setValue('');
      jQuery.ajax({
        type: 'GET',
        url: baseURL + path,
        crossDomain: true,
        dataType: 'text',
        error: function() {
          // TODO: Put nicer error here.
          alert('Sorry, an error occurred while trying to get the page. :(');
        },
        success: function(data) {
          codeMirror.setValue(data);
        }
      });
    },
    saveCode: function() {
      dlg.show();
      $(".done", dlg).hide();
      $.ajax({
        type: 'POST',
        url: baseURL + '/api/page',
        crossDomain: true,
        data: codeMirror.getValue(),
        dataType: 'text',
        error: function() {
          // TODO: Put nicer error here.
          alert("Sorry, an error occurred while trying to publish. :(");
          dlg.hide();
        },
        success: function(data) {
          var viewURL = baseURL + data;
          var remixURL = baseRemixURL + '?p=' + escape(data);
          $(".done", dlg).fadeIn();
          $('a.view', dlg).attr('href', viewURL).text(viewURL);
          $('a.remix', dlg).attr('href', remixURL).text(remixURL);
        }
      });
    }
  };
}
