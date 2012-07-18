(function(Spine, $)
{

	// !Torrent Model
	window.Torrent = Spine.Model.setup("Torrent",
		[
			"id",
			"status",
			"name",
			"size",
			"percent",
			"downloaded",
			"uploaded",
			"ratio",
			"up_speed",
			"down_speed",
			"eta",
			"label",
			'peers_connected',
			'peers_swarm',
			'seeds_connected',
			'seeds_swarm',
			'availability',
			'queue_position',
			'remaining',
			'download_url',
			'rss_feed_url',
			'message',
			'stream_id',
			'added_on',
			'completed_on',
			'app_update_url', 
			'directory',
			'webseed_enabled',
			'_status_byline',
			'_compact_byline',
			'_torrent_class',
			'_speed_history'
		]
	);
	
	window.Torrent.extend({
		bits: ['started', 'checking', 'start after check', 'checked', 'error', 'paused', 'queued', 'loaded'],
		
		max_speed_history: 25,
		
		speed_history: [],
		
		smartInit: function(data)
		{	
			var attr = this.processAttributes(data);
			
			if(screen.width <= 480)
				this.max_speed_history = 5;
			
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
/* 			attr.name = 'Torrent ' + attr.id + '.file'; */
			attr.ratio = attr.ratio ? (attr.ratio / 1000).toFixed(2) : 0;
			attr.percent = attr.percent ? attr.percent / 10 : 0;
			
			attr.peers_connected = attr.peers_connected ? attr.peers_connected : 0;
			attr.seeds_connected = attr.seeds_connected ? attr.seeds_connected : 0;
			
			attr.availability = (attr.availability / 65535).toFixed(2);
			
			attr._speed_history = this.speedHistory(attr.id, attr.up_speed, attr.down_speed);
			
			attr.statuses = this.mapStatuses(attr.status);
			attr = this.processStatus(attr);
			
			return attr;
		},
		
		speedHistory: function(id, up_speed, down_speed)
		{
			var d = new Date();
			var tz = d.getTime() - d.getTimezoneOffset() * 60 * 1000;
			
			if(!this.speed_history[id])
			{
				this.speed_history[id] = [];
				var time = tz - (this.max_speed_history * 1000);
				for(i = 0; i++ < this.max_speed_history;)
					this.speed_history[id].push({ up: null, down: null, time: time + (i * 1000) });
			}
			
			this.speed_history[id].push({ up: up_speed || 0, down: down_speed || 0, time: tz });
			
			if(this.speed_history[id].length > this.max_speed_history)
				this.speed_history[id].shift();
			
			return this.speed_history[id];
		},
		
		mapStatuses: function(status)
		{
			var statuses = [];
			
			_.map(this.bits, function(value, index)
			{
				if(Math.pow(2, index) & status)
			        statuses.push(value);
			});
			
			return statuses;
		},
		
		processStatus: function(attr)
		{
			var complete = attr.percent >= 100;
			var data = attr.percent;
			var forcestart = !_.contains(attr.statuses, 'queued') && _.contains(attr.statuses, 'started');
			var res, torrent_class;
			
			if(_.contains(attr.statuses, 'paused'))
			{
				res = 'Paused';
				torrent_class = 'paused';
			}

			if(_.contains(attr.statuses, 'checking'))
			{
				res = "Checked %:.1d%%".replace(/%:\.1d%/, (data / 10).toFixed(1));
				torrent_class = 'checking waiting';
			}
			
            if(!res && complete)
            { 
                if (_.contains(attr.statuses, 'queued'))
                {
                	if(_.contains(attr.statuses, 'started'))
					{
                		res = 'Seeding to ' + (attr.peers_connected || 0) + ' peers';
	                    res += ' - U: ' + App.parseBytes(attr.up_speed) + '/s';
	                    res += ' ETA: ' + App.secondsToString(attr.eta);
						torrent_class = 'seeding';
                	}else{
                		res = "Queued Seed";
						torrent_class = 'seeding waiting';
                	}
                }else{
                    res = "Finished";
					torrent_class = 'done';
                }
            }else if(!res){
                if (_.contains(attr.statuses, 'queued') && !_.contains(attr.statuses, 'started'))
                {
                    res = "Queued, position: " + attr.queue_position;
					torrent_class = 'waiting';
                }else if(!_.contains(attr.statuses, 'queued') && !_.contains(attr.statuses, 'started')){
                    res = "Stopped" + ' ' + data / 10 + "%";
					torrent_class = 'stopped';
                }else{
                    //res = 'Downloading ' + data / 10 + '%';
                	res = forcestart ? '[F] ' : '';
                    res += 'Downloading from ' + (attr.seeds_connected || 0) + ' peers';
                    res += ' - D: ' + App.parseBytes(attr.down_speed) + '/s U: ' + App.parseBytes(attr.up_speed) + '/s';
                    res += ' ETA: ' + App.secondsToString(attr.eta);
					torrent_class = 'downloading';
                }
            }
            
            var status_split = res.split(' - ');
            
            attr._torrent_class = torrent_class;
            attr._status_byline = res;
            attr._compact_byline = status_split.length > 1 ? status_split[1] : res;
            return attr;
		}
	});

})(Spine, Spine.$);