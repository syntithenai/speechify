/*
speaktome 
Author: Steve Ryan <stever@syntithenai.com>
Date: 5/2013
// This plugin simplifies adding speech access to a HTML page.
// It adds focus/blur events to input,textarea and designMode elements to trigger voice input to replace the selected text
	// Text injection auto spaces
// Stop listening/start listening/pause listening
// Auto buttons/links - highlight and trigger for selection with OK or click
// Command structure/grammar configurable tree of methods

*/
;(function($) {
	var methods={
		init : function(options) {
			pluginDOM=this;
			options=$.extend({forceHttps:true,'relPath':''},options);
			console.log(options);
			var imageSearch;
			var recognising=false;
			var pendingCommand=false;
			var handlerStarted=false;
			var transcript = '';
			var captureType='';
			var captureTarget=null;
			if (options.forceHttps) {
				if (window.location.protocol!='https:') window.location='https://'+window.location.hostname+window.location.pathname; 
			} 
			try {
				var speechRecognitionHandler = new webkitSpeechRecognition();
				//https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html#dfn-continuous
				speechRecognitionHandler.continuous = true;
				speechRecognitionHandler.lang='en-AU';
				//https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html#dfn-interimresults
				//speechRecognitionHandler.interimResults = true;
				
				function startRecognising() {
					console.log('start');
					if (!recognising) {
						var status=$('#speaktome-status');
						if (status && status.length>0)  {
						} else {
							// create notify DOM
							$(pluginDOM).append('<div id="speaktome-status" ></div>');
							$('#speaktome-status').attr('style','position: fixed; top: 20px; right: 20px;');
						}	
						$('#speaktome-status').unbind('click.speaktomestart').bind('click.speaktomestart',function() {stopRecognising();});
						$('#speaktome-status').html('<span class="microphone microphone-on"><img alt="on" src="'+$.fn.speaktome.relPath+'images/microphone.png" ></span>').show();
						recognising=true;
						if (!handlerStarted) {
							speechRecognitionHandler.start();
							handlerStarted=true;
						}
						
					}
				}
				function pauseRecognising() {
					console.log('pause');
					if (recognising) {
						$('#speaktome-status').html('<div class="microphone microphone-pause"><img alt="pause" src="'+$.fn.speaktome.relPath+'images/microphonepause.png" /></div>');
						$('.voice-help').hide();
						recognising=false;
					}
				}
				function stopRecognising() {
					console.log('stop');
					if (recognising) {
						$('#speaktome-status').html('<span class="microphone microphone-off"><img alt="off" src="'+$.fn.speaktome.relPath+'images/microphonepause.png" ></span>');
						$('#speaktome-status').unbind('click.speaktomestart').bind('click.speaktomestart',function() {startRecognising();});
						$('.voice-help').hide();
						recognising=false;
						handlerStarted=false;
						speechRecognitionHandler.stop();
					}
				}
				speechRecognitionHandler.onstart = function(){
					console.log('start speech recognition');
				};
				speechRecognitionHandler.onerror = function(e){
					console.log('Something wrong happened', e.error);
				};
				speechRecognitionHandler.onresult = function(event){
					for (var i = event.resultIndex; i < event.results.length; ++i) {
						if (event.results[i].isFinal) {
							transcript = $.trim(event.results[i][0].transcript);
							console.log('PRE:'+transcript);
							// what command
							if (transcript=="start listening") {
								startRecognising();
							}  else if (transcript=="pause listening") {
								pauseRecognising();
							} else if (transcript=="stop listening") {
								stopRecognising();
							} else if (recognising) {
								// START MAIN DECISION MAKING HERE
								// first commands and buttons
								
								console.log('COMMAND:'+transcript);
							} else {
								console.log('IGNORE:'+transcript);
							}
						}
					}
				};
				speechRecognitionHandler.onend = function(e){
					stopRecognising();
					console.log('done for all');
				};
				startRecognising();
			} catch (e) {
				console.log(e.message);
			}
		}
	};
	$.fn.speaktome = function(method) {
		if ($.isFunction(methods[method])) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if(typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " +  method + " does not exist on jQuery.fn.pluginTemplate");
		}
	};
	$.fn.speaktome.relPath='';
	
}) (jQuery,window,undefined);


	
	