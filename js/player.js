(function(potato, $, chrome, undefined) {

    var Player = function() {
        this.flashback = undefined;
        this.channel = undefined;
    };

    Player.prototype.play = function(channel, zoom) {

        // Make sure we dont already have a player for this channel.
        if ($('#players .player[channel="' + channel + '"]').length !== 0) {
            return;
        }

        // Get the number of current players
        var numPlayers = potato.players.players.length;

        // Make sure we dont have more than 4 videos playing at once.
        if (numPlayers === 3) {
            return;
        }

        // Set our channel.
        this.channel = channel;

        // Get the html template.
        var player = $($('#player-template').html().format(this.channel, numPlayers));

        // Append the player
        $('#players').append(player);

        // Show the player.
        $('#players').fadeIn();

        // Add the player to the players list.
        potato.players.add(channel);

        // Arrange the players.
        potato.players.arrange();

    };

    Player.prototype.stop = function(channel) {

        $('#players .player[channel="' + channel + '"]').remove();

        potato.players.remove(channel);

        console.warn('TODO: Show and update guide after stopping video.');
        console.warn('TODO: Reorder our players after stopping video.');

    };

    Player.prototype.showChat = function() {

        // Get the now loaded webview.
        webview = $('#players .player[channel="' + this.channel + '"] .chat webview');

        // Navigate to the chat url.
        webview.attr('src', 'http://twitch.tv/{0}/chat?popout=true'.format(this.channel));

        // Insert our custom css when the webview loads.
        webview.on('loadcommit', function() {

            // Insert our custom css for the chat.
            webview[0].insertCSS({
                file: 'css/twitch.css'
            });

            // Set the zoom level
            this.setZoom(zoom);

        }.bind(this));

    };

    Player.prototype.setZoom = function(zoom) {

        var webview = $('#players .player[channel="' + this.channel + '"] .chat webview')[0];

        // Set the zoom level
        webview.insertCSS({
            code: 'body { font-size: ' + zoom + '%!important; }'
        });

    };

    Player.prototype.activate = function(channel) {

        var player = $('#players .player[channel="' + channel + '"]');
        var order = player.attr('order');

        // Update order of the currently activated player.
        $('#players .player[order="0"]').attr('order', order);

        // Update the order for the activated player.
        player.attr('order', 0);

    };

    potato.player = new Player();

}(window.Potato, window.jQuery, window.chrome));