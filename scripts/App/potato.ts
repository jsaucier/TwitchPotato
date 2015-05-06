module TwitchPotato {
    export class Application {
        private initialized = false;


        private _user: string;
        private _name: string;
        private _token: string;

        Storage: StorageHandler;
        Input: InputHandler;
        //Guide: GuideHandler;s
        Player: PlayerHandler;
        Twitch: TwitchHandler;
        Notification: NotificationHandler;
        Chat: ChatHandler;

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
            //this.Guide = new GuideHandler();
            this.Player = new PlayerHandler();
            //this.Twitch = new TwitchHandler();
            this.Notification = new NotificationHandler();
            this.Chat = new ChatHandler();



            Guide = new GuideHandler();

            /** Authenticate the user. */
            Authenticator = new AuthenticatorHandler((user, name, token) => {
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

            /** Ensure there is a stream playing. */
            if (!this.Player.IsPlaying()) return;

            if (Guide.IsShown() === true) {

                /** Fade the guide out. */
                Guide.Toggle(false, true);

                /** Pause the guide channel preview. */
                Guide.Content.PausePreview();

                /** Show the chat window. */
                App.Chat.Guide(true);
            } else {

                if (hidePlayer !== true)
                    /** Show the players in the guide. */
                    this.Player.UpdateLayout(true, PlayerLayout.Guide);
                else
                    $('#players').fadeOut();

                /** Show the chat window. */
                App.Chat.Guide(false);

                /** Play the guide channel preview. */
                Guide.Content.PlayPreview();

                /** Fade the guide in. */
                Guide.Toggle(true, true);
            }
        }

        /** Resets the application settings. */
        Reset(): void {
            /** Show the loading screen. */
            this.Loading(true);

            /** Reset the settings. */
            //this.Twitch.ClearPartitions(undefined, () => {
            this.Storage.Load(() => Guide.Refresh(), true);
            //});
        }

        /** Callback triggered after a keypress event. */
        HandleInput(input: Inputs): boolean {

            if (this.IsWebviewOpen())
                switch (input) {
                    case Inputs.Close:
                        this.CloseWebview();
                        return true;
                    default:
                        return true;
                }
            else
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
        private IsWebviewOpen(): boolean {
            return $('#webviews webview:visible').length > 0;
        }

        /** Handles the GlobalExit keydown event. */
        private CloseWebview(): void {
            if ($('#webviews #login webview:visible').length !== 0) {
                /** Load a blank window to stop the video playing. */
                $('#webviews #login webview').attr('src', 'about:blank');

                /** Hide the webviews */
                $('#webviews #login').fadeOut();
            }
        }

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

            Guide.UpdateMenu(Direction.None);

            /** Update the menu size */
            Guide.UpdateMenuSize();

            /** Update the mneu scroll position */
            Guide.UpdateMenuScroll();

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

    export var Guide: GuideHandler;
    export var Authenticator: AuthenticatorHandler;

    /** Post a message containing a method and params to the preview player. */
    export var PostMessage = function(webview: Webview, method: string, params = {}): void {

        /** Make sure the contentwindow is loaded. */
        if (webview.contentWindow === undefined) {
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

    export enum MenuItemType {
        Channel,
        Game,
        Video,
        Setting
    }



    export enum FullscreenAction {
        Toggle,
        Enter,
        Exit,
        Refresh
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
