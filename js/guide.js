(function(potato, $, chrome, undefined) {

    var Guide = function() {
        this.input = 'Guide';

        this.followed = [];
        this.channels = [];
        this.featured = [];
        this.games = [];
        this.game = [];
        this.settings = [];
        this.timeTimer = null;
    };

    Guide.prototype.onInput = function(id, type) {

        var input = potato.input.getRegisteredInput(id, type);

        if (input !== undefined && input.type === 'keyup') {
            switch (input.id) {
                case 'guideUp':
                    this.updateMenu('up', 200);
                    break;
                case 'guideDown':
                    this.updateMenu('down', 200);
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
                    this.openMenuItem();
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

    Guide.prototype.show = function() {
        this.registerInput();

        $('#guide').fadeIn();
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
            //img.className = 'icon';
            var objURL = this.createObjectURL(xhr.response);
            img.setAttribute('src', objURL);
            $(element).empty();
            element.appendChild(img);
        }.bind(this);
        xhr.send();
    };

    Guide.prototype.addMenuItem = function(type, data, followed) {
        if (data.channel !== undefined) {
            this[type].push({
                title: data.channel.status,
                name: data.channel.name,
                streamer: data.channel.display_name,
                viewers: data.viewers,
                game: data.game,
                preview: data.preview.large
            });
        } else if (data.game !== undefined) {
            this.games.push({
                title: data.game.name,
                channels: data.channels,
                viewers: data.viewers,
                boxArt: data.game.box.large,
                followed: followed || false
            });
        }
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
            // Get the menu nathis.
            var m = menus[i];

            // Sort the menu items by viewers.
            this[m].sort(sort);

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

            if (this[m].length !== 0) {
                for (var j = 0; j < this[m].length; j++) {
                    var data = this[m][j];

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

                this.updateMenu(true);
            } else {
                // Set a short delay to update so that we do not update multiple times in a row.
                this.updateMenu(null, 500);
            }
        }
    };

    Guide.prototype.openMenuItem = function() {
        var name = $('.item.selected:visible').attr('name');
        var type = $('.item.selected:visible').attr('type');

        switch (type) {
            case 'channel':
                // Register the player inputs.
                potato.input.registerInputs(this);

                // Play the channel.
                potato.player.play(name);

                // Show the player
                $('#players').fadeIn();

                // Hide the content
                $('#content').fadeOut();
                break;
            case 'game':
                // Hide the game menu.
                $('.list.game').hide();

                // Set the game title
                $('.list.game .head').text(name);

                // Update the menu.
                this.updateMenu();

                // Load the game search.
                potato.getGame(name);
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
                        potato.initialize();
                    });
                });
                break;
            default:
                break;
        }
    };

    Guide.prototype.updateAll = function() {
        potato.getFollowed();
        potato.getFeatured();
        potato.getChannels();
        potato.getGames();

        // Set the time out here just in case the scrollTo fails.
        // It will be cleared and reset properly on a successful update.
        clearTimeout(potato.timers.refresh);

        potato.timers.refresh = setTimeout(function() {
            this.updateAll();
        }, 1000 * 60 * 1);

        var date = new Date();

        // Set the update tithis.
        $('#time .updated').text(date.toLocaleDateString() + ' - ' + date.toLocaleTimeString());
    };

    Guide.prototype.updateTime = function() {
        $('#time .current').text(new Date().toLocaleTimeString());

        clearTimeout(this.timeTimer);

        this.timeTimer = setTimeout(this.updateTime.bind(this), 1000);
    };

    Guide.prototype.updateMenu = function(direction, delay) {
        if ($('#content').is(':visible')) {
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
                clearTimeout(potato.timers.info);

                // Set a timer
                potato.timers.info = setTimeout(function() {
                    this.updateInfo();
                }.bind(this), delay);
                return;
            } else {
                // Update info panel
                potato.updateInfo();
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

        var html = '';

        if (setting) {
            html = this.showSetting(type);
        } else {
            var data = {};

            for (var item in this[menu]) {
                if (menu !== 'games') {
                    if (this[menu][item].name === name) {
                        data = this[menu][item];
                        break;
                    }
                } else {
                    if (this[menu][item].title === name) {
                        data = this[menu][item];
                        break;
                    }
                }
            }

            if (type === 'channel') {
                html = this.showChannel(data);
            } else if (type === 'game') {
                html = this.showGame(data);
            }
        }

        $('#info').removeAttr('menu type name');
        $('#info').attr({
            menu: menu,
            type: type,
            name: name
        });
    };

    Guide.prototype.showChannel = function(data) {
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

        this.loadImage(game.boxArt, $(html).find('.boxart'));

        $('#info').empty();
        $('#info').append(html);

        if (game.viewers === -1 && game.channels === -1) {
            $('#info .sub-head').remove();
            $('#info .head').css('border-bottom', 'none');
        }
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

        if (this.followed[type].indexOf(name) !== -1) {
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
            case 'follow':
                // Follow the channel.
                potato.follow(iType, name);
                break;
            case 'unfollow':
                // Unfollow the channel.
                potato.unfollow(iType, name);
                break;
            case 'search':
                // Search for more games of this type.
                potato.getGame(game);
                break;
        }

        // Remove the popup menu.
        $('.popup').remove();
    };

    var guide = new Guide(potato);

    $(function() {});

    potato.guide = guide;

}(window.Potato, window.jQuery, window.chrome));