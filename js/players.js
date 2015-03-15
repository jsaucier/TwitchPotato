(function(potato, $, chrome, undefined) {

    var Players = function() {
        this.players = [];
        this.layout = 'default';
        this.layouts = ['default', 'pip', 'equal'];
    };

    Players.prototype.getPlayerByChannel = function(channel) {

        for (var i in this.players) {
            var player = this.players[i];

            if (player.channel === channel) {
                return player;
            }
        }

        return undefined;

    };

    Players.prototype.add = function(channel) {

        // Check to make sure the channel isnt playing.
        var player = this.getPlayerByChannel(channel);

        if (player === undefined) {
            this.players.push({
                channel: channel
            });
        }

    };

    Players.prototype.remove = function(channel) {

        var index = -1;

        for (var i in this.players) {
            var player = this.players[i];

            if (player.channel === channel) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            this.players.splice(index, 1);
        }
    };

    Players.prototype.arrange = function(layout) {

        this.layout = layout || this.layout;

        $('#players .player')
            .removeClass('default')
            .removeClass('pip')
            .removeClass('equal')
            .addClass(this.layout);

    };

    potato.players = new Players();

}(window.Potato, window.jQuery, window.chrome));