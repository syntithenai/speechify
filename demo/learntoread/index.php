<html>
<head>
<meta name="viewport" content="initial-scale=1.0">

<link rel="stylesheet" href="../../../../lib/jquery-ui/jquery-ui.css" type="text/css" media="all" />
<script src="../../../../lib/jquery.js" type="text/javascript"></script>
<script src="../../../../lib/jquery-ui.js" type="text/javascript"></script>
<script src="../../jquery.speaktome.js" type="text/javascript"></script>
<script>
$.fn.speaktome.relPath='../../';
</script>
<script src="../../lib/speak.js/speakClient.js" type="text/javascript"></script>


 <h1>Learn to Speak</h1>
 
 <p>Learn to Speak is software that assists in learning to read by speaking.</p>
 <p></p>
  
   <p>Scenarios - 
   <ul>
	<li>story telling - read aloud (live image inclusion)</li>
	<li>read to me (Text is shown on screen one sentence at a time. Speak the words aloud and if they are recognised correctly each word will be hightlighted and when the sentence is complete, the next sentence will be shown.)</li>
	<li>bilingual - where native language is set and is different from text language assume bilingual mode</li>
	<li>question multiple response</li>
	<li>question response</li>
	<li>question natural language</li>, question multiple response, question natural language</p>
   <p></p>
   <p></p>
  
 
 <div id='units'>
	<div id='kidsenglish' ></div>
	<div id='dutch' ></div>
	<div id='stories' >Once upon a time there was a dear little girl who was loved by everyone who looked at her, but most of all by her grandmother, and there was nothing that she would not have given to the child.
  </div>
</div>




<script>
$(document).ready(function() {
	$('#stories').speaktome({});
});

</script>