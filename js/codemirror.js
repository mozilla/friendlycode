// This is just a convenience "wrapper" for the CodeMirror library
// which makes it more usable with RequireJS.
define([
  // It looks like the order plugin bases relative URLs like a
  // script tag's "src" attribute does, rather than like RequireJS
  // does, which makes the path here a little unintuitive.
  "order!codemirror2/lib/codemirror.js",
  "order!codemirror2/mode/xml/xml.js",
  "order!codemirror2/mode/javascript/javascript.js",
  "order!codemirror2/mode/css/css.js",
  "order!codemirror2/mode/htmlmixed/htmlmixed.js"
], function() {
  return CodeMirror;
});
