chrome.runtime.onMessage.addListener(
  function(pgn, sender, sendResponse){
	  $("#pgn")[0].innerHTML = pgn;
      $("#import_analyse").prop("checked", true);
	  $("button[type=submit]").click();
}) 