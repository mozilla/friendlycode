define(function() {
  return function htmlToI18nBundle(html) {
    var result = {};
    var div = document.createElement('div');

    div.innerHTML = html;
    [].slice.call(div.querySelectorAll('.error-msg')).forEach(function(el) {
      var name = el.className.split(' ').slice(-1)[0];
      result[name] = el.innerHTML;
    });

    return result;
  };
});
