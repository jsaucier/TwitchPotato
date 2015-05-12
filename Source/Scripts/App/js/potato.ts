module TwitchPotato {
    export class Application {
        private initialized = false;


        private _user: string;
        private _name: string;
        private _token: string;


        Guide: GuideHandler;
        Authenticator: Authenticator;
        Twitch: TwitchHandler;
        Storage: StorageHandler;
        Input: InputHandler;
        Notification: NotificationHandler;
        Chat: ChatHandler;

        Players: Players;

        /** Displays an error message. */
        ShowMessage(error): void {
            $('#error .error').html(error);
            $('#error').fadeIn(() => setTimeout(() => { $('#error').fadeOut(); }, 10000));
        }

        /** Initializes the Main class. */
        Initialize(): void {

            /** Ensure we don't initialize more than once. */
            if (this.initialized === true) return;

            this.initialized = true;

            this.Storage = new StorageHandler();
            this.Input = new InputHandler();
            this.Notification = new NotificationHandler();
            this.Chat = new ChatHandler();

            this.Guide = new GuideHandler();

            this.Players = new Players();

            /** Authenticate the user. */
            this.Authenticator = new Authenticator((user, name, token) => {
                this._user = user;
                this._name = name;
                this._token = token;

                this.Twitch = new TwitchHandler(user, token);
            });

            this.Storage.Load((settings) => {
                /** Update the font size. */
                this.UpdateFontSize(FontSize.Update);
            });
        }

        /** Determines if the application loading. */
        IsLoading(): boolean {
            return $('#loading').is('visible');
        }

        /** Shows or hides the loading window. */
        Loading(showOrHide: boolean): void {
            $('#loading').toggle(showOrHide);
        }

        /** Toggles the Guide. */
        ToggleGuide(hidePlayer = false): void {

            if (App.Guide.IsShown() && this.Players.IsPlaying()) {

                /** Fade the guide out. */
                App.Guide.Toggle(false, true);

                /** Pause the guide channel preview. */
                App.Guide.Content.PausePreview();

                /** Show the chat window. */
                App.Chat.Guide(true);
            } else if (this.Players.IsPlaying()) {

                if (hidePlayer !== true)
                    /** Show the players in the guide. */
                    this.Players.PlayerMode(true, PlayerMode.Guide);
                else
                    $('#players').fadeOut();

                /** Hide the chat window. */
                App.Chat.Guide(false);

                /** Play the guide channel preview. */
                App.Guide.Content.PlayPreview();

                /** Fade the guide in. */
                App.Guide.Toggle(true, true);
            }
        }

        /** Resets the application settings. */
        Reset(): void {
            /** Show the loading screen. */
            this.Loading(true);

            /** Reset the settings. */
            //this.Twitch.ClearPartitions(undefined, () => {
            this.Storage.Load(() => App.Guide.Refresh(), true);
            //});
        }

        /** Callback triggered after a keypress event. */
        HandleInput(input: Inputs): boolean {

            // if (this.IsWebviewOpen())
            //     switch (input) {
            //         case Inputs.Close:
            //             this.CloseWebview();
            //             return true;
            //         default:
            //             return true;
            //     }
            // else
            switch (input) {
                case Inputs.Close:
                    window.close();
                    return true;
                case Inputs.ToggleGuide:
                    this.ToggleGuide();
                    return true;
                case Inputs.FontSizeIncrease:
                    this.UpdateFontSize(FontSize.Increase);
                    return true;
                case Inputs.FontSizeDecrease:
                    this.UpdateFontSize(FontSize.Decrease);
                    return true;
                case Inputs.FontSizeReset:
                    this.UpdateFontSize(FontSize.Reset);
                    return true;
                case Inputs.SaveSetting:
                    this.SaveSetting();
                    return true;
                default:
                    return false;
            }
        }

        /** Gets whether a webview is opened. */
        // private IsWebviewOpen(): boolean {
        //     return $('#webviews webview:visible').length > 0;
        // }

        /** Handles the GlobalExit keydown event. */
        // private CloseWebview(): void {
        //     if ($('#webviews #login webview:visible').length !== 0) {
        //         /** Load a blank window to stop the video playing. */
        //         $('#webviews #login webview').attr('src', 'about:blank');
        //
        //         /** Hide the webviews */
        //         $('#webviews #login').fadeOut();
        //     }
        // }

        /** Updates the font size. */
        private UpdateFontSize(type: FontSize): void {
            /** Get the font size. */
            var fontSize = this.Storage.FontSize();

            /** Update the font size. */
            if (type === FontSize.Increase)
                fontSize += 1;
            else if (type === FontSize.Decrease)
                fontSize -= 1;
            else if (type === FontSize.Reset)
                fontSize = 100;

            /** Save the font size. */
            this.Storage.FontSize(fontSize);

            /** Update the application font size. */
            $('body').css('font-size', fontSize + '%');

            App.Guide.UpdateMenu(Direction.None);

            /** Update the menu size */
            App.Guide.UpdateMenuSize();

            /** Update the mneu scroll position */
            App.Guide.UpdateMenuScroll();

            /** Update the chat font size. */
            this.Chat.UpdateFontSize();
        }

        private SaveSetting(): void {
            /** Ensure we are on an input setting. */
            if ($('#guide .item.selected[input="true"]:visible').length !== 0) {
                /** Get the focused input. */
                var input = $('input:focus');

                /** Input does not have focus. */
                if (input.length === 0) {
                    /** Get the setting type. */
                    var type = $('#guide .item.selected:visible').attr('type');

                    /** Focus the input. */
                    $('#' + type).focus();
                } else {
                    /** Trim the input value. */
                    var value = $.trim(input.val());

                    /** Ensure we have input in the control. */
                    if (value !== '') {
                        if (input.attr('id') === 'add-user')
                            console.log('AddUser');
                    }

                    input.val('');
                    input.blur();
                }
            }
        }
    }

    /** The current application instance */
    export var App: Application = new Application();


    /** Post a message containing a method and params to the preview player. */
    export var PostMessage = function(webview: Webview, method: string, params = {}): void {

        /** Make sure the contentwindow is loaded. */
        if (!webview.contentWindow) {
            setTimeout(() => PostMessage(webview, method, params), 100);
            return;
        }

        /** Data to be posted. */
        var data = {
            method: method,
            params: params
        };

        /** Post the data to the client application. */
        setTimeout(() =>
            webview.contentWindow.postMessage(
                JSON.stringify(data), '*'), 100);
    };

    export enum PlayerMode {
        Full,
        Guide,
        ChatLeft,
        ChatRight
    }

    export enum MultiLayout {
        Default,
        Equal
    }

    export enum ViewMode {
        Fullscreen,
        Windowed,
        Toggle
    }

    export enum MultiPosition {
        Top,
        Left,
        Right,
        Bottom,
        Middle,
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight,
    }

    export enum PlayerActions {
        ViewMode,
        Load,
        State,
        Mute,
        Quality,
        Preview
    }

    export enum PlayerState {
        Playing,
        Stopped
    }








    export enum MenuItemType {
        Channel,
        Game,
        Video,
        Setting
    }

    export enum Quality {
        Mobile,
        Low,
        Medium,
        High,
        Source
    }

    export enum FontSize {
        Update,
        Increase,
        Decrease,
        Reset
    }

    export enum Template {
        NotifyItem,
        ContextMenu,
        FollowMenu,
        ChannelItem,
        GameItem,
        VideoItem,
        ChannelInfo,
        GameInfo,
        VideoInfo,
        PlayerWebview,
        TwitchWebview,
        ChatWebview
    }

    export enum ChatLayout {
        FloatLeft,
        FloatRight,
        DockLeft,
        DockRight,
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight,
    }


    export enum UpdateType {
        All,
        Channels,
        Games,
        Game,
        Videos,
        Refresh
    }

    export enum InputType {
        Global,
        Guide,
        Player
    }

    export enum Direction {
        None,
        Up,
        Down,
        Left,
        Right,
        JumpUp,
        JumpDown
    }

    export enum MenuType {
        Channels,
        Games,
        Game,
        Videos,
        Settings
    }

    export enum FollowType {
        Channel,
        Game
    }
}

/** Initialize the Application only after the page has loaded. */
$(() => {
    TwitchPotato.App.Initialize();
});
