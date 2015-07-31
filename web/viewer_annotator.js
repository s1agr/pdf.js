function javaHashCode(s) {
  var state = 0;
  var c = 0;
  for (var i = 0; i < s.length; i++) {
    c = s.charCodeAt(i);
    state = (31*state + c) & 0xFFFFFFFF;
  }
  return ((state + 0x80000000) & 0xFFFFFFFF) - 0x80000000;
}

var crowdTakeOver = function() {
    return {
        start: function (app) {
            app.annotations.load({uri: "urn:x-pdf:" + PDFViewerApplication.pdfDocument.fingerprint /*javaHashCode(window.location.href)*/, limit: 10240});
            //app.notify("SwartzNotes activated. Select text to begin annotating!");
        }
    };
};

var getQueryString = function(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
};

var pageUri = function () {
    return {
        beforeAnnotationCreated: function (ann) {
            ann.uri = "urn:x-pdf:" + PDFViewerApplication.pdfDocument.fingerprint ;// javaHashCode(window.location.href);
        }
    };
};

var initializeAnnotator = function() {
	if (typeof annotator === 'undefined') {
	  /*
	  alert("Oops! it looks like you haven't built Annotator. " +
	        "Either download a tagged release from GitHub, or build the " +
	        "package by running `make`");
	  */
	  console.log("I could not load the annotator plugin for some reason. This page is probably not supported, sorry!");
	} else {
	  var app = new annotator.App();

	  app.include(crowdTakeOver);
	  app.include(pageUri);
	  app.include(annotator.storage.http, {
	    prefix: 'http://localhost:5000',
	    localSuggestionPrefix: 'http://localhost:3333',
	    localSuggestionURL: '/onlinegrind?url=' + encodeURIComponent(PDFViewerApplication.url) /*getQueryString("facts")*/,
	  });
	  app.include(annotator.ui.main, {
	    viewerExtensions: [annotator.ui.tags.viewerExtension, annotator.ui.crowd.viewerExtension],
	    editorExtensions: [annotator.ui.tags.editorExtension, annotator.ui.crowd.editorExtension]
	  });

	  app.start();
	}
};

var getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};


waitForAWhile = function() {
    console.log("Waiting for PDF to render... 3secs");
    return new Promise(function(resolve, reject) {
        setTimeout((function() {
            resolve();
        }), 3000);
    });
};


waitForInit = function() {
    var tryIt;
    tryIt = (function(_this) {
      return function(resolve) {
        if (PDFViewerApplication.pdfDocument && PDFViewerApplication.pdfDocument.fingerprint) {
            console.log("PDF.js initialized!");
          return resolve();
        } else {
          return setTimeout((function() {
            return tryIt(resolve);
          }), 500);
        }
      };
    })(this);
    return new Promise((function(_this) {
      return function(resolve, reject) {
        if ((typeof PDFView !== "undefined" && PDFView !== null) || 
            (typeof PDFViewerApplication !== "undefined" && PDFViewerApplication !== null)) {
                return tryIt(resolve);
            } else {
                reject();
            }
      };
    })(this));
  };

waitForInit().then(waitForAWhile).then(initializeAnnotator);

// Huan: This is a horrible hack to make the annotator hooks
// because we can't be sure that the PDF is done rendering
// before the annotation overlay is done loading
// TODO: Catch this programmatically intead of using a timer.

//setTimeout(function () { initializeAnnotator(); }, 3000);


