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

// Waits until predicate returns a truthy value, or gives up after timeoutMs.
// Returns the value, or undefined on timeout.
async function waitFor(predicate, timeoutMs = 5000, intervalMs = 100) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const value = predicate();
        if (value) {
            return value;
        }
        if (Date.now() >= deadline) {
            return undefined;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}

function findPgnTextarea() {
    return document.querySelector(".share-menu-tab-pgn-textarea") || // Current textarea class
        document.querySelector("#live_ShareMenuPgnContentTextareaId") ||
        document.querySelector("textarea[name=pgn]") ||
        document.querySelector(".form-textarea-component.pgn-download-textarea") ||
        document.querySelector("#chessboard_ShareMenuPgnContentTextareaId");
}

function findLegacyPgnDiv() {
    return document.querySelector('div.share-menu-tab-selector-component > div:nth-child(1)') ||
        document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-gif-component') ||
        document.querySelector('div.alt-share-menu-tab.alt-share-menu-tab-image-component') ||
        document.querySelector('div.share-menu-tab.share-menu-tab-gif-component') ||
        document.querySelector('div.share-menu-tab.share-menu-tab-image-component');
}

// Older UI variants carried the PGN in a "pgn" attribute on the share tab panel.
// The panel elements still exist in the current UI but without that attribute,
// so callers must check for the attribute rather than the element.
function findLegacyPgnAttribute() {
    const pgnDiv = findLegacyPgnDiv();
    const pgnAttr = pgnDiv && pgnDiv.attributes["pgn"];
    return pgnAttr ? pgnAttr.value : null;
}

function findPgnTabButton() {
    return document.querySelector("#tab-pgn") || // New tab ID
        document.querySelector("#live_ShareMenuGlobalDialogDownloadButton") ||
        document.querySelector(".icon-font-chess.download.icon-font-primary") ||
        document.querySelector(".icon-download");
}

function findShareButton() {
    return document.querySelector('button:has(svg[data-glyph="graph-nodes-share"])') || // Locale-independent: icon glyph name, not translated text
        document.querySelector('[data-cy="sidebar-share-icon"]') || // Locale-independent selector (works in all languages)
        document.querySelector('[data-cy="analysis-secondary-controls-menu-open-share"]') || // New button nested in secondary controls menu
        document.querySelector('button[aria-label="Share"]') || // English aria-label
        document.querySelector('button[aria-label="공유"]') || // Korean aria-label
        document.querySelector('button.cc-icon-button-component[aria-label="Share"]') ||
        document.querySelector('span.secondary-controls-icon.download') ||
        document.querySelector('button.share-button-component.icon-share') ||
        document.querySelector('button.icon-font-chess.share.live-game-buttons-button') ||
        document.querySelector('button.share-button-component.share') ||
        document.querySelector("button[data-test='download']") ||
        document.querySelector('#shareMenuButton') ||
        document.querySelector('.icon-font-chess.share.icon-font-primary') ||
        document.querySelector('.icon-font-chess.share.game-buttons-icon') ||
        document.querySelector('.icon-font-chess.share') ||
        document.querySelector('.icon-share');
}

// True once the share dialog has rendered something the later steps can use.
function shareDialogContentPresent() {
    return findPgnTabButton() || findPgnTextarea() || findLegacyPgnDiv();
}

async function openPgnTab() {
    debuglog("openPgnTab");

    // Nothing to do if the PGN is already available.
    const textarea = findPgnTextarea();
    if (textarea && textarea.value) {
        debuglog("PGN textarea already populated");
        return;
    }

    // Note: deliberately no early exit on the legacy pgn attribute here. It is
    // present in the current UI too, but it honours the user's persisted
    // "Include PGN Timestamps" setting, which Lichess parses poorly. Opening the
    // PGN tab lets copyPgn turn timestamps off and read the clean textarea.

    // Check if PGN tab is already active
    var activePgnTab = document.querySelector('#tab-pgn.cc-tab-item-active');
    if (activePgnTab) {
        debuglog("PGN tab already active");
        return;
    }

    // Try to find and click the PGN tab
    var pgnTab = findPgnTabButton();

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
        pgnTab.click();
        // The textarea is rendered and populated asynchronously after the click.
        await waitFor(() => {
            const ta = findPgnTextarea();
            return ta && ta.value;
        });
        return;
    }

    debuglog("Warning: Could not find PGN tab, attempting to continue");
    // Don't throw - the PGN might be available anyway
}

async function openShareDialog() {
    debuglog("openShareDialog");
    // May be nested in secondary controls menu
    var secondaryControlsButton = document.querySelector(".game-controls-secondary-more > button, .game-controls-secondary-button > button");
    if (secondaryControlsButton) {
        debuglog("found secondaryControlsButton");
        secondaryControlsButton.click();
        // The menu renders asynchronously, so give the share button a chance to
        // appear rather than looking for it in the same tick.
        await waitFor(findShareButton, 2000);
    }
    var shareButton = findShareButton();
    if (!shareButton) {
        debuglog("failed openShareDialog");
        throw new Error('Share button not found');
    }

    shareButton.click();
    // Wait for the dialog to actually render. A fixed delay here was the weakest
    // link: on a slow connection the dialog can take longer than any delay we
    // would pick, and everything downstream then finds nothing.
    if (!await waitFor(shareDialogContentPresent)) {
        debuglog("share dialog did not appear in time");
        // Don't throw - copyPgn still reports a more specific error if the PGN
        // really is unreachable.
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

    // Disable timestamps checkbox if it's checked (Lichess doesn't parse them well)
    var timestampsCheckbox = document.querySelector('#tab-pgn-timestamps');
    if (timestampsCheckbox && timestampsCheckbox.checked) {
        debuglog("found timestamps checkbox, disabling");
        timestampsCheckbox.click();
        // The textarea still holds the timestamped text until it re-renders, so
        // wait for the timestamps to actually go rather than a fixed delay.
        await waitFor(() => {
            const ta = findPgnTextarea();
            return ta && ta.value && !ta.value.includes('%clk');
        });
        debuglog("timestamps disabled");
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

    // Only wait if the current UI actually renders a textarea, so older UIs fall
    // through to the attribute below without stalling for the full timeout.
    if (findPgnTextarea()) {
        const textarea = await waitFor(() => {
            const ta = findPgnTextarea();
            return ta && ta.value ? ta : null;
        });
        if (textarea) {
            debuglog(textarea.value);
            return textarea.value;
        }
    }

    // Older UI exposed the PGN as an attribute instead of a textarea.
    const legacyPgn = findLegacyPgnAttribute();
    if (legacyPgn) {
        debuglog("Found PGN in legacy pgn attribute");
        return legacyPgn;
    }

    debuglog("textarea failed");
    throw new Error('PGN textarea not found');
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
