"use strict";

// This class is responsible for communicating with a publishing server
// to save and load published code.
define(function() {
  function Publisher(baseURL) {
    return {
      baseURL: baseURL,
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
  
  // Exposing this for unit testing purposes only.
  Publisher._fixDoctypeHeadBodyMunging = fixDoctypeHeadBodyMunging;
  
  return Publisher;
});
