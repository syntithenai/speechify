/* 
Copyright Steve Ryan <stever@syntithenai.com> 5/013
Author: Steve Ryan <stever@syntithenai.com>
Date: 5/2013
*/

/*********************************
 * Convert a table with a single row of headers into a browser database driven CRUD UI
 * ! sqllite browser integration only available in chrome and safari ie webkit
 * Usage: QuickDB([ID for container containing defn table]);
 * contained table must be classed editablerecords and have a data-table attribute
 * Model definition must be provided in config or made available in global quickDBMeta
 The model is defined as object of table name, definition pairs.
 Each table has fields, joins, views, search.
 The fields list is straight forward.
 The joins list is expanded in init and interpreted in various places including view definitions, forms, lists, ....
 The views object must contain subkeys [which could be init generated] - label (which queries for a named field label) and default.
 It may also optionally contain a form or a list subkey. If these keys are not present, default is used for rendering.

 * The main functions of the class are stored in plugins.api.[model|controller|view] which can all be overridden with settings
 * the MODEL functions require the necessary record data/metadata as parameters to allow flexibility to work with many tables inside
 * one instance of the plugin. The model functions rely on view.sendMessage to provide user feedback.
 * the VIEW functions 
 * 
 * 
 * TODO and optionally data-dbtype
 * eg  <table data-table='myrecs' >
 * @ stever@syntithenai.com <Steve Ryan> 
 * @ 11/2012
 **********************************/
 Function.prototype.clone = function() {
    var that = this;
    var temp = function temporary() { return that.apply(this, arguments); };
    for( key in this ) {
        temp[key] = this[key];
    }
    return temp;
};
 ;(function($) {
 	// external reference to API 
 	var methods = {
		init : function(options) {
			var db=null;
			// private internal copy of options for this instance of the plugin
			var settings=$.extend(true,{},$.fn.quickDB.defaultOptions);
 			// init parameters
			if(options) {
				$.extend(true,settings, options);
			}
			return this.each(function() {
				var plugin = this;
				//console.log('iniit plugin on ',this)
        	
				plugin.saveCallbackStack=[]; 	
				// DOM configuration through data attributes
				$.extend(true,settings, $(plugin).data());
				// access to settings for methods in other scopes
				plugin.settings = settings;
				plugin.DBInitialised=false;
				// plugin.settings.db is wholy generated
				plugin.settings.db = {table:{}};
				//plugin.settings.db.table.fields={};
				// ensure DOM targets for list/form/searcher with default of this plugin
				if (plugin.settings.formtarget && $(plugin.settings.formtarget).length>0) plugin.formTarget=$(plugin.settings.formtarget);
				else plugin.formTarget=$(plugin);
				if (plugin.settings.listtarget && $(plugin.settings.listtarget).length>0) plugin.listTarget=$(plugin.settings.listtarget);
				else plugin.listTarget=$(plugin);
				if (plugin.settings.searchtarget && $(plugin.settings.searchtarget).length>0) plugin.searchTarget=$(plugin.settings.searchtarget);
				else plugin.searchTarget=$(plugin);
				//console.log('set targets',plugin.searchTarget,plugin.listTarget,plugin.formTarget);
				
				// bind functions in with plugin scope
				var pluginMethods=[];
				if ($.fn.quickDB && $.fn.quickDB.api) {
					//console.log('bind plaugin to api',plugin);
					$.each($.extend(true,{},$.fn.quickDB.api),function(key,value) {
						if ($.isFunction(value)) { 	
							pluginMethods[key]=value.bind(plugin);
						} else {
							pluginMethods[key]={};
							$.each(value,function(ikey,ivalue) {
								if ($.isFunction(ivalue)) { 	
									pluginMethods[key][ikey]=ivalue.bind(plugin);
								}
							});
						}
					});
				}
				// access to api for functions defined in other scopes
				plugin.api = pluginMethods;
				// single form wrapper around whole plugin
				$(plugin).wrap("<form></form>");
				// kickstart
				plugin.api.controller.init.apply(plugin);
			});
		}
	};
	
    $.fn.quickDB = function(method) {
		// PUBLIC METHODS - TODO with jquery style method calls $('dd').plugin('methodName',restOfParams) with direct access to plugins.api
		// support for nesting as per model,view,controller subkeys of api
		if( $.isFunction(methods[method])) {
    	    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } 
        else if(typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } 
        else {
            $.error("Method " +  method + " does not exist on jQuery.quickDB");
        }    
    };
	$.fn.quickDB.api={};
})(jQuery);

$.fn.quickDB.defaultOptions = {
	debug : false,
	dbShortName : 'quickdb',
	dbDisplayName : 'Quick Database',
	dbMaxSize : 100000, //  bytes
};
 