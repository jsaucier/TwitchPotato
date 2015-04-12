module TwitchPotato {
    export class Main {
        private initialized = false;

        Storage: StorageHandler;
        Input: InputHandler;
        Guide: GuideHandler;
        Player: PlayerHandler;
        Twitch: TwitchHandler;
        Notification: NotificationHandler;
        Chat: ChatHandler;

        /** Displays an error message. */
        ShowError(error): void {
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

            this.Input.RegisterInputs(InputType.Guide);

            this.initialized = true;

            this.Storage.Load(() => {
                /** Update the zoom level. */
                this.UpdateZoom(ZoomType.Update);

                /** Get the stored users. */
                var users = this.Storage.GetUsers()

                /** Load the saved users. */
                for (var user in users)
                    /** Login the user. */
                    this.Twitch.Login(users[user]);

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
            if ($('#guide:visible').length !== 0) {
                /** Ensure there is a stream playing. */
                if (this.Player.isPlaying !== true) return;

                /** Show the players fullscreen. */
                this.Player.UpdateLayout(true);

                /** Fade the guide out. */
                $('#guide').fadeOut();

                /** Pause the guide channel preview. */
                Application.Guide.PausePreview();

                /** Show the chat window. */
                Application.Chat.ToggleChat(true, true);

                /** Register the player inputs. */
                this.Input.RegisterInputs(InputType.Player);
            } else {
                if (hidePlayer !== true)
                    /** Show the players in the guide. */
                    this.Player.UpdateLayout(true, PlayersLayout.Guide);
                else
                    $('#players').fadeOut();

                /** Show the chat window. */
                Application.Chat.ToggleChat(false, true);

                /** Play the guide channel preview. */
                Application.Guide.PlayPreview();

                /** Fade the guide in. */
                $('#guide').fadeIn();

                /** Register the guide inputs. */
                this.Input.RegisterInputs(InputType.Guide);
            }
        }

        /** Resets the application settings. */
        Reset(): void {
            /** Show the loading screen. */
            this.Loading(true);

            /** Reset the settings. */
            this.Twitch.ClearPartitions(undefined, () => {
                this.Storage.LoadDefaults(() => {
                    this.Guide.Refresh();
                });
            });
        }

        /** Log into Twitch.tv */
        Login(): void {
            /** Register only Global inputs. */
            Application.Input.RegisterInputs(InputType.Global);

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
        private OnInput(input: Input): void {
            if (this.HandleWebviewInput(input) !== true)
                switch (input.input) {
                    case Inputs.Global_Exit:
                        /** Exit the applications. */
                        window.close();
                        break;
                    case Inputs.Global_ToggleGuide:
                        this.ToggleGuide();
                        break;
                    case Inputs.Global_ZoomIn:
                        this.UpdateZoom(ZoomType.In);
                        break;
                    case Inputs.Global_ZoomOut:
                        this.UpdateZoom(ZoomType.Out);
                        break;
                    case Inputs.Global_ZoomReset:
                        this.UpdateZoom(ZoomType.Reset);
                        break;
                    case Inputs.Global_SaveSetting:
                        this.SaveSetting();
                        break;
                    default:
                        break;
                }
        }

        /** Handle the webview input */
        private HandleWebviewInput(input: Input): boolean {
            if ($('#webviews webview:visible').length === 0) return false;

            switch (input.input) {
                case Inputs.Global_Exit:
                    this.CloseWebview();
                    break;
                default: break;
            }

            return true;
        }

        /** Handles the GlobalExit keydown event. */
        private CloseWebview(): void {
            if ($('#webviews #users webview:visible').length !== 0) {
                var webview = $('#webviews #users webview:eq(0)');
                var username = webview.attr('username');

                /** Remove the username from the list. */
                this.Storage.RemoveUser(username);

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

            /** Register the guide inputs. */
            this.Input.RegisterInputs(InputType.Guide);
        }

        /** Updates the zoom level. */
        private UpdateZoom(type: ZoomType): void {
            /** Get the stored zoom. */
            var zoom = this.Storage.GetZoom();

            /** Update the zoom value. */
            if (type === ZoomType.In)
                zoom += 1;
            else if (type === ZoomType.Out)
                zoom -= 1;
            else if (type === ZoomType.Reset)
                zoom = 100;

            /** Save the zoom. */
            this.Storage.SetZoom(zoom);

            /** Update the application font size. */
            $('body').css('font-size', zoom + '%');

            this.Guide.UpdateMenu(Direction.None);

            /** Update the menu size */
            this.Guide.UpdateMenuSize();

            /** Update the mneu scroll position */
            this.Guide.UpdateMenuScroll();

            /** Update the chat font size. */
            this.Chat.UpdateZoom();
        }

        private SaveSetting(): void {
            /** Ensure we are on an input setting. */
            if ($('#guide .item.selected[input="true"]:visible').length !== 0) {
                /** Get the focused input. */
                var input = $('input:focus');

                /** Input does not have focus. */
                if (input.length === 0) {
                    /** Register the global inputs only. */
                    this.Input.RegisterInputs(InputType.Global);

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

                    /** Register the guide inputs. */
                    this.Input.RegisterInputs(InputType.Guide);
                }
            }
        }

        /** Add a stored user. */
        private AddUser(user: string): void {
            /** Show the loading window. */
            Application.Loading(true);

            /** Get the stored users. */
            var users = this.Storage.GetUsers();

            /** Check to see if the user is a valid account. */
            this.Twitch.GetTwitchUser(user, (twitchUser: TwitchUser) => {
                /** Ensure we haven't already added the user. */
                if (users.indexOf(user) === -1) {
                    /** Login to the twitch user. */
                    this.Twitch.Authorize(user, (twitchUser: TwitchUser) => {
                        /** Add the user to the settings. */
                        this.Storage.AddUser(user);

                        /** Update the guide. */
                        this.Guide.Refresh();
                    });
                } else {
                    /** Display an error. */
                    this.ShowError('{0} has already been added.'.format(twitchUser.name));
                }
            });
        }
    }

    /** The current Main class instance */
    export var Application: Main = new Main();

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

    export enum ZoomType {
        Update,
        In,
        Out,
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
        Global_Exit,
        Global_ZoomIn,
        Global_ZoomOut,
        Global_ZoomReset,
        Global_SaveSetting,
        Global_ToggleGuide,
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
    TwitchPotato.Application.Initialize();
});
