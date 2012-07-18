(function(Spine, $)
{
	
	// !TorrentItem
	window.TorrentItem = Spine.Controller.create(
	{
		status_classes: 'paused waiting checking downloading seeding done stopped error',
		
		init: function()
		{
			this.el = $('<div class="torrent" id="" data-label="" data-hash="" />');
			this.item.bind("update", this.proxy(this.render));
			this.item.bind("destroy", this.proxy(this.remove));
		},
		
		render: function(item)
		{
			if(item)
				this.item = item;
			
			var slided = this.el.hasClass('slided');
			
			if(!slided)
			{			
				var selected = this.el.hasClass('selected');
				var hidden = this.el.hasClass('hidden');
				
				this.el.html(App.torrents.torrent_template(this.item))
					.removeClass(this.status_classes).addClass(this.item._torrent_class)
					.attr('id', 'torrent_' + this.item.id)
					.attr('data-percent', this.item.percent)
					.attr('data-hash', this.item.id)
					.attr('data-label', this.item.label);
				
				if(selected)
				{
					Spine.trigger('updateControls', this.item, 'torrent');
					Spine.trigger('updatePanel', this.item);
				}
				
				this.el.toggleClass('selected', selected)
					.toggleClass('slided', slided)
					.toggleClass('hidden', hidden);
			}
			
			return this;
		},
		
		remove: function()
		{
			this.el.remove();
		}
	});
	
	// !Torrents
	window.Torrents = Spine.Controller.create(
	{
		events: {
			'swipeleft .torrent': 'swiped',
			'swiperight .torrent': 'swiped',
/* 			'taphold .torrent': 'swiped', */
			'tap .torrent': 'selected',
			'tap .sub_labels a': 'setLabel',
			'tap .behind .labels': 'showLabels',
			'tap .behind .send_action': 'sendAction',
			'tap .behind a': 'behindClick',
			'tap': 'deselectAll'
		},
		
		default_interval: 3000,
		interval: 3000,
		
		init: function()
		{
			this.first_load = false;
			this.filter_more = false;
			
			this.content = this.el.find('.content:first');
			
			this.target_torrent = $('[data-target="torrent"]');
			this.total_download = $('#total_download');
			this.total_upload = $('#total_upload');
			this.labels_container = $('#sidebar').find('.labels > ul:first');
			this.torrents_filter_container = $('#sidebar').find('.torrents > ul:first');
			
			Spine.bind('filterTorrents', this.proxy(this.filterList));
			Spine.bind('refreshAll', this.proxy(this.refreshAll));
			Spine.bind('setIntervals', this.proxy(this.setIntervals));
			
			Torrent.bind('refresh', this.proxy(this.addAll));
			Torrent.bind('create', this.proxy(this.addOne));
			
			this.torrent_template = Handlebars.compile($('#tmpl_torrent').html());
			
			this.labels_template = Handlebars.compile($('#tmpl_label').html());
			this.labels_menu_template = Handlebars.compile($('#tmpl_labels_menu').html());
		},
		
		setIntervals: function(interval)
		{
			this.interval = interval * 1;
			this.default_interval = this.interval;
		},
		
		activate: function()
		{
			this.active = true;
			this.el.removeClass('hidden');
		},
		
		deactivate: function()
		{
			this.active = false;
			this.deselectAll(true);
			this.el.addClass('hidden');
			Spine.trigger('deactivatePanels');
		},
		
		afterUpdate: function()
		{
			var self = this;
			this.updateInterval = setTimeout(function(){ self.refreshAll() }, this.interval);
			
			this.refreshTotals();
			this.refreshSidebarCount();
			
			if(Torrent.count() <= 0)
			{
				this.el.html('<div class="list_message"><p>Torrent list empty.</p></div>');
			}
		},
		
		loadAll: function()
		{
			this.first_load = true;
			var self = this;
			this.el.addClass('loading');
			
			client.raptor.api.post(
				{
					list: 1
				},
				{},
				function(data)
				{
					$('#all_content').addClass('content_loaded');

					self.content.html('');
					self.torrentc = data.torrentc;
									
					_.each(data.torrents, function(torrent)
					{
						var t = Torrent.smartInit(torrent);
						t.save();
					});
					
					self.processLabels(data.label, Torrent.count());
					
					Spine.trigger('processFeeds', data.rssfeeds);
					
					self.afterUpdate();

					self.el.removeClass('loading');
				},
				function()
				{
					self.interval = self.interval * 1.5;
					self.updateInterval = setTimeout(function(){ self.refreshAll() }, self.interval);
				}
			);
		},
		
		refreshAll: function(action, hash)
		{
			if(!this.torrentc)
				return false;
			
			if(action == 'remove')
			{
				$('#torrent_' + hash).hide();
				Spine.trigger('updateControls');
			}
			
			var self = this;
			
			clearInterval(this.updateInterval);
			
			var url_params = {};
			client.raptor.api.post(
				{
					list: 1,
					cid: this.torrentc,
					action: action,
					hash: hash
				},
				{},
				function(data)
				{
					self.interval = self.default_interval || 3000;
					self.torrentc = data.torrentc;
					
					self.processLabels(data.label, Torrent.count());
					
					if(data.torrentp && data.torrentp.length > 0)
					{
						_.each(data.torrentp, function(torrent)
						{
							var attr = Torrent.processAttributes(torrent);
							
							var t;
							if(Torrent.exists(attr.id))
							{
								t = Torrent.find(attr.id);
								t.updateAttributes(attr);
							}else{
								t = Torrent.init(attr);
								t.save();
							}
						});
					}
					
					if(data.torrentm && data.torrentm.length > 0)
					{
						_.each(data.torrentm, function(hash)
						{
							Torrent.destroy(hash);
						});
					}
					
					Spine.trigger('processFeeds', data.rssfeedp, data.rssfeedm);
					
					self.filterList();
					
					self.afterUpdate();
				},
				function()
				{
					self.interval = self.interval * 1.5;
					self.updateInterval = setTimeout(function(){ self.refreshAll() }, self.interval);
				}
			);
		},
		
		filterList: function(selector, more, clicked)
		{
			selector = selector || this.filter_selector;
			more = more === undefined ? this.filter_more : more;
			
			this.content.children('.hidden').removeClass('hidden');
			if(!!more)
				this.content.children(selector).removeClass('slided').addClass('hidden');
			
			if(clicked && window.scrollability)
				window.scrollability.scrollTo(this.content[0], 0, 0, 0);
			
			this.filter_selector = selector;
			this.filter_more = more;
		},
		
		refreshTotals: function()
		{
			var total_up = 0, total_down = 0;
			
			Torrent.each(function(t)
			{
				total_up += t.up_speed || 0;
				total_down += t.down_speed || 0;
			});
			
			this.total_download.html(App.parseBytes(total_down));
			this.total_upload.html(App.parseBytes(total_up));
		},
		
		refreshSidebarCount: function()
		{
			var self = this;
			this.torrents_filter_container.find('a').each(function()
			{
				var show = $(this).data('show');
				var selector = show ? show : null;
				var count = self.content.children(selector).length;
				var count_badge = $(this).find('.count');
				if(count)
					count_badge.text(count).removeClass('hidden');
				else
					count_badge.addClass('hidden');
			});
		},
		
		processLabels: function(labels, torrent_count)
		{
			var self = this;
			if(_.isEqual(labels, this.labels))
				return;
			
			var html = '';
			var current = this.labels_container.find('.current').data('label');
			
			_.each(labels, function(label)
			{
				html += self.labels_template({ name: label[0], count: label[1], show_count: true, current: current == label[0] });
				torrent_count -= parseInt(label[1]);
			});
			
			html = self.labels_template({ no_label: true, count: torrent_count, show_count: true }) + html;
			
			this.labels = labels;
			this.labels_container.html(html);
		},
		
		addAll: function()
		{
			Torrent.each(this.addOne);
		},
		
		addOne: function(item)
		{
			var torrent = TorrentItem.init({ item: item/* , template: this.torrent_template */ });
			var r = torrent.render().el;
			
			this.content.append(r);
		},
		
		showLabels: function(e)
		{
			e.preventDefault();
			var me = $(e.currentTarget);
			var labels_menu = me.siblings('.sub_labels');
			var labels = [];
			var current_label = labels_menu.data('current');
			
			if(!labels_menu.hasClass('hidden'))
			{
				labels_menu.addClass('hidden');
				return;
			}
			
			labels_menu.toggleClass('on_bottom', me.offset().top < 225);
			
			_.each(this.labels, function(l)
			{
				var is_current = l[0] == current_label;
				labels.push({ name: l[0], current: is_current, label: is_current ? '' : l[0] });
			});
			
			labels_menu.html(this.labels_menu_template({ labels: labels }))
				.removeClass('hidden');
		},
		
		setLabel: function(e)
		{
			e.preventDefault();
			var me = $(e.currentTarget);
			var torrent = me.closest('.torrent');
			var labels_menu = torrent.find('.sub_labels');
			var new_label = me.data('label');
			
			switch(new_label)
			{
				case '_new':
					new_label = prompt('Name the new label:');
					break;
			}
			
			labels_menu.addClass('hidden');
			if(new_label !== null)
				torrent.attr('data-label', new_label);
			torrent.removeClass('slided');
			
			if(new_label !== null)
			{
				client.raptor.api.post(
					{
						action: 'setprops',
						s: 'label',
						hash: torrent.data('hash'),
						v: new_label
					}
				);
			}
		},
		
		sendAction: function(e)
		{
			e.preventDefault();
			var me = $(e.currentTarget);
			var torrent = me.closest('.torrent');
			
			Spine.trigger('refreshAll', me.data('action'), torrent.data('hash'));
			
			torrent.removeClass('slided');
		},
		
		behindClick: function(e)
		{
			e.stopImmediatePropagation();
		},
		
		swiped: function(e)
		{
			$('.slided', this.el).not(e.currentTarget).removeClass('slided');
			$(e.currentTarget).toggleClass('slided')
				.find('.sub_labels')
				.addClass('hidden');
		},		
		
		deselectAll: function(e)
		{
			$('#search').blur();
			// Make sure an empty area was tapped
			if(e === true || this.el.get(0).id == e.target.id)
			{
				$(this.el).find('.selected').removeClass('selected');
				this.target_torrent.addClass('disabled');
				Spine.trigger('closePanels');
				this.current = '';
			}
		},
		
		selected: function(e)
		{
			e.preventDefault();
			
			var me = $(e.currentTarget);
			
			if(!me.hasClass('slided'))
			{
				$(this.el).find('.selected, .slided').removeClass('selected slided');
				
				me.addClass('selected');
				
				this.target_torrent.removeClass('disabled');
				
				this.current = me.data('hash');
				var torrent = Torrent.find(this.current);
				
				Spine.trigger('updatePanel', torrent, true);
				Spine.trigger('updateControls', torrent, 'torrent');
			}
		}
	});

})(Spine, Spine.$);
