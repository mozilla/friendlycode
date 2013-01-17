[![Build Status](https://travis-ci.org/mozilla/friendlycode.png?branch=gh-pages)](http://travis-ci.org/mozilla/friendlycode)

This is a friendly HTML editor that uses [slowparse][] and [hacktionary][]
to provide ultra-friendly real-time help to novice webmakers.

## Prerequisites

Using Friendlycode doesn't actually require anything other than a
static file server like Apache. However, if you want to generate optimized
builds and run the test suites, you'll need node 0.8+, npm 1.1+, and
phantomjs 1.7+.

## Quick Start

```bash
git clone --recursive git://github.com/mozilla/friendlycode.git
cd friendlycode
npm install
npm test
```

To run a simple built-in static file server from the repository's
root directory, run:

```bash
node bin/server.js
```

## Examples

You can see a trivial embedding at:

    http://localhost:8005/examples/bare.html

By default, friendlycode doesn't allow JS. An example of an
embedding that allows JS and publishes using an alternate API is
here:

    http://localhost:8005/examples/alternate-publisher.html

## Localization

Before localizing, please read the [requirejs i18n bundle][i18n] 
documentation.

To create a localization, first run `node bin/build-i18n.js list`
to display a list of i18n bundle modules that can be localized. You'll
need to localize all of these to create a complete localization, but
anything you don't localize will just fall-back to English.

Suppose you decide you want to localize the `fc/nls/ui` module to `fr-fr`.
Just do the following:

1. Create the `js/fc/nls/fr-fr` directory if it doesn't already exist.
2. Run `node bin/build-i18n.js template fc/nls/ui > js/fc/nls/fr-fr/ui.js`.
3. Localize the strings in `js/fc/nls/fr-fr/ui.js`.
4. Edit `js/fc/nls/ui.js` and add `"fr-fr": true` to the object being returned
   by the module.

You can test out your localization by setting your browser's language
preference to `fr-fr` and then loading any embedding of your repository's
friendlycode widget in your browser.

## Updating CodeMirror

In the `codemirror2` directory is a mini-distribution of [CodeMirror][]
which contains only the files necessary for HTML editing. It can be updated
with the following Python script, if it is run from the root directory
of the repository and the value of `NEW_CODEMIRROR_PATH` is changed:

```python
import os

NEW_CODEMIRROR_PATH = "/path/to/new/codemirror/version"
OUR_CODEMIRROR_PATH = os.path.abspath("codemirror2")

for dirpath, dirnames, filenames in os.walk(OUR_CODEMIRROR_PATH):
    for filename in filenames:
        ourpath = os.path.join(dirpath, filename)
        relpath = os.path.relpath(ourpath, OUR_CODEMIRROR_PATH)
        newpath = os.path.join(NEW_CODEMIRROR_PATH, relpath)
        if os.path.exists(newpath):
            print "copying %s" % newpath
            open(ourpath, "wb").write(open(newpath, "rb").read())
```

  [i18n]: http://requirejs.org/docs/api.html#i18n
  [slowparse]: https://github.com/mozilla/slowparse
  [hacktionary]: https://github.com/toolness/hacktionary
  [CodeMirror]: http://codemirror.net/
