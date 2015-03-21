/*
    To Do List:
        Rename #content to #guide
*/

window.Potato = (function(window, $, chrome, undefined) {



    /*Potato.prototype.initialize = function() {
        // Load the stored data.
        me.loadStoredData();

        // Start the update timer.
        me.guide.updateTime();
    };

    Potato.prototye.loadStoredData = function() {
        // Initialize our synced storage
        chrome.storage.sync.get(['followed'], function(store) {
            // Check for an empty object.
            if ($.isEmptyObject(store)) {
                store = {
                    followed: {
                        channel: [],
                        game: []
                    }
                };
            }

            // Copy to 'me' object.
            for (var prop in store) {
                me[prop] = store[prop];
            }

            // Update the channels and games.
            me.guide.updateAll();

            // Sync the now initialized store object.
            chrome.storage.sync.set(store);
        });

        // Initialize our local storage
        chrome.storage.local.get(['zoomLevel'], function(store) {
            if ($.isEmptyObject(store)) {
                store = {
                    zoomLevel: 100
                };
            }

            // Copy to 'me' object.
            for (var prop in store) {
                me[prop] = store[prop];
            }

            // Update the zoom.
            me.zoom();

            // Sync the now initialized store object.
            chrome.storage.local.set(store);
        });
    };

    Potato.prototye.checkError = function(error) {
        if (error) {
            console.error(error);
            return true;
        } else {
            return false;
        }
    };*/

    var me = {
        keys: {
            up: 38,
            down: 40,
            left: 37,
            right: 39,
            select: 13, // enter
            popup: 80, // p
            reload: 82, // r
            refresh: 84, // t
            stop: 81, // q
            flashback: 70, // f
            toggleLists: 66, // b
            exit: 88, // x
            resolution: 72, // h
            zoomIn: 187, // +
            zoomOut: 189, // -
            zoomReset: 48, // 0
            enterFullscreen: 79, // o
            exitFullscreen: 73, // i
            escape: 27 // esc
        },

        flashback: null,

        followed: {
            channel: [],
            game: []
        },

        zoomLevel: 100,

        timers: {
            refresh: null,
            time: null,
            info: null,
        },

        menu: {
            followed: [],
            channels: [],
            featured: [],
            games: [],
            game: [],
            settings: []
        },

        notifications: {
            list: {},
            notify: [],
        },

        chat: {
            side: null,
            overlay: false
        },

        initialize: function() {
            // Load the stored data.
            me.loadStoredData();

            // Start the update timer.
            //me.guide.updateTime();
        },

        loadStoredData: function() {
            // Initialize our synced storage
            /*chrome.storage.sync.get(['followed'], function(store) {
                // Check for an empty object.
                if ($.isEmptyObject(store)) {
                    store = {
                        followed: {
                            channel: [],
                            game: []
                        }
                    };
                }

                // Copy to 'me' object.
                for (var prop in store) {
                    me[prop] = store[prop];
                }



                // Update the channels and games.
                me.guide.updateAll(true);

                // Sync the now initialized store object.
                chrome.storage.sync.set(store);
            });*/
            me.twitch.new('creditx');
            me.twitch.new('miscreation');
            me.guide.updateAll(true);

            // Initialize our local storage
            chrome.storage.local.get(['zoomLevel'], function(store) {
                if ($.isEmptyObject(store)) {
                    store = {
                        zoomLevel: 100
                    };
                }

                // Copy to 'me' object.
                for (var prop in store) {
                    me[prop] = store[prop];
                }

                // Update the zoom.
                me.zoom();

                // Sync the now initialized store object.
                chrome.storage.local.set(store);
            });
        },

        checkError: function(error) {
            if (error) {
                console.error(error);
                return true;
            } else {
                return false;
            }
        },

        follow: function(type, name) {
            if (me.followed[type].indexOf(name) === -1) {
                // Add the channel to the array.
                me.followed[type].push(name);

                // Sync the followed channels and games.
                chrome.storage.sync.set({
                    followed: me.followed
                });

                // Update the menu.
                if (type === 'channel') {
                    me.getFollowed();
                } else if (type === 'game') {
                    //me.getGames();
                }
            }
        },

        unfollow: function(type, name) {
            var index = me.followed[type].indexOf(name);

            if (index !== -1) {
                // Remove the channel.
                me.followed[type].splice(index, 1);

                // Sync the followed channels and games.
                chrome.storage.sync.set({
                    followed: me.followed
                });

                // Update the menu.
                if (type === 'channel') {
                    me.getFollowed();
                } else if (type === 'game') {
                    //me.getGames();
                }
            }
        },
        /*
                importChannels: function(account) {
                    // Import the streams for the account.
                    $.ajax({
                        url: 'https://api.twitch.tv/kraken/users/{0}/follows/channels?limit=100'.format(account),
                        success: function(json) {
                            for (var f in json.follows) {
                                // Get the channel name.
                                var channel = json.follows[f].channel.name;

                                if (me.followed.channel.indexOf(channel) === -1) {
                                    // Add it to our channels object.
                                    me.followed.channel.push(channel);
                                }
                            }

                            chrome.storage.sync.set({
                                followed: me.followed
                            }, function() {
                                // Update the followed channels and games.
                                me.getFollowed();
                            });
                        }
                    });
                },

                getFollowed: function() {
                    if (me.followed.channel.length !== 0) {
                        // Clear the menu items.
                        me.guide.followed = [];

                        // Reset the notification array.
                        me.notifications.notify = [];

                        // Stores the current online streamers.
                        var list = {};

                        $.ajax({
                            url: 'https://api.twitch.tv/kraken/streams?limit=100&channel=' + me.followed.channel.join(','),
                            success: function(json) {
                                for (var s in json.streams) {
                                    var remove = [];
                                    // Add the followed streams to the menu.
                                    me.guide.addMenuItem('followed', json.streams[s]);

                                    var channel = json.streams[s].channel.name;
                                    var streamer = json.streams[s].channel.display_name;
                                    var game = json.streams[s].game;

                                    var info = {
                                        streamer: streamer,
                                        game: game,
                                    };

                                    if (me.notifications.list[channel] === undefined) {
                                        info.type = 'online';
                                    } else if (me.notifications.list[channel].game !== game) {
                                        info.type = 'game';
                                    }

                                    if (info.type !== undefined) {
                                        me.notifications.notify.push(info);
                                        me.notifications.list[channel] = info;
                                    }

                                    list[channel] = info;
                                }

                                // Update the online streamers.
                                me.notifications.list = list;

                                // Update the menu items.
                                me.guide.updateMenuItems('followed');

                                // Display any notifications if needed.
                                if (me.notifications.notify.length > 0) {
                                    me.showNotification();
                                }
                            }
                        });
                    } else {
                        // Update the menu items.
                        me.guide.updateMenuItems('followed');
                    }
                },
        */
        getFeatured: function() {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/streams/featured?limit=100',
                success: function(json) {
                    // Update our featured object.
                    me.guide.featured = [];

                    // Add the featured streams to the menu.
                    for (var s in json.featured) {
                        me.guide.addMenuItem('featured', json.featured[s].stream);
                    }

                    // Update the menu items.
                    me.guide.updateMenuItems('featured');
                }

            });
        },

        getChannels: function() {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/streams?limit=100',
                success: function(json) {
                    // Update our channels object.
                    me.guide.channels = [];

                    // Add the channels to the menu.
                    for (var s in json.streams) {
                        me.guide.addMenuItem('channels', json.streams[s]);
                    }

                    // Update the menu items.
                    me.guide.updateMenuItems('channels');
                }
            });
        },

        /*getGames: function() {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/games/top?limit=100',
                success: function(json) {
                    // Update our games object.
                    me.guide.games = [];

                    var followed = [];

                    // Add the games to the menu.
                    for (var s in json.top) {
                        var game = json.top[s].game.name;
                        me.guide.addMenuItem('games', json.top[s], (me.followed.game.indexOf(game) !== -1));

                        // Track this game as already known.
                        followed.push(game);
                    }

                    // Followed games.
                    for (var f in me.followed.game) {
                        var g = me.followed.game[f];

                        // Check to make sure we don't already have this game listed
                        if (followed.indexOf(g) === -1) {
                            me.guide.addMenuItem('games', {
                                viewers: -1,
                                channels: -1,
                                game: {
                                    name: g,
                                    box: {
                                        large: 'http://static-cdn.jtvnw.net/ttv-boxart/{0}-272x380.jpg'.format(encodeURIComponent(g))
                                    }
                                }
                            }, true);
                        }
                    }

                    // Update the menu items.
                    me.guide.updateMenuItems('games');
                }
            });
        },*/

        getGame: function(game) {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/streams?game={0}&limit=100'.format(game),
                success: function(json) {
                    // Update our game object.
                    me.guide.game = [];

                    // Add the games to the menu.
                    for (var s in json.streams) {
                        me.guide.addMenuItem('game', json.streams[s]);
                    }

                    $('.list.game .head').text(game);

                    // Update the menu items.
                    me.guide.updateMenuItems('game', true);
                }
            });
        },

        showNotification: function() {
            $('#notification ul').empty();

            for (var c in me.notifications.notify) {
                var info = me.notifications.notify[c];

                var item = $($('#notify-template').html());

                item.find('.streamer').text(info.streamer);
                item.find('.game').text(info.game);
                item.find('.status').text(info.status);

                item.appendTo($('#notification ul'));
            }

            $('#notification').fadeIn(function() {
                setTimeout(function() {
                    $('#notification').fadeOut();
                }, 5000);
            });
        },

        zoom: function(direction) {
            if (direction === 'in') {
                me.zoomLevel += 1;
            } else if (direction === 'out') {
                me.zoomLevel -= 1;
            } else if (direction === 'reset') {
                me.zoomLevel = 100;
            }

            chrome.storage.local.set({
                zoomLevel: me.zoomLevel
            }, function() {
                $('body').css('font-size', me.zoomLevel + '%');
                // Update the menu size
                me.guide.updateMenuSize();

                // Update the mneu scroll position
                me.guide.updateMenuScroll();

                // Update the chat css
                if ($('#players .chat webview').length > 0) {
                    $('#players .chat webview')[0].insertCSS({
                        code: 'body { font-size: ' + me.zoomLevel + '%!important; }'
                    });
                }
            });
        },

        /*updateChat: function(side) {
            if (me.chat.side === null || me.chat.side !== side) {
                me.chat.side = side;
            } else if (me.chat.side === side) {
                if (me.chat.overlay) {
                    me.chat.side = null;
                    me.chat.overlay = false;
                } else {
                    me.chat.overlay = true;
                }
            }

            me.showChat();
        },

        showChat: function() {
            var chatFrame = $('#players .chat');
            var videoFrame = $('#players .video');

            chatFrame.removeClass('left right');

            if (me.chat.side === 'right')
                chatFrame.css('left', '').css('right', 0);
            else if (me.chat.side === 'left')
                chatFrame.css('left', 0).css('right', '');

            if (me.chat.overlay) {
                chatFrame.addClass('overlay');

                if (me.chat.side === 'right') {
                    videoFrame.css('left', 0).css('right', chatFrame.outerWidth(true));
                } else if (me.chat.side === 'left') {
                    videoFrame.css('left', chatFrame.outerWidth(true)).css('right', 0);
                }
            } else {
                chatFrame.removeClass('overlay');
                videoFrame.css('left', 0).css('right', 0);
            }

            if (me.chat.side) {
                chatFrame.addClass(me.chat.side);
                chatFrame.show();
            } else {
                chatFrame.hide();
            }
        },/*



        hideChat: function() {
            $('#players .chat').hide();
            $('#players .video').css('left', 0).css('right', 0);
        },

        handleKeyPress: function(event) {
            // Handle webview
            if ($('#login').is(':visible')) {
                switch (event.keyCode) {
                    case me.keys.escape:
                        $('#login webview').attr('src', 'about:blank');
                        $('#login').fadeOut();
                        event.stopPropagation();
                        return event.preventDefault();
                    default:
                        return;
                }
            }

            // Check to see if an input box is focused.
            var input = $('input:focus');

            if (input.length !== 0) {
                return me.handleInputKeyPress(event.keyCode, input);
            }

            // Handle global keypresses here.
            switch (event.keyCode) {
                case me.keys.escape:
                    return window.close();
                case me.keys.exit:
                    return window.close();
                case me.keys.reload:
                    return window.location.reload(false);
                case me.keys.stop:
                    return me.stopChannel();
                case me.keys.zoomIn:
                    return me.zoom('in');
                case me.keys.zoomOut:
                    return me.zoom('out');
                case me.keys.zoomReset:
                    return me.zoom('normal');
                default:
                    console.log('KeyCode: ' + event.keyCode);
                    break;
            }

            var popupClosed = false;

            if ($('.popup').is(':visible')) {
                popupClosed = me.handlePopupKeyPress(event.keyCode);
            }

            if (popupClosed === false) {
                if ($('#content').is(':visible')) {
                    me.handleListKeyPress(event.keyCode);
                }
            }
        },

        /*handleListKeyPress: function(key) {
            switch (key) {
                case me.keys.select:
                    me.openMenuItem();
                    break;
                case me.keys.left:
                    me.guide.updateMenu('left', 200);
                    break;
                case me.keys.up:
                    me.guide.updateMenu('up', 200);
                    break;
                case me.keys.right:
                    me.guide.updateMenu('right', 200);
                    break;
                case me.keys.down:
                    me.guide.updateMenu('down', 200);
                    break;
                case me.keys.toggleLists:
                    if ($('#players').is(':visible')) {
                        $('#content').fadeOut();
                    }
                    break;
                case me.keys.refresh:
                    me.guide.updateAll();
                    break;
                case me.keys.popup:
                    me.showPopup();
                    break;
                default:
                    break;
            }
        },*/

        /*handlePopupKeyPress: function(key) {
            switch (key) {
                case me.keys.up:
                    me.updatePopupButton('up');
                    break;
                case me.keys.down:
                    me.updatePopupButton('down');
                    break;
                case me.keys.select:
                    me.openPopupButton();
                    break;
                case me.keys.popup:
                    $('.popup').remove();
                    break;
                default:
                    $('.popup').remove();
                    return true;
            }
        },*/

        /*handleInputKeyPress: function(key, input) {
            switch (key) {
                case me.keys.select:
                    if (input.length !== 0) {
                        // Remove the whitespace from the input
                        var value = $.trim(input.val());

                        // Remove the focus if there is no input.
                        if (value === '') {
                            input.blur();

                            return;
                        }

                        switch (input.attr('id')) {
                            case 'import':
                                me.importChannels(value);
                                break;
                            case 'follow-channel':
                                me.follow('channel', value);
                                break;
                            case 'follow-game':
                                me.follow('game', value);
                                break;
                            default:
                                break;
                        }
                    }

                    // Clear the input.
                    input.val('');

                    // Clear the input focus.
                    input.blur();

                    break;
                default:
                    break;
            }
        }*/
    };

    $(function() {
        me.initialize();
    });

    return me;

})(window, jQuery, chrome);
/*
Potato.prototype.toggleGuide = function() {

    if ($('#content').is(':visible')) {
        $('#players').fadeIn();
        $('#content').fadeOut();
        this.registerInputs(this.player);
    } else {
        $('#players').fadeOut();
        $('#content').fadeIn();
        this.registerInputs(this.guide);
    }

};
*/