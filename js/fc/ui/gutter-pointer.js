define(["jquery"], function($) {
  return function gutterPointer(codeMirror, highlightClass) {
    function attrs(element, attributes) {
      for (var name in attributes)
        element.setAttribute(name, attributes[name].toString());
    }
    
    var wrapper = $(codeMirror.getWrapperElement());
    var highlight = $(".CodeMirror-gutter-text ." + highlightClass, wrapper);
    var SVG_NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(SVG_NS, "svg");
    var w = ($(".CodeMirror-gutter", wrapper).outerWidth() -
             highlight.width()) * 2;
    var h = highlight[0].getBoundingClientRect().height;
    var pos = highlight.position();
    
    pos.left += highlight.width();
    attrs(svg, {
      'class': "gutter-pointer " + highlightClass,
      viewBox: [0, 0, w, h].join(" ")
    });
    var pointer = document.createElementNS(SVG_NS, "polygon");
    attrs(pointer, {
      points: [
        "0,0",
        (w/2) + ",0",
        w + "," + (h/2),
        (w/2) + "," + h,
        "0," + h
      ].join(" ")
    });
    svg.appendChild(pointer);
    $(svg).css({
      width: w + "px",
      height: h + "px",
      top: pos.top + "px",
      left: pos.left + "px"
    });

    $(".CodeMirror-scroll", wrapper).append(svg);
    
    return $(svg);
  };
});
