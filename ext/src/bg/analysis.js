chrome.runtime.onMessage.addListener(
  function(pgn, sender, sendResponse){
	  $("#pgn")[0].innerHTML = pgn;
      $("#import_analyse").prop("checked", true);
      var form = $("#import_analyse").closest("form");
      console.log("analyse.checked=" + $("#import_analyse").prop("checked"));
	  form.find(":submit").click();
}) 