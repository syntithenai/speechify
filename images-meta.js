$.fn.quickDB.defaultOptions.tables={		
	tags:{
		fields: {
			name: {type:'text',label:'Tag',validation:{required:true}},
		},
		views: {
			label: { joins:'',fields:"tags.name as label",orderBy:'label' }, 
			default: { joins:'',fields:"tags.name as label",orderBy:'label',searchers: {
				name: {label:'', type: 'text','fields':'tags.name'},
			} }
		}
	},
	images:{
		fields: {
			images: {type:'file', label:'Image',validation:{required:true}},
			description: {type:'text', label:'Description'},
		},
		joins: {
			tags:{
				label:'Tags',
				table:'tags',
				condition:'tags.rowid=mm_imagestags.tags',
				mmTable:'mm_imagestags',
				mmTableCondition:'images.rowid=mm_imagestags.images',
				render:'value'
			}
		},
		views: {
			label:{ fields:"description as label" },
			form: { 
				joins: 'tags', 
				fields:"images.description as description,images.images as images,group_concat(tags.rowid) as tags_ids,group_concat(tags.name) as tags",
				groupBy:'images.rowid',
			},
			list: { 
				joins: 'tags', 
				fields:"images.description as description,images.images as images,group_concat(tags.rowid) as tags_ids,group_concat(tags.name) as tags",
				groupBy:'images.rowid',
				searchers: {
					name: {label:'Search', type: 'text','fields':'description'},
					tag: {label:'Tag', type: 'livesearch','fields':'tags'},
				}
			}
		}
	}
}

