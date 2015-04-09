module TwitchPotato {
    "use strict";

    enum MenuItemType {
        Channel,
        Game,
        Video,
        Setting
    }

    export class GuideHandler {

        private objectURLs: string[] = [];
        private firstUpdate = true;

        private refreshTimeout: number;
        private timeTimeout: number;
        private infoTimeout: number;

        private ContextMenu = new ContextMenuHandler();

        private selectedItem = '#guide .item.selected:visible';

        public updateType: UpdateType = UpdateType.All;

        constructor() {
            /* Update the version */
            $('#time .version').text(Utils.Format('v{0}', chrome.runtime.getManifest().version));

            /* Start the time timer. */
            this.UpdateTime();

            $(document).ajaxStop(() => this.OnAjaxCompleted());

            this.UpdateMenu(Direction.None);
        }

        public OnInput(input: Input): void {

            if (this.ContextMenu.HandleInput(input, $(this.selectedItem)) !== true) {
                switch (input.input) {
                    case Inputs.Guide_Up:
                        this.UpdateMenu(Direction.Up, 200);
                        break;
                    case Inputs.Guide_Down:
                        this.UpdateMenu(Direction.Down, 200);
                        break;
                    case Inputs.Guide_Left:
                        this.UpdateMenu(Direction.Left, 200);
                        break;
                    case Inputs.Guide_Right:
                        this.UpdateMenu(Direction.Right, 200);
                        break;
                    case Inputs.Guide_PageUp:
                        this.UpdateMenu(Direction.JumpUp, 200);
                        break;
                    case Inputs.Guide_PageDown:
                        this.UpdateMenu(Direction.JumpDown, 200);
                        break;
                    case Inputs.Guide_Select:
                        this.OpenMenuItem();
                        break;
                    case Inputs.Guide_Refresh:
                        this.Refresh();
                        break;
                    case Inputs.Guide_ContextMenu:
                        this.ContextMenu.Show($(this.selectedItem));
                        break;
                    default:
                        break;
                }
            }
        }

        private OpenMenuItem(): void {
            var key = $('#guide .item.selected:visible').attr('key');
            var menu = parseInt($('#guide .item.selected:visible').attr('menu'));

            var isSetting = $('#guide .item.selected:visible').hasClass('setting');

            if (isSetting !== true) {
                switch (menu) {
                    case MenuType.Channels:
                    case MenuType.Game:
                        /* Play the channel. */
                        Application.Player.Play(key);
                        return;
                    case MenuType.Games:
                        /* Hide the game menu. */
                        $('.list').eq(MenuType.Game).hide();

                        /* Set the game title */
                        $('.list').eq(MenuType.Game).find('.head').text(key);

                        /* Update the menu. */
                        this.UpdateMenu(Direction.None);

                        /* Set the update type. */
                        this.updateType = UpdateType.Game;

                        /* Load the game search. */
                        Application.Twitch.GetGameChannels(key);

                        return;
                    case MenuType.Videos:
                        /* Play the channel. */
                        Application.Player.Play(key, false, true);
                        return;
                    default:
                        return;
                }
            } else {
                /* Get the setting type. */
                var type = $('#guide .item.selected:visible').attr('type');

                switch (type) {
                    case 'login':
                        /* Register only Global inputs. */
                        Application.Input.RegisterInputs(InputType.Global);

                        $('#login webview').attr('src', 'http://twitch.tv/login');
                        $('#login').fadeIn();
                        break;
                    case 'reset':
                        /* Clear the webview partition data.
                         * Resest the storage values.
                         * Refresh the guide. */
                        Application.Twitch.ClearPartitions(undefined, () => {
                            Application.Storage.LoadDefaults(() => {
                                this.Refresh();
                            });
                        });

                        break;
                }
            }
        }

        // private OpenPopupButton() {
        //     var key = $('.item.selected:visible').attr('key');
        //     var menu = parseInt($('.item.selected:visible').attr('menu'));
        //     var type = $('.popup .button.selected:visible').attr('type');
        //
        //     switch (type) {
        //         case 'view-pip':
        //             /* Play the channel in pip mode. */
        //             Application.Player.Play(key, true);
        //
        //             /* Show the player */
        //             $('#players').fadeIn();
        //
        //             /* Hide the guide */
        //             $('#guide').fadeOut();
        //             break;
        //         case 'search-games':
        //             /* Search for more games of this type. */
        //             Application.Twitch.GetGameChannels(key);
        //             break;
        //         case 'search-videos':
        //             /* Hide the game menu. */
        //             $('.list').eq(MenuType.Videos).hide();
        //
        //             /* Set the game title */
        //             $('.list').eq(MenuType.Videos).find('.head').text(
        //                 Application.Twitch.menus[MenuType.Channels][key].streamer);
        //
        //             /* Set the update type. */
        //             this.updateType = UpdateType.Videos;
        //
        //             /* Search for videos from this streamer */
        //             Application.Twitch.GetChannelVideos(key);
        //             break;
        //         case 'follow-channel':
        //             /* Follow the channel. */
        //             Application.Twitch.FollowChannel(undefined, key);
        //             break;
        //         case 'unfollow-channel':
        //             /* Unfollow the channel. */
        //             Application.Twitch.FollowChannel(undefined, key, true);
        //             break;
        //         case 'follow-game':
        //             /* Follow the game. */
        //             Application.Twitch.FollowGame(undefined, key);
        //             break;
        //         case 'unfollow-game':
        //             /* Unfollow the game. */
        //             Application.Twitch.FollowGame(undefined, key, true);
        //             break;
        //
        //         default:
        //             break;
        //     }
        //
        //     /* Remove the popup menu. */
        //     $('.popup').remove();
        //
        //     this.UpdateMenuScroll();
        // }

        private OnAjaxCompleted(): void {
            /* Update all the menu items. */
            this.UpdateAllMenuItems();

            this.firstUpdate = false;

            var date = new Date();

            /* Set the update time. */
            $('#time .updated').text(date.toLocaleDateString() + ' - ' + date.toLocaleTimeString());

            /* Display the notification window. */
            Application.Notification.Notify();
        }

        private CreateObjectURL(blob): string {
            var objURL = URL.createObjectURL(blob);

            this.objectURLs = this.objectURLs || [];
            this.objectURLs.push(objURL);

            return objURL;
        }

        private LoadImage(url: string, element: JQuery): void {
            var ele: HTMLElement = element[0];
            var xhr: XMLHttpRequest = new XMLHttpRequest();

            xhr.open('GET', url);

            xhr.responseType = 'blob';
            xhr.contentType = 'image/jpg';

            xhr.onload = () => {
                var img = document.createElement('img');
                img.setAttribute('data-src', url);
                var objURL = this.CreateObjectURL(xhr.response);
                img.setAttribute('src', objURL);
                $(element).empty();
                ele.appendChild(img);
            };

            xhr.send();
        }

        private UpdateAllMenuItems(): void {
            switch (this.updateType) {
                case UpdateType.All:
                    this.UpdateMenuItems(MenuType.Channels, this.firstUpdate);
                    this.UpdateMenuItems(MenuType.Games);
                    break;
                case UpdateType.Channels:
                    this.UpdateMenuItems(MenuType.Channels);
                    break;
                case UpdateType.Games:
                    this.UpdateMenuItems(MenuType.Games);
                    break;
                case UpdateType.Game:
                    this.UpdateMenuItems(MenuType.Game, true);
                    break;
                case UpdateType.Videos:
                    this.UpdateMenuItems(MenuType.Videos, true);
                    break;
                default:
                    break;
            }

            this.UpdateMenu(Direction.None);

            this.updateType = UpdateType.All;
        }

        private UpdateMenuItems(menu: MenuType, goto = false) {
            /* Sort the items based on followed and viewers. */
            var sortByFollowedAndViewers = (a: HTMLElement, b: HTMLElement): number => {
                var aIsFollowed = $(a).attr('followed') === 'true';
                var bIsFollowed = $(b).attr('followed') === 'true';

                var aNumber = parseInt($(a).attr('viewers'));
                var bNumber = parseInt($(b).attr('viewers'));

                aNumber += (aIsFollowed === true) ? 999999999 : aNumber;
                bNumber += (bIsFollowed === true) ? 999999999 : bNumber;

                if (aNumber > bNumber)
                    return -1;
                if (aNumber < bNumber)
                    return 1;

                /* Viewers are equal, sort by channels instead. */
                if (aNumber === bNumber) {
                    aNumber = parseInt($(a).attr('channels'));
                    bNumber = parseInt($(b).attr('channels'));

                    aNumber += (aIsFollowed === true) ? 999999999 : aNumber;
                    bNumber += (bIsFollowed === true) ? 999999999 : bNumber;

                    if (aNumber > bNumber)
                        return -1;
                    if (aNumber < bNumber)
                        return 1;

                    /* Channels are equal, sort by key instead. */
                    if (aNumber === bNumber) {
                        var aKey = $(a).attr('key').toLowerCase();
                        var bKey = $(b).attr('key').toLowerCase();

                        aKey += (aIsFollowed === true) ? 'aaaaaaaaa' : aKey;
                        bKey += (bIsFollowed === true) ? 'aaaaaaaaa' : bKey;

                        if (aKey < bKey)
                            return -1;
                        if (aKey > bKey)
                            return 1;
                    }
                }

                return 0;
            };

            /* JQuery menu selector. */
            var jMenu = $('#guide .list').eq(menu);

            /* Save the selected menu item. */
            var selected = jMenu.find('.items .item.selected').toArray()[0];

            /* Is the popup shown? */
            var popup = jMenu.find('#popup:visible').length !== 0;

            /* Save the popup state by moving it to the body and hiding it. */
            if (popup === true) $('#guide .popup').appendTo($('#guide')).hide();

            /* Empty the menu items. */
            jMenu.find('.items').empty();

            var showMenu = false;

            for (var key in Application.Twitch.GetMenu(menu)) {
                showMenu = true;

                var html: JQuery;

                /* Create the menu item based on item type. */
                if (menu === MenuType.Channels ||
                    menu === MenuType.Game)
                    html = this.CreateChannelItem(key, menu);
                else if (menu === MenuType.Games)
                    html = this.CreateGameItem(key);
                else if (menu === MenuType.Videos)
                    html = this.CreateVideoItem(key);

                /* This item was prevoiusly selected. */
                if (html.attr('key') === $(selected).attr('key')) {
                    /* Set it back as selected. */
                    html.addClass('selected');

                    /* Reload the popup's previous state */
                    if (popup === true)
                        $('#popup').appendTo(html).show();
                }

                /* Append the item to the menu. */
                jMenu.find('.items').append(html);
            }

            /* Sort the items. */
            if (menu !== MenuType.Videos)
                jMenu.find('.items .item')
                    .sort(sortByFollowedAndViewers)
                    .appendTo(jMenu.find('.items'));

            if (showMenu === true)
                /* Show the list. */
                jMenu.css('display', 'flex');
            else
                /* Hide the list. */
                jMenu.hide();

            if (goto === true) {
                /* Remove the currently selected list */
                $('#guide .list.selected').removeClass('selected');

                /* Set the new selected list */
                jMenu.addClass('selected');
            }
        }

        private CreateChannelItem(key: string, menu: MenuType): JQuery {
            /* Get the item data. */
            var channel = <Channel>Application.Twitch.GetMenu(menu)[key];

            /* Load the channel item template */
            var html = $($('#channel-item-template').html());

            /* Set the attributes. */
            html.attr({
                'key': key,
                'game': channel.game,
                'menu': menu,
                'viewers': channel.viewers,
                'followed': Application.Twitch.IsFollowing(FollowType.Channel, channel.name),
                'followed-game': Application.Twitch.IsFollowing(FollowType.Game, channel.game)
            });

            /* Set the item streamer. */
            html.find('.streamer').text(channel.streamer);

            /* Set the item game. */
            html.find('.game').text(channel.game);

            return html;
        }

        private CreateGameItem(key: string): JQuery {
            /* Get the game data. */
            var game = <Game>Application.Twitch.GetMenu(MenuType.Games)[key];

            /* Load the game item template */
            var html = $($('#game-item-template').html());

            /* Set the attributes. */
            html.attr({
                key: key,
                menu: MenuType.Games,
                viewers: game.viewers,
                channels: game.channels,
                followed: Application.Twitch.IsFollowing(FollowType.Game, game.name)
            });

            /* Set the item text. */
            html.find('.game').text(game.name);

            return html;
        }

        private CreateVideoItem(key: string): JQuery {
            /* Get the video data. */
            var video = Application.Twitch.GetMenu(MenuType.Videos)[key];

            /* Load the video item template */
            var html = $($('#video-item-template').html());

            /* Set the attributes. */
            html.attr({
                key: key,
                menu: MenuType.Videos,
            });

            /* Set the video streamer. */
            html.find('.streamer').text(video.streamer);

            /* Set the video title. */
            html.find('.title').text(video.title);

            return html;
        }

        private UpdateTime(): void {
            $('#time .current').text(new Date().toLocaleTimeString());

            clearTimeout(this.timeTimeout);

            this.timeTimeout = setTimeout(() => this.UpdateTime(), 1000);
        }

        public UpdateMenu(direction: Direction, delay = 0): void {
            if ($('#guide').is(':visible')) {
                /* Update the selected menu head */
                this.UpdateMenuList(direction);

                /* Update the selected menu item */
                this.UpdateMenuItem(direction);

                /* Update the menu size */
                this.UpdateMenuSize();

                /* Update the mneu scroll position */
                this.UpdateMenuScroll();

                /* Clear timeout */
                clearTimeout(this.infoTimeout);

                this.infoTimeout = setTimeout(() => this.UpdateInfo(), delay);
            }
        }

        private UpdateMenuList(direction: Direction): void {
            /* Get the index of the selected menu list. */
            var index = $('#guide .lists .list:visible').index($('#guide .lists .list.selected'));

            /* Set default head item. */
            if (index === -1)
                index = 0;

            /* Remove selected list item. */
            $('#guide .lists .list.selected').removeClass('selected');

            /* Hide the current visible items list. */
            $('#guide .lists .items:visible').hide();

            /* Update the selected list index. */
            if (direction === Direction.Right && index < $('#guide .lists .head:visible').length - 1)
                index++;
            else if (direction === Direction.Left && index > 0)
                index--;

            /* Select the new list item. */
            $('#guide .lists .list:visible').eq(index).addClass('selected');

            /* Show the selected list items. */
            $('#guide .lists .list.selected .items').show();
        }

        private UpdateMenuItem(direction): void {
            /* Get the index of the selected menu item. */
            var index = $('#guide .item:visible').index($('.item.selected:visible'));

            /* Set default menu item. */
            if (index === -1)
                index = 0;

            /* Remove selected menu item. */
            $('#guide .item.selected:visible').removeClass('selected');

            /* Update the selected item index. */
            if (direction === Direction.Down)
                index++;
            else if (direction === Direction.Up)
                index--;
            else if (direction === Direction.JumpDown)
                index += 10;
            else if (direction === Direction.JumpUp)
                index -= 10;

            /* Constrain the index bounds. */
            if (index < 0)
                index = 0;
            else if (index > $('#guide .items .item:visible').length - 1)
                index = $('#guide .items .item:visible').length - 1;

            /* Select the new menu item. */
            $('#guide .item:visible').eq(index).addClass('selected');
        }

        public UpdateMenuSize(): void {
            var height = $('#guide .lists').outerHeight(true);

            $('#guide .lists .head:visible').each(function() {
                height -= $(this).outerHeight(true);
            });

            $('#guide .lists .items:visible').height(height);
        }

        public UpdateMenuScroll(): void {
            if ($('#guide .items:visible').length !== 0) {
                /* Get the list mid point */
                var mid = $('#guide .items:visible').innerHeight() / 2;

                /* Get half the item height */
                var half = $('#guide .items:visible .item.selected').outerHeight(true) / 2;

                /* Get the top offset */
                var offset = $('#guide .items:visible').offset().top + mid - half;

                /* Update scroll */
                if ($('#guide .items:visible .item.selected').length > 0) {
                    $('#guide .items:visible').scrollTo('#guide .items:visible .item.selected', {
                        offsetTop: offset,
                        duration: 0
                    });
                }
            }
        }

        private UpdateInfo(): void {
            var key = $('#guide .item.selected:visible').attr('key');
            var menu = parseInt($('#guide .item.selected:visible').attr('menu'));

            var isSetting = $('#guide .item.selected:visible').hasClass('setting');

            if (isSetting) {
                var type = $('#guide .item.selected:visible').attr('type');
                this.ShowSetting(type);
            } else {
                if (menu === MenuType.Channels ||
                    menu === MenuType.Game)
                    this.ShowChannel(key, menu);
                else if (menu === MenuType.Videos)
                    this.ShowVideo(key);
                else if (menu === MenuType.Games)
                    this.ShowGame(key);
            }

            $('#info')
                .removeAttr('key menu')
                .attr({
                    'key': key,
                    'menu': menu
                });
        }

        private ShowChannel(key: string, menu: MenuType): void {
            /* Get the channel data. */
            var channel = <Channel>Application.Twitch.GetMenu(menu)[key];

            /* Get the item template. */
            var html = $($('#channel-template').html());

            $(html).find('.title').text(channel.title);
            $(html).find('.game').text(channel.game);
            $(html).find('.streamer').text(channel.streamer);
            $(html).find('.viewers').text(Utils.Format('{0} viewers', Utils.Deliminate(channel.viewers, ',')));

            this.LoadImage(channel.preview, $(html).find('.preview'));

            $('#info').empty();
            $('#info').append(html);
        }

        private ShowGame(key: string): void {
            /* Get the game data. */
            var game = <Game>Application.Twitch.GetMenu(MenuType.Games)[key];

            /* Get the item template. */
            var html = $($('#game-template').html());

            html.find('.game').text(game.name);
            html.find('.channels').text(Utils.Format('{0} channels', Utils.Deliminate(game.channels, ',')));
            html.find('.viewers').text(Utils.Format('{0} viewers', Utils.Deliminate(game.viewers, ',')));

            this.LoadImage(game.boxArt, $(html).find('.boxart'));

            $('#info').empty();
            $('#info').append(html);

            if (game.viewers === -1) html.find('.viewers').remove();
            if (game.channels === -1) html.find('.channels').remove();

            if (game.viewers === -1 && game.channels === -1) {
                $('#info .sub-head').remove();
                $('#info .head').css('border-bottom', 'none');
            }
        }

        private ShowVideo(data): void {
            if (data === undefined)
                return;

            /* Get the video template */
            var html = $($('#video-template').html());

            $(html).find('.video').text(data.title || '');
            $(html).find('.streamer').text(data.streamer);
            $(html).find('.length').text(data.length.toString().secondsToTime());
            $(html).find('.views').text(data.views.deliminate(',') + ' views');
            this.LoadImage(data.preview, $(html).find('.preview'));

            $('#info').empty();
            $('#info').append(html);
        }

        private ShowSetting(setting): void {
            /* Only update settings if the menu has actually changed. */
            if ($('#info').attr('menu') === 'settings' &&
                $('#info').attr('type') === setting)
                return;

            var html = $($('#' + setting + '-setting-template').html());

            $('#info').empty();
            $('#info').append(html);
        }

        // private ShowPopup(): void {
        //     /* Close the popup if shown. */
        //     if ($('#guide .popup:visible').length !== 0) {
        //         $('#guide .popup').remove();
        //         this.UpdateMenuScroll();
        //         return;
        //     }
        //
        //     $('#guide .popup').remove();
        //
        //     var item = $('#guide .lists .item.selected:visible');
        //
        //     var popup = $($('#popup-template').html());
        //
        //     popup.appendTo(item);
        //
        //     var menu = parseInt(item.attr('menu'));
        //
        //     var followedChannel = false;
        //     var followedGame = false;
        //
        //     /* Popup menu is disabled for videos. */
        //     if (menu === MenuType.Videos) return
        //
        //     /* Update follow-channel button. */
        //     if (menu === MenuType.Channels) {
        //         followedChannel = (item.attr('followed') === 'true') ? true : false;
        //         followedGame = (item.attr('followed-game') === 'true') ? true : false;
        //     }
        //
        //     if (menu === MenuType.Games) {
        //         followedGame = (item.attr('followed') === 'true') ? true : false;
        //
        //         /* Remove unused buttons. */
        //         popup.find('.search-games').remove();
        //         popup.find('.search-videos').remove();
        //         popup.find('.view-pip').remove();
        //         popup.find('.follow-channel').remove();
        //         popup.find('.unfollow-channel').remove();
        //     }
        //
        //     /* Update follow-channel button. */
        //     if (followedChannel) {
        //         popup.find('.follow-channel').remove();
        //         popup.find('.unfollow-channel').show();
        //     } else {
        //         popup.find('.follow-channel').show();
        //         popup.find('.unfollow-channel').remove();
        //     }
        //
        //     /* Update follow-game button. */
        //     if (followedGame) {
        //         popup.find('.follow-game').remove();
        //         popup.find('.unfollow-game').show();
        //     } else {
        //         popup.find('.follow-game').show();
        //         popup.find('.unfollow-game').remove();
        //     }
        //
        //     if ($('#guide .popup .button.selected:visible').length === 0) {
        //         $('#guide .popup .button:eq(0)').addClass('selected');
        //     }
        //
        //     popup.show();
        //
        //     this.UpdateMenuScroll();
        // }

        // private UpdatePopupButton(direction): void {
        //     /* Get the index of the selected menu item. */
        //     var index = $('.popup .button:visible').index($('.popup .button.selected:visible'));
        //
        //     /* Set default menu item. */
        //     if (index === -1)
        //         index = 0;
        //
        //     /* Remove selected menu item. */
        //     $('.popup .button.selected:visible').removeClass('selected');
        //
        //     /* Update the selected item index. */
        //     if (direction === Direction.Down && index < $('.popup .button:visible').length - 1) {
        //         index++;
        //     } else if (direction === Direction.Up && index > 0) {
        //         index--;
        //     }
        //
        //     /* Select the new menu item. */
        //     $('.popup .button:visible').eq(index).addClass('selected');
        // }

        public Refresh(skipFollowed = false): void {
            clearTimeout(this.refreshTimeout);

            Application.Twitch.Refresh(skipFollowed);

            this.refreshTimeout = setTimeout(() => this.Refresh(), 1000 * 60);
        }
    }
}
