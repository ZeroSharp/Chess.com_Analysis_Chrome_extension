// chess.com
async function getCurrentPgn_chessCom() { 
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
    var pgnTab = document.querySelector("#live_ShareMenuGlobalDialogDownloadButton") ||
        document.querySelector(".icon-font-chess.download.icon-font-primary");
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
    var shareButton = document.querySelector('button.share-button-component.icon-share') ||
        document.querySelector("#shareMenuButton") ||
        document.querySelector(".icon-font-chess.share.icon-font-primary") ||
        document.querySelector(".game-over-footer-icon .icon-share");

    if (shareButton) {
        return new Promise((resolve, reject) => {
            shareButton.click()
            setTimeout(resolve, 500);
        });
    } else {
        return Promise.reject();
    }
}

function closeShareDialog() {
    var closeButton = 
        document.querySelector("#live_ShareMenuGlobalDialogCloseButton") || 
        document.querySelector(".icon-font-chess.x.icon-font-primary") || 
        document.querySelector(".icon-font-chess.x.icon-font-secondary");    
    if (closeButton) {
        closeButton.click();
    } 
}

function copyPgn() {
    var textarea = 
        document.querySelector("#live_ShareMenuPgnContentTextareaId") ||
        document.querySelector("textarea[name=pgn]") ||
        document.querySelector(".form-textarea-component.pgn-download-textarea");
    return textarea.value;
}

function popuptoast(message) {
    var toastMessage = $('<div class="popuptoast" style="display:none">' + message + '</div>');

    $(document.body).append(toastMessage);
    toastMessage.stop().fadeIn(400).delay(2000).fadeOut(400); //fade out after 2 seconds
}