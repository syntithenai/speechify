var HtmlRenderer = function() {
	var selected = null;
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
				var thisSelection = graph.getSelected();
				//console.log(['SL',thisSelection]);
				if (thisSelection != null && thisSelection.id == node.id) {
					selectedText = ' class="selectednode" ';
				}
				content += '<div class="rootnode node" id="'+node.id+'"><h2'+ selectedText +'>' + node.data.label +'</h2><div class="content" >' + (node.data.content ? node.data.content : '') +'</div>';
				
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
					var thisSelection = graph.getSelected();
					if (thisSelection != null && thisSelection.id == child.id) {
						selectedTextI = ' class="selectednode" ';
					}
					var headingLevel = depth+3;
					if (headingLevel > 6) {
						headingLevel = 6;
					}
					content += '<div class="node" id="'+child.id+'" ><h' + headingLevel+ selectedTextI +'>' + child.data.label +'</h'+headingLevel+'><div class="content" >' + (child.data.content ? child.data.content : '') +'</div>';
					// children of this node recursively
					content += methods.renderChildNodes(child,depth+1,collated);
					content += "</div>\n";
				}
			} 
			//else {
			//	console.log('nokids');
			//}
			return content;
		}
	};
	return methods;
}
