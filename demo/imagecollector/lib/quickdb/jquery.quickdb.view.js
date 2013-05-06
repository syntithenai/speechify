/* 
Copyright Steve Ryan <stever@syntithenai.com> 5/2013
Author: Steve Ryan <stever@syntithenai.com>
Date: 5/2013
*/
$.fn.quickDB.defaultOptions.debug2=1
$.fn.quickDB.defaultOptions.templates = {
	// list
	//listAddButton : "<a><img src='images/addrecord.png' />&nbsp;Add</a>", // markers - none
	listHeaderButtons : {
		"add" : "<a><img src='images/addrecord.png' />&nbsp;Add</a>" // markers - none
	},
	listHeader : "<th>${label}</th>", // markers - label
	//listHeaders : "<tr><th>${addButton}</th>${listHeaders}</tr>",  // markers -  addButton,listHeaders
	listHeaders : "<tr><th>${listHeaderButtons}</th>${listHeaders}</tr>",  // markers -  addButton,listHeaders
	//listEditButton : "<img src='images/editrecord.png' title='Edit record ID ${rowid}' />",// markers - <row values>
	//listDeleteButton : '<img  src="images/deleterecord.png" title="Delete record UID ${rowid}" />',// markers - <row values>
	listButtons : {
		"edit":"<img src='images/editrecord.png' title='Edit record ID ${rowid}' />",// markers - <row values>
		"delete" : '<img  src="images/deleterecord.png" title="Delete record UID ${rowid}" />'// markers - <row values>
	},
	listField : "<td>${fieldValue}</td>",// markers - fieldValue (containing ${<fieldName>})
	//listRow : "<tr><td>${listEditButton} ${listDeleteButton}</td>${listFields}</tr>", // markers -  listEditButton,listDeleteButton,listFields, <row values>
	listRow : "<tr><td>${listButtons}</td>${listFields}</tr>", // markers -  listEditButton,listDeleteButton,listFields, <row values>
	list : "<table>${listHeaders} ${listRows}</table>",  // markers - listHeaders,listRows
	listTarget:null,
	// foldable rows
	listCollateBy : null,
	listCollateItemWrap : "<div ><h3>${collateValue}</h3>${list}</div>",
	listCollateWrap : "<div><table>${listHeaders}</table>${listRows}</div>",
	// list checkboxes
	/*
	plugin.settings.templates.listCollateBy='banks';
	plugin.settings.templates.listRow = "<tr><td><input type='checkbox' checked value='1' class='listrowcheckbox'/>${listEditButton} ${listDeleteButton}</td>${listFields}</tr>";
	plugin.settings.templates.listHeaders = "<tr><th><input type='checkbox' checked value='1' class='listrowtoggleall'/>${addButton}</th>${listHeaders}</tr>";
	plugin.settings.templates.listCollateItemWrap = "<div ><h3><input type='checkbox' checked value='1' class='listrowtogglecollated'/>${collateValue}</h3>${list}</div>";
	*/
	// form - note buttons must be wrapped in element with class form-buttons and have class form-cancel and form-OK to enact click event bindings
	formSaveButton : "<input type='image' value='OK' src='images/tick.png' >",// markers -  none
	formCancelButton : "<input type='image' value='Cancel' src='images/cancel.png' >",// markers - none
	formButtons : "<div class='form-buttons' >${formSaveButton} ${formCancelButton}</div>",// markers - formSaveButton,formCancelButton
	formLabel : "<b>${fieldLabel}</b>",// markers - fieldLabel
	formRequired: "* ",
	formInput : "<div>${formLabel}${formInput}</div>",// markers - formInput, formLabel
	form : "<div>${formButtons}${formInputs}</div>", // markers - formInput,formButtons, saveButton,deleteButton
	formTarget:null
}

$.fn.quickDB.api.view = {
	// MISC METHODS
	checkView : function(view,table) {
		var plugin=this;
		//console.log('checkview',view,table);
		if (table && plugin.settings.tables[table]) {
			if (plugin.settings.tables[table].views && plugin.settings.tables[table].views[view]) {
				return view; 
			} else if (plugin.settings.tables[table].views && plugin.settings.tables[table].views['default']) {  
				return 'default'; 
			} else {
				if (plugin.settings.debug) console.log('Missing view default for table '+table+ ' seeking '+view);	
			}	
		} else {
			if (plugin.settings.debug) console.log('Missing view default for table '+table+ ' seeking '+view);	
		}
	},
	logQuery:function(query) {
		var plugin=this;
		if (plugin.settings.debug) console.log(query); //if (plugin.settings.debug) 
		return query;	
	},
	removeMessage : function(target) {
		$('.message',$(target)).remove();
	},
	sendMessage : function(message,target,timeout,clear,append) {
		if (typeof clear === undefined) {
			clear=true;
		}
		if (!target || target.length==0) {
			target=$('#messages');
			if (target.length==0) {
				// create messages div
				target=$("<div id='messages' class='messages' ></div>");
				$('body').prepend(target);
			}
		}		
		// empty or zero
		if (!timeout) timeout=5000;
		if (target.length>0) {
			// slam all message for now
			if (clear) $("span.message",target).remove();
			var clearMessage=function(newMessage) {
				newMessage.hide();
			}
			var newMessage=$('<span class="message" >').append(message);
			if (append) {
				target.append(newMessage).show();
			} else {
				target.prepend(newMessage).show();
			}
			// negative timeout show forever
			if (timeout>0) {
				setTimeout(function () {
					clearMessage(newMessage);
				},timeout);
			}
		}
	},
	// the following methods assume structure in the DOM through classes
	// classes include formwrapper,editablerecords,form-<field>,form-editingdata,list-field-<field>,filelist
	removeForm : function () {
		var plugin=this;
		$('.formwrapper',plugin.formTarget).remove(); 	
	},
	showList : function () {
		var plugin=this;
		$('.editablerecords',plugin.listTarget).show();
	},
	setFormRowId : function(newId,context) {
		var plugin=this;
		$('.formwrapper .form-rowid input.form-editingdata',context).val(parseInt(newId));
	},
	focusFirstFormInput : function() {
		// TODO see how much we can extract from label view
		var plugin=this;
		$('.formwrapper input.form-editingdata:eq(0)',plugin.formTarget).focus();
	},
	// EXTRACT FROM DOM METHODS
	getPrimaryKeyValueFromTableRow : function (clickedRow) {
		return clickedRow.children('.list-field-rowid').html();
	},
	getSearchParameters : function(table,view)  {
		var plugin=this;
		var params={};
		if (plugin.settings.tables[table].views[view] && plugin.settings.tables[table].views[view].searchers)  {
			$.each(plugin.settings.tables[table].views[view].searchers,function(key,searcherConfig) {
				var searcherDOM=$('.searchers .search-field-'+key,plugin.searchTarget);
				if (searcherConfig.type=='checkbox' || searcherConfig.type=='radio') {
					var allVals=[];
					$.each($('input:checked',searcherDOM),function(vKey,vVal) {
						allVals.push($(vVal).val());
					});
					params[key]=allVals.join(',');
				} else if (searcherConfig.type=='select') {
					var allVals=[];
					$.each($('option:selected',searcherDOM),function(vKey,vVal) {
						allVals.push($(vVal).val());
					});
					params[key]=allVals.join(',');
				} else if (searcherConfig.type=='date') {
						params[key]={from:$('span.search-date-from input',searcherDOM).val(),to:$('span.search-date-to input',searcherDOM).val()};
				} else if (searcherConfig.type=='livesearch') {
					params['_'+key+'_ids']=$('input[type=hidden]',searcherDOM).val();
					params[key]=$('input[type=text]',searcherDOM).val();
				} else {
					params[key]=$('input',searcherDOM).val();
				}	
			});
		}
		//console.log('getsearchparams',params);
		return params;
	},
	getClickedRowId : function(clickedRow) {
		return parseInt(clickedRow.children('.list-field-rowid').html());
	},
	getFormDataFiles : function(key) {
		// TODO POTENTIAL BUG - NO PROPER PLUGIN SELECTION, FILES COULD OVERLAP BETWEEN PLUGINS
		// HOW DO I GET THE RAW DOM OBJECT IF I USE A JQUERY SELECTOR ??
		var fileInput=document.querySelector('.form-'+key);
		var fileCollection=null;
		//console.log('GETFORMDATAFILES',fileInput);
		// don't save a value if filelist is not rendered (but set empty if rendered by no linked files)
		if ($('.filelist',fileInput)) {
			fileCollection={}
			$.each($('.filelist a.dataurl',fileInput),function(i,anchor) {
				var tmpFile=$(anchor).data();
				tmpFile.data=$(anchor).attr('href');
				fileCollection[tmpFile.name]=tmpFile;
			});
		}	
		//console.log('GETFORMDATAFILES',fileCollection);
		return fileCollection;
	},
	getFormDataField : function(table,key) {
		var plugin=this;
		var value=plugin.settings.tables[table].fields[key];
		var toSave={};
		if ($('.form-'+key,plugin.formTarget).length>0 && value.type) {
				// by default just get the raw value
				toSave[key]=$('.form-'+key+' input.form-editingdata',plugin.formTarget).val();	
				// special cases override raw value
				if (value.type=='datetime') {
					toSave[key]=$('.form-'+key+' input.date',plugin.formTarget).val()+' '+$('.form-'+key+' input.time',plugin.formTarget).val();
				} else if (value.type=='textarea') {
					toSave[key]=$('.form-'+key+' textarea.form-editingdata',plugin.formTarget).val();
				} /*else if (value.type=='password') {
					var check=$('.form-'+key+' input.form-editingdata-check',plugin).val();
					if (check && check.length>0 && check===toSave[key]) {
						//toSave[key]=check;		
					} else {
						toSave[key]=undefined;	
					} 
				} */ else if (value.type=='rte') {
					// TODO SAME BUG AS ABOVE - NO PROPER PLUGIN SELECTION, FILES COULD OVERLAP BETWEEN PLUGINS
					// HOW DO I GET THE RAW DOM OBJECT IF I USE A JQUERY SELECTOR ??
					var rte=document.querySelector('.form-'+key+' iframe.rte');
					if (rte && rte.contentWindow) {
						var textVal=rte.contentWindow.document.querySelector('body').innerHTML;
					}
					toSave[key]=textVal;
				} else if (value.type=='file' || value.type=='image') {
					// read and encode files
					var fd=JSON.stringify(plugin.api.view.getFormDataFiles(key));
					//console.log('SAVEFILE',fd);
					if (fd!=null) toSave[key]=fd;
				} else if (value.type=='svg') {
					var canvas=$('.form-'+key+' iframe.svgeditor',plugin.formTarget).parent().data('canvas');
					try {
						var handleData = function (data,error) {
							if (error) { console.log('error ' + error);} else { toSave[key]=data; }
						}
						canvas.getSvgString()(handleData);	
					} catch (e) {
						if (true) console.log('Failed to catch SVG value',e)	;
					}
				} else if (value.type=='sheet') {
					var sheetClone=$('.form-'+key,plugin.formTarget).data('sheetInstance').tables();
					toSave[key]=$('<div />').html(sheetClone).html();
				} else if (value.type=='checkbox' || value.type=='boolean' || value.type=='radio') {
					var allVals=[];
					$.each($('.form-'+key+' input.form-editingdata:checked',plugin.formTarget),function(vKey,vVal) {
						allVals.push($(vVal).val());
					});
					toSave[key]=allVals.join(',');
				} else if (value.type=='select') {
					var allVals=[];
					$.each($('.form-'+key+' option:selected',plugin.formTarget),function(vKey,vVal) {
						allVals.push($(vVal).val());
					});
					toSave[key]=allVals.join(',');
				}
			}
			return toSave[key];
	},
	//$('.form-banks input.form-editingdata',plugin.formTarget).val();
	getFormData : function(table) {
		// TODO only save changed data (based on olddata values ??) (or change flag??)
		var plugin=this;
		var toSave={};
		var c=plugin.settings.tables[table];
		$.each(plugin.settings.tables[table].fields,function(key,value) {
			toSave[key]=plugin.api.view.getFormDataField(table,key);
		});
		if (plugin.settings.tables[table].joins) { 
			$.each(plugin.settings.tables[table].joins,function(key,value) {
				if ($('.form-'+key+' input.form-editingdata',plugin.formTarget)) {
					var joinVal=$('.form-'+key+' input.form-editingdata',plugin.formTarget).val();
					console.log('JOINVAL',key,joinVal,plugin.formTarget);
					if (joinVal) { 
						var joinVals=[];
						$.each(joinVal.split(","),function(i,idVal) {
							if (parseInt(idVal)>0) joinVals.push(idVal);
						});
						toSave[key]=joinVals.join(',');
					} else {
						toSave[key]='';
					}
				}
			});
		}
		toSave['rowid']=parseInt($('.form-rowid input.form-editingdata',plugin.formTarget).val());
		console.log('FD',toSave)
		return toSave;
	},
	// RENDERING METHODS
	// RENDER SEARCHER
	renderSearcher : function(table,view,searcher){
		var plugin=this;
		//console.log('rendersearcher',table,view,searcher);
		if ($('.searchers',plugin.searchTarget).length==0) { 
			//console.log('forreal');
			//return;
			var searchers=[];
			var searcher='';
			if (plugin.settings.tables[table].views[view].searchers) {
				$.each(plugin.settings.tables[table].views[view].searchers,function(key,value) {
					//console.log('SEARCHER',key,value);
					var toPush='';
					if (!value.type) value.type='text';
					if (value.type=='text') {
						toPush="<span class='searcher search-text search-field-"+key+"' ><label>"+value.label+"<input type='search' name='searcher-"+key+"' ></label></span>";
					} else if (value.type=='date') {
						toPush="<span class='searcher search-date search-field-"+key+"' ><label>"+value.label+" <span class='search-date-from'>From <input type='date' class='searcher-"+key+"' ></span><span class='search-date-to'>To <input type='date' class='searcher-"+key+"' ></span></label></span>";
					} else if (value.type=='select') {
						if (value.options) {
							var searcherOptions=[];
							$.each(value.options,function(i,optionsList) {
								searcherOptions.push("<option value='"+optionsList.value+"' >"+optionsList.label+"</option>");
							});
							toPush="<span class='searcher search-select search-field-"+key+"' ><label>"+value.label+"<select class='searcher-"+key+"' >"+searcherOptions.join()+"</select></label></span>";
						}
					} else if (value.type=='checkbox') {
					/*selectOptions+='<label><input  class="form-editingdata" name="'+key+'" type="'+fieldType+'"  value="'+optionKey+'" '+selected+' />'+optionValue+'</label>';
								selectOptions+='<label><input  class="form-editingdata" type="'+fieldType+'"  value="'+optionKey+'" '+selected+' />'+optionValue+'</label>';*/
						if (value.options) {
							var searcherOptions=[];
							$.each(value.options,function(i,optionsList) {
								searcherOptions.push("<input type='checkbox' value='"+optionsList.value+"' />"+optionsList.label);
							});
							toPush="<span class='searcher search-checkbox search-field-"+key+"' ><label>"+value.label+"</label>"+searcherOptions.join('')+"</span>";
						}
					} else if (value.type=='radio') {
						if (value.options) {
							var searcherOptions=[];
							var count=0;
							$.each(value.options,function(i,optionsList) {
								var checked='';
								if (count==0)  checked=' checked '; 
								searcherOptions.push("<label><input type='radio' "+checked+" value='"+optionsList.value+"' name='"+key+"' />"+optionsList.label+'</label>');
								count++;
							});
							toPush="<span class='searcher search-radio search-field-"+key+"' ><label>"+value.label+"</label>"+searcherOptions.join('')+"</span>";

						}
					} else if (value.type=='livesearch') {
						//console.log('redner lifvesesarch',value);
						toPush="<span class='searcher search-livesearch search-field-"+key+"' data-searchfield='"+value.fields+"' ><label>"+value.label+"<input type='text' name='searcher-"+key+"' ><input type='hidden' value=''><label></span>";
						
					}
					if (value.hide) toPush=$(toPush).hide().clone().wrap('<p>').parent().html();
					searchers.push(toPush);					
				});
				searcher="<div class='searchers' ><a class='resetsearchbutton' ><img src='images/orangecross.png' alt='Reset Search' /></a>\n"+searchers.join("\n")+"\n</div>";
				//console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSset searcher',plugin.searchTarget,searcher);
				$(plugin.searchTarget).html(searcher);
				//console.log('redner lifvesesarchDONE ',$('.search-livesearch',plugin).data());
				// disable form submission except by js change
				//$(plugin).parent().submit(function() {return false;});
				//$('.searchers .searcher input,.searchers .searcher input').submit(function() {return false;});
				//console.log('findform',$(plugin).parent());
				$('.searchers .resetsearchbutton',plugin.searchTarget).bind('click',function() {
					$(this).parents('form')[0].reset();
					$('.searchers .searcher input[type=hidden]',plugin.searchTarget).val('');
					plugin.api.controller.initList();
				});
				$('.searchers .searcher select',plugin.searchTarget).bind('change',function() {
					plugin.api.controller.initList();
					return false;
				});
				var searchChangeTimeout=0;
				$('.searchers .search-text input',plugin.searchTarget).keyup(function() {
					clearTimeout(searchChangeTimeout);
					searchChangeTimeout=setTimeout(function () {
						plugin.api.controller.initList();
						return false;
					}, 500);	
				});
				$('.searchers .search-checkbox input,.searchers .search-radio input',plugin.searchTarget).change(function() {
					clearTimeout(searchChangeTimeout);
					searchChangeTimeout=setTimeout(function () {
						plugin.api.controller.initList();
						return false;
					}, 800);	
				});
				
				var liveSearchChangeTimeout=0;
				//console.log('NOW',key,value);
				$('.searchers .search-livesearch input',plugin.searchTarget)
					// don't navigate away from the field on tab when selecting an item
					.bind( "keydown", function( event ) {
						if ( event.keyCode === $.ui.keyCode.TAB &&
							$( this ).data( "ui-autocomplete" ).menu.active ) {
							event.preventDefault();
						} else if ( event.keyCode === $.ui.keyCode.ENTER) {
							if ($( this ).data( "ui-autocomplete" ).menu.active ) {
								//console.log('active menu');
								//$(this).parent().parent().find('input[type=hidden]').val(ui.item.value);
								//plugin.api.controller.initList();
							} else {
								$(this).parent().parent().find('input[type=hidden]').val('');
								plugin.api.controller.initList();
							}
							event.preventDefault();
						}
					})
					.bind("keyup",function() {
						if ($.trim(this.value)=='')  {
							$(this).parent().parent().find('input[type=hidden]').val('');
						}
						// aggressive updates
						//plugin.api.controller.initList();
					})
					.autocomplete({
						source: function( request, response ) {
							//console.log('AUTOCOMP',$(this.element).parent().parent().data())
							var field=$(this.element).parent().parent().data('searchfield');
							
							var query=plugin.api.model.getListQuery(table,view,table+"_"+view+"."+field,{'_account_ids':''});
							//var query="select * from "+joinMeta.table+"_label where label like '%"+request.term+"%'";
							var items=[];
							//console.log('AC quwey',query);
							plugin.api.model.executeIteratorQuery(plugin.api.view.logQuery(query),[],function(result) {
								if (result[field]) {
									if (result['_'+field+'_ids']) {
										items.push({label:result[field],value:result['_'+field+'_ids']})
									} else {
										items.push({label:result[field],value:''})
									}
								}
							},
							function () {
								response(items);
							});
						},
						focus: function() {
							// prevent value inserted on focus
							return false;
						},
						select: function( event, ui ) {
							/* DISABLE MULTIPLE SELECT FIRST CUT MESS
							//console.log(ui.item.value,ui.item)
							var hiddenIds=$(this).parent().parent().find('input[type=hidden]').val();
							//console.log('HIDDNEDIV',hiddenIds);
							// split the current search term
							var terms = this.value.split(",");
							var termsIds= hiddenIds.split(",");
							// remove the current input
							terms.pop();
							// add the selected item
							terms.push( ui.item.label );
							termsIds.push(ui.item.value);
							// add placeholder to get the comma-and-space at the end
							terms.push( "" );
							this.value = terms.join( ", " );
							$(this).parent().parent().find('input[type=hidden]').val(termsIds.join(", "));
							//console.log('HDDD',$(this).parent().parent().find('input[type=hidden]').val());
							*/
							this.value = ui.item.label;
							$(this).parent().parent().find('input[type=hidden]').val(ui.item.value);
							plugin.api.controller.initList();
							return false;
						}
					});
			}
		}	
	},
	// RENDER LIST
	renderRecords : function (table,fields,records) {
		var plugin=this;		
		//console.log('renderRecords on',plugin.listTarget)
		var view=plugin.api.view.checkView('list',table);
		// list of visible fields
		var viewFieldsArray=plugin.settings.tables[table].views[view].viewFields.split(",");
		// headers
		var headers='';
		$.each(viewFieldsArray,function(key,headerField) {
			if (plugin.settings.templates.listCollateBy&& plugin.settings.templates.listCollateWrap&& plugin.settings.templates.listCollateItemWrap 
				&& plugin.settings.templates.listCollateBy==headerField) {
				headers+=$(plugin.settings.templates.listHeader.replace(/\$\{label\}/g,'')).addClass(headerField)[0].outerHTML;
			} else {
				headers+=$(plugin.settings.templates.listHeader.replace(/\$\{label\}/g,plugin.api.view.renderFieldLabel(table,headerField,true))).addClass(headerField)[0].outerHTML;
			}
		});
		//var addButton=$(plugin.settings.templates.listAddButton).addClass('addbutton')[0].outerHTML;
		var listHeaders=plugin.settings.templates.listHeaders.replace(/\$\{listHeaders\}/g,headers);
		var listHeaderButtons='';
		if (plugin.settings.templates.listHeaderButtons) {
			$.each(plugin.settings.templates.listHeaderButtons,function(buttonKey,buttonHTML) {
				listHeaderButtons+=$(buttonHTML).addClass(buttonKey+'button').clone().wrap("<p>").parent().html();
				var rg=new RegExp("\\$\\{listHeaderButtons."+buttonKey+"\\}",'g');
				listHeaders=$(listHeaders.replace(rg,$(buttonHTML).addClass(buttonKey+'button').clone().wrap("<p>").parent().html())).clone().wrap("<p>").parent().html();
			});
		}
		listHeaders=listHeaders.replace(/\$\{listHeaderButtons\}/g,listHeaderButtons);
		// rows
		var listRow='';
		$.each(viewFieldsArray,function(key,field) {
			var fieldValue='${'+field+'}';
			listRow+=$(plugin.settings.templates.listField.replace(/\$\{fieldValue\}/g,fieldValue)).addClass('list-field').addClass('list-field-'+field)[0].outerHTML;
		});
		// ensure rowid
		if ($.inArray('rowid',viewFieldsArray) == -1) listRow+= $(plugin.settings.templates.listField.replace(/\$\{fieldValue\}/g,'${rowid}')).addClass('list-field').addClass('list-field-rowid').css('display','none').clone().wrap("<p>").parent().html();
		// direct replace string containing field markers into list row template
		var listRowTemplate=plugin.settings.templates.listRow.replace(/\$\{listFields\}/g,listRow);
		//.replace(/\$\{listEditButton\}/g,editButton).replace(/\$\{listDeleteButton\}/g,deleteButton); 
		var listButtons='';
		if (plugin.settings.templates.listButtons) {
			$.each(plugin.settings.templates.listButtons,function(buttonKey,buttonHTML) {
				listButtons+=$(buttonHTML).addClass(buttonKey+'button').clone().wrap("<p>").parent().html();
				var rg=new RegExp("\\$\\{listButtons."+buttonKey+"\\}",'g');
				listRowTemplate=listRowTemplate.replace(rg,$(buttonHTML).addClass(buttonKey+'button').clone().wrap("<p>").parent().html());
			});
		}
		//var editButton=$(plugin.settings.templates.listEditButton).addClass('editbutton')[0].outerHTML;
		//var deleteButton=$(plugin.settings.templates.listDeleteButton).addClass('deletebutton')[0].outerHTML;
		listRowTemplate=listRowTemplate.replace(/\$\{listButtons\}/g,listButtons);
		var listRows=''; 
		//var collated={};
		var collatedListRowsRendered={};
		var uncollatedListRowsRendered='';
		var recordCounter=0;
		var collatedRecordCounter={};
		var unCollatedRecordCounter=0;
			
		$.each(records,function(key,record) {
			//console.log('RENDER LIST REC',record);
			var thisListRow=listRowTemplate; //+''; //force clone
			$.each(record,function(fieldName,fieldValue) {
				//console.log('RENDER LIST REC',fieldName,fieldValue);
				if (plugin.settings.templates.listCollateBy&& plugin.settings.templates.listCollateWrap&& plugin.settings.templates.listCollateItemWrap 
				&& plugin.settings.templates.listCollateBy==fieldName) {
					// skip
					var rg=new RegExp("\\$\\{"+fieldName+"\\}",'g');
					thisListRow=thisListRow.replace(rg,'');
				} else {
					var rg=new RegExp("\\$\\{"+fieldName+"\\}",'g');
					thisListRow=thisListRow.replace(rg,plugin.api.view.renderFieldValue(table,fieldName,record));
				}
				//console.log('thisListRow',key,fieldName,fieldValue,thisListRow);
			});
			if (plugin.settings.templates.listCollateBy&& plugin.settings.templates.listCollateWrap&& plugin.settings.templates.listCollateItemWrap) {
				var collatedKey=record[plugin.settings.templates.listCollateBy];
				if ($.trim(collatedKey).length==0) {
					unCollatedRecordCounter++;
					var rt='even';
					if (parseInt(unCollatedRecordCounter%2)==1) rt='odd';
					uncollatedListRowsRendered+=$(thisListRow).addClass('row').addClass('row-'+rt).wrap('<p/>').parent().html();
				} else {
					//collated[collatedKey]=record; 
					if (!collatedListRowsRendered[collatedKey]) collatedListRowsRendered[collatedKey]='';
					if (!collatedRecordCounter[collatedKey]) collatedRecordCounter[collatedKey]=0;
					//collatedListRowsRendered[collatedKey]+=thisListRow;
					collatedRecordCounter[collatedKey]++;
					var rt='even';
					if (parseInt(collatedRecordCounter[collatedKey]%2)==1) rt='odd';
					collatedListRowsRendered[collatedKey]+=$(thisListRow).addClass('row').addClass('row-'+rt).wrap('<p/>').parent().html();
				}
			} else {
				recordCounter++;
				var rt='even';
				if (parseInt(recordCounter%2)==1) rt='odd';
				listRows+=$(thisListRow).addClass('row').addClass('row-'+rt).wrap('<p/>').parent().html();
			}
		});
		//console.log('RENDERINGLIST',listRows,collatedListRowsRendered,uncollatedListRowsRendered);
		var allRows='';
		if (plugin.settings.templates.listCollateBy&& plugin.settings.templates.listCollateItemWrap&&plugin.settings.templates.listCollateItemWrap) {
			// collated list
			//console.log('DO COLLATION',plugin.settings.templates.listCollateBy,plugin.settings.templates.listCollateItemWrap,collatedListRowsRendered);
			//console.log(uncollatedListRowsRendered);
			var finalList='';
			$.each(collatedListRowsRendered,function(collateValue,rowsRendered) {
				var collatedList='';
				// first normal lists wrap for collation group
				collatedList=$(plugin.settings.templates.list.replace(/\$\{listHeaders\}/g,'').replace(/\$\{listRows\}/g,rowsRendered)).addClass('collatedlistrows').clone().wrap('<p>').parent().html();
				// then collation wrap
				var wrapcollatedList=$(plugin.settings.templates.listCollateItemWrap.replace(/\$\{list\}/g,collatedList)).addClass('collatedlist').clone().wrap('<p>').parent().html();
				wrapcollatedList=wrapcollatedList.replace(/\$\{collateValue\}/g,collateValue);
				finalList+=wrapcollatedList;
			});
			if (uncollatedListRowsRendered.length>0) {
					//collatedList
				var wrappedUncollatedListRowsRendered=$(plugin.settings.templates.list.replace(/\$\{listHeaders\}/g,'').replace(/\$\{listRows\}/g,uncollatedListRowsRendered)).addClass('collatedlistrows').clone().wrap('<p>').parent().html();
				var uco=$(plugin.settings.templates.listCollateItemWrap.replace(/\$\{list\}/g,wrappedUncollatedListRowsRendered).replace(/\$\{collateValue\}/g,'<div class="ungroupedcollationheader"><hr/></div>')).addClass('collatedlist').addClass('collatedlist-nogroup');
				var ucstart=$('input.listrowtogglecollated',uco);
				ucstart.remove();
				$('.ungroupedcollationheader',uco).append(ucstart);
				//console.log("UCNOL",uco,ucstart);
				finalList+=uco.clone().wrap('<p>').parent().html();
			}
	
			allRows=$(plugin.settings.templates.listCollateWrap.replace(/\$\{listHeaders\}/g,listHeaders).replace(/\$\{listRows\}/g,finalList)).addClass('editablerecords').addClass(table+'-list');
		} else {
		// flat list
			allRows=$(plugin.settings.templates.list.replace(/\$\{listHeaders\}/g,listHeaders).replace(/\$\{listRows\}/g,listRows)).addClass('editablerecords').addClass(table+'-list');
		}
		$('.editablerecords',plugin.listTarget).remove();
		$('.searchers',plugin.searchTarget).show();
		//console.log('inject list into ',plugin.listTarget)
		//console.log('list rowss',allRows.html());
		$(plugin.listTarget).append(allRows);
		plugin.timer.log('INITLIST START BINDING ');
		// ASYNC LOAD IMAGES
		var imageWorker=new Worker('imageworker.js');
		imageWorker.onmessage=function(message) {
			//console.log('LOAD IMAGE FEEDBACK',message.data);
			var valueVar=null;
			try {
			  var valueVar=JSON.parse(message.data.result);
			} catch (e) {
				if (true) console.log('Failed to restore images from JSON',e,theValue);	
			}
			var fileList='';
			if (valueVar!=null) $.each(valueVar,function(i,file) {
				fileList+="<a class='dataurl' href='"+file.data+"' download='"+file.name+"' title='"+file.size+"kb Last Modified "+file.lastmodifieddate+"' data-name='"+file.name+"' data-size='"+file.size+"' data-lastmodifieddate='"+file.lastmodifieddate+"'><img src='"+file.data+"' />"+'</a>';
			});
			$('.editablerecords .images a.dataurl[data-rowid='+message.data.rowid+']').each(function() {
				$(this).parent().html(fileList);
			});
		}
		$('.editablerecords .images a.dataurl').each(function() {
			if ($(this).data('rowid')>0) {
				data={};
				data.rowid=$(this).data('rowid');
				data.table=$(this).data('autoloadtable');
				data.field=$(this).data('autoloadfield');
				//console.log('FIRE POST MESSAGE',data);
				imageWorker.postMessage(data);
			}
		});
		// BIND CLICK FOR WHOLE LIST FOR EFFICIENCY
		$('.editablerecords',plugin.listTarget).unbind('click.editablerecords');
		$('.editablerecords',plugin.listTarget).bind('click.editablerecords',function(event) {
		var target = event.target || event.srcElement || event.originalTarget;
		if (target.nodeType == 3) target = target.parentNode;  // defeat Safari bug
		
			console.log('CKICK',target,$(target).prop('class'));
			if ($(target).hasClass('deletebutton')) {
				console.log('del');
				plugin.api.controller.deleteRecord(table,plugin.api.view.getClickedRowId($(target).parent().parent()),$(target).parent().parent());
			} else if ($(target).hasClass('editbutton')) {
			console.log('edit',$(target).parent().parent(),plugin.api.view.getClickedRowId($(target).parent().parent()));
				plugin.api.controller.editRecord(table,plugin.api.view.getClickedRowId($(target).parent().parent()));
			} else if ($(target).parent().hasClass('addbutton')) {
				plugin.api.controller.newRecord(table);
			} else if ($(target).hasClass('listrowtoggleall')) {
				$(target).parents('.editablerecords',plugin.listTarget).find('input.listrowcheckbox').prop('checked',$(target).prop('checked'));
				$(target).parents('.editablerecords',plugin.listTarget).find('input.listrowtogglecollated').prop('checked',$(target).prop('checked'));
				if ($(target).prop('checked')==true) {
					$(target).parents('.editablerecords',plugin.listTarget).find('.collatedlistrows').show();
				} else {
					$(target).parents('.editablerecords',plugin.listTarget).find('.collatedlistrows').hide();
				}
			}			
			else if ($(target).hasClass('listrowtogglecollated')) {
				$(target).parents('.collatedlist',plugin.listTarget).find('input.listrowcheckbox').prop('checked',$(target).prop('checked'));
				$(target).parents('.collatedlist').find('.collatedlistrows').toggle();
			}
			event.stopPropagation();
		});
		plugin.timer.log('INITLIST DONE CORE BINDING ');
		plugin.api.view.renderListFinalCallback(table,fields,records);
		plugin.timer.log('INITLIST DONE CALLBACK BINDING ');
		return;
		// bind buttons old style per DOM
		$('.editablerecords .deleteButton',plugin.listTarget).click(function() {
			plugin.api.controller.deleteRecord(table,plugin.api.view.getClickedRowId($(this).parent().parent()),$(this).parent().parent());
		});
		$('.editablerecords .editButton',plugin.listTarget).click(function() {
			plugin.api.controller.editRecord(table,plugin.api.view.getClickedRowId($(this).parent().parent()));
		});
		$('.editablerecords .addButton',plugin.listTarget).click(function() {plugin.api.controller.newRecord(table)});
		// toggle all selected
		$("input[type='checkbox'].listrowtoggleall",plugin.listTarget).click(function() {
			//console.log('valchck',$(this).prop('checked'));
			$(this).parents('.editablerecords',plugin.listTarget).find('input.listrowcheckbox').prop('checked',$(this).prop('checked'));
			$(this).parents('.editablerecords',plugin.listTarget).find('input.listrowtogglecollated').prop('checked',$(this).prop('checked'));
			if ($(this).prop('checked')==true) {
				$(this).parents('.editablerecords',plugin.listTarget).find('.collatedlistrows').show();
			} else {
				$(this).parents('.editablerecords',plugin.listTarget).find('.collatedlistrows').hide();
			}
		});
		$("input[type='checkbox'].listrowtogglecollated",plugin.listTarget).click(function() {
			//console.log('III',$(this).parents('.collatedlist').find('.collatedlistrows'));
			$(this).parents('.collatedlist',plugin.listTarget).find('input.listrowcheckbox').prop('checked',$(this).prop('checked'));
			$(this).parents('.collatedlist').find('.collatedlistrows').toggle();
		});
	},	
	renderFieldLabel : function(table,field,hideRequired) {
		var plugin=this;
		if (field.substr(0,1)!=='_'&&field!='rowid') { 
			var label='';
			if (plugin.settings.tables[table].joins && plugin.settings.tables[table].joins[field]) {
				label=plugin.settings.tables[table].joins[field].label;
			} else {
				if (plugin.settings.tables[table].fields && plugin.settings.tables[table].fields[field]) {
					label=plugin.settings.tables[table].fields[field].label;
				} else {
					label=String(field).substr(0,1).toUpper()+String(field).substr(1);
				}
			}
			if (!hideRequired && plugin.settings.templates.formRequired && plugin.settings.tables[table].fields[field] && plugin.settings.tables[table].fields[field].validation && plugin.settings.tables[table].fields[field].validation.required)  label=plugin.settings.templates.formRequired + label;
			return label;
		}
	},
	renderFieldValue : function(table,field,record) {
		var plugin=this;
		var fieldValue=record[field];
		// check for join
		if (plugin.settings.tables[table] && plugin.settings.tables[table].joins && plugin.settings.tables[table].joins[field] && $.isPlainObject(plugin.settings.tables[table].joins[field])) {
			// default
			fieldValue=record[field];
			// wrap joins in spans with id attributes
			if (fieldValue && fieldValue.length) {
				var valueParts=fieldValue.split(",");
				var keyPartsTrial=$.trim(record['_'+field+'_ids']).split(",");
				var keyParts=[];
				$.each(keyPartsTrial,function(k,v) {
					if (parseInt(v)>0) keyParts.push(v);
				});
				var finalValue={};
				if (keyParts.length==valueParts.length) {
					$.each(valueParts,function(i,key) {
						if (key.length>0) {
							var dataId='';
							if (keyParts[i] && keyParts[i].length>0) dataId=' data-join-rowid="'+keyParts[i]+'" ';
							finalValue[keyParts[i]]='<span class="join-value" '+dataId+'>'+valueParts[i]+'</span>';
						}
					});	
				} else {
					if (true) console.log('join values and keys dont match up');
				}
				var finalValueArray=[];
				$.each(finalValue,function(k,v) {
					finalValueArray.push(v);
				});
				fieldValue=finalValueArray.join("\n");;
			} else fieldValue='';
		}
		// FOR SELECT BELOW
		var fieldMeta=plugin.settings.tables[table].fields[field];
		if (!fieldMeta) {
			return fieldValue;
		}
		if (fieldMeta.type=='select' || fieldMeta.type=="checkbox" || fieldMeta.type=="radio") {
			var selectedVals=String(record[field]).split(",");
			var selectedLabels=[];
			$.each(selectedVals,function(key,value) {
				selectedLabels.push(fieldMeta.values[value]);
			});
			fieldValue=selectedLabels.join(",");
		} else if (fieldMeta.type=='file') {
			//console.log('FILEPRE',fieldValue);
			fieldValue=plugin.api.view.renderFileField(table,field,fieldValue);
			//console.log('FILE',fieldValue);
		} else if (fieldMeta.type=='image') {
			fieldValue=plugin.api.view.renderImageField(table,field,fieldValue,record['rowid']);
			//fieldValue="<a target='_new' href='"+fieldValue+";' >"+fieldValue+"</a>";
		} else if (fieldMeta.type=='url') {
			fieldValue="<a target='_new' href='"+fieldValue+";' >"+fieldValue+"</a>";
		} else if (fieldMeta.type=='email') {
			fieldValue="<a href='mailto:"+fieldValue+";' >"+fieldValue+"</a>";
		} else if (fieldMeta.type=='color') {
			//fieldValue="<span style='background-color:"+fieldValue+";' >"+fieldValue+"</span>";
		} else if (fieldMeta.type=='datetime' || fieldMeta.type=='date') {
			if (fieldValue) {
				if (fieldMeta.type=='datetime') {
					fieldValue=plugin.api.view.formatDate(fieldValue,true);
				} else {
					fieldValue=plugin.api.view.formatDate(fieldValue);
				}
			}
		} else if (fieldMeta.type=='boolean') {
			if (record[field]==1) {
				fieldValue="true";
			} else {
				fieldValue="false";
			}
		}
		if (fieldValue===null || fieldValue===undefined) fieldValue='';
		return fieldValue;
	},
	formatDate : function(date,alsoTime,timeOnly) {
		var d=new Date(date);
		if (String(date).length>0 && d.getFullYear()>0) {
			var date=d.getFullYear()+'-'+(d.getMonth()+1)+"-"+d.getDate();
			var time='';
			if (alsoTime) {
				var minutes=d.getMinutes();
				if (minutes<10) minutes="0"+minutes;
				var seconds=d.getSeconds();
				if (seconds<10) seconds="0"+seconds;
				time=d.getHours()+":"+minutes+":"+seconds;
				date+=" "+time;
			}
			if (timeOnly) return time; 
			else return date;
		} else return '';
	},
	// post list rendering HOOK
	renderListFinalCallback : function(table,fields,records) {
	},
	// RENDER FORM
	fileChangeEvent : function(table,fileInput) {
		var plugin=this;
		var files = fileInput.files; // FileList object
		if (files && files.length>0) {
			var output = [];
			for (var i = 0, f; f = files[i]; i++) {
			  var tmpFile={'name':f.name,'type':f.type,'size':f.size,'lastModifiedDate':f.lastModifiedDate}; 
			  var reader = new FileReader();
			  // Closure to capture the file information.
			  reader.onload = (function(theFile) {
				return function(e) {
					// merge into current and refresh list
					var key='';
					var keyParts=$(fileInput).parent().attr('class').split(' ')[0].split('-');
					if (keyParts.length==2) {
						key=keyParts[1];
						theFile.data=e.target.result;
						var currentFiles=plugin.api.view.getFormDataFiles(key);
						if (!$.isPlainObject(currentFiles)) currentFiles={}; 
						currentFiles[theFile.name]=theFile;
						var newFileList=plugin.api.view.renderFileInput(table,plugin.settings.tables[table].fields[key].label,key,JSON.stringify(currentFiles));
						$('.form-'+key+' input[type="file"]',plugin.formTarget).remove();
						$('.form-'+key+' .filelist',plugin.formTarget).replaceWith(newFileList);
						$('.removefilebutton',$('.form-'+key+' .filelist',plugin.formTarget)).click(function() { try {if (confirm('Really delete file '+$(this).parent().find('a.dataurl').data('name')+'?')) $(this).parent().remove(); } catch (e) {}; return false;});
						$('input[type="file"]',$('.form-'+key,plugin.formTarget)).bind('change',function (evt) {var inputEl=this; plugin.api.view.fileChangeEvent(table,inputEl); });
					} else {
						if (true) console.log('could not find key');	
					}
				};
			  })(f);
			  // Read in the image file as a data URL.
			  reader.readAsDataURL(f);
			}
		}
	},
	renderFileInput : function(table,label,key,theValue,accept) {
		var plugin=this;
		var fileList='';
		var valueVar=null;
		try {
		  var valueVar=JSON.parse(theValue);
		} catch (e) {
			if (true) console.log(e,theValue);	
		}
		if (valueVar!=null) $.each(valueVar,function(i,file) {
			fileList+="<span class='file' ><a class='dataurl' href='"+file.data+"' download='"+file.name+"' title='"+file.size+"kb  Last Modified "+file.lastmodifieddate+"' data-name='"+file.name+"' data-size='"+file.size+"' data-lastmodifieddate='"+file.lastmodifieddate+"'>"+file.name+'</a><span class="removefilebutton" ><a href="" ><img src="images/deleterecord.png" /></a></span></span> ';
		});
		if (String(accept).length>0) accept='accept="'+accept+'"';
		var formFields="<input class='form-editingdata'  type='file' "+accept+" multiple /><div class='filelist'>"+fileList+'</div>';
		return formFields; 
	},
	renderImageInput : function(table,label,key,theValue,accept) {
	console.log('RENDER IMAGE');
		var plugin=this;
		var fileList='';
		var valueVar=null;
		try {
		  var valueVar=JSON.parse(theValue);
		} catch (e) {
			if (true) console.log(e,theValue);	
		}
		if (valueVar!=null) $.each(valueVar,function(i,file) {
			fileList+="<span class='file' ><a class='dataurl' href='"+file.data+"' download='"+file.name+"' title='"+file.size+"kb  Last Modified "+file.lastmodifieddate+"' data-name='"+file.name+"' data-size='"+file.size+"' data-lastmodifieddate='"+file.lastmodifieddate+"'><img src='"+file.data+"' />"+'</a><span class="removefilebutton" ><a href="" ><img src="images/deleterecord.png" /></a></span></span> ';
		});
		if (String(accept).length>0) accept='accept="'+accept+'"';
		var formFields="<input class='form-editingdata'  type='file' "+accept+" multiple /><div class='filelist'>"+fileList+'</div>';
		return formFields; 
	},
	renderFileField : function(table,key,theValue) {
		var plugin=this;
		var fileList='';
		var valueVar=null;
		try {
		  var valueVar=JSON.parse(theValue);
		} catch (e) {
			if (true) console.log('Failed to restore files from JSON',e,theValue);	
		}
		if (valueVar!=null) $.each(valueVar,function(i,file) {
			fileList+="<span class='file' ><a class='dataurl' href='"+file.data+"' download='"+file.name+"' title='"+file.size+"kb  Last Modified "+file.lastmodifieddate+"' data-name='"+file.name+"' data-size='"+file.size+"' data-lastmodifieddate='"+file.lastmodifieddate+"'>"+file.name+'</a></span> ';
		});
		return fileList; 
	},
	renderImageField : function(table,key,theValue,rowid) {
		var plugin=this;
		var fileList='';
		// empty data for async load back in renderRecords
		fileList+="<span class='images' ><a class='dataurl' data-autoloadtable='"+table+"' data-autoloadfield='"+key+"' href='#' data-rowid='"+rowid+"' ><img src='' />"+'</a></span> ';
		return fileList; 
		/*var fileList='';
		var valueVar=null;
		try {
		  var valueVar=JSON.parse(theValue);
		} catch (e) {
			if (true) console.log('Failed to restore images from JSON',e,theValue);	
		}
		if (valueVar!=null) $.each(valueVar,function(i,file) {
			fileList+="<span class='images' ><a class='dataurl' href='"+file.data+"' download='"+file.name+"' title='"+file.size+"kb Last Modified "+file.lastmodifieddate+"' data-name='"+file.name+"' data-size='"+file.size+"' data-lastmodifieddate='"+file.lastmodifieddate+"'><img src='"+file.data+"' />"+'</a></span> ';
		});
		return fileList; 
		*/
	},
	renderForm : function(table,fields,record) {
	console.log('render form',table,fields,record)
		var plugin=this;
		var initRTE=false;
		var joinsToInitialise=[];
		var svgEditors=[];
		var formInputsCollection={};
		var saveButton=$(plugin.settings.templates.formSaveButton).addClass('form-OK')[0].outerHTML;
		var cancelButton=$(plugin.settings.templates.formCancelButton).addClass('form-cancel')[0].outerHTML;
		var formButtons=plugin.settings.templates.formButtons.replace(/\$\{formSaveButton\}/g,saveButton).replace(/\$\{formCancelButton\}/g,cancelButton);
		var formInputs=''; //plugin.api.view.renderFormInputsNew(table,fields,record);
		var formInputsCollection={};
		var toHide=[];
		var toHideLabel=[];
		var toValidate={};
		var depends={};
		$.each(fields,function(i,field) {
			var label='';
			var formInputResults=plugin.api.view.renderFormInput(table,field,record);
			if (formInputResults['hideLabel']===false) label= plugin.settings.templates.formLabel.replace(/\$\{fieldLabel\}/g,plugin.api.view.renderFieldLabel(table,field));
			var formInputTmp=$(plugin.settings.templates.formInput.replace(/\$\{formInput\}/g,"${"+field+"}").replace(/\$\{formLabel\}/g,label)).addClass('form-'+field);
			var formInput=formInputResults['formInput'];
			// handle special input types
			//console.log("FR",field,formInputResults);
			if (formInputResults['hideInputWrapper']) toHide.push(field); //formInputTmp.css('display','none');
			//if (formInputResults['hideInputWrapper']) toHide.push(field); //formInputTmp.css('display','none');
			if (String(formInputResults['addInputWrapperClass']).length>0) formInputTmp.addClass(formInputResults['addInputWrapperClass']);
			if (formInputResults['svg']) svgEditors.push(field);
			if (formInputResults['validation']) toValidate[field]=formInputResults['validation'];
			if (formInputResults['depends']) {
				depends[formInputResults.depends.field]={field:formInputResults.depends.field,match:formInputResults.depends.match,'show':field};
				//$.extend({},formInputResults.depends,{'show':field});
				toHide.push(field);
			}
			if (formInputResults['join']) joinsToInitialise.push(formInputResults['join']);
			if (formInputResults['initRTE']) initRTE=true;
			formInputs+=formInputTmp[0].outerHTML;
			// for templating at form template level
			formInputsCollection[field]=formInput;
		});
		// ensure rowid field
		if ($.inArray('rowid',fields)==-1) {
			var recordRowId=record.rowid ? record.rowid : '';
			var formInput="<input class='form-editingdata'  type='text' value='"+recordRowId+"' />";
			var formInputTmp=$(plugin.settings.templates.formInput.replace(/\$\{formInput\}/g,formInput).replace(/\$\{formLabel\}/g,'')).addClass('form-rowid').css('display','none');
			formInputs+=formInputTmp[0].outerHTML;
			// for templating at form template level
			formInputsCollection.rowid=formInput;
		}
		var form=$(plugin.settings.templates.form.replace(/\$\{formSaveButton\}/g,saveButton).replace(/\$\{formCancelButton\}/g,cancelButton).replace(/\$\{formInputs\}/g,formInputs).replace(/\$\{formButtons\}/g,formButtons)).addClass('formwrapper').addClass(table+'-form')[0].outerHTML;
		// now iterate fields replacing inputs
		$.each(formInputsCollection,function(field,formInput) {
			var rg=new RegExp("\\$\\{"+field+"\\}",'g');
			form=form.replace(rg,formInput);
		});
		console.log('RENDERED FORM',form);
		var formTarget=plugin.formTarget;
		console.log('clear form target',formTarget);
		$('.formwrapper',formTarget).remove();
		$(formTarget).append(form);
		$.each(toHide,function(key,value) {
			$('.form-'+value,formTarget).hide(); //css('display','none');
		});
		//console.log('nowbind',toHide,depends,formTarget);
		plugin.api.view.bindFormInputs(table,record,joinsToInitialise,svgEditors,initRTE,toValidate,depends);
		plugin.api.view.renderFormFinalCallback(table,fields,record);
	},
	renderFormFinalCallback : function(table,fields,record) {
		console.log('renderFormFinalCallback',table,fields,record);
	},
	renderFormInput : function(table,key,record) {
		//console.log('RFI',table,key)
		var plugin=this;
		var formInput='';
		var recordValue=record[key] ? record[key] : '';
		var results={addInputWrapperClass:'',svg:false,rte:false,hideLabel:false,hideInputWrapper:false};
		if (key.substr(0,1)!=='_') { 
			// visibility dependancies ?
			if (plugin.settings.tables[table] && plugin.settings.tables[table].fields && plugin.settings.tables[table].fields[key] && plugin.settings.tables[table].fields[key].depends && plugin.settings.tables[table].fields[key].depends.field && plugin.settings.tables[table].fields[key].depends.field.length >0) {
				results.depends=plugin.settings.tables[table].fields[key].depends;
			}
			if (key=='rowid') {
				formInput="<input class='form-editingdata'  type='text' value='"+recordValue+"' />";
			// explicitly configured joins are rendered async to load related records
			} else if (plugin.settings.tables[table] && plugin.settings.tables[table].joins && plugin.settings.tables[table].joins[key] && plugin.settings.tables[table].joins[key].type) {
					//console.log('RFJOIN',table,key)
					formInput='<span class="join" id="join-'+table+'-'+key+'"  ></span>';
					results.join={label:'',table:table,tableRowId:record.rowid,key:key,record:record['_'+key+'_ids'],id:'join-'+table+'-'+key};
			// the opposite side of a join is created on init and rendered as a hidden field due to fk attribute marker	
			} else if (plugin.settings.tables[table] && plugin.settings.tables[table].fields && plugin.settings.tables[table].fields[key] && plugin.settings.tables[table].fields[key].fk=='true') {
				formInput="<input type='hidden' class='form-editingdata' value='"+record['_'+key+'_ids']+"' />";
				results.hideInputWrapper=true;
			// other field types
			} else {
				var fieldMeta={};
				if (plugin.settings.tables[table] && plugin.settings.tables[table].fields) fieldMeta=plugin.settings.tables[table].fields[key];
				// FIELD TYPE TEXT
				var fieldType=fieldMeta.type;
				// special handle html5 datetime
				var html5Types=String('datetime,date,time,email,month,number,range,search,color,tel,url,week,text').split(',');	
				if (plugin.settings.tables[table] && plugin.settings.tables[table].fields && plugin.settings.tables[table].fields[key]) { 
					if (fieldType=='datetime') {	
						formInput="<input class='form-editingdata date'  type='date' value='"+plugin.api.view.formatDate(recordValue)+"' />";
						formInput+="<input class='form-editingdata time'  type='time' value='"+plugin.api.view.formatDate(recordValue,true,true)+"' />";
					} else if ($.inArray(fieldType,html5Types)>=0) {					
						formInput="<input class='form-editingdata'  type='"+fieldType+"' value='"+recordValue+"' />";
						if (fieldMeta.validation) results.validation=$.extend({},fieldMeta.validation,{table:table,field:key,changeSelector:'.form-'+key+' input.form-editingdata'});
					} else if (fieldType=='file') {
						formInput=plugin.api.view.renderFileInput(table,fieldMeta.label,key,recordValue);
					} else if (fieldType=='image') {
						formInput=plugin.api.view.renderImageInput(table,fieldMeta.label,key,recordValue,'image/*');
					} else if (fieldType=='password') {
							formInput="<input class='form-editingdata'  type='"+fieldType+"' value='"+recordValue+"' /><span class='repeatpasswordlabel'> repeat </span><input class='form-editingdata-check'  type='"+fieldType+"' value='"+recordValue+"' />";
							if (fieldMeta.validation) results.validation=$.extend({},fieldMeta.validation,{password:true,table:table,field:key,changeSelector:'.form-'+key+' input'});
					} else if (fieldType=='rte') {
							formInput="<textarea class='rte form-editingdata'  type='"+fieldType+"' >"+recordValue+"</textarea>";
							results.initRTE=true;
					} else if (fieldType=='textarea') {
							formInput="<textarea class='form-editingdata'  type='"+fieldType+"' >"+recordValue+"</textarea>";
							if (fieldMeta.validation)  results.validation=$.extend({},fieldMeta.validation,{table:table,field:key,changeSelector:'.form-'+key+' textarea'});
					} else if (fieldType=='svg') {
							formInput="<iframe class='form-editingdata svgeditor' width='900' height='550' src='lib/svg-edit/svg-editor.html' />";
							results.svg=true;
					}  else if (fieldType=='sheet') {
						// ensure empty sheet 
						if ($.trim(recordValue)=='') {
							recordValue='<table><tr><td></td></tr></table>';
						}
						results.addInputWrapperClass='sheet'
						results.hideLabel=true;
						formInput=recordValue;
					} else if (fieldType=='select') {
						var selectOptions='';
						var selectedVals=[];
						if ($.trim(recordValue).length>0) selectedVals=recordValue.split(",");
						$.each(fieldMeta.values,function(optionKey,optionValue) {
							var selected='';
							if ($.inArray(optionKey,selectedVals)>=0) selected=' selected ';
							selectOptions+='<option value="'+optionKey+'" '+selected+' >'+optionValue+'</option>';
						});
						var multiple='';
						if (fieldMeta.multiple==true) multiple=' multiple '; 
						if (fieldMeta.validation) results.validation=$.extend({},fieldMeta.validation,{table:table,field:key,changeSelector:'.form-'+key+' select.form-editingdata'});
						formInput="<select "+multiple+" class='form-editingdata' >"+selectOptions+"</select>";
					} else if (fieldType=='radio') {
						var selectOptions='';
						$.each(fieldMeta.values,function(optionKey,optionValue) {
							var selected='';
							if (optionKey==recordValue) selected=' checked ';
							selectOptions+='<label><input  class="form-editingdata" name="'+key+'" type="'+fieldType+'"  value="'+optionKey+'" '+selected+' />'+optionValue+'</label>';
						});
						formInput=selectOptions;
					} else if (fieldType=='checkbox') {
						var selectOptions='';
						var selectedVals=[];
						if ($.trim(recordValue).length>0) selectedVals=recordValue.split(",");
						$.each(fieldMeta.values,function(optionKey,optionValue) {
							var selected='';
							if ($.inArray(optionKey,selectedVals)>=0) selected=' checked ';
							selectOptions+='<label><input  class="form-editingdata" type="'+fieldType+'"  value="'+optionKey+'" '+selected+' />'+optionValue+'</label>';
						});
						if (fieldMeta.validation) results.validation=$.extend({},fieldMeta.validation,{table:table,field:key,changeSelector:'.form-'+key+' input.form-editingdata'});
						formInput=selectOptions;
					} else if (fieldType=='boolean') {
						var selected='';
						if (recordValue==1) selected=' checked ';
						formInput="<input  class='form-editingdata' type='checkbox'  value='1' "+selected+" />";
					} else {
						formInput="NOT IMPLEMENTED";
					}
				} else {
					if (plugin.settings.debug) console.log('not rowid, a join nor a field '+table+' '+key)	
				}
			}
		}
		results.formInput=formInput;
		//console.log(results);
		return results;
	},
	bindFormInputs : function(table,record,joinsToInitialise,svgEditors,initRTE,toValidate,depends) {
		var plugin=this;
		var formTarget=plugin.formTarget;
		// form triggers
		$.each(joinsToInitialise,function(key,value) {
			plugin.api.view.renderJoin(value.label,value.table,value.key,value.record,value.id,value.tableRowId);
		});
		// on change validation
		//console.log('tovalidate',toValidate);
		$.each(toValidate,function(key,value) {
		//console.log('bind validation change '+key,value);
			$(value.changeSelector,formTarget).bind('change.validation',function() {
			//console.log('change '+key);
				var errors=plugin.api.model.validate(table,key);
				//console.log(errors);
				if (errors && errors.length>0)  {
					$.each(errors,function(i,errorObject) {
						plugin.api.view.removeMessage($('.form-'+key));
						plugin.api.view.sendMessage(errorObject.message,$('.form-'+errorObject.field),-1,true,true);
					});
				} else {
					plugin.api.view.removeMessage($('.form-'+key));
				}
			});;
		});
		
		/*
		//
		*/
		// depends visibility
		//console.log('bind depends',depends);
		$.each(depends,function(changeField,dependsMeta) {
			$('.form-'+changeField+' input',formTarget).bind('change',function(evt) {
				var formFieldData=plugin.api.view.getFormDataField(table,dependsMeta.field);
				// pattern match
				if (dependsMeta.match!=undefined)  {
					if ($.isArray(dependsMeta.match)) {
						var result=true;
						$.each(dependsMeta.match,function(i,toMatch) {
							var match=new RegExp(toMatch);
							if (!match.test(formFieldData)) result=false;
						});
						if (result) {
							$('.form-'+dependsMeta.show,formTarget).show();
							$('.form-'+dependsMeta.show+' input.form-editingdata',formTarget).focus();
						} else {
							$('.form-'+dependsMeta.show).hide();
						}
					} else {
						var match=new RegExp(dependsMeta.match);
						if (match.test(formFieldData)) {
							$('.form-'+dependsMeta.show,formTarget).show();
							$('.form-'+dependsMeta.show+' input.form-editingdata',formTarget).focus();
						} else {
							$('.form-'+dependsMeta.show,formTarget).hide();
						}
					}
				// just require a value
				} else {
					if (formFieldData.length>0) {
						$('.form-'+dependsMeta.show,formTarget).show();
						$('.form-'+dependsMeta.show+' input.form-editingdata',formTarget).focus();
					} else {
						$('.form-'+dependsMeta.show,formTarget).hide();
					}
				}
			});
		});
	
		// rte
		if (initRTE && $.fn.rte && rte_toolbar && html_toolbar) { 
			$('textarea.rte',formTarget).rte({
				controls_rte: rte_toolbar,
				controls_html: html_toolbar
			});
		}
		// svg
		$.each(svgEditors,function(i,fieldKey) {
			var iframe=document.querySelector('.form-'+fieldKey+' iframe.svgeditor',formTarget);
			if (iframe.contentWindow.svgEditor) { 
				$(iframe).ready(function() {
					// waiting for real load
					(function(){
						try {
							iframe.contentWindow.svgEditor.ready(function() { 
								var svgCanvas = new embedded_svg_edit(iframe);	
								$(iframe).parent().data('canvas',svgCanvas)	
								var setSvg = function() {
									if (record[fieldKey] && $.trim(record[fieldKey])!='') {
										svgCanvas.setSvgString(record[fieldKey]);
									} else {
										svgCanvas.setSvgString('<svg width="640" height="480" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"></svg>');
									}
								}   
								setSvg();
							});
						}
						catch (Ex){
							setTimeout(arguments.callee, 1000);
						}
					})();
				})
			} else {
				if (true) console.log('SVG library not included');	
			}
		});
			
		// manage files when they are selected
		$('input[type="file"]',formTarget).bind('change',function (evt) {plugin.api.view.fileChangeEvent(table,evt.target); });
		$('.removefilebutton',formTarget).click(function() {try {if (confirm('Really delete file '+$(this).parent().find('a.dataurl').data('name')+'?')) $(this).parent().remove();} catch (e) {}; return false;});
		// save and cancel
		$('.formwrapper .form-buttons .form-OK',formTarget).click(function() { 
			plugin.api.controller.validateAndSaveForm(table);
			return false;
		});
		$('form',formTarget).submit(function () {
			plugin.api.controller.validateAndSaveForm(table);
			return false;
		});
		$('.formwrapper .form-buttons .form-cancel',formTarget).click(function() { 
			try {
				if (plugin.api.view.popForm()===false) { 
					plugin.api.view.removeForm();
					plugin.api.controller.initList();
				}								
				return false; 
			} catch (e) {
				if (plugin.settings.debug) console.log(e.message,e);
				return false;	
			}
		});							
		$('.editablerecords',formTarget).hide();
		$('.searchers',plugin.searchTarget).hide();
		$('.formwrapper',formTarget).show();
		// spreadsheet after show form so sizing works correctly
		if ($.fn.sheet) {
			$('.sheet',plugin).sheet({
				menuLeft: function(jS) { return  $.sheet.menuLeft.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); },
				menuRight: function(jS) { 
					var menu = $.sheet.menuRight.replace(/sheetInstance/g, "$.sheet.instance[" + jS.I + "]"); menu = $(menu); menu.find('.colorPickerCell').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('background-color', $(this).val()); }); menu.find('.colorPickerFont').colorPicker().change(function(){ $.sheet.instance[jS.I].cellChangeStyle('color', $(this).val());}); menu.find('.colorPickers').children().eq(1).css('background-image', "url('images/palette.png')");  menu.find('.colorPickers').children().eq(3).css('background-image', "url('images/palette_bg.png')");return menu;}
			});
		} else  {
			if (true) console.log('sheet lib not loaded');	
		}
		plugin.api.view.renderFormFinalCallback(record);
		$('input.form-editingdata:visible',formTarget).first().focus();
		return false;
	},
	renderFormFinalCallback : function(record) {
	
	},
	bindAutoComplete : function(element,joinMeta,bindToList,label,table,join,selectedIds,targetID,tableRowId)  {
		var plugin=this;
		$(element)
		  // don't navigate away from the field on tab when selecting an item
		  .bind( "keydown", function( event ) {
			var newValue=$(this).val();
			var thisInput=this;
			if ( event.keyCode === $.ui.keyCode.TAB &&
				$( this ).data( "autocomplete" ).menu.active ) {
				event.preventDefault();
			} else if ( event.keyCode === $.ui.keyCode.ENTER ) {
				if ($('.ui-autocomplete .ui-state-focus').length>0) {
				} else {
					var defaults={};
					var targetField='';
					var found=false;
					// get the first real field and set value
					$.each(String(plugin.settings.tables[table].views[plugin.api.view.checkView('form',table)].viewFields).split(","),function(ik,fieldName) {
						if (!found && plugin.settings.tables[table].fields[fieldName]) {
							defaults[fieldName]=newValue;
							found=true;
						}  
					});
					plugin.api.controller.newChildRecord(label,table,join,joinMeta,selectedIds,targetID,tableRowId,defaults);
				}
				event.preventDefault();
			}
		  })
		  .autocomplete({
			source: function( request, response ) {
				var query="select * from "+joinMeta.table+"_label where label like '%"+request.term+"%'";
				var items=[];
				plugin.api.model.executeIteratorQuery(query,[],function(result) {
					items.push({label:result.label,value:result.rowid})
				},
				function () {
					response(items);
				});
			},
			search: function() {
			  // custom minLength
			  var term = this.value ;
			  if ( term.length < 1 ) {
				return false;
			  }
			},
			focus: function() {
			  // prevent value inserted on focus
			  return false;
			},
			select: function( event, ui ) {
				console.log('autocomplete select',table,ui.item,joinMeta,bindToList);
			  var newRow=plugin.api.view.renderJoinRow( ui.item.value,ui.item.label,joinMeta.type);
			  if (joinMeta.type=='fk') {
				 $('.join-selected-rowids',bindToList).val(ui.item.value);
				 $('tr:gt(0)',bindToList).remove();
				 bindToList.append(newRow);
			  } else if (joinMeta.type=='fkinchild') {
				var toSave={'rowid':ui.item.value};
				toSave[table]=tableRowId;
				 plugin.api.model.saveRecords(joinMeta.table,[toSave],function() {
					 bindToList.append(newRow);
					 var currentValues=$('.join-selected-rowids',bindToList).val().split(',');
					 currentValues.push(ui.item.value);
					 $('.join-selected-rowids',bindToList).val(currentValues.join(","));	
					 plugin.api.view.bindJoinRow(bindToList,joinMeta.table,joinMeta.type,label,table,join,selectedIds,targetID,tableRowId);
				})
			  } else {
				  bindToList.append(newRow);
				  var currentValues=$('.join-selected-rowids',bindToList).val().split(',');
				  currentValues.push(ui.item.value);
				  $('.join-selected-rowids',bindToList).val(currentValues.join(","));
			  }    
			  plugin.api.view.bindJoinRow(bindToList,joinMeta.table,joinMeta.type,label,table,join,selectedIds,targetID,tableRowId);
			  this.value='';
			  return false;
			}
		  });	
	},
	// CHILD EDITING
	bindJoinRow : function(joinDOM,joinTable,joinType,label,table,join,selectedIds,targetID,tableRowId)  {
		var plugin=this;
		$('.join-deletebutton',joinDOM).bind('click',function(event,ui) {
			var id=$('input.join-list-rowid',$(this).parent().parent()).val();
			if (joinType=='fkinchild') {
				//if (confirm('Really delete dependant child record ?')) { 
					var recordRow=this;
					plugin.api.model.deleteRecord(joinTable,id,function() {
						$(recordRow).parent().parent().remove();	
					});
				//}
			} else { 
				var currentValues=$('.join-selected-rowids',joinDOM).val().split(',');
				var newValues=[];
				$.each(currentValues,function(cvKey,cvValue) {
					if (cvValue!=id) newValues.push(cvValue);
				});
				$('.join-selected-rowids',joinDOM).val(newValues.join(","));
				$(this).parent().parent().remove();
			}
		});
		$('.join-editbutton',joinDOM).bind('click',function(event,ui) {
			try {
				var id=$('input.join-list-rowid',$(this).parent().parent()).val();
				plugin.api.controller.editRecord(joinTable,id,function(oldDOM,newDOM,idList) {
					// refresh joins
					plugin.api.view.renderJoin(label,table,join,selectedIds,targetID,tableRowId);
				});
			} catch (e) {
				if (plugin.settings.debug) console.log('err:bind join click',e.message,e);	
			}
		});
	},
	renderJoinRow : function(rowid,label,type) {
		return '<tr><td><input type="hidden" class="join-list-rowid" value="'+rowid+'" />'+label+'</td><th><img class="join-editbutton join-'+type+'-editbutton" src="images/editrecord.png" title="Edit record UID '+rowid+'" /><img class="join-deletebutton join-'+type+'-deletebutton"  src="images/deleterecord.png" title="Delete record UID '+rowid+'" /></th></tr></tr>';	
	},
	renderJoin : function (label,table,join,selectedIds,targetID,tableRowId){
		var plugin=this;
		var joinMeta=plugin.settings.tables[table].joins[join];
		var selectedList='';
		var addButton="<a class='join-addbutton' ><img src='images/addrecord.png' /></a>";
		var searcher="<span class='join-searcher' ><input type='text' class='join-searchinput'/></span>";
		if (joinMeta.type=='fk') {
			selectedList='<tr><td><b>'+label+'</b></td><th>'+searcher+addButton+'</th></tr>'+selectedList;
		} else if (joinMeta.type=='fkinchild') {
			selectedList='<tr><td><b>'+label+'</b></td><th>'+searcher+addButton+'</th></tr>'+selectedList;
		} else if (joinMeta.type=='mm') {
			selectedList='<tr><td><b>'+label+'</b></td><th>'+searcher+addButton+'</th></tr>'+selectedList;
		}
		// wrap it up, inject and bind
		var selString='';
		if (selectedIds) selString=selectedIds; 
		selectedList="<table class='form-"+join+"' ><input type='hidden' class='form-editingdata join-selected-rowids' value='"+selString+"' >"+selectedList+"</table>";
		var joinDOM=$('#'+targetID).html(selectedList);
		// add,search
		$('.join-addbutton',joinDOM).bind('click',function() {
			var defaults={};
			var fields=Object.keys(plugin.settings.tables[table].fields);
			console.log('SET THIS VALUE IN CHILD FORM',$('.join-searchinput',$(this).parents('.join')).val());
			defaults[fields[0]]=$('.join-searchinput',$(this).parents('.join')).val();
			plugin.api.controller.newChildRecord(label,table,join,joinMeta,selString,targetID,tableRowId,defaults);
		});
		plugin.api.view.bindAutoComplete($('.join-searchinput',joinDOM),joinMeta,$('.form-'+join,joinDOM),label,table,join,selectedIds,targetID,tableRowId);
		var selectedIdsArray=selectedIds;
		var selectedListRows='';
		if (selectedIds ) {
			selectedIdsArray=String(selectedIds).split(",");
			if (selectedIdsArray.length>0) {
				var filterString="rowid="+plugin.api.lib.cleanIdsArray(selectedIdsArray).join(" or rowid=");
				var query='select * from '+joinMeta.table+'_label where '+filterString;
				var keys=[];
				plugin.api.model.executeIteratorQuery(query,[],function(result) {
					// row result
					selectedListRows+=plugin.api.view.renderJoinRow(result['rowid'],result['label'],joinMeta.type);
					keys.push(result['rowid']);
				},
				function (results) {
					$('.form-'+join,joinDOM).append(selectedListRows);
					plugin.api.view.bindJoinRow(joinDOM,joinMeta.table,joinMeta.type,label,table,join,selectedIds,targetID,tableRowId);
				});
			}
		} else {
			selectedList+="NO SELECTION";	
		}
		return selectedList;
	},
	// when child editing, parent forms are pushed onto a non visible stack inside div#formstack with a callback function 
	// for reinitialisation etc when restored after save child
	pushForm : function(saveCallback) {
		var plugin=this;
		$(plugin).uniqueId();
		var formStackId="formstack-"+$(plugin).attr('id');
		// ensure container
		if ($('#'+formStackId).length!=1) {
			// beware hiding child edit form if made visible
			$('body').append("<hr width='100%' /><div id='"+formStackId+"' style='display: none;'></div>");
		} 
		if ($('.formwrapper .form-rowid',plugin).length > 0) {
			wrapper=$('<div class="formstackitem" ></div>')
			$('#'+formStackId).prepend(wrapper);
			wrapper.append($('.formwrapper',plugin.formTarget));
			if (!$.isFunction(saveCallback)) saveCallback=function() {}; 
			plugin.saveCallbackStack.push(saveCallback);
		}
	},
	popForm : function(idList) {
		var plugin=this;
		var formStackId="formstack-"+$(plugin).attr('id');
		var stackItems=$("#"+formStackId+" .formstackitem");
		if (stackItems && stackItems.length>0) {
			var callback=plugin.saveCallbackStack.pop();
			var toPopForm=$('.formwrapper',stackItems[0]);
			var oldForm=$('.formwrapper',plugin.formTarget)
			oldForm.replaceWith(toPopForm);
			stackItems[0].remove();
			if (callback) callback(oldForm,toPopForm,idList); 
			return true;
		} else {
			return false;
		}
	}
}