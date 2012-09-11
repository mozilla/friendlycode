(function(define, default_$, default_lscache) {
  var BrowserIDCORS = function BrowserIDCORS(options) {
    var $ = options.$ || default_$,
        lscache = options.lscache || default_lscache,
        navigator = options.navigator || window.navigator,
        loginDuration = options.loginDuration || 60*60*24*7,
        cacheKey = options.cacheKey || "browserid-login-info",
        baseURL = options.baseURL,
        loginInfo = lscache.get(cacheKey),
        self = {};

    self.baseURL = options.baseURL;
    self.getLoginInfo = function() {
      return JSON.parse(JSON.stringify(loginInfo));
    };
    
    self.isLoggedIn = function() {
      return !!loginInfo;
    };

    self.ajax = function(options) {
      var req;
      
      if (loginInfo) {
        options.headers = options.headers || {};
        options.headers['X-Access-Token'] = loginInfo.accessToken;
      }
      if (options.url.charAt(0) == '/')
        options.url = baseURL + options.url;
      req = $.ajax(options);
      req.error(function() {
        if (req.status == 403)
          // Stale token?
          self.logout();
      });
      return req;
    };
    
    self.logout = function() {
      lscache.remove(cacheKey);
      loginInfo = null;
    };
    
    self.processAssertion = function(assertion, cb) {
      if (typeof(cb) != 'function')
        cb = null;
      $.ajax({
        type: 'POST',
        url: baseURL + "/token",
        data: {
          assertion: assertion
        },
        error: function(req) {
          if (cb)
            cb(req);
        },
        success: function(info) {
          // Odd, some browsers seem to automatically decode the JSON
          // while others don't...
          if (typeof(info) == "string")
            info = JSON.parse(info);
          loginInfo = info;
          lscache.set(cacheKey, loginInfo, loginDuration);
          console.log(" -> " + JSON.stringify(loginInfo));
          if (cb)
            cb(null, loginInfo);
        }
      });
    };
    
    self.login = function(cb) {
      navigator.id.get(function(assertion) {
        self.processAssertion(assertion, cb);
      });
    };
    
    return self;
  }

  if (define)
    define(["jquery", "lscache"], function($, lscache) {
      default_$ = $;
      default_lscache = lscache;
      return BrowserIDCORS;
    });
  else
    window.BrowserIDCORS = BrowserIDCORS;
})(window.define, window.$, window.lscache);
