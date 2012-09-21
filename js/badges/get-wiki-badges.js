define(["jquery"], function($) {
  return function getWikiBadges(options, cb) {
    if (typeof(options) == "string")
      options = {wikiPath: options};
    
    var wikiPath = options.wikiPath;
    var baseWikiURL = options.wikiURL || 'https://wiki.mozilla.org';
    var baseWikiProxyURL = options.wikiProxyURL ||
                           'http://labs.toolness.com:8291';
    var deferred = $.Deferred();
    
    jQuery.get(baseWikiProxyURL + wikiPath, function(html) {
      var badges = {};
      var div = $('<div></div>');
      div.html(html);
      div.find('> h2').each(function() {
        var id = $("> span", this).attr('id');
        var name = $(this).text().trim();
        var contents = $(this).nextUntil("h2");
        var img = contents.find("tr:first-child td img");
        var imgURL = baseWikiURL + img.attr('src');
        var criteriaURL = baseWikiURL + wikiPath + "#" + id;
        var description = contents.find("tr td p:first-child i").text();
        var behavior = contents.find(".behavior").text()
                       .replace(/ /g, '_').toUpperCase();
        var trigger = contents.find(".trigger").text();
        
        if (trigger == 'once')
          trigger = '1';
        badges[id.toUpperCase()] = {
          behavior: behavior,
          trigger: parseInt(trigger),
          name: name,
          image: imgURL,
          description: description,
          criteria: criteriaURL
        };
      });
      setTimeout(function() { deferred.resolve(badges); }, 0);
      if (cb)
        cb(badges);
    });
    return deferred;
  };
});
