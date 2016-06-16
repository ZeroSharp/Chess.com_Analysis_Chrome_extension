function getCurrentPgn() {
    var button = $('#shareMenuButton')[0] || $(":button[ng-click='share()']")[0];
    button.click();
    pgn = $('textarea[class="full"]').val();
    var closeButton = $(':button[class="close"][id]').click();
    closeButton.click();
    return pgn;
}

function toast(message) {
    var toastMessage = $('<div class="toast" style="display:none">' + message + '</div>');

    $(document.body).append(toastMessage);
    toastMessage.stop().fadeIn(400).delay(2000).fadeOut(400); //fade out after 2 seconds
}