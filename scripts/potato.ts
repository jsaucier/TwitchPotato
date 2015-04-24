module TwitchPotato {
    export class Application {
        private initialized = false;

        Storage: StorageHandler;
        Input: InputHandler;
        Guide: GuideHandler;
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
            if (this.initialized === true) return;

            this.Storage = new StorageHandler();
            this.Input = new InputHandler();
            this.Guide = new GuideHandler();
            this.Player = new PlayerHandler();
            this.Twitch = new TwitchHandler();
            this.Notification = new NotificationHandler();
            this.Chat = new ChatHandler();

            this.initialized = true;

            this.Storage.Load((settings) => {
                /** Update the font size. */
                this.UpdateFontSize(FontSize.Update);

                /** Load the saved users. */
                for (var user in settings.users)
                    /** Login the user. */
                    this.Twitch.Login(settings.users[user]);

                /** Update the guide. */
                this.Guide.Refresh();
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
            if (this.Guide.IsShown() === true) {

                /** Ensure there is a stream playing. */
                if (this.Player.isPlaying === false) return;

                /** Fade the guide out. */
                this.Guide.Toggle(false, true);


                /** Pause the guide channel preview. */
                App.Guide.PausePreview();

                /** Show the chat window. */
                App.Chat.Guide(true);
            } else {

                if (hidePlayer !== true)
                    /** Show the players in the guide. */
                    this.Player.UpdateLayout(true, PlayersLayout.Guide);
                else
                    $('#players').fadeOut();

                /** Show the chat window. */
                App.Chat.Guide(false);

                /** Play the guide channel preview. */
                App.Guide.PlayPreview();

                /** Fade the guide in. */
                this.Guide.Toggle(true, true);
            }
        }

        /** Resets the application settings. */
        Reset(): void {
            /** Show the loading screen. */
            this.Loading(true);

            /** Reset the settings. */
            this.Twitch.ClearPartitions(undefined, () => {
                this.Storage.Load(() => this.Guide.Refresh(), true);
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
        HandleInput(input: Inputs): void {

            if (this.IsWebviewOpen())
                switch (input) {
                    case Inputs.Close:
                        return this.CloseWebview();
                    default:
                        return;
                }
            else
                switch (input) {
                    case Inputs.Close:
                        window.close();
                        break;
                    case Inputs.ToggleGuide:
                        this.ToggleGuide();
                        break;
                    case Inputs.FontSizeIncrease:
                        this.UpdateFontSize(FontSize.Increase);
                        break;
                    case Inputs.FontSizeDecrease:
                        this.UpdateFontSize(FontSize.Decrease);
                        break;
                    case Inputs.FontSizeReset:
                        this.UpdateFontSize(FontSize.Reset);
                        break;
                    case Inputs.SaveSetting:
                        this.SaveSetting();
                        break;
                    default:
                        break;
                }
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

            this.Guide.UpdateMenu(Direction.None);

            /** Update the menu size */
            this.Guide.UpdateMenuSize();

            /** Update the mneu scroll position */
            this.Guide.UpdateMenuScroll();

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
                        this.Guide.Refresh();
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

    export enum MenuItemType {
        Channel,
        Game,
        Video,
        Setting
    }

    export enum PlayerLayout {
        Default,
        Equal
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

    export enum PlayersLayout {
        Full,
        Guide,
        ChatLeft,
        ChatRight
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

    export enum Inputs {
        Close,
        FontSizeIncrease,
        FontSizeDecrease,
        FontSizeReset,
        SaveSetting,
        ToggleGuide,
        Guide_Up,
        Guide_Down,
        Guide_Left,
        Guide_Right,
        Guide_PageUp,
        Guide_PageDown,
        Guide_Select,
        Guide_Refresh,
        Guide_ContextMenu,
        Player_Stop,
        Player_PlayPause,
        Player_Mute,
        Player_Select,
        Player_Layout,
        Player_FullscreenEnter,
        Player_FullscreenExit,
        Player_FullscreenToggle,
        Player_Flashback,
        Player_SelectNext,
        Player_SelectPrevious,
        Player_QualityMobile,
        Player_QualityLow,
        Player_QualityMedium,
        Player_QualityHigh,
        Player_QualitySource,
        Player_ToggleChat,
        Player_ChatLayoutNext,
        Player_ChatLayoutPrevious
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
