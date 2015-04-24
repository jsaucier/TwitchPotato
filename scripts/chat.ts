module TwitchPotato {
    export class ChatHandler {
        /** Gets or sets if the webview has been loaded. */
        private isLoaded = false;

        /** The chat src url. */
        private chatUrl = 'http://www.twitch.tv/{0}/chat?popout=true';

        /** The current chat layout. */
        private layout: ChatLayout = ChatLayout.FloatLeft;

        /** The chat webview. */
        private webview = <Webview>$('#chat webview')[0];

        /** The #chat jQuery element */
        private chat = '#chat';

        /** Gets or sets the current chat channel. */
        private channel: string;

        /** Gets or sets if the chat needs to be shown. */
        private showChat = false;

        /** Shows the chat for the selected channel. */
        private Load(channel: string): void {
            /** Set the chat as not loaded. */
            this.isLoaded = false;

            /** Set the webview source. */
            $(this.webview).attr('src', this.chatUrl.format(channel));

            /** Catch the webview load events. */
            this.webview.addEventListener('loadcommit', () => {
                if (this.isLoaded === false) {
                    /** Set the current chat channel. */
                    this.channel = channel;

                    /** The webview is now loaded. */
                    this.isLoaded = true;

                    /** Inject the chat css. */
                    this.webview.insertCSS({ file: 'css/twitch.css' });

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
                $(this.chat).fadeOut();
            else {
                if (this.showChat) $(this.chat).fadeIn();

                if (this.layout === ChatLayout.DockLeft)
                    App.Player.UpdateLayout(true, PlayersLayout.ChatLeft);
                else if (this.layout === ChatLayout.DockRight)
                    App.Player.UpdateLayout(true, PlayersLayout.ChatRight);
                else
                    App.Player.UpdateLayout(true, PlayersLayout.Full);
            }
        }

        /** Toggles the chat visibility on guide toggle. */
        Toggle(channel = this.channel): void {
            if ($(this.chat).is(':visible') === true) {
                this.showChat = false;

                /** Fade the chat out. */
                $(this.chat).fadeOut();

                /** Set the player back to full. */
                return App.Player.UpdateLayout(true, PlayersLayout.Full);
            }

            /** The chat should be shown. */
            this.showChat = true;

            if (channel !== undefined && channel !== this.channel)
                this.Load(channel);
            else
                this.UpdateLayout();
        }

        /** Updates the font size of the chat. */
        UpdateFontSize(): void {
            /** Cannot update the font-size if the webview is not loaded. */
            if (this.isLoaded === false) return;

            /** Set the font size. */
            this.webview.insertCSS({
                code: 'body { font-size: {0}%!important }'.format(App.Storage.FontSize())
            });
        }

        /** Updates the layout for the chat window. */
        UpdateLayout(direction = Direction.Down): void {
            console.log(this.showChat);
            /** Ensure the chat is actually shown. */
            if (this.showChat === false && $(this.chat).is(':visible') === false) return;

            /** Ensure the chat is loaded. */
            if (this.isLoaded === false) return;

            /** Determine the new layout. */
            if (direction === Direction.Left) this.layout--;
            else if (direction === Direction.Right) this.layout++;

            /** The size of the layouts enum. */
            var size = Object.keys(ChatLayout).length / 2;

            /** Bounds for the enum. */
            if (this.layout < 0)
                this.layout = size - 1;
            else if (this.layout > size - 1)
                this.layout = 0;

            /** Update the chat layout. */
            $(this.chat)
                .hide()
                .attr('layout', this.layout)
                .fadeIn();

            /** Update the player layout. */
            if (this.layout === ChatLayout.DockLeft)
                App.Player.UpdateLayout(true, PlayersLayout.ChatLeft);
            else if (this.layout === ChatLayout.DockRight)
                App.Player.UpdateLayout(true, PlayersLayout.ChatRight);
            else
                App.Player.UpdateLayout(true, PlayersLayout.Full);
        }
    }
}
