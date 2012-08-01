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
      function startUpload(filesToAdd) {
        function upload() {
          var MIN_UPLOAD_TIME = 1000,
              startTime = Date.now();

          modals.showErrorDialog('Please wait', 'Uploading...');
          git.commit({
            add: filesToAdd,
            message: "files uploaded via Thimble drag-and-drop"
          }, function(err) {
            if (err)
              modals.showErrorDialog('An error occurred while uploading. ' +
                                     err.responseText);
            else {
              setTimeout(function() {
                modals.hideErrorDialog();
                insertCode();
              }, Math.max(MIN_UPLOAD_TIME - (Date.now() - startTime), 0));
            }
          });
        }
        
        if (git.isLoggedIn())
          upload();
        else {
          var loginElt = $('<p>Please <a href="#">sign in</a> to upload' +
                           ' your files.</p>');
          $('a', loginElt).click(function() {
            modals.showErrorDialog('Please wait', 'Logging in...');
            git.login(function(err) {
              if (err)
                modals.showErrorDialog('An error occured while logging in.');
              else {
                modals.hideErrorDialog();
                upload();
              }
            });
            return false;
          });
          modals.showErrorDialog('Login required', loginElt);
        }
      }
      
      function fetch(file) {
        console.log("FILE", file, file.name, file.type);
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
          var dataPrefix = 'data:' + file.type + ";base64,";
          var content = reader.result.slice(dataPrefix.length);
          if (reader.result.indexOf(dataPrefix) == 0) {
            filesToUpload[file.name] = content;
            if (Object.keys(filesToUpload).length == code.length) {
              var filesToAdd = {};
              var staticDir = (dirname(self.basePath) + '/static').slice(1);
              Object.keys(filesToUpload).forEach(function(filename) {
                filesToAdd[staticDir + '/' + filename] = {
                  encoding: 'base64',
                  data: filesToUpload[filename]
                };
              });
              console.log("UPLOAD", filesToUpload, "to", staticDir);
              startUpload(filesToAdd);
            }
          }
        };
      }
      
      function insertCode() {
        var codeString = code.join('\n');
        var cursor = codeMirror.getCursor();
        var cursorIndex = codeMirror.indexFromPos(cursor);
        var endIndex = cursorIndex + codeString.length;
        codeMirror.replaceRange(codeString, cursor);
        codeMirror.focus();
        codeMirror.setSelection(cursor, codeMirror.posFromIndex(endIndex));
      }
      
      var code = [];
      var filesToUpload = {};
      var files = evt.dataTransfer.files; // FileList object.

      if (!self.basePath) {
        console.log("basePath not set, aborting");
        return;
      } else
        console.log("basePath is", self.basePath);
      
      // files is a FileList of File objects. List some properties.
      for (var i = 0, f; f = files[i]; i++) {
        if (ACCEPTED_FILE_TYPES.indexOf(f.type) != -1) {
          fetch(f);
          code.push('<img src="static/' + f.name + '">');
        } else
          console.log("cannot upload mime type: " + f.type);
      }
      if (code.length) {
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
