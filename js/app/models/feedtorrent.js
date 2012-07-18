(function(Spine, $)
{

	// !Feed Model
	window.FeedTorrent = Spine.Model.setup("Feed",
		[
            'name',
            'name_full',
            'url',
            'quality',
            'codec',
            'timestamp',
            'season',
            'episode',
            'episode_to',
            'feed_id',
            'repack',
            'in_history', 
            'torrent'
		]
	);
	
	window.FeedTorrent.extend({
		smartInit: function(data)
		{
			var attr = this.processAttributes(data);
			
			return this.init(attr);
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
			return attr;
		}
	});

})(Spine, Spine.$);