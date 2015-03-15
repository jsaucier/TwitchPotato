window.Potato = (function($, chrome, undefined) {


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
            me.updateTime();
        },

        fullscreen: function(state) {
            var nHeight = screen.height;
            var fHeight = nHeight + 32;
            var player = $('#players .video webview');

            if ((state === 'toggle' && player.height() === nHeight) || state === 'enter') {
                // Toggle player to fullscreen.
                player.height(fHeight);
            } else if ((state === 'toggle' && player.height() === fHeight) || state === 'exit') {
                // Toggle player to normal.
                player.height(nHeight);
            }
        },

        loadStoredData: function() {
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
                me.updateAll();

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
        },

        checkError: function(error) {
            if (error) {
                console.error(error);
                return true;
            } else {
                return false;
            }
        },

        createObjectURL: function(blob) {
            var objURL = URL.createObjectURL(blob);
            this.objectURLs = this.objectURLs || [];
            this.objectURLs.push(objURL);
            return objURL;
        },

        loadImage: function(url, element) {
            element = element[0];
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.contentType = 'image/jpg';
            xhr.onload = function() {
                var img = document.createElement('img');
                img.setAttribute('data-src', url);
                //img.className = 'icon';
                var objURL = me.createObjectURL(xhr.response);
                img.setAttribute('src', objURL);
                $(element).empty();
                element.appendChild(img);
            }.bind(this);
            xhr.send();
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
                    me.getGames();
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
                    me.getGames();
                }
            }
        },

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
                me.menu.followed = [];

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
                            me.addMenuItem('followed', json.streams[s]);

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
                        me.updateMenuItems('followed');

                        // Display any notifications if needed.
                        if (me.notifications.notify.length > 0) {
                            me.showNotification();
                        }
                    }
                });
            } else {
                // Update the menu items.
                me.updateMenuItems('followed');
            }
        },

        getFeatured: function() {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/streams/featured?limit=100',
                success: function(json) {
                    // Update our featured object.
                    me.menu.featured = [];

                    // Add the featured streams to the menu.
                    for (var s in json.featured) {
                        me.addMenuItem('featured', json.featured[s].stream);
                    }

                    // Update the menu items.
                    me.updateMenuItems('featured');
                }

            });
        },

        getChannels: function() {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/streams?limit=100',
                success: function(json) {
                    // Update our channels object.
                    me.menu.channels = [];

                    // Add the channels to the menu.
                    for (var s in json.streams) {
                        me.addMenuItem('channels', json.streams[s]);
                    }

                    // Update the menu items.
                    me.updateMenuItems('channels');
                }
            });
        },

        getGames: function() {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/games/top?limit=100',
                success: function(json) {
                    // Update our games object.
                    me.menu.games = [];

                    var followed = [];

                    // Add the games to the menu.
                    for (var s in json.top) {
                        var game = json.top[s].game.name;
                        me.addMenuItem('games', json.top[s], (me.followed.game.indexOf(game) !== -1));

                        // Track this game as already known.
                        followed.push(game);
                    }

                    // Followed games.
                    for (var f in me.followed.game) {
                        var g = me.followed.game[f];

                        // Check to make sure we don't already have this game listed
                        if (followed.indexOf(g) === -1) {
                            me.addMenuItem('games', {
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
                    me.updateMenuItems('games');
                }
            });
        },

        getGame: function(game) {
            $.ajax({
                url: 'https://api.twitch.tv/kraken/streams?game={0}&limit=100'.format(game),
                success: function(json) {
                    // Update our game object.
                    me.menu.game = [];

                    // Add the games to the menu.
                    for (var s in json.streams) {
                        me.addMenuItem('game', json.streams[s]);
                    }

                    $('.list.game .head').text(game);

                    // Update the menu items.
                    me.updateMenuItems('game', true);
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

        addMenuItem: function(type, data, followed) {
            if (data.channel !== undefined) {
                me.menu[type].push({
                    title: data.channel.status,
                    name: data.channel.name,
                    streamer: data.channel.display_name,
                    viewers: data.viewers,
                    game: data.game,
                    preview: data.preview.large
                });
            } else if (data.game !== undefined) {
                me.menu.games.push({
                    title: data.game.name,
                    channels: data.channels,
                    viewers: data.viewers,
                    boxArt: data.game.box.large,
                    followed: followed || false
                });
            }
        },

        updateMenuItems: function(menu, goto) {
            var sort = function(a, b) {
                var aViewers = a.viewers;
                var bViewers = b.viewers;

                if (m === 'games') {
                    if (a.followed === true) {
                        aViewers += 999999999;
                    }
                    if (b.followed === true) {
                        bViewers += 999999999;
                    }
                }

                if (aViewers > bViewers)
                    return -1;
                if (aViewers < bViewers)
                    return 1;
                return 0;
            };

            var menus = [
                'followed',
                'featured',
                'channels',
                'games',
                'game'
            ];

            if (menu !== undefined) {
                menus = [menu];
            }

            for (var i = 0; i < menus.length; i++) {
                // Get the menu name.
                var m = menus[i];

                // Sort the menu items by viewers.
                me.menu[m].sort(sort);

                // Save the selected menu item.
                var selected = $('.list.' + m + ' .items .item.selected').attr('name');

                // Is the popup shown?
                var popupShown = ($('.list.' + m + ' .popup:visible').length > 0);

                if (popupShown === true) {
                    // Save the popup state by moving it to the body and hiding it.
                    $('.popup').appendTo($('body')).hide();
                }

                // Get the template item.
                $('.list.' + m + ' .items').empty();

                if (me.menu[m].length !== 0) {
                    for (var j = 0; j < me.menu[m].length; j++) {
                        var data = me.menu[m][j];

                        var item;

                        if (m !== 'games') {

                            item = $($('#channel-item-template').html());

                            // This item was prevoiusly selected.
                            if (selected == data.name) {
                                // Set it back as selected.
                                $(item).addClass('selected');

                                if (popupShown) {
                                    // Reload the popup's previous state
                                    $('.popup').appendTo($(item)).show();
                                }
                            }

                            // Set the item streamer.
                            $(item).find('.streamer').text(data.streamer);

                            // Set the item game.
                            $(item).find('.game').text(data.game);

                            // Set the item attributes
                            $(item).attr({
                                name: data.name,
                                game: data.game
                            });
                        } else {
                            item = $($('#game-item-template').html());

                            // This item was prevoiusly selected.
                            if (selected == data.title) {
                                // Set it back as selected.
                                $(item).addClass('selected');

                                if (popupShown) {
                                    // Reload the popup's previous state
                                    $('.popup').appendTo($(item)).show();
                                }

                                selectedUpdated = true;
                            }

                            // Set the item text.
                            if (data.followed === true) {
                                $(item).find('.game').text('* ' + data.title);
                            } else {
                                $(item).find('.game').text(data.title);
                            }

                            // Set the item attributes.
                            $(item).attr({
                                name: data.title,
                                followed: data.followed
                            });
                        }

                        $('.list.' + m + ' .items').append(item);
                    }

                    // Show the list.
                    $('.list.' + m).show();
                } else {
                    // Hide the list.
                    $('.list.' + m).hide();
                }

                if (goto === true) {
                    // Remove the currently selected list
                    $('.list.selected').removeClass('selected');

                    // Set the new selected list
                    $('.list.' + m).addClass('selected');

                    me.updateMenu(true);
                } else {
                    // Set a short delay to update so that we do not update multiple times in a row.
                    me.updateMenu(null, 500);
                }
            }
        },

        updateAll: function() {
            me.getFollowed();
            me.getFeatured();
            me.getChannels();
            me.getGames();

            // Set the time out here just in case the scrollTo fails.
            // It will be cleared and reset properly on a successful update.
            clearTimeout(me.timers.refresh);

            me.timers.refresh = setTimeout(function() {
                me.updateAll();
            }, 1000 * 60 * 1);

            var date = new Date();

            // Set the update time.
            $('#time .updated').text(date.toLocaleDateString() + ' - ' + date.toLocaleTimeString());
        },

        updateTime: function() {
            $('#time .current').text(new Date().toLocaleTimeString());

            clearTimeout(me.timers.time);

            me.timers.time = setTimeout(function() {
                me.updateTime();
            }, 1000);
        },

        updateMenu: function(direction, delay) {
            if ($('#content').is(':visible')) {
                // Update the selected menu head
                me.updateMenuList(direction);

                // Update the selected menu item
                me.updateMenuItem(direction);

                // Update the menu size
                me.updateMenuSize();

                // Update the mneu scroll position
                me.updateMenuScroll();

                if (delay !== undefined) {
                    // Clear timeout
                    clearTimeout(me.timers.info);

                    // Set a timer
                    me.timers.info = setTimeout(me.updateInfo, delay);
                    return;
                } else {
                    // Update info panel
                    me.updateInfo();
                }
            }
        },

        updateMenuList: function(direction) {
            // Get the index of the selected menu list.
            var index = $('.lists .list:visible').index($('.lists .list.selected'));

            // Set default head item.
            if (index === -1)
                index = 0;

            // Remove selected list item.
            $('.lists .list.selected').removeClass('selected');

            // Hide the current visible items list.
            $('.lists .items:visible').hide();

            // Update the selected list index.
            if (direction === 'right' && index < $('.lists .head:visible').length - 1) {
                index++;
            } else if (direction === 'left' && index > 0) {
                index--;
            }

            // Select the new list item.
            $('.lists .list:visible').eq(index).addClass('selected');

            // Show the selected list items.
            $('.lists .list.selected .items').show();
        },

        updateMenuItem: function(direction) {
            // Get the index of the selected menu item.
            var index = $('.item:visible').index($('.item.selected:visible'));

            // Set default menu item.
            if (index === -1)
                index = 0;

            // Remove selected menu item.
            $('.item.selected:visible').removeClass('selected');

            // Update the selected item index.
            if (direction === 'down' && index < $('.items .item:visible').length - 1) {
                index++;
            } else if (direction === 'up' && index > 0) {
                index--;
            }

            // Select the new menu item.
            $('.item:visible').eq(index).addClass('selected');
        },

        updateMenuSize: function() {
            var height = $('.lists').outerHeight(true);

            $('.lists .head:visible').each(function() {
                height -= $(this).outerHeight(true);
            });

            $('.lists .items:visible').height(height);
        },

        updateMenuScroll: function() {
            if ($('.items:visible').length !== 0) {
                // Get the list mid point
                var mid = $('.items:visible').innerHeight() / 2;

                // Get half the item height
                var half = $('.items:visible .item.selected').outerHeight(true) / 2;

                // Get the top offset
                var offset = $('.items:visible').offset().top + mid - half;

                // Update scroll
                if ($('.items:visible .item.selected').length > 0) {
                    $('.items:visible').scrollTo('.items:visible .item.selected', {
                        offsetTop: offset,
                        duration: 0
                    });
                }
            }
        },

        updateInfo: function() {
            var type = $('.item.selected:visible').attr('type');
            var menu = $('.list.selected:visible').attr('menu');
            var name = $('.item.selected:visible').attr('name');
            var setting = $('.item.selected:visible').hasClass('setting');

            var html = '';

            if (setting) {
                html = me.showSetting(type);
            } else {
                var data = {};

                for (var item in me.menu[menu]) {
                    if (menu !== 'games') {
                        if (me.menu[menu][item].name === name) {
                            data = me.menu[menu][item];
                            break;
                        }
                    } else {
                        if (me.menu[menu][item].title === name) {
                            data = me.menu[menu][item];
                            break;
                        }
                    }
                }

                if (type === 'channel') {
                    html = me.showChannel(data);
                } else if (type === 'game') {
                    html = me.showGame(data);
                }
            }

            $('#info').removeAttr('menu type name');
            $('#info').attr({
                menu: menu,
                type: type,
                name: name
            });
        },

        showChannel: function(data) {
            var html = $($('#channel-template').html());

            $(html).find('.title').text(data.title || '');
            $(html).find('.game').text(data.game || '');
            $(html).find('.streamer').text(data.streamer);
            $(html).find('.viewers').text(data.viewers.deliminate(',') + ' viewers');
            me.loadImage(data.preview, $(html).find('.preview'));

            $('#info').empty();
            $('#info').append(html);
        },

        showGame: function(game) {
            var html = $($('#game-template').html());

            $(html).find('.game').text(game.title);

            if (game.channels === -1) {
                $(html).find('.channels').remove();
            } else {
                $(html).find('.channels').text(game.channels.deliminate(',') + ' channels');
            }

            if (game.viewers === -1) {
                $(html).find('.viewers').remove();
            } else {
                $(html).find('.viewers').text(game.viewers.deliminate(',') + ' viewers');
            }

            me.loadImage(game.boxArt, $(html).find('.boxart'));

            $('#info').empty();
            $('#info').append(html);

            if (game.viewers === -1 && game.channels === -1) {
                $('#info .sub-head').remove();
                $('#info .head').css('border-bottom', 'none');
            }
        },

        showSetting: function(setting) {
            // Only update settings if the menu has actually changed.
            if ($('#info').attr('menu') === 'settings' &&
                $('#info').attr('type') === setting)
                return;

            var html = $($('#' + setting + '-setting-template').html());

            $('#info').empty();
            $('#info').append(html);
        },

        showPopup: function() {
            var popup = $($('#popup-template').html());

            popup.appendTo($('.lists .item.selected:visible'));

            var name = $('.lists .item.selected:visible').attr('name');
            var type = $('.lists .item.selected:visible').attr('type');

            if (type === 'channel') {
                popup.find('.game').show();
            } else if (type === 'game') {
                popup.find('.search').remove();
            } else {
                return;
            }

            if (me.followed[type].indexOf(name) !== -1) {
                popup.find('.follow').remove();
                popup.find('.unfollow').show();
            } else {
                popup.find('.follow').show();
                popup.find('.unfollow').remove();
            }

            if ($('.popup .button.selected:visible').length === 0) {
                $('.popup .button:eq(0)').addClass('selected');
            }

            popup.show();
        },

        updatePopupButton: function(direction) {
            // Get the index of the selected menu item.
            var index = $('.popup .button:visible').index($('.popup .button.selected:visible'));

            // Set default menu item.
            if (index === -1)
                index = 0;

            // Remove selected menu item.
            $('.popup .button.selected:visible').removeClass('selected');

            // Update the selected item index.
            if (direction === 'down' && index < $('.popup .button:visible').length - 1) {
                index++;
            } else if (direction === 'up' && index > 0) {
                index--;
            }

            // Select the new menu item.
            $('.popup .button:visible').eq(index).addClass('selected');
        },

        openPopupButton: function() {
            var type = $('.popup .button.selected:visible').attr('type');

            var item = $('.popup').parent('.item');
            var game = item.attr('game');
            var name = item.attr('name');
            var iType = item.attr('type');

            switch (type) {
                case 'follow':
                    // Follow the channel.
                    me.follow(iType, name);
                    break;
                case 'unfollow':
                    // Unfollow the channel.
                    me.unfollow(iType, name);
                    break;
                case 'search':
                    // Search for more games of this type.
                    me.getGame(game);
                    break;
            }

            // Remove the popup menu.
            $('.popup').remove();
        },

        playChannel: function(channel) {
            // Ensure we aren't already playing a channel thats currently playing
            if ($('#players').attr('channel') !== channel) {
                // Save the channel to flashback.
                me.flashback = $('#players').attr('channel') || null;

                // Load the player template
                var player = $($('#player-template').html().format(channel, 0));

                // Clear the player div
                $('#players').empty().hide();

                // Set the player name
                $('#players').attr('channel', channel);

                // Append the player object
                $('#players').append(player);



                $('#players .chat webview').on('loadcommit', function() {
                    $('#players .chat webview')[0].insertCSS({
                        file: 'css/twitch.css'
                    });
                    $('#players .chat webview')[0].insertCSS({
                        code: 'body { font-size: ' + me.zoomLevel + '%!important; }'
                    });
                });



                // Show the player
                $('#players').fadeIn();

                // Hide the content
                $('#content').fadeOut();
            } else {
                // Channel is already playing, just fade the list out.
                $('#content').fadeOut();
            }
        },

        stopChannel: function() {
            // Save the flashback
            me.flashback = $('#players').attr('channel');

            // Clear and hide the player.
            $('#players').empty().hide();

            // Reset the player
            $('#players').removeAttr('channel');

            // Fade in the content.
            $('#content').fadeTo('fast', 1);

            // Update the menu
            me.updateMenu();
        },

        openMenuItem: function() {
            var name = $('.item.selected:visible').attr('name');
            var type = $('.item.selected:visible').attr('type');

            switch (type) {
                case 'channel':
                    me.playChannel(name);

                    break;
                case 'game':
                    // Hide the game menu.
                    $('.list.game').hide();

                    // Set the game title
                    $('.list.game .head').text(name);

                    // Update the menu.
                    me.updateMenu();

                    // Load the game search.
                    me.getGame(name);
                    break;
                case 'login':
                    $('#login webview').attr('src', 'http://twitch.tv/');
                    $('#login').fadeIn();
                    break;
                case 'import':
                    $('#import').focus();
                    break;
                case 'follow-game':
                    $('#follow-game').focus();
                    break;
                case 'follow-channel':
                    $('#follow-channel').focus();
                    break;
                case 'reset':
                    chrome.storage.sync.clear(function() {
                        chrome.storage.local.clear(function() {
                            me.initialize();
                        });
                    });
                    break;
                default:
                    break;
            }
        },

        updateChat: function(side) {
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
        },

        zoom: function(direction) {
            if (direction === 'in') {
                me.zoomLevel += 1;
            } else if (direction === 'out') {
                me.zoomLevel -= 1;
            } else if (direction === 'normal') {
                me.zoomLevel = 100;
            }

            chrome.storage.local.set({
                zoomLevel: me.zoomLevel
            }, function() {
                $('body').css('font-size', me.zoomLevel + '%');
                // Update the menu size
                me.updateMenuSize();

                // Update the mneu scroll position
                me.updateMenuScroll();

                // Update the chat css
                if ($('#players .chat webview').length > 0) {
                    $('#players .chat webview')[0].insertCSS({
                        code: 'body { font-size: ' + me.zoomLevel + '%!important; }'
                    });
                }
            });
        },

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
                } else if ($('#players').is(':visible')) {
                    me.handlePlayerKeyPress(event.keyCode);
                }
            }
        },

        handleListKeyPress: function(key) {
            switch (key) {
                case me.keys.select:
                    me.openMenuItem();
                    break;
                case me.keys.left:
                    me.updateMenu('left', 200);
                    break;
                case me.keys.up:
                    me.updateMenu('up', 200);
                    break;
                case me.keys.right:
                    me.updateMenu('right', 200);
                    break;
                case me.keys.down:
                    me.updateMenu('down', 200);
                    break;
                case me.keys.toggleLists:
                    if ($('#players').is(':visible')) {
                        $('#content').fadeOut();
                    }
                    break;
                case me.keys.refresh:
                    me.updateAll();
                    break;
                case me.keys.popup:
                    me.showPopup();
                    break;
                default:
                    break;
            }
        },

        handlePlayerKeyPress: function(key) {
            switch (key) {
                case me.keys.select:
                    me.fullscreen('toggle');
                    break;
                case me.keys.enterFullscreen:
                    me.fullscreen('enter');
                    break;
                case me.keys.exitFullscreen:
                    me.fullscreen('exit');
                    break;
                case me.keys.flashback:
                    if (me.flashback !== null) {
                        me.playChannel(me.flashback);
                    }
                    break;
                case me.keys.left:
                    me.updateChat('left');
                    break;
                case me.keys.right:
                    me.updateChat('right');
                    break;
                case me.keys.toggleLists:
                    $('#content').fadeTo('fast', 0.99);

                    me.updateMenu();

                    break;
                case me.keys.resolution:
                    //$.ajax({url: 'http://localhost:80/test.html?openResolution'.format(x, y)});
                    break;
                default:
                    break;
            }
        },

        handlePopupKeyPress: function(key) {
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
        },

        handleInputKeyPress: function(key, input) {
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
        }
    };

    $(function() {
        me.initialize();

        $(document).keyup(function(event) {
            var key = event.keyCode;

            if (key === me.keys.up ||
                key === me.keys.down ||
                key === me.keys.left ||
                key === me.keys.right) {
                if (me.timers.info !== null) {
                    // Clear the timeout
                    clearTimeout(me.timers.info);
                    // Update immediately
                    me.updateInfo();
                }
            }
        });

        $(document).keydown(function(event) {
            me.handleKeyPress(event);
        });
    });

    return me;

})(jQuery, chrome);