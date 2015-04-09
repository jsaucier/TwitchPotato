module TwitchPotato {
    export class ContextMenuHandler {
        /** Gets the #contextmenu jQuery element. */
        private contextMenu = '#guide #context-menu';
        private selectedButton = '#guide #context-menu .button.selected:visible';

        public HandleInput(input: Input, item: JQuery): boolean {
            /* Context menu is not visible, return false. */
            if ($(this.contextMenu).length === 0) return false;

            switch (input.input) {
                case Inputs.Guide_ContextMenu:
                    this.Show(item);
                    break;
                case Inputs.Guide_Up:
                    this.UpdateButton(Direction.Up);
                    break;
                case Inputs.Guide_Down:
                    this.UpdateButton(Direction.Down);
                    break;
                case Inputs.Guide_Select:
                    this.SelectButton(item);
                    break;
                default:
                    break;
            }

            return true;
        }

        /**
         * Shows the context menu for the item.
         */
        public Show(item: JQuery): void {
            if ($(this.contextMenu).length !== 0) {
                /* Remove the context menu from the DOM. */
                $(this.contextMenu).remove();

                return;
            }

            /* Get the item menu. */
            var menu = parseInt(item.attr('menu'));

            /* Context menu is disabled for videos. */
            if (menu === MenuType.Videos) return;

            /** The context menu template. */
            var html = $($('#context-menu-template').html());

            var followedChannel = false;
            var followedGame = false;

            /* Update the menu buttons. */
            if (menu === MenuType.Channels) {
                followedChannel = item.attr('followed') === 'true';
                followedGame = item.attr('followed=game') === 'true';
            } else if (menu === MenuType.Games) {
                followedGame = item.attr('followed') === 'true';

                /* Remove unused buttons. */
                html.find('.search-games').remove();
                html.find('.search-videos').remove();
                html.find('.view-pip').remove();
                html.find('.follow-channel').remove();
                html.find('.unfollow-channel').remove();
            }

            /* Update follow-channel button. */
            if (followedChannel) {
                html.find('.follow-channel').remove();
                html.find('.unfollow-channel').show();
            } else {
                html.find('.follow-channel').show();
                html.find('.unfollow-channel').remove();
            }

            /* Update follow-game button. */
            if (followedGame) {
                html.find('.follow-game').remove();
                html.find('.unfollow-game').show();
            } else {
                html.find('.follow-game').show();
                html.find('.unfollow-game').remove();
            }

            /* Select the first button. */
            html.find('button:eq(0)').addClass('selected');

            /* Appened the context menu to the item. */
            html.appendTo(item);

            /* Guide the guide menu. */
            Application.Guide.UpdateMenuScroll();
        }

        /**
         * Update the selected button.
         */
        private UpdateButton(direction: Direction): void {
            /** The index of the selected menu item. */
            var index = $(this.contextMenu).find('.button:visible')
                .index($(this.selectedButton));

            /* Set default menu item. */
            if (index === -1)
                index = 0;

            /* Remove selected menu item. */
            $(this.selectedButton).removeClass('selected');

            /* Update the selected item index. */
            if (direction === Direction.Down)
                index++;
            else if (direction === Direction.Up)
                index--;

            /* Set the bounds for the index. */
            if (index < 0)
                index = 0;
            if (index > $(this.contextMenu).find('.button:visible').length - 1)
                index = $(this.contextMenu).find('.button:visible').length - 1;

            /* Select the new menu item. */
            $(this.contextMenu)
                .find('.button:visible')
                .eq(index).addClass('selected');
        }

        /**
         * Selects the button.
         */
        private SelectButton(item: JQuery): void {
            /** The key of the selected item. */
            var key = item.attr('key');
            /** The menu type of the selected item. */
            var menu = parseInt(item.attr('menu'));
            /** The button type that is selected. */
            var type = $(this.selectedButton).attr('type');

            switch (type) {
                case 'view-pip':
                    /* Play the channel in pip mode. */
                    Application.Player.Play(key, true);
                    break;
                case 'search-games':
                    /* Search for more games of this type. */
                    Application.Twitch.GetGameChannels(key);
                    break;
                case 'search-videos':
                    /* Hide the game menu. */
                    $('.list').eq(MenuType.Videos).hide();

                    /* Set the game title */
                    $('.list').eq(MenuType.Videos).find('.head').text(
                        Application.Twitch.menus[MenuType.Channels][key].streamer);

                    /* Set the update type. */
                    Application.Guide.updateType = UpdateType.Videos;

                    /* Search for videos from this streamer */
                    Application.Twitch.GetChannelVideos(key);
                    break;
                case 'follow-channel':
                    /* Follow the channel. */
                    Application.Twitch.FollowChannel(undefined, key);
                    break;
                case 'unfollow-channel':
                    /* Unfollow the channel. */
                    Application.Twitch.FollowChannel(undefined, key, true);
                    break;
                case 'follow-game':
                    /* Follow the game. */
                    Application.Twitch.FollowGame(undefined, key);
                    break;
                case 'unfollow-game':
                    /* Unfollow the game. */
                    Application.Twitch.FollowGame(undefined, key, true);
                    break;

                default:
                    break;
            }

            /* Remove the popup menu. */
            $(this.contextMenu).remove();
        }
    }
}
