chrome.runtime.onMessage.addListener(
  function(pgn, sender, sendResponse){
    $("textarea[name='pgn']").text(pgn);
    $("input[name='analyse']").prop("checked", true);
	  $(".submit")[0].click();
});