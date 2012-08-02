"use strict";

define(["jquery"], function($) {
  var ACCEPTED_FILE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml"
  ];
  
  function dirname(path) {
    if (path.charAt(0) != '/')
      throw new Error('path must be absolute');
    return path.split('/').slice(0, -1).join('/');
  }

  function upload(modals, git, filesToUpload, message, successCb) {
    var MIN_UPLOAD_TIME = 1000,
        startTime = Date.now();
    modals.showErrorDialog('Please wait', 'Uploading...');
    git.commitFileObjects(filesToUpload, message, function(err) {
      if (err)
        modals.showErrorDialog('An error occurred while uploading. ' +
                               err.responseText);
      else {
        setTimeout(function() {
          modals.hideErrorDialog();
          successCb();
        }, Math.max(MIN_UPLOAD_TIME - (Date.now() - startTime), 0));
      }
    });
  }
  
  function login(modals, git, successCb) {
    if (git.isLoggedIn())
      successCb();
    else {
      var loginElt = $(
        '<p>Please sign in to upload your files.</p>' +
        '<p><a href="#">' +
        '<img src="https://browserid.org/i/sign_in_blue.png">' +
        '</a></p>');
      $('a', loginElt).click(function() {
        modals.showErrorDialog('Please wait', 'Logging in...');
        git.login(function(err) {
          if (err)
            modals.showErrorDialog('An error occured while logging in.');
          else {
            modals.hideErrorDialog();
            successCb();
          }
        });
        return false;
      });
      modals.showErrorDialog('Login required', loginElt);
    }
  }
  
  function insertCodeLines(codeMirror, codeLines) {
    var codeString = codeLines.join('\n');
    var cursor = codeMirror.getCursor();
    var cursorIndex = codeMirror.indexFromPos(cursor);
    var endIndex = cursorIndex + codeString.length;
    codeMirror.replaceRange(codeString, cursor);
    codeMirror.focus();
    codeMirror.setSelection(cursor, codeMirror.posFromIndex(endIndex));
  }
  
  function DragUploader(options) {
    var codeMirror = options.codeMirror;
    var git = options.git;
    var modals = options.modals;
    var self = {};
    var dropZone = codeMirror.getWrapperElement();
    dropZone.addEventListener('dragover', function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }, true);
    dropZone.addEventListener('drop', function(evt) {      
      var code = [];
      var filesToUpload = {};
      var files = evt.dataTransfer.files; // FileList object.
      
      if (!self.basePath) {
        console.log("basePath not set, aborting");
        return;
      } else
        console.log("basePath is", self.basePath);

      var staticDir = (dirname(self.basePath) + '/static').slice(1);
      var filenames = [];
      for (var i = 0, f; f = files[i]; i++) {
        if (ACCEPTED_FILE_TYPES.indexOf(f.type) != -1) {
          filenames.push(f.name);
          filesToUpload[staticDir + '/' + f.name] = f;
          code.push('<img src="static/' + f.name + '">');
        } else
          console.log("cannot upload mime type: " + f.type);
      }
      
      var message = "files dropped into Thimble at " + staticDir + ": " +
                    filenames.join();
      
      if (code.length) {
        login(modals, git, function() {
          console.log("now uploading with message:", message);
          upload(modals, git, filesToUpload, message, function() {
            insertCodeLines(codeMirror, code);
          });
        });
        evt.stopPropagation();
        evt.preventDefault();
      }
      console.log("DROP");
    }, true);
    
    self.basePath = null;
    return self;
  }
  
  return DragUploader;
});
