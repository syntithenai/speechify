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
		