(function(Spine, $)
{
	
	window.Peers = Spine.Controller.create({
		el: $('#subpanel_peers'),
		
		interval: 6000,
		
		init: function()
		{
			this.template = Handlebars.compile($('#tmpl_supbanel_peers').html());
			this.container = this.el.find('.content:first');
		},
		
		activate: function()
		{
			this.active = true;
			this.loadAll();
		},
		
		deactivate: function()
		{
			this.active = false;
			Peer.deleteAll();
			clearTimeout(this.updateInterval);
		},
		
		loadAll: function()
		{
			if(!this.active)
				return;
			
			Peer.deleteAll();
			this.container.html('');
			this.el.addClass('loading');
			
			var self = this;
			
			clearTimeout(this.updateInterval);

			client.raptor.api.post(
				{ action: 'getpeers' },
				{ hash: App.getSelected() },
				function(data)
				{
					var f;
					
					_.each(data.peers[1], function(peer)
					{
						f = Peer.smartInit(peer);
						f.save();
					});
					self.render();
					self.updateInterval = setTimeout(function(){ self.loadAll() }, self.interval);
					self.el.removeClass('loading');
				}
			);
            
		},
		
		render: function()
		{
			this.container.html(this.template({ items: Peer.all() }));
		}
	});

})(Spine, Spine.$);
