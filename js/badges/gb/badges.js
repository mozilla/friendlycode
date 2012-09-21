define(function() {
  return function Badges(network) {
    var self = {};
    
    self.setBlob = function setBlob(obj) {
      network.ajax({
        type: 'PUT',
        url: "/blob",
        contentType: 'application/json',
        data: JSON.stringify(obj)
      });
    }

    self.getBlob = function getBlob(cb) {
      network.ajax({
        url: "/blob",
        success: function(data) {
          if (typeof(data) == "string")
            data = JSON.parse(data);
          cb(null, data);
        },
        error: function(req) {
          cb(req);
        }
      });
    }
    
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

    self.credit = function(name) {
      getBlob(function(err, data) {
        if (!err)
          data[name] = data[name] ? data[name]++ : 1;
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
