(function($, Backbone, Handlebars)
{

var Templates
var App

var Helpers = {
    Mixins: {},

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
        var d = new Date(seconds * 1000)

        if(!seconds || isNaN(d))
            return 'n/a'
        
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

var MainApp = Backbone.View.extend({
    events: {
        'click #torrent_controls a': 'runAction'
    },

    initialize: function()
    {
        var _this = this

        btapp.connect({
            queries: [['btapp','torrent'], ['btapp','add']]
        });

        this.context = 'torrents'

        // btapp.on('all', console.log, console)

        var message = {
            'plugin:plugin_installed': { message: 'Checking plugin&hellip;' },
            'pairing:attempt': { message: 'Pairing with client&hellip;' },
            'client:connected': {
                message: 'Client connected. Ready for torrents&hellip;',
                callback: function()
                {
                    $('.main_content').addClass('started')
                }
            },
        }

        _.each(message, function(data, key)
        {
            btapp.on(key, function()
            {
                this.torrents_list.setMessage(data.message)
                if(data.callback)
                    data.callback()

                btapp.off(key)
            }, this)
        }, this)

        btapp.on('sync', function()
        {
            _.defer(_this.refreshTotals, _this)
        })

        this.top_controls = new TopControls({
            el: $('#controls_top')
        })

        this.sidebar = new Sidebar({
            el: $('#sidebar')
        }, {
            app: this //Not working for some reason
        })

        this.torrents_list = new TorrentsList({
            el: $('#torrents .content')
        })

        this.feed_torrents_list = new FeedTorrentsList({
            el: $('#feeds .content')
        })
    },

    setContext: function(context)
    {
        if(this.context === context)
            return

        var current = $('#' + this.context)
        var next = $('#' + context)

        this.context = context

        this.torrents_list.deselectAll()

        current.children()
            .animate({
                opacity: 0,
                translateX: -10
            }, 300, function()
            {
                $(this).parent().addClass('hidden')
            })

        next.removeClass('hidden')
            .children('.name')
                .css({
                    opacity: 0,
                    translateX: 30
                }).animate({
                    opacity: 1,
                    translateX: 0
                }, 300).end()
            .children('.content')
                .css({
                    opacity: 0,
                    translateX: 50,
                    scale: 0.98
                }).delay(100).animate({
                    opacity: 1,
                    translateX: 0,
                    scale: 1
                }, 300).end()
    },

    refreshTotals: function(_this)
    {
        _this.calculateSidebarCounts(_this)
        _this.calculateTotals(_this)
    },

    calculateSidebarCounts: function(_this)
    {
        this.sidebar.$('li a').each(function()
        {
            var me = $(this)
            var selector
            var total

            if(me.data('show') !== undefined)
            {
                selector = _this.sidebar.getTorrentsFilterSelector('torrents', me)
                total = selector.length > 0 ? _this.torrents_list.$(selector).length : _this.torrents_list.$el.children().length
            }else if(me.data('label') !== undefined){

            }else if(me.data('feed') !== undefined){
                var feed_id = me.data('feed')

                selector = feed_id ? '[data-feed=\'' + _this.feed_torrents_list.feed_map[feed_id] + '\']' : ''
                total = selector.length > 0 ? _this.feed_torrents_list.$(selector).length : _this.feed_torrents_list.$el.children().length
            }

            me.children('.count')
                .toggleClass('hidden', total === 0)
                .text(total)
        })
    },

    calculateTotals: function(_this)
    {
        var up_el = $('#up_speed')
        var down_el = $('#down_speed')
        var up = 0
        var down = 0

        btapp.get('torrent').each(function(torrent)
        {
            up += torrent.get('properties').get('upload_speed')
            down += torrent.get('properties').get('download_speed')
        })

        up_el.html(Helpers.parseBytes(up))
        down_el.html(Helpers.parseBytes(down))

        _this.sidebar.$el.find('.current').trigger('click', [true])
    },

    runAction: function(e)
    {
        e.preventDefault()

        var el = $(e.currentTarget)
        var action = el.data('action')
        var selected = this.torrents_list.getSelected()
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
                _.delay(function(){ $('#torrent_controls').removeClass('open') }, 250)
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
    }
})

var FeedTorrentRow = Backbone.View.extend({
    tadName: 'div',
    className: 'feed_torrent',

    events: {
        'click .download': 'addTorrent'
    },

    initialize: function()
    {
        this.template = Templates.feed_torrent_row

        this.model.on('change', this.render, this)

        this.model.on('destroy', this.remove, this)

        this.model.live('properties', _.bind(function(properties)
        {
            properties.on('change', this.render, this)
        }, this))
    },

    render: function()
    {
        var attributes = this.model.get('properties').attributes

        this.$el.attr('data-feed', this.model.get('id'))

        this.$el.html(
            Templates.feed_torrent_row(
                _.extend({}, attributes, { in_history: attributes.in_history !== "false" })
            )
        )

        return this
    },

    addTorrent: function(e)
    {
        e.preventDefault()

        btapp.get('add').torrent(this.model.get('properties').get('url'))
    }
})

var TorrentRow = Backbone.View.extend({
    tagName: 'div',
    className: 'torrent',
    status_classes: 'paused waiting checking downloading seeding done stopped error',
    bits: ['started', 'checking', 'start after check', 'checked', 'error', 'paused', 'queued', 'loaded'],
    
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
    },

    render: function()
    {
        if(!this.model.get('properties'))
            return this

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

Helpers.Mixins.List = {
    setName: function(name)
    {
        var new_name = this.name_el.clone().html(name)
        var old_name = this.name_el

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
            .css({
                opacity: 0,
                translateX: '+=50'
            }).animate({
                opacity: 1,
                translateX: 0
            }, 300)
    },

    filterContent: function(elems, list, height)
    {
        height = height || 75

        if(list.length > 10)
        {
            list.not(elems).addClass('hidden')

            if(elems.css('opacity') < 1)
                elems.css({
                    opacity: 1,
                    scale: 1
                })

            elems.removeClass('hidden')

            return
        }

        list.not(elems)
            .removeClass('selected')
            .animate({
                scale: 0.9,
                opacity: 0,
                height: 0
            }, 150, function()
            {
                $(this).addClass('hidden')
            })

        elems.css('height', height)
            .removeClass('hidden')
            .animate({
                opacity: 1,
                scale: 1
            }, 150)
    }
}

var TorrentsList = Backbone.View.extend(
{
    events: {
        'click .torrent': 'checkSelected'
    },

    initialize: function()
    {
        this.name_el = this.$el.siblings('.name')   
        this.parent_el = this.$el.parent()
        this.message_el = this.$el.find('.message')

        btapp.live('torrent *', function(torrent)
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

    getSelected: function()
    {
        var selected_els = this.$el.children('.selected')
        var selected_hashes = _.reduce(selected_els, function(memo, el)
            {
                memo.push($(el).attr('data-hash'))
                return memo
            }, [])

        return selected_hashes 
    },

    deselectAll: function()
    {
        this.$('.selected').removeClass('selected')

        this.checkSelected()
    },

    checkSelected: function()
    {
        var selected_els = this.$('.selected')

        $('#torrent_controls').toggleClass('open', selected_els.length > 0)

        if(selected_els.length > 1)
        {
            $('#torrent_controls').find('[data-multiple=false]').addClass('disabled')
        }else if(selected_els.length == 1){
            $('#torrent_controls').find('[data-multiple]').removeClass('disabled')
        }else{
            $('#torrent_controls').find('[data-multiple]').addClass('disabled')
        }
    }
})

_.extend(TorrentsList.prototype, Helpers.Mixins.List)

var Sidebar = Backbone.View.extend({
    events: {
        'click ul:not(.feeds) a': 'filterTorrents',
        'click ul.feeds a': 'filterFeeds',
        'click ul': 'setContext',
        'click ul a': 'setCurrent'
    },

    initialize: function()
    {
        this.feed_list = new FeedList({
            el: this.$('.feeds')
        })
    },

    setContext: function(e, triggered)
    {
        var context = $(e.currentTarget).hasClass('feeds') ? 'feeds' : 'torrents'

        if(triggered)
            return

        if(!this.app)
            this.app = App

        this.app.setContext(context)
    },

    setCurrent: function(e)
    {
        this.$('.current').removeClass('current')
        $(e.currentTarget).addClass('current')
    },

    filterFeeds: function(e, triggered)
    {
        if(!this.app)
            this.app = App

        e.preventDefault()
        var el = $(e.currentTarget)

        var feeds_list = this.app.feed_torrents_list.$el.children()
        var feed_id = el.data('feed')
        var elems

        elems = feed_id.length > 0 ? feeds_list.filter('[data-feed=\'' + this.app.feed_torrents_list.feed_map[feed_id] + '\']') : feeds_list
        
        this.app.feed_torrents_list.setName(el.data('title'), this)

        this.app.feed_torrents_list.filterContent(elems, feeds_list, 62)
    },

    filterTorrents: function(e, triggered)
    {
        if(!this.app)
            this.app = App

        e.preventDefault()
        var el = $(e.currentTarget)

        var section = $(el).closest('section').data('section')
        var elems
        var torrents_list = this.app.torrents_list.$el.children()
        var selector = ''

        this.app.torrents_list.setName(el.data('title'))

        selector = this.getTorrentsFilterSelector(section, el)

        elems = selector.length > 0 ? torrents_list.filter(selector) : torrents_list
        
        this.app.torrents_list.filterContent(elems, torrents_list, 75)
    },

    getTorrentsFilterSelector: function(type, el)
    {
        switch(type)
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

        return selector
    }
})

var TopControls = Backbone.View.extend({
    events: {
        'click .sub > a:first': 'openSub',
        'click .sub ul a': 'runAction',
        'click .sub-panel .cancel': 'cancelSubPanel',
        'click .sub-panel .add': 'addUrl'
    },

    addUrl: function(e)
    {
        var me = $(e.currentTarget)
        var sub_panel = me.closest('.sub-panel')
        var input = sub_panel.find('input');
        var url = input.val()

        if(url === '')
        {
            input.animate({
                rotateZ: 0.015
            }, 50).animate({
                rotateZ: -0.015
            }, 50).animate({
                rotateZ: 0
            }, 50)

            return
        }

        input.val('')

        switch(me.data('action'))
        {
            case 'add-torrent':
                btapp.get('add').torrent(url)
                break

            case 'add-feed':
                btapp.get('add').rss_feed(url)
                break
        }

        sub_panel
            .animate({
                scale: 1.15
            }, 100).animate({
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
                translateY: '+=200'
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

        this.$el.find('.sub-panel').addClass('hidden')

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

            break
        }
    }
})

var FeedList = Backbone.View.extend({
    initialize: function()
    {
        this.feeds = [{
            properties: {
                attributes: {
                    alias: 'All Feeds'
                }
            }
        }]

        this.list_contents = this.$('ul:first')

        btapp.live('rss_feed *', function(feed, rss_feed)
        {
            this.feeds.push(feed.attributes)

            this.render()
        }, this)
    },

    render: function()
    {
        this.list_contents.html(Templates.feed_list({ items: this.feeds }))
    }
})

var FeedTorrentsList = Backbone.View.extend({
    initialize: function()
    {
        this.name_el = this.$el.siblings('.name')
        this.parent_el = this.$el.parent()  

        this.feed_map = {}

        btapp.live('rss_feed * item *', function(feed_torrent, item, feed)
        {
            if(feed_torrent === 'item')
                return

            if(!this.feed_map[feed.get('id')])
            {
                this.feed_map[feed.get('id')] = feed_torrent.get('id')
            }

            var view = new FeedTorrentRow({
                model: feed_torrent
             })

            this.$el.append(view.render().el)
        }, this)
    }
})

_.extend(FeedTorrentsList.prototype, Helpers.Mixins.List)

var Torrent = Backbone.Model.extend({
})

var Torrents = Backbone.Collection.extend({
    model: Torrent
})

window.btapp = new Btapp()

$(function()
{
    Templates = {
        torrent_row: Handlebars.compile($('#tmpl_torrent').html()),
        feed_torrent_row: Handlebars.compile($('#tmpl_feed_torrent').html()),
        feed_list: Handlebars.compile($('#tmpl_feed_list').html())
    }

    App = new MainApp({
        el: $('body')
    })

    window.app = App
})

})(jQuery, Backbone, Handlebars);