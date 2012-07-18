(function(Spine, $)
{

	// !Peer Model
	window.Peer = Spine.Model.setup("Peer",
		[
			'country',
            'ip',
            'hostname',
            'protocol',
            'port',
            'client',
            'flags',
            'complete',
            'down_speed', 
            'up_speed',
            'pending',
            'requests',
            'waited',
            'uploaded',
            'downloaded', 
            'hasherr',
            'peer_download_rate',
            'maxup',
            'maxdown',
            'queued',
            'inactive',
            'relevance'
		]
	);
	
	window.Peer.extend({
		smartInit: function(data, id)
		{
			var attr = {}, i = 0;
			
			attr.id = id;
			
			_.each(this.attributes, function(name)
			{
				attr[name] = data[i++];
			});
			
			attr.complete = attr.complete / 10;
			
			return this.init(attr);
		}
	});

})(Spine, Spine.$);