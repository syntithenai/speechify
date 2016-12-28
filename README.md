speechify
===============

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
