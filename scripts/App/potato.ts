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
            Authenticator = new AuthenticatorHandler((user, name, token) => {
                this._user = user;
                this._name = name;
                this._token = token;

                this.Twitch = new TwitchHandler(user, token);
            });




            this.Storage.Load((settings) => {
                /** Update the font size. */
                this.UpdateFontSize(FontSize.Update);

                /** Load the saved users. */
                // for (var user in settings.users)
                //     /** Login the user. */
                //     this.Twitch.Login(settings.users[user]);

                /** Update the guide. */
                //Guide.Refresh();
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
            this.Twitch.ClearPartitions(undefined, () => {
                this.Storage.Load(() => Guide.Refresh(), true);
            });
        }

        /** Log into Twitch.tv */
        Login(): void {

            /** Get the login webvew. */
            var webview = <Webview>$('#login webview')[0];

            webview.addEventListener('contentload', () => {
                /** Insert the script and execute the code. */
                webview.focus();
                webview.executeScript({ file: 'js/vendor/jquery.min.js' });
                webview.executeScript({ code: '$("#login").focus();' });
            });

            /** Navigate to the Twitch.tv login page. */
            $(webview).attr('src', 'http://twitch.tv/login');

            /** Show the webview. */
            $('#login').fadeIn();
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

        private OnAuthenticated(name: string, displayName: string, token: string): void {
            console.log(name, displayName, token);
        }

        /** Gets whether a webview is opened. */
        private IsWebviewOpen(): boolean {
            return $('#webviews webview:visible').length > 0;
        }

        /** Handles the GlobalExit keydown event. */
        private CloseWebview(): void {
            if ($('#webviews #users webview:visible').length !== 0) {
                var webview = $('#webviews #users webview:eq(0)');
                var username = webview.attr('username');

                /** Remove the username from the list. */
                this.Storage.Users(username, true);

                this.Twitch.ClearPartitions(username, () => {
                    /** Check to see if no webviews exist. */
                    if ($('#webviews #users webview').length === 0) {
                        /** Hide the container. */
                        $('#webviews #users').fadeOut();
                    }
                });
            } else if ($('#webviews #login webview:visible').length !== 0) {
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
                            this.AddUser(value);
                    }

                    input.val('');
                    input.blur();
                }
            }
        }

        /** Add a stored user. */
        private AddUser(user: string): void {
            /** Show the loading window. */
            App.Loading(true);

            /** Get the stored users. */
            var users = this.Storage.Users();

            /** Check to see if the user is a valid account. */
            this.Twitch.GetTwitchUser(user, (twitchUser: ITwitchUser) => {
                /** Ensure we haven't already added the user. */
                if (users.indexOf(user) === -1) {
                    /** Login to the twitch user. */
                    this.Twitch.Authorize(user, (twitchUser: ITwitchUser) => {
                        /** Add the user to the settings. */
                        this.Storage.Users(user);

                        /** Update the guide. */
                        Guide.Refresh();
                    });
                } else {
                    /** Display an error. */
                    this.ShowMessage('{0} has already been added.'.format(twitchUser.name));
                }
            });
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
