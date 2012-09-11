define(function(require) {
  var BackboneEvents = require("backbone-events"),
      BrowserIDCORS = require("./gb/browserid-cors"),
      Badges = require("./gb/badges"),
      checkLogin = require("./gb/check-login"),
      nullCb = function() {};
  
  return function Gapingbadger(options) {
    if (typeof(options) == "string")
      options = {baseURL: options};
    
    var bic = BrowserIDCORS({
      baseURL: options.baseURL,
      cacheKey: 'gapingbadger_' + options.baseURL
    });
    var badges = Badges(bic);
    var badgesRead = 0;
    var self = {
      baseURL: options.baseURL,
      email: null,
      unreadBadges: 0,
      badges: []
    };

    if (bic.isLoggedIn())
      self.email = bic.getLoginInfo().email;

    function updateUnreadBadges() {
      var count = 0;
      for (var i = 0; i < self.badges.length; i++) {
        if (self.badges[i].id > badgesRead)
          count++;
      }
      if (count != self.unreadBadges) {
        self.unreadBadges = count;
        self.triggerChange('unreadBadges');
      }
    }
    
    function onBadgesChanged() {
      updateUnreadBadges();
      self.triggerChange('badges');
    }
    
    self.getAssertionURLs = function(badgeList) {
      if (!badgeList)
        badgeList = self.badges;
      return badgeList.map(function(badge) {
        return self.baseURL + "/badges/" + badge.id;
      });
    };
    
    self.markAllBadgesRead = function() {
      var maxId = 0;
      if (self.badges.length)
        maxId = self.badges[self.badges.length-1].id;
      badgesRead = maxId;
      badges.setBadgesRead(badgesRead);
      updateUnreadBadges();
    };
    
    self.fetch = function(cb) {
      function error(msg, req) {
        self.trigger('error', msg + ' - status: ' + req.status);
        cb(req);
      }
      
      cb = cb || nullCb;
      badges.getBadgesRead(function(err, maxId) {
        if (err)
          return error('badges.getBadgesRead() failed', err);
        badgesRead = maxId;
        updateUnreadBadges();
        badges.fetch(function(err, badgeList) {
          var badgesChanged = false;
          if (err)
            return error('badges.fetch() failed', err);
          if (badgeList.length == self.badges.length) {
            for (var i = 0; i < badgeList.length; i++)
              if (badgeList[i].id != self.badges[i].id) {
                badgesChanged = true;
                break;
              }
          } else
            badgesChanged = true;
          if (badgesChanged) {
            self.badges = badgeList;
            setTimeout(onBadgesChanged, 0);
          }
          cb(null, self.badges);
        });
      });
    }
    
    self.triggerChange = function() {
      self.trigger('change');
      for (var i = 0; i < arguments.length; i++)
        self.trigger('change:' + arguments[i]);
    };
    
    self.logout = function() {
      self.email = null;
      if (self.badges.length) {
        self.badges.splice(0);
        onBadgesChanged();
      }
      bic.logout();
    };
    
    self.checkLogin = function(options) {
      checkLogin({
        browserIDCORS: bic,
        authenticate: options.authenticate,
        success: function() {
          self.email = bic.getLoginInfo().email;
          options.success();
        },
        error: function(req) {
          self.trigger('error', 'error authenticating: ' + req.status);
        }
      });
    };
    
    self.disown = function(badgeAssertion, cb) {
      cb = cb || nullCb;
      badges.disown(badgeAssertion, function(err) {
        if (err) return cb(err);
        var index = self.badges.indexOf(badgeAssertion);
        if (index != -1) {
          self.badges.splice(index, 1);
          onBadgesChanged();
        }
        cb(null);
      });
    };
    
    self.has = function(badgeAssertion) {
      if (!badgeAssertion.badge)
        /* We were passed a badge 'class' instead of a badge 'instance',
         * so we'll 'instantiate' it. */
        badgeAssertion = {badge: badgeAssertion};
      for (var i = 0; i < self.badges.length; i++)
        if (self.badges[i].badge.criteria == badgeAssertion.badge.criteria)
          return true;
      return false;
    };

    self.awardUnique = function(badgeAssertion, cb) {
      cb = cb || nullCb;
      if (self.has(badgeAssertion))
        return cb(null, null);
      return self.award(badgeAssertion, cb);
    };

    self.award = function(badgeAssertion, cb) {
      if (!badgeAssertion.badge)
        /* We were passed a badge 'class' instead of a badge 'instance',
         * so we'll 'instantiate' it. */
        badgeAssertion = {badge: badgeAssertion};
      if (!badgeAssertion.badge.version)
        badgeAssertion.badge.version = "0.5.0";
      if (!badgeAssertion.badge.issuer)
        badgeAssertion.badge.issuer = {};
      badgeAssertion.badge.issuer.origin = self.baseURL;
      badgeAssertion.badge.issuer.name = "Gapingbadger";
      cb = cb || nullCb;
      badges.award(badgeAssertion, function(err, badge) {
        if (err) {
          self.trigger('error', 'error awarding badge: ' + req.status);
          return cb(req);
        }
        self.badges.push(badge);
        onBadgesChanged();
        self.trigger('award', badge);
        cb(null, badge);
      });
    };
    
    BackboneEvents.mixin(self);
    return self;
  };
});
