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
function SpeechifySuccessException(grammar,variables) {
	this.grammar = grammar;
	this.variables = variables;
}
function SpeechifyGrammarException(message) {
	this.message = message;
}


var SpeechifyGrammar = function SpeechifyGrammar(texts,callback,contextGrammars) {
	this.texts = texts;
	this.contextGrammars = contextGrammars;
	this.callback = callback;
};

;(function($) {
	var methods={
		init : function(options) {
			pluginDOM=this;
			options=$.extend({forceHttps:true,'relPath':''},options);
			//console.log(options);
			var imageSearch;
			var recognising=false;
			var pendingCommand=false;
			var handlerStarted=false;
			var transcript = '';
			var captureType='';
			var captureTarget=null;
			//var lastStartedAt = 0;
			if (options.forceHttps) {
				//if (window.location.protocol!='https:') window.location='https://'+window.location.hostname+window.location.pathname; 
			} 
			
			var contextGrammars = {}
			var grammars=$.extend({},options.grammars);
			var activeGrammars = {};
			addGrammars(grammars,activeGrammars);
			console.log(['GRAMMARS',grammars]);
			console.log(['COLLATED',activeGrammars[0],activeGrammars]);
			
			
			// PRIVATE FUNCTIONS

			function isVariable(word) {
				if (word.substr(0,1) == "$") {
					return true;
				} else {
					return false;
				}
			}
			
			function hasVariable(current) {
				for (name in current) {
					if (isVariable(name)) {
						return true;
					}
				}
				return false;
			}
			function getVariables(current) {
				var variables = [];
				for (name in current) {
					if (isVariable(name)) {
						variables.push(name);
					}
				}
				return variables;
			}
			function isGrammarNode(node) {
				if (node && typeof node == "object" && node.hasOwnProperty('::GRAMMAR::')) {
					return true;
				} else {
					return false;
				}
			}
			function hasChildNodes(node) {
				if (isGrammarNode(node)) { 
					return (Object.keys(current).length > 1);
				} else {
					return (Object.keys(current).length > 0);
				}
			}
			
			function hasOptionalNodes(current) {
				var nodes = getOptionalNodes(current);
				return (nodes.length > 0) ;
			}
			
			function getOptionalNodes(current) {
				var variables = [];
				for (name in current) {
					if (name.slice(0,1) == "(" && name.slice(-1) == ")" ) {
						variables.push(name);
					}
				}
				return variables;
			}
			function isLastTranscriptToken(tokens,index) {
				return (i === (parts.length -1));
			}
			
			
			
			function addGrammarToNode(transcript,node) {
				
			}
			
			/**
			 * Traverse the grammar tree by moving the current pointer to the subtree
			 * matching word or creating a new subtree element for word.
			 * Where the word is the last token in the parts, assign the SpeechifyGrammar instance to 
			 * mark that this is an endpoint in the grammar.
			 * @ return object - tree node after traversal or creation.
			 */	
			function traverseGrammar(parts,current,word,grammar) {
				console.log(['TGR',parts,current,word]);
				if (word.trim().length>0) {
					 // add grammar with this word
					// traverse tree
					if (current.hasOwnProperty(word)) {
						current = current[word];
					
					// create new tree node
					} else {
						current[word] = {};
						current = current[word];
					}
				}
				// last token, assign grammar
				if (parts.length == 1) {
					current['::GRAMMAR::']=grammar;
				} 
				return current;
			}
			
			/**
			 * Add the first token of rule to the current tree node and 
			 * traverse to the new node.
			 * Call recursively until rule is empty.
			 */
			function addGrammarRecursive(rule,grammar,current) {
				var parts=rule.split(' ');
				var word = parts[0];
				// is this token optional
				if (word.slice(0,1) == "[" && word.slice(-1) == "]" ) {
					// extra head to tree iteration without this token
					var current2 = current;
					addGrammarRecursive(parts.slice(1).join(" "),grammar,current2);
					
					// process the optional word as a normal token too
					word = word.slice(1,-1); 
				} else if (word.slice(0,1) == "[") { 
					// iterate tokens looking for close
					//console.log(['unfinished start']);
					var i = 0
					for (  i = 0; i < parts.length && parts[i].slice(-1) != "]"; i++) {
						
					}
					//console.log(['unfinished end',parts.length,i]);
					if (i == parts.length) throw new SpeechifyGrammarException('Missing end bracket ]') ;
					var multiToken = parts.slice(0,i+1).join(" ").split("|");
					console.log(['unfinished MM',multiToken]);
					multiToken[0] = multiToken[0].slice(1);
					multiToken[multiToken.length -1] = multiToken[multiToken.length -1].slice(0,-1);
					// add a grammar for each | OR option
					var j = 0;
					for ( j = 0; j < multiToken.length; j++) {
						// new rule 
						var tempRule = multiToken[j].trim();
						if (parts.length > (i + 1)) {
							tempRule = tempRule + ' ' + parts.slice(i + 1).join(' ');
						}
						console.log(['temprule',tempRule,multiToken[i]]);
						var current2 = current;
						addGrammarRecursive(tempRule,current2,grammar);
					}
					// add a grammar that skips this token
					var current3 = current;
					addGrammarRecursive(parts.slice(1).join(" "),grammar,current3);
					
				}
				//console.log(['AGR',rule,current]);
				// process this token
				current = traverseGrammar(parts,current,word,grammar);
				//console.log(['AGR2',current]);
				if (parts.length>1) {
					addGrammarRecursive(parts.slice(1).join(" "),grammar,current);
				}
			}
			
			/*******************
			 * Index the provided grammars by word as a tree
			 * into the variable activeGrammars
			 ******************/
			function addGrammars(grammars,activeGrammars)  {
				$.each(grammars,function(grammarKey,grammar) {
				//console.log(['grammar',grammar]);
					$.each(grammar.texts,function(ruleKey,rule) {
						addGrammarRecursive(rule,grammar,activeGrammars);
					});
				});
				console.log(['active grammar',activeGrammars]);
				
			} 

			/**
			 * Traverse the active grammars tree using transcript tokens
			 * allow for variables and optional tokens
			 * TODO there must be a fixed token between variables
			 */
			function searchForGrammar(transcript,activeGrammars,variables,partialMatchCallback,successCallback) {
				console.log(['searchForGrammar',transcript,activeGrammars]);
				if (activeGrammars != null && transcript && transcript.length > 0)  {
					//console.log(['REALLY searchForGrammar']);
					
					var parts = transcript.split(" ");
					var current = activeGrammars;
					var done = false;
					var word = parts[0];
					// if there is an exact match for next transcript token
					if (activeGrammars.hasOwnProperty(word)) {
						// first recurse (deepest first)
						searchForGrammar(parts.slice(1).join(" "),activeGrammars[word],variables,partialMatchCallback,successCallback);
						// no match deeper in the tree then check if there is a match here
						if (isGrammarNode(activeGrammars[word])) {
							successCallback(activeGrammars[word]['::GRAMMAR::'],variables);
						}
					// optional version ??
					}
					if (false && hasOptionalNodes(current)) {
						var optionalNodes = getOptionalNodes(current);
						//console.log(['HAS OPTIONAL NODES ',optionalNodes]);
						for (optionalNodeKey in optionalNodes) {
							var optionalNode = optionalNodes[optionalNodeKey];
							// is present, search deeper
							if ("("+word+")" == optionalNode) {
								//console.log(['IS PRESENT']);
								searchForGrammar(parts.slice(1).join(" "),activeGrammars["("+word+")"],variables,partialMatchCallback,successCallback);
								if (isGrammarNode(activeGrammars["("+word+")"])) {
									successCallback(activeGrammars["("+word+")"]['::GRAMMAR::'],variables);
								}
							// not present, search deeper from here
							} else {
								//console.log(['not PRESENT']);
								if (parts.length>0) {
									//console.log(['not PRESENT check deeper']);
									searchForGrammar(parts.slice(1).join(" "),activeGrammars[optionalNode],variables,partialMatchCallback,successCallback);
								}
								if (isGrammarNode(activeGrammars[optionalNode])) {
									//console.log(['not PRESENT here OK ',optionalNode,activeGrammars[optionalNode],activeGrammars]);
									successCallback(activeGrammars[optionalNode]['::GRAMMAR::'],variables);
								}
							}
							
						}
					// otherwise are there any variables to try
					}
					if (hasVariable(current)) {
						var currentVariables = getVariables(current);
						console.log(['HAS VARIABLES ',currentVariables]);
						// iterate variables
						for (var theVar in currentVariables) {
							var currentVar=currentVariables[theVar];
							// iterate all end slices of the transcript
							var theRest = parts.slice(1);
							variables[currentVar] = parts.slice(0,1).join(" ");
							while (theRest.length>0) {
								console.log(['TRY TRANSCRIPT SLICE',theRest,currentVar,current[currentVar]])
								// recursively searching for grammars
								searchForGrammar(theRest.join(" "),current[currentVar],variables,partialMatchCallback,successCallback);
								theRest = theRest.slice(1);
								variables[currentVar] = variables[currentVar] + ' '+ theRest.slice(0,1).join(" ");
							}
							console.log(['no kids found for',currentVar]);
							// if  nothing more specific found, is the variable a grammar node ?
							if (isGrammarNode(current[currentVar])) {
								console.log(['FIN: variable last']);
								variables[currentVar]=parts.join(' ');
								successCallback(current[currentVar]['::GRAMMAR::'],variables);
							}
						}
					}
				}
			}
			/**
			 * Search the activeGrammars tree for the transcript
			 * Recursively call searchForGrammar on potentially matching 
			 * subbranches of the tree
			 * Iteration is in order of precedence, deepest first.
			 * If a grammar match is found, immediately exit all recursion 
			 * and call the grammar.callback function with the grammar and any collected variables.
			 * Where a grammar partially matches the transcript ...
			 * When a grammar 
			 * @return null
			 * @param transcript String transcript of spoken voice 
			 * @param activeGrammars object Grammar tree
			 */
			function processTranscript(transcript,activeGrammars) {
				// require parameter values
				//console.log(['AG',activeGrammars]);
				if (transcript && typeof activeGrammars == "object"  && Object.keys(activeGrammars).length > 0) {
					console.log(['START PROCESS TRANSCRIPT']);
					var variables = {};
					// start recursive seek grammar
					try {
						searchForGrammar(
							transcript,
							activeGrammars,
							variables,
							function(a,b) {
								console.log(['PARTIAL',a,b]);
							},
							function (grammar,variables) {
								console.log(['SUCCESS pre',grammar,variables]);
								// abuse exceptions as break out from any recursive depth
								throw new SpeechifySuccessException(grammar,variables);
							}
						);
						// if we make it this far, there were no matches anywhere
						console.log(['FAIL']);
					} catch (e) {
						if (e instanceof SpeechifySuccessException) {
							console.log(['SUCCESS',e.grammar,e.variables]);
							e.grammar.callback(e.variables);
						} else {
							console.log(['GENERAL ERROR',e]);
						}
					}
				}
			}

			
			function bindTextEntries(pluginDOM) {
					$('input[type=text],input[type=search]',pluginDOM).on('click.speechifytext',function() {
					$(this).unbind('blur.speechifytext');
					$(this).bind('blur.speechifytext',function() {
						//console.log('stop text entry');
					});
					//console.log('start text entry');
					startRecognising();
				});
				$('textarea',pluginDOM).on('mouseup.speechifytextarea',function() {
					$(this).unbind('blur.speechifytextarea');
					$(this).bind('blur.speechifytextarea',function() {
						//console.log('stop textarea entry');
					});
					//console.log('start textarea entry');
					startRecognising();
				});
				$('[contenteditable=true]',pluginDOM).on('focus',function() {
					$(this).unbind('blur.speechifycontenteditable');
					$(this).bind('blur.speechifycontenteditable',function() {
						//console.log('stop contenteditable entry');
					});
					//console.log('start contenteditable entry');
					startRecognising();
				});
			}
			
			function startRecognising() {
				//console.log('start');
				// if we're already listening, just restart the speech handler
				try {
					speechRecognitionHandler.start();
				} catch (e) {}	
					
				handlerStarted=true;
					
				if (!recognising) {
					recognising=true;
					// update and rebind microphone button
					var status=$('#speechify-status');
					if (status && status.length>0)  {
					} else {
						// create notify DOM
						$(pluginDOM).append('<div id="speechify-status" ></div>');
						$('#speechify-status').attr('style','position: fixed; top: 20px; right: 20px;');
					}	
					$('#speechify-status').unbind('click.speechifystart').bind('click.speechifystart',function() {stopRecognising();});
					$('#speechify-status').html('<span class="microphone microphone-on"><img alt="on" src="'+$.fn.speechify.relPath+'images/microphone.png" ><span class="speechifymessages" ><div class="message" >Start/Stop/Pause Listening or click the microphone.</div><div class="message" >Try .. what can I say</div></span></span>').show();
					// bind voice editing for text entries
					bindTextEntries(pluginDOM)
				}
			}
			function pauseRecognising() {
				if (recognising) {
					$('#speechify-status').html('<div class="microphone microphone-pause"><img alt="pause" src="'+$.fn.speechify.relPath+'images/microphonepause.png" /></div>');
					$('.voice-help').hide();
					recognising=false;
				}
			}

			function stopRecognising() {
				if (recognising) {
					recognising=false;
					handlerStarted=false;
					speechRecognitionHandler.stop();
					
					// update and rebind microphone button
					$('#speechify-status').html('<span class="microphone microphone-off"><img alt="off" src="'+$.fn.speechify.relPath+'images/microphonepause.png" ></span>');
					$('#speechify-status').unbind('click.speechifystart').bind('click.speechifystart',function() {startRecognising();});
					$('.voice-help').hide();
				}
			}
			
			function joinThreeStrings(a,b,c) {
				var res=[];
				if (a && a.length>0) res.push(a);
				if (b && b.length>0) res.push(b);
				if (c && c.length>0) res.push(c);
				return res.join(' ');
			}
			
			function getInputSelection(el) {
				if (el) {
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
			}
			
			function soundex(s) {
				var a = s.toLowerCase().split(''),
				f = a.shift(),
				r = '',
				codes = {
					a: '', e: '', i: '', o: '', u: '',
					b: 1, f: 1, p: 1, v: 1,
					c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
					d: 3, t: 3,
					l: 4,
					m: 5, n: 5,
					r: 6
					};
				r = f +a.map(function (v, i, a) { return codes[v] })
				.filter(function (v, i, a) {
				return ((i === 0) ? v !== codes[f] : v !== a[i - 1]);
				})
				.join('');

				return (r + '000').slice(0, 4).toUpperCase();
			};
			
			// PLUGIN INIT STARTS HERE
			
			try {
				var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
				if (!SpeechRecognition) {
					return null;
				}
				//var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
				//var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

				var speechRecognitionHandler = new SpeechRecognition();
				speechRecognitionHandler.lang='en-AU';
				speechRecognitionHandler.continuous = false;
				speechRecognitionHandler.maxAlternatives = 5;
				
				
				speechRecognitionHandler.onresult = function(event){
					console.log(['RESULT',event.results,event]);
							
					for (var i = event.resultIndex; i < event.results.length; ++i) {
						if (event.results[i].isFinal) {
							transcript = $.trim(event.results[i][0].transcript);
							//console.log('PRE:'+transcript);
							// what command
							if (transcript=="start listening" || transcript=="wake up") {
								startRecognising();
							}  else if (transcript=="pause listening" || transcript=="go to sleep") {
								pauseRecognising();
							} else if (transcript=="stop listening") {
								stopRecognising();
							} else if (recognising) {
								//console.log(['regnising OKdoke']);
								// HANDLE EDITABLE TEXT FIELDS
								if ($('input[type=text]:focus').length>0) {
									console.log(['focus']);
									$('input[type=text]:focus').val(transcript)
								} else if ($('textarea:focus').length>0) {
									console.log(['tfocus']);
									var sel = getInputSelection($('textarea:focus')[0]);
									var val = $($('textarea:focus')).val();
									//$(captureTarget).data('oldval',val);
									$($('textarea:focus')).val(joinThreeStrings($.trim(val.slice(0, sel.start)),transcript,$.trim(val.slice(sel.end))));
								} else if ($('*[contenteditable=true]:focus').length>0) {
									console.log(['cfocus']);
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
								// START MAIN DECISION MAKING HERE
								} else {
									processTranscript(transcript,activeGrammars);
								}
								console.log('COMMAND:'+transcript);
							} else {
								console.log('IGNORE:'+transcript);
							}
						}
					}
				};
				
				speechRecognitionHandler.onstart = function(){
					//console.log('start speech recognition');
				};
				speechRecognitionHandler.onerror = function(e){
					switch (e.error) {
						case 'network':
						case 'no-speech':
						//	stopRecognising();
							startRecognising();
							break;
						case 'not-allowed':
						case 'service-not-allowed':
							stopRecognising();
							break;
						default: 
							console.log(['UNKNOWN ERROR', e]);
					}
				};
				
				// restart recognition on successful end 
				speechRecognitionHandler.onend = function(e){
					//stopRecognising();
					//console.log('finished recognition');
					if (recognising) {
						startRecognising();
					}
				};
				
				startRecognising();
			} catch (e) {
				console.log(e.message);
			}
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

	$.fn.speechify.relPath='';

	$.fn.speechify.say=function(text) {
		var msg = new SpeechSynthesisUtterance(text);
		window.speechSynthesis.speak(msg);
	};

	// duration 0 for persistent message
	$.fn.speechify.notify=function(text,duration) {
		var newMessage=$('<span class="message" >' + text + '</span>');
		duration = duration!==undefined ? duration : 3000
		$("#speechify-status .microphone .speechifymessages").html(newMessage);
		$("#speechify-status .microphone .speechifymessages").show();
		if (duration > 0) {
			setTimeout(function() {
				newMessage.hide('slow');
				$("#speechify-status .microphone .speechifymessages").hide('slow');
			},duration);
		}
	};
}) (jQuery,window,undefined);



	
	
/*
 * // first commands and buttons
								
								// CLICK ON SELECTED RECORD
								// TODO WARNING MULTIPLE SELECTION
								if ($('.speechify-selected',pluginDOM).length==1 && (transcript=="okay" || transcript=="click")) {
									//console.log('ok selection',$('.speechify-selected',pluginDOM));
									$('.speechify-selected',pluginDOM).each(function() {$(this).click()});
									$('.speechify-selected',pluginDOM).removeClass('speechify-selected');
								} else {
									//console.log('not ok selection - continue',options);
									var executionCompleted=false;
									// query options.commands
									//var done=false;
									// ANY CONFIGURED COMMANDS MATCHING ?
									if (options.commands) {
										//console.log(options.commands);
										$.each(options.commands,function(key,value) {
										//console.log(key,value);
											//console.log('try command '+key,value);
											if ($.trim(transcript).indexOf(key)==0) {
												//console.log('do command '+key,transcript,$.trim(transcript).split(key));
												executionCompleted=true;
												// TODO ?? PARAMETERS
												value($.trim(transcript).split(key)[1]); 
											}
										});
									}
									// TRY FOR A MATCH WITH BUTTONS AND LINKS
									if (!executionCompleted) {									
										var matches=[];
										$("a:contains('"+transcript+"')",pluginDOM).each(function() {matches.push(this);});
										//	input type=button|submit|image value|name
										$("input[type=submit],input[type=button],input[type=image]",pluginDOM).each(function() { console.log(this); if (this.value.toLowerCase()==transcript.toLowerCase()) matches.push(this);});
										console.log('MATCHES',matches);
										if (matches.length>0) {
											$('.speechify-selected',pluginDOM).each(function() {$(this).removeClass("speechify-selected")});
											$.each(matches,function() {
												$(this).addClass("speechify-selected");
											});
											executionComplete=true;
										}
									}
									
								}
								
 * */
