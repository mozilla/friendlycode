"use strict";

/**
 * Flickr searching of CC-at(-sa/-nc/-nd) photo content.
 */
define(["jquery"], function(jQuery) {
  return function FlickrFindr(api_key, callback, undef)
  {
    var api_location = "http://api.flickr.com/services/rest/?",
        constructed = api_location + "agent=flickrfindr" + "&api_key=" + api_key,
        addArgument = function(arg, val) { constructed += "&" + arg + "=" + val; };

    // set up search
    addArgument("method","flickr.photos.search");
    
    /**
      filter on license:

      0 = "All Rights Reserved" 
      1 = "Attribution-NonCommercial-ShareAlike License" 
      2 = "Attribution-NonCommercial License" 
      3 = "Attribution-NonCommercial-NoDerivs License" 
      4 = "Attribution License" 
      5 = "Attribution-ShareAlike License" 
      6 = "Attribution-NoDerivs License" 
      7 = "No known copyright restrictions" 
      8 = "United States Government Work" 
    **/
    addArgument("license","1,2,3,4,5,6");

    // force photos-only
    addArgument("content_type", "1");
    addArgument("media", "photos");
    
    /**
     * Create the finder object:
     */
    var self = {
      // the base URL
      url: constructed,
      
      // the search URL
      search: constructed,
      
      // our search request object reference
      xhr: undef,
      
      // result set size prior to getMoreResults calls
      lastCount: 0,

      // current result page
      page: 0,

      // total number of pages for the current search
      pages: -1,

      // all retrieved result entries so far
      entries: [],

      // indicates the retrieval status
      loaded: false,
      
      /**
       * initiate a search
       */
      find: function(term) {
        var $ = this;
        $.searchTerm = term;
        $.search = $.url + "&tags=" + $.searchTerm;
        if($.xhr) { $.xhr.abort(); }
        $.getMoreResults();
      },

      /**
       * get the next page of results
       */
      getMoreResults: function() {
        var $ = this;
        $.lastCount = $.entries.length;
        $.loaded = false;
        $.page += 1;
        $.request($.search + "&page=" + $.page);
      },

      /**
       * The search request XHR
       */
      request: function(url) {
        var $ = this;
        var completed = $.onRetrieved;
        jQuery.support.cors = true;
        $.xhr = jQuery.ajax(url, {complete: completed} );
      },

      /**
       * what to do with the search results once we get them
       */
      onRetrieved: function(jqXhr, textStatus) {
        if (textStatus !== "success") {
          return;
        }

        var $ = self,
            xml = jqXhr.responseXML,
            results = xml.getElementsByTagName("photo"),
            result, url, farm, server, owner, id, secret, title,
            i, last = results.length, img, entry,
            url_b, url_m, url_s;
        
        // note how many results we can find for this query
        $.pages = xml.getElementsByTagName("photos")[0].getAttribute("pages");
        
        // iterate over all photos in the retrieved page set
        for(i=0; i<last; i++) {
          result = results[i];
          farm   = result.getAttribute("farm");        
          server = result.getAttribute("server");
          owner  = result.getAttribute("owner");        
          id     = result.getAttribute("id");
          secret = result.getAttribute("secret");
          title  = result.getAttribute("title");

          // now we can construct the URL:
          url = "http://farm"+farm+".static.flickr.com/"+server+"/"+id+"_"+secret;
        
          // original, big and medium format
          url_b = url + "_b.jpg";
          url_m = url + "_m.jpg";
          url_s = url + "_s.jpg";

          // thumbnail image
          img = new Image();
          // link to original image
          img.alt = "http://flickr.com/" + owner + "/"+ id;
          // show thumbnail
          img.src = url_s;
          img.title = title + " - " + img.alt;

          // create an entry for this 
          entry = {
            img: img,
            href: img.alt,
            title: img.title,
            dataUrlB: url_b,
            dataUrlM: url_m,
            dataUrlS: url_s
          }

          // add this entry to the collection of found results
          $.entries.push(entry);
        }

        // done. loaded can be set to true again
        $.loaded = true;
        callback($);
      },
      
      moreOnScroll: true,
      
      /**
       * Temlate builder
       */
      buildTemplate: function() {
        var $ = this,
            template = jQuery("\
              <style>\
                #FlickrFindrPane {\
                  height: 500px;\
                  width: 500px;\
                  background-color: white;\
                  margin: auto;\
                  border: 6px solid #CCC;\
                  box-shadow: 8px 8px 12px 0px rgba(0, 0, 0, 0.5); \
                  border-radius: 7px;\
                }\
                #FlickrFindrPane span {\
                  text-align: right;\
                }\
                #FlickrFindrPane input.tags {\
                  width: 60%;\
                }\
                #FlickrFindrPane div.images {\
                  overflow: auto;\
                  height: 400px;\
                  width: 100%;\
                  text-align: center;\
                }\
                #FlickrFindrPane div.imgCode {\
                  margin: 5px;\
                  background-color: #DDD;\
                }\
                #FlickrFindrPane div.imgCode label {\
                  font-weight: bold;\
                  text-align: center;\
                }\
                #FlickrFindrPane div.imgCode div {\
                  color: #00C;\
                  font-family: monospace;\
                  font-size: 90%;\
                }\
              </style><div id='FlickrFindrPane'>\
                Search for pictures: <input class='tags' type='search' placeholder='by typing keywords here'>\
                <span>[close]</span>\
                <div class='images'>\
                  <!-- this will contain the list of found images -->\
                </div>\
                <div class='imgCode'>\
                  <label>HTML code for the selected image:</label>\
                  <!-- this will contain the html code for a selected image -->\
                  <div></div>\
                </div>\
              </div>"),
            input = jQuery("input.tags",template),
            span = jQuery("span",template),

            getMoreResults = function() {
              if(!$.moreOnScroll) return;
              var object = jQuery("#FlickrFindrPane div.images img").last()[0],
                  oRect = object.getBoundingClientRect(),
                  pRect = jQuery("#FlickrFindrPane div.images")[0].getBoundingClientRect();
              if (oRect.top <= pRect.bottom) { 
                $.moreOnScroll = false;
                $.getMoreResults();
              }
            },
   
            find = function(term) {
              var contentPane = jQuery("#FlickrFindrPane div.images");
              contentPane.text("");
              contentPane.scroll(getMoreResults);
              $.find(term);
            };

        input.keyup(function() { find(this.value); });
        span.click(function() {
          var doc = this.parentNode.parentNode;
          doc.removeChild(this.parentNode.previousSibling);
          doc.removeChild(this.parentNode);
        });
        span.css("cursor","pointer");
        return template;
      }
    };
    
    // return the finder
    return self;
  };
});