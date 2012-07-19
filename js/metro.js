window.btapp = new Btapp();
btapp.connect();


btapp.on('add:torrent', function(torrent_list) {
    torrent_list.each(function(torrent)
    {
        console.log(torrent);
    })
});

btapp.live('torrent * properties', function(properties, torrent, torrent_list)
{
    console.log(properties.arguments)
})

$(function()
{

    $('#torrents').on('click', '.torrent', function(e)
    {
        e.preventDefault()
        // $('.torrent', '#torrents').removeClass('selected')
        $(this).toggleClass('selected')

        $('#torrent_controls').toggleClass('open', $('.torrent.selected', '#torrents').length > 0)
    })

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

    $('#sidebar').on('click', 'a', function(e)
    {
        e.preventDefault()

        var section = $(this).closest('section').data('section')
        var elems
        var torrents_list = $('#torrents').children('.content').children()
        var selector = ''

        switch(section)
        {
            case 'torrents':
                selector = $(this).data('show')
                if(selector.length <= 0)
                    selector = ''

                break

            case 'labels':
                var label = $(this).data('label')
                selector = '[data-label=' + label + ']'
                
                break
        }

        elems = selector.length > 0 ? torrents_list.filter(selector) : torrents_list
        
        torrents_list.not(elems).animate({
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
    })
})