module TwitchPotato {

    export class Player {

        private _isLoaded = false;

        private _id: string;
        private _isVideo: boolean;
        private _number: number;
        private _flashback: string;
        private _webview: Webview;

        private _isMuted = false;
        private _quality: Quality;
        private _state = PlayerState.Playing;
        private _viewMode = ViewMode.Windowed;
        private _position: MultiPosition;

        /** Creates a new instance of player. */
        constructor(num: number, id: string, isVideo: boolean) {

            var src = 'http://www.twitch.tv/widgets/live_embed_player.swf?volume=100&auto_play=true&';
            src += (!isVideo) ? 'channel=' + id : 'videoId=' + id;

            $('#players').append($($('#player-template').html().format(num)));

            var webview = $('#players webview[number="' + num + '"].player');

            this._number = num;
            this._webview = <Webview>webview[0];

            webview.attr('src', src);

            /** Bind to the contentload event. */
            this._webview.addEventListener('contentload', () => {

                this._webview.executeScript({ file: 'js/Vendor/jquery.min.js' });
                this._webview.executeScript({ file: 'js/Player/Controller.js' });

                this._isLoaded = true;

                this.State(PlayerState.Playing);
                this.Mute(false);
                this.ViewMode(ViewMode.Fullscreen);
                this.Quality(App.Storage.Quality());
            });

            /** Bind to the console message event. */
            this._webview.addEventListener('consolemessage', (e) => ConsoleMessage(e));
        }

        /** Gets whether the player has loaded. */
        IsLoaded(): boolean { return this._isLoaded; }

        /** Gets or sets the number for the player. */
        Number(num?: number): number {

            if (num !== undefined) {
                this._number = num;
                $(this._webview).attr('number', num);
            }

            return this._number;
        }

        /** Removes the player's webview from the document. */
        Remove(): void {

            $(this._webview).remove();
        }

        /** Loads the channel or video in the player. */
        Load(id: string, isVideo = false): void {

            this._flashback = (this._id !== id) ? this._id : this._flashback;

            // if (this._flashback === 'Twitch-Potato-Init') this._flashback = undefined;

            this._id = id;
            this._isVideo = isVideo;

            this.PlayerAction(PlayerActions.Load, { id: id, isVideo: isVideo });
            this.State(PlayerState.Playing);
        }

        /** Load the previous channel or video. */
        Flashback(): void {

            if (this._flashback !== undefined)
                this.Load(this._flashback);
        }

        /** Gets or sets the state of the player. */
        State(state?: PlayerState): PlayerState {

            if (state !== undefined) {
                this._state = state;
                this.PlayerAction(PlayerActions.State, { state: state });
            }

            return this._state;

            // /** We only want to make sure we have one player open at all times */
            // /** so that we dont have to waste time reloading the .swf when */
            // /** starting a new one. */
            // if (Object.keys(this._players).length > 1) {
            //     /** We have more than one player, so since we are stopping this one */
            //     /** go ahead and delete the current one. */
            //     this.Remove(player);
            // } else {
            //     /** Sets no channels as playing. */
            //     this._isPlaying = false;
            //
            //     /** Stop the player. */
            //     this.PostMessage(player, 'PauseVideo');
            //
            //     /** Show the guide. */
            //     App.ToggleGuide(true);
            // }
        }

        /** Gets or sets the mute status of the player. */
        Mute(mute?: boolean): boolean {

            if (mute !== undefined) {
                this._isMuted = mute;
                this.PlayerAction(PlayerActions.Mute, { mute: mute });
            }

            return this._isMuted;
        }

        /** Gets or sets the view mode of the player. */
        ViewMode(viewMode?: ViewMode): ViewMode {

            if (viewMode !== undefined && this._viewMode !== viewMode) {
                this._viewMode = viewMode;
                this.PlayerAction(PlayerActions.ViewMode, { viewMode: viewMode });
            }

            return this._viewMode;
        }

        /** Gets or sets the quality of the player. */
        Quality(quality?: Quality): Quality {

            if (quality !== undefined) {
                this._quality = quality;
                this.PlayerAction(PlayerActions.Quality, { quality: quality, queue: true });
            }

            return this._quality;
        }

        /** Gets or sets the position of the player. */
        Position(position?: MultiPosition): MultiPosition {

            if (position !== undefined) {
                this._position = position;
                // TODO: Update the player position.
            }

            return this._position;
        }

        /** Reloads the player. */
        Reload(): void {

            this._isLoaded = false;
            this._webview.reload();
        }

        /** Executes an action with the given param object on the player. */
        private PlayerAction(action: PlayerActions, params = {}): void {

            if (!this._webview.contentWindow) {
                setTimeout(() => this.PlayerAction(action, params), 100);
                return;
            }

            var data = {
                action: action,
                params: params
            };

            setTimeout(() => this._webview.contentWindow.postMessage(JSON.stringify(data), '*'), 100);
        }

        // TODO: Display an image or icon in reference of the action.
    }


    //
    // /** Instance of the PlayerHandler. */
    // export class PlayerHandler {
    //
    //     /** The table of current players. */
    //     private _players: { [id: string]: Player } = {};
    //
    //     /** The current players layout. */
    //     private _playerLayout: PlayersLayout = PlayersLayout.Default;
    //
    //     /** The selection timeout id. */
    //     private _selectionTimer: number;
    //
    //     /** The quality notification timeout id. */
    //     private _qualityTimer: number;
    //
    //     /** The current player layout. */
    //     private _layout: PlayerLayout;
    //
    //     /** The previous player layout. */
    //     private _previousLayout: PlayerLayout;
    //
    //     /** Gets or sets if this is a fake load. */
    //     private _isFake = true;
    //
    //     /** Gets or sets if there is any channels playing. */
    //     private _isPlaying = false;
    //
    //     constructor() {
    //
    //         /** Create a blank player. */
    //         this.Create('Twitch-Potato-Init', false);
    //     }
    //
    //     /** Determines if there is any channels playing. */
    //     IsPlaying(): boolean { return this._isPlaying; }
    //
    //     /** Processes all input for the player. */
    //     HandleInput(input: Inputs): boolean {
    //
    //         /** Ensure the player is playing before allowing input. */
    //         if (!this._isPlaying) return false;
    //
    //         switch (input) {
    //             case Inputs.Up:
    //                 this.UpdateSelected(Direction.Up);
    //                 return true;
    //
    //             case Inputs.Down:
    //                 this.UpdateSelected(Direction.Down);
    //                 return true;
    //
    //             case Inputs.Stop:
    //                 this.Stop();
    //                 return true;
    //
    //             case Inputs.PlayPause:
    //                 this.PlayPause();
    //                 return true;
    //
    //             case Inputs.Mute:
    //                 this.Mute();
    //                 return true;
    //
    //             case Inputs.Flashback:
    //                 this.Flashback();
    //                 return true;
    //
    //             case Inputs.Select:
    //                 this.Select();
    //                 return true;
    //
    //             case Inputs.Layout:
    //                 this.ArrangePlayers();
    //                 return true;
    //
    //             case Inputs.FullscreenToggle:
    //                 this.Fullscreen(FullscreenAction.Toggle);
    //                 return true;
    //
    //             case Inputs.FullscreenEnter:
    //                 this.Fullscreen(FullscreenAction.Enter);
    //                 return true;
    //
    //             case Inputs.FullscreenExit:
    //                 this.Fullscreen(FullscreenAction.Exit);
    //                 return true;
    //
    //             case Inputs.QualityMobile:
    //                 this.SetQuality(Quality.Mobile);
    //                 return true;
    //
    //             case Inputs.QualityLow:
    //                 this.SetQuality(Quality.Low);
    //                 return true;
    //
    //             case Inputs.QualityMedium:
    //                 this.SetQuality(Quality.Medium);
    //                 return true;
    //
    //             case Inputs.QualityHigh:
    //                 this.SetQuality(Quality.High);
    //                 return true;
    //
    //             case Inputs.QualitySource:
    //                 this.SetQuality(Quality.Source);
    //                 return true;
    //
    //             case Inputs.ToggleChat:
    //                 App.Chat.Toggle(this.GetPlayerByNumber(0).channel);
    //                 return true;
    //
    //             case Inputs.Right:
    //                 App.Chat.UpdateLayout(Direction.Right);
    //                 return true;
    //
    //             case Inputs.Left:
    //                 App.Chat.UpdateLayout(Direction.Left);
    //                 return true;
    //
    //             case Inputs.Reload:
    //                 this.Reload();
    //                 return true;
    //
    //             default:
    //                 return false;
    //         }
    //     }
    //
    //     /** Creates the player for the channel or video. */
    //     private Create(channel: string, isVideo = false): Player {
    //
    //         /** Check to see if a player for this id exists. */
    //         var player = this._players[channel];
    //
    //         if (player === undefined) {
    //
    //             /** Get the number of current players */
    //             var numPlayers = Object.keys(this._players).length;
    //
    //             /** Append the new player. */
    //             $('#players').append($($('#player-template').html().format(numPlayers)));
    //
    //             /** Initialize our player object. */
    //             player = {
    //                 channel: channel,
    //                 isVideo: isVideo,
    //                 isLoaded: false,
    //                 number: numPlayers,
    //                 flashback: undefined,
    //                 webview: <Webview>$('#players webview[number="' + numPlayers + '"].player')[0]
    //             }
    //
    //             /** Catch load events. */
    //             player.webview.addEventListener('contentload', () => {
    //                 /** Inject the script files. */
    //                 player.webview.executeScript({ file: 'js/vendor/jquery.min.js' });
    //                 player.webview.executeScript({ file: 'js/inject.js' });
    //
    //                 /** Hook the console message event. */
    //                 player.webview.addEventListener('consolemessage', (e) => ConsoleMessage(e));
    //
    //                 /** Load the player. */
    //                 if (!this._isFake)
    //                     setTimeout(() => this.Load(player, player.channel, player.isVideo), 100);
    //                 else
    //                     this._isFake = false;
    //
    //                 /** Set the playe ras loaded. */
    //                 player.isLoaded = true;
    //             });
    //
    //             /** Add the player to our list. */
    //             this._players[numPlayers] = player;
    //
    //             return player;
    //         }
    //     }
    //
    //     Play(channel: string, create = false, isVideo = false): void {
    //
    //         /** Get the number of current players */
    //         var numPlayers = Object.keys(this._players).length;
    //
    //         /** Make sure we dont have more than 4 videos playing at once. */
    //         if (numPlayers === 4) return;
    //
    //         /** Attempt to get the player by channel. */
    //         var player = this._players[channel];
    //
    //         if (create === true) {
    //             /** Create a new player. */
    //             player = this._players[channel] || this.Create(channel, isVideo);
    //         } else {
    //             /** Get the main player or create a new one if one doesn't exist. */
    //             player = this.GetPlayerByNumber(0) || this.Create(channel, isVideo);
    //         }
    //
    //         /* Load the channel if the player is already loaded,
    //          * otherwise wait for the create function to callback. */
    //         if (player.isLoaded) this.Load(player, channel, isVideo);
    //
    //         /** Show the player. */
    //         this.UpdateLayout(true, PlayerLayout.Full);
    //
    //         /** Arrange the players. */
    //         this.ArrangePlayers(true);
    //
    //         /** Set as currently playing a channel. */
    //         this._isPlaying = true;
    //
    //         /** Show the player */
    //         $('#players').fadeIn();
    //
    //         /** Hide the guide */
    //         App.Guide.Toggle(false, true)
    //     }
    //
    //     private Select(): void {
    //
    //         /** Get the current player. */
    //         var current = this.GetPlayerByNumber(0);
    //
    //         /** Get the selected player. */
    //         var player = this.GetSelectedPlayer();
    //
    //         if (player !== undefined) {
    //             /** Update number of the currently selected player. */
    //             current.number = player.number;
    //             $(current.webview).attr('number', player.number);
    //             this._players[player.number] = current;
    //
    //             /** Update the number of the selected player. */
    //             player.number = 0;
    //             $(player.webview).attr('number', 0);
    //             this._players[0] = player;
    //         }
    //
    //         this.ClearSelected();
    //     }
    //
    //
    //
    //     UpdateLayout(fadeIn: boolean, layout?: PlayerLayout): void {
    //
    //         if (this._layout === layout) {
    //             if (fadeIn === true) $('#players').fadeIn();
    //             else $('#players').show();
    //             return;
    //         }
    //
    //         if (layout === PlayerLayout.Guide)
    //             this._previousLayout = this._layout;
    //
    //         if (layout === undefined)
    //             layout = this._previousLayout;
    //
    //         if (fadeIn === true)
    //             $('#players').hide().attr('layout', layout).fadeIn();
    //         else
    //             $('#players').hide().attr('layout', layout).show();
    //
    //         this._layout = layout;
    //     }
    //
    // }
}
