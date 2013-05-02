/*
Speechify 
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
			options=$.extend({},options);
			console.log(options);
			var recognising=false;
			var pendingCommand=false;
			var handlerStarted=false;
			var handlerStarted=false;
			var transcript = '';
			var captureType='';
			var captureTarget=null;
			var speechRecognitionHandler = new webkitSpeechRecognition();
			//https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html#dfn-continuous
			speechRecognitionHandler.continuous = true;
			speechRecognitionHandler.lang='en-AU';
			//https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html#dfn-interimresults
			//speechRecognitionHandler.interimResults = true;
			
			function joinThreeStrings(a,b,c) {
				var res=[];
				if (a && a.length>0) res.push(a);
				if (b && b.length>0) res.push(b);
				if (c && c.length>0) res.push(c);
				return res.join(' ');
			}
			
			function getInputSelection(el) {
				var start = 0, end = 0, normalizedValue, range,
					textInputRange, len, endRange;

				if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
					start = el.selectionStart;
					end = el.selectionEnd;
				} else {
					range = document.selection.createRange();

					if (range && range.parentElement() == el) {
						len = el.value.length;
						normalizedValue = el.value.replace(/\r\n/g, "\n");

						// Create a working TextRange that lives only in the input
						textInputRange = el.createTextRange();
						textInputRange.moveToBookmark(range.getBookmark());

						// Check if the start and end of the selection are at the very end
						// of the input, since moveStart/moveEnd doesn't return what we want
						// in those cases
						endRange = el.createTextRange();
						endRange.collapse(false);

						if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
							start = end = len;
						} else {
							start = -textInputRange.moveStart("character", -len);
							start += normalizedValue.slice(0, start).split("\n").length - 1;

							if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
								end = len;
							} else {
								end = -textInputRange.moveEnd("character", -len);
								end += normalizedValue.slice(0, end).split("\n").length - 1;
							}
						}
					}
				}

				return {
					start: start,
					end: end
				};
			}

			function startRecognising() {
				console.log('start');
				if (!recognising) {
					var status=$('#speechify-status');
					if (status && status.length>0)  {
					} else {
						// create notify DOM
						$(pluginDOM).append('<div id="speechify-status" ></div>');
						$('#speechify-status').bind('click.speechifystart',function() {startRecognising();})
						$('#speechify-status').attr('style','position: fixed; top: 20px; right: 20px;');
					}	
					$('#speechify-status').html('ON');
					recognising=true;
					if (!handlerStarted) {
						speechRecognitionHandler.start();
						handlerStarted=true;
					}
					// click in text/textarea to redirect command switch to text entry
					// TODO - what about window.contentEditable=true; - trigger event?
					$('input[type=text]',pluginDOM).bind('click.speechifytext',function() {
						$(this).unbind('blur.speechifytext');
						$(this).bind('blur.speechifytext',function() {
							console.log('stop text entry');
							captureType='';
						});
						console.log('start text entry');
						captureType='text';
						captureTarget=this;
						startRecognising();
					});
					$('textarea',pluginDOM).bind('mouseup.speechifytextarea',function() {
						$(this).unbind('blur.speechifytextarea');
						$(this).bind('blur.speechifytextarea',function() {
							console.log('stop textarea entry');
							captureType='';
						});
						console.log('start textarea entry');
						captureType='textarea';
						captureTarget=this;
						startRecognising();
					});
					$('[contenteditable=true]',pluginDOM).bind('focus',function() {
						$(this).unbind('blur.speechifycontenteditable');
						$(this).bind('blur.speechifycontenteditable',function() {
							console.log('stop contenteditable entry');
							captureType='';
						});
						console.log('start contenteditable entry');
						captureType='contenteditable';
						captureTarget=this;
						startRecognising();
					});
				}
			}
			function pauseRecognising() {
				console.log('stop');
				if (recognising) {
					$('#speechify-status').html('PAUSE');
				//$('input[type=text]').unbind('click.speechifytext');
				//$('input[type=text]').unbind('mouseup.speechifytextarea');
				//$('input[type=text]').unbind('focus');
					recognising=false;
				}
			}
			function stopRecognising() {
				console.log('stop');
				if (recognising) {
					$('#speechify-status').html('OFF');
				//$('input[type=text]').unbind('click.speechifytext');
				//$('input[type=text]').unbind('mouseup.speechifytextarea');
				//$('input[type=text]').unbind('focus');
					recognising=false;
					speechRecognitionHandler.stop();
				}
			}
			speechRecognitionHandler.onstart = function(){
				console.log('staryt');
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
							// text input ?
							if (captureType.length>0) {
								if (captureType=='text')  {
									$(captureTarget).val(transcript);
								} else if (captureType=='textarea')  {
									var sel = getInputSelection(captureTarget);
									var val = $(captureTarget).val();
									$(captureTarget).data('oldval',val);
									$(captureTarget).val(joinThreeStrings($.trim(val.slice(0, sel.start)),transcript,$.trim(val.slice(sel.end))));
								} else if (captureType=='contenteditable')  {
									function replaceSelectedText(replacementText) {
										var sel, range;
										if (window.getSelection) {
											sel = window.getSelection();
											if (sel.rangeCount) {
												range = sel.getRangeAt(0);
												range.deleteContents();
												range.insertNode(document.createTextNode(replacementText+' '));
											}
										} else if (document.selection && document.selection.createRange) {
											range = document.selection.createRange();
											range.text = replacementText+' ';
										}
									}
									replaceSelectedText(transcript);
								} else {
									console.log('invalid captureType');
								}
							} else {
								// CLICK ON SELECTED RECORD
								// TODO WARNING MULTIPLE SELECTION
								if ($('.speechify-selected',pluginDOM).length==1 && (transcript=="okay" || transcript=="click")) {
									console.log('ok selection',$('.speechify-selected',pluginDOM));
									$('.speechify-selected',pluginDOM).each(function() {$(this).click()});
								} else {
									console.log('not ok selection - continue',options);
									var executionCompleted=false;
									// query options.commands
									//var done=false;
									// ANY CONFIGURED COMMANDS MATCHING ?
									if (options.commands) {
										console.log(options.commands);
										$.each(options.commands,function(key,value) {
										console.log(key,value);
											console.log('try command '+key,value);
											if (key==transcript) {
												executionCompleted=true;
												// TODO ?? PARAMETERS
												value(); 
											}
										});
									}
									// FINALLY TRY FOR A MATCH WITH BUTTONS AND LINKS
									if (!executionCompleted) {									
										var matches=[];
										$("a:contains('"+transcript+"')",pluginDOM).each(function() {matches.push(this);});
										//	input type=button|submit|image value|name
										$("input[type=submit],input[type=button],input[type=image]",pluginDOM).each(function() { console.log(this); if (this.value.toLowerCase()==transcript.toLowerCase()) matches.push(this);});
										console.log('MATCHES',matches);
										$('.speechify-selected',pluginDOM).each(function() {$(this).removeClass("speechify-selected");});
										$.each(matches,function() {
											$(this).addClass("speechify-selected");
										});
									}
								}
							}
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
		}
	};
	$.fn.speechify = function(method) {
		if ($.isFunction(methods[method])) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if(typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " +  method + " does not exist on jQuery.fn.pluginTemplate");
		}
	};
}) (jQuery,window,undefined);


	
	