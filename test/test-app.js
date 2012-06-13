require([], function() {
  module("app");

  var iframe = $('<iframe src="index.html"></iframe>');
  iframe.css({visibility: "hidden"});
  
  asyncTest("navbar shows page title", function() {
    iframe.appendTo("body").load(function() {
      var wind = iframe.contents()[0].defaultView;
      wind.require(["main"], function(main) {
        main.ready.done(function() {
          main.codeMirror.setValue("<title>supdog</title>");
          main.codeMirror.reparse();
          equal(wind.$("#nav-options .preview-title").text(), "supdog");
          iframe.remove();
          start();
        });
      });
    });
  });
});
