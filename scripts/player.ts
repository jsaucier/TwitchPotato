// Some of these are documented, some aren't.
//
// Twitch player methods:
// playVideo, pauseVideo, mute, unmute, fullscreen, loadStream, loadVideo,
// setQuality, videoSeek, setOauthToken, onlineStatus, isPaused, setVideoTime,
// adFeedbackDone, setTrackingData, showChromecast, setChromecastConnected,
// togglePlayPause
//
// Twitch player events:
// chromecastMediaSet, chromecastSessionRequested, chromecastVolumeUpdated,
// pauseChromecastSession, offline, online, adCompanionRendered, loginRequest,
// mouseScroll, playerInit, popout, tosViolation, viewerCount, streamLoaded,
// videoLoaded, seekFailed, videoLoading, videoPlaying, adFeedbackShow

module TwitchPotato {
    "use strict";

    enum PlayerLayout {
        Default,
        Equal
    }

    enum FullscreenAction {
        Toggle,
        Enter,
        Exit,
        Refresh
    }

    enum Quality {
        Mobile,
        Low,
        Medium,
        High,
        Source
    }

    export class Player {
        private players: Dictionary<PlayerData> = {};
        private layout: PlayerLayout = PlayerLayout.Default;
        private selectionTimer: number;
        private qualityTimer: number;

        constructor() {
            /* Create a blank player. */
            this.Create('Twitch-Potato-Init', false, true);
        }

        /*
         * Callback for player input events.
         */
        public OnInput(input: Input): void {
            switch (input.input) {

                case Inputs.Player_SelectPrevious:
                    this.UpdateSelected(Direction.Up);
                    break;

                case Inputs.Player_SelectNext:
                    this.UpdateSelected(Direction.Down);
                    break;

                case Inputs.Player_Stop:
                    this.Stop();
                    break;

                case Inputs.Player_PlayPause:
                    this.PlayPause();
                    break;

                case Inputs.Player_Mute:
                    this.Mute();
                    break;

                case Inputs.Player_Flashback:
                    this.Flashback();
                    break;

                case Inputs.Player_Select:
                    this.Select();
                    break;

                case Inputs.Player_Layout:
                    this.UpdateLayout();
                    break;

                case Inputs.Player_FullscreenToggle:
                    this.Fullscreen(FullscreenAction.Toggle);
                    break;

                case Inputs.Player_FullscreenEnter:
                    this.Fullscreen(FullscreenAction.Enter);
                    break;

                case Inputs.Player_FullscreenExit:
                    this.Fullscreen(FullscreenAction.Exit);
                    break;

                case Inputs.Player_QualityMobile:
                    this.SetQuality(Quality.Mobile);
                    break;

                case Inputs.Player_QualityLow:
                    this.SetQuality(Quality.Low);
                    break;

                case Inputs.Player_QualityMedium:
                    this.SetQuality(Quality.Medium);
                    break;

                case Inputs.Player_QualityHigh:
                    this.SetQuality(Quality.High);
                    break;

                case Inputs.Player_QualitySource:
                    this.SetQuality(Quality.Source);
                    break;

                default:
                    break;
            }
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

        private Create(channel: string, isVideo = false, isFake = false): PlayerData {
            /* Check to see if a player for this id exists. */
            var player = this.players[channel];

            if (player === undefined) {

                /* Get the number of current players */
                var numPlayers = Utils.DictionarySize(this.players);

                /* Append the new player. */
                $('#players').append($(Utils.Format($('#player-template').html(), numPlayers)));

                /* Initialize our player object. */
                player = {
                    channel: channel,
                    isLoaded: false,
                    number: numPlayers,
                    flashback: undefined,
                    webview: <Webview>$('#players webview[number="' + numPlayers + '"]')[0]
                }

                /* Catch load events. */
                player.webview.addEventListener('loadcommit', () => {
                    /* Inject the script files. */
                    player.webview.executeScript({ file: 'js/jquery-2.1.1.min.js' });
                    player.webview.executeScript({ file: 'js/inject.js' });

                    /* Hook the console message event. */
                    player.webview.addEventListener('consolemessage', (e) => Utils.ConsoleMessage(e));

                    /* Load the player. */
                    setTimeout(() => this.Load(player, channel, isVideo, isFake), 100);
                });

                /* Add the player to our list. */
                this.players[numPlayers] = player;

                return player;
            }
        }

        public Play(channel: string, create = false, isVideo = false): void {
            /* Register the player inputs. */
            Application.Input.RegisterInputs(InputType.Player);

            /* Get the number of current players */
            var numPlayers = Utils.DictionarySize(this.players);

            /* Make sure we dont have more than 4 videos playing at once. */
            if (numPlayers === 4) return;

            /* Attempt to get the player by channel. */
            var player = this.players[channel];

            if (create === true) {
                /* Create a new player. */
                player = this.players[channel] || this.Create(channel, isVideo);
            } else {
                /* Get the main player or create a new one if one doesn't exist. */
                player = this.GetPlayerByNumber(0) || this.Create(channel, isVideo);
            }

            /* Load the channel if the player is already loaded,
             * otherwise wait for the create function to callback. */
            if (player.isLoaded === true) this.Load(player, channel, isVideo);

            /* Show the player. */
            $('#players').removeClass('guide').addClass('full').fadeIn();

            this.UpdateLayout(true);
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
                this.players[player.number] = current;

                /* Update the number of the selected player. */
                player.number = 0;
                $(player.webview).attr('number', 0);
                this.players[0] = player;
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
                    this.PostMessage(player, 'PauseVideo');

                    /* Show the guide. */
                    Application.ToggleGuide(true);
                }
            }
        }

        private PlayPause(): void {
            /* Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {
                /* Check to see if the player is currently playing. */
                this.PostMessage(player, 'PlayPause');
            }
        }

        private Remove(player: PlayerData): void {
            /* Get the number of the removed player. */
            var num = player.number;

            /* Remove the player from the document. */
            $(player.webview).remove();

            /* Remove the player from the player list. */
            delete this.players[num];

            /* Update the player numbers. */
            this.UpdateNumbers(num);

            /* Clear the selector */
            this.ClearSelected();
        }

        private UpdateNumbers(removed: number): void {
            /* Update the number of any player after the removed. */
            for (var i in this.players) {
                var player = this.players[i];

                if (player.number > removed) {
                    /* Update the number. */
                    player.number -= 1;

                    /* Update the webview */
                    $(player.webview).attr('number', player.number);

                    /* Copy the player to the previous index. */
                    this.players[player.number] = player;

                    /* Delete the copied player. */
                    delete this.players[player.number + 1];
                }
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
                .hide()
                .removeClass('default')
                .removeClass('equal')
                .addClass(PlayerLayout[this.layout].toLowerCase())
                .show();

            /* Update the selector class. */
            $('#players .selector')
                .hide()
                .removeClass('default')
                .removeClass('equal')
                .addClass(PlayerLayout[this.layout].toLowerCase())
                .show();
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

        private Fullscreen(action = FullscreenAction.Refresh): void {
            /* Get the selected player or the default. */
            var player = this.GetSelectedPlayer();

            /* Execute the injected method. */
            this.PostMessage(player, 'Fullscreen', { action: action });
        }

        private SetQuality(quality: Quality): void {
            /* Get the selected Player or the default. */
            var player = this.GetSelectedPlayer();

            /* Execute the injected method. */
            this.PostMessage(player, 'Quality', { quality: Quality[quality] });

            /* Show the quality notification. */
            $('#players .quality').html(Quality[quality] + ' Quality').fadeIn(() => {
                clearTimeout(this.qualityTimer);
                this.qualityTimer = setTimeout(() => $('#players .quality').fadeOut(), 2000)
            });
        }

        private Load(player: PlayerData, channel: string, isVideo = false, isFake = false): void {
            /* Set the flashback value. */
            player.flashback = (player.channel !== channel) ? player.channel : player.flashback;

            /* Set the player id value. */
            player.channel = channel;

            if (isFake !== true)
                this.PostMessage(player, 'LoadVideo', { channel: channel, isVideo: isVideo });

            /* Set the playe ras loaded. */
            player.isLoaded = true;
        }

        private Mute(mute?: boolean): void {
            var player = this.GetSelectedPlayer();
            this.PostMessage(player, 'Mute');
        }

        private PostMessage(player: PlayerData, method: string, params = {}): void {
            /* Make sure the contentwindow is loaded. */
            if (player.webview.contentWindow === undefined) {
                setTimeout(() => this.PostMessage(player, method, params), 100);
                return;
            }

            /* Data to be posted. */
            var data = {
                method: method,
                params: params
            };

            /* Post the data to the client application. */
            setTimeout(() => player.webview.contentWindow.postMessage(JSON.stringify(data), '*'), 100);
        }
    }
}


// private showChat() {
//     /* Get the now loaded webview. */
//     webview = $('#players .player[channel="' + this.channel + '"] .chat webview');
//
//     /* Navigate to the chat url. */
//     webview.attr('src', 'http://twitch.tv/{0}/chat?popout=true'.format(this.channel));
//
//     /* Insert our custom css when the webview loads. */
//     webview.on('loadcommit', () => {
//
//         /* Insert our custom css for the chat. */
//         webview[0].insertCSS({
//             file: 'css/twitch.css'
//         });
//
//         /* Set the zoom level */
//         this.setZoom(zoom);
//
//             }.bind(this));
//
//         }
//
//         private setZoom(zoom) {
//
//     var webview = $('#players .player[channel="' + this.channel + '"] .chat webview')[0];
//
//     /* Set the zoom level */
//     webview.insertCSS({
//         code: 'body { font-size: ' + zoom + '%!important; }'
//     });
// }
