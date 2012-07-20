(function($, Handlebars)
{

var Helpers = {
    poll_queries: [
        'btapp/torrent/all/*/remove/',
        'btapp/torrent/all/*/open_containing/',
        'btapp/torrent/all/*/properties/all/uri/', 
        'btapp/torrent/all/*/properties/all/name/', 
        'btapp/torrent/all/*/properties/all/eta/', 
        'btapp/torrent/all/*/properties/all/size/', 
        'btapp/torrent/all/*/properties/all/progress/', 
        'btapp/torrent/all/*/properties/all/added_on/', 
        'btapp/browseforfiles/',
        'btapp/create/', 
        'btapp/settings/', 
        'btapp/add/',
        'btapp/events/',
        'btapp/connect_remote/',
        'btapp/stash/',
        'btapp/showview/'
    ], 

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

    secondsToString: function(seconds)
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
}

Handlebars.registerHelper('parseBytes', Helpers.parseBytes)
Handlebars.registerHelper('secondsToDate', Helpers.secondsToDate)
Handlebars.registerHelper('relativeDate', function(seconds)
{
    var d = new Date();
    seconds = d.getTime() / 1000 - seconds;
    return Helpers.secondsToString(seconds);
})
Handlebars.registerHelper('secondsToString', Helpers.secondsToString)

var AppView = Backbone.View.extend({
    events: {
        'click #sidebar li a': 'filterTorrents'
    },

    initialize: function()
    {
        Templates = {
            torrent_row: Handlebars.compile($('#tmpl_torrent').html())
        }

        btapp.connect({}, {
            poll_frequency: 1000,
            queries: Helpers.poll_queries
        })

        this.torrents = new Torrents();
        this.torrents_contents = new TorrentsList({ model: torrents });
        
        $('#torrents .content').replaceWith(this.torrents_contents.render().el);
    },

    filterTorrents: function(e)
    {
        e.preventDefault()

        var el = $(e.currentTarget)

        var section = $(el).closest('section').data('section')
        var elems
        var torrents_list = this.torrents_contents.$el.children()
        var selector = ''
        
        switch(section)
        {
            case 'torrents':
                selector = $(el).data('show')
                if(selector.length <= 0)
                    selector = ''

                break

            case 'labels':
                var label = $(el).data('label')
                selector = '[data-label=' + label + ']'
                
                break
        }

        elems = selector.length > 0 ? torrents_list.filter(selector) : torrents_list
        
        torrents_list.removeClass('selected').not(elems).animate({
            scale: 0.9,
            opacity: 0,
            height: 0
        }, 150, function()
        {
            $(this).addClass('hidden')
        })

        elems.css('height', 75).removeClass('hidden').animate({
            opacity: 1,
            scale: 1
        }, 150)
    }
})

var TorrentControls = Backbone.View.extend({

})

var TorrentRow = Backbone.View.extend({
    tagName: 'div',
    className: 'torrent',
    status_classes: 'paused waiting checking downloading seeding done stopped error',
    
    events: {
        "click": "selected",
        'mousedown': 'down',
        'mouseup': 'up'
    },

    initialize: function()
    {
        this.template = Templates.torrent_row

        // this.model.set({ selected: false }, { silent: true })
        this.model.on('change', this.render, this);
    },

    render: function()
    {
        var attr  = this.model.get('properties').attributes
        var dyn_attributes = this.dynamicAttributes(attr)

        this.$el.attr('data-label', attr.label)
        this.$el.attr('data-percent', attr.progress / 10)
        
        this.$el.removeClass(this.status_classes)
            // .toggleClass('selected', this.$el.hasClass('selected'))
            .addClass(dyn_attributes._torrent_class)

        var animate = this.$el.html() === '';

        this.$el.html(
            Templates.torrent_row(
                _.extend(this.model.get('properties').attributes, dyn_attributes)
            )
        )

        if(animate)
        {
            this.$el.css({
                scale: '0.9',
                opacity: 0
            }).animate({
                scale: 1,
                opacity: 1
            }, 200)
        }

        return this
    },

    down: function()
    {
        this.$el.css({ scale: '0.985' })
    },

    up: function()
    {
        this.$el.css({ scale: '1' })
    },

    selected: function()
    {
        this.$el.toggleClass('selected')
    },

    dynamicAttributes: function(attr)
    {
        // var attr = this.model.get('properties').attributes
        attr.percent = attr.progress / 10

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
                    res += ' - U: ' + Helpers.parseBytes(attr.up_speed) + '/s';
                    res += ' ETA: ' + Helpers.secondsToString(attr.eta);
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
                res += ' - D: ' + Helpers.parseBytes(attr.down_speed) + '/s U: ' + Helpers.parseBytes(attr.up_speed) + '/s';
                res += ' ETA: ' + Helpers.secondsToString(attr.eta);
                torrent_class = 'downloading';
            }
        }
        
        var status_split = res.split(' - ');
        
        var obj_res = {
            '_percent': attr.progress / 10,
            '_torrent_class': torrent_class,
            '_status_byline': res,
            '_compact_byline': status_split.length > 1 ? status_split[1] : res,
            '_ratio': (attr.ratio / 1000).toFixed(2)
        }

        return obj_res;
    }
})

var TorrentsList = Backbone.View.extend(
{
    tagName: 'div',
    className: 'content',

    initialize: function()
    {
        btapp.live('torrent *', function(torrent, torrent_list)
        {
            var view = new TorrentRow({
                model: torrent
             });

            this.$el.append(view.render().el)
        }, this)
    },

    render: function()
    {
        return this
    }
})

var Torrent = Backbone.Model.extend({
    bits: ['started', 'checking', 'start after check', 'checked', 'error', 'paused', 'queued', 'loaded'],

    initialize: function()
    {
        this.set({ selected: false })
    }
})

var Torrents = Backbone.Collection.extend({
    model: Torrent,

    initialize: function()
    {
    }
})

$(function()
{

    // $('#torrents').on('click', '.torrent', function(e)
    // {
    //     e.preventDefault()
    //     // $('.torrent', '#torrents').removeClass('selected')
    //     $(this).toggleClass('selected')

    //     $('#torrent_controls').toggleClass('open', $('.torrent.selected', '#torrents').length > 0)
    // })

    $('#controls_top').on('click', '.sub ul a', function(e)
    {
        e.preventDefault()
        $(this).closest('.sub').removeClass('open')
    })

    $('#controls_top').on('click', '.sub > a:first', function(e)
    {
        e.preventDefault()
        $(this).parent().toggleClass('open')
        $(this).next('ul').css({
            scale: 0.8,
            opacity: 0
        }).animate({
            scale: 1,
            opacity: 1
        }, 200)
    })
})

window.btapp = new Btapp()

var Templates
var App

$(function()
{
    App = new AppView({ el: $('body') });
})

})(jQuery, Handlebars);