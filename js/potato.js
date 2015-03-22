(function(window, $, chrome, undefined) {

    var Potato = function() {
        this.accounts = [];
        this.zoom = 100;

        // Online channels table.
        this.online = {};
    };


    Potato.prototype.onInput = function(id, type) {

        var input = this.input.getRegisteredInput(id, type);

        if (input !== undefined && input.type === 'keyup') {

            switch (input.id) {
                case 'potatoExit':
                    if ($('#webviews webview:visible').length === 0) {
                        window.close();
                    } else {
                        // Load a blank window to stop the video playing.
                        $('#webviews #login webview').attr('src', 'about:blank');

                        // Hide the webviews
                        $('#webviews #login').fadeOut();
                        $('#webviews #accounts').fadeOut();

                        // Register guide inputs.
                        this.input.registerInputs(potato.guide);
                    }
                    break;
                case 'potatoGuideToggle':
                    potato.toggleGuide();
                    break;
                case 'potatoZoomIn':
                    potato.updateZoom('in');
                    break;
                case 'potatoZoomOut':
                    potato.updateZoom('out');
                    break;
                case 'potatoZoomReset':
                    potato.updateZoom('reset');
                    break;
                case 'potatoSaveSetting':
                    potato.saveSetting();
                    break;
                default:
                    break;
            }
        }

    };

    Potato.prototype.initialize = function() {
        // Load the stored settings.
        this.loadStoredSettings();

        // Update the guide.
        //this.guide.updateAll(true);
    };

    Potato.prototype.loadStoredSettings = function() {
        // Retrieved the stored zoom setting.
        this.loadStoredValue('local', 'zoom', 100, function() {
            // Update the zoom.
            this.updateZoom();
        }.bind(this));

        // Retrieve the stored twitch accounts.
        this.loadStoredValue('sync', 'accounts', [], function() {
            // Load the twitch accounts.
            for (var i in this.accounts) {
                // Load the twitch account.
                this.twitch.authorize(this.accounts[i]);
            }
        }.bind(this));
    };

    Potato.prototype.loadStoredValue = function(type, value, defaults, callback) {
        // Get the stored value.
        chrome.storage[type].get([value], function(store) {
            if ($.isEmptyObject(store) === true) {
                // Set the default value.
                store[value] = defaults;

                // Save the default value.
                chrome.storage[type].set(store);
            }

            // Set the value.
            this[value] = store[value];

            // Call the callback function
            return callback();
        }.bind(this));
    };

    Potato.prototype.showError = function(error) {

        $('#error .error').html(error);

        $('#error').fadeIn(function() {
            setTimeout(function() {
                $('#error').fadeOut();
            }, 10000);
        });

    };

    Potato.prototype.toggleGuide = function() {

        if ($('#guide:visible').length !== 0) {
            $('#players').fadeIn();
            $('#guide').fadeOut();
            this.input.registerInputs(this.player);
        } else {
            $('#players').fadeOut();
            $('#guide').fadeIn();
            this.input.registerInputs(this.guide);
        }

    };

    Potato.prototype.handleNotifications = function() {

        $('#notification ul').empty();

        var channel;
        var channels = this.guide.online;
        var online = {};

        for (var c in channels) {
            // Get the channel data.
            channel = channels[c];

            // Only notify new streamers that just come online or
            // when a streamer changes games.
            if (this.online[c] === undefined ||
                this.online[c] !== (channel.channel.game || '')) {
                online[c] = channel;
            }
        }

        // Add the online channels to the notification window.
        for (var o in online) {
            // Get the channel data.
            channel = online[o];

            var item = $($('#notify-template').html());

            item.find('.streamer').text(channel.channel.display_name);
            item.find('.game').text(channel.channel.game);

            item.appendTo($('#notification ul'));

            // Track this streamer as online.
            this.online[channel.channel.name] = channel.channel.game || '';
        }


        online = {};

        // Clean up the online table, removing the offline channels.
        for (var i in this.online) {
            if (channels[i] !== undefined) {
                // Channel is online.
                online[i] = this.online[i];
            }
        }

        this.online = online;

        if ($('#notification li').length > 0) {
            $('#notification').fadeIn(function() {
                setTimeout(function() {
                    $('#notification').fadeOut();
                }, 5000);
            });
        }

    };

    Potato.prototype.updateZoom = function(direction) {

        // Update the zoom value.
        if (direction === 'in') {
            this.zoom += 1;
        } else if (direction === 'out') {
            this.zoom -= 1;
        } else if (direction === 'reset') {
            this.zoom = 100;
        }

        // Store the zoom locally.
        chrome.storage.local.set({
            zoom: this.zoom
        }, function() {

            // Update the application zoom.
            $('body').css('font-size', this.zoom + '%');
            // Update the menu size
            this.guide.updateMenuSize();

            // Update the mneu scroll position
            this.guide.updateMenuScroll();

            // Update the chat css
            if ($('#players .chat webview').length > 0) {
                $('#players .chat webview')[0].insertCSS({
                    code: 'body { font-size: ' + this.zoom + '%!important; }'
                });
            }

        }.bind(this));
    };

    Potato.prototype.resetSettings = function() {

        // Iterate the accounts.
        for (var a in this.accounts) {
            // Clear the partition data and remove the webview.
            this.twitch.remove(this.accounts[a]);
        }

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
                    if (input.attr('id') === 'add-account') {
                        this.addAccount($.trim(input.val()));
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

    Potato.prototype.addAccount = function(username) {

        // Ensure we haven't already added the account.
        if (this.accounts.indexOf(username) === -1) {
            // Add the account to the list.
            this.accounts.push(username);

            // Sync the accounts.
            chrome.storage.sync.set({
                accounts: this.accounts
            }, function() {
                // Display a fake error.
                this.showError('Waiting for the account login.');

                // Login to the twitch account.
                this.twitch.authorize(username);
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


    var potato = new Potato();

    $(function() {
        $(document).ajaxStop(potato.ajaxStopped.bind(potato));
        potato.initialize();
    });

    window.Potato = potato;

})(window, jQuery, chrome);