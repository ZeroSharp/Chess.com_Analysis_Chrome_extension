chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    console.log('[ChessChrome] Lichess page received message:', message ? 'PGN data' : 'no data');
    
    // The message IS the PGN string
    const pgn = message;
    
    if (!pgn) {
        console.error('[ChessChrome] No PGN data received');
        sendResponse({error: 'No PGN data'});
        return;
    }
    
    // Wait a moment for page to be fully ready
    setTimeout(() => {
        // Try both old and new selectors for compatibility
        const textarea = $("#form3-pgn").length ? $("#form3-pgn") : $("textarea[name='pgn']");
        const checkbox = $("#form3-analyse").length ? $("#form3-analyse") : $("input[name='analyse']");
        const submitButton = $("button:contains('Import game')").length ? 
                             $("button:contains('Import game')") : 
                             $(".submit");
        
        // Set the PGN text
        if (textarea.length) {
            textarea.val(pgn);
            // Trigger change event to ensure Lichess recognizes the input
            textarea.trigger('change');
            textarea.trigger('input');
            console.log('[ChessChrome] PGN text set in textarea');
        } else {
            console.error('[ChessChrome] Could not find PGN textarea');
        }
        
        // Check the analyse checkbox
        if (checkbox.length) {
            checkbox.prop("checked", true);
            checkbox.trigger('change');
            console.log('[ChessChrome] Analyse checkbox checked');
        } else {
            console.error('[ChessChrome] Could not find analyse checkbox');
        }
        
        // Click the submit button
        setTimeout(() => {
            if (submitButton.length) {
                submitButton[0].click();
                console.log('[ChessChrome] Submit button clicked');
            } else {
                console.error('[ChessChrome] Could not find submit button');
            }
        }, 100);
    }, 200);
    
    sendResponse({success: true});
    return true; // Keep message channel open for async response
});