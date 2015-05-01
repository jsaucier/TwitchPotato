module TwitchPotato {
    export class GuideHandler {
        private firstUpdate = true;
        private infoTimeout: number;
        private selectedItem = '#guide .list.selected .item.selected';
        private updateType: UpdateType = UpdateType.All;

        /** Determines if the guide is shown. */
        private isShown = true;

        ContextMenu = new ContextMenuHandler();
        FollowMenu = new FollowMenuHandler();
        Timer = new TimerHandler();
        Content = new ContentHandler();

        constructor() {
            window.addEventListener('resize', () => this.UpdateMenuSize());

            /** Update the version */
            $('#time .version').text('v{0}'.format(chrome.runtime.getManifest().version));

            $(document).ajaxStop(() => this.OnAjaxCompleted());

            this.UpdateMenu(Direction.None);
        }

        HandleInput(input: Inputs): boolean {
            /** If the guide isn't shown, exit the function. */
            if (!this.isShown) return;

            /** The selected menu item. */
            var item = $(this.selectedItem);

            if (this.FollowMenu.HandleInput(input, item))
                return true;
            else if (this.ContextMenu.HandleInput(input, item))
                return true;
            else {
                switch (input) {
                    case Inputs.Up:
                        this.UpdateMenu(Direction.Up, 200);
                        return true;
                    case Inputs.Down:
                        this.UpdateMenu(Direction.Down, 200);
                        return true;
                    case Inputs.Left:
                        this.UpdateMenu(Direction.Left, 200);
                        return true;
                    case Inputs.Right:
                        this.UpdateMenu(Direction.Right, 200);
                        return true;
                    case Inputs.PageUp:
                        this.UpdateMenu(Direction.JumpUp, 200);
                        return true;
                    case Inputs.PageDown:
                        this.UpdateMenu(Direction.JumpDown, 200);
                        return true;
                    case Inputs.Select:
                        this.OpenMenuItem();
                        return true;
                    case Inputs.Refresh:
                        this.Refresh();
                        return true;
                    case Inputs.ContextMenu:
                        this.ContextMenu.Show($(this.selectedItem));
                        return true;
                    default:
                        return false;
                }
            }
        }

        /** Sets the guide update type. */
        SetUpdateType(updateType: UpdateType): void {
            this.updateType = updateType;
        }

        /** Shows the guide. */
        Toggle(showOrHide?: boolean, fade = true): void {
            if (showOrHide === undefined)
                showOrHide = !this.isShown;

            if (fade === true)
                if (showOrHide === true)
                    $('#guide').fadeIn();
                else
                    $('#guide').fadeOut();
            else
                $('#guide').toggle(showOrHide);

            this.isShown = showOrHide;
        }

        /** Gets if the guide is shown. */
        IsShown(): boolean {
            return this.isShown;
        }

        private OpenMenuItem(): void {
            var isSetting = $(this.selectedItem).attr('setting') === 'true';

            if (isSetting !== true) {
                var key = $(this.selectedItem).attr('key');
                var menu = parseInt($(this.selectedItem).attr('menu'));

                switch (menu) {
                    case MenuType.Channels:
                    case MenuType.Game:
                        /** Play the channel. */
                        App.Player.Play(key);

                        /** Stop the preivew. */
                        return PostMessage(this.Content.PreviewWebview(),
                            'PauseVideo');
                    case MenuType.Games:
                        /** Hide the game menu. */
                        $('.list').eq(MenuType.Game).hide();

                        /** Set the game title */
                        $('.list').eq(MenuType.Game).find('.head').text(key);

                        /** Update the menu. */
                        this.UpdateMenu(Direction.None);

                        /** Set the update type. */
                        this.updateType = UpdateType.Game;

                        /** Load the game search. */
                        return App.Twitch.GetGameChannels(key);
                    case MenuType.Videos:
                        /** Play the channel. */
                        App.Player.Play(key, false, true);

                        /** Stop the preivew. */
                        return PostMessage(this.Content.PreviewWebview(),
                            'PauseVideo');
                    default:
                        return;
                }
            } else {

                /** Get the setting type. */
                var type = $(this.selectedItem).attr('type');

                switch (type) {
                    case 'login':
                        /** Log into Twitch.tv. */
                        return App.Login();
                    case 'reset':
                        /** Reset the application settings. */
                        return App.Reset();
                }
            }
        }

        private OnAjaxCompleted(): void {
            if (this.updateType === UpdateType.Refresh)
                return this.Refresh();

            /** Start the refresh timer. */
            this.Timer.Refresh();

            /** Update all the menu items. */
            this.UpdateAllMenuItems();

            /** Display the notification window. */
            App.Notification.Notify();

            /** Hide the loading screen. */
            App.Loading(false);

            this.firstUpdate = false;
        }

        private UpdateAllMenuItems(): void {
            switch (this.updateType) {
                case UpdateType.All:
                    this.UpdateMenuItems(MenuType.Channels, this.firstUpdate);
                    this.UpdateMenuItems(MenuType.Games);
                    this.UpdateMenuItems(MenuType.Game);
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
        }

        private UpdateMenuItems(menu: MenuType, goto = false) {

            var sortChannels = (a: string, b: string): number => {
                var aItem: IChannel,
                    bItem: IChannel;

                aItem = <IChannel>App.Twitch.GetMenu(menu)[a];
                bItem = <IChannel>App.Twitch.GetMenu(menu)[b];

                var aIsFollowed = App.Twitch.IsFollowing(FollowType.Channel, a);
                var bIsFollowed = App.Twitch.IsFollowing(FollowType.Channel, b);

                var aNumber = aItem.viewers;
                var bNumber = bItem.viewers;

                aNumber += (aIsFollowed === true) ? 999999999 : aNumber;
                bNumber += (bIsFollowed === true) ? 999999999 : bNumber;

                if (aNumber > bNumber)
                    return -1;
                if (aNumber < bNumber)
                    return 1;

                /** Viewers are equal, sort by streamer instead. */
                if (aNumber === bNumber) {
                    a += (aIsFollowed === true) ? 'aaaaaaaaa' : a;
                    b += (bIsFollowed === true) ? 'aaaaaaaaa' : b;

                    if (a < b)
                        return -1;
                    if (a > b)
                        return 1;
                }

                return 0;
            };

            var sortGames = (a: string, b: string): number => {
                var aItem: IGame,
                    bItem: IGame;

                aItem = <IGame>App.Twitch.GetMenu(menu)[a];
                bItem = <IGame>App.Twitch.GetMenu(menu)[b];

                var aIsFollowed = App.Twitch.IsFollowing(FollowType.Game, a);
                var bIsFollowed = App.Twitch.IsFollowing(FollowType.Game, b);

                var aIsHidden = App.Storage.IsGameHidden(a);
                var bIsHidden = App.Storage.IsGameHidden(b);

                var aNumber = aItem.viewers;
                var bNumber = bItem.viewers;

                if (aIsFollowed === true) aNumber += 999999999;
                else if (aIsHidden === true) aNumber += 99999999;
                if (bIsFollowed === true) bNumber += 999999999;
                else if (bIsHidden === true) bNumber += 99999999;

                if (aNumber > bNumber)
                    return -1;
                if (aNumber < bNumber)
                    return 1;

                /** Viewers are equal, sort by channels instead. */
                if (aNumber === bNumber) {
                    aNumber = aItem.channels;
                    bNumber = bItem.channels;

                    if (aIsFollowed === true) aNumber += 999999999;
                    else if (aIsHidden === true) aNumber += 99999999;
                    if (bIsFollowed === true) bNumber += 999999999;
                    else if (bIsHidden === true) bNumber += 99999999;

                    if (aNumber > bNumber)
                        return -1;
                    if (aNumber < bNumber)
                        return 1;

                    /** Channels are equal, sort by key instead. */
                    if (aNumber === bNumber) {
                        a += (aIsFollowed === true) ? 'aaaaaaaaa' : a;
                        b += (bIsFollowed === true) ? 'aaaaaaaaa' : b;

                        if (a < b)
                            return -1;
                        if (a > b)
                            return 1;
                    }
                }

                return 0;
            };

            /** JQuery menu selector. */
            var jMenu = $('#guide .list').eq(menu);

            /** Save the selected menu item. */
            var selected = jMenu.find('.items .item.selected').toArray()[0];

            var contextMenu = jMenu.find('#context-menu .button.selected').attr('type');
            var followMenu = jMenu.find('#follow-menu .button.selected').attr('user');

            /** Empty the menu items. */
            jMenu.find('.items').empty();

            var showMenu = false;

            var menuItems: string[] = [];

            for (var key in App.Twitch.GetMenu(menu))
                menuItems.push(key);

            if (menu === MenuType.Channels || menu === MenuType.Game)
                menuItems.sort(sortChannels);
            else if (menu === MenuType.Games)
                menuItems.sort(sortGames);

            for (var i = 0; i < menuItems.length; i++) {
                key = menuItems[i];

                showMenu = true;

                var html: JQuery;

                /** Create the menu item based on item type. */
                if (menu === MenuType.Channels ||
                    menu === MenuType.Game)
                    html = this.CreateChannelItem(key, menu);
                else if (menu === MenuType.Games)
                    html = this.CreateGameItem(key);
                else if (menu === MenuType.Videos)
                    html = this.CreateVideoItem(key);

                /** This item was prevoiusly selected. */
                if (key === $(selected).attr('key')) html.addClass('selected');

                /** Append the item to the menu. */
                jMenu.find('.items').append(html);
            }

            /** Reload the context menu's previous state */
            if (contextMenu !== undefined)
                this.ContextMenu.Update($(this.selectedItem), contextMenu);

            /** Reload the follow menu's previous state */
            if (followMenu !== undefined)
                this.FollowMenu.Update($(this.selectedItem), followMenu);

            if (showMenu === true)
                /** Show the list. */
                jMenu.css('display', 'flex');
            else
                /** Hide the list. */
                jMenu.hide();

            if (goto === true) {
                /** Remove the currently selected list */
                $('#guide .list.selected').removeClass('selected');

                /** Select the first item in the list. */
                jMenu.find('.items')
                    .removeClass('selected')
                    .eq(0).addClass('selected');

                /** Set the new selected list */
                jMenu.addClass('selected');
            }
        }

        private CreateChannelItem(key: string, menu: MenuType): JQuery {
            /** Get the item data. */
            var channel = <IChannel>App.Twitch.GetMenu(menu)[key];

            /** Load the channel item template */
            var html = $($('#channel-item-template').html());

            /** Gets whether the channel is followed. */
            var followed = App.Twitch.IsFollowing(FollowType.Channel, channel.name);

            /** Gets whether the game is hidden. */
            var hidden = App.Storage.IsGameHidden(channel.game);

            /** Ignore hidden games that are not followed. */
            if (followed === false && hidden === true && menu !== MenuType.Game) return;

            /** Set the attributes. */
            html.attr({
                'key': key,
                'game': channel.game,
                'menu': menu,
                'viewers': channel.viewers,
                'followed': followed,
                'followed-game': App.Twitch.IsFollowing(FollowType.Game, channel.game),
            });

            /** Set the item streamer. */
            html.find('.streamer').text(channel.streamer);

            /** Set the item game. */
            html.find('.game').text(channel.game);

            return html;
        }

        private CreateGameItem(key: string): JQuery {
            /** Get the game data. */
            var game = <IGame>App.Twitch.GetMenu(MenuType.Games)[key];

            /** Load the game item template */
            var html = $($('#game-item-template').html());

            /** Set the attributes. */
            html.attr({
                'key': key,
                'menu': MenuType.Games,
                'viewers': game.viewers,
                'channels': game.channels,
                'followed': App.Twitch.IsFollowing(FollowType.Game, game.name),
                'hide': App.Storage.IsGameHidden(game.name)
            });

            /** Set the item text. */
            html.find('.game').text(game.name);

            return html;
        }

        private CreateVideoItem(key: string): JQuery {
            /** Get the video data. */
            var video = App.Twitch.GetMenu(MenuType.Videos)[key];

            /** Load the video item template */
            var html = $($('#video-item-template').html());

            /** Set the attributes. */
            html.attr({
                'key': key,
                'menu': MenuType.Videos,
            });

            /** Set the video streamer. */
            html.find('.streamer').text(video.streamer);

            /** Set the video title. */
            html.find('.title').text(video.title);

            return html;
        }

        UpdateMenu(direction: Direction, delay = 0): void {

            if (this.isShown === true) {

                if (direction === Direction.Left ||
                    direction === Direction.Right ||
                    direction === Direction.None)
                    /** Update the selected menu head */
                    this.UpdateMenuList(direction);

                /** Update the selected menu item */
                this.UpdateMenuItem(direction);

                /** Update the menu size */
                this.UpdateMenuSize();

                /** Update the mneu scroll position */
                this.UpdateMenuScroll();

                /** Clear timeout */
                clearTimeout(this.infoTimeout);

                this.infoTimeout = setTimeout(() => this.Content.UpdateInfo(), delay);
            }
        }

        private UpdateMenuList(direction: Direction): void {

            /** Get the index of the selected menu list. */
            var index = $('#guide .lists .list:visible').index($('#guide .lists .list.selected'));

            /** Set default head item. */
            if (index === -1)
                index = 0;

            /** Remove selected list item. */
            $('#guide .lists .list.selected').removeClass('selected');

            /** Hide the current visible items list. */
            $('#guide .lists .items').attr('hide', 'true').hide();

            /** Update the selected list index. */
            if (direction === Direction.Right && index < $('#guide .lists .head:visible').length - 1)
                index++;
            else if (direction === Direction.Left && index > 0)
                index--;

            /** Select the new list item. */
            $('#guide .lists .list:visible').eq(index).addClass('selected');

            /** Show the selected list items. */
            $('#guide .lists .list.selected .items').attr('hide', 'false').show();
        }

        private UpdateMenuItem(direction): void {
            /** Get the index of the selected menu item. */
            var index = $('#guide .list.selected .item').index($('#guide .list.selected .item.selected'));

            /** Set default menu item. */
            if (index === -1)
                index = 0;

            /** Remove selected menu item. */
            $('#guide .list.selected .item.selected').removeClass('selected');

            /** Update the selected item index. */
            if (direction === Direction.Down)
                index++;
            else if (direction === Direction.Up)
                index--;
            else if (direction === Direction.JumpDown)
                index += 10;
            else if (direction === Direction.JumpUp)
                index -= 10;

            var max = $('#guide .list.selected .items .item').length - 1;

            /** Constrain the index bounds. */
            if (index < 0)
                index = 0;
            else if (index > max)
                index = max

            /** Select the new menu item. */
            $('#guide .list.selected .item').eq(index).addClass('selected');
        }

        UpdateMenuSize(): void {
            var height = $('#guide .lists').outerHeight(true);

            $('#guide .lists .head[hide="false"]').each(function() {
                height -= $(this).outerHeight(true);
            });

            $('#guide .list.selected .items').height(height);
        }

        UpdateMenuScroll(): void {
            if ($('#guide .list.selected .items').length !== 0) {
                /** Get the list mid point */
                var mid = $('#guide .list.selected .items').innerHeight() / 2;

                /** Get half the item height */
                var half = $('#guide .list.selected .item.selected').outerHeight(true) / 2;

                /** Get the top offset */
                var offset = $('#guide .list.selected .items').offset().top + mid - half;

                /** Update scroll */
                if ($('#guide .list.selected .items .item.selected').length > 0) {
                    $('#guide .list.selected .items').scrollTo('#guide .list.selected .items .item.selected', {
                        offsetTop: offset,
                        duration: 0
                    });
                }
            }
        }

        Refresh(skipFollowed = false): void {
            App.Twitch.Refresh(skipFollowed);
        }
    }
}
