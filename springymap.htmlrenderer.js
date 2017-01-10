var HtmlRenderer = function() {
	
	function isEditing(node) {
		var edited = graph.getEdited();
		//console.log(['CHECK EDITING',node,edited]);
		if (node!=null && node.hasOwnProperty('id') && edited!=null && edited.hasOwnProperty('id') && node.id == edited.id) {
			//console.log(['CHECK EDITING match']);
			return true;
		} else {
			return false;
		}
	}
	
	var methods = {
		graphChanged: function() {
			console.log('g changed');
			var content='';
			var rootNodes=[];
			var collatedByParent={};
			// find root nodes and collate all nodes by parent
			for (var i=0; i < graph.nodes.length; i++) {
				var node = graph.nodes[i];
				//console.log(['index node',node.id,node.data.label,graph.adjacency[node.id]?graph.adjacency[node.id]:'',graph.adjacency]);
				// do i have a parent
				if (graph.adjacency.hasOwnProperty(node.id)) {
					for ( var j in graph.adjacency[node.id]) {
						var parent = graph.adjacency[node.id][j];
						if (typeof collatedByParent[j] != 'object' ) {
							collatedByParent[j]=[];
						}
						collatedByParent[j].push(node.id);
					//	console.log(['j',j]);
					}
					
				} else {
					//console.log('root');
					rootNodes.push(node.id);
				}
			}
			//console.log(['root nodes ',rootNodes,'collated',collatedByParent]);
			// render rootnodes and then recursively
			for (var i=0; i < rootNodes.length; i++) {
				var depth = 0;
				var node = graph.nodeSet[rootNodes[i]];
				var selectedText='';
				var selectedTextN='';
				var thisSelection = graph.getSelected();
				//console.log(['SL',thisSelection]);
				if (thisSelection != null && thisSelection.id == node.id) {
					selectedText = ' class="selectednode" ';
				}
				if (isEditing(node)) {
					selectedTextN = ' editingnode';
				}
				content += '<div id="'+node.id+'" class="rootnode node' + selectedTextN + '" ><label'+ selectedText +'>' + node.data.label +'</label><div class="content" >' + (Boolean(node.data.content) ? node.data.content : '') +'</div>';
				
				// children of this node recursively
				content += methods.renderChildNodes(node,depth,collatedByParent);
				content += "</div>\n";
			}
			$('#textrender').html(content);
			//console.log(['new content ',content]);
		},
		renderChildNodes: function(node,depth,collated) {
			//console.log(['renderkids',node.id,typeof collated[node.id],collated[node.id]]);
			var content = '';
			if (collated.hasOwnProperty(node.id) && typeof collated[node.id] == 'object' ) {
				//console.log('renderkids real',collated[node.id],collated);
				
				for (var i=0; i < collated[node.id].length; i++) {
					var depth = 0;
					var child = graph.nodeSet[collated[node.id][i]];
					//console.log(['renderkids child',child]);
					var selectedTextI='';
					var selectedTextN='';
					var thisSelection = graph.getSelected();
					if (thisSelection != null && thisSelection.id == child.id) {
						selectedTextI = ' class="selectednode" ';
					}
					if (isEditing(child)) {
						selectedTextN = ' editingnode ';
						//console.log('is edtign ? ',child,isEditing(child));
					}
					content += '<div class="node'+ selectedTextN+'" id="'+child.id+'" '  +' ><label '+  selectedTextI +'>' + child.data.label +'</label><div class="content" >' + (Boolean(child.data.content) ? child.data.content : '') +'&nbsp;</div>';
					// children of this node recursively
					content += methods.renderChildNodes(child,depth+1,collated);
					content += "</div>\n";
				}
			} 
			//else {
			//	console.log('nokids');
			//}
			$('body').unbind('click').bind('click',function(e) {
				console.log(['CLICK',$(e.target).parent(),$(e.target)]);
				var nodeDiv = $(e.target).parent();
				if (nodeDiv.hasClass('node')) {
					console.log(['ISNODE',graph.getSelected()]);
					if (graph.getSelected() != null && graph.getSelected().id ==$(nodeDiv).attr('id') ) {
						console.log(['STARTEDIT']);
						// start editing
						$(e.target).attr('contenteditable',true);
						$(e.target).bind('blur',function() {
							$(this).attr('contenteditable',false);
							if ($(e.target).hasClass('content')) {
								console.log(['BLURANDSAVE content']);
								graph.nodeSet[$(nodeDiv).attr('id')].data.content = $(this).html();
							} else {
								console.log(['BLURANDSAVE label']);
								graph.nodeSet[$(nodeDiv).attr('id')].data.l = $(this).html();
							}
							SpringyMap.putMap();
							renderer.graphChanged();
							
						});				
					} else {
						graph.setSelected(graph.nodeSet[$(nodeDiv).attr('id')]);
						SpringyMap.putMap();
						renderer.graphChanged();
						e.stopImmediatePropagation();
					}
				}  else {
					graph.setSelected(null);
					SpringyMap.putMap();
					renderer.graphChanged();
					e.stopImmediatePropagation();
				}
			});
			return content;
		}
	};
	return methods;
}
