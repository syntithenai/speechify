
var AFrameRenderer = function() {
	var charMaxWidth = 120;
	var maxWidth = charMaxWidth * 25;
	
	function splitter(str, l){
		var strs = [];
		while(str.length > l){
			var pos = str.substring(0, l).lastIndexOf(' ');
			pos = pos <= 0 ? l : pos;
			strs.push(str.substring(0, pos));
			var i = str.indexOf(' ', pos)+1;
			if(i < pos || i > pos+l)
				i = pos;
			str = str.substring(i);
		}
		strs.push(str);
		return strs;
	}

	var methods = {
		graphChanged: function() {
			console.log('RENDER VR');
			var lineHeight = 0.2;
			
			var content='';
			var contentArray=[];
			var rootNodes=[];
			var collatedByParent={};
			
			// find root nodes and collate all nodes by parent
			for (var i=0; i < graph.nodes.length; i++) {
				var node = graph.nodes[i];
				// do i have a parent
				if (graph.adjacency.hasOwnProperty(node.id)) {
					for ( var j in graph.adjacency[node.id]) {
						var parent = graph.adjacency[node.id][j];
						if (typeof collatedByParent[j] != 'object' ) {collatedByParent[j]=[];}
						collatedByParent[j].push(node.id);
					}
				} else { 
					rootNodes.push(node.id); 
				}
			}
			$('a-entity.root').remove(); 
					
			//console.log(['root nodes ',rootNodes,'collated',collatedByParent]);

			// render rootnodes and then render recursively into an array 
			var depth = 0;
				
			for (var i=0; i < rootNodes.length; i++) {
				depth = 0;
				var node = graph.nodeSet[rootNodes[i]];
				var nodeLabel = $('<b>'+node.data.label+'</b>').text();
				var nodeContent = $('<b>'+(Boolean(node.data.content) ? node.data.content : '')+'</b>').text();
				var nodeColor='black';
				var thisSelection = graph.getSelected();
				if (thisSelection != null && thisSelection.id == node.id) {
						nodeColor = 'red';
				}
				var contentColor='blue';
				var thisEdited = graph.getEdited();
				if (thisEdited != null && thisEdited.id == node.id) {
					contentColor = 'green';
					nodeColor = 'green';
				}					
				contentArray.push([0, '<a-entity id="'+node.id+'"  ',' class="rootnode node" bmfont-text="width: '+maxWidth+'; text: '+ nodeLabel+'; color: '+nodeColor+'; width: 5000;" ></a-entity>']);
				if (nodeContent.length > 0) {
					var textSplits = splitter(nodeContent,charMaxWidth);
					for (textSplit in textSplits) {
						contentArray.push([0, '<a-entity id="'+node.id+'-content-'+textSplit+'"  ',' class="content content-node-'+node.id+'" bmfont-text="width: '+maxWidth+'; text: '+ textSplits[textSplit] +'; color: '+contentColor+'" ></a-entity>']);
					}
				}
				// children of this node recursively
				//var result = ['',0]; 
				//console.log(['b1',contentArray]);
				var kids = methods.renderChildNodes(node,depth,collatedByParent);
				for (kid in kids) {
					contentArray.push(kids[kid]);
				}
				//console.log(['after1',kids,contentArray]);
				
			}
			// do layout to HTML with positions
			console.log(['VRRENDERED',contentArray]);
			// cleanup
			content += '<a-entity class="root" position="-6 5.5 -5"   >';
			for (var i=0; i< contentArray.length; i++) {
				var thisContentStart = contentArray[i][1];
				var thisContentEnd = contentArray[i][2];
				var thisDepth = contentArray[i][0];
				var offsetX = thisDepth * 0.2;
				var offsetY = -1 * lineHeight * (i+1);
				//thisContent.attr('position');
				var position ='position="' + offsetX+' '+ offsetY + ' 0"';
				content += thisContentStart + position + thisContentEnd;;
			}
			content += "</a-entity>\n";
			$('#vrrender a-scene').append(content); 
			
			
		},
      

		renderChildNodes: function(node,depth,collated) {
			var contentArrayI=[];
			//console.log(['renderkids',node.id,typeof collated[node.id],collated[node.id]]);
			if (collated.hasOwnProperty(node.id) && typeof collated[node.id] == 'object' ) {
				for (var j=0; j < collated[node.id].length; j++) {
					var child = graph.nodeSet[collated[node.id][j]];
					var nodeLabel = $('<b>'+child.data.label+'</b>').text();
					var nodeContent = $('<b>'+(Boolean(child.data.content) ? child.data.content : '')+'</b>').text();
					var nodeColor='grey';
					var thisSelection = graph.getSelected();
					if (thisSelection != null && thisSelection.id == child.id) {
						nodeColor = 'red';
					}
					var contentColor='blue';
					var thisEdited = graph.getEdited();
					if (thisEdited != null && thisEdited.id == child.id) {
						contentColor = 'green';
						nodeColor = 'green';
					}
					console.log(['EDITED',thisEdited,contentColor]);
					
					contentArrayI.push([depth,'<a-entity id="'+child.id+'"  ',' class="node" bmfont-text="width: '+maxWidth+'; text: '+ nodeLabel+'; color: '+nodeColor+'" ></a-entity>']);
					if (nodeContent.length > 0) {
						var textSplits = splitter(nodeContent,charMaxWidth);
						for (textSplit in textSplits) {
							contentArrayI.push([depth,'<a-entity  ',' class="content content-node-'+child.id+'" bmfont-text="width: '+maxWidth+'; text: '+ textSplits[textSplit] +'; color: '+contentColor+'" ></a-entity>']);
						}

						
					}
					//console.log(['b2',contentArrayI]);
					var kids = methods.renderChildNodes(child,depth+1,collated);
					for (kid in kids) {
						contentArrayI.push(kids[kid]);
					}
					//console.log(['a2',contentArrayI]);
				}
			} 
			//console.log(['CHRET LOG',contentArrayI]);
			return contentArrayI;
		}
	};
	return methods;
}
