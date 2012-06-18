require(["lscache"], function(lscache) {
  module("app");

  function appTest(name, cb) {
    var iframe = $('<iframe src="index.html?notypekit=1"></iframe>');
    iframe.css({
      visibility: "hidden",
      width: "800px",
      height: "600px"
    });

    asyncTest(name, function() {
      lscache.flush();
      iframe.appendTo("body").load(function() {
        var wind = iframe.contents()[0].defaultView;
        wind.require(["main"], function(main) {
          main.ready.done(function() {
            cb(wind, function() {
              iframe.remove();
              start();
            });
          });
        });
      });
    });
  }
  
  appTest("navbar shows page title", function(window, start) {
    var cm = window.require("main").codeMirror;
    cm.setValue("<title>supdog</title>");
    cm.reparse();
    equal(window.$("#nav-options .preview-title").text(), "supdog",
          "navbar preview title is 'supdog'");
    start();
  });
  
  appTest("publish works", function(window, start) {
    var $ = window.jQuery;
    var publishURL = $('meta[name="publish-url"]').attr("content");
    var url = window.location.href;
    
    // Inject a fake ajax transport handler so we get called instead
    // of a real Ajax request being made to the publishing server.
    $.ajaxTransport("+*", function(options, originalOptions, jqXHR) {
      return {
        send: function(headers, completeCallback) {
          equal(originalOptions.type, "POST", "request is POST");
          equal(originalOptions.url, publishURL + "/api/page",
                "request URL is correct");
          equal(originalOptions.dataType, "text",
                "expected response type is text");
          equal(originalOptions.data.html, "<p>hi</p>",
                "editor HTML is submitted in POST data");
          completeCallback(200, "OK", {
            text: "/lol"
          });
          var viewURL = publishURL + "/lol";
          var view = $("#publication-result .view");
          var remix = $("#remix-it .remix");
          equal(view.text(), viewURL, "view URL text is " + viewURL);
          equal(view.attr("href"), viewURL, "view URL href is " + viewURL);
          ok(remix.text().indexOf("/lol") != -1,
             "remix URL text contains '/lol'");
          ok(remix.attr("href").indexOf("/lol") != -1,
            "remix URL href contains '/lol'");
          ok(window.location.href != url &&
             window.location.href.indexOf("/lol") != -1,
             "editor URL is different from before and contains '/lol'");
          start();
        }
      };
    });

    window.require("main").codeMirror.setValue("<p>hi</p>");
    $("#publish").click();
    $("#confirm-publication").click();
  });
});
