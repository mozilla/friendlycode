require([
  "test/test-help",
  "test/test-indexable-codemirror",
  "test/test-parsing-codemirror",
  "test/test-mark-tracker",
  "test/test-live-preview",
  "test/test-publisher"
], function() {
  if (QUnit.config.blocking)
    QUnit.config.autostart = true;
  else
    QUnit.start();
});
