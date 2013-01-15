[![Build Status](https://travis-ci.org/toolness/friendlycode.png?branch=i18n)](http://travis-ci.org/toolness/friendlycode)

This is a friendly HTML editor that uses [slowparse][] and [hacktionary][]
to provide ultra-friendly real-time help to novice webmakers.

## Prerequisites

Using Friendlycode doesn't actually require anything other than a
static file server like Apache. However, if you want to generate optimized
builds and run the test suites, you'll need node, npm, and phantomjs.

## Quick Start

```bash
git clone --recursive git://github.com/toolness/friendlycode.git
cd friendlycode
git checkout i18n
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

  [slowparse]: https://github.com/toolness/slowparse
  [hacktionary]: https://github.com/toolness/hacktionary
  [CodeMirror]: http://codemirror.net/
