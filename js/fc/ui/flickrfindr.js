"use strict";

/**
 * Flickr searching of CC-at(-sa/-nc/-nd) photo content.
 */
define(["jquery"], function(jQuery) {

  return function FlickrFindr(options, undef)
  {
    var $ = jQuery,
        api_key = options.api_key,
        template = $(options.template())[0],
        api_location = "http://api.flickr.com/services/rest/?",
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
      
      // template to use for the HTML side of things
      template: template,
      
      // callback function
      callback: false,
      
      /**
       * set callback function
       */
      setCallback: function(callback) {
        this.callback = callback;
      }
      
      /**
       * initiate a search
       */
      find: function(term) {
        self.searchTerm = term;
        self.search = self.url + "&tags=" + self.searchTerm;
        if(self.xhr) { self.xhr.abort(); }
        self.getMoreResults();
      },

      /**
       * get the next page of results
       */
      getMoreResults: function() {
        self.lastCount = self.entries.length;
        self.loaded = false;
        self.page += 1;
        self.request(self.search + "&page=" + self.page);
      },

      /**
       * The search request XHR
       */
      request: function(url) {
        $.support.cors = true;
        self.xhr = $.ajax(url, {complete: self.onRetrieved} );
      },

      /**
       * what to do with the search results once we get them
       */
      onRetrieved: function(jqXhr, textStatus) {
        if (textStatus !== "success") {
          return;
        }

        var xml = jqXhr.responseXML,
            results = xml.getElementsByTagName("photo"),
            result, url, farm, server, owner, id, secret, title,
            i, last = results.length, img, entry,
            url_b, url_m, url_s;
        
        // note how many results we can find for this query
        self.pages = xml.getElementsByTagName("photos")[0].getAttribute("pages");
        
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
          self.entries.push(entry);
        }

        // done. loaded can be set to true again
        self.loaded = true;
        if (self.callback !== false) {
          self.callback(self);
        }
      },
    };
    
    // add template interacing

    (function($, self, template){
      self.moreOnScroll = true;

      var input = $("input.tags", template),
          span = $("span", template);

      var getMoreResults = function() {
        if(!self.moreOnScroll) return;
        var object = $("div.images img", template).last()[0],
            oRect = object.getBoundingClientRect(),
            pRect = $("div.images", template)[0].getBoundingClientRect();
        if (oRect.top <= pRect.bottom) {
          self.moreOnScroll = false;
          self.getMoreResults();
        }
      };

      var find = function(term) {
        var contentPane = $("div.images", template);
        contentPane.text("");
        contentPane.scroll(getMoreResults);
        self.find(term);
      };

      input.keyup(function() { find(this.value); });

      span.click(function() {
        var dialog = this.parentNode.parentNode,
            topOwner = dialog.parentNode;
        topOwner.removeChild(dialog.previousSibling);
        topOwner.removeChild(dialog);
      });

      span.css("cursor","pointer");
    }($, self, template));
      
    // return the finder
    return self;
  };
});