// EDITOR FUNCTIONS TO BE USED FOR VOICE COMMANDS
var SpringyMap = {
	putMap: function (name) {
		var storeKey = 'springymap_default';
		// explicit name yay
		if (typeof name == "string" && name.length > 0) {
			storeKey = name;
		// have we previously saved ?
		} else if (localStorage.getItem("springymap_active") != null && localStorage.getItem(localStorage.getItem("springymap_active")) != null) {
			storeKey = localStorage.getItem("springymap_active");
		} 
		if (storeKey.length > 0) {
			var store = {nodes: graph.nodes, edges: graph.edges};
			localStorage.setItem(storeKey,JSON.stringify(store));
			localStorage.setItem("springymap_active",storeKey);
			localStorage.setItem("springymap_"+storeKey+"_nextNodeId",graph.nextNodeId);
			localStorage.setItem("springymap_"+storeKey+"_nextEdgeId",graph.nextEdgeId);
			// save selection
			var selectedId = (graph.getSelected() != null && graph.getSelected().hasOwnProperty('id')) ? graph.getSelected().id : null;
			localStorage.setItem("springymap_"+storeKey+"_selected",selectedId);
		}
	},

	getMap: function (name) {
		var storeKey = 'springymap_default';
		if (typeof name == "string" && name.length > 0 && localStorage.getItem(name)!=null) {
			storeKey = name;
		} else if (localStorage.getItem("springymap_active") != null && localStorage.getItem(localStorage.getItem("springymap_active")) != null ) {
			storeKey =  localStorage.getItem("springymap_active");
		} 
		var storedGraph = JSON.parse(localStorage.getItem(storeKey));
		console.log(['STORE',storeKey,storedGraph]);
		if (storedGraph != null) 	{
			console.log(['LOADFROMSTORAGE',storedGraph]);
			graph.edges = [];
			graph.nodes = [];
			graph.nodeSet = {};
			for (var i = 0; i < storedGraph.nodes.length; i++) {
				graph.addNode(new Springy.Node(storedGraph.nodes[i].id,storedGraph.nodes[i].data)); //[i]
			}
			for (var i = 0; i < storedGraph.edges.length; i++) {
	//			console.log(['create edge',storedGraph.edges[i].id,storedGraph.edges[i].source,storedGraph.edges[i].target,storedGraph.edges[i].data]);
	//			console.log(['create edge related',graph.nodeSet[storedGraph.edges[i].source.id],graph.nodeSet[storedGraph.edges[i].source.id],storedGraph.edges[i].data]);
				graph.addEdge(new Springy.Edge(storedGraph.edges[i].id,graph.nodeSet[storedGraph.edges[i].source.id],graph.nodeSet[storedGraph.edges[i].target.id],storedGraph.edges[i].data));
			} 
			localStorage.setItem("springymap_active",storeKey);
			graph.nextNodeId = localStorage.getItem("springymap_"+storeKey+"_nextNodeId");
			graph.nextEdgeId = localStorage.getItem("springymap_"+storeKey+"_nextEdgeId");
			// restore selection 
			if (localStorage.getItem("springymap_"+storeKey+"_selected") !=null && graph.nodeSet.hasOwnProperty(localStorage.getItem("springymap_"+storeKey+"_selected"))) {
				graph.setSelected(graph.nodeSet[localStorage.getItem("springymap_"+storeKey+"_selected")]);
			}
		} else {
			SpringyMap.addSampleDataToGraph(graph);
		}
		return storedGraph;
	},
	addNode: function(parameters) {
		var variables = parameters[1];
		speechify.requireVariable('$content','Describe the note ?',variables, function(value) {
			var s = graph.getSelected();
			var b = graph.newNode({label: value});
			if (s != null && s.hasOwnProperty('id')) {
				graph.addEdges([b.id,s.id])
				jQuery.fn.speechify.notify('Added note <b>' + value + '</b> to <b>' + s.data.label + '</b>.' );
			} else {
				jQuery.fn.speechify.notify('Added note <b>' + value + '</b>.' );
				// if we didn't connect to an existing selected node, select ourselves for future children 
				graph.setSelected(b);
			}
			SpringyMap.putMap();
			renderer.graphChanged();
		},function() {
			jQuery.fn.speechify.notify('Cannot add an empty note.' );
		});
	},
	selectNode: function(parameters) {
		var variables = parameters[1];
		speechify.requireVariable('$content','Which note do you want to select ?',variables, function(value) {
			var b = graph.findNodes(value);
			if (b != null && b.length > 0) {
				//console.log(['muti OK']);
				if (b.length > 1) {
					//console.log(['muti said many ']);
					speechify.ask('There are '+b.length+' matching notes. Say a number to choose between them.',[
					[['[number] $number'],function(parameters) {
						// convert to int
						var chosen = parameters[1]['$number'].replace("number ","");
						//console.log(['CHOSEN',chosen]);
						chosen = parseInt(chosen.replace("one","1").replace("two","2").replace("three","3").replace("four","4").replace("five","5").replace("six","6").replace("seven","7").replace("eight","8").replace("nine","9"));
						console.log(['CHOSEN',chosen, typeof chosen]);
						if (typeof chosen == "number" && !isNaN(chosen) ) {
							if (chosen > 0 && b[chosen-1] != null) {
								graph.setSelected(b[chosen-1]);
								renderer.graphChanged();
								jQuery.fn.speechify.notify('Select note <b>' + value + ' number ' +chosen+ ' of '+b.length+' </b>? <b>Yes</b>, <b>No</b> or <b>Try another number</b>' ,0);
							} else {
								jQuery.fn.speechify.notify('Could not select note <b>' + value + ' number ' +chosen+ ' of '+b.length+' </b> <b>Try another number</b>' );
								console.log(b);
							}
						} else {
							jQuery.fn.speechify.notify('Could not recognise a number. There are '+b.length+' matching notes. Say a number to choose between them.');
						}
					}],
					[['cancel','no'],function() {
						speechify.clearOverlay();
						graph.setSelected(null);
						renderer.graphChanged();
						jQuery.fn.speechify.notify('Cancelled selection.');
					}],
					[['ok|okay', 'yes'],function() {
						speechify.clearOverlay();
						jQuery.fn.speechify.notify('Selected.');
					}],
					]);
				} else {
					graph.setSelected(b[0]);
					jQuery.fn.speechify.notify('Selected note <b>' + value + '</b>.' );
					renderer.graphChanged();
				}
			} else {
				jQuery.fn.speechify.notify('Selection failed. Cannot find note <b>' + value + '</b>.' );
			}
			
		},function() {
			jQuery.fn.speechify.notify('Cancelled.' );
		});
	},
	selectNothing: function(params) {
		graph.setSelected(null);
		renderer.graphChanged();
	},
	editNode: function(params) {
		var variables = params[1];
		speechify.requireVariable('$node','Which note do you want to edit ?',variables, 
			function(value) {
				var node = null;
				if (value == "selected") {
					if (graph.getSelected() != null)  {
						node = graph.getSelected();
					}
				} else {
					node = graph.findNode(value);
				}
				if (node == null) {
					jQuery.fn.speechify.notify("Can't find <b>"+value+"</b> to edit.");
				} else {
					graph.setSelected(node);
					graph.setEdited(node);
					// clear the span.selectedtext tags
					node.data.content = $('<b>'+(Boolean(node.data.content) ? node.data.content : '') +'</b>').text();
					renderer.graphChanged();
					var message = "Editing <b>"+node.data.label+"</b>. <br>Text entry commands include<ul><li>stop editing</li><li>select <i>text fragment</i></li><li>replace with <i>text fragment</i></li></ul>.<br>Or just speak to dictate words after the cursor or at the end of the note.";
					var selectedText='';
					var selectedTextPosn=-1;
					var selectedTextBefore='';
					var selectedTextAfter='';
					var previousText='';
					var resetSelection = function() {
						// clear the span.selectedtext tags
						node.data.content = $('<b>'+(Boolean(node.data.content) ? node.data.content : '')+'</b>').text();
						selectedText='';
						selectedTextPosn=-1;
						selectedTextBefore='';
						selectedTextAfter='';
						SpringyMap.putMap();
						renderer.graphChanged();
					}
					// ensure position is relative to clean text(no selected tags)
					var setSelection = function(value,posn) {
						node.data.content=(Boolean(node.data.content) ? node.data.content : '');
						if (posn !==-1) { 
							// keep calculations/text fragments for later
							selectedTextPosn=posn;
							selectedTextBefore=node.data.content.slice(0,posn);
							selectedTextAfter=node.data.content.slice(posn + value.length);
							selectedText = value;
							// update the content
							node.data.content = selectedTextBefore + '<span class="selectedtext" >' + value + '</span>' + selectedTextAfter;
							return true;
						} else {
							return false;
						}
					}
					speechify.ask(message,[
						[['stop|finish|quit editing','cancel'],function(parameters) {
							resetSelection();
							graph.setEdited(null);
							speechify.clearOverlay();
							jQuery.fn.speechify.notify('Finished editing.');
						}],
						[['reddit|edit [note|node] [$node]'+ multiContent],function(params) {
							resetSelection();
							SpringyMap.editNode(params);
						}
						],
						[['select [text] [$content]'],function(parameters) {
							console.log(['select text',parameters[1]]);
							speechify.requireVariable('$content','What text do you want to select ?',parameters[1], 
								function(value) {
									console.log(['selected text callback',value]);
									if (value =="all" || value =="everything") {
										resetSelection();
										setSelection($('<b>'+(Boolean(node.data.content) ? node.data.content : '')+'</b>').text(),0);
										renderer.graphChanged();
										SpringyMap.putMap();
										jQuery.fn.speechify.notify('Selected everything.');
									} else if (value =="nothing") {
										resetSelection();
										jQuery.fn.speechify.notify('Selected nothing.');
									} else if (node.data.content != null)  {
										// clear the span.selectedtext tags
										node.data.content = $('<b>'+(Boolean(node.data.content) ? node.data.content : '')+'</b>').text();
							
										var posn = node.data.content.indexOf(value);
										if (setSelection(value,posn)) {
											renderer.graphChanged();
											SpringyMap.putMap();
											jQuery.fn.speechify.notify('Selected text '+value);
										} else {
											jQuery.fn.speechify.notify('Could not find text '+value);
										}
									} else {
										jQuery.fn.speechify.notify('Could not select in empty content.');
									}
								},
								function(e) {
									resetSelection();
									jQuery.fn.speechify.notify('Cancelled editing.');
								}
							);
						}],
						[['replace [selected|text] with [$content]'],function(parameters) {
							speechify.requireVariable('$content','What text do you want to inject ?',parameters[1], 
								function(value) {
									node.data.content = selectedTextBefore + value + selectedTextAfter;
									jQuery.fn.speechify.notify('Replaced  <b>' + selectedText + '</b> with <b>' +value + '</b>');
									renderer.graphChanged();
									SpringyMap.putMap();
								}
							);
						}],
						[['(cancel that|undo|scratch that)'],function() {
							speechify.confirm('Really undo text change ?<br/><b>Yes</b> or <b>No</b>',function() {
								node.data.content = previousText ;
								resetSelection();
								renderer.graphChanged();
								SpringyMap.putMap();
								jQuery.fn.speechify.notify('Restored.');
							})
						}],
						[['delete that|selected'],function() {
							if (selectedText.trim().length > 0) {
								console.log([selectedTextBefore ,selectedTextAfter]);
								speechify.confirm('Really delete text <b>'+ selectedText +'</b> ?<br/><b>Yes</b> or <b>No</b>',function() {
									previousText = $('<b>'+node.data.content+'</b>').text();
									var tmp = selectedTextBefore + ' ' + selectedTextAfter;
									node.data.content = tmp.trim();
									resetSelection();
									renderer.graphChanged();
									SpringyMap.putMap();
									jQuery.fn.speechify.notify('Deleted.',3000);
								});
							} else {
								jQuery.fn.speechify.notify('No text selected to delete.',3000);
							}
						}],
						[['full stop','.'],function() {
							previousText = $('<b>'+node.data.content+'</b>').text();
							renderer.graphChanged();
							jQuery.fn.speechify.notify('TODO fullstop.');
						}],
						[['comma','.'],function() {
							previousText = $('<b>'+node.data.content+'</b>').text();
							renderer.graphChanged();
							jQuery.fn.speechify.notify('TODO comma.');
						}],
						
						[['$content'],function(parameters) {
							previousText = $('<b>'+node.data.content+'</b>').text();
							// clear the span.selectedtext tags
							node.data.content = $('<b>'+node.data.content+'</b>').text();
							
							if (selectedText.length>0 && selectedTextAfter.length > 0) {
								node.data.content = selectedTextBefore + selectedText + ' ' + parameters[1]['$content'] + ' ' + selectedTextAfter;
								var tmp = selectedTextBefore + selectedText;
								setSelection(parameters[1]['$content'],tmp.length+1 );
								jQuery.fn.speechify.notify('Injected '+ parameters[1]['$content']);
							} else { 
								var initialLength = (node.data.content ? node.data.content.length : 0);
								node.data.content = (node.data.content ? node.data.content : '') + ' '+ parameters[1]['$content'];
								setSelection(parameters[1]['$content'],initialLength + 1);
								jQuery.fn.speechify.notify('Appended '+ parameters[1]['$content']);
							}
							renderer.graphChanged();
							SpringyMap.putMap();
						}]
					]);
				}
			}
		);
	},
	renameNode: function(params) {
		//console.log(['rename node']);
		var variables = params[1];
		speechify.requireVariable('$node','Which note do you want to rename ?',variables, 
			function(value) {
				var node = null;
				if (value == "selected") {
					if (graph.getSelected() != null)  {
						node = graph.getSelected();
					}
				} else {
					node = graph.findNode(value);
				}
				if (node == null) {
					jQuery.fn.speechify.notify("Can't find <b>"+value+"</b> to rename.");
				} else {
					graph.setSelected(node);
					speechify.requireVariable('$newName','What do you want to rename the note to ?',variables, 
						function(value2) {
							speechify.confirm("Rename <b>"+node.data.label+"</b> to <b>"+value2+"</b>? <b>Yes</b> or <b>No</b>",function() {
								console.log(['REALLY RENAME',value,value2,node,variables]);
								
								node.data.label = value2;
								jQuery.fn.speechify.notify("Renamed <b>"+value+"</b> to <b>"+value2+"</b>.");
								SpringyMap.putMap();
								renderer.graphChanged();
							});
						},
						function() { // fail
							jQuery.fn.speechify.notify("Cancel rename.");
						}
					);
				}
			},
			function() { // fail
				jQuery.fn.speechify.notify("Cannot rename.");
			}
		); 
	},
	recursiveDeleteNode: function(node) {
		var children = graph.findChildren(node);
		for (i=0; i < children.length; i++) {
			SpringyMap.recursiveDeleteNode(children[i]);
			graph.detachNode(children[i]);
			graph.removeNode(children[i]);
		}
		graph.detachNode(node);
		graph.removeNode(node);
	},
	reallyDeleteNode: function(node) {
		graph.setSelected(node);
		speechify.confirm('Do you really want to delete note <b>'+node.data.label+'</b>  <b>Yes</b> or <b>No</b>',function() {
			var children = graph.findChildren(node);
			if (children.length > 0) {
				speechify.confirm('WARNING !!!<br/>The note <b>'+node.data.label+'</b> contains '+children.length+' other notes.<br/> Do you want to delete this note AND ALL ITS CHILDREN?  <b>Yes</b> or <b>No</b>',function() {
					SpringyMap.recursiveDeleteNode(node);
					SpringyMap.putMap();
					renderer.graphChanged();
					jQuery.fn.speechify.notify('Deleted <b>' + node.data.label + '</b> and all its children	.' );
				});
			} else {
				graph.detachNode(node);
				graph.removeNode(node);
				SpringyMap.putMap();
				renderer.graphChanged();
				jQuery.fn.speechify.notify('Deleted <b>' + node.data.label + '</b>.' );
			}
		});
	},
	deleteNode: function(params) {
		var variables = params[1];
		speechify.requireVariable('$node','Which note do you want to delete ?',variables, 
			function(value) {
				if (value == 'selected node' || value == 'selected note' || value == 'selected') {
					var s = graph.getSelected();
					//console.log(['start DONE remove selected',s]);
					if (s!=null && s.hasOwnProperty('id')) {
						SpringyMap.reallyDeleteNode(s);
					} else {
						jQuery.fn.speechify.notify('No selected note to delete.' );
					}
				} else {
					var nodes = graph.findNodes(value);
					if (nodes.length >1) {
						jQuery.fn.speechify.notify('Many notes match <b>'+value+'</b>. <br/>First select the note then <b>delete selected</b>' );
					} else {
						var node = graph.findNode(value);
						if (node != null && node.hasOwnProperty('id')) {
							graph.setSelected(node);
							SpringyMap.reallyDeleteNode(node);
						}
					}
				}
			},
			function() {
				jQuery.fn.speechify.notify('Cancel delete note.' );
			}
		);
	},
	moveNodeTo: function(node,variables,oldSelected) {
		speechify.requireVariable('top|selected|$target','Where do you want to move the note <b>'+node.data.label+'</b> to ?<br/><b>top</b>, <b>selected</b> or the name of a note.',variables, 
			function(value) {
				if (value == 'top' ) {
					
				} else if (value == 'selected node' || value == 'selected note' || value == 'selected') {
					var s = oldSelected;
					//console.log(['start DONE remove selected',s]);
					if (s!=null && s.hasOwnProperty('id')) {
						graph.detachNode(node);
						graph.addEdges([node.id,s.id]); //,{label: variables['$connection']}]);
						jQuery.fn.speechify.notify('Moved note <b>' + node.data.label + '</b> to <b>' + s.data.label + '</b>.' );
						SpringyMap.putMap();
						renderer.graphChanged();
					} else {
						jQuery.fn.speechify.notify('No selected note to move.' );
					}
				} else {
					var nodes = graph.findNodes(value);
					if (nodes.length >1) {
						jQuery.fn.speechify.notify('Many notes match <b>'+value+'</b>. <br/>First select the note then <b>move selected to XXX</b>' );
					} else if (nodes.length ==1) {
						var target = graph.findNode(value);
						if (target != null && target.hasOwnProperty('id')) {
							graph.setSelected(oldSelected);
							graph.detachNode(node);
							graph.addEdges([node.id,target.id]); //,{label: variables['$connection']}]);
							jQuery.fn.speechify.notify('Moved note <b>' + node.data.label + '</b> to <b>' + target.data.label + '</b>.' );
							SpringyMap.putMap();
							renderer.graphChanged();
						}
					} else {
						jQuery.fn.speechify.notify('Cannot find node '+value+'.' );
					}
				}
			},
			function() {
				jQuery.fn.speechify.notify('Cancelled.' );
			}
		);
	},
	moveNode: function(params) {
		var variables = params[1];
		var oldSelected = graph.getSelected();
		speechify.requireVariable('$node','Which note do you want to move ?',variables, 
			function(value) {
				if (value == 'selected node' || value == 'selected note' || value == 'selected') {
					var s = graph.getSelected();
					//console.log(['start DONE remove selected',s]);
					if (s!=null && s.hasOwnProperty('id')) {
						//SpringyMap.reallyDeleteNode(s);
						SpringyMap.moveNodeTo(s,variables,oldSelected);
					} else {
						jQuery.fn.speechify.notify('No selected note to move.' );
					}
				} else {
					var nodes = graph.findNodes(value);
					if (nodes.length >1) {
						jQuery.fn.speechify.notify('Many notes match <b>'+value+'</b>. <br/>First select the note then <b>move selected to XXX</b>' );
					} else {
						var node = graph.findNode(value);
						if (node != null && node.hasOwnProperty('id')) {
							graph.setSelected(node);
							renderer.graphChanged();
							//SpringyMap.reallyDeleteNode(node);
							SpringyMap.moveNodeTo(node,variables,oldSelected);
							//jQuery.fn.speechify.notify('nomove.' );
							//console.log(node);
						}
					}
				}
			},
			function() {
				jQuery.fn.speechify.notify('Could not move note.' );
			}
		);
	},
	/*
	joinNode: function(params) {
		var variables = params[1];
		var from = graph.findNode(variables['$from']);
		var to = graph.findNode(variables['$to']);
		if (from !=null && to !=null) {
			graph.addEdges([from.id,to.id]); //,{label: variables['$connection']}]);
			var connectMessage = "";
			if (variables.hasOwnProperty('$connection') && variables['$connection'].length > 0) {
				connectMessage = " as <b>" + variables['$connection']+"</b>";
			}
			jQuery.fn.speechify.notify('Added connection from <b>' + variables['$from'] + '</b> to <b>' + variables['$to'] + '</b>' +connectMessage+ '.' );
			SpringyMap.putMap();
			renderer.graphChanged();
		} else if (from == null) {
			jQuery.fn.speechify.notify("Couldn't create connection. Can't find <b>"+variables['$from']+"</b>");
		} else if (to == null) {
			jQuery.fn.speechify.notify("Couldn't create connection. Can't find <b>"+variables['$to']+"</b>");
		}
	},
	disconnectNode: 	function(params) {
		var variables = params[1];
		var from = graph.findNode(variables['$from']);
		var to = graph.findNode(variables['$to']);
		//console.log(['remove',from,to]);
		var connection = '';
		var connectionString = '';
		if (variables.hasOwnProperty('$connection')) {
			connection = variables['$connection'];
			connectionString = " as <b>" + variables['$connection']+"</b>";
		}
		if (from == null) {
			jQuery.fn.speechify.notify("Couldn't break connection. Can't find <b>"+variables['$from']+"</b>");
		} else if (to == null) {
			jQuery.fn.speechify.notify("Couldn't break connection. Can't find <b>"+variables['$to']+"</b>");
		} else {
			//console.log(['seek edges',variables['$from'],variables['$to'],connection]);
			var edges = graph.findEdges(variables['$from'],variables['$to']);
			var foundEdges = [];
			if (edges != null && edges.length > 0) {
				for (var i = 0;i < edges.length; i++) {
					var edge = edges[i];
					if (connection.length > 0 && edge.data.label == connection) {
						graph.removeEdge(edge);
						foundEdges.push(edge);
					} else if (connection.length == 0 ) {
						graph.removeEdge(edge);
						foundEdges.push(edge);
					}
				}
			}
			if (foundEdges.length > 0) {
				jQuery.fn.speechify.notify("Broke " +foundEdges.length+ " connection(s) matching <b>"+variables['$from']+"</b> to <b>"+variables['$to']+"</b>"+ connectionString);
				SpringyMap.putMap();
				renderer.graphChanged();
			} else {
				jQuery.fn.speechify.notify("No connections to break matching <b>"+variables['$from']+"</b> to <b>"+variables['$to']+"</b>"+ connectionString);
			}
		}
	},
	linkNode: function(params) {
		var variables = params[1];
		var from = graph.findNode(variables['$from']);
		var to = graph.findNode(variables['$to']);
		if (from !=null && to !=null) {
			graph.addEdges([from.id,to.id]); //,{label: variables['$connection']}]);
			var connectMessage = "";
			if (variables.hasOwnProperty('$connection') && variables['$connection'].length > 0) {
				connectMessage = " as <b>" + variables['$connection']+"</b>";
			}
			jQuery.fn.speechify.notify('Added connection from <b>' + variables['$from'] + '</b> to <b>' + variables['$to'] + '</b>' +connectMessage+ '.' );
			SpringyMap.putMap();
			renderer.graphChanged();
		} else if (from == null) {
			jQuery.fn.speechify.notify("Couldn't create connection. Can't find <b>"+variables['$from']+"</b>");
		} else if (to == null) {
			jQuery.fn.speechify.notify("Couldn't create connection. Can't find <b>"+variables['$to']+"</b>");
		}
	},
	unlinkNode: 	function(params) {
		var variables = params[1];
		var from = graph.findNode(variables['$from']);
		var to = graph.findNode(variables['$to']);
		//console.log(['remove',from,to]);
		var connection = '';
		var connectionString = '';
		if (variables.hasOwnProperty('$connection')) {
			connection = variables['$connection'];
			connectionString = " as <b>" + variables['$connection']+"</b>";
		}
		if (from == null) {
			jQuery.fn.speechify.notify("Couldn't break connection. Can't find <b>"+variables['$from']+"</b>");
		} else if (to == null) {
			jQuery.fn.speechify.notify("Couldn't break connection. Can't find <b>"+variables['$to']+"</b>");
		} else {
			//console.log(['seek edges',variables['$from'],variables['$to'],connection]);
			var edges = graph.findEdges(variables['$from'],variables['$to']);
			var foundEdges = [];
			if (edges != null && edges.length > 0) {
				for (var i = 0;i < edges.length; i++) {
					var edge = edges[i];
					if (connection.length > 0 && edge.data.label == connection) {
						graph.removeEdge(edge);
						foundEdges.push(edge);
					} else if (connection.length == 0 ) {
						graph.removeEdge(edge);
						foundEdges.push(edge);
					}
				}
			}
			if (foundEdges.length > 0) {
				jQuery.fn.speechify.notify("Broke " +foundEdges.length+ " connection(s) matching <b>"+variables['$from']+"</b> to <b>"+variables['$to']+"</b>"+ connectionString);
				SpringyMap.putMap();
				renderer.graphChanged();
			} else {
				jQuery.fn.speechify.notify("No connections to break matching <b>"+variables['$from']+"</b> to <b>"+variables['$to']+"</b>"+ connectionString);
			}
		}
	},*/
	resetMap: 	function(params) {
		//console.log('reset demo data');
		//graph = new Springy.Graph();
		speechify.confirm('Really clear map and load sample data?', function() {
			addSampleDataToGraph(graph);
			graph.setSelected(null);
			SpringyMap.putMap();
			renderer.graphChanged();
			jQuery.fn.speechify.notify('Map data reset to sample data');
		});
	},
	whatCanISay: 	function(params) {
		//console.log(['what can I say']);
		var commands ="";
		commands +="[] - indicates optional <br/>";
		commands +="| - OR options<br/>";
		
		commands +="<h3>Notes</h3>";
		commands +="<b>new</b> $thing [to $parent|selected] [as $connection]<br/>";
		commands +="<b>select</b> $thing<br/>";
		commands +="<b>rename</b> [$thing|selected] to $newName<br/>";
		commands +="<b>prepend</b> $thing to $parent|selected<br/>";
		commands +="<b>append</b> $thing to $parent|selected<br/>";
		commands +="<h3>Tree Operations</h3>";
		commands +="<b>move</b> $thing to top|selected|$parent<br/>";
		commands +="<h3>Maps</h3>";
		commands +="<b>new map</b> $name<br/>";
		commands +="<b>list maps</b><br/>";
		commands +="<b>what map am i using</b><br/> ";
		commands +="<b>open map</b> $name<br/>";
		commands +="<b>delete map</b> $name <b>now please</b><br/> ";
		commands +="<b>clear map</b> $name <b>now please</b><br/> ";
		commands +="<b>reset map to sample data</b><br/> ";
		commands +="<h3>Misc</h3>";
		commands +="<b>what can i say</b><br/> ";
		commands +="<b>go to sleep|pause listening</b><br/> ";
		commands +="<b>wake up|start listening</b><br/> ";
		commands +="<b>stop listening</b><br/> ";
		
		jQuery.fn.speechify.notify(commands);
	},
	openMap: 	function(params) {
		var variables = params[1];
		var notifyMessage = 'Available maps include <br/><br/>';
		for (var key in localStorage){
			if (!key.startsWith("springymap_")) {
				notifyMessage += '<b>' + key + '</b><br/>';
			}
		}
		speechify.requireVariable('$mapName','Which map do you want to open ?<br/>'+notifyMessage,variables, 
			function(value) {
				var map = SpringyMap.getMap(value);
				if (map != null) {
					//console.log(map);
					jQuery.fn.speechify.notify("Loaded map " +value);
					graph.setSelected(null);
					renderer.graphChanged();
				} else {
					jQuery.fn.speechify.notify("Couldn't load map " +value);
				}
			},
			function(value) {
				jQuery.fn.speechify.notify("Failed to load map " +value);
			}
		) 
	},
	saveMap: 	function(params) {
		//console.log(['saveMap',params]);
		var variables = params[1];
		speechify.requireVariable('$mapName','Save map as ?',variables, 
			function(value) {
				//TODO EXISTENCE CHECK
				speechify.confirm('Really save map as <b>'+value+'</b>? <b>Yes</b> or <b>No</b>', function() {
					SpringyMap.putMap(value)
					jQuery.fn.speechify.notify("Saved map as " + value);
				});
			},
			function() {
				jQuery.fn.speechify.notify('Cannot save. Missing name');
			}
		);
	},
	newMap: 	function(params) {
		//console.log(['newMap',params]);
		var variables = params[1];
		speechify.requireVariable('$mapName','Name of the new map ?',variables, 
			function(value) {
				speechify.confirm('Really create new map <b>'+value+'</b>? <b>Yes</b> or <b>No</b>', function() {
					graph.edges = [];
					graph.nodes = [];
					graph.nodeSet = {};
					SpringyMap.putMap(value)
					graph.setSelected(null);
					jQuery.fn.speechify.notify("Saved new map as " + value);
					renderer.graphChanged();
				});
			},
			function() {
				jQuery.fn.speechify.notify('Cannot save. Missing name');
			}
		);
	},
	listMaps: 	function(params) {
		//console.log(['list Maps',params]);
		// TODO CONFIRMATION
		var notifyMessage = 'Available maps include <br/><br/>';
		for (var key in localStorage){
			if (!key.startsWith("springymap_")) {
				notifyMessage += '<b>' + key + '</b><br/>';
			}
		}
		jQuery.fn.speechify.notify(notifyMessage);
	},
	deleteMap:	function(params) {
		//console.log(['delete Map',params]);
		var variables = params[1];
		var notifyMessage = 'Available maps include <br/><br/>';
		for (var key in localStorage){
			if (!key.startsWith("springymap_")) {
				notifyMessage += '<b>' + key + '</b><br/>';
			}
		}
		speechify.requireVariable('$mapName','Which map do you want to delete ?<br/> '+notifyMessage,variables, 
			function(value) {
				if (localStorage.getItem(value) != null)  {
					speechify.confirm('Really delete map <b>'+value+'</b>? <b>Yes</b> or <b>No</b>', function() {
						localStorage.removeItem(value);
						jQuery.fn.speechify.notify('Deleted map '+value);
					});
				} else {
					jQuery.fn.speechify.notify('Cannot find map '+value + ' to delete.' );
				}
			},
			function() {
				jQuery.fn.speechify.notify('Cancelled.' );
			}
		);
		
	},
	clearMap: function(params) {
		//console.log(['clear Map',params]);
		speechify.confirm('Do you really want to delete all notes from this map? <b>Yes</b> or <b>No</b>',function() {
			graph.edges = [];
			graph.nodes = [];
			graph.nodeSet = {};
			graph.setSelected(null);
			SpringyMap.putMap();
			renderer.graphChanged();							
			jQuery.fn.speechify.notify('Cleared the map.');
		});
	},
	whichMap: 	function(params) {
		// TODO CONFIRMATION
		jQuery.fn.speechify.notify('Current map is <b>' +localStorage.getItem('springymap_active') + '</b>');
	},
	addSampleDataToGraph: function(graph) {
		graph.addNodes('Dennis', 'Michael', 'Jessica', 'Timothy', 'Barbara')

		graph.addEdges(
		  ['Dennis', 'Michael', {color: '#00A0B0', label: 'Foo bar'}],
		  ['Michael', 'Dennis', {color: '#6A4A3C'}],
		  ['Michael', 'Jessica', {color: '#CC333F'}],
		  ['Jessica', 'Barbara', {color: '#EB6841'}],
		  ['Michael', 'Timothy', {color: '#EDC951'}],
		  ['Barbara', 'Timothy', {color: '#6A4A3C'}]
		);
	}

}
// GRAMMAR - SENTENCE PATTERNS TO FUNCTION MAPPING
var multiContent='{$c1 [$c2]}';// multiple tokens for variables
SpringyMap.grammarTree = [
		[['(adelaide|abnote|(add [a] note|node)) [$content]'],SpringyMap.addNode],
		[['select|choose|shoes|cheers|pick|pic [a|the] [note|node] [$content] [number $number]'],SpringyMap.selectNode],
		[['select|choose|shoes|cheers|pick|pic nothing'],SpringyMap.selectNothing],
		[['rename [$node'+ multiContent+'] [to $newName]' +multiContent],SpringyMap.renameNode],
		[['delete [a] [note|node] [$node]'+ multiContent],SpringyMap.deleteNode],
		[['reddit|edit [note|node] [$node]'+ multiContent],SpringyMap.editNode],
		//[['join|connect $from'+ multiContent+' to|and $to'+ multiContent+' [as $connection'+ multiContent+']'],SpringyMap.joinNode],
		//[['(disconnect|break|brake|remove connection) $from'+ multiContent+' to $to'+ multiContent+' [as $connection'+ multiContent+']'],SpringyMap.disconnectNode],
		[['movenote|move [note|node] [$node'+ multiContent+'] [to $target]'+ multiContent],SpringyMap.moveNode],
		//[['link $from'+ multiContent+' to|and $to'+ multiContent+' [as $connection'+ multiContent+']'],SpringyMap.linkNode],
		//[['unlink $from'+ multiContent+' to $to'+ multiContent+' [as $connection'+ multiContent+']'],SpringyMap.unlinkNode],
		[['what can i say'],SpringyMap.whatCanISay],
		[['open|load|road map|mac [$mapName]'],SpringyMap.openMap],
		[['save map [as] [$mapName]'],SpringyMap.saveMap],
		[['new map [as] [$mapName]'],SpringyMap.newMap],
		[['list|show [$trash'+ multiContent+'] maps'],SpringyMap.listMaps],
		[['delete map [$mapName]'],SpringyMap.deleteMap],
		[['clear [the] map'],SpringyMap.clearMap],
		[['what|which map|mac (is current|am i using)'],SpringyMap.whichMap]
	];
	
