define(function() {
  return function Badges(network) {
    var self = {};

    self.getBadgesRead = function(cb) {
      network.ajax({
        url: "/blob",
        success: function(data) {
          if (typeof(data) == "string")
            data = JSON.parse(data);
          cb(null, data.badgesRead || 0);
        },
        error: function(req) {
          cb(req);
        }
      });
    };
    
    self.setBadgesRead = function(badgesRead) {
      network.ajax({
        type: 'PUT',
        url: "/blob",
        contentType: 'application/json',
        data: JSON.stringify({badgesRead: badgesRead})
      });
    };
    
    self.fetch = function(cb) {
      network.ajax({
        url: "/badges",
        success: function(data) {
          if (typeof(data) == "string")
            data = JSON.parse(data);
          cb(null, data);
        },
        error: function(req) {
          cb(req);
        }
      });
    };

    self.disown = function(badgeAssertion, cb) {
      network.ajax({
        type: "DELETE",
        url: "/badges/" + badgeAssertion.id,
        success: function() {
          cb(null);
        },
        error: function(req) {
          cb(req);
        },
      });
    };
    
    self.award = function(badgeAssertion, cb) {
      network.ajax({
        type: "POST",
        url: "/badges",
        contentType: 'application/json',
        data: JSON.stringify(badgeAssertion),
        success: function(data) {
          if (typeof(data) == 'string')
            data = JSON.parse(data);
          cb(null, data);
        },
        error: function(req) {
          cb(req);
        }
      });
    };
    
    return self;
  };
});
