const pgnFuncs = {
    chessCom: getCurrentPgn_chessCom,
    chessDB: getCurrentPgn_chessDB,
    chessTempo: getCurrentPgn_chessTempo,
    chessGames: getCurrentPgn_chessGames
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "notFinished") {
        popuptoast("Game is not yet finished.")
        .then(sendResponse);
        return true;
    }
    
    if (request.action !== "getPgn") {
        return false;
    }

    const pgnFunc = pgnFuncs[request.site];
    if (!pgnFunc) {
        console.error(`Invalid site in getPgn message data: ${request.site}`);
        sendResponse(null);
        return true;
    }

    pgnFunc(...(request.actionArgs || []))
      .then(sendResponse)
      .catch(error => {
          console.error('Error getting PGN:', error);
          sendResponse(null);
      });

    return true;  
});


// chess.com
async function getCurrentPgn_chessCom() { 
    debuglog("getCurrentPgn_chessCom");

    try {
        let pgn = await openShareDialog()
                .then(openPgnTab)
                .then(copyPgn)
                .finally(closeShareDialog);
        if (pgn) {
            // The termination field confuses the PDF converter so the result
            // is often output as a draw. This replaces the content with "Normal"
            // which seems to work correctly.
            if (pgn.indexOf(" won on time") !== -1) {
                pgn = pgn.replace(/Termination "([^"]+)"/g, 'Termination "Time forfeit"');
            } else {
                pgn = pgn.replace(/Termination "([^"]+)"/g, 'Termination "Normal"');
            }
            return pgn;
        }
        throw new Error('PGN not found');
    } catch (error) {
        console.error('Error in getCurrentPgn_chessCom:', error);
        throw error;
    }
}

// chessGames.com
async function getCurrentPgn_chessGames(gameId) {
    debuglog('getCurrentPgn_chessGames(' + gameId + ')');
    const pgnUrl = 'https://www.chessgames.com/perl/nph-chesspgn?text=1&gid=' + gameId;
    try {
        const pgn = await $.get(pgnUrl);
        return pgn;
    } catch (error) {
        console.error('Error fetching ChessGames PGN:', error);
        throw error;
    }
}

// chess-db.com
async function getCurrentPgn_chessDB() { 
    const pgnInput = $('input[name="pgn"]');
    if (pgnInput && pgnInput.length > 0)
    {
        const pgn = pgnInput.val();
        if (pgn) {
            return pgn;
        }
    }
    throw new Error('PGN input not found on chess-db.com');
}

// chessTempo.com
async function getCurrentPgn_chessTempo(gameId) { 
    debuglog('getCurrentPgn_chessTempo(' + gameId + ')');
    if (!gameId || gameId === '') {
        // if the gameId is not defined, try to get it from the link
        const linkElement = $('a:contains("Link")');
        if (linkElement.length > 0) {
            const url = linkElement.attr('href');
            const refIndex = url.indexOf('gamedb/game/');
            if (refIndex >= 0) {
                gameId = url.slice(refIndex + 'gamedb/game/'.length).split('/')[0];
            }
        }
        debuglog("gameId = " + gameId);
    }

    const form = $('form.ct-download-pgn-form')[0];
    if (!form) {
        throw new Error('ChessTempo download form not found');
    }

    try {
        const pgn = await $.ajax({        
            url: form.action,
            type: 'POST',
            data : 'gameids=' + gameId,
            timeout: 10000
        });
        
        if (pgn) {
            return pgn;
        }
        throw new Error('Empty response from ChessTempo');
    } catch (error) {
        console.error('Error fetching ChessTempo PGN:', error);
        throw error;
    }
}

async function openPgnTab() {
    debuglog("openPgnTab");    
    // Check if PGN tab is already active
    var activePgnTab = document.querySelector('#tab-pgn.cc-tab-item-active');
    if (activePgnTab) {
        debuglog("PGN tab already active");
        return Promise.resolve();
    }
    
    // Check if PGN content is already visible (for older UI)
    var pgnDiv = document.querySelector('div.share-menu-tab-selector-component > div:nth-child(1)') ||
        document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-image-component') ||
        document.querySelector('div.share-menu-tab.share-menu-tab-image-component');

    if (pgnDiv) {
        debuglog("PGN content already visible");
        return Promise.resolve();
    }
    
    // Try to find and click the PGN tab
    var pgnTab = document.querySelector("#tab-pgn") || // New tab ID
        document.querySelector("#live_ShareMenuGlobalDialogDownloadButton") ||
        document.querySelector(".icon-font-chess.download.icon-font-primary") ||
        document.querySelector(".icon-download");
    
    if (!pgnTab) {
        // Fallback: search for PGN text in dialog
        var headerElements = document.querySelectorAll(
            ".share-menu-dialog-component header *, .cc-modal-body button, div[role='dialog'] button");
        if (headerElements.length > 0) {
            pgnTab = Array.from(headerElements).filter(
                (x) => x.textContent && x.textContent.trim() === "PGN")[0];
        }
    }
    
    if (pgnTab) {
        debuglog("Found PGN tab, clicking");
        return new Promise((resolve) => {
            pgnTab.click();
            setTimeout(resolve, 500);
        });
    } else {
        // If PGN tab not found, it might already be selected or the UI has changed
        // Check if PGN textarea is already visible
        var pgnTextarea = document.querySelector(".share-menu-tab-pgn-textarea") ||
            document.querySelector("textarea[name=pgn]");
        if (pgnTextarea) {
            debuglog("PGN textarea already visible, tab might be selected by default");
            return Promise.resolve();
        }
        
        debuglog("Warning: Could not find PGN tab, attempting to continue");
        // Don't throw error, try to continue - the PGN might be available anyway
        return Promise.resolve();
    }
}

async function openShareDialog() {
    debuglog("openShareDialog");
    // May be nested in secondary controls menu
    var secondaryControlsButton = document.querySelector(".game-controls-secondary-more > button, .game-controls-secondary-button > button");
    if (secondaryControlsButton) {
        debuglog("found secondaryControlsButton");
        await secondaryControlsButton.click()
    }
    var shareButton =
        document.querySelector('[data-cy="analysis-secondary-controls-menu-open-share"]') || // New button nested in secondary controls menu
        document.querySelector('button[aria-label="Share"]') || // New specific aria-label selector
        document.querySelector('button.cc-icon-button-component[aria-label="Share"]') || // More specific cc-icon-button
        document.querySelector('span.secondary-controls-icon.download') ||
        document.querySelector('button.share-button-component.icon-share') ||
        document.querySelector('button.share-button-component.icon-share') ||
        document.querySelector('button.icon-font-chess.share.live-game-buttons-button') ||
        document.querySelector('button.share-button-component.share') ||
        document.querySelector("button[data-test='download']") ||
        document.querySelector("#shareMenuButton") ||
        document.querySelector(".icon-font-chess.share.icon-font-primary") ||
        document.querySelector(".icon-font-chess.share.game-buttons-icon") ||
        document.querySelector(".icon-font-chess.share") ||
        document.querySelector(".icon-share");
    if (shareButton) {
        return new Promise((resolve) => {
            shareButton.click()
            setTimeout(resolve, 1500);
        });
    } else {
        debuglog("failed openShareDialog");
        throw new Error('Share button not found');
    }
}

function closeShareDialog() {
    debuglog("closeShareDialog");
    var closeButton =
        document.querySelector(".cc-close-button-component") || // New close button class
        document.querySelector("#live_ShareMenuGlobalDialogCloseButton") ||
        document.querySelector("button.ui_outside-close-component") ||
        document.querySelector(".icon-font-chess.x.icon-font-primary") ||
        document.querySelector(".icon-font-chess.x.icon-font-secondary") ||
        document.querySelector(".icon-font-chess.x.ui_outside-close-icon") ||
        document.querySelector("#chessboard_ShareMenuGlobalDialogCloseButton")    
    if (closeButton) {
        closeButton.click();
    } else
    {
        debuglog("failed closeShareDialog");
    }
}

async function copyPgn() {
    debuglog("copyPgn");    

    // First check if PGN textarea is already available (most common case now)
    var textarea = 
    document.querySelector(".share-menu-tab-pgn-textarea") || // New textarea class
    document.querySelector("#live_ShareMenuPgnContentTextareaId") ||
    document.querySelector("textarea[name=pgn]") ||
    document.querySelector(".form-textarea-component.pgn-download-textarea") ||
    document.querySelector("#chessboard_ShareMenuPgnContentTextareaId");
    
    if (textarea && textarea.value) {
        debuglog("Found PGN in textarea immediately");
        return textarea.value;
    }

    // Check older UI with pgn attribute
    var pgnDiv = document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-gif-component') ||
    document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-image-component') ||
    document.querySelector('div.share-menu-tab.share-menu-tab-gif-component') ||
    document.querySelector('div.share-menu-tab.share-menu-tab-image-component');

    if (pgnDiv) {
        const pgnAttr = pgnDiv.attributes["pgn"];
        if (pgnAttr) {
            return pgnAttr.value;
        }
    }

    // Disable timestamps checkbox if it's checked (Lichess doesn't parse them well)
    var timestampsCheckbox = document.querySelector('#tab-pgn-timestamps');
    if (timestampsCheckbox && timestampsCheckbox.checked) {
        debuglog("found timestamps checkbox, disabling");
        await new Promise((resolve) => {
            timestampsCheckbox.click();
            setTimeout(resolve, 500);
            debuglog("timestamps disabled");
        });
    } else if (!timestampsCheckbox) {
        // Fallback to old selector for backward compatibility
        var disableAnalysisRadioButton =
            document.querySelector('.share-menu-tab-pgn-toggle input[type=radio]');
        if (disableAnalysisRadioButton) {
            debuglog("found disable analysis radio button");
            await new Promise((resolve) => {
                disableAnalysisRadioButton.click();
                setTimeout(resolve, 500);
                debuglog("analysis disabled");
            });
        } else {
            debuglog("could not find disable analysis radio button!");
        }
    }

    var textarea = 
    document.querySelector(".share-menu-tab-pgn-textarea") || // New textarea class
    document.querySelector("#live_ShareMenuPgnContentTextareaId") ||
    document.querySelector("textarea[name=pgn]") ||
    document.querySelector(".form-textarea-component.pgn-download-textarea") ||
    document.querySelector("#chessboard_ShareMenuPgnContentTextareaId");

    if (textarea) {
        debuglog(textarea.value);
        return textarea.value;
    } else {
        debuglog("textarea failed");
        throw new Error('PGN textarea not found');
    }
}

async function popuptoast(message) {
    // Fix XSS vulnerability by using text() instead of string concatenation
    const toastMessage = $('<div class="popuptoast" style="display:none"></div>').text(message);

    $(document.body).append(toastMessage);
    toastMessage.stop().fadeIn(400).delay(2000).fadeOut(400); //fade out after 2 seconds
    return;
}

function debuglog(message) 
{
    const logDebugMessages = false;
    if (logDebugMessages) {
        console.log('[ChessChrome]', message);
    }
}
