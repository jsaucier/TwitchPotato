module TwitchPotato {
    export class NotificationHandler {
        /** Dictionary containing the online channels and the current game for the channel. */
        private online: IDictionary<string> = {};

        /**
         * Displays a notification of the new channels that are online or when
         * a channel changes games. */
        Notify() {
            $('#notification ul').empty();

            /** The online followed channels. */
            var followed = App.Twitch.GetFollows(FollowType.Channel);

            /**
             * Temporary dictionary containing the online channels and
             * the current game for the channel. */
            var online: IDictionary<string> = {};

            /** The data for the channel. */
            var channel: IChannel;

            for (var o in followed) {
                /** Update the channel. */
                channel = App.Twitch.GetMenu(MenuType.Channels)[o];

                /**
                 * Only notify new streamers that just come online or
                 * when a streamer changes games. */
                if (this.online[o] === undefined ||
                    this.online[o] !== channel.game) {
                    online[o] = channel.game || online[o] || '';
                }
            }

            /** Add the online channels to the notification window. */
            for (var o in online) {
                /** Update the channel. */
                channel = App.Twitch.GetMenu(MenuType.Channels)[o];

                /** The notification item template. */
                var html = $('#notify-item-template').html().format(
                    channel.streamer, channel.game);

                /** Append the notification item to the container. */
                $('#notification ul').append(html);

                /** Track the user as now online. */
                this.online[o] = channel.game || '';
            }

            /** Temporary dictionary containing only online channels.  */
            var cleanup: IDictionary<string> = {};

            /** Iterate the online channels and ensure they are truely online. */
            for (var i in this.online)
                /** Ensure channel is online. */
                if (followed[i] !== undefined) cleanup[i] = this.online[i];

            /** Update the online channels. */
            this.online = cleanup;

            /** Display the notification window. */
            if ($('#notification li').length > 0) {
                $('#notification').fadeIn(function() {
                    setTimeout(function() {
                        $('#notification').fadeOut();
                    }, 5000);
                });
            }
        }
    }
}
