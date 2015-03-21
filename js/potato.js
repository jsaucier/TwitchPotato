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
                        $('#webview webview').fadeOut();
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
        this.guide.updateAll(true);
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
                this.twitch.new(this.accounts[i]);
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
            //for (var prop in store) {
            this[value] = store[value];
            //}

            // Call the callback function
            return callback();
        }.bind(this));
    };

    Potato.prototype.toggleGuide = function() {

        if ($('#guide').is(':visible')) {
            $('#players').fadeIn();
            $('#guide').fadeOut();
            this.input.registerInputs(this.player);
        } else {
            $('#players').fadeOut();
            $('#guide').fadeIn();
            this.input.registerInputs(this.guide);
        }

    };

    Potato.prototype.handleNotifications = function(channels) {

        $('#notification ul').empty();

        var channel;
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

        var input = $('#info input:focus');

        if (input.length === 0 || input.val() === '') {
            // Nothing to do here
            return input.blur();
        }

        if (input.attr('id') === 'add-account') {
            this.addAccount(input.val());
        }

        input.val('').blur();

    };

    Potato.prototype.addAccount = function(account) {
        console.log(account);
        // Ensure we haven't already added the account.
        if (this.accounts.indexOf(account) === -1) {
            // Add the account to the list.
            this.accounts.push(account);

            // Sync the accounts.
            chrome.storage.sync.set({
                accounts: this.accounts
            }, function() {
                // Login to the twitch account.
                this.twitch.new(account);
            }.bind(this));
        }

    };



    var potato = new Potato();

    $(function() {
        potato.initialize();
    });

    window.Potato = potato;

})(window, jQuery, chrome);