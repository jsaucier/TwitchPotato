(function(potato, $, chrome, undefined) {

    var Guide = function() {
        this.input = 'Guide';

        this.lookup = {
            followed: {},
            featured: {},
            channels: {},
            videos: {},
            video: {},
            games: {},
            game: {}
        };

        this.loading = {
            channels: 0,
            videos: 0,
            games: 0
        };

        this.online = {};

        this.followed = [];
        this.featured = [];
        this.channels = [];
        this.videos = [];
        this.video = [];
        this.games = {};
        this.game = [];
        this.settings = [];

        this.timers = {
            info: null,
            time: null,
            refresh: null
        };

        this.showFollowedOnUpdate = false;
    };

    Guide.prototype.onInput = function(id, type) {

        var input = potato.input.getRegisteredInput(id, type);

        if (input !== undefined && input.type === 'keyup') {
            switch (input.id) {
                case 'guideUp':
                    if ($('.popup:visible').length === 0) {
                        this.updateMenu('up', 200);
                    } else {
                        this.updatePopupButton('up');
                    }
                    break;
                case 'guideDown':
                    if ($('.popup:visible').length === 0) {
                        this.updateMenu('down', 200);
                    } else {
                        this.updatePopupButton('down');
                    }
                    break;
                case 'guideLeft':
                    this.updateMenu('left', 200);
                    break;
                case 'guideRight':
                    this.updateMenu('right', 200);
                    break;
                case 'guidePageUp':
                    break;
                case 'guidePageDown':
                    break;
                case 'guideSelect':
                    if ($('.popup:visible').length === 0) {
                        this.openMenuItem();
                    } else {
                        this.openPopupButton();
                    }
                    break;
                case 'guideRefresh':
                    this.updateAll();
                    break;
                case 'guideMenu':
                    this.showPopup();
                    break;
                default:
                    break;
            }
        }

    };

    Guide.prototype.onFollowedChannels = function(account, json) {

        // Add the followed channels to the menu.
        for (var s in json.streams) {
            // Get the channel name.
            var channel = json.streams[s].channel.name;

            // Ensure we have not added the channel yet.
            if (this.lookup.followed[channel] === undefined) {
                // Add the channel to the lookup table and the menu array.
                this.lookup.followed[channel] = this.addMenuItem('followed', json.streams[s]);
            }

            // Add to the list of online streams to handle notifications.
            this.online[channel] = json.streams[s];
        }

        // Decrement the loading channels.
        this.loading.channels--;

        // Check to see if we have finished loading.
        if (this.loading.channels === 0) {
            // Update the menu items.
            this.updateMenuItems('followed', this.showFollowedOnUpdate);

            // Handle the notifications.
            potato.handleNotifications(this.online);
        }

    };

    Guide.prototype.onFollowedGames = function(account, json) {

        // Add the followed games to the menu.
        for (var f in json.follows) {
            // Get the game name.
            var game = json.follows[f].name;

            // Ensure we have not added the game yet.
            if (this.lookup.games[game] === undefined) {
                // Add the video to the lookup table and the menu array.
                this.lookup.games[game] = this.addMenuItem('games', {
                    viewers: -1,
                    channels: -1,
                    game: {
                        name: game,
                        box: {
                            large: 'http://static-cdn.jtvnw.net/ttv-boxart/{0}-272x380.jpg'.format(encodeURIComponent(game))
                        }
                    }
                }, true);
            } else {
                // Set the game as followed.
                this.games[this.lookup.games[game]].followed = true;
            }
        }

        // Decrement the loading channels.
        this.loading.games--;

        // Check to see if we have finished loading.
        if (this.loading.games === 0) {
            // Update the menu items.
            this.updateMenuItems('games');
        }

    };

    Guide.prototype.onFollowedVideos = function(account, json) {

        // Add the followed videos to the menu.
        for (var v in json.videos) {
            // Get the video id.
            var id = json.videos[v]._id;

            // Ensure we have not added the video yet.
            if (this.lookup.videos[id] === undefined) {
                // Add the video to the lookup table and the menu array.
                this.lookup.videos[id] = this.addMenuItem('videos', json.videos[v]);
            }
        }

        // Decrement the loading channels.
        this.loading.videos--;

        // Check to see if we have finished loading.
        if (this.loading.videos === 0) {
            // Update the menu items.
            this.updateMenuItems('videos');
        }

    };

    Guide.prototype.onFeatured = function(json) {

        // Add the featured channels to the menu.
        for (var s in json.featured) {
            // Get the channel name.
            var channel = json.featured[s].stream.channel.name;

            // Ensure we have not added the featured channel yet.
            if (this.lookup.featured[channel] === undefined) {
                // Add the channel to the lookup table and the menu array.
                this.lookup.featured[channel] = this.addMenuItem('featured', json.featured[s].stream);
            }
        }

        // Update the menu items.
        this.updateMenuItems('featured');

    };

    Guide.prototype.onChannels = function(json) {

        // Add the top channels to the menu.
        for (var s in json.streams) {
            // Get the channel name.
            var channel = json.streams[s].channel.name;

            // Ensure we have not added the featured channel yet.
            if (this.lookup.channels[channel] === undefined) {
                // Add the channel to the lookup table and the menu array.
                this.lookup.channels[channel] = this.addMenuItem('channels', json.streams[s]);
            }
        }

        // Update the menu items.
        this.updateMenuItems('channels');

    };

    Guide.prototype.onGames = function(json) {

        // Add the games to the menu.
        for (var s in json.top) {
            // Get the game name.
            var game = json.top[s].game.name;

            // Ensure we have not added the game yet.
            if (this.lookup.games[game] === undefined) {
                // Add the game to the lookup table and the menu array.
                this.lookup.games[game] = this.addMenuItem('games', json.top[s]);
            }
        }

        // Update the menu items.
        this.updateMenuItems('games');

    };

    Guide.prototype.onGame = function(game, json) {

        // Reset the games array.
        this.game = [];

        // Reset the games lookup table.
        this.lookup.game = {};

        // Add the games to the menu.
        for (var s in json.streams) {
            // Get the stream name.
            var name = json.streams[s].channel.name;

            // Ensure we have not added the game yet.
            if (this.lookup.game[name] === undefined) {
                // Add the game to the lookup table and the menu array.
                this.lookup.game[name] = this.addMenuItem('game', json.streams[s]);
            }
        }

        // Set the game menu name.
        $('.list.game .head').text(game);

        // Update the menu items and display it.
        this.updateMenuItems('game', true);

    };

    Guide.prototype.onVideo = function(channel, json) {

        // Reset the video array.
        this.video = [];

        // Reset the video lookup table.
        this.lookup.video = {};

        // Add the video to the menu.
        for (var v in json.videos) {
            // Get the video id.
            var id = json.videos[v]._id;

            // Ensure we have not added the video yet.
            if (this.lookup.video[id] === undefined) {
                // Add the video to the lookup table and the menu array.
                this.lookup.video[id] = this.addMenuItem('video', json.videos[v]);
            }
        }

        // Set the video menu name.
        $('.list.video .head').text(channel);

        // Update the menu items and display it.
        this.updateMenuItems('video', true);

    };

    Guide.prototype.addMenuItem = function(type, data, followed) {

        if (type === 'videos' ||
            type === 'video') {

            return this[type].push({
                title: data.title,
                name: data.channel.name,
                streamer: data.channel.display_name,
                views: data.views,
                length: data.length,
                preview: (data.preview || '').replace(/320x240/, '640x360'),
                video: data._id
            }) - 1;

        }

        if (type === 'games') {

            return this.games.push({
                game: data.game.name,
                channels: data.channels,
                viewers: data.viewers,
                boxArt: data.game.box.large,
                followed: followed || false
            }) - 1;

        }

        if (data.channel !== undefined) {

            return this[type].push({
                title: data.channel.status,
                name: data.channel.name,
                streamer: data.channel.display_name,
                viewers: data.viewers,
                game: data.game,
                preview: data.preview.large
            }) - 1;

        }

        console.error('Failed to add a menu item.', type, data);

    };


    Guide.prototype.createObjectURL = function(blob) {

        var objURL = URL.createObjectURL(blob);

        this.objectURLs = this.objectURLs || [];
        this.objectURLs.push(objURL);

        return objURL;

    };

    Guide.prototype.loadImage = function(url, element) {

        element = element[0];
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url);

        xhr.responseType = 'blob';
        xhr.contentType = 'image/jpg';

        xhr.onload = function() {
            var img = document.createElement('img');
            img.setAttribute('data-src', url);
            var objURL = this.createObjectURL(xhr.response);
            img.setAttribute('src', objURL);
            $(element).empty();
            element.appendChild(img);
        }.bind(this);

        xhr.send();

    };

    Guide.prototype.updateMenuItems = function(menu, goto) {

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

        var reIndex = function(menu) {
            // Reset the lookup table.
            this.lookup[menu] = {};

            // Reindex lookup table.
            for (var index in this[menu]) {
                // Get the item.
                var item = this[menu][index];

                // Set the new lookup index.
                if (menu === 'games') {
                    this.lookup[menu][item.game] = index * 1;
                } else if (menu === 'videos' || menu === 'video') {
                    this.lookup[menu][item.video] = index * 1;
                } else {
                    this.lookup[menu][item.name] = index * 1;
                }
            }
        };

        var menus = [
            'followed',
            'featured',
            'channels',
            'videos',
            'video',
            'games',
            'game'
        ];

        if (menu !== undefined) {
            menus = [menu];
        }


        for (var i = 0; i < menus.length; i++) {

            if (menus[i].length > 0) {
                // Get the menu item.
                var m = menus[i];

                // Don't sort videos.
                if (m !== 'videos' && m !== 'video') {
                    // Sort the menu items by viewers.
                    this[m].sort(sort);

                    // Reindex the menu
                    reIndex.call(this, m);
                }

                // Save the selected menu item.
                var selected = $('.list.' + m + ' .items .item.selected').toArray()[0];

                // Is the popup shown?
                var popup = ($('.list.' + m + ' .popup:visible').length > 0);

                if (popup === true) {
                    // Save the popup state by moving it to the body and hiding it.
                    $('.popup').appendTo($('body')).hide();
                }

                // Get the template item.
                $('.list.' + m + ' .items').empty();

                if (this[m].length !== 0) {
                    for (var j = 0; j < this[m].length; j++) {
                        var data = this[m][j];

                        var item;

                        if (m === 'videos' || m === 'video') {
                            item = this.updateMenuVideoItem(data, selected, popup);
                        } else if (m === 'games') {
                            item = this.updateMenuGameItem(data, selected, popup);
                        } else {
                            item = this.updateMenuChannelItem(data, selected, popup);
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

                    this.updateMenu(true);
                } else {
                    // Set a short delay to update so that we do not update multiple times in a row.
                    this.updateMenu(null, 500);
                }
            } else {
                // Get the template item.
                $('.list.' + menus[i] + ' .items').empty();
            }
        }

    };

    Guide.prototype.updateMenuChannelItem = function(data, selected, popup) {

        // Load the channel item template
        var item = $($('#channel-item-template').html());

        // This item was prevoiusly selected.
        if ($(selected).attr('name') == data.name) {
            // Set it back as selected.
            $(item).addClass('selected');

            if (popup) {
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

        return $(item);

    };

    Guide.prototype.updateMenuGameItem = function(data, selected, popup) {

        // Load the game item template
        var item = $($('#game-item-template').html());

        // This item was prevoiusly selected.
        if ($(selected).attr('game') == data.game) {
            // Set it back as selected.
            $(item).addClass('selected');

            if (popup) {
                // Reload the popup's previous state
                $('.popup').appendTo($(item)).show();
            }
        }

        // Set the followed class
        if (data.followed === true) {
            $(item).addClass('followed');
        }

        // Set the item text.
        $(item).find('.game').text(data.game);

        // Set the item attributes.
        $(item).attr({
            game: data.game
        });

        return $(item);

    };

    Guide.prototype.updateMenuVideoItem = function(data, selected, popup) {

        // Load the video item template
        var item = $($('#video-item-template').html());

        if ($(selected).attr('video') === data.video) {
            // Set it back as selected.
            $(item).addClass('selected');

            if (popup === true) {
                // Reload the popup's previous state
                $('.popup').appendTo($(item)).show();
            }
        }

        // Set the video streamer.
        $(item).find('.streamer').text(data.streamer);

        // Set the video game.
        $(item).find('.game').text(data.game);

        // Set the video title.
        $(item).find('.title').text(data.title);

        // Set the item attributes
        $(item).attr({
            name: data.name,
            video: data.video
        });

        return $(item);

    };

    Guide.prototype.openMenuItem = function() {
        var name = $('.item.selected:visible').attr('name');
        var game = $('.item.selected:visible').attr('game');
        var type = $('.item.selected:visible').attr('type');
        var video = $('.item.selected:visible').attr('video');

        switch (type) {
            case 'channel':
                // Play the channel.
                potato.player.play(name);

                // Show the player
                $('#players').fadeIn();

                // Hide the guide
                $('#guide').fadeOut();
                break;
            case 'game':
                // Hide the game menu.
                $('.list.game').hide();

                // Set the game title
                $('.list.game .head').text(game);

                // Update the menu.
                this.updateMenu();

                // Load the game search.
                potato.twitch.getGame(game);
                break;
            case 'video':
                // Play the channel.
                potato.player.play(video, false, true);

                // Show the player
                $('#players').fadeIn();

                // Hide the guide
                $('#guide').fadeOut();
                break;
            case 'login':
                // Register only Global inputs.
                potato.input.registerInputs(potato.input);
                $('#login webview').attr('src', 'http://twitch.tv/login');
                $('#login').fadeIn();
                break;
            case 'add-account':
                $('#add-account').focus();
                break;
            case 'follow-game':
                $('#follow-game').focus();
                break;
            case 'follow-channel':
                $('#follow-channel').focus();
                break;
            case 'reset':
                potato.resetSettings();
                break;
            default:
                break;
        }
    };

    Guide.prototype.updateAll = function(skipFollowed) {

        // Reset the menu arrays.
        this.followed = [];
        this.featured = [];
        this.channels = [];
        this.videos = [];
        this.games = [];

        // Reset the lookup tables.
        this.lookup.followed = {};
        this.lookup.featured = {};
        this.lookup.channels = {};
        this.lookup.videos = {};
        this.lookup.games = {};

        // Handle online notifications.
        this.online = {};

        // Ignore the followed items.
        if (skipFollowed !== true) {
            // Get the number of twitch accounts.
            var num = potato.twitch.accounts.length;

            // Reset the loading table.
            this.loading = {
                channels: num,
                games: num,
                videos: num
            };

            // Iterate the accounts.
            for (var i in potato.twitch.accounts) {
                // Get the account name.
                var acc = potato.twitch.accounts[i];

                // Load the followed channels.
                potato.twitch.followedChannels(acc.account);

                // Load the followed games.
                potato.twitch.followedGames(acc.account);

                // Load the followed videos.
                potato.twitch.followedVideos(acc.account);
            }
        } else {
            this.updateMenuItems('followed');
            this.updateMenuItems('videos');
        }

        // Jump to followed menu once update is finished.
        this.showFollowedOnUpdate = skipFollowed;

        // Load the featured streams.
        potato.twitch.getFeatured();

        // Load the top channels.
        potato.twitch.getChannels();

        // Load the games.
        potato.twitch.getGames();

        // Set the time out here just in case the scrollTo fails.
        // It will be cleared and reset properly on a successful update.
        clearTimeout(this.timers.refresh);

        this.timers.refresh = setTimeout(function() {
            this.updateAll();
        }.bind(this), 1000 * 60 * 1);

        var date = new Date();

        // Set the update tithis.
        $('#time .updated').text(date.toLocaleDateString() + ' - ' + date.toLocaleTimeString());

    };

    Guide.prototype.updateTime = function() {
        $('#time .current').text(new Date().toLocaleTimeString());

        clearTimeout(this.timers.time);

        this.timers.time = setTimeout(this.updateTime.bind(this), 1000);
    };

    Guide.prototype.updateMenu = function(direction, delay) {
        if ($('#guide').is(':visible')) {
            // Update the selected menu head
            this.updateMenuList(direction);

            // Update the selected menu item
            this.updateMenuItem(direction);

            // Update the menu size
            this.updateMenuSize();

            // Update the mneu scroll position
            this.updateMenuScroll();

            if (delay !== undefined) {
                // Clear timeout
                clearTimeout(this.timers.info);

                // Set a timer
                this.timers.info = setTimeout(function() {
                    this.updateInfo();
                }.bind(this), delay);
                return;
            } else {
                // Update info panel
                this.updateInfo();
            }
        }
    };

    Guide.prototype.updateMenuList = function(direction) {
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
    };

    Guide.prototype.updateMenuItem = function(direction) {
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
    };

    Guide.prototype.updateMenuSize = function() {
        var height = $('.lists').outerHeight(true);

        $('.lists .head:visible').each(function() {
            height -= $(this).outerHeight(true);
        });

        $('.lists .items:visible').height(height);
    };

    Guide.prototype.updateMenuScroll = function() {
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
    };

    Guide.prototype.updateInfo = function() {

        var type = $('.item.selected:visible').attr('type');
        var menu = $('.list.selected:visible').attr('menu');
        var name = $('.item.selected:visible').attr('name');
        var setting = $('.item.selected:visible').hasClass('setting');

        if (setting) {
            this.showSetting(type);
        } else {
            var data = {};

            if (menu === 'videos' || menu === 'video') {
                var video = $('.item.selected:visible').attr('video');
                this.showVideo(this[menu][this.lookup[menu][video]]);
            } else if (menu === 'games') {
                var game = $('.item.selected:visible').attr('game');
                this.showGame(this[menu][this.lookup.games[game]]);
            } else {
                var channel = $('.item.selected:visible').attr('name');
                this.showChannel(this[menu][this.lookup[menu][channel]]);
            }
        }

        $('#info')
            .removeAttr('menu type name')
            .attr({
                menu: menu,
                type: type,
                name: name
            });

    };

    Guide.prototype.showChannel = function(data) {

        if (data === undefined) {
            return;
        }

        var html = $($('#channel-template').html());

        $(html).find('.title').text(data.title || '');
        $(html).find('.game').text(data.game || '');
        $(html).find('.streamer').text(data.streamer);
        $(html).find('.viewers').text(data.viewers.deliminate(',') + ' viewers');
        this.loadImage(data.preview, $(html).find('.preview'));

        $('#info').empty();
        $('#info').append(html);
    };

    Guide.prototype.showGame = function(game) {

        if (game === undefined) {
            return;
        }

        var html = $($('#game-template').html());

        $(html).find('.game').text(game.game);

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

        this.loadImage(game.boxArt, $(html).find('.boxart'));

        $('#info').empty();
        $('#info').append(html);

        if (game.viewers === -1 && game.channels === -1) {
            $('#info .sub-head').remove();
            $('#info .head').css('border-bottom', 'none');
        }
    };

    Guide.prototype.showVideo = function(data) {

        if (data === undefined) {
            return;
        }

        // Get the video template
        var html = $($('#video-template').html());

        $(html).find('.video').text(data.title || '');
        $(html).find('.streamer').text(data.streamer);
        $(html).find('.length').text(data.length.toString().secondsToTime());
        $(html).find('.views').text(data.views.deliminate(',') + ' views');
        this.loadImage(data.preview, $(html).find('.preview'));

        $('#info').empty();
        $('#info').append(html);
    };

    Guide.prototype.showSetting = function(setting) {
        // Only update settings if the menu has actually changed.
        if ($('#info').attr('menu') === 'settings' &&
            $('#info').attr('type') === setting)
            return;

        var html = $($('#' + setting + '-setting-template').html());

        $('#info').empty();
        $('#info').append(html);
    };

    Guide.prototype.showPopup = function() {

        if ($('.popup:visible').length !== 0) {
            $('.popup').remove();
            this.updateMenuScroll();
            return;
        }

        $('.popup').remove();

        var popup = $($('#popup-template').html());

        popup.appendTo($('.lists .item.selected:visible'));

        var name = $('.lists .item.selected:visible').attr('name');
        var game = $('.lists .item.selected:visible').attr('game');
        var type = $('.lists .item.selected:visible').attr('type');

        if (type === 'channel') {
            //popup.find('.game').show();
        } else if (type === 'game') {
            popup.find('.search-game').remove();
            popup.find('.search-video').remove();
            popup.find('.pip').remove();
            //popup.find('.follow-channel').remove();
            //popup.find('.unfollow-channel').remove();
        } else {
            return;
        }

        // Update follow-channel button.
        /*if (this.lookup.followed[name] !== undefined) {
            popup.find('.follow-channel').remove();
            popup.find('.unfollow-channel').show();
        } else {
            popup.find('.follow-channel').show();
            popup.find('.unfollow-channel').remove();
        }

        // Update follow-game button.
        if (this.games[this.lookup.games[game]].followed === true) {
            popup.find('.follow-game').remove();
            popup.find('.unfollow-game').show();
        } else {
            popup.find('.follow-game').show();
            popup.find('.unfollow-game').remove();
        }*/

        if ($('.popup .button.selected:visible').length === 0) {
            $('.popup .button:eq(0)').addClass('selected');
        }

        popup.show();

        this.updateMenuScroll();
    };

    Guide.prototype.updatePopupButton = function(direction) {
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
    };

    Guide.prototype.openPopupButton = function() {
        var type = $('.popup .button.selected:visible').attr('type');

        var item = $('.popup').parent('.item');
        var game = item.attr('game');
        var name = item.attr('name');
        var iType = item.attr('type');

        switch (type) {
            case 'view-pip':
                // Play the channel in pip mode.
                potato.player.play(name, true);

                // Show the player
                $('#players').fadeIn();

                // Hide the guide
                $('#guide').fadeOut();
                break;
            case 'search-games':
                // Search for more games of this type.
                potato.twitch.getGame(game);
                break;
            case 'search-videos':
                // Search for videos from this streamer
                potato.twitch.getVideo(name);
                break;
            case 'follow-channel':
                // Follow the channel.
                //potato.twitch.followChannel('creditx', name);
                break;
            case 'unfollow-channel':
                // Unfollow the channel.
                //potato.twitch.unfollowChannel('creditx', name);
                break;
            case 'follow-game':
                // Follow the game.
                //potato.twitch.followGame('creditx', game);
                break;
            case 'unfollow-game':
                // Unfollow the game.
                //potato.twitch.unfollowGame('creditx', game);
                break;

            default:
                break;
        }

        // Remove the popup menu.
        $('.popup').remove();

        this.updateMenuScroll();
    };

    potato.guide = new Guide(potato);

    $(function() {
        potato.guide.updateTime();
    });

}(window.Potato, window.jQuery, window.chrome));