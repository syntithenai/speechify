# speechify.js


## demo 

[https://springymap.dev.syntithenai.com/](https://springymap.dev.syntithenai.com/)

## overview 
Speechify.js is a jquery plugin that leverages the voice recognition capabilities of Google Chrome to implement voice commands and transcription.

The plugin provides a button and an associated message display which shows the status of voice recognition, click to start/stop listening and feedback about the success or progress of voice commands.

The plugin binds the focus event on inputs, textareas and contenteditables to start and stop voice transcription.

Voice commands are defined as grammars and associated with functions. For example
```[['select|choose|shoes|cheers|pick|pic [a|the] [note|node] [$content] [number $number]'],SpringyMap.selectNode],```

Grammars can be created with variables, choices and optional elements.

Grammars can be overlaid temporarily so that a voice command can span many utterances until the goal is met and the grammar overlay is removed.

Public API functions include ask, requireVariable and confirm to simplify the management of overlays in creating multi step voice commands.

When the plugin initialises, grammars are indexed into a grammar tree to facilitate traversal/matching against transcription results.


## quickstart

The plugin is called with DOM context in the typical jquery style
```
speechify = $("body").speechify({
		'grammarTree' : [['do stuff'],function() {console.log('busy doing');}]]
});

```

### working with grammars

When matching a transcript, 
the grammar tree traversal offers some guarantees
- longest matching grammars are chosen first

### voice command implementation

Three key functions are -
```
// notify question then overlay grammar tree
// grammarTree callbacks MUST call speechify.clearOverlay() to remove the grammar
ask(question,grammarTree)    

// notify question then overlay grammar with successCallback
// grammar responds to yes|ok|no|cancel
// grammar is cleared automatically
confirm(question,successCallback);  

// require that a variable is available from parent parameters
// if variable is not present, ask for it and add a grammar to continue processing based on the value
// grammar is cleared automatically when a value is spoken or the keyword cancel.
requireVariable(variableName,questionToAskIfEmpty,parametersFromParentCallback,successCallback,failCallback)
```

These functions can be nested to create multi step dialogs.
```
[['save file [$file]'], function(parameters) {
	var value = parameters[1]['$file'];
	
	speechify.ask('$title','What is the title of your document ?',[
		[[''],function() {}]
	]);
	OR 
	
	speechify.confirm('Do you really want to delete all notes from this map? <b>Yes</b> or <b>No</b>',function() {
			graph.edges = [];
			graph.nodes = [];
			graph.nodeSet = {};
			graph.setSelected(null);
			SpringyMap.putMap();
			renderer.graphChanged();							
			jQuery.fn.speechify.notify('Cleared the map.');
		});
	
	speechify.requireVariable('$title','What is the title of your document ?',parameters,
		function(value) {
		// success -> have a value for $title
			jQuery.fn.speechify.notify('Saved file as ' + value);
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





		
TODO
===========
[] to wrap OR options
() for optional
subvocabularies assigned to variables

* clarify priorities
? ban $var in first position
? exact match as priority
? longest match priortiy

* partial match feedback -> grammar path to string
? full list of possibile or close matches ? for which the recognised text is incomplete
		
		
		
links
=============

- https://codepen.io/bryik/pen/mErOOR?editors=0011
- http://cmusphinx.sourceforge.net/wiki/sphinx4:jsgfsupport
- https://www.w3.org/TR/jsgf/
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
