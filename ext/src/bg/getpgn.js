pgnFuncs = {
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

    pgnFunc = pgnFuncs[request.site];
    if (!pgnFunc) {
        throw new Error(`Invalid site in getPgn message data: ${request.site}`);
    }

    pgnFunc(...(request.actionArgs || []))
      .then(sendResponse);

    return true;  
});


// chess.com
async function getCurrentPgn_chessCom() { 
    debuglog("getCurrentPgn_chessCom");

    var pgn = await openShareDialog()
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
        return Promise.resolve(pgn);
    }
    return Promise.reject();
}

// chessGames.com
async function getCurrentPgn_chessGames(gameId) {
    debuglog('getCurrentPgn_chessGames(' + gameId + ')');
    var pgnUrl = 'https://www.chessgames.com/perl/nph-chesspgn?text=1&gid=' + gameId;
    pgn = await $.get(pgnUrl);
    return Promise.resolve(pgn);
}

// chess-db.com
async function getCurrentPgn_chessDB() { 
    var pgn = null;
    var pgnInput = $('input[name="pgn"]');
    if (pgnInput)
    {
        pgn = pgnInput.val();
        return Promise.resolve(pgn);
    }
    return Promise.reject();
}

// chessTempo.com
async function getCurrentPgn_chessTempo(gameId) { 
    debuglog('getCurrentPgn_chessTempo(' + gameId + ')');
    if (!gameId || gameId === '') {
        // if the gameId is not defined, try to get it from the link
        var url = $('a:contains("Link")').attr('href');
        // debuglog("After url = " + url);
        var refIndex = url.indexOf('gamedb/game/');
        if (refIndex >= 0) {
            gameId = url.slice(refIndex + 'gamedb/game/'.length).split('/')[0];
        }
        debuglog("gameId = " + gameId);
    }

    var pgn = await $.ajax({        
        url: $('form.ct-download-pgn-form')[0].action,
        type: 'POST',
        data : 'gameids=' + gameId,
        async: true,
        success: function(data){
          return Promise.resolve(data);
        }
      });

    if (pgn) {
        return Promise.resolve(pgn);
    }
    return Promise.reject();
}

async function openPgnTab() {
    debuglog("openPgnTab");    
    // Check if PGN tab is already active
    var activePgnTab = document.querySelector('#tab-pgn.cc-tab-item-active');
    if (activePgnTab) {
        return Promise.resolve();
    }
    
    var pgnDiv = document.querySelector('div.share-menu-tab-selector-component > div:nth-child(1)') ||
        document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-image-component') ||
        document.querySelector('div.share-menu-tab.share-menu-tab-image-component');

    if (pgnDiv) {
        return Promise.resolve();
    }
    var pgnTab = document.querySelector("#tab-pgn") || // New tab ID
        document.querySelector("#live_ShareMenuGlobalDialogDownloadButton") ||
        document.querySelector(".icon-font-chess.download.icon-font-primary") ||
        document.querySelector(".icon-download");
    if (!pgnTab) {
        var headerElements = document.querySelectorAll(
            ".share-menu-dialog-component header *") || document;    
        pgnTab = Array.from(headerElements).filter(
            (x) => x.textContent == "PGN")[0];
    }
    if (pgnTab) {
        return new Promise((resolve, reject) => {
            pgnTab.click();
            setTimeout(resolve, 500);
        });
    } else {
        return Promise.reject();
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
        return new Promise((resolve, reject) => {
            shareButton.click()
            setTimeout(resolve, 1500);
        });
    } else {
        debuglog("failed openShareDialog");
        return Promise.reject();
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

    //share-menu-tab-selector-tab 
    //board-tab-item-underlined-component 
    //board-tab-item-underlined-active 
    //share-menu-tab-selector-tab

    var pgnDiv = document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-gif-component') ||
    document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-image-component') ||
    document.querySelector('div.share-menu-tab.share-menu-tab-gif-component') ||
    document.querySelector('div.share-menu-tab.share-menu-tab-image-component');

    if (pgnDiv) {
        pgnAttr = pgnDiv.attributes["pgn"]
        if (pgnAttr) {
            return Promise.resolve(pgnAttr.value);
        }
    }

    // Disable timestamps checkbox if it's checked (Lichess doesn't parse them well)
    var timestampsCheckbox = document.querySelector('#tab-pgn-timestamps');
    if (timestampsCheckbox && timestampsCheckbox.checked) {
        debuglog("found timestamps checkbox, disabling");
        await new Promise((resolve, reject) => {
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
            await new Promise((resolve, reject) => {
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
    } else
    {
        debuglog("textarea failed");
        Promise.reject();
    }
    return Promise.resolve(textarea.value);
}

async function popuptoast(message) {
    var toastMessage = $('<div class="popuptoast" style="display:none">' + message + '</div>');

    $(document.body).append(toastMessage);
    toastMessage.stop().fadeIn(400).delay(2000).fadeOut(400); //fade out after 2 seconds
    return Promise.resolve();
}

function debuglog(message) 
{
    var logDebugMessages = false;
    if (logDebugMessages) {
        console.log(message);
    }
}
