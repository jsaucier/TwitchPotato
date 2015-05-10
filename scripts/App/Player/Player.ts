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
        private _multiLayout: MultiLayout;
        private _div: JQuery;
        private _notifyTimeout: number;
        private _selectTimeout: number;

        /** Creates a new instance of player. */
        constructor(num: number, id: string, isVideo: boolean) {

            var src = 'http://www.twitch.tv/widgets/live_embed_player.swf?volume=100&auto_play=true&';
            src += (!isVideo) ? 'channel=' + id : 'videoId=' + id;

            $('#players').append($($('#player-template').html().format(num)));

            this._number = num;
            this._div = $('#players .player[number="' + num + '"]');
            this._webview = <Webview>this._div.find('webview')[0];

            this._div.find('webview').attr('src', src);

            /** Bind to the contentload event. */
            this._webview.addEventListener('contentload', () => {

                this._webview.executeScript({ file: 'js/Vendor/jquery.min.js' });
                this._webview.executeScript({ file: 'js/Player/Controller.js' });

                this._isLoaded = true;

                this.ViewMode(ViewMode.Fullscreen);
                this.Mute(false);
                this.State(PlayerState.Playing);
                this.Quality(App.Storage.Quality());
            });

            /** Bind to the console message event. */
            this._webview.addEventListener('consolemessage', (e) => ConsoleMessage(e));
        }

        /** Gets the current id of the playing channel or video. */
        Id(): string { return this._id; }

        /** Gets whether the player has loaded. */
        IsLoaded(): boolean { return this._isLoaded; }

        /** Gets or sets the current multi layout for the player. */
        MultiLayout(layout?: MultiLayout): MultiLayout {

            if (layout !== undefined &&
                this._multiLayout !== layout) {
                this._multiLayout = layout;
                $(this._div)
                    .hide()
                    .attr('multi', MultiLayout[layout])
                    .fadeIn();
            }

            return this._multiLayout;
        }

        /** Gets or sets the number for the player. */
        Number(num?: number): number {

            if (num !== undefined) {
                this._number = num;
                $(this._div).attr('number', num);
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
        State(state?: PlayerState, toggle = false): PlayerState {

            if (state !== undefined) {

                if (toggle &&
                    state === PlayerState.Playing &&
                    this._state === PlayerState.Playing)
                    state = PlayerState.Stopped;

                this._state = state;

                this.PlayerAction(PlayerActions.State, { state: state, queue: true });
            }

            return this._state;
        }

        /** Gets or sets the mute status of the player. */
        Mute(mute?: boolean): boolean {

            if (mute !== undefined) {
                this._isMuted = mute;
                this.PlayerAction(PlayerActions.Mute, { mute: mute, queue: true });
            }

            return this._isMuted;
        }

        /** Gets or sets the view mode of the player. */
        ViewMode(viewMode?: ViewMode): ViewMode {

            if (viewMode !== undefined) {

                if (viewMode === ViewMode.Toggle)
                    viewMode = (this._viewMode === ViewMode.Fullscreen) ?
                    ViewMode.Windowed :
                    ViewMode.Fullscreen;

                if (this._viewMode !== viewMode) {
                    this._viewMode = viewMode;
                    this.PlayerAction(PlayerActions.ViewMode, { viewMode: viewMode });
                    this.DisplayActionNotification(ViewMode[this._viewMode]);
                }
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

        /** Selects the player. */
        Select(num: number): void {

            clearTimeout(this._selectTimeout);

            if (num === this._number) {

                this._div.addClass('selected');
                this._div.find('.selector').fadeIn();
                this._selectTimeout = setTimeout(() => this.Select(-1), 2500);
            }
            else {
                this._div.removeClass('selected');
                this._div.find('.selector').fadeOut();
            }
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

        /** Displays a notification of the player action. */
        private DisplayActionNotification(action: string): void {
            // console.log(action);
            //             // TODO: Display an image or icon in reference of the action.
            //
            //             clearTimeout(this._notifyTimeout);
            //
            //             $('.action').remove();
            //
            //             var div = $('<div/>').addClass('action');
            //
            //             div.append($('<span/>'));
            //
            //             // .text(action.toUpperCase());
            //
            //             // div.append($('<div/>')
            //             //     .addClass('text')
            //             //     .text(action.toUpperCase()));
            //
            //
            //             div.append($('<img/>').attr({
            //                 src: 'chrome-extension://' + chrome.runtime.id + '/images/' + action.toLowerCase() + '.png'
            //             }));
            //
            //             $('body').append(div);
            //
            //
            //             //this._notifyTimeout = setTimeout(() => $('.action').remove(), 2500);
        }
    }
}
