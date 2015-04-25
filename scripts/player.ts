module TwitchPotato {

    /** The player interface. */
    export interface Player {
        channel: string;
        isVideo: boolean;
        isLoaded: boolean;
        number: number;
        flashback?: string;
        webview: Webview;
    }

    /** Enumeration of the players layout. */
    export enum PlayersLayout {
        Default,
        Equal
    }

    /** Enumeration of the player layout. */
    export enum PlayerLayout {
        Full,
        Guide,
        ChatLeft,
        ChatRight
    }

    /** Instance of the PlayerHandler. */
    export class PlayerHandler {

        /** The table of current players. */
        private _players: { [id: string]: Player } = {};

        /** The current players layout. */
        private _playerLayout: PlayersLayout = PlayersLayout.Default;

        /** The selection timeout id. */
        private _selectionTimer: number;

        /** The quality notification timeout id. */
        private _qualityTimer: number;

        /** The current player layout. */
        private _layout: PlayerLayout;

        /** The previous player layout. */
        private _previousLayout: PlayerLayout;

        /** Gets or sets if this is a fake load. */
        private _isFake = true;

        /** Gets or sets if there is any channels playing. */
        private _isPlaying = false;

        constructor() {

            /** Create a blank player. */
            this.Create('Twitch-Potato-Init', false);
        }

        /** Determines if there is any channels playing. */
        IsPlaying(): boolean { return this._isPlaying; }

        /** Processes all input for the player. */
        HandleInput(input: Inputs): boolean {

            /** Ensure the player is playing before allowing input. */
            if (!this._isPlaying) return false;

            switch (input) {
                case Inputs.Up:
                    this.UpdateSelected(Direction.Up);
                    return true;

                case Inputs.Down:
                    this.UpdateSelected(Direction.Down);
                    return true;

                case Inputs.Stop:
                    this.Stop();
                    return true;

                case Inputs.PlayPause:
                    this.PlayPause();
                    return true;

                case Inputs.Mute:
                    this.Mute();
                    return true;

                case Inputs.Flashback:
                    this.Flashback();
                    return true;

                case Inputs.Select:
                    this.Select();
                    return true;

                case Inputs.Layout:
                    this.ArrangePlayers();
                    return true;

                case Inputs.FullscreenToggle:
                    this.Fullscreen(FullscreenAction.Toggle);
                    return true;

                case Inputs.FullscreenEnter:
                    this.Fullscreen(FullscreenAction.Enter);
                    return true;

                case Inputs.FullscreenExit:
                    this.Fullscreen(FullscreenAction.Exit);
                    return true;

                case Inputs.QualityMobile:
                    this.SetQuality(Quality.Mobile);
                    return true;

                case Inputs.QualityLow:
                    this.SetQuality(Quality.Low);
                    return true;

                case Inputs.QualityMedium:
                    this.SetQuality(Quality.Medium);
                    return true;

                case Inputs.QualityHigh:
                    this.SetQuality(Quality.High);
                    return true;

                case Inputs.QualitySource:
                    this.SetQuality(Quality.Source);
                    return true;

                case Inputs.ToggleChat:
                    App.Chat.Toggle(this.GetPlayerByNumber(0).channel);
                    return true;

                case Inputs.Right:
                    App.Chat.UpdateLayout(Direction.Right);
                    return true;

                case Inputs.Left:
                    App.Chat.UpdateLayout(Direction.Left);
                    return true;

                case Inputs.Reload:
                    this.Reload();
                    return true;

                default:
                    return false;
            }
        }

        /** Returns the player by number. */
        GetPlayerByNumber(number: number): Player {

            for (var i in this._players) {

                var player = this._players[i];

                if (player.number === number) return player;
            }

            return undefined;
        }

        /** Returns the selected or current player. */
        GetSelectedPlayer(): Player {

            var number = parseInt($('#players .player.selected').attr('number')) || 0;

            return this.GetPlayerByNumber(number);
        }

        /** Creates the player for the channel or video. */
        private Create(channel: string, isVideo = false): Player {

            /** Check to see if a player for this id exists. */
            var player = this._players[channel];

            if (player === undefined) {

                /** Get the number of current players */
                var numPlayers = Object.keys(this._players).length;

                /** Append the new player. */
                $('#players').append($($('#player-template').html().format(numPlayers)));

                /** Initialize our player object. */
                player = {
                    channel: channel,
                    isVideo: isVideo,
                    isLoaded: false,
                    number: numPlayers,
                    flashback: undefined,
                    webview: <Webview>$('#players webview[number="' + numPlayers + '"].player')[0]
                }

                /** Catch load events. */
                player.webview.addEventListener('contentload', () => {
                    /** Inject the script files. */
                    player.webview.executeScript({ file: 'js/vendor/jquery.min.js' });
                    player.webview.executeScript({ file: 'js/inject.js' });

                    /** Hook the console message event. */
                    player.webview.addEventListener('consolemessage', (e) => ConsoleMessage(e));

                    /** Load the player. */
                    if (!this._isFake)
                        setTimeout(() => this.Load(player, player.channel, player.isVideo), 100);
                    else
                        this._isFake = false;

                    /** Set the playe ras loaded. */
                    player.isLoaded = true;
                });

                /** Add the player to our list. */
                this._players[numPlayers] = player;

                return player;
            }
        }

        Play(channel: string, create = false, isVideo = false): void {

            /** Get the number of current players */
            var numPlayers = Object.keys(this._players).length;

            /** Make sure we dont have more than 4 videos playing at once. */
            if (numPlayers === 4) return;

            /** Attempt to get the player by channel. */
            var player = this._players[channel];

            if (create === true) {
                /** Create a new player. */
                player = this._players[channel] || this.Create(channel, isVideo);
            } else {
                /** Get the main player or create a new one if one doesn't exist. */
                player = this.GetPlayerByNumber(0) || this.Create(channel, isVideo);
            }

            /* Load the channel if the player is already loaded,
             * otherwise wait for the create function to callback. */
            if (player.isLoaded) this.Load(player, channel, isVideo);

            /** Show the player. */
            this.UpdateLayout(true, PlayerLayout.Full);

            /** Arrange the players. */
            this.ArrangePlayers(true);

            /** Set as currently playing a channel. */
            this._isPlaying = true;

            /** Show the player */
            $('#players').fadeIn();

            /** Hide the guide */
            Guide.Toggle(false, true)
        }

        private Select(): void {

            /** Get the current player. */
            var current = this.GetPlayerByNumber(0);

            /** Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {
                /** Update number of the currently selected player. */
                current.number = player.number;
                $(current.webview).attr('number', player.number);
                this._players[player.number] = current;

                /** Update the number of the selected player. */
                player.number = 0;
                $(player.webview).attr('number', 0);
                this._players[0] = player;
            }

            this.ClearSelected();
        }

        private Stop(): void {

            /** Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {
                /** We only want to make sure we have one player open at all times */
                /** so that we dont have to waste time reloading the .swf when */
                /** starting a new one. */
                if (Object.keys(this._players).length > 1) {
                    /** We have more than one player, so since we are stopping this one */
                    /** go ahead and delete the current one. */
                    this.Remove(player);
                } else {
                    /** Sets no channels as playing. */
                    this._isPlaying = false;

                    /** Stop the player. */
                    this.PostMessage(player, 'PauseVideo');

                    /** Show the guide. */
                    App.ToggleGuide(true);
                }
            }
        }

        private PlayPause(): void {

            /** Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player !== undefined) {
                /** Check to see if the player is currently playing. */
                this.PostMessage(player, 'PlayPause');
            }
        }

        private Remove(player: Player): void {

            /** Get the number of the removed player. */
            var num = player.number;

            /** Remove the player from the document. */
            $(player.webview).remove();

            /** Remove the player from the player list. */
            delete this._players[num];

            /** Update the player numbers. */
            this.UpdateNumbers(num);

            /** Clear the selector */
            this.ClearSelected();
        }

        private UpdateNumbers(removed: number): void {

            /** Update the number of any player after the removed. */
            for (var i in this._players) {
                var player = this._players[i];

                if (player.number > removed) {
                    /** Update the number. */
                    player.number -= 1;

                    /** Update the webview */
                    $(player.webview).attr('number', player.number);

                    /** Copy the player to the previous index. */
                    this._players[player.number] = player;

                    /** Delete the copied player. */
                    delete this._players[player.number + 1];
                }
            }
        }

        private ArrangePlayers(update = false): void {

            if (update !== true) {
                /** Increase the layout. */
                this._playerLayout++;
            }

            /** The size of the layouts enum. */
            var size = Object.keys(PlayersLayout).length / 2;

            /** Bounds for the enum. */
            if (this._playerLayout < 0) this._playerLayout = size - 1;
            else if (this._playerLayout > size - 1) this._playerLayout = 0;

            /** Update the players and selector layouts. */
            $('#players .player, #players .selector')
                .hide()
                .attr('layout', this._playerLayout)
                .fadeIn();
        }

        UpdateLayout(fadeIn: boolean, layout?: PlayerLayout): void {

            if (this._layout === layout) {
                if (fadeIn === true) $('#players').fadeIn();
                else $('#players').show();
                return;
            }

            if (layout === PlayerLayout.Guide)
                this._previousLayout = this._layout;

            if (layout === undefined)
                layout = this._previousLayout;

            if (fadeIn === true)
                $('#players').hide().attr('layout', layout).fadeIn();
            else
                $('#players').hide().attr('layout', layout).show();

            this._layout = layout;
        }

        private UpdateSelected(direction: Direction): void {

            /** Get the index of the selected player. */
            var index = parseInt($('#players .player.selected').attr('number')) || 0;

            /** Remove the selected class from the player. */
            $('#players .player').removeClass('selected');

            /** Reset the selector. */
            $('#players .selector').removeAttr('number');

            if (direction === Direction.Up) index--;
            else if (direction === Direction.Down) index++;

            /** Index bounds checking. */
            if (index < 0) {
                index = $('#players .player').length - 1;
            } else if (index > $('#players .player').length - 1) {
                index = 0;
            }

            /** Set the selected item. */
            $('#players .player[number="' + index + '"]').addClass('selected');

            /** Set the selector */
            $('#players .selector').attr('number', index);

            /** Clear the selected timer. */
            clearTimeout(this._selectionTimer);

            /** Set a new selected timer. */
            this._selectionTimer = setTimeout(this.ClearSelected, 5000);
        }

        private ClearSelected(): void {

            /** Remove the selected class from the player. */
            $('#players .player').removeClass('selected');

            /** Reset the selector. */
            $('#players .selector').removeAttr('number');
        }

        private Flashback(): void {

            /** Get the selected player. */
            var player = this.GetSelectedPlayer();

            if (player.flashback !== undefined) {
                /** Load the previous player. */
                this.Load(player, player.flashback);
            }
        }

        private Fullscreen(action = FullscreenAction.Refresh): void {

            /** Get the selected player or the default. */
            var player = this.GetSelectedPlayer();

            /** Execute the injected method. */
            this.PostMessage(player, 'Fullscreen', { action: action });
        }

        private SetQuality(quality: Quality): void {

            /** Get the selected Player or the default. */
            var player = this.GetSelectedPlayer();

            /** Execute the injected method. */
            this.PostMessage(player, 'Quality', { quality: Quality[quality] });

            /** Show the quality notification. */
            $('#players .quality').html(Quality[quality] + ' Quality').fadeIn(() => {
                clearTimeout(this._qualityTimer);
                this._qualityTimer = setTimeout(() => $('#players .quality').fadeOut(), 2000)
            });
        }

        /** Loads the channel or video in the player. */
        private Load(player: Player, channel: string, isVideo = false, isFake = false): void {

            /** Set the flashback value. */
            player.flashback = (player.channel !== channel) ? player.channel : player.flashback;

            if (player.flashback === 'Twitch-Potato-Init') player.flashback = undefined;

            /** Set the player id value. */
            player.channel = channel;

            /** Set the isVideo value. */
            player.isVideo = isVideo;

            /** Load the video. */
            this.PostMessage(player, 'LoadVideo', {
                channel: player.channel,
                isVideo: player.isVideo
            });
        }

        /** Reloads the player object. */
        private Reload(): void {

            /** Get the selected player. */
            var player = this.GetSelectedPlayer();

            /** Player is no longer loaded. */
            player.isLoaded = false;

            /** Reload the webview. */
            player.webview.reload();
        }

        /** Toggles mute for the selected player. */
        private Mute(): void {

            var player = this.GetSelectedPlayer();
            this.PostMessage(player, 'Mute');
        }

        /** Executes a method with the given param object on the player. */
        private PostMessage(player: Player, method: string, params = {}): void {

            /** Make sure the contentwindow is loaded. */
            if (player.webview.contentWindow === undefined) {
                setTimeout(() => this.PostMessage(player, method, params), 100);
                return;
            }

            /** Data to be posted. */
            var data = {
                method: method,
                params: params
            };

            /** Post the data to the client application. */
            setTimeout(() => player.webview.contentWindow.postMessage(JSON.stringify(data), '*'), 100);
        }
    }
}

/** Some of these are documented, some aren't. */

/* Twitch player methods: */
/* playVideo, pauseVideo, mute, unmute, fullscreen, loadStream, loadVideo, */
/* setQuality, videoSeek, setOauthToken, onlineStatus, isPaused, setVideoTime, */
/* adFeedbackDone, setTrackingData, showChromecast, setChromecastConnected, */
/* togglePlayPause */

/* Twitch player events: */
/* chromecastMediaSet, chromecastSessionRequested, chromecastVolumeUpdated, */
/* pauseChromecastSession, offline, online, adCompanionRendered, loginRequest, */
/* mouseScroll, playerInit, popout, tosViolation, viewerCount, streamLoaded, */
/* videoLoaded, seekFailed, videoLoading, videoPlaying, adFeedbackShow */
