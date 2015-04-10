module TwitchPotato {
    "use strict";

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
        private chat = $('#chat');

        /** Gets or sets if the chat is currently shown. */
        private isShown = false;

        constructor() { }

        /**
         * Gets whether the chat is shown.
         */
        IsShown(): boolean {
            return this.isShown;
        }

        /**
         * Closes the chat window.
         */
        Close() {
            /** Fades the chat window out. */
            this.chat.fadeOut();
            /** Set the chat as no longer shown. */
            this.isShown = false;
        }

        /**
         * Shows the chat window for the specified channel.
         */
        Show(channel: string): void {
            /* Toggle visibility. */
            if (this.isShown === true) {
                /** Update the player layout so that it is not in dock layout.  */
                Application.Player.UpdateLayout(false, PlayersLayout.Full);
                /** Close the chat window. */
                return this.Close();
            }

            /* Ensure the channel is not already loaded. */
            if (channel !== undefined &&
                channel !== this.chat.attr('channel')) {
                /* Set the webview source. */
                $(this.webview).attr('src', this.chatUrl.format(channel));

                /* Catch the webview load events. */
                this.webview.addEventListener('loadcommit', () => {
                    /* The webview is now loaded. */
                    this.isLoaded = true;

                    /* Inject the chat css. */
                    this.webview.insertCSS({ file: 'css/twitch.css' });

                    /* Update the zoom. */
                    this.UpdateZoom();
                });

                /* Set the channel attribute. */
                this.chat.attr('channel', channel);
            }

            /* Update the chat layout. */
            this.UpdateLayout();
        }

        /**
         * Toggles the chat visibility on guide toggle.
         */
        ToggleChat(show, isGuideToggle): void {
            if (show === true &&
                this.isShown === true)
                this.UpdateLayout(undefined, isGuideToggle);
            else
                this.chat.hide();
        }

        /**
         * Updates the font-size of the chat based on the zoom level.
         */
        UpdateZoom(): void {
            /* Cannot update the font-size if the webview is not loaded. */
            if (this.isLoaded === false) return;

            /* Set the zoom. */
            this.webview.insertCSS({
                code: 'body { font-size: {0}%!important }'.format(Application.Storage.settings.zoom)
            });
        }

        /**
         * Updates the layout for the chat window.
         */
        UpdateLayout(direction = Direction.Down, isGuideToggle = false): void {
            /* Ensure the chat is actually shown. */
            if (this.isShown !== true) return;

            /* Determine the new layout. */
            if (direction === Direction.Left) this.layout--;
            else if (direction === Direction.Right) this.layout++;

            /** The size of the layouts enum. */
            var size = Object.keys(ChatLayout).length / 2;

            /* Bounds for the enum. */
            if (this.layout < 0)
                this.layout = size - 1;
            else if (this.layout > size - 1)
                this.layout = 0;

            /* Update the chat layout. */
            this.chat
                .hide()
                .attr('layout', this.layout)
                .fadeIn();

            if (isGuideToggle !== true) {
                if (this.layout === ChatLayout.DockLeft)
                    Application.Player.UpdateLayout(true, PlayersLayout.ChatLeft);
                else if (this.layout === ChatLayout.DockRight)
                    Application.Player.UpdateLayout(true, PlayersLayout.ChatRight);
                else
                    Application.Player.UpdateLayout(true, PlayersLayout.Full);
            }

            this.isShown = true;
        }
    }
}
