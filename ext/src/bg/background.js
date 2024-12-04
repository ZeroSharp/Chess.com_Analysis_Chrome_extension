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
    if (url.indexOf('chessgames.com') >= 0) {
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

    // archived chess.com game v3
    refIndex = url.indexOf('live/game/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'live/game/'.length);
    }

    // daily chess.com game v3
    refIndex = url.indexOf('game/daily/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'game/daily/'.length);
    }
    
    // chesstempo.com
    var refIndex = url.indexOf('chesstempo.com/gamedb/game/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'chesstempo.com/gamedb/game/'.length).split('/')[0];
    }
    
    // live chess.com game
    refIndex = url.indexOf('#');
    var ref = refIndex >= 0 ? url.slice(refIndex + 1) : '';
    if (ref.indexOf('g') == 0) {
        return ref.split('=')[1];
    }
    return '';
}

chrome.action.onClicked.addListener(async function(tab) {
    var onDone = function(pgn) {
        if (!pgn)
            return;
        if (tab.url.indexOf("live#a=") > -1 ||
            tab.url.indexOf("/events/") > -1 || 
            (pgn.indexOf('[Result ') > -1 && pgn.indexOf('[Result "*"]') < 0) ||
            (pgn.indexOf('[Result "*"]') > -1 && pgn.indexOf(' won on time') > -1)) // chess.com oddity where games can be lost on time but Result is not updated
        {
            let tabId;
            chrome.tabs.create({
                url: "http://" + chrome.i18n.getUILanguage().split('-')[0] + ".lichess.org/paste"
            }, function(tab) {
                tabId = tab.id;
            });
            chrome.tabs.onUpdated.addListener(function(id, info) {
                setTimeout(() => {
                    if (id == tabId && info.status == "complete" && info.status != "aborted" && pgn != null) {
                        chrome.tabs.sendMessage(tabId, pgn);
                        pgn = null;
                    }
                }, 100);
            });
        } else {
            return notFinished(tab.id);
        }
    };
    if (isChessGames(tab.url)) {
        // chessgames.com
        var gameId = getGameId(tab.url);            
        var results = await getPgn(tab.id, "chessGames", gameId);
        onDone(results);            
    } else if (isChessTempo(tab.url)) {
        // chesstempo.com
        var gameId = getGameId(tab.url);
        var results = await getPgn(tab.id, "chessTempo", gameId);
        onDone(results);            
    } else if (isChessDB(tab.url)) {
        // chess-db.com
        var results = await getPgn(tab.id, "chessDB");
        onDone(results);    
    } else {
        // chess.com
        var results = await getPgn(tab.id, "chessCom");
        onDone(results);
    }
});

async function getPgn(tabId, site, ...args) {
    return await chrome.tabs.sendMessage(tabId, {action: "getPgn", site, actionArgs: args});
}

async function notFinished(tabId, site, ...args)
{
    return await chrome.tabs.sendMessage(tabId, {action: "notFinished", site, actionArgs: args});
}

