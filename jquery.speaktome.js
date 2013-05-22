/*
speaktome 
Author: Steve Ryan <stever@syntithenai.com>
Date: 5/2013
// This plugin simplifies adding speech access to a HTML page.


*/
;(function($) {
	var methods={
		init : function(options) {
			console.log($(this).text());
			//return;
			console.log(options);
			var words=[];
			var completedWords=[];
			var imageSearch;
			var recognising=false;
			var pendingCommand=false;
			var handlerStarted=false;
			var transcript = '';
			var captureType='';
			var captureTarget=null;
			options=$.extend({forceHttps:true,'relPath':''},options);
			// only the first selected element
			return $(this).first().each(function() {
				pluginDOM=this;
				var text=$(this).text();
				//console.log(text);
				$.each(text.split(' '),function() {
					words.push(this);
				});
				console.log('WORDS',words);
				
				$('body').append('<style>.havespoken {border: 1px solid blue;background-color:yellow;}</style>');
				// minimise the mic permissions request
				if (options.forceHttps) {
					if (window.location.protocol!='https:') window.location='https://'+window.location.hostname+window.location.pathname; 
				} 
				// ensure mic notifications
				var status=$('#speaktome-status');
				if (status && status.length>0)  {
				} else {
					// create notify DOM
					$(pluginDOM).append('<div id="speaktome-status" ></div>');
					$('#speaktome-status').attr('style','position: fixed; top: 20px; right: 20px;');
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
							$('#speaktome-status').unbind('click.speaktomestart').bind('click.speaktomestart',function() {stopRecognising();});
							$('#speaktome-status .speakable').html('<span class="microphone microphone-on"><img alt="on" src="'+$.fn.speaktome.relPath+'images/microphone.png" ></span>').show();
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
									var tokens=transcript.split(' ');
									console.log('TRANSC',transcript,words);
									var fail=false;
									for (i=0; i< tokens.length; i++) {
										console.log('compare',$.trim(words[i]).toLowerCase(),$.trim(tokens[i]).toLowerCase());
										if ($.trim(words[i]).toLowerCase()!=$.trim(tokens[i]).toLowerCase()) fail=true;
									}
									console.log('FAILED?',fail)
									if (!fail) {
										var wordsToRemove=words.slice(0,tokens.length);
										$.each(wordsToRemove,function() {
											completedWords.push(this);
										})
										console.log('completedwords',completedWords);
										words=words.slice(tokens.length);
										var completedWraps=[];
										$.each(completedWords,function() {
											completedWraps.push('<span class="havespoken" >'+this+'</span>');
										});
										console.log('completedWraps',completedWraps);
										$(pluginDOM).html(completedWraps.join(' ')+words.join(' '));
										startRecognising();
									}
									console.log('DONE',words);
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
			});
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


	
	