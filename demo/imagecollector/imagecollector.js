google.load('search', '1');

// QUICKDB PLUGINS
var galleryList=null;
var tagEditor=null;
var imageSearch=null;


/*
SHARE/EXPORT functions
*/
function extractList() {
	var all=$('<div/>');
	$('.editablerecords tr.row-odd,.editablerecords tr.row-even').each(function(){
		var text=$('.list-field-description',this).text(); 
		var img=$('.list-field-images',this).html(); 
		var item=$('<div/>');
		item.append(img);
		var itemText=$('<div/>')
		itemText.append(text); 
		item.append(itemText);
		all.append(item);
	});
	return all.html();
}

function extractCategorisedList() {
	var all=$('<div/>')
	$('.editablerecords .collatedlist').each(function() {
		var section=$(this).clone();
		$('.editbutton,.deletebutton',section).remove();
		all.append(section);
	});
	return all.html();
}

function extractSlideShow(scripts) {
 return '<div id="slideshow" >'+extractList()+'</div>'+scripts;
}


var findImages=function(param) {
	$('#searchquery').val(param);
	try {
		if (param && param.length>0) {
			imageSearch = new google.search.ImageSearch();
			imageSearch.setResultSetSize(8);
			imageSearch.setSearchCompleteCallback(this, function() {
				console.log('SEARCH COMPLETE',param,imageSearch.results);
				  // Check that we got results
					if (imageSearch.results && imageSearch.results.length > 0) {
					  // Grab our content div, clear it.
					  var contentDiv = document.getElementById('imagelist');
					  contentDiv.innerHTML = '';
					  // Loop through our results, printing them to the page.
					  var results = imageSearch.results;
					  for (var i = 0; i < results.length; i++) {
						// For each result write it's title and image to the screen
						var result = results[i];
						var imgContainer = document.createElement('div');
						var title = document.createElement('div');
						
						// We use titleNoFormatting so that no HTML tags are left in the 
						// title
						title.innerHTML = result.titleNoFormatting;
						var newImg = document.createElement('img');
						//newImg.width=100;

						// There is also a result.url property which has the escaped version
						newImg.src='https://localhost/speechify/caman_proxy.php?camanProxyUrl='+encodeURI(result.url); //"/image-search/v1/result.tbUrl;"
						$(newImg).load(function() {
							var listItem=$(this).parent();
							$(contentDiv).append(listItem);
							listItem.show();
						});
						
						imgContainer.appendChild(newImg);
						imgContainer.appendChild(title);
						$(imgContainer).hide();
						// Put our title + image in the content
						contentDiv.appendChild(imgContainer);
						
						$(imgContainer).click(function() {
							console.log('CLICK CONTAINER'); 
							$('.speechify-selected').each(function() {$(this).removeClass('speechify-selected')});
							$(this).addClass('speechify-selected');
							return false;
						});
						$(imgContainer).dblclick(function() {
							console.log('DBL CLICK CONTAINER'); 
							$('.speechify-selected').each(function() {$(this).removeClass('speechify-selected')});
							$(this).addClass('speechify-selected');
							grabImages();
							return false;
						});
					  }
						
					  // Now add links to additional pages of search results.
					 // addPaginationLinks(imageSearch);
					}
			}, null);
			imageSearch.execute(param);
			google.search.Search.getBranding('branding');
		}
		} catch (e) {
			console.log(e);
		}
		return false;
	}
	
	var setSelected=function(match) {
		$('.speechify-selected').each(function() {$(this).removeClass('speechify-selected')});
		$.each(match,function() {
			$(this).parent().addClass('speechify-selected');
		});
	}
	/* CASE INSENSITIVE DOM SEARCH */
	$.expr[":"].contains = $.expr.createPseudo(function(arg) {
		return function( elem ) {
			return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
		};
	});
	var selectImages=function(text) {
		//$('');
		var match=$('#imagelist div > div:contains("'+$.trim(text)+'")');
		console.log('selectImages',match);
		$('.speechify-selected').each(function() {$(this).removeClass('speechify-selected')});
		$.each(match,function() {
			$(this).parent().addClass('speechify-selected');
		});
	}
	
	var grabImages=function() {
		//$('');
		
		var match=$('#imagelist div.speechify-selected .file a.dataurl img');
		var base64FileName=$('#imagelist div.speechify-selected').children('div').text();
		var base64FileUrl=$('#imagelist div.speechify-selected').children('img')[0].src;
		console.log('GRABBING IMAGES',base64FileName,base64FileUrl);
		$('#myCanvas').remove();
		$('body').prepend('<canvas id="myCanvas" ></canvas>');
		$('#myCanvas').hide();
		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		var img = $('#imagelist div.speechify-selected').children('img')[0];
		if (img) { 
			console.log('img domdds',img,img.naturalWidth,img.naturalHeight);
			$('#myCanvas').attr('width',img.naturalWidth);
			$('#myCanvas').attr('height',img.naturalHeight);
			//console.log('img dom',$(img));
			ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight);
			var base64File=c.toDataURL();
			$('.formwrapper',$('#gallerylist')).html('');
			galleryList.api.controller.newRecord('images');
			setTimeout(function() {
				$('#gallerylist .filelist').append('<span class="file"><a class="dataurl" download="'+base64FileName+'" data-name="'+base64FileName+'" href="'+base64File+'" ><img src="'+base64File+'" /></a><span class="removefilebutton"><a href=""><img src="images/deleterecord.png"></a></span></span>');
				// 
				$('.form-description input.form-editingdata').val(base64FileName);
				$('.form-tags input.join-searchinput').val($.trim($('#searchquery').val()));
				$('.form-tags input.join-searchinput').keydown();
				
			},100);
		}
	}

$(document).ready(function() {
// Create an Image Search instance.
   var speechCommands={
	// google image search
	'google images':findImages,
	'select':selectImages,
	'grab image':grabImages,
	// images library
		// select image,search images, search images tags, delete selected image,edit selected image|okay|double click, download selected image
	// export
	"save list":function() {$('#save-list').click();},
	"preview list":function() {$('#preview-list').click();},
	"save catagorized list":function() {$('#save-categorisedlist').click();},
	"preview catagorized list":function() {$('#preview-categorisedlist').click();},
	"save slideshow":function() {$('#save-slideshow').click();},
	"preview slideshow":function() {$('#preview-slideshow').click();}
   };
   $('body').speechify({'commands':speechCommands});
	galleryList=$('#gallerylist').quickDB()[0];
	galleryList.settings.templates.listCollateBy='tags';
	
	//galleryList.api.view.renderListFinalCallback=function(table,fields,records) {
	//$(".editablerecords .row-odd,.editablerecords .row-even").each(function() {
	//});	
	//}	
	
	//tagEditor=$('#tageditor').quickDB()[0];
	$('#imagesearchform').submit(function() {
		findImages($('#searchquery').val());
		return false;
	});
	$('.exportbutton').bind('click',function() {
		var button=this;
		//scripts.load('jquery.carousel.all.php');
		$.get("jquery.carousel.all.php", function(scripts) {
			var result;
			var idParts=$(button).attr('id').split('-');
			// extract/generate export content
			if (idParts[1]=='list') {
				result=extractList();
			} else if (idParts[1]=='categorisedlist') {
				result=extractCategorisedList();
			} else if (idParts[1]=='slideshow') {
				result=extractSlideShow(scripts);
			}
			console.log('have result',result);
			// format of result
			if (idParts[0]=='preview') {
				var w=window.open();
				w.document.writeln(result);
			} else if (idParts[0]=='save') {
				var format='html';
				$('body').prepend("<a class='dataurl' href='data:text/"+format+";charset=UTF-8," + encodeURIComponent(result)+"' download='images."+format+"' id='immediatedownloadlink' >download</a>");
											
				var elem = document.getElementById("immediatedownloadlink");
				if(document.dispatchEvent) {   // W3C
					var oEvent = document.createEvent( "MouseEvents" );
					oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, elem);
					elem.dispatchEvent( oEvent );
				}
				$('#immediatedownloadlink').remove();
			} 
		});
		return false;
	});
});
