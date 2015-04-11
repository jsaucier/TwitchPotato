module TwitchPotato {
    "use strict";

    export class GuideHandler {
        private objectURLs: string[] = [];
        private firstUpdate = true;
        private refreshTimeout: number;
        private timeTimeout: number;
        private infoTimeout: number;
        private selectedItem = '#guide .item.selected:visible';
        private updateType: UpdateType = UpdateType.All;
        private preview: Webview;
        private previewChannel: string;
        private useImagePreview = true;

        ContextMenu = new ContextMenuHandler();
        FollowMenu = new FollowMenuHandler();

        constructor() {
            /** Initialize the preview player. */
            this.InitializePreview();

            /** Update the version */
            $('#time .version').text('v{0}'.format(chrome.runtime.getManifest().version));

            /** Start the time timer. */
            this.UpdateTime();

            $(document).ajaxStop(() => this.OnAjaxCompleted());

            this.UpdateMenu(Direction.None);
        }

        OnInput(input: Input): void {
            /** The selected menu item. */
            var item = $(this.selectedItem);

            if (this.FollowMenu.HandleInput(input, item) !== true)
                if (this.ContextMenu.HandleInput(input, item) !== true) {
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

        /** Sets the guide update type. */
        SetUpdateType(updateType: UpdateType): void {
            this.updateType = updateType;
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
                        Application.Player.Play(key);

                        /** Stop the preivew. */
                        return this.PostMessage('PauseVideo');
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
                        return Application.Twitch.GetGameChannels(key);
                    case MenuType.Videos:
                        /** Play the channel. */
                        Application.Player.Play(key, false, true);

                        /** Stop the preivew. */
                        return this.PostMessage('PauseVideo');
                    default:
                        return;
                }
            } else {

                /** Get the setting type. */
                var type = $(this.selectedItem).attr('type');

                switch (type) {
                    case 'login':
                        /** Log into Twitch.tv. */
                        return Application.Login();
                    case 'reset':
                        /** Reset the application settings. */
                        return Application.Reset();
                }
            }
        }

        private OnAjaxCompleted(): void {
            if (this.updateType === UpdateType.Refresh)
                return this.Refresh();

            /** Start the refresh timer. */
            this.StartRefreshTimer();

            /** Update all the menu items. */
            this.UpdateAllMenuItems();

            /** Display the notification window. */
            Application.Notification.Notify();

            /** Hide the loading screen. */
            Application.Loading(false);

            this.firstUpdate = false;
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
        }

        private UpdateMenuItems(menu: MenuType, goto = false) {
            /** Sort the items based on followed and viewers. */
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

                /** Viewers are equal, sort by channels instead. */
                if (aNumber === bNumber) {
                    aNumber = parseInt($(a).attr('channels'));
                    bNumber = parseInt($(b).attr('channels'));

                    aNumber += (aIsFollowed === true) ? 999999999 : aNumber;
                    bNumber += (bIsFollowed === true) ? 999999999 : bNumber;

                    if (aNumber > bNumber)
                        return -1;
                    if (aNumber < bNumber)
                        return 1;

                    /** Channels are equal, sort by key instead. */
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

            /** JQuery menu selector. */
            var jMenu = $('#guide .list').eq(menu);

            /** Save the selected menu item. */
            var selected = jMenu.find('.items .item.selected').toArray()[0];

            var contextMenu = jMenu.find('#context-menu .button.selected').attr('type');
            var followMenu = jMenu.find('#follow-menu .button.selected').attr('user');

            /** Empty the menu items. */
            jMenu.find('.items').empty();

            var showMenu = false;

            for (var key in Application.Twitch.GetMenu(menu)) {
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

            /** Sort the items. */
            if (menu !== MenuType.Videos)
                jMenu.find('.items .item')
                    .sort(sortByFollowedAndViewers)
                    .appendTo(jMenu.find('.items'));

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
            var channel = <Channel>Application.Twitch.GetMenu(menu)[key];

            /** Load the channel item template */
            var html = $($('#channel-item-template').html());

            /** Set the attributes. */
            html.attr({
                'key': key,
                'game': channel.game,
                'menu': menu,
                'viewers': channel.viewers,
                'followed': Application.Twitch.IsFollowing(FollowType.Channel, channel.name),
                'followed-game': Application.Twitch.IsFollowing(FollowType.Game, channel.game)
            });

            /** Set the item streamer. */
            html.find('.streamer').text(channel.streamer);

            /** Set the item game. */
            html.find('.game').text(channel.game);

            return html;
        }

        private CreateGameItem(key: string): JQuery {
            /** Get the game data. */
            var game = <Game>Application.Twitch.GetMenu(MenuType.Games)[key];

            /** Load the game item template */
            var html = $($('#game-item-template').html());

            /** Set the attributes. */
            html.attr({
                key: key,
                menu: MenuType.Games,
                viewers: game.viewers,
                channels: game.channels,
                followed: Application.Twitch.IsFollowing(FollowType.Game, game.name)
            });

            /** Set the item text. */
            html.find('.game').text(game.name);

            return html;
        }

        private CreateVideoItem(key: string): JQuery {
            /** Get the video data. */
            var video = Application.Twitch.GetMenu(MenuType.Videos)[key];

            /** Load the video item template */
            var html = $($('#video-item-template').html());

            /** Set the attributes. */
            html.attr({
                key: key,
                menu: MenuType.Videos,
            });

            /** Set the video streamer. */
            html.find('.streamer').text(video.streamer);

            /** Set the video title. */
            html.find('.title').text(video.title);

            return html;
        }

        private UpdateTime(): void {
            $('#time .current').text(new Date().toLocaleTimeString());

            clearTimeout(this.timeTimeout);

            this.timeTimeout = setTimeout(() => this.UpdateTime(), 1000);
        }

        UpdateMenu(direction: Direction, delay = 0): void {
            if ($('#guide').is(':visible')) {
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

                this.infoTimeout = setTimeout(() => this.UpdateInfo(), delay);
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
            $('#guide .lists .items:visible').hide();

            /** Update the selected list index. */
            if (direction === Direction.Right && index < $('#guide .lists .head:visible').length - 1)
                index++;
            else if (direction === Direction.Left && index > 0)
                index--;

            /** Select the new list item. */
            $('#guide .lists .list:visible').eq(index).addClass('selected');

            /** Show the selected list items. */
            $('#guide .lists .list.selected .items').show();
        }

        private UpdateMenuItem(direction): void {
            /** Get the index of the selected menu item. */
            var index = $('#guide .item:visible').index($('.item.selected:visible'));

            /** Set default menu item. */
            if (index === -1)
                index = 0;

            /** Remove selected menu item. */
            $('#guide .item.selected:visible').removeClass('selected');

            /** Update the selected item index. */
            if (direction === Direction.Down)
                index++;
            else if (direction === Direction.Up)
                index--;
            else if (direction === Direction.JumpDown)
                index += 10;
            else if (direction === Direction.JumpUp)
                index -= 10;

            /** Constrain the index bounds. */
            if (index < 0)
                index = 0;
            else if (index > $('#guide .items .item:visible').length - 1)
                index = $('#guide .items .item:visible').length - 1;

            /** Select the new menu item. */
            $('#guide .item:visible').eq(index).addClass('selected');
        }

        UpdateMenuSize(): void {
            var height = $('#guide .lists').outerHeight(true);

            $('#guide .lists .head:visible').each(function() {
                height -= $(this).outerHeight(true);
            });

            $('#guide .lists .items:visible').height(height);
        }

        UpdateMenuScroll(): void {
            if ($('#guide .items:visible').length !== 0) {
                /** Get the list mid point */
                var mid = $('#guide .items:visible').innerHeight() / 2;

                /** Get half the item height */
                var half = $('#guide .items:visible .item.selected').outerHeight(true) / 2;

                /** Get the top offset */
                var offset = $('#guide .items:visible').offset().top + mid - half;

                /** Update scroll */
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

            if ($('#guide .item.selected:visible').attr('setting') === 'true')
                return this.ShowSetting();

            if (menu === MenuType.Channels ||
                menu === MenuType.Game)
                this.ShowChannel(key, menu);
            else if (menu === MenuType.Videos)
                this.ShowVideo(key);
            else if (menu === MenuType.Games)
                this.ShowGame(key);
        }

        private ShowChannel(key: string, menu: MenuType): void {
            /** Get the channel data. */
            var channel = <Channel>Application.Twitch.GetMenu(menu)[key];

            /** The channel head template. */
            var head = $('#channel-info-head-template').html().format(
                channel.streamer,
                channel.title,
                channel.game,
                channel.viewers.deliminate());

            /** Append the head html to the document. */
            $('#info .head').html(head);

            /** Load the channel preview. */
            this.LoadPreview(key, channel.preview);
        }

        private ShowGame(key: string): void {
            /** Get the game data. */
            var game = <Game>Application.Twitch.GetMenu(MenuType.Games)[key];

            /** The game head template. */
            var head = $('#game-info-head-template').html().format(
                game.name,
                game.channels.deliminate(),
                game.viewers.deliminate());

            /** Append the head html to the document. */
            $('#info .head').html(head);

            /** Load the channel preview. */
            this.LoadPreview(key, game.boxArt, true);
        }

        private ShowVideo(key: string): void {
            /** Get the video data. */
            var video = <Video>Application.Twitch.GetMenu(MenuType.Videos)[key];

            /** The game head template. */
            var head = $('#video-info-head-template').html().format(
                video.title,
                video.streamer,
                video.length.formatSeconds(),
                video.views.deliminate());

            /** Append the head html to the document. */
            $('#info .head').html(head);

            /** Load the channel preview. */
            this.LoadPreview(key, video.preview, this.useImagePreview, true);
        }

        private ShowSetting(): void {
            /** Get the setting type. */
            var type = $(this.selectedItem).attr('type');

            /** Determine if this is an input setting. */
            var isInput = $(this.selectedItem).attr('input') === 'true';

            /** Get the setting template. */
            var head = $('#{0}-setting-template'.format(type)).html();

            /** Append the head hmtl to the document. */
            $('#info .head').html(head);

            /** Clear the content .div */
            $('#info .content').empty().show();

            /** Create the input if needed. */
            if (isInput === true)
                $('#info .content')
                    .append($('<input>')
                        .attr('id', type))

            /** Hide the preview div. */
            $('#preview').hide();
        }

        Refresh(skipFollowed = false): void {
            Application.Twitch.Refresh(skipFollowed);
        }

        private StartRefreshTimer(): void {
            /** Set the update time. */
            var date = new Date();
            $('#time .updated').text('{0} - {1}'.format(date.toLocaleDateString(), date.toLocaleTimeString()));

            /** Restart the refresh timer. */
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = setTimeout(() => this.Refresh(), 1000 * 60);
        }

        /**
         * Initialize the guide preview player.
         */
        private InitializePreview() {
            this.preview = <Webview>$('#preview webview')[0]

            this.preview.addEventListener('loadcommit', () => {
                /** Inject the script files. */
                this.preview.executeScript({ file: 'js/jquery-2.1.1.min.js' });
                this.preview.executeScript({ file: 'js/inject.js' });

                /** Hook the console message event. */
                this.preview.addEventListener('consolemessage', (e) => ConsoleMessage(e));
            });
        }

        /**
         * Loads the preview video.
         */
        LoadPreview(channel: string, imageUrl: string, useImage = false, isVideo = false): void {
            /** Remove any preview images. */
            $('#info #preview img').remove();

            /** Hide the content div. */
            $('#info .content').hide();

            /** Hide the preview video. */
            $(this.preview).hide();

            /** Show the preview div. */
            $('#info #preview').show();

            /** Load the preview image. */
            if (this.useImagePreview === true || useImage === true)
                return this.LoadImage(imageUrl, $('#info #preview'));

            /** Show the preview video. */
            $(this.preview).show();

            /** Only load the channel if it is not loaded. */
            if (channel === this.previewChannel) return;

            /** Load the preview video. */
            this.PostMessage('LoadPreview', { channel: channel, isVideo: isVideo });

            /** Set the current preview channel. */
            this.previewChannel = channel;
        }

        /**
         * Pause the preview video.
         */
        PausePreview(): void {
            this.PostMessage('PauseVideo');
        }

        /**
         * Play the preview video.
         */
        PlayPreview(): void {
            this.PostMessage('PlayVideo');
        }

        /**
         * Post a message containing a method and params to the preview player.
         */
        private PostMessage(method: string, params = {}): void {
            /** Video previews are disabled. */
            if (this.useImagePreview === true) return;

            /** Make sure the contentwindow is loaded. */
            if (this.preview.contentWindow === undefined) {
                setTimeout(() => this.PostMessage(method, params), 100);
                return;
            }

            /** Data to be posted. */
            var data = {
                method: method,
                params: params
            };

            /** Post the data to the client application. */
            setTimeout(() => this.preview.contentWindow.postMessage(JSON.stringify(data), '*'), 100);
        }
    }
}
