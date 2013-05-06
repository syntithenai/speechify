db = openDatabase("Foo", "", "", 1);
if (db)
  postMessage(3);
else
  postMessage(4);
  db.transaction(function (tx) {
	tx.executeSql('SELECT * FROM foo', [], function (tx, results) {
	  var len = results.rows.length, i;
	  for (i = 0; i < len; i++) {
		postMessage(results.rows.item(i).text);
	  }
	});  
});