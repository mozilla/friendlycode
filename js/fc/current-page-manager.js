define(function() {
  return function CurrentPageManager(options) {
    var self = {},
        window = options.window,
        pageToLoad = options.currentPage,
        publishUI = options.publishUI,
        parachute = options.parachute,
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
    
    publishUI.on("publish", function(info) {
      // If the browser supports history.pushState, set the URL to
      // be the new URL to remix the page they just published, so they
      // can share/bookmark the URL and it'll be what they expect it
      // to be.
      pageToLoad = info.path;
      // If the user clicks their back button, we don't want to show
      // them the page they just published--we want to show them the
      // page the current page is based on.
      parachute.clearCurrentPage();
      parachute.changePage(pageToLoad);
      // It's possible that the server sanitized some stuff that the
      // user will be confused by, so save the new state of the page
      // to be what they expect it to be, just in case.
      parachute.save();
      if (supportsPushState)
        window.history.pushState({pageToLoad: pageToLoad}, "", info.remixURL);
      else
        window.location.hash = "#" + pageToLoad;
    });
    
    parachute.changePage(pageToLoad);
    
    self.currentPage = function() { return pageToLoad; };
    
    return self;
  };
});
