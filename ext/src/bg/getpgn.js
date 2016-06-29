function getCurrentPgn() {
    var button = $('#shareMenuButton')[0] || $(":button[ng-click='share()']")[0];
    button.click();
    pgn = $('textarea[class="full"]').val();
    var closeButton = $(':button[class="close"][id]').click();
    closeButton.click();
    // The termination field confuses the PDF converter so the result
    // is often output as a draw. This replaces the content with "Normal"
    // which seems to work correctly.
    pgn = pgn.replace(/Termination "([^"]+)"/g, 'Termination "Normal"');
    return pgn;
}

function popuptoast(message) {
    var toastMessage = $('<div class="popuptoast" style="display:none">' + message + '</div>');

    $(document.body).append(toastMessage);
    toastMessage.stop().fadeIn(400).delay(2000).fadeOut(400); //fade out after 2 seconds
}