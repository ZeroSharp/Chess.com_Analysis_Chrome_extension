var gameurl = $('meta[property="og:url"]').attr('content');
if (gameurl !== null)
{
    var gameid = gameurl.substr(gameurl.lastIndexOf('/') + 1)
    var embedInWebsite = $("div.pgn_options").find("div");
    if (embedInWebsite !== null) {
        var exportToPdfLink = "http://lichess-export-pdf.eu-west-1.elasticbeanstalk.com/main.php?id=" + gameid;  
        embedInWebsite.append($('<a data-icon="x" class="text" target="_blank" rel="nofollow" href="' + exportToPdfLink + '">Print-friendly PDF</a>'));
    }
}