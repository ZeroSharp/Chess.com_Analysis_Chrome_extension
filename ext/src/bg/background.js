function isChessComVersion2(url) {
    if (url.indexOf('livechess/game') >= 0) {
        return true;
    }
    if (url.indexOf('live.chess.com') >= 0) {
        return true;
    }
    return false;
}

function isChessGames(url) {
    if (url.indexOf('www.chessgames.com') >= 0) {
        return true;
    }
    return false;
}

function isChessDB(url) {
    if (url.indexOf('chess-db.com') >= 0) {
        return true;
    }
    return false;
}

function isChessTempo(url) {
    if (url.indexOf('chesstempo.com') >= 0) {
        return true;
    }
    return false;
}

function getGameId(url) {
    // chessgames.com
    var refIndex = url.indexOf('chessgame?gid=');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'chessgame?gid='.length);
    }
    
    // archived chess.com game v2
    var refIndex = url.indexOf('livechess/game?id=');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'livechess/game?id='.length);
    }

    // archived chess.com game v3
    refIndex = url.indexOf('live/game/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'live/game/'.length);
    }

    // live chess.com game
    refIndex = url.indexOf('#');
    var ref = refIndex >= 0 ? url.slice(refIndex + 1) : '';
    if (ref.indexOf('g') == 0) {
        return ref.split('=')[1];
    }
    return '';
}

chrome.pageAction.onClicked.addListener(async function(tab) {
    var onDone = function(pgn, b, c) {
        if (!pgn)
            return;
        if (tab.url.indexOf("live#a=") > -1 || (pgn.indexOf('[Result ') > -1 && pgn.indexOf('[Result "*"]') < 0)) {
            chrome.tabs.create({
                url: "http://" + chrome.i18n.getMessage("locale") + ".lichess.org/paste"
            }, function(tab) {
                tabId = tab.id;
            });
            chrome.tabs.onUpdated.addListener(function(id, info) {
                setTimeout(() => {
                    if (id == tabId && info.status == "complete" && pgn != null) {
                        chrome.tabs.sendMessage(tabId, pgn);
                        pgn = null;
                    }
                }, 100);
            });
        } else {
            chrome.tabs.executeScript(tab.id, {
                code: 'popuptoast("Game is not yet finished.");'
            });
        }
    };
    // if v2
    if (isChessComVersion2(tab.url)) {
        // chess.com v2 (obsolete)
        var gameId = getGameId(tab.url);
        var pgnUrl = 'https://www.chess.com/echess/download_pgn?lid=' + gameId;
        // this URL does not work from v3.

        $.get(pgnUrl)
            .done(onDone);
    } else if (isChessGames(tab.url)) {
        // chessgames.com
        var gameId = getGameId(tab.url);        
        var pgnUrl = 'http://www.chessgames.com/perl/nph-chesspgn?text=1&gid=' + gameId;
    
        $.get(pgnUrl)
            .done(onDone);
    } else if (isChessTempo(tab.url)) {
        // chesstempo.com
        var results = await chrome.tabs.executeAsyncFunction(tab.id,
            'getCurrentPgn_chessTempo');
        onDone(results);            
    } else if (isChessDB(tab.url)) {
        // chess-db.com
        var results = await chrome.tabs.executeAsyncFunction(tab.id,
            'getCurrentPgn_chessDB');
        onDone(results);    
    } else {
        // chess.com
        var results = await chrome.tabs.executeAsyncFunction(tab.id,
            'getCurrentPgn_chessCom');
        onDone(results);
    }    
});

// Base filter
var filter = {
    url: [{ // archived game v2
        hostEquals: 'www.chess.com',
        pathContains: 'livechess/game'
    }, {
        // archived game v3
        hostEquals: 'www.chess.com',
        pathContains: 'live/game'
    }, {
        // live game v3
        hostEquals: 'www.chess.com',
        pathContains: 'live'
    }, {
        // computer game v3
        hostEquals: 'www.chess.com',
        pathContains: 'play'
    }, {
        // daily game v3
        hostEquals: 'www.chess.com',
        pathContains: 'daily/game'
    }, {
        // chessgames.com
        hostEquals: 'www.chessgames.com',
        pathContains: 'perl/chessgame'
    }, {
        // chess-db.com
        hostEquals: 'chess-db.com',
        pathContains: 'public/game.jsp'
    }, {
        // chesstempo.com
        hostEquals: 'chesstempo.com',
        pathContains: 'gamedb/player'
    }, {
        // chesstempo.com
        hostEquals: 'chesstempo.com',
        pathContains: 'gamedb/game'
    }]
};

function onWebNav(details) {
    chrome.pageAction.show(details.tabId);
}

chrome.webNavigation.onCommitted.addListener(onWebNav, filter);
chrome.webNavigation.onHistoryStateUpdated.addListener(onWebNav, filter);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onWebNav, filter);
