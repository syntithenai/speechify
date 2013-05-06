db = openDatabase("quickdb", "", "", 1);
self.addEventListener('error', function(e) {
	//console.log('WORKER',e);
	self.postMessage({'com':'ERROR',err:e});
});
self.addEventListener('message', function(e) {
	//self.postMessage(e.data);
  	//self.postMessage(1);
	if (e.data && e.data.table && e.data.table.length>0 && e.data.field && e.data.field.length>0  && e.data.rowid && e.data.rowid>0) {
		var data=e.data;
		//self.postMessage('have reque'+'SELECT '+data.table+' FROM '+data.field+' WHERE rowid='+data.rowid);
		db.transaction(function (tx) {
			tx.executeSql('SELECT '+data.table+' FROM '+data.field+' WHERE rowid='+data.rowid, [], function (tx, results) {
				var len = results.rows.length, i;
				for (i = 0; i < len; i++) {
					self.postMessage({'rowid':data.rowid,'result':results.rows.item(i)[data.field]});
				}	
			});  
		});  
	}

}, false);

