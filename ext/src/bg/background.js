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
    let refIndex = url.indexOf('chessgame?gid=');
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
    refIndex = url.indexOf('chesstempo.com/gamedb/game/');
    if (refIndex >= 0) {
        return url.slice(refIndex + 'chesstempo.com/gamedb/game/'.length).split('/')[0];
    }
    
    // live chess.com game
    refIndex = url.indexOf('#');
    const ref = refIndex >= 0 ? url.slice(refIndex + 1) : '';
    if (ref.indexOf('g') == 0) {
        return ref.split('=')[1];
    }
    return '';
}

chrome.action.onClicked.addListener(async function(tab) {
    const onDone = function(pgn) {
        if (!pgn) {
            console.error('[ChessChrome] No PGN received');
            return;
        }
        
        console.log('[ChessChrome] PGN received, checking if game is finished...');
        
        if (tab.url.indexOf("live#a=") > -1 ||
            tab.url.indexOf("/events/") > -1 || 
            tab.url.indexOf("/computer/") > -1 || // Add computer games
            (pgn.indexOf('[Result ') > -1 && pgn.indexOf('[Result "*"]') < 0) ||
            (pgn.indexOf('[Result "*"]') > -1 && pgn.indexOf(' won on time') > -1)) // chess.com oddity where games can be lost on time but Result is not updated
        {
            let tabId;
            let pgnToSend = pgn; // Store PGN in closure
            const lang = chrome.i18n.getUILanguage().split('-')[0];
            const allowedLangs = ['en', 'fr', 'es', 'de', 'ru', 'it', 'pt', 'pl', 'nl', 'tr'];
            const safeLang = allowedLangs.includes(lang) ? lang : 'en';
            
            console.log('[ChessChrome] Opening Lichess paste page...');
            
            chrome.tabs.create({
                url: `https://${safeLang}.lichess.org/paste`
            }, function(newTab) {
                tabId = newTab.id;
                console.log('[ChessChrome] Created Lichess tab with ID:', tabId);
            });
            
            const tabUpdateListener = function(id, info) {
                if (id === tabId && info.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(tabUpdateListener);
                    console.log('[ChessChrome] Lichess tab loaded, sending PGN...');
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, pgnToSend, function(response) {
                            if (chrome.runtime.lastError) {
                                console.error('[ChessChrome] Error sending message:', chrome.runtime.lastError);
                            } else {
                                console.log('[ChessChrome] PGN sent successfully');
                            }
                        });
                    }, 500); // Increased delay to ensure page is fully loaded
                }
            };
            chrome.tabs.onUpdated.addListener(tabUpdateListener);
        } else {
            return notFinished(tab.id);
        }
    };
    try {
        if (isChessGames(tab.url)) {
            // chessgames.com
            const gameId = getGameId(tab.url);            
            const results = await getPgn(tab.id, "chessGames", gameId);
            onDone(results);            
        } else if (isChessTempo(tab.url)) {
            // chesstempo.com
            const gameId = getGameId(tab.url);
            const results = await getPgn(tab.id, "chessTempo", gameId);
            onDone(results);            
        } else if (isChessDB(tab.url)) {
            // chess-db.com
            const results = await getPgn(tab.id, "chessDB");
            onDone(results);    
        } else {
            // chess.com
            const results = await getPgn(tab.id, "chessCom");
            onDone(results);
        }
    } catch (error) {
        console.error("Failed to get PGN:", error);
        // Optionally notify user of the error
        try {
            await chrome.tabs.sendMessage(tab.id, {action: "notFinished"});
        } catch (e) {
            console.error("Could not send error message to tab:", e);
        }
    }
});

async function getPgn(tabId, site, ...args) {
    return await chrome.tabs.sendMessage(tabId, {action: "getPgn", site, actionArgs: args});
}

async function notFinished(tabId, site, ...args)
{
    return await chrome.tabs.sendMessage(tabId, {action: "notFinished", site, actionArgs: args});
}

