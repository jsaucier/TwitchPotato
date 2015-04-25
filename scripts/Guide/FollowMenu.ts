module TwitchPotato {
    export class FollowMenuHandler {
        /** Gets the #follow-menu jQuery element. */
        private followMenu = '#guide #follow-menu';

        /** Gets the selected button on the follow menu. */
        private selectedButton = '#guide #follow-menu .button.selected';

        /** Gets or sets the follow type for the menu. */
        private followType: FollowType;

        /** Gets or sets whether to unfollow the item. */
        private unfollow: boolean;

        /** Gets or sets the key of the item to follow or unfollow. */
        private key: string;

        /** Handles input for the context menu. */
        HandleInput(input: Inputs, item: JQuery): boolean {
            /** Follow menu is not visible. */
            if ($(this.followMenu).length === 0) return false;

            switch (input) {
                case Inputs.ContextMenu:
                    this.Close();
                    Guide.ContextMenu.Close();
                    break;
                case Inputs.Up:
                    this.UpdateButton(Direction.Up);
                    break;
                case Inputs.Down:
                    this.UpdateButton(Direction.Down);
                    break;
                case Inputs.Select:
                    this.SelectButton(item);
                    break;
                default:
                    break;
            }

            return true;
        }

        /** Closes the follow menu. */
        Close(closeContextMenu = false) {
            $(this.followMenu).remove();

            if (closeContextMenu === true)
                Guide.ContextMenu.Close();
            else
                Guide.UpdateMenuScroll();
        }

        /** Updates the follow menu after the guide refreshes. */
        Update(item, user: string) {
            this.Show(item, this.followType, this.unfollow);

            /** Remove selected menu item. */
            $(this.selectedButton).removeClass('selected');

            $(this.followMenu)
                .find('.button[user="' + user + '"]')
                .addClass('selected')
        }

        /** Shows the follow menu. */
        Show(item: JQuery, followType: FollowType, unfollow = false): void {
            /** Set the follow type, unfollow, and values. */
            this.followType = followType;
            this.unfollow = unfollow;
            this.key = item.attr('key');

            if (followType === FollowType.Game &&
                item.attr('game') !== undefined)
                this.key = item.attr('game');

            var users = App.Twitch.GetUsers();
            var following = App.Twitch.GetFollowing(followType, this.key);

            if (unfollow === true)
                users = following;
            else
                for (var i in following)
                    users.splice(users.indexOf(following[i]), 1);

            /** Handle the following right away if possible. */
            if (this.FollowingHandled(users) === true) return this.Close(true);

            /** The the item menu type. */
            var menu = parseInt(item.attr('menu'));

            /** The follow menu template. */
            var html = $($('#follow-menu-template').html());

            /** Update the menu buttons. */
            for (var i in users) {
                var div = $('<div>')
                    .addClass('button')
                    .attr('user', users[i])
                    .text(App.Twitch.GetDisplayName(users[i]))
                    .insertBefore(html.find('.button[user="cancel"]'));
            }

            html.find('.button:eq(0)').addClass('selected');

            /** Append the follow menu to the item. */
            html.appendTo(item);

            /** Scroll the guide menu. */
            Guide.UpdateMenuScroll();
        }

        /** Handle following and unfollowing if possible. */
        private FollowingHandled(users: string[]): boolean {
            /* Ensure we have more than one user account, otherwise just follow
             * the item. */
            if (users.length === 1) {
                if (this.followType === FollowType.Channel) {
                    App.Twitch.Follow(users[0], this.key, FollowType.Channel, this.unfollow);
                    return true;
                }
                else if (this.followType === FollowType.Game) {
                    App.Twitch.Follow(users[0], this.key, FollowType.Game, this.unfollow);
                    return true;
                }
            }

            return false;
        }

        /** Update the selected button. */
        private UpdateButton(direction: Direction): void {
            /** The index of the selected menu item. */
            var index = $(this.followMenu).find('.button')
                .index($(this.selectedButton));

            /** Set default menu item. */
            if (index === -1)
                index = 0;

            /** Update the selected item index. */
            if (direction === Direction.Down)
                index++;
            else if (direction === Direction.Up)
                index--;

            /** Set the bounds for the index. */
            if (index < 0)
                index = 0;
            if (index > $(this.followMenu).find('.button').length - 1)
                index = $(this.followMenu).find('.button').length - 1;

            /** Remove selected menu item. */
            $(this.selectedButton).removeClass('selected');

            /** Select the new menu item. */
            $(this.followMenu)
                .find('.button')
                .eq(index)
                .addClass('selected');
        }

        /** Selects the button. */
        private SelectButton(item: JQuery): void {
            /** The menu type of the selected item. */
            var menu = parseInt(item.attr('menu'));

            /** The button type that is selected. */
            var user = $(this.selectedButton).attr('user');

            if (user !== 'cancel') {
                if (this.followType === FollowType.Channel)
                    App.Twitch.Follow(user, this.key, FollowType.Channel, this.unfollow);
                else if (this.followType === FollowType.Game)
                    App.Twitch.Follow(user, this.key, FollowType.Game, this.unfollow);

                /** Close the menu. */
                this.Close(true);
            }
            else
                /** Close the menu. */
                this.Close();
        }
    }
}
