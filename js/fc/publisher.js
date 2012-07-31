"use strict";

// This class is responsible for communicating with a publishing server
// to save and load published code.
define(["jquery", "lscache"], function($, lscache) {
  var myOrigin = window.location.protocol + "//" + window.location.host;
  
  function Publisher(baseURL) {
    // We want to support CORS for development but in production it doesn't
    // matter because all requests will be same-origin. However, browsers
    // that don't support CORS will barf if they're given absolute URLs to
    // the same domain, so we want to return relative URLs in such cases.
    function makeURL(path) {
      if (baseURL == myOrigin)
        return path;
      path = baseURL + path;
      if (!$.support.cors && window.console)
        window.console.warn("No CORS detected for request to " + path);
      return path;
    }
    
    function commit(info, cb) {
      function save() {
        $.ajax({
          type: 'POST',
          url: baseURL + '/commit',
          headers: {
            'X-Access-Token': loginInfo.accessToken
          },
          contentType: 'application/json',
          data: JSON.stringify(info),
          success: function() {
            console.log("commit successful");
            cb(null);
          },
          error: function(req) {
            if (req.status == 403)
              // Stale token?
              lscache.remove("browserid-login-info");
            if (req.responseText.indexOf("nothing to commit") != -1)
              return cb(null);
            console.log("commit failed: " + req.responseText);
            cb(req);
          }
        });
      }
      
      var loginInfo = lscache.get("browserid-login-info");
      if (!loginInfo)
        navigator.id.get(function(assertion) {
          console.log("POST " + baseURL + "/token");
          $.post(baseURL + "/token", {
            assertion: assertion
          }, function(info) {
            // Odd, some browsers seem to automatically decode the JSON
            // while others don't...
            if (typeof(info) == "string")
              info = JSON.parse(info);
            loginInfo = info;
            lscache.set("browserid-login-info", loginInfo, 60*60*24*7);
            console.log(" -> " + JSON.stringify(loginInfo));
            save();
          });
        });
      else
        save();
    }

    return {
      baseURL: baseURL,
      loadCode: function(path, cb) {
        var originalURL = baseURL + '/static' + path;
        $.ajax({
          type: 'GET',
          url: makeURL('/static' + path),
          dataType: 'text',
          error: function(req) {
            if (req.status == 404) {
              $.get('default-content.html', function(html) {
                cb(null, html, originalURL);
              });
            } else
              cb(req);
          },
          success: function(data) {
            cb(null, fixDoctypeHeadBodyMunging(data), originalURL);
          }
        });
      },
      saveCode: function(data, originalURL, cb) {
        var path = originalURL.slice((baseURL + '/static/').length);
        var filesToAdd = {};
        filesToAdd[path] = data;
        commit({
          add: filesToAdd,
          message: "User edited code in Thimble."
        }, function(err) {
          cb(err, {path: '/' + path, url: baseURL + '/static/' + path});
        });
        console.log("orig", originalURL, path);
      },
      commit: commit
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
