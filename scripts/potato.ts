module TwitchPotato {
    "use strict";

    enum ZoomType {
        Update,
        In,
        Out,
        Reset
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
        Videos
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

    export class Main {
        private initialized = false;

        public Storage: StorageHandler;
        public Input: InputHandler;
        public Guide: GuideHandler;
        public Player: PlayerHandler;
        public Twitch: TwitchHandler;
        public Notification: NotificationHandler;
        public Chat: ChatHandler;

        public ShowError(error): void {
            $('#error .error').html(error);
            $('#error').fadeIn(() => setTimeout(() => { $('#error').fadeOut(); }, 10000));
        }

        public Initialize(): void {
            if (this.initialized === true) return;

            this.Storage = new StorageHandler();
            this.Input = new InputHandler();
            this.Guide = new GuideHandler();
            this.Player = new PlayerHandler();
            this.Twitch = new TwitchHandler();
            this.Notification = new NotificationHandler();
            this.Chat = new ChatHandler();

            this.Storage.Load();
            this.Input.RegisterInputs(InputType.Guide);


            this.initialized = true;
        }

        /** Callback triggered after storage has been loaded. */
        public OnStorageLoaded(): void {
            /* Update the guide. */
            this.Guide.Refresh(true);

            // Update the zoom level.
            this.UpdateZoom(ZoomType.Update);

            // Load the saved users.
            for (var user in this.Storage.settings.users)
                /* Login the user. */
                this.Twitch.Authorize(this.Storage.settings.users[user]);
        }

        /** Callback triggered after a keypress event. */
        private OnInput(input: Input): void {
            switch (input.input) {
                case Inputs.Global_Exit:
                    this.GlobalExit();
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

        /** Handles the GlobalExit keydown event. */
        private GlobalExit(): void {
            if ($('#webviews webview:visible').length === 0) {
                window.close();
            } else {
                if ($('#webviews #users webview:visible').length !== 0) {
                    var webview = $('#webviews #users webview:eq(0)');
                    var username = webview.attr('username');

                    /*this.Twitch.ClearPartition(username, () => {
                        // Remove the username from the list.
                        /*this.users.splice(this.users.indexOf(username), 1);

                        // Sync the users.
                        chrome.storage.sync.set({
                            users: this.users
                        });

                        // Remove the webview.
                        $('#webviews #users webview[username="' + username + '"]').remove();

                        // Check to see if no webviews exist.
                        if ($('#webviews #users webview').length === 0) {
                            // Hide the container.
                            $('#webviews #users').fadeOut();
                        }
                    });*/

                } else if ($('#webviews #login webview:visible').length !== 0) {
                    // Load a blank window to stop the video playing.
                    $('#webviews #login webview').attr('src', 'about:blank');

                    // Hide the webviews
                    $('#webviews #login').fadeOut();
                }

                // Register the guide inputs.
                this.Input.RegisterInputs(InputType.Guide);
            }
        }

        /** Toggles the Guide. */
        public ToggleGuide(hidePlayer = false): void {
            if ($('#guide:visible').length !== 0) {
                /* Ensure there is a stream playing. */
                if (this.Player.isPlaying !== true) return;

                /* Show the players fullscreen. */
                this.Player.UpdateLayout(true);

                /* Fade the guide out. */
                $('#guide').fadeOut();

                /* Show the chat window. */
                Application.Chat.ToggleChat(true, true);

                /* Register the player inputs. */
                this.Input.RegisterInputs(InputType.Player);
            } else {
                if (hidePlayer !== true) {
                    /* Show the players in the guide. */
                    this.Player.UpdateLayout(true, PlayersLayout.Guide);
                }
                else
                    $('#players').fadeOut();

                /* Show the chat window. */
                Application.Chat.ToggleChat(false, true);

                /* Fade the guide in. */
                $('#guide').fadeIn();

                /* Register the guide inputs. */
                this.Input.RegisterInputs(InputType.Guide);
            }
        }

        /** Updates the zoom level. */
        private UpdateZoom(type: ZoomType): void {
            // Update the zoom value.
            if (type === ZoomType.In) {
                this.Storage.settings.zoom += 1;
            } else if (type === ZoomType.Out) {
                this.Storage.settings.zoom -= 1;
            } else if (type === ZoomType.Reset) {
                this.Storage.settings.zoom = 100;
            }

            // Save the zoom to storage.
            if (type !== ZoomType.Update)
                this.Storage.Save();

            // Update the application font size.
            $('body').css('font-size', this.Storage.settings.zoom + '%');

            this.Guide.UpdateMenu(Direction.None);

            // Update the menu size
            this.Guide.UpdateMenuSize();

            // Update the mneu scroll position
            this.Guide.UpdateMenuScroll();

            // Update the chat font size.
            this.Chat.UpdateZoom();
        }

        private SaveSetting(): void {
            /* Ensure we are on an input setting. */
            if ($('#guide .item.selected[input="true"]:visible').length !== 0) {
                /* Get the focused input. */
                var input = $('input:focus');

                /* Input does not have focus. */
                if (input.length === 0) {
                    /* Register the global inputs only. */
                    this.Input.RegisterInputs(InputType.Global);

                    /* Get the setting type. */
                    var type = $('#guide .item.selected:visible').attr('type');

                    /* Focus the input. */
                    $('#' + type).focus();
                } else {
                    /* Trim the input value. */
                    var value = $.trim(input.val());

                    /* Ensure we have input in the control. */
                    if (value !== '') {
                        if (input.attr('id') === 'add-user') {
                            this.AddUser(value);
                        } else if (input.attr('id') === 'follow-channel') {
                            this.Twitch.FollowChannel(undefined, value);
                        } else if (input.attr('id') === 'follow-game') {
                            this.Twitch.FollowGame(undefined, value);
                        }
                    }

                    input.val('');
                    input.blur();

                    /* Register the guide inputs. */
                    this.Input.RegisterInputs(InputType.Guide);
                }
            }
        }

        private AddUser(username): void {
            /* Ensure we haven't already added the user. */
            if (this.Storage.settings.users.indexOf(username) === -1) {
                /* Add the user to the settings. */
                this.Storage.settings.users.push(username);

                /* Save the settings. */
                this.Storage.Save();

                /* Update the guide. */
                this.Guide.Refresh(true);

                /* Login to the twitch user. */
                this.Twitch.Authorize(username);
            } else
                /* Display an error. */
                this.ShowError(Utils.Format('{0} has already been added.', username));
        }
    }

    /* The current Main class instance */
    export var Application: Main = new Main();

    // Initialize the Application only after the page has loaded.
    $(() => {
        TwitchPotato.Application.Initialize();
    });
}
