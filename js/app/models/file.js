(function(Spine, $)
{

	// !File Model
	window.File = Spine.Model.setup("File",
		[
            'name',
            'size',
            'downloaded',
            'priority',
            'first_piece',
            'num_pieces',
            'streamable',
            'encoded_rate',
            'duration',
            'width',
            'height',
            'stream_eta',
            'streamability',
            '_checkbox_value',
            '_priority_class',
            '_percent'
		]
	);
	
	window.File.extend({
		priorities: ['none', 'low', 'normal', 'high'],
		
		smartInit: function(data, id)
		{
			var attr = {}, i = 0;
			
			_.each(this.attributes, function(name)
			{
				attr[name] = data[i++];
			});
			
			attr.id = '' + id;
			attr._priority_class = this.priorities[attr.priority]; 
			attr._checkbox_value = attr.priority > 0 ? 1 : 0;
			attr._percent = (attr.downloaded / attr.size * 100).toFixed(0);
			
			return this.init(attr);
		}
	});

})(Spine, Spine.$);