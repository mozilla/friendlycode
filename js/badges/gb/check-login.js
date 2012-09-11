define(function() {
  function nullCb() {};
  
  return function checkLogin(options) {
    var browserIDCORS = options.browserIDCORS;
    var authenticate = options.authenticate || nullCb;
    var success = options.success || nullCb;
    var error = options.error || nullCb;
    
    function onAssertion(assertion) {
      if (assertion)
        browserIDCORS.processAssertion(assertion, function(err) {
          if (err)
            return error(req);
          success();
        });
    }
    
    browserIDCORS.ajax({
      url: "/blob",
      success: function(data) {
        success();
      },
      error: function(req) {
        if (req.status == 403)
          authenticate(onAssertion);
        else
          error(req);
      }
    });
  };
});
