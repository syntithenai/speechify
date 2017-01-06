# speechify.js


## Demo 

[https://springymap.dev.syntithenai.com/](https://springymap.dev.syntithenai.com/)

## Overview 
Speechify.js is a jquery plugin that leverages the voice recognition capabilities of Google Chrome to implement voice commands and transcription.

The plugin provides a button and an associated message display which shows the status of voice recognition, click to start/stop listening and feedback about the success or progress of voice commands.

The plugin binds the focus event on inputs, textareas and contenteditables to start and stop voice transcription.

Voice commands are defined as grammars and associated with functions. For example
```[['select|choose|shoes|cheers|pick|pic [a|the] [note|node] [$content] [number $number]'],SpringyMap.selectNode],```

Grammars can be created with variables, choices and optional elements.

Grammars can be overlaid temporarily so that a voice command can span many utterances until the goal is met and the grammar overlay is removed.

Public API functions include ask, requireVariable and confirm to simplify the management of overlays in creating multi step voice commands.

When the plugin initialises, grammars are indexed into a grammar tree to facilitate traversal/matching against transcription results.


## Quickstart

The plugin is called with DOM context in the typical jquery style
```
speechify = $("body").speechify({
		'grammarTree' : [['do stuff'],function() {console.log('busy doing');}]]
});

```

This plugin init returns an object containing functions to interact with the speech recognition.
These functions include

- say(text) - speak the text aloud
- notify(text,timeout) - Prepend text to the speech messages popup.
- clearNotify() - Clear all notify messages.
- ask(question,grammarTree,modal) - Notify add add overlay grammar tree
- confirm(question,variables,successCallback);  - Notify a question and add overlay yes|no, calling success for yes
- requireVariable(variableName,questionToAskIfEmpty,parametersFromParentCallback,successCallback,failCallback) - require that a variable is available from parent otherwise notify question and overlay grammar

### Working With Grammars

A grammar is a collection of strings that map to a function.
Grammars are all lower case.
Grammars must not have extraneous internal white space as parsing tokenises words by space.
Carelessly desiged grammars can eat memory to the extent of crashing chrome. :(

Each active grammar should start with an audibly distinct keyword.

Because the speech to text conversion using google relies on grammar context, transcription works best when the whole transcription matches common conversational text. For this reason, it can be useful to split voice commands over multiple transcription events.
For example, instead of 
```select note interesting motor cycles```
use
```select note```, then prompt for which note and use the second transcription of "interesting motor cycles" to select the  note.


#### Grammar Rules

the strings can be a exact match of the text to be triggered
```eg  [['open the blue box','open the red box'],function() {}]```

options are seperated by a vertical bar |
```eg  [['open the blue|red box'],function() {}]```

where options span more than one token, brackets can group the options ()
```eg  [['open the (blue|red|dark green) box'],function() {}]  ```

tokens or phrases square brackets are optional
```eg  [['open [the] [(blue|red|dark green)] box'],function() {}]```
will accept "open box"

variables can be used inside a grammar and the variable value will be extracted into a parameters object.
```eg  [['open [the] $color box'],function(params) {log(params[1])}]```
    will accept "open purple box" and log output in callbck will be {'$color':'purple'}

multiple variables can be used. each variable will soak up a single token.
```eg  [['open [the] $color box'],function() {}]```
will accept "open purple box"

variables can provide inner grammars using curly braces container the rule immediately following the variable name
```eg  [['open [the] $color{(red|green|bright blue)} box'],function(params) {log(params[1]["$color"])}]```
will only match one of the available colors and extract the spoken color into the callback parameters 

inner variable definitions can include further variables in which case the inner variables and the combined tokens into the outer variable are passed to the callback as their respective variable names.
```eg  [['open [the] $color{($tint{light|dark} red|green|blue)} box'],function(params) {log([params[1]["$color"],params[1]["$tint"]])}]```


When matching a transcript, the grammar tree traversal offers some guarantees
- longest matching grammars are chosen first
- text grammars are preferred over variable grammars

### Voice Command Implementation

The init method returns an object with some useful public functions that assist in developing multi stage voice commands.

```
var speechify = $("body").speechify({
		'grammarTree' : [['do stuff'],function() {console.log('busy doing');}]]
});
// use speechify public API
speechify.confirm('Really shoot me ?',function() {log('BANG');});
speechify.requireVariable('$name','what name ?',variables,function() {// OK},function() {// FAIL},)....;
speechify.ask(question,grammarTree);
```


Three key functions are -
```
ask(question,grammarTree)    
// notify question then overlay grammar tree
// grammarTree callbacks MUST call speechify.clearOverlay() to remove the grammar

confirm(question,successCallback);  
// notify question then overlay grammar with successCallback
// grammar responds to yes|ok|no|cancel
// grammar is cleared automatically

requireVariable(variableName,questionToAskIfEmpty,parametersFromParentCallback,successCallback,failCallback)
// require that a variable is available from parent parameters
// if variable is not present, ask for it and add a grammar to continue processing based on the value
// grammar is cleared automatically when a value is spoken or the keyword cancel.
```

These functions can be nested to create multi step dialogs.
```
[['save file [$file]'], function(parameters) {
	var value = parameters[1]['$file'];
	speechify.requireVariable('$title','What is the title of your document ?',parameters,
		function(value) {
		// success -> have a value for $title
		speechify.confirm('Do you really want to save as <b>'+value+'</b> ? <b>Yes</b> or <b>No</b>',function() {
			jQuery.fn.speechify.notify('Saved file as ' + value);
		});
		},
		function() {
		// fail		
			jQuery.fn.speechify.notify('Cancelled save.);
		}
	]);	
}
```




## technical

The plugin init method returns an object of functions including -

		
## TODO

? full list of possibile or close matches ? for which the recognised text is incomplete
		
				
## links

- https://codepen.io/bryik/pen/mErOOR?editors=0011
- http://cmusphinx.sourceforge.net/wiki/sphinx4:jsgfsupport
- https://www.w3.org/TR/jsgf/
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
