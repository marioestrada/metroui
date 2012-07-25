(function($, Handlebars)
{

var Templates
var App
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
        var i
        var sizes = ["b", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        if(size <= 0 || !size)
        {
            return('0 b')
        }else{
            i = Math.floor(Math.log(size) / Math.log(1024))
            size = size / Math.pow(1024, i)
            rounded = (Math.round(size * 100)) / 100
            return rounded + " " + sizes[i]
        }
    },

    secondsToDate: function(seconds)
    {
        if(!seconds)
            return 'n/a'
        
        var d = new Date(seconds * 1000)
        
        return d.getDate() + '/' + d.getMonth() + '/' + d.getFullYear()
    },

    secondsToString: function(data, empty_infinity)
    {
        if (data == -1 || !data)
            return "\u221E"
        
        var secs = Number(data)
        
        if(secs > 63072000)
            return empty_infinity ? '' : "\u221E"
        
        var div, y, w, d, h, m, s, output = ""
        
        y = Math.floor(secs / 31536000)
        div = secs % 31536000
        w = Math.floor(div / 604800)
        div = div % 604800
        d = Math.floor(div / 86400)
        div = div % 86400
        h = Math.floor(div / 3600)
        div = div % 3600
        m = Math.floor(div / 60)
        s = div % 60
        
        if (y > 0)
        {
            output = "%dy %dw".replace(/%d/, y).replace(/%d/, w)
        }else if(w > 0){
            output = "%dw %dd".replace(/%d/, w).replace(/%d/, d)
        }else if(d > 0){
            output = "%dd %dh".replace(/%d/, d).replace(/%d/, h)
        }else if(h > 0){
            output = "%dh %dm".replace(/%d/, h).replace(/%d/, m)
        }else if(m > 0){
            output = "%dm %ds".replace(/%d/, m).replace(/%d/, s)
        }else{
            output = "%ds".replace(/%d/, s)
        }
        return output
    }
}

Handlebars.registerHelper('parseBytes', Helpers.parseBytes)
Handlebars.registerHelper('secondsToDate', Helpers.secondsToDate)
Handlebars.registerHelper('relativeDate', function(seconds)
{
    var d = new Date()
    seconds = d.getTime() / 1000 - seconds
    return Helpers.secondsToString(seconds)
})
Handlebars.registerHelper('secondsToString', Helpers.secondsToString)

var AppView = Backbone.View.extend({
    events: {
        'click #sidebar li a': 'filterTorrents',
        'click #torrent_controls a': 'runAction'
    },

    initialize: function()
    {
        var _this = this

        Templates = {
            torrent_row: Handlebars.compile($('#tmpl_torrent').html())
        }

        btapp.connect({}, {
            poll_frequency: 1000,
            queries: Helpers.poll_queries,
            // pairing_type: 'native',
            // plugin: false,
            product: 'uTorrent'
        })

        btapp.on('plugin:plugin_installed', function()
        {
            this.torrents_contents.setMessage('Checking plugin&hellip;')
        }, this)

        btapp.on('pairing:attempt', function()
        {
            this.torrents_contents.setMessage('Pairing with client&hellip;')
        }, this)

        btapp.on('client:connected', function()
        {
            this.torrents_contents.setMessage('Client connected&hellip;')
        }, this)

        btapp.on('sync', function()
        {
            var up_el = $('#up_speed')
            var down_el = $('#down_speed')
            
            _.defer(function(_this)
            {
                var up = 0
                var down = 0

                btapp.get('torrent').each(function(torrent)
                {
                    up += torrent.get('properties').get('upload_speed')
                    down += torrent.get('properties').get('download_speed')
                })

                up_el.html(Helpers.parseBytes(up))
                down_el.html(Helpers.parseBytes(down))

                _this.sidebar_el.find('.actual').trigger('click', [true])
            }, _this)
        });

        this.top_controls = new TopControls({
            el: $('#controls_top')
        })

        this.torrents = new Torrents()
        this.torrents_contents = new TorrentsList({
            model: torrents,
            el: $('#torrents .content')
        })

        this.sidebar_el = $('#sidebar')
    },

    runAction: function(e)
    {
        e.preventDefault()

        var el = $(e.currentTarget)
        var action = el.data('action')
        var selected = this.torrents_contents.getSelected()
        var method
        var set_property

        if(el.hasClass('disabled'))
            return

        switch(action)
        {
            case 'pause':
                method = 'pause'
                break

            case 'play':
                method = 'start'
                break

            case 'remove':
                method = 'remove'
                break
        }

        _.each(selected, function(id)
        {
            var torrent = btapp.get('torrent').get(id)

            if(method)
            {
                torrent[method]()
            }else if(set_property){
                torrent.save(set_property.property, set_property.value)
            }
        })
    },

    filterTorrents: function(e)
    {
        e.preventDefault()

        this.sidebar_el.find('.actual').removeClass('actual')
        var el = $(e.currentTarget).addClass('actual')

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
                selector = label.length > 0 ? '[data-label=' + label + ']' : ':not([data-label])'
                
                break
        }

        elems = selector.length > 0 ? torrents_list.filter(selector) : torrents_list
        
        torrents_list.not(elems)
            .removeClass('selected')
            .animate({
                scale: 0.9,
                opacity: 0,
                height: 0
            }, 150, function()
            {
                $(this).addClass('hidden')
            })

        elems.css('height', 75)
            .removeClass('hidden')
            .animate({
                opacity: 1,
                scale: 1
            }, 150)

        this.torrents_contents.setName(el.data('title'))
    }
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

        this.model.on('change', this.render, this)

        this.model.on('destroy', this.remove, this)

        this.model.live('properties', _.bind(function(properties)
        {
            properties.on('change', this.render, this)
        }, this))

        this.bits = ['started', 'checking', 'start after check', 'checked', 'error', 'paused', 'queued', 'loaded']
    },

    render: function()
    {
        if(!this.model.get('properties'))
            return this;

        var attr  = this.model.get('properties').attributes
        var dyn_attributes = this.dynamicAttributes(attr)
        
        this.$el.attr('data-label', attr.label)
            .attr('data-percent', attr.progress / 10)
            .attr('data-hash', attr.hash)
            .toggleClass('selected', this.$el.hasClass('selected'))
        
        this.$el.removeClass(this.status_classes)
            .addClass(dyn_attributes._torrent_class)

        var animate = this.$el.html() === ''

        this.$el.html(
            Templates.torrent_row(
                _.extend(dyn_attributes, attr)
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

        var selected_els = $('.torrent.selected', '#torrents')

        $('#torrent_controls').toggleClass('open', selected_els.length > 0)

        if(selected_els.length > 1)
        {
            $('#torrent_controls').find('[data-multiple=false]').addClass('disabled')
        }else if(selected_els.length == 1){
            $('#torrent_controls').find('[data-multiple]').removeClass('disabled')
        }else{
            $('#torrent_controls').find('[data-multiple]').addClass('disabled')
        }
    },

    mapStatuses: function(status)
    {
        var statuses = []
        
        _.map(this.bits, function(value, index)
        {
            if(Math.pow(2, index) & status)
                statuses.push(value)
        })
        
        return statuses
    },

    dynamicAttributes: function(attr)
    {
        var percent = attr.progress / 10

        var statuses = this.mapStatuses(attr.status)

        var complete = percent >= 100
        var data = percent
        var forcestart = !_.contains(statuses, 'queued') && _.contains(statuses, 'started')
        var res, torrent_class
        
        if(_.contains(statuses, 'paused'))
        {
            res = 'Paused'
            torrent_class = 'paused'
        }

        if(_.contains(statuses, 'checking'))
        {
            res = "Checked %:.1d%%".replace(/%:\.1d%/, percent.toFixed(1))
            torrent_class = 'checking waiting'
        }
        
        if(!res && complete)
        { 
            if (_.contains(statuses, 'queued'))
            {
                if(_.contains(statuses, 'started'))
                {
                    res = 'Seeding to ' + (attr.peers_connected || 0) + ' peers'
                    res += ' - U: ' + Helpers.parseBytes(attr.upload_speed) + '/s'
                    res += ' ETA: ' + Helpers.secondsToString(attr.eta)
                    torrent_class = 'seeding'
                }else{
                    res = "Queued Seed"
                    torrent_class = 'seeding waiting'
                }
            }else{
                res = "Finished"
                torrent_class = 'done'
            }
        }else if(!res){
            if (_.contains(statuses, 'queued') && !_.contains(statuses, 'started'))
            {
                res = "Queued, position: " + attr.queue_order
                torrent_class = 'waiting'
            }else if(!_.contains(statuses, 'queued') && !_.contains(statuses, 'started')){
                res = "Stopped" + ' ' + data / 10 + "%"
                torrent_class = 'stopped'
            }else{
                res = forcestart ? '[F] ' : ''
                res += 'Downloading from ' + (attr.seeds_connected || 0) + ' peers'
                res += ' - D: ' + Helpers.parseBytes(attr.download_speed) + '/s U: ' + Helpers.parseBytes(attr.upload_speed) + '/s'
                res += ' ETA: ' + Helpers.secondsToString(attr.eta)
                torrent_class = 'downloading'
            }
        }
        
        var status_split = res.split(' - ')
        
        var obj_res = {
            '_percent': attr.progress / 10,
            '_torrent_class': torrent_class,
            '_status_byline': res,
            '_compact_byline': status_split.length > 1 ? status_split[1] : res,
            '_ratio': (attr.ratio / 1000).toFixed(2),
            '_statuses': statuses
        }

        return obj_res
    }
})

var TorrentsList = Backbone.View.extend(
{
    initialize: function()
    {
        this.name_el = this.$el.siblings('.name')
        this.parent_el = this.$el.parent()
        this.message_el = this.$el.find('.message')

        btapp.live('torrent *', function(torrent, torrent_list)
        {
            this.message_el.remove()

            var view = new TorrentRow({
                model: torrent
             })

            this.$el.append(view.render().el)
        }, this)
    },

    setMessage: function(message)
    {
        this.message_el.html(message)
    },

    setName: function(name)
    {
        var new_name = this.name_el.clone().html(name)
        var old_name = this.name_el
        var _this = this

        if(new_name.text() === old_name.text())
            return
        
        this.name_el = new_name

        old_name.addClass('old')
            .animate({
                opacity: 0,
                translateX: '-=50'
            }, 300, function()
            {
                $(this).remove()
            })

        new_name.prependTo(this.parent_el)
    },

    getSelected: function()
    {
        var selected_els = this.$el.children('.selected')
        var selected_hashes = _.reduce(selected_els, function(memo, el)
            {
                memo.push($(el).attr('data-hash'))
                return memo
            }, [])

        return selected_hashes 
    }
})

var TopControls = Backbone.View.extend({
    events: {
        'click .sub > a:first': 'openSub',
        'click .sub ul a': 'runAction',
        'click .sub-panel .cancel': 'cancelSubPanel',
        'click .sub-panel .add': 'addUrl'
    },

    initialize: function()
    {
    },

    addUrl: function(e)
    {
        var me = $(e.currentTarget)
        var sub_panel = me.closest('.sub-panel')
        var url = sub_panel.find('input').val()

        switch(me.data('action'))
        {
            case 'add-torrent':
                btapp.get('add').torrent(url)
                break

            case 'add-feed':
                btapp.get('add').rss_feed(url)
                break
        }

        sub_panel.animate({
            opacity: 0,
            scale: 0.8
        }, 200, function()
        {
            $(this).addClass('hidden')
        })
    },

    cancelSubPanel: function(e)
    {
        var me = $(e.currentTarget)

        me.closest('.sub-panel')
            .animate({
                opacity: 0,
                rotateZ: -0.75,
                translateY: '+=300'
            }, 250, function()
            {
                $(this).addClass('hidden')
                    .css({
                        opacity: 1,
                        rotateZ: 0,
                        translateY: 0
                    })
            })
    },

    openSub: function(e)
    {
        e.preventDefault()

        var me = $(e.currentTarget)

        me.parent().toggleClass('open')
        me.next('ul').css({
            scale: 0.8,
            opacity: 0
        }).animate({
            scale: 1,
            opacity: 1
        }, 200) 
    },

    runAction: function(e)
    {
        e.preventDefault()

        var me = $(e.currentTarget)
        
        me.closest('.sub').removeClass('open')
        console.log(me)
        switch(me.data('action'))
        {
            case 'add-torrent':
            case 'add-feed':
                $('#' + me.data('action'))
                    .removeClass('hidden')
                    .css({
                        scale: 0.8,
                        opacity: 0
                    }).animate({
                        scale: 1,
                        opacity: 1
                    }, 200)

            break;
        }
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
    model: Torrent
})

window.btapp = new Btapp()

$(function()
{
    App = new AppView({ el: $('body') })
})

})(jQuery, Handlebars);