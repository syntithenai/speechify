speechify.js
===============

Speechify.js is a jquery plugin that leverages the voice recognition capabilities of Google Chrome to implement voice commands and transcription.

The plugin provides a button and an associated message display which shows the status of voice recognition, click to start/stop listening and feedback about the success or progress of voice commands.

The plugin binds the focus event on inputs, textareas and contenteditables to start and stop voice transcription.

Voice commands are defined as grammars and associated with functions. For example
```[['select|choose|shoes|cheers|pick|pic [a|the] [note|node] [$content] [number $number]'],SpringyMap.selectNode],```

Grammars can be created with variables, choices and optional elements.

Grammars can be overlaid temporarily so that a voice command can span many utterances until the goal is met and the grammar overlay is removed.

When the plugin initialises, grammars are indexed into a grammar tree to facilitate traversal/matching against transcription results.

The plugin init method returns an object of functions including -







The plugin is called with DOM context in the typical style
		<pre>
$('body').speechify({commands:{'do stuff':function() {console.log('busy doing');}}});
		</pre>
		The plugin provides various assistance.
		<ul>
			<li>It starts a speech recogniser. Each utterance is used </li>
			<ul><li>to search for submit or button or image inputs with a name matching the utterance</li>
				<li>to search for commands matching the utterance</li>
				<li>to fill text into currently focused inputs, textareas and contenteditables</li>
			</ul>
			<li>It adds a microphone on/off button in the top right of the window</li>
			<li>It binds focus events to inputs,textareas and contenteditables to restart voice recognition</li>	
		</ul>
		The plugin also leverages <b>speak.js</b> provide a public method speak to convert text to speech audio without a network request.
		<pre>
$.fn.speechify.speak('short sentence');
		</pre>
		
		
		
		
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
