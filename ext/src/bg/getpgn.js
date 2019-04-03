async function getCurrentPgn() {
    var pgn = $('input[name="pgn"]').val();
    if (!pgn) {
        pgn = await openShareDialog().then(openPgnTab).then(copyPgn);

    }
    if (pgn) {
        // The termination field confuses the PDF converter so the result
        // is often output as a draw. This replaces the content with "Normal"
        // which seems to work correctly.
        if (pgn.indexOf(" won on time") !== -1) {
            pgn = pgn.replace(/Termination "([^"]+)"/g, 'Termination "Time forfeit"');
        } else {
            pgn = pgn.replace(/Termination "([^"]+)"/g, 'Termination "Normal"');
        }
    }
    closeShareDialog();
    return pgn;
}


async function openPgnTab() {
    var pgnTab = document.querySelector("#live_ShareMenuGlobalDialogDownloadButton");
    if (!pgnTab) {
        var headerElements = document.querySelectorAll(
            ".share-menu-dialog-component header *") || document;
        var pgnTab = Array.from(headerElements).filter(
            (x) => x.textContent == "PGN")[0];
    }
    return new Promise((resolve, reject) => {
        pgnTab.click();
        setTimeout(resolve, 500);
    });
}

async function openShareDialog() {
    var shareButton = document.querySelector('button.share-button-component.icon-share') ||
        document.querySelector("#shareMenuButton");
    if (shareButton) {
        return new Promise((resolve, reject) => {
            shareButton.click()
            setTimeout(() => {
                resolve();
            }, 500);
        });
    } else {
        return Promise.reject();
    }
}

function closeShareDialog() {
    var closeButton = $(".modal-container-component .x");
    if (closeButton) {
        closeButton.click();
    }
}

function copyPgn() {
    var textarea = document.querySelector(
            "#live_ShareMenuPgnContentTextareaId") ||
        document.querySelector("textarea[name=pgn]");
    return textarea.value;
}

function popuptoast(message) {
    var toastMessage = $('<div class="popuptoast" style="display:none">' + message + '</div>');

    $(document.body).append(toastMessage);
    toastMessage.stop().fadeIn(400).delay(2000).fadeOut(400); //fade out after 2 seconds
}
