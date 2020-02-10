// this script is loaded by YoutubePlayerIframe.html / YoutubePlayerIframeLocal.html,
// which is loaded in an iframe by playem-youtube-iframe-patch.js
//
(function(){
  var wlh = window.location.href;
  // ORIGIN should match the domain on which openwhyd is running
  var ORIGIN = (wlh.indexOf("http://localhost:") == 0
      || /^https?\:\/\/(\w+)\.openwhyd\.(\w+)(\:8080)?\//.test(wlh))
      ? wlh.substr(0, wlh.indexOf("/", 10))
      : (window.location.protocol + "//whyd-11ty.netlify.com"), // domain of the iframe's expected host
    EVENTS = [ "onApiReady", "onEmbedReady", "onBuffering", "onPlaying", "onTrackInfo", "onPaused", "onEnded", "onError" ],
    player, eventHandlers = {}, parameters = {};

  try{
    console.log("ORIGIN", ORIGIN);
  }catch(e){};

  // initialize iframe DOM
  var body = document.getElementsByTagName("body")[0];
  body.innerHTML = '<div id="player"></div>';
  //body.style.margin = "0";
  //body.style.padding = "0";
  parameters.playerContainer = document.getElementById('player');
  var css = document.createElement("style");
  css.type = "text/css";
  //css.innerHTML = "#tumblr_controls { visibility: hidden !important; opacity:0 !important; }";
  css.innerHTML = [
    "* { margin:0; padding:0; width:100%; height:100%; position:absolute; top:0; left:0; }",
    "html { position:relative; }"
  ].join("\n");
  document.body.appendChild(css);

  // parse parameters
  (window.location.href.split("?").pop() || "").split("&").map(function(p){
    var splitted = p.split("=");
    parameters[splitted[0]] = splitted[1];
  });

  EVENTS.map(function(evt){
    eventHandlers[evt] = function(){
      //console.log("[iframe] youtube evt -> parent:", evt, arguments);
      post(evt, arguments);
    };
  });
/*
  eventHandlers.onEmbedReady = function(){
    (function maxSize(el){
      el.style.width = "100%";
      el.style.height = "100%";
      for (var i=el.children.length-1; i>=0; --i)
        maxSize(el.children[i]);
    })(document.getElementsByTagName("html")[0]);
    post("onEmbedReady", arguments);
  };
  */
  player = new YoutubePlayer(eventHandlers, parameters);
  console.log('PLAYER', player);
  function post(code, data){
    //console.log("[iframe] sends:", code, data);
    for (var i in data)
      if (typeof data[i] == "object" && data[i].label == "Youtube")
        data[i] = "(player)";
    parent.window.postMessage(JSON.stringify({code: code, data: data}), ORIGIN);
  }

  window.addEventListener('message', function(e) {
    if (e.origin == ORIGIN) {
      try {
				var message = JSON.parse(e.data);
			} catch (err) {
				console.warn('ignoring parse error from whyRemotesPlayer.js', err);
				console.log('received payload:', e.data);
				return;
			}
      var method = message.code;
      var args = message.data;
      //console.log("[iframe] parent sends:", method, args);
      if (typeof player[method] === 'function') {
        if (method === 'getTrackPosition') {
          args = [function(pos) {
            player.trackInfo.position = pos;
            post('onTrackInfo', [player.trackInfo]);
          }];
        }
        player[method].apply(player, args);
      }
    }
  });
})();
