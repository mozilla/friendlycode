// This is just a convenience "wrapper" for the CodeMirror library
// which makes it more usable with RequireJS.
define([
  "order!../../codemirror2/lib/codemirror.js",
  "order!../../codemirror2/mode/xml/xml.js",
  "order!../../codemirror2/mode/javascript/javascript.js",
  "order!../../codemirror2/mode/css/css.js",
  "order!../../codemirror2/mode/htmlmixed/htmlmixed.js"
], function() {
  return CodeMirror;
});
