/**
 * A tiny library for load-loading social media share buttons.
 * If we don't do this, social media will track users even before
 * they click the like button and we don't like that kind of
 * monitoring behaviour.
 */
(function($){
    /**
     * The various social media all have the same API.
     */
    var socialMedia = {

        facebook: {
            class: "facebook",
            id: "facebook-jssdk",
            src: "http://connect.facebook.net/en_US/all.js#xfbml=1&appId=1",
            html: "<div id='fb-root'></div><div class='fb-like' data-send='false' data-show-faces='false' data-font='tahoma'></div>" },

        google: {
            class: "google",
            id: "google-plus",
            src: "https://apis.google.com/js/plusone.js",
            html: "<g:plusone annotation='none'></g:plusone>" },

        twitter: {
            class: "twitter",
            id: "twitter-wjs",
            src: "http://platform.twitter.com/widgets.js",
            html: "<a href='https://twitter.com/share' class='twitter-share-button' data-via='Mozilla' data-count='none'>Tweet</a>" }

    }
    
    /**
     * Hot-load a social medium's button by first
     * injecting the necessary HTML for the medium
     * to perform its own iframe replacements, and
     * then late-loading the script required for
     * the medium to load up its functionality.
     */
    var hotLoad = function(element, socialMedium) {
        element.innerHTML = socialMedium.html;
        (function(document, id, src) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.id = id;
            script.src = src;
            document.head.appendChild(script);
        }(document, socialMedium.id, socialMedium.src));
    }
    
    /**
     * This is a separate function because the
     * for/in loop is a weird JavaScript thing;
     * it does late variable binding, somehow,
     * so dynamic functions that involve "medium"
     * end up all being evaluated for the last
     * object in the socialMedia object. Effectively
     * it makes every button a twitter button.
     */
    var setupHotLoading = function($, parent, medium) {
        if (medium.src) {
            $("." + medium.class, parent).click(function() {
                hotLoad(this, medium);
                // prevent default click behaviour
                return false;
            });
        }
    }    
 
    /**
     * Set up the onclick bindings. Content will
     * be injected into elements inside a master
     * container with id "share-container", and
     * content replacements are based on each
     * social medium's "class" property.
     */
    var parent = $("#share-container");
    for (medium in socialMedia) {
        // call an actual function to force
        // immediate evaluation of {medium}
        setupHotLoading($, parent, socialMedia[medium]);
    }
}(jQuery));