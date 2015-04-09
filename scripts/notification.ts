module TwitchPotato {

    export class NotificationHandler {

        /** Dictionary containing the online channels and the current game for the channel. */
        private online: Dictionary<string> = {};

        constructor() { }

        /**
         * Displays a notification of the new channels that are online or when
         * a channel changes games. */
        public Notify() {

            $('#notification ul').empty();

            /** The online followed channels. */
            var followed = Application.Twitch.GetFollows(FollowType.Channel);

            /** Temporary dictionary containing the online channels and the current game for the channel. */
            var online: Dictionary<string> = {};

            /** The data for the channel. */
            var channel: Channel;

            for (var o in followed) {
                /* Update the channel. */
                channel = Application.Twitch.GetMenu(MenuType.Channels)[o];

                /**
                 * Only notify new streamers that just come online or
                 * when a streamer changes games. */
                if (this.online[o] === undefined ||
                    this.online[o] !== channel.game) {
                    online[o] = channel.game || online[o] || '';
                }
            }

            /* Add the online channels to the notification window. */
            for (var o in online) {
                /* Update the channel. */
                channel = Application.Twitch.GetMenu(MenuType.Channels)[o];

                /** The notification item template. */
                var item = $($('#notify-template').html());

                /* Set the notification data for this channel. */
                item.find('.streamer').text(channel.streamer);
                item.find('.game').text(channel.game);

                /* Append the notification item to the container. */
                item.appendTo($('#notification ul'));

                /* Track the user as now online. */
                this.online[o] = channel.game || '';
            }

            /** Temporary dictionary containing only online channels.  */
            var cleanup: Dictionary<string> = {};

            /* Iterate the online channels and ensure they are truely online. */
            for (var i in this.online)
                /* Ensure channel is online. */
                if (followed[i] !== undefined) cleanup[i] = this.online[i];

            /* Update the online channels. */
            this.online = cleanup;

            /* Display the notification window. */
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
