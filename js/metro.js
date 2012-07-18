$(function()
{
	$('#torrents').on('click', '.torrent', function()
	{
		// $('.torrent', '#torrents').removeClass('selected')
		$(this).toggleClass('selected')

		$('#torrent_controls').toggleClass('open', $('.torrent.selected', '#torrents').length > 0)
	})
})