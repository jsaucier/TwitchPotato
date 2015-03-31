module TwitchPotato {
    "use strict";

    enum PlayerLayout {
        Default,
        Equal
    }

    enum Fullscreen {
        Enter,
        Exit,
        Toggle
    }

    export class Player {
        private players: Dictionary<PlayerData>;
        private layout: PlayerLayout = PlayerLayout.Default;
        private selectionTimer: number;

        constructor() { }

        /** Loads the Player inputs. */
        public LoadInputs(): void {
            Application.Input.RegisterInputs(TwitchPotato.InputType.Player);
        }

        public OnInput(input: InputData): void {
            switch (input.id) {
                case 'playerUp':
                    this.UpdateSelected(-1);
                    break;
                case 'playerDown':
                    this.UpdateSelected(1);
                    break;
                case 'playerStop':
                    this.Stop();
                    break;
                case 'playerPause':
                    this.Pause();
                    break;
                case 'playerMute':
                    this.Mute(undefined);
                    break;
                case 'playerFlashback':
                    this.Flashback();
                    break;
                case 'playerSelect':
                    this.Select();
                    break;
                case 'playerLayout':
                    this.UpdateLayout();
                    break;
                case 'playerFullscreenToggle':
                    this.Fullscreen(Fullscreen.Toggle);
                    break;
                case 'playerFullscreenEnter':
                    this.Fullscreen(Fullscreen.Enter);
                    break;
                case 'playerFullscreenExit':
                    this.Fullscreen(Fullscreen.Exit);
                    break;
                default:
                    break;
            }
        }

        private GetPlayerById(id: string): PlayerData {
            for (var i in this.players) {
                var player = this.players[i];

                if (player.id === id) {
                    return player;
                }
            }
            return undefined;
        }

        private GetPlayerByNumber(number: number): PlayerData {
            for (var i in this.players) {
                var player = this.players[i];

                if (player.number === number) {
                    return player;
                }
            }
            return undefined;
        }

        private GetSelectedPlayer(): PlayerData {
            var number = parseInt($('#players .player.selected').attr('number')) || 0;
            return this.GetPlayerByNumber(number);
        }

        private Create(id: string, isVideo = false): PlayerData {
            /* Check to see if a player for this id exists. */
            var player = this.GetPlayerById(id);

            if (player === undefined) {

                /* Get the number of current players */
                var numPlayers = Utils.DictionarySize(this.players);

                /* Append the new player. */
                $('#players').append($(Utils.Format($('#player-template').html(), id, numPlayers)));

                /* Initialize our player object. */
                player = {
                    id: id,
                    isLoaded: false,
                    isPlaying: false,
                    isMuted: false,
                    number: numPlayers,
                    flashback: undefined,
                    webview: <Webview>$('#players webview[number="' + numPlayers + '"]')[0]
                }

                /* Catch load events. */
                player.webview.addEventListener('loadcommit', () => {

                    /* Inject jquery. */
                    player.webview.executeScript({ file: 'js/jquery-2.1.1.min.js' });

                    /* Inject the script file. */
                    player.webview.executeScript({
                        file: 'js/inject.js'
                    });

                    setTimeout(() => {
                        /* Load the player. */
                        this.Load(player, id, isVideo);

                        /* Set the player as loaded. */
                        player.isLoaded = true;
                    });
                });

                /* Hook the console message event. */
                player.webview.addEventListener('consolemessage', (e) => {
                    console.log(e);
                });

                /* Add the player to our list. */
                this.players[player.id] = player;
            }

            return player;
        }

        private Play(id: string, create = false, isVideo = false): void {

            /* Register the player inputs. */
            this.LoadInputs();

            /* Get the number of current players */
            var numPlayers = Utils.DictionarySize(this.players);

            /* Make sure we dont have more than 4 videos playing at once. */
            if (numPlayers === 4) return;

            /* Attempt to get the player by id. */
            var player = this.GetPlayerById(id);

            /* Check to see if this player already exists. */
            if (player !== undefined) {
                /* Select this player. */
                this.Select();

                /* Make sure the video is playing. */
                this.ExecuteEmbedMethod(player, 'playVideo');

                //Set the player as playing.
                player.isPlaying = true;

                return;
            }

            if (create === true) {
                /* Create a new player. */
                player = this.GetPlayerById(id) || this.Create(id);
            } else {
                /* Get the main player or create a new one if one doesn't exist. */
                player = this.GetPlayerByNumber(0) || this.Create(id);
            }

            if (player.isLoaded === true) {
                /* Load the player. */
                this.Load(player, id, isVideo);
            }

            /* Show the player. */
            $('#players').fadeIn();

            this.UpdateLayout();
        }

        private Select(): void {
            /* Get the current player. */
            var current = this.GetPlayerByNumber(0);

            /* Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {
                /* Update number of the currently selected player. */
                current.number = player.number;
                $(current.webview).attr('number', player.number);

                /* Update the number of the selected player. */
                player.number = 0;
                $(player.webview).attr('number', 0);
            }

            this.ClearSelected();
        }

        private Stop(): void {
            /* Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {

                /* We only want to make sure we have one player open at all times */
                /* so that we dont have to waste time reloading the .swf when */
                /* starting a new one. */
                if (Utils.DictionarySize(this.players) > 1) {
                    /* We have more than one player, so since we are stopping this one */
                    /* go ahead and delete the current one. */
                    this.Remove(player);
                } else {
                    /* Stop the player. */
                    this.ExecuteEmbedMethod(player, 'pauseVideo');

                    /* Player is no longer playing. */
                    player.isPlaying = false;

                    /* Show the guide. */
                    Application.ToggleGuide();
                }
            }
        }

        private Pause(): void {
            /* Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {
                /* Check to see if the player is currently playing. */
                if (player.isPlaying) {
                    /* Pause the video. */
                    this.ExecuteEmbedMethod(player, 'pauseVideo');
                } else {
                    /* Play the video. */
                    this.ExecuteEmbedMethod(player, 'playVideo');
                }

                /* Update the playing value. */
                player.isPlaying = !player.isPlaying;
            }
        }

        private Remove(player): void {
            /* Remove the player from the document. */
            $(player.webview).remove();

            /* Remove the player from the player list. */
            delete this.players[player.id];

            /* Update the player numbers. */
            this.UpdateNumbers();

            /* Clear the selector */
            this.ClearSelected();
        }

        private UpdateNumbers(): void {
            /* Sort the players by their number value. */
            /*this.players.sort((a, b) => {
                return a.number - b.number;
            });*/
            console.log('UpdateNumbers sort?');

            /* Reset their number values based on their new index. */
            for (var i in this.players) {
                var player = this.players[i];

                /* Update the number. */
                player.number = parseInt(i);

                /* Update the webview */
                $(player.webview).attr('number', i);
            }
        }

        private UpdateLayout(update = false): void {
            if (update !== true) {
                if (this.layout === PlayerLayout.Default)
                    this.layout = PlayerLayout.Equal;
                else
                    this.layout = PlayerLayout.Default;
            }

            /* Update the player class. */
            $('#players .player')
                .removeClass('default')
                .removeClass('equal')
                .addClass(PlayerLayout[this.layout]);

            /* Update the selector class. */
            $('#players .selector')
                .removeClass('default')
                .removeClass('equal')
                .addClass(PlayerLayout[this.layout]);
        }

        private UpdateSelected(direction: Direction): void {
            /* Get the index of the selected player. */
            var index = parseInt($('#players .player.selected').attr('number')) || 0;

            /* Remove the selected class from the player. */
            $('#players .player').removeClass('selected');

            /* Reset the selector. */
            $('#players .selector').removeAttr('number');

            if (direction === Direction.Up) index--;
            else if (direction === Direction.Down) index++;

            /* Index bounds checking. */
            if (index < 0) {
                index = $('#players .player').length - 1;
            } else if (index > $('#players .player').length - 1) {
                index = 0;
            }

            /* Set the selected item. */
            $('#players .player[number="' + index + '"]').addClass('selected');

            /* Set the selector */
            $('#players .selector').attr('number', index);

            $('#players .selector').attr('number', index);

            /* Update the player numbers. */
            this.UpdateNumbers();

            /* Clear the selected timer. */
            clearTimeout(this.selectionTimer);

            /* Set a new selected timer. */
            this.selectionTimer = setTimeout(this.ClearSelected, 5000);
        }

        private ClearSelected(): void {
            /* Remove the selected class from the player. */
            $('#players .player').removeClass('selected');

            /* Reset the selector. */
            $('#players .selector').removeAttr('number');
        }

        private Flashback(): void {
            /* Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player.flashback !== undefined) {
                /* Load the previous player. */
                this.Load(player, player.flashback);
            }
        }

        private Fullscreen(fullscreen: Fullscreen): void {
            /* Get the selected player or the default. */
            var player = this.GetSelectedPlayer();

            /* Execute the injected method. */
            this.ExecuteMethod(player, 'updateFullscreen', [Fullscreen[fullscreen]]);
        }

        private Load(player: PlayerData, id: string, video = false): void {
            /* Set the flashback value. */
            player.flashback = (player.id !== id) ? player.id : player.flashback;

            /* Set the player id value. */
            player.id = id;

            if (video !== true) {
                /* Load the player. */
                this.ExecuteEmbedMethod(player, 'loadStream', [id]);
            } else {
                /* Load the video. */
                this.ExecuteEmbedMethod(player, 'loadVideo', [id]);
            }

            /* Make sure the video is playing. */
            this.ExecuteEmbedMethod(player, 'playVideo');

            /*Set the player as playing. */
            player.isPlaying = true;
        }

        private Mute(mute: boolean): void {
            var player = this.GetSelectedPlayer();

            player.isMuted = mute || !player.isMuted;

            if (player.isMuted === true) {
                this.ExecuteEmbedMethod(player, 'mute');
            } else {
                this.ExecuteEmbedMethod(player, 'unmute');
            }
        }

        private ExecuteMethod(player: PlayerData, method: string, args: any[]): void {
            var data = {
                method: method,
                args: args || []
            }

            var code = "window.potato.executeMethod.call(window.potato, '" + JSON.stringify(data) + "');";

            player.webview.executeScript({ code: code });
        }

        private ExecuteEmbedMethod(player: PlayerData, method: string, arg = []) {
            var code = Utils.Format('document.getElementsByTagName("embed")[0].{0}()', method);

            if (arg !== undefined)
                code = Utils.Format('document.getElementsByTagName("embed")[0].{0}("{1}")', method, arg);

            player.webview.executeScript({ code: code });
        }
    }
}

/*
    private showChat() {
        //* Get the now loaded webview.
        webview = $('#players .player[channel="' + this.channel + '"] .chat webview');

        //* Navigate to the chat url.
        webview.attr('src', 'http://twitch.tv/{0}/chat?popout=true'.format(this.channel));

        //* Insert our custom css when the webview loads.
        webview.on('loadcommit', () => {

        //* Insert our custom css for the chat.
        webview[0].insertCSS({
            file: 'css/twitch.css'
        });

        //* Set the zoom level
        this.setZoom(zoom);

            }.bind(this));

        }

        private setZoom(zoom) {

        var webview = $('#players .player[channel="' + this.channel + '"] .chat webview')[0];

        //* Set the zoom level
        webview.insertCSS({
            code: 'body { font-size: ' + zoom + '%!important; }'
        });
    }
*/
