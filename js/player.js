(function(potato, $, chrome, undefined) {

    var Player = function() {
        this.input = 'Player';

        this.players = [];
        this.layout = 'default';
        this.layouts = ['default', 'equal'];
        this.selectTimer = null;
    };

    Player.prototype.onInput = function(id, type) {

        var input = potato.input.getRegisteredInput(id, type);

        if (input !== undefined && input.type === 'keyup') {
            switch (input.id) {
                case 'playerUp':
                    this.updateSelected(-1);
                    break;
                case 'playerDown':
                    this.updateSelected(1);
                    break;
                case 'playerStop':
                    this.stop();
                    break;
                case 'playerPause':
                    this.pause();
                    break;
                case 'playerMute':
                    this.mute();
                    break;
                case 'playerFlashback':
                    this.flashback();
                    break;
                case 'playerSelect':
                    this.select();
                    break;
                case 'playerLayout':
                    var layout;

                    if (this.layout === 'default') {
                        layout = 'equal';
                    } else {
                        layout = 'default';
                    }

                    this.updateLayout(layout);
                    break;
                case 'playerFullscreenToggle':
                    this.fullscreen();
                    break;
                case 'playerFullscreenEnter':
                    this.fullscreen(true);
                    break;
                case 'playerFullscreenExit':
                    this.fullscreen(false);
                    break;
                default:
                    break;
            }
        }

    };

    Player.prototype.getPlayerById = function(id) {

        for (var i in this.players) {
            var player = this.players[i];

            if (player.id === id) {
                return player;
            }
        }

        return undefined;

    };

    Player.prototype.getPlayerByNumber = function(number) {

        for (var i in this.players) {
            var player = this.players[i];

            if (player.number === number) {
                return player;
            }
        }

        return undefined;

    };

    Player.prototype.getSelectedPlayer = function() {

        var number = parseInt($('#players .player.selected').attr('number') || 0);

        return this.getPlayerByNumber(number);

    };

    Player.prototype.create = function(id) {
        // Check to see if a player for this id exists.
        var player = this.getPlayerById(id);

        if (player === undefined) {

            // Get the number of current players
            var numPlayers = this.players.length;

            // Append the new player.
            $('#players').append(
                $($('#player-template').html().format(id, numPlayers))
            );

            // Initialize our player object.
            player = {
                // Set the id value.
                id: id,
                // Set the laoded value.
                isLoaded: false,
                // Set the playing value.
                isPlaying: false,
                // Set the muted value.
                isMuted: false,
                // Set the number value.
                number: numPlayers,
                // Set the flashback value.
                flashback: undefined,
                // Set the webview value.
                webview: $('#players webview[number="' + numPlayers + '"]')
            };

            // Add the player to our list.
            this.players.push(player);

        }

        return player;
    };

    Player.prototype.play = function(id, create, isVideo) {

        // Register the player inputs.
        potato.input.registerInputs(this);

        // Get the number of current players
        var numPlayers = this.players.length;

        // Make sure we dont have more than 4 videos playing at once.
        if (numPlayers === 4) {
            return;
        }

        // Attempt to get the player by id.
        var player = this.getPlayerById(id);

        // Check to see if this player already exists.
        if (player !== undefined) {
            // Select this player.
            this.select();

            // Make sure the video is playing.
            this.executeEmbedMethod(player, 'playVideo');

            //Set the player as playing.
            player.isPlaying = true;

            return;
        }

        if (create === true) {
            // Create a new player.
            player = this.getPlayerById(id) || this.create(id);
        } else {
            // Get the main player or create a new one if one doesn't exist.
            player = this.getPlayerByNumber(0) || this.create(id);
        }

        if (player.isLoaded !== true) {
            // Load the player after the webview has loaded.
            player.webview.on('loadcommit', function() {
                setTimeout(function() {
                    // Load the player.
                    this.load(player, id, isVideo);
                    // Set the player as loaded.
                    player.isLoaded = true;
                }.bind(this), 1000);
            }.bind(this));
        } else {
            // Load the player.
            this.load(player, id, isVideo);
        }

        // Show the player.
        $('#players').fadeIn();

        this.updateLayout();

    };

    Player.prototype.select = function() {

        // Get the current player.
        var current = this.getPlayerByNumber(0);

        // Get the selected player.
        var player = this.getSelectedPlayer();

        if (player !== undefined) {
            // Update number of the currently selected player.
            current.number = player.number;
            current.webview.attr('number', player.number);

            // Update the number of the selected player.
            player.number = 0;
            player.webview.attr('number', 0);
        }

        this.clearSelected();

    };

    Player.prototype.stop = function() {

        // Get the selected player.
        var player = this.getSelectedPlayer();

        if (player !== undefined) {

            // We only want to make sure we have one player open at all times
            // so that we dont have to waste time reloading the .swf when
            // starting a new one.
            if (this.players.length > 1) {
                // We have more than one player, so since we are stopping this one
                // go ahead and delete the current one.
                this.remove(player);
            } else {
                // Stop the player.
                this.executeEmbedMethod(player, 'pauseVideo');

                // Player is no longer playing.
                player.isPlaying = false;

                // Show the guide.
                potato.toggleGuide();
            }
        }

    };

    Player.prototype.pause = function() {

        // Get the selected player.
        var player = this.getSelectedPlayer();

        if (player !== undefined) {

            // Check to see if the player is currently playing.
            if (player.isPlaying) {
                // Pause the video.
                this.executeEmbedMethod(player, 'pauseVideo');
            } else {
                // Play the video.
                this.executeEmbedMethod(player, 'playVideo');
            }

            // Update the playing value.
            player.isPlaying = !player.isPlaying;

        }

    };

    Player.prototype.remove = function(player) {

        // Remove the player from the document.
        player.webview.remove();

        // Remove the player from the player list.
        var index = this.players.indexOf(player);
        this.players.splice(index, 1);

        // Update the player numbers.
        this.updateNumbers();

        // Clear the selector
        this.clearSelected();

    };

    Player.prototype.updateNumbers = function() {

        // Sort the players by their number value.
        this.players.sort(function(a, b) {
            return a.number - b.number;
        });

        // Reset their number values based on their new index.
        for (var i in this.players) {
            var player = this.players[i];

            // Update the number.
            player.number = parseInt(i);

            // Update the webview
            player.webview.attr('number', i);
        }

    };

    Player.prototype.updateLayout = function(layout) {

        this.layout = layout || this.layout;

        $('#players .player')
            .removeClass('default')
            .removeClass('equal')
            .addClass(this.layout);

        $('#players .selector')
            .removeClass('default')
            .removeClass('equal')
            .addClass(this.layout);

    };

    Player.prototype.updateSelected = function(direction) {

        // Get the index of the selected player.
        var index = parseInt($('#players .player.selected').attr('number') || 0);

        // Remove the selected class from the player.
        $('#players .player').removeClass('selected');

        // Reset the selector.
        $('#players .selector').removeAttr('number');

        index += direction || 0;

        // Index bounds checking.
        if (index < 0) {
            index = $('#players .player').length - 1;
        } else if (index > $('#players .player').length - 1) {
            index = 0;
        }

        // Set the selected item.
        $('#players .player[number="' + index + '"]').addClass('selected');

        // Set the selector
        $('#players .selector').attr('number', index);

        $('#players .selector').attr('number', index);
        console.log(0, $('#players .selector').attr('number'));

        // Update the player numbers.
        this.updateNumbers();
        console.log(1, $('#players .selector').attr('number'));
        // Clear the selected timer.
        clearTimeout(this.selectTimer);

        // Set a new selected timer.
        this.selectTimer = setTimeout(this.clearSelected, 5000);
        console.log(2, $('#players .selector').attr('number'));

    };

    Player.prototype.clearSelected = function() {

        // Remove the selected class from the player.
        $('#players .player').removeClass('selected');

        // Reset the selector.
        $('#players .selector').removeAttr('number');

    };

    Player.prototype.flashback = function() {

        // Get the selected player.
        var player = this.getSelectedPlayer(0);

        if (player.flashback !== undefined) {
            // Load the previous player.
            this.load(player, player.flashback);
        }

    };

    Player.prototype.fullscreen = function(state) {

        // Default to the  toggle stage.
        state = (state === undefined) ? null : state;

        var nHeight = screen.height;
        var fHeight = nHeight + 32;

        var player = this.getPlayerByNumber(0);

        if ((state === null && player.webview.height() === nHeight) || state === true) {
            // Toggle player to fullscreen.
            player.webview.height(fHeight);
        } else if ((state === null && player.webview.height() === fHeight) || state === false) {
            // Toggle player to normal.
            player.webview.height(nHeight);
        }

    };

    Player.prototype.load = function(player, id, video) {

        // Set the flashback value.
        player.flashback =
            (player.id !== id) ? player.id : player.flashback;

        // Set the player id value.
        player.id = id;

        if (video !== true) {
            // Load the player.
            this.executeEmbedMethod(player, 'loadStream', id);
        } else {
            // Load the video.
            this.executeEmbedMethod(player, 'loadVideo', id);
        }

        // Make sure the video is playing.
        this.executeEmbedMethod(player, 'playVideo');

        //Set the player as playing.
        player.isPlaying = true;

    };

    Player.prototype.mute = function(mute) {

        var player = this.getSelectedPlayer();

        player.isMuted = mute || !player.isMuted;

        if (player.isMuted === true) {
            this.executeEmbedMethod(player, 'mute');
        } else {
            this.executeEmbedMethod(player, 'unmute');
        }

    };

    Player.prototype.executeEmbedMethod = function(player, method, arg) {

        var code = 'document.getElementsByTagName("embed")[0].{0}()'.format(method);

        if (arg !== undefined) {
            code = 'document.getElementsByTagName("embed")[0].{0}("{1}")'.format(method, arg);
        }

        player.webview[0].executeScript({
            code: code
        });

    };

    var player = new Player();

    $(function() {
        // Create an undefined player.
        //player.play();
    });

    potato.player = player;

}(window.Potato, window.jQuery, window.chrome));

/*
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
*/