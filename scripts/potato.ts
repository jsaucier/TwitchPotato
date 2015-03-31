/// <reference path="./potato.d.ts" />
/// <reference path="./jquery.d.ts" />
/// <reference path="./utils.ts" />
/// <reference path="./storage"/>
/// <reference path="./input.ts" />
/// <reference path="./guide.ts" />
/// <reference path="./player.ts" />
/// <reference path="./twitch.ts" />

module TwitchPotato {
    "use strict";

    enum ZoomType {
        'Update',
        'In',
        'Out',
        'Reset'
    }

    export enum Direction {
        'Up',
        'Down',
        'Left',
        'Right'
    }

    export class Main {
        public Storage: Storage;
        public Input: Input;
        public Guide: Guide;
        public Player: Player;
        public Twitch: Twitch;

        constructor() {
            // Initialize the Application only after the page has loaded.
            $(() => this.Initialize())
        }

        public ShowError(error): void {
            $('#error .error').html(error);
            $('#error').fadeIn(() => setTimeout(() => { $('#error').fadeOut(); }, 10000));
        }

        public Initialize(): void {
            this.Storage = new Storage();
            this.Input = new Input();
            this.Guide = new Guide();
            this.Player = new Player();
            this.Twitch = new Twitch();

            this.Guide.LoadInputs();
        }

        /** Callback triggered after storage has been loaded. */
        public OnStorageLoaded(storage: StorageData): void {
            // Update the zoom level.
            this.UpdateZoom(ZoomType.Update);
        }

        /** Callback triggered after a keypress event. */
        private OnInput(input: InputData): void {
            console.log(input);
            switch (input.id) {
                case 'globalExit':
                    this.GlobalExit();
                    break;
                case 'globalGuideToggle':
                    this.ToggleGuide();
                    break;
                case 'globalZoomIn':
                    this.UpdateZoom(ZoomType.In);
                    break;
                case 'globalZoomOut':
                    this.UpdateZoom(ZoomType.Out);
                    break;
                case 'globalZoomReset':
                    this.UpdateZoom(ZoomType.Reset);
                    break;
                case 'globalSaveSetting':
                    //this.saveSetting();
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
                if ($('#webviews #users webview').length !== 0) {
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

                } else if ($('#webviews #login webview').length !== 0) {
                    // Load a blank window to stop the video playing.
                    $('#webviews #login webview').attr('src', 'about:blank');

                    // Hide the webviews
                    $('#webviews #login').fadeOut();
                }

                // Register the guide inputs.
                this.Guide.LoadInputs();
            }
        }

        /** Toggles the Guide. */
        public ToggleGuide(): void {
            if ($('#guide:visible').length !== 0) {
                $('#players').fadeIn();
                $('#guide').fadeOut();
                this.Player.LoadInputs();
            } else {
                $('#players').fadeOut();
                $('#guide').fadeIn();
                this.Guide.LoadInputs();
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

            console.log('Update guide size');
            // Update the menu size
            //this.Guide.updateMenuSize();

            // Update the mneu scroll position
            //this.Guide.updateMenuScroll();

            // Update the chat font size.
            if ($('#players .chat webview').length > 0) {
                var webview = <Webview>$('#players .chat webview')[0];

                // Update the chat font size.
                webview.insertCSS({
                    code: Utils.Format('body { font-size: {0}%!important; }', this.Storage.settings.zoom)
                });
            }
        }
    }

    /* The current Main class instance */
    export var Application: Main = new Main();
}





/*
        Potato.prototype.resetSettings = function() {
            console.log('reset');
            // Reset to the default values.
            this.users = [];
            this.zoom = 100;

            // Reset the stored values.
            chrome.storage.local.clear(function() {
                chrome.storage.sync.clear(function() {
                    // Reinitialize the app.
                    potato.initialize();
                });
            });

        };

        Potato.prototype.saveSetting = function() {

            // Ensure we are on an input setting.
            if ($('.list.selected.settings .item.selected[input="true"]').length !== 0) {

                // Get the focused input.
                var input = $('input:focus');

                // Input does not have focus.
                if (input.length === 0) {
                    // Register the global inputs only.
                    this.input.registerInputs(this);

                    // Get the setting type.
                    var type = $('.item.selected:visible').attr('type');

                    // Focus the input.
                    $('#' + type).focus();
                } else {

                    // Ensure we have input in the control.
                    if (input.val() !== '') {
                        if (input.attr('id') === 'add-user') {
                            this.addUser($.trim(input.val()));
                        } else if (input.attr('id') === 'follow-channel') {
                            this.twitch.followChannel('all', input.val());
                        } else if (input.attr('id') === 'follow-game') {
                            this.twitch.followGame('all', input.val());
                        }
                    }

                    input.val('');
                    input.blur();

                    setTimeout(function() {
                        // Register the guide inputs.
                        this.input.registerInputs(this.guide);
                    }.bind(this), 100);
                }
            }

        };

        Potato.prototype.addUser = function(username) {

            // Ensure we haven't already added the user.
            if (this.users.indexOf(username) === -1) {
                // Add the user to the list.
                this.users.push(username);

                // Update the guide.
                potato.guide.updateAll();

                // Sync the users.
                chrome.storage.sync.set({
                    users: this.users
                }, function() {
                        // Login to the twitch user.
                        this.twitch.authorize(username, true);
                    }.bind(this));
            } else {
                // Display an error.
                this.showError('{0} has already been added.'.format(username));
            }

        };

            Potato.prototype.ajaxStopped = function() {
            this.handleNotifications();

            this.guide.onAjaxCompleted();
        };
*/
