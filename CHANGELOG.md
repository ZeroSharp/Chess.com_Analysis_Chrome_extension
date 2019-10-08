# Changelog

## Version 3.1.0
* Updated for recent changes to chess.com.

## Version 3.0.1
* Workaround for chess.com bug where the 'result' field in the pgn is not updated after a player times out.

## Version 3.0.0
* Support for games from chessgames.com, chess-db.com and chesstempo.com.
* Improved manifest to limit permissions as much as possible.
* Icon now becomes enabled only when there is a valid game to analyse.
* Improved colour of icon so that it is clear when it is available.

## Version 2.6.1
* Fixed for immediately finished live games.

## Version 2.6.0
* Updated for recent changes to chess.com. Calls are now async. (Thanks 0ddFell0w!)
* Added support for analysis of daily games.

## Version 2.5.6
* Updated for recent changes to Lichess import page.

## Version 2.5.5

* Link was not working immediately from live games.  
* Upgraded to jQuery 3.3.1.

## Version 2.5.4

* Fixed broken link when analysing after game has finished.
* Now works from live analysis board (urls with 'live#a=1234567').

## Version 2.5.3

* Print-friendly PDF has been removed to a separate extension (Lichess Print-friendly PDF)[https://chrome.google.com/webstore/detail/lichess-print-friendly-pd/goijhimgdjppmhmjkaglhggoapkgobfg].

## Version 2.5.2

* Print-friendly PDF export now uses AWS lambda.

## Version 2.5.1

* Games lost on time were not being detected as such during lichess import.

## Version 2.5.0

* Added support for 'Print-friendly PDF export' which was removed from lichess in November 2016.

## Version 2.4.4

* Fixed support for analysing live games.

## Version 2.4.2

* 'Export to PDF' from lichess was not correctly determining the winner owing to an anomaly in the chess.com pgn.

## Version 2.4.1

* Fixed css name clash.

## Version 2.4.0

* Analyse any live game! (in v3).
* Fixes to support chess.com changes in v3.
* Improved method of pgn retrieval in v3. Much smoother transition.
* Warning message is displayed when the game is still in progress.

## Version 2.3.0

* Fixed to support https changes on lichess.org.

## Version 2.2.1

* Improved reliability of toggling 'computer analysis' before submitting pgn to lichess.

## Version 2.2.0

* Fixed since chess.com change to 'switch to old chess.com' which now requires POST.
