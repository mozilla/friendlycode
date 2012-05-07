module("Publish");

test("fixDoctypeHeadBodyMunging() works", function() {
  var pre = $("#pre-publish").text();
  var post = $("#post-publish").text();
  equal(fixDoctypeHeadBodyMunging(post), pre);
});

test("fixDoctypeHeadBodyMunging() ignores non-munged strings", function() {
  var html = '<!DOCTYPE html><html><head></head><body>hi</body></html>';
  equal(fixDoctypeHeadBodyMunging(html), html);
});
