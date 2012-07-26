(function(Spine, $)
{
	// Use native rubber band scrolling
	//if($.support.touch && $.support.touchOverflow)
	//{
	//	$('.scrollable').removeClass('scrollable').parent().addClass('scrollable native');
	// Load scrollability to emulate native scrolling
	//}else
	
	$('#body').removeClass('waiting');
	$('.app_version').text(app_version);
	setTimeout(function()
	{
		$('#waiting_logo, #waiting_loader').remove();
	}, 300);
	
	if($.support.touch){
		$LAB.script('js/vendor/scrollability.min.js');
	}else{
		// Use regular scrollbars
		$('.scrollable').removeClass('scrollable').parent().addClass('scrollable desktop');
	}

	$('.checkbox').live('tap', function()
	{
		$(this).attr('data-value', $(this).attr('data-value') == 1 ? 0 : 1);
		$(this).trigger('change');
	});
	
	// !Branding
	if(window.location.href.indexOf('bittorrent.com') > 0 || window.location.href.indexOf('bittorrent') > 0)
	{
		$('#bt_branding').attr('rel', 'stylesheet');
	}

	// !uTorrentApp
	window.uTorrentApp = Spine.ControllerWithManager.create({
	
		el: 'body',
		
		events: {
			'tap .popover, #options, #options_toggle': 'stopPropagation'
		},
		
		elements: {
			'#sidebar': 'sidebar_element',
			'#torrents': 'torrents_element',
			'#feeds': 'feeds_element',
			'#panels': 'panel_element',
			'#controls_main': 'controls_element',
			'#options': 'settings_element'
		},
		
		stopPropagation: function(e)
		{
			e.stopImmediatePropagation();
		},
		
		init: function()
		{
			var self = this;
			this.token_tries = 3;
			
			this.url = '/gui/';
			
            window.clients = new ClientManager();
			clients.sync();
			clients.set_current_client();
			this.client = clients.get_current_client();
			
			if(this.client)
				$('.current_user').text(this.client.data.bt_user);
			else
				this.logoutUser('Please log in');

			this.torrents = Torrents.init({ el: this.torrents_element, active: true });
			this.feeds = Feeds.init({ el: this.feeds_element, active: false });
			//this.apps = Apps.init({ el: this.apps_element, active: false });
			
			this.settings = Settings.init({ el: self.settings_element });
			
			this.sidebar = Sidebar.init({ el: this.sidebar_element });
			this.panels = Panels.init({ el: this.panel_element });
			this.controls = Controls.init({ el: this.controls_element });
			
			Spine.bind('activateController', this.proxy(this.activateController));
			Spine.bind('logoutUser', this.proxy(this.logoutUser));
			
			this.manage('torrents', 'feeds');
			this.activateController('torrents');
			
			Handlebars.registerHelper('parseBytes', function(bytes)
			{
				return App.parseBytes(bytes);
			});
			Handlebars.registerHelper('secondsToDate', function(seconds)
			{
				return App.secondsToDate(seconds);
			});
			Handlebars.registerHelper('relativeDate', function(seconds)
			{
				var d = new Date();
				seconds = d.getTime() / 1000 - seconds;
				return App.secondsToString(seconds);
			});
			Handlebars.registerHelper('secondsToString', function(seconds)
			{
				return App.secondsToString(seconds);
			});
			
			this.loadToken();
			
			$(window).bind('orientationchange', function()
			{
				Spine.trigger('closeModals');
			});
			
			this.el.bind('tap', function()
			{
				Spine.trigger('closeModals');
			});
			
			this.el.on('tap', '.open_sessions', this.openSessions);
		},
		
		logoutUser: function(message)
		{
			var url;
			message = message || "Logged out successfully from remote.";
			
			if(message)
				url = '/talon/logout?message=' + encodeURIComponent(message);
			else
				url = '/talon/logout';
			
			if(window.top)
				window.top.location = url;
			else
				window.location = url;
		},
		
		getSelected: function()
		{
			return this.torrents.current;
		},
		
		openSessions: function()
		{
			var urlparams = decode_location_params();
			
			if (urlparams && urlparams.sessions) {
	            var session_string = '?sessions=' + encodeURIComponent(urlparams.sessions);
	        } else {
	            var session_string = '';
	        }
	        
	        window.open('/talon/sessions' + session_string);
		},
		
		loadToken: function()
		{
			var self = this;

			this.token_tries--;
			
			client.raptor.api.get_token(function()
			{
				$(document).data('token', client.raptor.api.token);
				
				!self.torrents.first_load && self.torrents.loadAll();
				!self.settings.first_load && self.settings.loadAll();
			}, function(err)
			{
				console.log(err);
				if(self.token_tries == 0)
					self.logoutUser('An error occurred, please log in again.');
				else
					self.loadToken();
			});
			
		},
		
		parseBytes: function(size, precision)
		{
			var i;
			var sizes = ["b", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
			if(size <= 0 || !size)
				return('0 b');
			else{
				i = Math.floor(Math.log(size) / Math.log(1024));
				size = size / Math.pow(1024, i);
				rounded = (Math.round(size * 100)) / 100;
				return rounded + " " + sizes[i];
			}
		},
		
		secondsToDate: function(seconds)
		{
			if(!seconds)
				return 'n/a';
			
			var d = new Date(seconds * 1000);
			
			return d.getDate() + '/' + d.getMonth() + '/' + d.getFullYear();
		},
		
		secondsToString: function(data, empty_infinity)
		{
			if (data == -1 || !data)
				return "\u221E";
			
			var secs = Number(data);
			
			if(secs > 63072000)
				return empty_infinity ? '' : "\u221E";
			
			var div, y, w, d, h, m, s, output = "";
			
			y = Math.floor(secs / 31536000);
			div = secs % 31536000;
			w = Math.floor(div / 604800);
			div = div % 604800;
			d = Math.floor(div / 86400);
			div = div % 86400;
			h = Math.floor(div / 3600);
			div = div % 3600;
			m = Math.floor(div / 60);
			s = div % 60;
			
			if (y > 0)
			{
			    output = "%dy %dw".replace(/%d/, y).replace(/%d/, w);
			}else if(w > 0){
			    output = "%dw %dd".replace(/%d/, w).replace(/%d/, d);
			}else if(d > 0){
			    output = "%dd %dh".replace(/%d/, d).replace(/%d/, h);
			}else if(h > 0){
			    output = "%dh %dm".replace(/%d/, h).replace(/%d/, m);
			}else if(m > 0){
			    output = "%dm %ds".replace(/%d/, m).replace(/%d/, s);
			}else{
			    output = "%ds".replace(/%d/, s);
			}
			return output;
		}
	});
})(Spine, Spine.$);

// Start everything on load
$(function()
{
	window.App = uTorrentApp.init();
});
