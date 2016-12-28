/*	[['check for $whatever'],
		function(searchText) {
			console.log(['DONE SEARCH',searchText['$whatever']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for (red)'],
		function(searchText) {
			console.log(['DONE RED',searchText['$whatever']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for (red) $names'],
		function(searchText) {
			console.log(['DONE RED var',searchText['$names']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for (red)'],
		function(searchText) {
			console.log(['DONE RED hars',searchText['$whatever']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for $whatever now'],
		function(searchText) {
			console.log(['DONE SEARCH NOW',searchText['$whatever']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for $whatever tomorrow'],
		function(searchText) {
			console.log(['DONE SEARCH TOMORROWQ',searchText['$whatever']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for $whatever tomorrow with $person'],
		function(searchText) {
			console.log(['DONE SEARCH TOMORROWQ person',searchText['$whatever'],searchText['$person']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['check for $whatever tomorrow with $person and $person2'],
		function(searchText) {
			console.log(['DONE SEARCH TOMORROWQ people',searchText['$whatever'],searchText['$person'],searchText['$person2']]);
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['search $location for $thing'],
		function(searchText) {
			console.log('DONE SEARCH');
			//window.open('https://www.google.com.au/webhp?sourceid=chrome-instant#q=' + searchText);
		}
		//,['search for.open'] // context grammars to enable
	],
	[['open $resultId'],function(resultId) {
			// open result matching resultId
		}
		,['search for.back']
	],
	[['(go) back'],function() {
			window.back();
		}
	]
*/

var grammarTree = [
// [like that now|like that] please
	[['check for [blue|$desc red] cats'], //[$adj] 
		function(searchText) {
			console.log(['DONE kat check',searchText]);
		}
	],
	[['check for dogs'],
		function(searchText) {
			console.log('DONE god check');
		}
	],

];
var grammars=[];
for (i in grammarTree) {
	grammars.push(new SpeechifyGrammar(grammarTree[i][0],grammarTree[i][1]));
}
//console.log(grammars);
