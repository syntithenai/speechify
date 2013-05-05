/* 
Copyright Steve Ryan <stever@syntithenai.com> 5/2013
Author: Steve Ryan <stever@syntithenai.com>
Date: 5/2013
*/
$.fn.quickDB.api.model={  
	errorCallback: function (tx,e,query) {
		if (true) console.log(query,e);	
	},
	init : function(callBack) {
		var plugin=this;
		//console.log('init',plugin.settings.tables.accounts.joins,plugin.settings.tables.accounts.joins.banks);
		
		// INITIALISATION	
		if (!plugin.settings.tables) {
			alert('Missing required database configuration');
			return;
		} else if (!window.openDatabase) {
			alert('Databases are not supported in this browser.');
			return;
		} else {
			if (!plugin.DBInitialised) {
				var version = '1.0';
				db = WebSQL(plugin.settings.dbShortName, version, plugin.settings.dbDisplayName, plugin.settings.dbMaxSize);
				// first up pull configuration  or on failure, create all tables
				db.rawTx(function (transaction) {
					transaction.executeSql(plugin.api.view.logQuery('select * from quickdbconfiguration'), [], 
						function(results) {
							// TODO ???
							plugin.dbconfiguration=results;
							// ensure views in configuration
							var schema=plugin.api.model.getSchema(plugin.settings.tables,true);
							if ($.isFunction(callBack)) callBack();
							plugin.DBInitialised=true;
						},
						function(transaction,err) {
							// ON FAIL CREATE ALL TABLES
							var schema=plugin.api.model.getSchema(plugin.settings.tables);
							schema.push('create table quickdbconfiguration (key TEXT,value TEXT)');
							$.each(schema,function(key,value) {
								transaction.executeSql(plugin.api.view.logQuery(value), [], 
									function(results) {},
									function(tx,err) {if (true) console.log(value,err);}
								);
							});
							// now import data and mark initialised
							if (plugin.settings.debug) console.log('created db');
							//plugin.api.model.importInitData(db);
							if ($.isFunction(callBack)) callBack();
							plugin.DBInitialised=true;
						}
					);
				});
			}
		}							    
	},
		/*********************************
	 * iterate master tables and dump 
		- into formats json,sql, csv(zip), pdf, ....
		- options - all tables, transactions view (including text vals for related fields)
	 *********************************/
	exportData : function(format,targetType,target) {
					
		//console.log('try export',targetType,target);
		if (!target || target.length==0) target=$('body'); 
		if ($.trim(targetType)=='') targetType='textarea'; 
		if ($.trim(format)=='') format='json';
		$('textarea.exportresults',target).remove()
		$(target).append('<textarea class="exportresults">');
		var realTarget=$('textarea.exportresults',target); //.hide();
		var tablesQuery="select * from sqlite_master where type='table' and tbl_name !='__WebKitDatabaseInfoTable__' and tbl_name not like '%_content' and tbl_name not like '%_segments' and tbl_name not like '%_segdir'";
		var plugin=this;
		var meta={};
		db.rawTx(function (transaction) {
			transaction.executeSql(plugin.api.view.logQuery(tablesQuery), [], 
				function (tx,results) {
					// FIRST UP QUERY EXISTING TABLES STUCTURE INTO META
					var lastTable='';
					for (var i=0; i< results.rows.length; i++) {
						var rowvalue=results.rows.item(i);
						//console.log('rowvalue',rowvalue);
						// extract fields
						var parts=rowvalue.sql.split(' ');
						var table=rowvalue.name;
						var createStatement=parts.slice(3).join(' ');
						createStatement=createStatement.substring(1,(createStatement.length-1));
						var createParts=("rowid INT,"+createStatement).split(',');
						if (!meta[table]) meta[table]={};
						if (!meta[table].fields) meta[table].fields={};
						var fields=[];
						$.each(createParts,function(j,cval) {
							var createPartsSplit=cval.split(' ');
							meta[table].fields[createPartsSplit[0]]={type:createPartsSplit[1]}
							fields.push(createPartsSplit[0]);
						});
						meta[table].fieldsList=fields.join(',');
						//meta[table].dataTokens="'"+fields.join("','")+"'";
						lastTable=table;
					}
					console.log('EXPO TABLES',lastTable,meta);
					// NOW SELECT REAL DATA
					$.each(meta,function(table,tableMeta) {					
						var allRecordsQuery='select rowid,* from '+table;
						console.log(format,allRecordsQuery);
						transaction.executeSql(plugin.api.view.logQuery(allRecordsQuery), [], 
							function (tx,iresults) {
								var tableExported=new Array();
								for (var i=0; i< iresults.rows.length; i++) {
									var realResult=iresults.rows.item(i);
									if (format=='json') {
										// fill record with legal field name/values pairs
										var record={};
										$.each(tableMeta.fields,function(field,fieldConfig) {
											record[field]=realResult[field];
										});
										console.log(record);
										tableExported.push(record);
									} else if (format=='sql') {
										var insertValues=[];
										//console.log(realResult);
										$.each(tableMeta.fields,function(field,fieldConfig) {
											var insVal=realResult[field];
											if (insVal===null) insVal='';
											insertValues.push('"'+insVal+'"');
										});
										tableExported.push("insert into "+table+" ("+meta[table].fieldsList+") values ("+insertValues.join(",")+")" );
									} else if (format=='csv') {
										var insertValues=[];
										var finalSeperator=",";
										var tokenProtector="'";
										$.each(tableMeta.fields,function(field,fieldConfig) {
											var insVal=$.trim(realResult[field]);
											// strip apostrophe to protect csv format
											insVal.replace(tokenProtector,"")
											insertValues.push('"'+insVal+'"');
										});
										tableExported.push(insertValues.join(finalSeperator));
									} else if (format=='tsv') {
										var insertValues=[];
										var	finalSeperator="	";
										var tokenProtector="	";
										$.each(tableMeta.fields,function(field,fieldConfig) {
											var insVal=$.trim(realResult[field]);
											// strip seperator token to protect csv format
											insVal.replace(tokenProtector,"")
											insertValues.push(insVal);
										});
										tableExported.push(insertValues.join(finalSeperator));
									} else if (format=='table') { 
										tableExported.push('TODO HTML');
									} 
									/*
									
									*/
								}  
								// done building rows for this table
								console.log('tableExported',tableExported);
								//console.log(table,lastTable);
								if (format=='json') {
									//console.log('json');
									if (table==lastTable) {
										realTarget.val('{'+realTarget.val()+',"'+table+'":'+JSON.stringify(tableExported)+'}');
									} else {
										if (realTarget.val().length>0) {
											realTarget.val(realTarget.val()+',"'+table+'":'+JSON.stringify(tableExported));
										} else {
											realTarget.val('"'+table+'":'+JSON.stringify(tableExported)+"");
										}
									}
									console.log(realTarget.val());
									realTarget.show();
								} else if (format=='sql') {
									//console.log('sql');
									if (realTarget.val().length>0&& tableExported.length>0) {
										realTarget.val(realTarget.val()+"\n"+"delete from "+table+"\n"+tableExported.join("\n")+"\n");
									} else {
										var firstText=tableExported.join("\n");
										if ($.trim(firstText).length>0) {
											realTarget.val("delete from "+table+"\n"+firstText+"\n");
										}
									}
									realTarget.show();
								} else if (format=='csv' || format=='tsv') {
									//console.log('other');
									realTarget.val(realTarget.val()+"\n--###"+table+"\n"+meta[table].fieldsList+"\n"+tableExported.join("\n")+"\n");
									realTarget.show();
								}
								if (table==lastTable) {
									if (targetType=='email') {
										//window.open('mailto:?subject=FINT%20Export&body='+encodeURIComponent(realTarget.val()),'_blank');
										$(target).prepend('<a class="dataurl" target="_blank" href="mailto:?subject=FINT%20Export&body='+encodeURIComponent(realTarget.val())+'" id="immediatemailtolink"  >MAILME</a>');
										var elem = document.getElementById("immediatemailtolink");
										if(document.dispatchEvent) {   // W3C
											var oEvent = document.createEvent( "MouseEvents" );
											oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, elem);
											elem.dispatchEvent( oEvent );
										}
										$('#immediatemailtolink').remove();
										//$('#immediatemailtolink',target).trigger('click');
										//$('#immediatedownloadlink').remove();
									} else if (targetType=='file') {
										$(target).prepend("<a class='dataurl' href='data:text/"+format+";charset=UTF-8," + encodeURIComponent(realTarget.val())+"' download='fint."+format+"' id='immediatedownloadlink' >download</a>");
										var elem = document.getElementById("immediatedownloadlink");
										if(document.dispatchEvent) {   // W3C
											var oEvent = document.createEvent( "MouseEvents" );
											oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, elem);
											elem.dispatchEvent( oEvent );
										}
										$('#immediatedownloadlink').remove();
										$('textarea.exportresults',target).show();
									} else if (targetType=='textarea') {
										$('textarea.exportresults',target).show();
									} else {
										return realTarget.val();
									}
								} 
							}
						);
						
					});
					
					
				}
			);
		});	
	},
	validateAll : function(table) {
		var plugin=this;
		var record=plugin.api.view.getFormData(table);
		var errors=[];
		$.each(record,function(key,value) {
			var errorsForField=plugin.api.model.validate(table,key,record[key]);
			$.each(errorsForField,function(i,value) {
				errors.push(value);
			});
		});
		return errors;
	},
	validate : function(table,field,value) {
		var plugin=this;
		var errors=[];
		var fieldValue=value;
		if (fieldValue===undefined) fieldValue=plugin.api.view.getFormDataField(table,field);
		//console.log('validate one',table,field,value);
		if (plugin.settings.tables[table] && plugin.settings.tables[table].fields[field]) {
			var fieldMeta=plugin.settings.tables[table].fields[field];
			var label='';
			if (fieldMeta.label) label=fieldMeta.label; 
			//  required
			if (fieldMeta.validation && fieldMeta.validation.required && String(fieldValue).length==0)  errors.push({field:field,message:'You must provide a value for '+label});
			// password
			if (fieldMeta.validation && fieldMeta.validation.password)  {
				var check=$('.form-'+field+' input.form-editingdata-check').val();
				//console.log('Val PAss',fieldValue,'ll',check);
				var messages=[];
				if (fieldValue!=check) messages.push('Passwords do not match');
				if (fieldValue.length<8)  messages.push('Password must be at least 8 characters');
				if (messages.length>0) errors.push({field:field,message:messages.join(' ')});
				
			}
			// match
			if (fieldMeta.validation && fieldMeta.validation.match!=undefined)  {
				//console.log('pattern match',fieldMeta.validation.match,fieldValue);
				if ($.isArray(fieldMeta.validation.match)) {
					var result=true;
					var messages=[];
					$.each(fieldMeta.validation.match,function(i,toMatch) {
						var match=new RegExp(toMatch.rule);
						//console.log('DV',fieldValue,toMatch.rule,match,match.test(fieldValue))
						if (!match.test(fieldValue)) {
							result=false;
							// just in case
							var message=toMatch.message;
							if (!message || message.length==0) toMatch.message="Failed to match required pattern";
							messages.push(message);
						}
					});
					if (!result) errors.push({field:field,message:messages.join(' ')});
				} /*else {
					var match=new RegExp(fieldMeta.validation.match);
					if (!match.test(formFieldData)) {
						// just in case
						if (!message || message.length==0) message="Failed to match required pattern";
						if (!result) errors.push({field:field,message:message});
					}
				}*/
			}	
		}
		return errors;
	},
	// TODO generalise to import from plugin.settings.importData
	importInitData : function(db) {
		var plugin=this;
		if (false) {
			 db.query(plugin.api.view.logQuery([
			"insert into banks(name) values ('anz');",
			"insert into banks(name) values ('westpac');",
			"insert into categories(name) values ('personal expenses');",
			"insert into categories(name) values ('expenses');",
			"insert into categories(name) values ('income');",
			"insert into mm_bankscategories (banks,categories) values (1,1);",
			"insert into mm_bankscategories (banks,categories) values (1,2);",
			"insert into mm_bankscategories (banks,categories) values (2,3);",
			"insert into mm_bankscategories (banks,categories) values (2,1);",
			"insert into accounts (name,number,banks) values ('myine','11111',1);",
			"insert into accounts (name,number,banks) values ('yours','22222',2);"
			]))
			.fail(function (tx, err) {
			  throw new Error(err.message);
			})
			.done(function(results) {
				if (plugin.settings.debug)console.log('done import');
			});
		}
	},
	// delete record then success or fail callback 
	deleteRecord : function(table,id,successCallback,failCallback) {
		var plugin=this;
		if (confirm('Really delete record '+id+' from table '+table+'?')) {
				var queries=[];
				// also delete any mm relations or dependant foreign children
				if (plugin.settings.tables[table].joins) {
					$.each(plugin.settings.tables[table].joins,function(key,value) {
						if (value.type=='fkinchild') {
							queries.push('delete from '+value.table+' where '+value.childKey+'='+id);
						} else if (value.type=='mm') {
							queries.push('delete from '+value.mmTable+' where '+table+'='+id);
						} else if (value.type=='fk' && value.dependant) {
							queries.push('delete from '+value.table+' where '+value.childKey+'='+id);
						}
					});
				}
				queries.push('delete from '+table+' where rowid='+id);
				db.query(plugin.api.view.logQuery(queries))
			.fail(function(tx,e) {
				if ($.isFunction(failCallback)) failCallback(id);	
				else plugin.api.model.errorCallback(e);
			})
			.done(function() {
				if ($.isFunction(successCallback)) successCallback(id);	
			});	
		}
	},
	// save record then success or fail callback 
	// also save into any MM tables for join selections
	saveRecords : function(table,records,successCallback,failCallback) {
		console.log('start save recs in model',table,records);
		var plugin=this;
		var toMMInsert=[];
		var mmQueries=[];
		var tablesMeta=plugin.settings.tables;
		var toInsert=[];
		var toUpdate=[];
		var toInsertIfFailUpdate=[];
		var dbRecord=[];
		var fieldList={};
		var updatedIds=[];
		// find next available record id
		db.query(plugin.api.view.logQuery('select max(rowid) maxid from '+table)) //,updateSql,toUpdate])
		.fail(function (tx, err) {
			if ($.isFunction(failCallback)) failCallback();
		})
		.done(function (result) {
			var nextId=result[0].maxid+1;
			//console.log('save recs next id is',nextId);
			$.each(records,function(key,record) {
				var mmInsertQueries=[];
				dbRecord={fields:[],values:{}};
				//console.log(table,tablesMeta);
				$.each(tablesMeta[table].fields,function(field,fieldMeta) {
					if (tablesMeta[table].joins) {
						// don't look at fields when there is a join with this key
						if (!tablesMeta[table].joins[field]) {
							if (record[field]!=undefined) { 	
								dbRecord.values[field]=record[field];
								fieldList[field]=field;
							}
						}
					} else {
						if (record[field]!=undefined) { 	
							dbRecord.values[field]=record[field];
							fieldList[field]=field;
						}
					}
				});
				try {
					if (tablesMeta[table].joins) {
						$.each(tablesMeta[table].joins,function(join,joinMeta) {
							if (record[join]!==undefined) {
								if (joinMeta.type=='fk') {
									dbRecord.values[join]=plugin.api.model.collateField(String(record[join]));
									fieldList[join]=join;
								} else if (joinMeta.type=='fkinchild') {
									// nada
								} else if (joinMeta.type=='mm') {
									// do mm saves
									if (parseInt(record.rowid)>0) {
										var deleteQuery='delete from '+joinMeta.mmTable+' where '+joinMeta.mmTable+'.'+table+'='+record.rowid;
										mmQueries.push(deleteQuery);
										$.each(String(record[join]).split(","),function(ik,fkValue) {
											if (parseInt(fkValue) >0) {
												var insertQuery='insert into '+joinMeta.mmTable+' ('+join+','+table+') values ('+fkValue+','+record.rowid+')';
												mmQueries.push(insertQuery);
											}
										});
									} else {
										$.each(String(record[join]).split(","),function(ik,fkValue) {
											if (parseInt(fkValue) >0) {
												var insertQuery='insert into '+joinMeta.mmTable+' ('+join+','+table+') select '+fkValue+',max(rowid) from '+table+'';
												mmInsertQueries.push(insertQuery);
											}
										});
									}
								}
							}
						});
					}
				} catch (e) {
					if (plugin.settings.debug)console.log('ERR:save inner',e.message,e);
				}
				dbRecord.fields=fieldList;
				// allow for save empty records
				if (parseInt(record.rowid)>0) {
					dbRecord.values.rowid=record.rowid;
					toUpdate.push(dbRecord);
					toInsertIfFailUpdate.push(dbRecord);
					updatedIds.push(record.rowid);
				} else {
					toInsert.push(dbRecord);
					toMMInsert.push(mmInsertQueries);
					updatedIds.push(nextId);
					nextId++;
				}
			});
			//console.log(toInsert,toMMInsert,updatedIds)
			var queries=mmQueries;
			
			for (var i=0 ; i< toInsert.length; i++) {
				var dataTokens=[];
				var insertTokens=[];
				
				var haveDataCounter=0; 
				var insertData=[];
				$.each(toInsert[i].fields,function(field,field2) {
					var fieldValue=toInsert[i].values[field];
					// no variable means no update (as per view.getFormData)
					// empty variable means blank value
					if (fieldValue!=undefined) {
						dataTokens.push('?');
						insertTokens.push(field);
						insertData.push(fieldValue);
						haveDataCounter++;
					}
				});
				var insertSql='';
				if (haveDataCounter>0) {
					insertSql='insert into '+table+' ('+insertTokens.join(",")+") values ("+dataTokens.join(",")+")";
					queries.push(insertSql);
					queries.push([insertData]);
				} else {
					// allow for insert with no data to get rowid
					insertSql='insert into '+table+' (rowid) select max(rowid)+1 from '+table;
					queries.push(insertSql);
				}
				$.each(toMMInsert[i],function(mm,mmVal) {
					queries.push(mmVal);
				});
			}
			// updates
			for (var i=0 ; i< toUpdate.length; i++) {
				var updateTokens=[];
				var updateData=[];
				$.each(toUpdate[i].fields,function(field,field2) {
					var fieldValue=toUpdate[i].values[field];
					if (fieldValue!=undefined) {
						 updateTokens.push(field+"=?");
						 updateData.push(fieldValue);
					}
				});
				// ignore empty updates
				if (updateTokens.length>0) {
					updateData.push(toUpdate[i].values.rowid);
					var updateSql='update '+table+' set '+updateTokens.join(",")+' where rowid=?';
					db.query(plugin.api.view.logQuery('insert into '+table+' (rowid) values ('+toUpdate[i].values.rowid+')'));
					queries.push(updateSql);	
					queries.push(updateData);
				}
			}
			//console.log('queries',queries);
			db.query(plugin.api.view.logQuery(queries)) //,updateSql,toUpdate])
			.fail(function (tx, err) {
				if ($.isFunction(failCallback)) failCallback();
			})
			.done(function () {
				if ($.isFunction(successCallback)) successCallback(updatedIds);
			});
		});
	},
	// merge csv list of duplicated values into unique sorted csv
	collateField : function(fieldToCollate) {
		var parts=fieldToCollate.split(",");
		var collated={};
		var collatedFinal=[];
		$.each(parts,function(pkey,part) {
			collated[part]=part;
		});
		$.each(collated,function(pkey,part) {
			if ($.trim(part).length>0) collatedFinal.push(part);
		});
		collatedFinal.sort();
		return collatedFinal.join(",");
	},
	// load single record
	loadRecord : function(table,view,id,callback,collateFields) {
		var plugin=this;
		console.log('model load rec',table,view,id,collateFields,'select * from '+table+'_'+view+' where rowid='+id);
		db.query(plugin.api.view.logQuery('select * from '+table+'_'+view+' where rowid='+id)) 
		.fail(function (tx, err) {
			if (plugin.settings.debug)console.log(err.message);
		})
		.done(function (results) {
			if (results && results.length>0) {
				var rowvalue=results[0];
				//console.log(results);
				var mungedRowvalue=JSON.parse(JSON.stringify(rowvalue));
				if (collateFields) {
					$.each(collateFields.split(","),function(key,collateField) {
						if (rowvalue[collateField]) {
							mungedRowvalue[collateField]=plugin.api.model.collateField(rowvalue[collateField]);
						} 	
						// also hidden ids field
						if (rowvalue['_'+collateField+'_ids']) {
							mungedRowvalue['_'+collateField+'_ids']=plugin.api.model.collateField(rowvalue['_'+collateField+'_ids']);
						} 	
					});
					rowvalue=mungedRowvalue;
				}
				callback(rowvalue);
			}
		});	
	},
	getSearchFilter : function(table,view,parameters) {
		var plugin=this;
		var searchFilters=[];
		var sortParts=[];
		var groupByParts=[];
		if (plugin.settings.tables[table].views[view] && plugin.settings.tables[table].views[view].searchers)  {
			$.each(plugin.settings.tables[table].views[view].searchers,function(key,searcherConfig) {
				if (searcherConfig.type=='checkbox' || searcherConfig.type=='select'|| searcherConfig.type=='radio') {
					// fields
					if (searcherConfig.fields) {
						$.each(searcherConfig.fields.split(","),function(fkey,fval) {
							var tokenMatches=[];
							$.each(parameters[key].split(','), function(li,searchToken) {
								if ($.trim(searchToken).length>0) tokenMatches.push(fval+"='"+searchToken+"'");
							});
							var tokensJoined=tokenMatches.join(' or ');
							if (tokensJoined.length>0) searchFilters.push(tokensJoined);
						});
					};
					// sql
					//console.log('searchconfig',searcherConfig);
					if (parameters[key] && parameters[key].length>0) {
						//$.each(searcherConfig.fields.split(","),function(fkey,fval) {
						//console.log(fkey,fval);
							var tokenMatches=[];
							$.each(parameters[key].split(','), function(li,searchToken) {
							//console.log(li,searchToken);
								$.each(searcherConfig.options, function(okey,oval) {
									//console.log(okey,oval);
									if (oval.value==searchToken && oval.sql && oval.sql.length>0) tokenMatches.push(oval.sql);
									if (oval.value==searchToken && oval.sqlSort && oval.sqlSort.length>0) sortParts.push(oval.sqlSort);
									if (oval.value==searchToken && oval.sqlGroupBy && oval.sqlGroupBy.length>0) groupByParts.push(oval.sqlGroupBy);
								});
							});
							var tokensJoined=tokenMatches.join(' or ');
							if (tokensJoined.length>0) searchFilters.push(tokensJoined);
						//});
					}
				} else if (searcherConfig.type=='date') {
					if (parameters[key].from && parameters[key].from.length>0)  {
						searchFilters.push(searcherConfig.fields +">='"+parameters[key].from+"'")
					}
					if (parameters[key].to && parameters[key].to.length>0)  {
						searchFilters.push(searcherConfig.fields +"<='"+parameters[key].to+"'")
					}
				} else if (searcherConfig.type=='livesearch') {
					if (parameters['_'+key+'_ids'] && parameters['_'+key+'_ids'].length>0) {
						var keySplit=parameters['_'+key+'_ids'].split(",");
						var liveSearchFilters=[];
						$.each(keySplit,function(i,keyVal) {
							liveSearchFilters.push("_"+searcherConfig.fields+"_ids='"+keyVal+"'");
						});
						searchFilters.push("("+liveSearchFilters.join(" or ")+")");
					} else if (parameters[key] && parameters[key].length>0) {
						// TODO csv fields support
						searchFilters.push(searcherConfig.fields+" like '%"+parameters[key]+"%'");
					}
				} else {
					//console.log('OTHER TEXT FILTRE',searcherConfig,parameters,key);
					if (searcherConfig.fields && parameters[key] && parameters[key].length>0) {
						if (plugin.settings.tables[table].fts) {
							//rowid in (select rowid from transactions where transactions.description match 'TO')
							searchFilters.push(table+'_'+view+'.rowid in (select rowid from '+table+' where '+searcherConfig.fields+" match '"+parameters[key].replace(/\*/g,' NEAR ')+"')");
							//searchFilters.push(searcherConfig.fields+" match '"+parameters[key].replace(/\*/g,' NEAR ')+"'");
						} else {
							$.each(parameters[key].split(' '),function(pj,valueToken) {
								//console.log('TOJEN',valueToken);
								if (valueToken.length>0) { 
									var tokenFilters=[];
									$.each(searcherConfig.fields.split(","),function(ij,fieldName) {
											tokenFilters.push(fieldName+" like '%"+valueToken+"%'");
									});
									searchFilters.push('('+tokenFilters.join(' or ')+')');
								}
							});
						}
					}
				}		
			});
		}
		//console.log('getsearchsfilter',searchFilters);
		var a= {filter:searchFilters.join(' and '),orderBy:sortParts.join(","),groupBy:groupByParts.join(',')};
		//console.log(a);
		return a;
	},
	/* create a sql string to query based on current search criteria */
	getListQuery : function(table,view,groupByOverride,parametersOverride) {
		var plugin=this;
		//if (plugin.settings.db.table.sort) sort=' order by '+  plugin.settings.db.table.sort;
		//if (plugin.settings.db.table.filter) filter=' and '+plugin.settings.db.table.filter;
		// hardcode list limit
		var limit=' limit 5000 ';
		var searchParameters=plugin.api.view.getSearchParameters(table,view);
		//console.log('SP',searchParameters,parametersOverride);
		if (parametersOverride && parametersOverride.length>0) {
			$.each(parametersOverride,function(key,value) {
				//console.log('PAROVE',key,value);
				searchParameters[key]=value;
			})
		}
		//console.log('SP2 merged',searchParameters);
		var searchFilterParts=plugin.api.model.getSearchFilter(table,view,searchParameters);
		var orderBy=searchFilterParts.orderBy;
		var searchFilter=searchFilterParts.filter;
		var groupBy=searchFilterParts.groupBy;
		if (groupByOverride && groupByOverride.length>0) groupBy=groupByOverride;  // use for livesearch search type
		if (searchFilter.length==0) searchFilter=' (1=1) '; 
		if (orderBy.length>0) orderBy=' order by '+orderBy;
		if (groupBy.length>0) groupBy=' group by '+groupBy;
		var query='select * from '+table+'_'+view+' where '+searchFilter+' '+groupBy+orderBy+limit;
		console.log('GEN QUERY ',query)
		return query;
	},
	// do search query
	executeIteratorQuery : function(query,queryParameters,iteratorCallback,finalCallback,collateFields) {
	 //  console.log('execiterqu '+query);
	   var plugin=this;
	   db.rawTx(function (transaction) {
			transaction.executeSql(plugin.api.view.logQuery(query), queryParameters, 
				function (tx,results) {
					var records=[];
					for (var i=0; i< results.rows.length; i++) {
						var rowvalue=results.rows.item(i);
						var mungedRowvalue=JSON.parse(JSON.stringify(rowvalue));
						if (rowvalue) {
							if (collateFields) {
								$.each(collateFields.split(","),function(key,collateField) {
									if (rowvalue[collateField]) {
										mungedRowvalue[collateField]=plugin.api.model.collateField(rowvalue[collateField]);
									} 	
									// also hidden ids field
									if (rowvalue['_'+collateField+'_ids']) {
										mungedRowvalue['_'+collateField+'_ids']=plugin.api.model.collateField(rowvalue['_'+collateField+'_ids']);
									} 	
								});
							}
							if ($.isFunction(finalCallback))  records.push(mungedRowvalue);
							if ($.isFunction(iteratorCallback)) iteratorCallback(rowvalue);
						}
					};
					if ($.isFunction(finalCallback))  finalCallback(records);
				},
				function(transaction,error) {
					plugin.api.model.errorCallback(transaction,error,query);
				}
			);    
		});
	},
	// initialise the model metadata
	// add tables and fields to support joins
	// @return updated tables meta data array
	// @plugin.settings.tables is updated with extra tables,fields,views and viewFields as required
	// TODO create indexes for join fields
	
	schemaEnsureJoinTablesAndFields : function(newTables) {
		//return newTables;
		var plugin=this;
		// FOREACH TABLES AND JOINS
		//console.log('START ADD TABLES/FIELDS',newTables)
		$.each(newTables,function(table,tableMeta) {
			var fields=[];
			if (tableMeta.joins) {
				$.each(tableMeta.joins,function(join,joinMeta) {
					// get a list of extra fields and tables to support all the join conditions
					// preconfigured csv list of table.field
					var joinTablesAndFields=[];
					var collatedConditions='';
					// 1. DISCOVER JOIN FIELDS
					// FROM config
					if (joinMeta.conditionFields) {
						joinTablesAndFields=joinMeta.conditionFields;
					} else {
						// AUTOMATIC
						// SIMPLE CASE ONLY- SINGLE TABLE, NO FUNCTIONS OR BRACKET GROUPING
						// if this is a problem use join.conditionFields(above) to bypass
						var joinString=joinMeta.condition;
						if (joinMeta.mmTableCondition) joinString+=" and "+joinMeta.mmTableCondition;
						var joinConditions=joinString.toLowerCase().split(/\ and\ |\ or\ /);
						//console.log('joinConditions',joinConditions);
						// get a list of extra fields and tables to support all the join conditions
						$.each(joinConditions,function(index,condition) {
							// limited parsing of join conditions - < > = and !
							var joinSides=condition.split(/\=|<|>|!/);
							//console.log('joinsides',joinSides);
							$.each(joinSides,function(iindex,ifield) {
								var parts=ifield.split(".");
								//console.log('parts',parts);
								if (parts.length>1) {
									var joinTableNameOrAlias=$.trim(parts[0]);
									var joinFieldName=$.trim(parts[1]);
									var joinTableName=joinTableNameOrAlias;
									if (tableMeta.joins[joinTableNameOrAlias]) joinTableName=tableMeta.joins[joinTableNameOrAlias].table;
									if (!joinTablesAndFields[joinTableName]) joinTablesAndFields[joinTableName]=[]; 
									joinTablesAndFields.push({'table':joinTableName,'field':joinFieldName});
								}
							});
						});
					} 
					// 1. POSTCONDITION:joinTablesAndFields is an array of objects {table:<realtable>,'field':<field>} format values
					//console.log('JTAF',joinTablesAndFields);
					var tmpTables={};
		
					// 2. CREATE NEW FIELDS TO SUPPORT JOINS
					$.each(joinTablesAndFields,function(itable,itableInfo) {
						//console.log('FILED',itable,itableInfo);
						// ensure table and field of type integer assumed for join key (control with conditionFields)
						if (!$.isPlainObject(tmpTables[itableInfo.table])) tmpTables[itableInfo.table]={}	;
						tmpTables[itableInfo.table][itableInfo.field]={'type':'integer','label':''};
					}); 
					// 2. POSTCONDITION : 	tmpTables contains all tables and fields(with dummy config) referenced in join conditions
					//console.log('TTABS',table,join,tmpTables);
					
					// 3. 	SCAN AND ADD TABLES,FIELDS TO SUPPORT THIS JOIN - 
					// 		FLAG JOIN TYPE
					// iterate all these tables referenced in the join
					//plugin.settings.debug=true;
					$.each(tmpTables,function(joinTable,joinFields)  {
						//console.log('add to ',joinTable,joinFields);
						// by default reference the single table referenced in joinMeta
						// SETTING MM TABLE ENSURE AUTO TABLE CREATE AND RECORD DELETE FOR MM TABLE
						// !! MM JOIN - add a new mm table to meta with fields as per join condition
						if (joinTable==joinMeta.mmTable) {
							newTables[joinTable]={fields:{}};
							$.each(joinFields,function(joinField,joinFieldDefn) {
								// ADD A FIELD
								newTables[joinTable].fields[joinField]=joinFieldDefn;
								newTables[joinTable].fields[joinField].label=joinMeta.label;
							});
							// FLAG JOIN AS MM
							newTables[table].joins[join].type='mm';
							//if (table=='accounts' && join=='banks') console.log('SET JOIN TYPE MM',table,joinTable,joinFields,newTables);
								
						} else {
							// !! REFERENCE TO PARENT TABLE
							if (table==joinTable) {
								//if (table=='accounts') console.log('reference this table',table,joinTable,joinFields)
								$.each(joinFields,function(joinField,joinFieldDefn) {
								
									// IGNORE ROWID
									if (joinField=='rowid') {
										if (plugin.settings.debug) console.log(['reference pk',joinTable,joinField]);
									} else {
										// ADD A FIELD IN PARENT TABLE TO SUPPORT FK
										if (!newTables[table].fields[joinField]) {
											//if (plugin.settings.debug)
											//console.log(['add field as fk',joinTable,joinField,joinFieldDefn]);
											newTables[table].fields[joinField]=joinFieldDefn;
											newTables[table].fields[joinField].label=joinMeta.label;
											//newTables[table].fields[joinField].type='INTEGER';
										} else {
											//if (plugin.settings.debug)
											//console.log(['already have field',joinTable,joinField]);	
										}
										// SET JOIN AS FK - add join in parent table meta
										newTables[table].joins[join].type='fk';
										//if (table=='accounts') console.log('SET JOIN TYPE FK',table,joinTable,joinFields,newTables);
								
										//newTables[table].joins[join].tables=joinMeta.table;
									}
								});
							// !! REFERENCE OTHER TABLE REQUIRED BY JOIN
							} else {
								// does the table exist in first cut definition
								if (newTables[joinTable]) { 
									$.each(joinFields,function(joinField,joinFieldDefn) {
										if (joinField=='rowid') {
											if (plugin.settings.debug)console.log(['reference fk',joinTable,joinField]);
										} else {
											// ADD FIELD (AND TAG FIELD AS FK)
											if (!newTables[joinTable].fields[joinField]) {
												//if (plugin.settings.debug2) 
												//console.log(['add field in foreign table',joinTable,joinField,joinFieldDefn]);
												newTables[joinTable].fields[joinField]={type:'text',fk:'true'};
											} else {
												//if (plugin.settings.debug)
												//console.log(['already have field in foreign table',joinTable,joinField]);
												newTables[joinTable].fields[joinField].fk='true';
											}
											// SET JOIN AS FKINCHILD (AND SET CHILDKEY)
											// BUG::WHICH JOIN DO WE ASSIGN THIS FIELD TO ??
											newTables[table].joins[join].type='fkinchild';
											newTables[table].joins[join].childKey=joinField;
											//if (table=='accounts' && join=='banks') 
											//if (table=='accounts') console.log('SET JOIN TYPE FKinchild',table,join,joinTable,joinField,joinFields,joinFieldDefn,newTables);
										}
									});
								} else {
									// NEED TO DEFINE ADDITIONAL TABLES TO SUPPORT JOIN EXTENDED REFERENCES
									// AUTO CREATE FOR MM ONLY
									if (plugin.settings.debug)console.log(['non mm missing table in join',joinTable]);	
								}
							}
						}
					});
					// 3. POSTCONDITION 
						// UPDATED NEWTABLES
							// ALL VALID JOINS HAVE A TYPE
							// ADD FIELDS TO SUPPORT JOINS WHERE FK IS REFERENCED IN A JOIN FIELD
								// FIELDS REFERENCING 
				})
			}
		}); // FINISHED FIRST ITERATION OF ALL TABLES
		// POSTCONDITIONS : FOR ALL TABLES, ALL JOINS HAVE BEEN TESTED FOR REQUIREMENTS (TABLES/FIELDS) WHICH HAVE BEEN PROVIDED INTO NEWTABLES
			
		//console.log('FINISHED ADD TABLES/FIELDS',newTables);
		
		function clone(item) {
			if (!item) { return item; } // null, undefined values check

			var types = [ Number, String, Boolean ], 
				result;

			// normalizing primitives if someone did new String('aaa'), or new Number('444');
			types.forEach(function(type) {
				if (item instanceof type) {
					result = type( item );
				}
			});

			if (typeof result == "undefined") {
				if (Object.prototype.toString.call( item ) === "[object Array]") {
					result = [];
					item.forEach(function(child, index, array) { 
						result[index] = clone( child );
					});
				} else if (typeof item == "object") {
					// testing that this is DOM
					if (item.nodeType && typeof item.cloneNode == "function") {
						var result = item.cloneNode( true );    
					} else if (!item.prototype) { // check that this is a literal
						if (item instanceof Date) {
							result = new Date(item);
						} else {
							// it is an object literal
							result = {};
							for (var i in item) {
								result[i] = clone( item[i] );
							}
						}
					} else {
						// depending what you would like here,
						// just keep the reference, or create new object
						if (false && item.constructor) {
							// would not advice to do that, reason? Read below
							result = new item.constructor();
						} else {
							result = item;
						}
					}
				} else {
					result = item;
				}
			}

			return result;
		}
		
		return clone(newTables);
	},
	schemaEnsureViews : function(newTables) {
		var plugin=this;
		$.each(newTables,function(table,tableMeta) {
			//var firstField='';
			var allFields=[];
			//var count=0;
			if (tableMeta.fields) {
				$.each(tableMeta.fields,function(fieldName,fieldMeta) {
					//if (count==0) {
						//firstField=fieldName;
					//	count++;	
					//}
					allFields.push(table+'.'+fieldName+' as '+fieldName);
				});			
				var views=tableMeta.views ? tableMeta.views : {};
				if (!views.label) {
					views.label={ fields : table+'.'+Object.keys(tableMeta.fields)[0]+' as label' };
					newTables[table].views=views;
				}
				if (!views.default) {
					views.default={ fields:allFields.join(",") };
					newTables[table].views=views;
				}
			} else {
				console.log('Invalid database configuration - table defined without fields ');
			}	
			// ENSURE VIEW.VIEWFIELDS WITH DEFAULT ALL TABLE FIELDS AND ALL JOINS FOR THIS VIEW THAT ARE REFERENCED IN VIEWMETA.FIELDS
			if (tableMeta.views) {
				$.each(tableMeta.views,function(viewName,viewMeta) {
					if (viewMeta.viewFields && viewMeta.viewFields.length>0) {
					} else {
						var viewFields=[];
						$.each(tableMeta.fields,function(field,fieldMeta) {
							if (viewMeta.fields.indexOf(table+'.'+field)!==-1) viewFields.push(field);
						});
						if (viewMeta.joins && viewMeta.joins.length>0) {
							$.each(viewMeta.joins.split(","),function(i,join) {
								if (viewMeta.fields.indexOf('_'+join+'_ids')!==-1) viewFields.push(join);
							});
						}
						// ensure any automatic reverse join fields
						//$.each(tableMeta.fields,function(field,fieldMeta) {
							//console.log('CHC',field,viewFields,viewFields.indexOf(field),fieldMeta);
							//if (viewFields && viewFields.indexOf(field)==-1 && fieldMeta.fk==="true") viewFields.push(field); 
						//});
						//if (viewFields) newTables[table].views[view].viewFields=viewFields.join(",");
						
						newTables[table].views[viewName].viewFields=viewFields.join(",");
					}
				});
			}
		});
		//console.log('GENVIEWS',newTables)
		return newTables;
	},

	schemaRenderCreateSQL : function(newTables) {
		var plugin=this;
		var tds=[];
		var vds=[];
		//console.log('schemaRenderCreateSQL',newTables);
		if (!newTables) return;
		$.each(newTables,function(table,tableMeta) {
			// create tables
			var fd=[];
			if (tableMeta.fields) {
				$.each(tableMeta.fields,function(field,fieldMeta) {
					fd.push(field+' TEXT');
				})	
			}
			var td='';
			if (tableMeta.fts) {
				td='create virtual table '+table+' using fts3('+fd.join(",")+')';
			} else  {
				td='create table if not exists '+table+' ('+fd.join(",")+")";
			}
			// views
			if (tableMeta.views) { 	// TODO remove -always true due to previous iteration of newTables
				$.each(tableMeta.views,function(view,viewMeta) {
					//console.log('ENSURE VIEWS',table,tableMeta,view,viewMeta );
					// strip brackets
					if (viewMeta.fields) { 
						var fieldsClean=viewMeta.fields.replace(/\(.*?\)/g, '');
						var fieldParts=fieldsClean.split(",");
						var viewFields=[];
						$.each(fieldParts,function(key,field) {
							var fieldSelectParts=$.trim(field).split(' ');
							var fieldName=fieldSelectParts[fieldSelectParts.length-1];
							var fieldNameParts=fieldName.split('.');
							if (fieldNameParts.length>1) {
								fieldName=fieldNameParts[1];
							}
							if (fieldName=='rowid' ||fieldName=='label' || (tableMeta.fields && tableMeta.fields[fieldName]) || (tableMeta.joins && tableMeta.joins[fieldName])) { 	
								viewFields.push(fieldName);
							}
						});
					}
					
					//console.log('ENSURE VIEWSDONE',newTables[table].views[view].viewFields);
					var allTablesAndJoins=table;
					// TODO CHECK ALIAS
					var jds=[];
					if (viewMeta.joins) {
						$.each(viewMeta.joins.split(','),function(key,join) {
							//console.log('create view',table,join,newTables[table]);
							if (newTables[table] && newTables[table].joins && newTables[table].joins[join]) {
								var joinMeta=newTables[table].joins[join];
								// first up fixed condition
								var prep='';
								if (joinMeta.mmTable && joinMeta.mmTableCondition) prep=joinMeta.mmTable+" on "+joinMeta.mmTableCondition+" left outer join ";
								if (joinMeta.condition && joinMeta.condition.length>0)  jds.push(prep+joinMeta.table+' '+join+' on '+joinMeta.condition);
							}
								// FROM HERE INTERPRET NEW MODEL WITH NESTED CONDITIONS
								/*var tableParts=joinMeta.tables.split(',');
								var joinMetaTable=joinMeta.table;
								//console.log('have join for view ',table,join,tableParts,joinMetaTable,joinMeta)
								// allow for alias
								if (aliases[table] && $.trim(aliases[table][joinMetaTable]).length>0) joinMetaTable+=' '+aliases[table][joinMetaTable];
								
								if (joinMeta.mmTable) {
									var conditionParts=joinMeta.condition.split(' and ');
									if (conditionParts[0].indexOf(joinMeta.mmTable)>=0) {
										jds.push(joinMeta.mmTable+' on '+conditionParts[0]+' ');
										jds.push(joinMetaTable+' on '+conditionParts[1]+' ');
									} else if (conditionParts[1] && String(conditionParts[1]).indexOf(joinMeta.mmTable)>=0) {
										jds.push(joinMeta.mmTable+' on '+conditionParts[1]+' ');
										jds.push(joinMetaTable+' on '+conditionParts[0]+' ');
									} else {
										if (plugin.settings.debug)console.log('error: join condition missing reference to mm table');
									}
								
								} else {
									// join tables as csv all tables defined in join condition
									var jmts=[];
									$.each(tableParts,function(tablePartKey,tablePartValue) {
										// allow for alias
										if (aliases[table] && $.trim(aliases[table][tablePartValue]).length>0) {
											jmts.push(tablePartValue+' '+aliases[table][tablePartValue]);
										} else {
											jmts.push(tablePartValue);
										}
									})
									jds.push(jmts.join(",")+' on '+joinMeta.condition+' ');
								}
							} else {
								if (true) console.log('Join '+join+' does not exist in table '+table);
							}
							// POSTCONDITION: jds join parts (to be left outer joined)
							*/
						});
					}
					if (jds.length>0) {
						allTablesAndJoins+=" left outer join "+jds.join(" left outer join ")
					}
					var vd='create view if not exists '+table+'_'+view+' as select '+table+'.rowid rowid,'+viewMeta.fields+' from '+allTablesAndJoins+' ';
					if (viewMeta.filter) vd+='where '+viewMeta.filter+' ';
					if (viewMeta.groupBy) vd+='group by '+viewMeta.groupBy+' ';
					if (viewMeta.orderBy) vd+='order by '+viewMeta.orderBy+' ';
					vd+="\n";
					vds.push(vd);
				});
			}
			tds.push(td);
		});
		$.each(vds,function(key,value) {
			tds.push(value);
		});
		console.log('CREATESQSL',tds);
		return tds;
	},
	/* initialise the model metadata
	// add tables and fields to support joins
	// add views and viewfields to model
	// @return array of sql create statements for all tables and views
	*/
	getSchema : function(tables,skipSQL) {
		var plugin=this;
		var newTables={};
		//console.log('JSON',clone(tables));
		//newTables=clone(tables);
		//console.log('JSON2',newTables);
		//$.extend(true,newTables,tables);
		var aliases={};
		// ITERATE TABLES
			// ANALYSE JOINS 
			// REWRITE TABLES METADATA TO INCLUDE JOIN FIELDS AND ALIASES
		newTables=plugin.api.model.schemaEnsureJoinTablesAndFields(tables);
		//console.log('start gs ADD TABLES/FIELDS',newTables.accounts,newTables.accounts.joins,newTables.accounts.joins.banks)
		// POSTCONDITION: 
		// now render the fields
		//console.log('FINAL',newTables);
		// ensure default views configuration for label and default keys
		newTables=plugin.api.model.schemaEnsureViews(newTables);
		console.log('FINAL',newTables);
		// after final tweaks, update main settings
		plugin.settings.tables=newTables;
		// render sql create as array of strings
		if (skipSQL) {
			return [];
		} else {
			return plugin.api.model.schemaRenderCreateSQL(newTables);
		}
	}
}