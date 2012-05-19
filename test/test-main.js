require([
  "./test-help",
  "./test-indexable-codemirror",
  "./test-parsing-codemirror",
  "./test-mark-tracker",
  "./test-live-preview",
  "./test-publisher"
], function() {
  if (QUnit.config.blocking)
    QUnit.config.autostart = true;
  else
    QUnit.start();
});
