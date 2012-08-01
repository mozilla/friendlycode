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
      }
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
