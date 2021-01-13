window.ALATION_START_CAPTURE = {};
window.ALATION_CAPTURED_METRICS = {};

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostContains: 'alation'},
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostContains: 'local'},
        })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

async function querySearch(queryText, baseURL) {
  const response = await fetch(baseURL + '/search/v1/?' + 
    new URLSearchParams({
      q: queryText,
      limit: 2,
    }));
  // waits until the request completes...
  const responseBody = await response.body;
  return responseBody;
};

chrome.webRequest.onBeforeRequest.addListener(
  function(details){
    var windowId = details.tabId;
    if (window.ALATION_START_CAPTURE[windowId]) {
      var queryText = details.requestBody.formData.query_text[0];
      var baseURL = details.initiator;
      var queryAutosaveURL = details.url;
      var currentQueryURL = queryAutosaveURL.substring(baseURL.length,queryAutosaveURL.length - 9);
      var baseURL = details.initiator;
      var filters = {};
      filters["otypes"] = ["query_or_statement"];
      fetch(baseURL + '/search/v1/?' + 
        new URLSearchParams({
          q: queryText,
          filters: JSON.stringify(filters),
          limit: 2
        }))
      .then(response => response.json())
      .then(data => {
        var res = data.results;
        delete window.ALATION_CAPTURED_METRICS[windowId];
        for (let i = 0; i < res.length; i++) {
          queryMatch = res[i];
          if (queryMatch.url != currentQueryURL) {
            delete queryMatch['otype'];
            delete queryMatch['id'];
            delete queryMatch['last_viewed_by_user_at'];
            delete queryMatch['nested_docs'];
            delete queryMatch['is_collapsible'];
            queryMatch.highlight = queryMatch['highlight']['text']['snippet'];
            queryMatch.fullURL = baseURL + queryMatch.url;
            window.ALATION_CAPTURED_METRICS[windowId] = window.ALATION_CAPTURED_METRICS[windowId] || [];
            window.ALATION_CAPTURED_METRICS[windowId] = window.ALATION_CAPTURED_METRICS[windowId].concat(queryMatch);
          }
        }
        //window.ALATION_CAPTURED_METRICS[windowId] = data.results;
      })
      .catch(function(error) {
        console.log('Error: ', error);
      });
      //querySearch(queryText, baseURL).then(res => {
      //  window.ALATION_CAPTURED_METRICS[windowId] = res;
      //});
    };
    return {};
  },
  {
    urls: [ "*://*/query/*/autosave/" ],
    types: ['xmlhttprequest']
  },
  ['requestBody']
);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.alation_metrics_ext_event) {
    case 'start_capture':
      window.ALATION_START_CAPTURE[request.alation_metrics_ext_window] = true;
      break;
    case 'stop_capture':
      window.ALATION_START_CAPTURE[request.alation_metrics_ext_window] = false;
      break;
    case 'clear_capture':
      window.ALATION_CAPTURED_METRICS[request.alation_metrics_ext_window] = [];
      break;
    case 'get_metrics':
      sendResponse({
        results: window.ALATION_CAPTURED_METRICS[request.alation_metrics_ext_window] || []
      });
      break;
    case 'get_is_capturing':
      sendResponse({
        results: window.ALATION_START_CAPTURE[request.alation_metrics_ext_window]
      });
      break;
    default:
      break;
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  delete window.ALATION_START_CAPTURE[tabId];
  delete window.ALATION_CAPTURED_METRICS[tabId];
});

