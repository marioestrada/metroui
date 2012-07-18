(function(Spine, $)
{

	// !Controls
	window.Controls = Spine.Controller.create(
	{
		events: {
			'tap .buttons a': 'buttonClicked',
			'tap .popover > a': 'popover',
			'tap #app_title': 'goHome',
			'tap #options_toggle': 'toggleSettings',
			'tap #user_logout': 'logoutUser'
		},
		
		init: function()
		{
			$('#search', this.el).bind('focus', this.proxy(this.searchFocused));
			$('#search', this.el).bind('blur', this.proxy(this.searchBlurred));
			
			this.target_torrent = $('[data-target="torrent"]');
			
			var self = this;
			Spine.bind('closeModals', this.proxy(function()
			{
				self.togglePopover(false);
			}));
			Spine.bind('updateControls', this.proxy(this.updateControls));
		},
		
		logoutUser: function(message)
		{
			message = _.isString(message) ? message : null;
			Spine.trigger('logoutUser', message);
		},
		
		toggleSettings: function(e)
		{
			e.preventDefault();
		
			$('#body').removeClass('showmenu');
				
			Spine.trigger('toggleSettings');
		},
		
		goHome: function(e)
		{
			e.preventDefault();
			
			$('#sidebar a:first').trigger('tap');
		},
		
		updateControls: function(item, target)
		{
			if(!item)
			{
				this.target_torrent.addClass('disabled');
				return;
			}
		
			var controls = this.el.find('.controls_content:first');
			
			controls.find('.buttons a:not([data-target="' + target + '"])').filter(':not([data-target="all"])').addClass('hidden');
			controls.find('.buttons a[data-target="' + target + '"]').removeClass('hidden disabled');
			
			if(item._torrent_class.indexOf('waiting') >= 0)
			{
				controls.find('a[data-action="pause"], a[data-action="start"]').addClass('hidden');
			}else if(item._torrent_class.indexOf('paused') >= 0 || item._torrent_class.indexOf('stopped') >= 0){
				controls.find('a[data-action="pause"], a[data-action="forcestart"]').addClass('hidden');
			}else if(item._torrent_class.indexOf('done') >= 0/*  || item._torrent_class.indexOf('paused') >= 0 */){
				controls.find('a[data-action="pause"], a[data-action="forcestart"]').addClass('hidden');
			}else{
				controls.find('a[data-action="forcestart"], a[data-action="start"]').addClass('hidden');
			}
			
			if(item.queue_position <= 1)
				controls.find('a[data-action="queueup"]').addClass('disabled');
		},
		
		popover: function(e)
		{
			e.preventDefault();
			var container = $(e.currentTarget).closest('.popover');
			if(!container.hasClass('open'))
			{
				Spine.trigger('closeModals');
			}
			
			this.togglePopover();	
		},
		
		togglePopover: function(force_active)
		{
			this.el.find('.popover').toggleClass('open', force_active);
		},
				
		buttonClicked: function(e)
		{
			e.preventDefault();
			var me = $(e.currentTarget);
			var action = me.data('action');
			
			if(me.data('target') == 'torrent' && action)
			{
				if(action != 'remove' || confirm("Are you sure you want to remove this torrent?"))
					Spine.trigger('refreshAll', action, App.getSelected());
			}else if(me.data('target') == 'all' && action){
				switch(action)
				{
					case 'showmenu':
						$('#body').toggleClass('showmenu');
						break;
				}
			}
		},		
		
		searchFocused: function(e)
		{
			$(this.el).addClass('search_focused');
		},
		
		searchBlurred: function(e)
		{
			$(this.el).removeClass('search_focused');
		}
	});
	
})(Spine, $);