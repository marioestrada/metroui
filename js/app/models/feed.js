(function(Spine, $)
{

	// !Feed Model
	window.Feed = Spine.Model.setup("Feed",
		[
            'id',
            'enabled',
            'usefeedtitle',
            'user_selected',
            'programmed',
            'download_state',
            'url',
            'next_update',
            'items',
            '_count',
            '_show_count',
            '_name',
            '_url',
            '_current'
		]
	);
	
	window.Feed.extend({
		smartInit: function(data)
		{	
			var attr = this.processAttributes(data);
			
			return this.init(attr);
		},
		
		smartUpdate: function(id, data)
		{
			var attr = this.processAttributes(data);
			
			return this.update(id, attr);
		},
		
		processAttributes: function(data)
		{
			var attr = {}, i = 0;
			
			_.each(this.attributes, function(name)
			{
				attr[name] = data[i++] || undefined;
			});
			
			attr = this.processData(attr);
			
			return attr;
		},
		
		processData: function(attr)
		{
			attr._count = attr.items.length;
			attr._show_count = !!attr._count;
			
			var split = attr.url.split('|');
			attr._url = split[1];
			attr._name = split[0];
			
			var fi;
			_.each(attr.items, function(item)
			{
				fi = FeedTorrent.smartInit(item);
				fi.save();
			});
			
			return attr;
		}
	});

})(Spine, Spine.$);