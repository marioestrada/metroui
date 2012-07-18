(function(Spine, $)
{
	
	// !Feed
	window.Feeds = Spine.Controller.create(
	{
		events: {
			'tap .download': 'download'
		},
		
		interval: 2000,
		
		init: function()
		{
			this.content = this.el.find('.content:first');
			
			this.template = Handlebars.compile($('#tmpl_feeds').html());
			this.sb_feeds_template = Handlebars.compile($('#tmpl_label_feed').html());
			
			this.sb_feeds_container = $('#sidebar').find('.feeds > ul:first');
			
			Spine.bind('processFeeds', this.proxy(this.processFeeds));
			
			Spine.bind('filterFeeds', this.proxy(this.filterFeeds));
		},
		
		download: function(e)
		{
			e.preventDefault();
			
			var self = this;
			var me = $(e.currentTarget);
			var feed_id = me.closest('.feedtorrent').data('feed');

			me.addClass('loading');
			me.html('');

			client.raptor.api.post({
				action: me.data('action'),
				feedid: feed_id
			},
			{ s: me.data('url') }, 
			function()
			{	
				me.addClass('added');
				me.text('Sent');
				me.closest('.controls').addClass('in_history');					
				me.removeClass('loading');
			});
			
		},
		
		filterFeeds: function(feed_id)
		{
			var els;
			if(feed_id < 0)
			{
				els = this.el.find('.feedtorrent');
				els.removeClass('hidden');
			}else{
				feed_id = feed_id == '_last' && this.last_feed_id ? this.last_feed_id : feed_id;
				
				els = this.el.find('.feedtorrent[data-feed="' + feed_id + '"]');
				this.el.find('.feedtorrent:not([data-feed="' + feed_id + '"])').addClass('hidden');
				els.removeClass('hidden');
			}
			
			this.el.find('.list_message').toggleClass('hidden', els.length > 0);
			
			if(window.scrollability)
				window.scrollability.scrollTo(this.content[0], 0, 0, 0);
			
			this.last_feed_id = feed_id;
		},
		
		processFeeds: function(feedsp, feedsm)
		{
			this.addFeeds(feedsp || []);
			this.deleteFeeds(feedsm || []);
			
			if((feedsp && feedsp.length) || (feedsm && feedsm.length))
				this.render();
		},
		
		addFeeds: function(feeds)
		{
			var f;
			_.each(feeds, function(feed)
			{
				if(Feed.exists(feed[0]))
				{
					var ft = FeedTorrent.findAllByAttribute('feed_id', feed[0]);
					
					_.each(ft, function(f)
					{
						FeedTorrent.destroy(f.id);
					});
					
					Feed.smartUpdate(feed[0], feed);
				}else{
					f = Feed.smartInit(feed);
					f.save();
				}
			});
		},
		
		deleteFeeds: function(feeds)
		{
			_.each(feeds, function(id)
			{
				Feed.destroy(id);
			});			
		},
		
		render: function()
		{
			var no_feed = this.sb_feeds_template({ items: { no_feed: true, id: -1 }});
			
			var current_el = $('.current', this.sb_feeds_container);
			
			Feed.each(function(feed)
			{
				feed.updateAttribute('_current', current_el.length && current_el.data('feed') == feed.id);
			});
			
			this.sb_feeds_container.html(no_feed + this.sb_feeds_template({ items: Feed.all() }));
			
			this.content.html(this.template({ items: FeedTorrent.all() }));
			
			this.filterFeeds('_last');
		}
	});

})(Spine, $);
