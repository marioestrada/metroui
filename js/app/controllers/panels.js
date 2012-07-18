(function(Spine, $)
{
	PanelDynamic = Spine.Controller.create({
		init: function()
		{
			this.active = false;
			this.template = Handlebars.compile($(this.template).html());
			this.container = this.el.find('.content:first');
		},
		
		activate: function()
		{
			this.active = true;
			this.el.removeClass('hidden');
			
			this.loadAll(true);
		},
		
		deactivate: function()
		{
			this.active = false;
			this.el.addClass('hidden');
			
			clearTimeout(this.updateInterval);
			this.model.deleteAll();
		},
		
		loadAll: function(initial)
		{
			if(!this.active)
				return;
			
			this.model.deleteAll();
			if(initial)
			{
				this.el.addClass('loading');
			}
			
			var self = this;
			
			clearTimeout(this.updateInterval);
	        client.raptor.api.post({
					action: this.action,
					hash: window.App.getSelected()
		    	}, {},
			    function(data)
				{
					var f;
					
					_.each(data[self.result_property][1], function(result, i)
					{
						f = self.model.smartInit(result, i);
						f.save();
					});
					
					self.render();
					self.updateInterval = setTimeout(function(){ self.loadAll(); }, self.interval);
	
					self.el.removeClass('loading');
				}
			);
		},
		
		render: function()
		{
			this.container.html(this.template({ items: this.model.all() }));
		}
	});
	
	window.Files = PanelDynamic.create();
	
	window.Peers = PanelDynamic.create();
	
	window.Speed = Spine.Controller.create({
		el: $('#subpanel_speed'),
		
		canvas: $('#speed_canvas'),
		
		init: function()
		{
			var d = new Date();
			this.plot_options = {
	            colors: ["#009900", "#1C8DFF"],
				series: { shadowSize: 0 },
				yaxis: {
					min: 0,
	                minTickSize: 5 * 1024,
	                tickFormatter: function(n, axis)
	                {
	                    return (App.parseBytes(n) + '/s');
	                }
				},
				xaxis: {
					mode: "time",
					timeformat: "%H:%M:%S"
				}
			};
		},
		
		activate: function()
		{
			this.active = true;
			this.el.removeClass('hidden');
			
			if($.plot)
			{
				this.loadPlot();
			}else{
				var self = this;
				this.el.addClass('loading');
				
				$LAB.script('js/vendor/jquery.flot.min.js').wait(function()
				{
					$(self.el).removeClass('loading');
					self.loadPlot();
				});
			}
			
		},
		
		loadPlot: function()
		{
			var d = new Date();
			var tz = d.getTime() - d.getTimezoneOffset() * 60 * 1000;
			
			this.plot = $.plot(this.canvas, [{label: 'down speed', data: [[tz, 0]] }, { label: 'up speed', data: [[tz, 0]]}], this.plot_options);
			this.updateCanvas();
		},
		
		deactivate: function()
		{
			this.active = false;
			this.el.addClass('hidden');
			
			if(this.plot)
				this.plot.shutdown();
			this.plot = null;
		},
		
		updateCanvas: function(data)
		{
			if(!this.active)
				return;
			
			data = data ? data : [];
			var ul = [], dl = [];
			
			if(screen.width <= 480)
				data = _.last(data, 8);
			
			_.each(data, function(item)
			{
				ul.push([item.time, item.up]);
				dl.push([item.time, item.down]);
			});
			
			this.plot.resize();
			this.plot.setData([{label: 'down speed', data: dl }, { label: 'up speed', data: ul}]);
			this.plot.setupGrid();
			this.plot.draw();
		}
	});
	
	window.Info = Spine.Controller.create({ el: $('#subpanel_info') });
	
	// !Panels
	window.Panels = Spine.ControllerWithManager.create(
	{
		events: {
			'tap .tabs a': 'toggleOpen',
			'click #close_panels': 'close',
			'tap .panel header li a': 'changePaneContent',
			'tap .priority li': 'setPriority',
			'change .checkbox': 'setDownload'
		},
		
		init: function()
		{
			Spine.bind('updatePanel', this.proxy(this.updatePanel));
			
			this.files = Files.init({
				el: $('#subpanel_files'),
				template: '#tmpl_subpanel_files',
				action: 'getfiles',
				result_property: 'files',
				model: window.File,
				interval: 6000,
				active: false
			});
			
			this.peers = Peers.init({
				el: $('#subpanel_peers'),
				template: '#tmpl_subpanel_peers',
				action: 'getpeers',
				result_property: 'peers',
				model: window.Peer,
				interval: 6000,
				active: false
			});
			
			Spine.bind('closePanels', this.proxy(this.close));
			
			this.speed = Speed.init({ active: false });
			this.info = Info.init({ active: false });
			
			Spine.bind('setIntervals', this.proxy(this.setIntervals));
			this.info_template = Handlebars.compile($('#tmpl_subpanel_info').html());
			
			this.manage('files', 'info', 'peers', 'speed');
		},
		
		setIntervals: function(interval)
		{
			this.peers.interval = interval * 2;
			this.files.interval = interval * 2;
		},
		
		setDownload: function(e)
		{
			var me = $(e.target);
			var el = me.closest('li[data-id]');
			var priority = el.find('.priority:first');
			var new_priority = me.attr('data-value') == 1 ? File.priorities.indexOf('normal') : 0;
			
			priority.removeClass('low normal high');
			if(new_priority)
				priority.addClass('normal');
			
			this.setFilePriority(el.data('id'), new_priority);
		},
		
		setPriority: function(e)
		{
			var me = $(e.target);
			var el = me.closest('li[data-id]');
			var priority = el.find('.priority:first');
			var checkbox = el.find('.checkbox:first');
			var new_priority = me.attr('class');
			
			checkbox.attr('data-value', 1);
			priority.removeClass('low normal high').addClass(new_priority);
			
			this.setFilePriority(priority.closest('li').data('id'), File.priorities.indexOf(new_priority));
		},
		
		setFilePriority: function(index, priority)
		{
            client.raptor.api.post( {
				action: 'setprio',
				f: index,
				p: priority,
				hash: App.getSelected()
		    }, { hash: App.getSelected() });
		},
		
		changePaneContent: function(e)
		{
			e.preventDefault();
			var me = $(e.currentTarget);
			var target = me.attr('href');
			
			me.closest('ul').find('.current').removeClass('current');
			me.addClass('current');
						
			this.activateController(target.replace('#subpanel_', ''));
		},
		
		updatePanel: function(item, on_selection)
		{
			$('#subpanel_info').find('.content').html(this.info_template(item));
			
			this.speed.updateCanvas(item._speed_history);
			
			if(on_selection)
			{
				this.files.loadAll(true);
				this.peers.loadAll(true);
			}
		},
		
		close: function()
		{
			$('#torrents').removeClass('panel_open');
			$(this.el).removeClass('open');	
			$('.tabs a', this.el).removeClass('current');
			
			this.deactivateAll();
		},
		
		toggleOpen: function(e)
		{
			e.preventDefault();
			var me = $(e.currentTarget);
						
			if(me.hasClass('current'))
			{
				this.close();
			}else{
				$(this.el).find('.panel').addClass('hidden').filter('.' + me.data('content')).removeClass('hidden');
			
				$('.tabs a', this.el).removeClass('current');
				
				if(!$(this.el).hasClass('open') && $(this.el).find('.current').length)
				{
					$('#torrents').addClass('panel_open');
					$(this.el).addClass('open');
				}
				
				$('.panel header .current', this.el).trigger('tap');
				
				$(this.el).hasClass('open') && me.addClass('current');
			}
		}
	});


})(Spine, Spine.$);
