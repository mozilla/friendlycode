define(function() {
  return function CurrentPageManager(options) {
    var self = {},
        window = options.window,
        pageToLoad = options.currentPage,
        supportsPushState = window.history.pushState ? true : false;
    
    if (supportsPushState)
      window.history.replaceState({pageToLoad: pageToLoad}, "",
                                  location.href);
    
    // If a URL hash is specified, it should override anything provided by
    // a server.
    if (window.location.hash.slice(1))
      pageToLoad = window.location.hash.slice(1);
    
    window.addEventListener("hashchange", function(event) {
      // We don't currently support dynamically changing the URL
      // without a full page reload, unfortunately, so just trigger a
      // reload if the user clicked the 'back' button after we pushed
      // a new URL to it.
      var newPageToLoad = window.location.hash.slice(1);
      if (newPageToLoad != pageToLoad)
        window.location.reload();
    }, false);

    if (supportsPushState)
      window.addEventListener("popstate", function(event) {
        // We don't currently support dynamically changing the URL
        // without a full page reload, unfortunately, so just trigger a
        // reload if the user clicked the 'back' button after we pushed
        // a new URL to it.
        //
        // Also, for some reason Webkit is sending a spurious popstate with
        // state == null on page load, so we want to check that it's
        // non-null first (see #39).
        if (event.state && event.state.pageToLoad != pageToLoad)
          window.location.reload();
      }, false);
    
    self.currentPage = function() { return pageToLoad; };
    self.changePage = function(page, url) {
      pageToLoad = page;
      if (supportsPushState)
        window.history.pushState({pageToLoad: page}, "", url);
      else
        window.location.hash = "#" + page;
    };
    
    return self;
  };
});
