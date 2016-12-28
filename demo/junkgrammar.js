/*

[
			['dadd [note|node] $content' + multiContent], //,' [(to $parentNode|as $connection|to $parentNode as $connection]'],
			function(params) {
				var variables = params[1];
				var connection = '';
				if (variables.hasOwnProperty('$connection')) {
					connection = variables['$connection'];
				}
				if (variables.hasOwnProperty('$parentNode')) {
					// explictly create node under selected
					if (variables['$parentNode'] == "selected") {
						var s = springy.renderer.getSelected();
						if (s != null) {
							graph.addNodes(variables['$content']);
							var b = springy.graph.findNode(variables['$content']);
							graph.addEdges([b.id,s.node.id])
							jQuery.fn.speechify.notify('Added node <b>' + variables['$content'] + '</b> to <b>' + s.node.data.label + '</b>.' );
							saveMap();
							springy.renderer.graphChanged();
						// failed to connect to explicit selected
						} else {
							jQuery.fn.speechify.notify('Nothing selected to connect with.');
						}
					} else {
						var b = springy.graph.findNode(variables['$content']);
						// create node under named parent
						if (b !=null) {
							graph.addNodes(variables['$content']);
							var c = springy.graph.findNode(variables['$content']);
							graph.addEdges([c.id,b.id])
							jQuery.fn.speechify.notify('Added node <b>' + variables['$content'] + '</b> to <b>' + b.data.label + '</b>.' );
							springy.renderer.setSelected(b);
							saveMap();
							springy.renderer.graphChanged();
						// fail to find named parent
						} else {
							jQuery.fn.speechify.notify('Could not find <b>' + variables['$parentNode'] + '</b> to connect with.' );
						}
					}
				} else {
					var s = springy.renderer.getSelected();
						// create node under selected
						if (s != null) {
							graph.addNodes(variables['$content']);
							var c = springy.graph.findNode(variables['$content']);
							graph.addEdges([c.id,s.node.id])
							jQuery.fn.speechify.notify('Added node <b>' + variables['$content'] + '</b> to <b>' + s.node.data.label + '</b>.' );
							saveMap();
							springy.renderer.graphChanged();
						// create disconnected node
						} else {
							graph.addNodes(variables['$content']);
							jQuery.fn.speechify.notify('Added node <b>' + variables['$content'] + '</b>.' );
							// select new node
							var b = springy.graph.findNode(variables['$content']);
							springy.renderer.setSelected(b);
							saveMap();
							springy.renderer.graphChanged();
						}
				}
				//console.log(['added node',variables]);
			}
		],
		
[
			['prepend $text'+ multiContent+' (to|too|two) (node|note) $node'+multiContent],
			function(params) {
				//console.log(['append text']);
				var variables = params[1];
				var node = springy.graph.findNode(variables['$node']);
				if (node == null) {
					jQuery.fn.speechify.notify("Can't find <b>"+variables['$node']+"</b> to add text.");
				} else {
					node.data.label = variables['$text'] + ' ' + node.data.label;
					jQuery.fn.speechify.notify("Prepended <b>"+variables['$text']+"</b> to <b>"+variables['$node']+"</b>");
					saveMap();
					springy.renderer.graphChanged();
				} 
			}
		],
		[
			['append $text'+ multiContent+' (to|too|two) (node|note) $node'+ multiContent],
			function(params) {
				//console.log(['append text']);
				var variables = params[1];
				var node = springy.graph.findNode(variables['$node']);
				if (node == null) {
					jQuery.fn.speechify.notify("Can't find <b>"+variables['$node']+"</b> to add text.");
				} else {
					node.data.label = node.data.label  + ' ' + variables['$text'];
					jQuery.fn.speechify.notify("Appended <b>"+variables['$text']+"</b> to <b>"+variables['$node']+"</b>");
					saveMap();
					springy.renderer.graphChanged();
				} 
			}
		],
*/
