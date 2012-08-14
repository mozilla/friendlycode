define(function(require) {
  return function Editor(options) {
    var self = {},
        hintsCheckbox = options.hintsCheckbox,
        div = options.container,
        $ = require("jquery"),
        Slowparse = require("slowparse/slowparse"),
        TreeInspectors = require("slowparse/tree-inspectors"),
        ParsingCodeMirror = require("fc/ui/parsing-codemirror"),
        Help = require("fc/help"),
        LivePreview = require("fc/ui/live-preview"),
        ErrorHelp = require("fc/ui/error-help"),
        ContextSensitiveHelp = require("fc/ui/context-sensitive-help"),
        PreviewToEditorMapping = require("fc/ui/preview-to-editor-mapping"),
        Relocator = require("fc/ui/relocator"),
        HelpMsgTemplate = require("template!help-msg"),
        ErrorMsgTemplate = require("template!error-msg"),
        sourceCode = $('<div class="source-code"></div>').appendTo(div),
        previewArea = $('<div class="preview-holder"></div>').appendTo(div),
        helpArea = $('<div class="help hidden"></div>').appendTo(div),
        errorArea =  $('<div class="error hidden"></div>').appendTo(div);
    
    var codeMirror = self.codeMirror = ParsingCodeMirror(sourceCode[0], {
      mode: "text/html",
      theme: "jsbin",
      tabMode: "indent",
      lineWrapping: true,
      lineNumbers: true,
      parse: function(html) {
        return Slowparse.HTML(document, html, [TreeInspectors.forbidJS]);
      }
    });
    var relocator = Relocator(codeMirror);
    var cursorHelp = ContextSensitiveHelp({
      codeMirror: codeMirror,
      helpIndex: Help.Index(),
      template: HelpMsgTemplate,
      helpArea: helpArea,
      relocator: relocator,
      checkbox: hintsCheckbox
    });
    var errorHelp = ErrorHelp({
      codeMirror: codeMirror,
      template: ErrorMsgTemplate,
      errorArea: errorArea,
      relocator: relocator
    });
    var preview = self.preview = LivePreview({
      codeMirror: codeMirror,
      ignoreErrors: true,
      previewArea: previewArea
    });
    var previewToEditorMapping = PreviewToEditorMapping(preview);
    
    return self;
  };
});
