/* 
Copyright Steve Ryan <stever@syntithenai.com> 5/2013
Author: Steve Ryan <stever@syntithenai.com>
Date: 5/2013
*/
$.fn.quickDB.api.lib = {
	cleanIdsArray : function(mess) {
		var clean=[];
		var unique=[];
		$.each(mess,function(key,value) {
			var iVal=parseInt(value);
			if (iVal>0) {
				unique[iVal]=1;	
			}	
		});
		$.each(unique,function(key,value) {
			if (value===1) clean.push(key);
		});
		return clean;
	}
};
$.fn.quickDB.api.controller = {
	// decide default init action and after save action based on DOM data 
	initSwitch : function(initCommand,params) {
		var plugin=this;
		if (initCommand=='edit' && params && parseInt(params.rowid)>0) {
			// EDIT RECORD
			plugin.api.model.init(function() {
				plugin.api.controller.editRecord (plugin.settings.table,parseInt(params.rowid),function() {
					// explicit configured action after save ?
					if (params && String(params.afterSave).length>0) {
						plugin.controller.initSwitch(params.afterSave,params);
					} else {
						// default save callback on new top object is render list
						plugin.api.controller.initList();
					}
				})
			});
		} else if (initCommand=='new') {
			// NEW RECORD
			plugin.api.model.init(function() {
					plugin.api.controller.newRecord(plugin.settings.table,{},function() {
						// explicit configured action after save ?
						if (params && String(params.afterSave).length>0) {
							plugin.api.controller.initSwitch(params.afterSave,params);
						} else {
							// default save callback on new top object is render list
							plugin.api.controller.initList();
						}
					})
			});
		} else if (true || initCommand=='search') {
			// SEARCH
			plugin.api.model.init(function() {
				plugin.api.controller.initList()	
			});
		}
	},
	init: function() {
		var plugin=this;
		// PERFORMANCE TIMER
		plugin.timer={};
		plugin.timer.init=function() {
			this.start=(new Date().getTime() / 1000);//-1365731518
			this.prevAt=0;
		}
		plugin.timer.log=function(message) {
			var now=new Date().getTime() / 1000 ;
			var overall=now - this.start;
			logDiff=0;
			if (parseFloat(this.prevAt)>0) logDiff=now - this.prevAt;
			this.prevAt=now;
			//console.log('TIMER MESSAGE:',message,'TIME FOR PREV',logDiff,'OVERALL',overall);
		} 
		var initCommand=$(plugin).data('init');
		console.log('CONTROLLER INIT',initCommand,$(plugin).data());
		plugin.api.controller.initSwitch(initCommand,$(plugin).data());
	},
	newRecord: function(table,defaults,saveCallback) {
		var plugin=this;
		console.log('NEW REC',plugin.settings)
		if (!table) table= plugin.settings.table;
		var view=plugin.api.view.checkView('form',table);
		var blankValues={};
		var fieldsArray=plugin.settings.tables[table].views[view].viewFields.split(",");
		// defaults
		if (!defaults) defaults=[];
		$.each(fieldsArray,function(key,value) {
			blankValues[value]="";
			if (defaults && defaults[value]) blankValues[value]=defaults[value];
			// child editing, set id ?
			if (defaults && defaults['_'+value+'_ids']) blankValues['_'+value+'_ids']=defaults['_'+value+'_ids'];
		});
		// and any extras in defaults that are not in the fieldsArray
		//$.each(defaults,function(key,value) {
		//	if (!blankValues[key]) blankValues[key]=value; 
		//});
		// child editing? push current form onto stack
		plugin.api.view.pushForm(saveCallback);
		//console.log('NEW REC RENDER',table,fieldsArray,blankValues);
		plugin.api.view.renderForm(table,fieldsArray,blankValues);
		return false;
	},
	newChildRecord: function(label,table,join,joinMeta,selectedIds,targetID,tableRowId,defaults) {
		//console.log('NEW CHILD REC',label,table,join,joinMeta,selectedIds,targetID,tableRowId,defaults);
			
		var plugin=this;
		if (!defaults) defaults={};
		if (joinMeta.type=='fk') {
			// need to set key on save of new record
			//console.log('NEW CHILD REC FK',joinMeta.table,defaults);
			plugin.api.controller.newRecord(joinMeta.table,defaults,function (oldForm,newForm,savedId) {
				selectedIds=savedId;
				// callback to rerender join with updated values after restoring parent form
				plugin.api.view.renderJoin(label,table,join,selectedIds,targetID,savedId);
				plugin.api.view.focusFirstFormInput();
			});
		} else if (joinMeta.type=='fkinchild') {
			//console.log('NEW CHILD REC FKINCHILD');
			// force save parent record and set id
			// TODO delete on cancel to save mess in the database (CSJ ;))
			plugin.api.model.saveRecords(table,[plugin.api.view.getFormData(table)],function(results) {
				// create new record with parent id
				//console.log('NEW CHILD REC FKINCHILD SAVED PARENT',results);
				var parentId=parseInt(results[0]);
				defaults['_'+table+'_ids']=parentId;
				defaults[table]=parentId;
				// set the id in the parent form
				//console.log('NEW CHILD REC FKINCHILD SET PARENT FORM Id',parentId,'child defs',defaults);
				plugin.api.view.setFormRowId(parentId,plugin);
				// render child edit
				plugin.api.controller.newRecord(joinMeta.table,defaults,function (oldForm,newForm,savedId) {
						selectedIds+=','+savedId;
						//console.log('NEW CHILD REC NEWREC CALLBACK ON SAVE',savedId,selectedIds);
						// refresh join list in parent
						plugin.api.view.renderJoin(label,table,join,selectedIds,targetID,savedId);
						plugin.api.view.focusFirstFormInput();
				});
			});
		} else if (joinMeta.type=='mm') {
			// force save parent record and set child id
			plugin.api.model.saveRecords(table,[plugin.api.view.getFormData(table)],function(results) {
				// create new record with parent id
				var parentId=parseInt(results[0]);
				defaults['_'+table+'_ids']=parentId;
				// set the id in the parent form
				plugin.api.view.setFormRowId(parentId,plugin);
				// render child edit
				plugin.api.controller.newRecord(joinMeta.table,defaults,function (oldForm,newForm,savedId) {
						selectedIds+=','+savedId;
						// callback to rerender join with updated values after restoring parent form
						plugin.api.view.renderJoin(label,table,join,selectedIds,targetID,savedId);
						plugin.api.view.focusFirstFormInput();
				});
			});
		}
	},
	initListRow : function(plugin,record,view) {
	
	},
	initListRows : function(plugin,records,view) {
		
		//console.log('initINIlistrows',plugin.settings.table,plugin.settings.tables[plugin.settings.table].views[view],records);
		//return;
		plugin.api.view.renderRecords(plugin.settings.table,plugin.settings.tables[plugin.settings.table].views[view].viewFields.split(","),records);
		plugin.api.view.showList();
		// do we want to reset scroll on list reload. probably yes and then should be looking if we really need to call reload
		//$(window).scrollTop(0);
		// TODO REMOVE THIS IN FAVOR OF OVERRIDING THIS FUNCTION
		if (plugin.settings.callbacks && plugin.settings.callbacks.initList && $.isFunction(plugin.settings.callbacks.initList.finalCallback)) {
			plugin.settings.callbacks.initList.finalCallback.apply($(plugin), [record]);
		}
		//console.log('initINIlistrowsDONE');
	},
	initList : function () {
		var plugin=this;
		plugin.timer.init();
		plugin.timer.log('INIT LIST/START LIST QUERY');
		//console.log('controller init list',plugin);
		
		var view=plugin.api.view.checkView('list',plugin.settings.table);
		//console.log('CHECK SEASRCHER',view,plugin.settings.table);
		//&& plugin.settings.tables[plugin.settings.table].views[view].searchers.length>0
		if (plugin.settings.tables[plugin.settings.table].views && plugin.settings.tables[plugin.settings.table].views[view].searchers ) {
			//console.log('CHECK SEASRCHER OK',plugin.settings.table,view,plugin.settings.tables[plugin.settings.table].views[view].searchers);
			plugin.api.view.renderSearcher(plugin.settings.table,view,plugin.settings.tables[plugin.settings.table].views[view].searchers);
		} 
		//console.log('LISTQUERY',plugin.api.model.getListQuery(plugin.settings.table,view));
		plugin.api.model.executeIteratorQuery(plugin.api.model.getListQuery(plugin.settings.table,view), [],
			function(record) {
				plugin.api.controller.initListRow(plugin,record,view)
			},
			function(records) {
				plugin.timer.log('HAVE DATA NOW RENDER LIST ROWS');
				//console.log('plugin.api.controller.initListRows(plugin,records,view)');
				plugin.api.controller.initListRows(plugin,records,view)
			},
			plugin.settings.tables[plugin.settings.table].views[view].collateFields
		);
		return false;
	},
	deleteRecord : function(table,clickedRowId,clickedRow) {
		var plugin=this;
		if (clickedRowId>0) { 
			plugin.api.model.deleteRecord(table,clickedRowId,
				// success, now remove from DOM
				function () {
					plugin.api.view.sendMessage('Deleted');
					clickedRow.remove();	
				}
			);
		}
		return false;
	},
	editRecord : function(table,clickedRowId,saveCallback) { 
		var plugin=this;
		try {
			console.log('edit record ',table,clickedRowId,saveCallback);
			var view=plugin.api.view.checkView('form',plugin.settings.table);
			plugin.api.model.loadRecord(table,view,clickedRowId,function(fullRecord) {
				// child editing? save parent form on callstack
				console.log('loaded for edit ',view,fullRecord,plugin.settings.tables[table].views[view].viewFields)
				plugin.api.view.pushForm(saveCallback);
				plugin.api.view.renderForm(table,plugin.settings.tables[table].views[view].viewFields.split(","),fullRecord); 
			},
			plugin.settings.tables[table].views[view].collateFields);
		} catch (e) {
			if (true) console.log('err:editRecord',e.message,e);	
		}
		return false;
	},
	validateAndSaveForm : function(table) {
		var plugin=this;
		try{
			var toSave=plugin.api.view.getFormData(table);
			var errors=plugin.api.model.validateAll(table,toSave);
			if (errors.length>0) {
				$.each(errors,function(i,errorObject) {
					plugin.api.view.sendMessage(errorObject.message,$('.form-'+errorObject.field),-1,true,true);
				});
			} else { 
				plugin.api.model.saveRecords(table,[toSave],
					// success
					function (idList) {
						if (!plugin.api.view.popForm(idList)) { 
							plugin.api.view.removeForm();
							plugin.api.controller.initList();
						}
					},
					// fail
					function (message) {
						// send message prepended to edit form
						plugin.api.view.sendMessage(message,$('form.managerform'),plugin);	
					}
				);
			}
		} catch (e) { 
			if (true)  console.log('ERR:validateAndSaveForm',e.message,e); 
		}
	}
};