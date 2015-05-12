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
        private _container: JQuery;
        private _notifyTimeout: number;
        private _isPartnered: boolean;
        private _menu: PlayerMenu;

        /** Creates a new instance of player. */
        constructor(num: number, id: string, isVideo: boolean) {

            this._id = id;
            this._isVideo = isVideo;

            $('#players').append($($('#player-template').html().format(num)));

            this._number = num;
            this._container = $('#players .player[number="' + num + '"]');
            this._webview = <Webview>this._container.find('webview')[0];

            this.GetPartnerStatus(() => {
                var src = 'http://www.twitch.tv/widgets/live_embed_player.swf?volume=100&auto_play=true&';
                src += (!isVideo) ? 'channel=' + id : 'videoId=' + id;

                this._container.find('webview').attr('src', src);
            });

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

            this._menu = new PlayerMenu(this);
        }

        /** Gets the current id of the playing channel or video. */
        Id(): string { return this._id; }

        /** Gets whether the player has loaded. */
        IsLoaded(): boolean { return this._isLoaded; }

        /** Gets whether the channel is partnered. */
        IsPartnered(): boolean { return this._isPartnered; }

        /** Gets the player container. */
        Container(): JQuery { return this._container; }

        /** Gets the player menu. */
        Menu(): PlayerMenu { return this._menu; }

        /** Gets or sets the current multi layout for the player. */
        MultiLayout(layout?: MultiLayout): MultiLayout {

            if (layout !== undefined &&
                this._multiLayout !== layout) {
                this._multiLayout = layout;
                $(this._container)
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
                $(this._container).attr('number', num);
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

            /** Check to see if this is a partnered stream.  If it is not, then
             *  reload the player otherwise sometimes the nonpartner streams
             *  to do not load properly. */
            if (this._isVideo) {
                this.PlayerAction(PlayerActions.Load, { id: id, isVideo: isVideo });
                this.State(PlayerState.Playing);
            }
            else {
                this._isLoaded = false;

                this.GetPartnerStatus((isPartnered) => {
                    if (isPartnered) {
                        this.PlayerAction(PlayerActions.Load, { id: id, isVideo: isVideo });
                        this.State(PlayerState.Playing);
                    }
                    else {
                        var src = 'http://www.twitch.tv/widgets/live_embed_player.swf?volume=100&auto_play=true&';
                        src += (!isVideo) ? 'channel=' + id : 'videoId=' + id;

                        this._container.find('webview').attr('src', src);
                    }
                });
            }
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

        /** Highlight the player. */
        Highlight(num: number): void {

            if (num === this._number)
                this._container.addClass('selected');
            else
                this._container.removeClass('selected');

            this._menu.Highlight(num === this._number);
        }

        /** Reloads the player. */
        Reload(): void {

            this._isLoaded = false;
            this._webview.reload();
        }

        /** Gets to see if the channel is partnered. */
        private GetPartnerStatus(callback?: (isPartnered: boolean) => void): void {

            if (this._isVideo) {
                this._isPartnered = undefined;
                callback(undefined);
            }
            else
                App.Twitch.IsPartnered(this._id, (isPartnered) => {
                    this._isPartnered = isPartnered;
                    callback(isPartnered)
                 });
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
