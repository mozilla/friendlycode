"use strict";

// This class is responsible for communicating with a publishing server
// to save and load published code.
define(["jquery"], function($) {
  function Publisher(git) {
    return {
      baseURL: git.baseURL,
      loadCode: function(path, cb) {
        var originalURL = git.url(path);
        git.get(path, function(err, data) {
          if (err) {
            if (err.status == 404) {
              $.get('default-content.html', function(html) {
                cb(null, html, originalURL);
              });
            } else
              cb(err);
          } else {
            cb(null, fixDoctypeHeadBodyMunging(data), originalURL);
          }
        });
      },
      saveCode: function(data, originalURL, cb) {
        function commit(err) {
          if (err) return cb(err);
          git.commit(info, function(err) {
            cb(err, {path: path, url: git.url(path)});
          });
        }
        
        var path = git.path(originalURL);
        var info = {
          add: {},
          message: "User edited code in Thimble."
        };
        info.add[path.slice(1)] = data;
        
        if (!git.isLoggedIn())
          git.login(commit);
        else
          commit();
        
        console.log("orig", originalURL, path);
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
