module TwitchPotato {
    export class ChatHandler {
        /** Gets or sets if the webview has been loaded. */
        private _isLoaded = false;

        /** The chat src url. */
        private _chatUrl = 'http://www.twitch.tv/{0}/chat?popout=true';

        /** The current chat layout. */
        private _layout: ChatLayout = ChatLayout.FloatLeft;

        /** The chat webview. */
        private _webview = <Webview>$('#chat webview')[0];

        /** The #chat jQuery element */
        private _chat = '#chat';

        /** Gets or sets the current chat channel. */
        private _channel: string;

        /** Gets or sets if the chat needs to be shown. */
        private _showChat = false;

        /** Shows the chat for the selected channel. */
        private Load(channel: string): void {

            /** Set the chat as not loaded. */
            this._isLoaded = false;

            /** Set the webview source. */
            $(this._webview).attr('src', this._chatUrl.format(channel));

            /** Catch the webview load events. */
            this._webview.addEventListener('loadcommit', () => {
                if (this._isLoaded === false) {
                    /** Set the current chat channel. */
                    this._channel = channel;

                    /** The webview is now loaded. */
                    this._isLoaded = true;

                    /** Inject the chat css. */
                    this._webview.insertCSS({ file: 'css/twitch.css' });

                    /** Update the font size. */
                    this.UpdateFontSize();

                    /** Update the chat layout. */
                    this.UpdateLayout();
                }
            });
        }

        /** Toggle the chat when the guide visibility is changed. */
        Guide(showOrHide: boolean): void {

            if (showOrHide === false)
                $(this._chat).fadeOut();
            else {
                if (this._showChat) $(this._chat).fadeIn();

                if (this._layout === ChatLayout.DockLeft)
                    App.Players.PlayerMode(true, PlayerLayout.ChatLeft);
                else if (this._layout === ChatLayout.DockRight)
                    App.Players.PlayerMode(true, PlayerLayout.ChatRight);
                else
                    App.Players.PlayerMode(true, PlayerLayout.Full);
            }
        }

        /** Toggles the chat visibility on guide toggle. */
        Toggle(channel = this._channel): void {

            if ($(this._chat).is(':visible') === true) {
                this._showChat = false;

                /** Fade the chat out. */
                $(this._chat).fadeOut();

                /** Set the player back to full. */
                return App.Players.PlayerMode(true, PlayerLayout.Full);
            }

            /** The chat should be shown. */
            this._showChat = true;

            if (channel !== undefined && channel !== this._channel)
                this.Load(channel);
            else
                this.UpdateLayout();
        }

        /** Updates the font size of the chat. */
        UpdateFontSize(): void {

            /** Cannot update the font-size if the webview is not loaded. */
            if (this._isLoaded === false) return;

            /** Set the font size. */
            this._webview.insertCSS({
                code: 'body { font-size: {0}%!important }'.format(App.Storage.FontSize())
            });
        }

        /** Updates the layout for the chat window. */
        UpdateLayout(direction = Direction.Down): void {

            /** Ensure the chat is actually shown. */
            if (this._showChat === false && $(this._chat).is(':visible') === false) return;

            /** Ensure the chat is loaded. */
            if (this._isLoaded === false) return;

            /** Determine the new layout. */
            if (direction === Direction.Left) this._layout--;
            else if (direction === Direction.Right) this._layout++;

            /** The size of the layouts enum. */
            var size = Object.keys(ChatLayout).length / 2;

            /** Bounds for the enum. */
            if (this._layout < 0)
                this._layout = size - 1;
            else if (this._layout > size - 1)
                this._layout = 0;

            /** Update the chat layout. */
            $(this._chat)
                .hide()
                .attr('layout', this._layout)
                .fadeIn();

            /** Update the player layout. */
            if (this._layout === ChatLayout.DockLeft)
                App.Players.PlayerMode(true, PlayerLayout.ChatLeft);
            else if (this._layout === ChatLayout.DockRight)
                App.Players.PlayerMode(true, PlayerLayout.ChatRight);
            else
                App.Players.PlayerMode(true, PlayerLayout.Full);
        }
    }
}
