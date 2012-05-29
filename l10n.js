/*  Copyright (c) 2011-2012 Fabien Cazenave, Mozilla.
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to
  * deal in the Software without restriction, including without limitation the
  * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
  * sell copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
  * IN THE SOFTWARE.
  */

'use strict';

document.webL10n = (function(window, document, undefined) {
  var gL10nData = {};
  var gTextData = '';
  var gLanguage = '';

  // parser

  function evalString(text) {
    return text.replace(/\\\\/g, '\\')
               .replace(/\\n/g, '\n')
               .replace(/\\r/g, '\r')
               .replace(/\\t/g, '\t')
               .replace(/\\b/g, '\b')
               .replace(/\\f/g, '\f')
               .replace(/\\{/g, '{')
               .replace(/\\}/g, '}')
               .replace(/\\"/g, '"')
               .replace(/\\'/g, "'");
  }

  function parseProperties(text, lang) {
    var reBlank = /^\s*|\s*$/;
    var reComment = /^\s*#|^\s*$/;
    var reSection = /^\s*\[(.*)\]\s*$/;
    var reImport = /^\s*@import\s+url\((.*)\)\s*$/i;

    // parse the *.properties file into an associative array
    var currentLang = '*';
    var supportedLang = [];
    var skipLang = false;
    var data = [];
    var match = '';
    var entries = text.replace(reBlank, '').split(/[\r\n]+/);
    for (var i = 0; i < entries.length; i++) {
      var line = entries[i];

      // comment or blank line?
      if (reComment.test(line))
        continue;

      // section start?
      if (reSection.test(line)) {
        match = reSection.exec(line);
        currentLang = match[1];
        skipLang = (currentLang != lang) && (currentLang != '*');
        continue;
      } else if (skipLang)
        continue;

      // @import rule?
      if (reImport.test(line)) {
        match = reImport.exec(line);
      }

      // key-value pair
      var tmp = line.split('=');
      if (tmp.length > 1)
        data[tmp[0]] = evalString(tmp[1]);
    }

    // find the attribute descriptions, if any
    for (var key in data) {
      var hasAttribute = false;
      var index = key.lastIndexOf('.');
      if (index > 0) {
        var attr = key.substr(index + 1);
        var elt = key.substring(0, index);
        hasAttribute = (elt in data);
      }
      if (hasAttribute) {
        if (typeof gL10nData[elt] === 'string') {
          gL10nData[elt] = {};
          gL10nData[elt].value = data[elt];
          gL10nData[elt].attributes = {};
        }
        gL10nData[elt].attributes[attr] = data[key];
      } else
        gL10nData[key] = data[key];
    }
  }

  function parse(text, lang) {
    gTextData += text;
    // we only support *.properties files at the moment
    return parseProperties(text, lang);
  }

  // load and parse the specified resource file
  function loadResource(href, lang, onSuccess, onFailure) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', href, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          parse(xhr.responseText, lang);
          if (onSuccess)
            onSuccess();
        } else {
          if (onFailure)
            onFailure();
        }
      }
    };
    xhr.send(null);
  }

  // load and parse all resources for the specified locale
  function loadLocale(lang, callback) {
    clear();

    // check all <link type="application/l10n" href="..." /> nodes
    // and load the resource files
    var langLinks = document.querySelectorAll('link[type="application/l10n"]');
    var langCount = langLinks.length;

    // start the callback when all resources are loaded
    var onResourceLoaded = null;
    var gResourceCount = 0;
    onResourceLoaded = function() {
      gResourceCount++;
      if (gResourceCount >= langCount) {
        // execute the [optional] callback
        if (callback)
          callback();
        // fire a 'localized' DOM event
        var evtObject = document.createEvent('Event');
        evtObject.initEvent('localized', false, false);
        evtObject.language = lang;
        window.dispatchEvent(evtObject);
      }
    }

    // load all resource files
    function l10nResourceLink(link) {
      var href = link.href;
      var type = link.type;
      this.load = function(lang, callback) {
        var applied = lang;
        loadResource(href, lang, callback, function() {
          console.warn(href + ' not found.');
          applied = '';
        });
        return applied; // return lang if found, an empty string if not found
      };
    }
    gLanguage = lang;
    for (var i = 0; i < langCount; i++) {
      var resource = new l10nResourceLink(langLinks[i]);
      var rv = resource.load(lang, onResourceLoaded);
      if (rv != lang) // lang not found, used default resource instead
        gLanguage = '';
    }
  }

  // replace {{arguments}} with their values
  function substArguments(str, args) {
    var reArgs = /\{\{\s*([a-zA-Z\.]+)\s*\}\}/;
    var match = reArgs.exec(str);
    while (match) {
      if (!match || match.length < 2)
        return str; // argument key not found

      var arg = match[1];
      var sub = '';
      if (arg in args) {
        sub = args[arg];
      }
      else if (arg in gL10nData) {
        sub = gL10nData[arg];
      }
      else {
        return str; // argument value not found
      }

      str = str.substring(0, match.index) + sub +
            str.substr(match.index + match[0].length);
      match = reArgs.exec(str);
    }
    return str;
  }

  // translate a string
  function translateString(key, args) {
    var str = gL10nData[key];
    if (!str)
      return '{{' + key + '}}';
    // key is found, get the raw string and look for {{arguments}}
    str = gL10nData[key].value || gL10nData[key];
    return substArguments(str, args);
  }

  // translate an HTML element
  function translateElement(element) {
    if (!element || !element.dataset)
      return;

    // translate the element
    var key = element.dataset.l10nId;
    var data = gL10nData[key];
    if (!data)
      return;

    // get arguments (if any)
    // TODO: implement a more flexible parser
    var args = {};
    if (element.dataset.l10nArgs) try {
      args = JSON.parse(element.dataset.l10nArgs);
    } catch (e) {}

    // element content
    var str = data.value || data;
    element.textContent = substArguments(str, args);

    // list of translatable attributes
    var attrList = ['title', 'accesskey', 'alt', 'longdesc'];
    var attrCount = attrList.length;

    // element attributes
    if (data.attributes) {
      for (var j = 0; j < attrCount; j++) {
        var attrName = attrList[j];
        var attrValue = substArguments(data.attributes[attrName], args);
        if (attrValue && element.hasAttribute(attrName))
          element.setAttribute(attrName, attrValue);
      }
    }
  }

  // translate an HTML subtree
  function translateFragment(element) {
    element = element || document.querySelector('html');

    // check all translatable children (= w/ a `data-l10n-id' attribute)
    var children = element.querySelectorAll('*[data-l10n-id]');
    var elementCount = children.length;
    for (var i = 0; i < elementCount; i++)
      translateElement(children[i]);

    // translate element itself if necessary
    if (element.dataset.l10nId)
      translateElement(element);
  }

  // clear all l10n data
  function clear() {
    gL10nData = {};
    gTextData = '';
    gLanguage = '';
  }

  // load the default locale on startup
  window.addEventListener('DOMContentLoaded', function() {
    if (navigator.mozSettings) {
      var req = navigator.mozSettings.get('language.current');
      req.onsuccess = function() {
        loadLocale(req.result.value, translateFragment);
      };
      req.onerror = function() {
        loadLocale(navigator.language, translateFragment);
      };
    }
    else {
      loadLocale(navigator.language, translateFragment);
    }
  });

  // Public API
  return {
    // get a localized string
    get: translateString,

    // debug
    get text() { return gTextData; },
    get data() { return gL10nData; },

    // get|set the document language and direction
    get language() { return {
      // get|set the document language (ISO-639-1)
      get name() { return gLanguage; },
      set name(lang) { loadLocale(lang, translateFragment); },

      // get the direction (ltr|rtl) of the current language
      get direction() {
        // http://www.w3.org/International/questions/qa-scripts
        // Arabic, Hebrew, Farsi, Pashto, Urdu
        var rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];
        return (rtlList.indexOf(gLanguage) >= 0) ? 'rtl' : 'ltr';
      }
    };}
  };
})(window, document);

// gettext-like shortcut for navigator.webL10n.get
if (window._ === undefined)
  var _ = document.webL10n.get;

