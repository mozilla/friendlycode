// Alternate publisher implementation that publishes to a hackpub
// endpoint. For more information, see:
// 
//   https://github.com/hackasaurus/hackpub
//
// Note also that the Amazon S3 bucket hackpub publishes to must
// be configured with a CORS configuration that allows for cross-origin
// GET requests, e.g.:
//
//   <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
//     <CORSRule>
//       <AllowedOrigin>*</AllowedOrigin>
//       <AllowedMethod>GET</AllowedMethod>
//     </CORSRule>
//   </CORSConfiguration>
 
define("hackpub", ["jquery"], function($) {
  return function Hackpub(options) {
    return {
      loadCode: function(path, cb) {
        var url = options.publishURL + path;
        $.ajax({
          type: "GET",
          url: url,
          dataType: 'text',
          error: function(req) {
            cb(req);
          },
          success: function(html) {
            cb(null, html, url);
          }
        });
      },
      saveCode: function(data, originalURL, cb) {
        $.ajax({
          type: "POST",
          url: options.hackpubURL + "/publish",
          data: {
            'html': data,
            'original-url': originalURL
          },
          dataType: 'json',
          error: function(req) {
            cb(req);
          },
          success: function(result) {
            var url = result['published-url'];
            var path = '/' + url.match(/\/([A-Za-z0-9]+)$/)[1];
            cb(null, {path: path, url: options.publishURL + path});
          }
        });
      }
    };
  };
});
