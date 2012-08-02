(function(define) {
  function GitBrowserIDCORS(browserIDCORS) {
    var self = {
      url: function(path) {
        if (path.charAt(0) != '/')
          throw new Error("path does not start with /");
        return browserIDCORS.baseURL + '/static' + path;
      },
      path: function(url) {
        var prefix = browserIDCORS.baseURL + '/static';
        if (url.indexOf(prefix) != 0)
          throw new Error("URL does not start with " + prefix);
        return url.slice(prefix.length);
      },
      get: function(path, cb) {
        browserIDCORS.ajax({
          type: 'GET',
          url: self.url(path),
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
            cb(null, data);
          }
        });
      },
      commit: function(info, cb) {
        browserIDCORS.ajax({
          type: 'POST',
          url: '/commit',
          contentType: 'application/json',
          data: JSON.stringify(info),
          success: function() {
            console.log("commit successful");
            cb(null);
          },
          error: function(req) {
            if (req.responseText.indexOf("nothing to commit") != -1)
              return cb(null);
            console.log("commit failed: " + req.responseText);
            cb(req);
          }
        });
      },
      commitFileObjects: (function() {
        function commitFiles(base64Files, message, cb) {
          var filesToAdd = {};
          Object.keys(base64Files).forEach(function(path) {
            filesToAdd[path] = {
              encoding: 'base64',
              data: base64Files[path]
            };
          });
          self.commit({
            add: filesToAdd,
            message: message
          }, cb);
        }
        
        function readFileAsBase64(file, cb) {
          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = function() {
            var dataPrefix = 'data:' + file.type + ";base64,";
            var content = reader.result.slice(dataPrefix.length);
            if (reader.result && reader.result.indexOf(dataPrefix) == 0)
              cb(null, content);
            else
              cb("could not get base64 encoding of " + file.name);
          };
        }
        
        return function commitFileObjects(files, message, cb) {
          var filesToRead = {},
              filesLeft = Object.keys(files).length,
              isAborted = false;
          
          Object.keys(files).forEach(function(path) {
            readFileAsBase64(files[path], function(err, content) {
              if (isAborted)
                return;
              if (err) {
                isAborted = true;
                return cb({responseText: err});
              }
              filesToRead[path] = content;
              if (--filesLeft == 0)
                commitFiles(filesToRead, message, cb);
            });
          });
        };
      })()
    };
    
    Object.keys(browserIDCORS).forEach(function(prop) {
      if (!(prop in self))
        self[prop] = browserIDCORS[prop];
    });

    return self;
  }
  
  if (define)
    define(function() { return GitBrowserIDCORS; });
  else
    window.GitBrowserIDCORS = GitBrowserIDCORS;
})(window.define);
