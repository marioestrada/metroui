(function(Spine, $)
{
	// !Sidebar
	window.Sidebar = Spine.Controller.create(
	{	
		events: {
			'tap li a': 'setCurrent',
			'tap .torrents a': 'torrentView',
			'tap .labels a': 'filterLabel',
			'tap .feed a': 'showFeed',
			'tap .apps a': 'showApp',
			'tap section h2.collapsable': 'collapseSection'
		},
		
		init: function()
		{
			this.torrents = $('#torrents');
			this.torrents_container = this.torrents.find('.content:first');
			this.el_footer = $('#sidebar_footer');
			this.popover_element = $('.popover', this.el_footer);
			this.adder_title = this.el_footer.find('.title');
			
			this.settings = JSON.parse(localStorage.getItem('sections'));
			
			// Footer (sidebar) events
			this.popover_element.find('> a').bind('tap', this.proxy(this.popover));
			this.popover_element.find('.go_back').bind('click', this.proxy(this.returnMenu));
			this.popover_element.find('ul a').bind('tap', this.proxy(this.showAdder));
			this.popover_element.find('form').bind('submit', this.proxy(this.addUrl));
			
			var self = this;
			Spine.bind('closeModals', this.proxy(function()
			{
				self.togglePopover(false);
			}));
			
			if(!this.settings)
			{
				localStorage.setItem('sections', JSON.stringify({
					torrents: {
						collapsed: false
					},
					labels: {
						collapsed: false
					},
					feeds: {
						collapsed: false
					},
					apps: {
						collapsed: false
					}
				}));
				this.settings = JSON.parse(localStorage.getItem('sections'));
			}else{
				var self = this;
				_.each(this.settings, function(setting, key)
				{
					self.el.find('section.' + key).addClass(setting.collapsed ? 'collapsed' : '');
				});
			}
		},
		
		returnMenu: function(e)
		{	
			$('.go_back', this.el_footer).addClass('hidden');
			$('.options', this.el_footer).removeClass('extra');
			this.adder_title.text(this.adder_title.data('title')); 
		},
		

		showAdder: function(e)
		{
			e.preventDefault();
			
			var me = $(e.currentTarget);
			
			$('.go_back', this.el_footer).removeClass('hidden');
			this.adder_title.text(me.data('title'));
			$('.options', this.el_footer).addClass('extra');
			$('.extra_options', this.el_footer).children('.option').addClass('hidden')
				.filter('.' + me.data('target')).removeClass('hidden').focus();
		},
		
		popover: function(e)
		{
			e.preventDefault();
			console.log(this);
			if(!this.popover_element.hasClass('open'))
			{
				Spine.trigger('closeModals');
			}
			this.togglePopover();
		},
		
		togglePopover: function(force_active)
		{
			this.returnMenu();
			this.popover_element.toggleClass('open', force_active);
		},
		
		addUrl: function(e)
		{
			e.preventDefault();
			
			var me = $(e.currentTarget).find('button:first');
			var el_url = $('#' + me.data('url-element'));
			var url = el_url.val();
			var self = this;
			
			if(!url || (el_url[0].validity && !el_url[0].validity.valid))
			{
				alert('You need to insert a valid URL');
				el_url.focus();
				return;
			}
			
			me.addClass('loading');
			
			client.raptor.api.post(
				{
					action: me.data('action')
				},
				{
					url: url
				}, 
				function()
				{
					self.popover_element.removeClass('open');
					self.el_footer.find('.extra').removeClass('extra');
					
					el_url.val('');				
					me.removeClass('loading');
				}
			);
		},
		
		setCurrent: function(e)
		{
			$('#body').removeClass('showmenu');

			$(e.currentTarget).closest('#sidebar').find('.current').removeClass('current');
			$(e.currentTarget).addClass('current');
		},
		
		collapseSection: function(e)
		{
			var section = $(e.currentTarget).closest('section');
			section.toggleClass('collapsed');
			this.settings[section.data('section')].collapsed = section.hasClass('collapsed');
			localStorage.setItem('sections', JSON.stringify(this.settings));
		},
		
		torrentView: function(e)
		{
			e.preventDefault();
			var show = $(e.currentTarget).data('show');
			
			Spine.trigger('filterTorrents', ".torrent:not(" + show + ")", show, true);
			Spine.trigger('activateController', 'torrents');		
		},
		
		filterLabel: function(e)
		{
			e.preventDefault();
			
			var label = $(e.currentTarget).data('label');
			
			Spine.trigger('filterTorrents', ".torrent:not([data-label='" + label + "'])", true);
			Spine.trigger('activateController', 'torrents');	
		},
		
		showFeed: function(e)
		{
			e.preventDefault();
			
			Spine.trigger('activateController', 'feeds');
			Spine.trigger('filterFeeds', $(e.currentTarget).data('feed'));
		},
		
		showApp: function(e)
		{
			e.preventDefault();
		}
	});

})(Spine, Spine.$);
