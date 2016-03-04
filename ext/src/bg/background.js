function isChessComVersion2(url) {
    if (url.indexOf('livechess/game') >= 0) {
        return true;
    }
    if (url.indexOf('live.chess.com') >= 0) {
        return true;
    }
    return false;    
}

function getGameId(url) {
    // archived game v2
    var refIndex = url.indexOf('livechess/game?id=');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'livechess/game?id='.length);
    }

    // archived game v3
    refIndex = url.indexOf('live/game/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'live/game/'.length);
    }
    
    // live V2 or V3 game
    refIndex = url.indexOf('#');
    var ref = refIndex >= 0 ? url.slice(refIndex+1) : '';
    if (ref.indexOf('g') == 0)
    {
     	return ref.split('=')[1];
    }
    return '';
}

function onWebNav(details) {
    var gameId = getGameId(details.url);
    console.log("gameid = " + gameId);

    if (gameId !== '') { // Starts with e? show page action
        chrome.pageAction.show(details.tabId);	
    } else {
        chrome.pageAction.hide(details.tabId);
    }
}

chrome.pageAction.onClicked.addListener(function(tab){    
 	var gameId = getGameId(tab.url);
	var pgnURL = 'https://www.chess.com/echess/download_pgn?lid=' + gameId;
    // this URL does not work from v3.
     
    var onDone = function(pgn, b, c){
            if(pgn.indexOf('[Result ') >=0 && pgn.indexOf('[Result "*"]') < 0){
                chrome.tabs.create({url:"http://"+chrome.i18n.getMessage("locale")+".lichess.org/paste"}, function(tab){
                    tabId = tab.id;
                });
                chrome.tabs.onUpdated.addListener(function(id , info) {
                    if (id == tabId && info.status == "complete" && pgn != null) {
                        chrome.tabs.sendMessage(tabId, pgn);
                        pgn = null;
                    }
                });
            }
        };
    
    // if v2
    if (isChessComVersion2(tab.url))
    {
        $.get(pgnURL)
            .done(onDone);
    }
    else // v3
    {
        // I can't find how to get the PGN without switching back to v2 and then back again...
        $.get("https://www.chess.com/switch?request_uri=/live/game/" + gameId)
        .done(function(pgn, b, c){
            $.get(pgnURL)
            .done(onDone)
        })
        .always(function(pgn, b, c){
            $.get("https://www.chess.com/switch?request_uri=%2Flivechess%2Fgame%3Fid%3" + gameId)
        });
    }
});

// Base filter
var filter = {
    url: [
        {
            // live game v2
            hostEquals: 'live.chess.com',
            pathContains: "live"
        },
        {   // archived game v2
            hostEquals: 'www.chess.com', 
            pathContains: 'livechess/game'
        },
        {
            // archived game v3
            hostEquals: 'www.chess.com',
            pathContains: 'live/game'
        },
        {
            // live game v3
            hostEquals: 'www.chess.com',
            pathContains: 'live'
        }
    ]
};

chrome.webNavigation.onCommitted.addListener(onWebNav, filter);
chrome.webNavigation.onHistoryStateUpdated.addListener(onWebNav, filter);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onWebNav, filter);
