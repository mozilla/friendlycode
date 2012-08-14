"use strict";

define("main", function(require) {
  var $ = require("jquery"),
      FriendlycodeEditor = require('friendlycode');

  require("typekit-ready!");

  $("html").addClass("deployment-type-" +
                     $("meta[name='deployment-type']").attr("content"));

  return FriendlycodeEditor({
    publishURL: $("meta[name='publish-url']").attr("content"),
    pageToLoad: $("meta[name='remix-url']").attr("content"),
    remixURLTemplate: location.protocol + "//" + location.host +
                      "{{VIEW_URL}}/edit",
    container: $("#thimble-friendlycode-holder")
  });
});

require(['main'], function () {});
