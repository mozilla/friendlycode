module("Help");

test("Index() works", function() {
  var index = Help.Index();
  var html = '<p>he<br>llo</p>';
  var doc = Slowparse.HTML(document, html).document;

  index.build(doc, html);
  equal(index.get(3), undefined, "Index has no help for text nodes");
  ok(index.get(0).html.match(/paragraph/i),
     "Index contains HTML help from hacktionary");
  equal(index.get(0).url, Help.MDN_URLS.html + 'p',
        "Index contains MDN URL for HTML elements");
  deepEqual(index.get(0).highlights, [
    {
      "end": 3,
      "start": 0
    },
    {
      "end": 16,
      "start": 12
    }
  ], "Index contains accurate highlights for non-void HTML elements");
  deepEqual(index.get(5).highlights, [
    {
      "end": 9,
      "start": 5
    }
  ], "Index contains accurate highlights for void HTML elements");
});
