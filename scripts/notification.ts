module TwitchPotato {

    export interface OnlineChannel {
        [id: string]: string;
    }

    export class Notification {

        private online: OnlineChannel = {};

        constructor() {

        }

        public notify(online: OnlineChannel) {

            /*$('#notification ul').empty();

            var channel;
            var channels: OnlineChannel = this.guide.online;
            var online = {};

            for (var c in channels) {
                // Get the channel data.
                channel = channels[c];

                // Only notify new streamers that just come online or
                // when a streamer changes games.
                if (this.online[c] === undefined ||
                    this.online[c] !== (channel.channel.game || '')) {
                    online[c] = channel;
                }
            }

            // Add the online channels to the notification window.
            for (var o in online) {
                // Get the channel data.
                channel = online[o];

                var item = $($('#notify-template').html());

                item.find('.streamer').text(channel.channel.display_name);
                item.find('.game').text(channel.channel.game);

                item.appendTo($('#notification ul'));

                // Track this streamer as online.
                this.online[channel.channel.name] = channel.channel.game || '';
            }


            online = {};

            // Clean up the online table, removing the offline channels.
            for (var i in this.online) {
                if (channels[i] !== undefined) {
                    // Channel is online.
                    online[i] = this.online[i];
                }
            }

            this.online = online;

            if ($('#notification li').length > 0) {
                $('#notification').fadeIn(function() {
                    setTimeout(function() {
                        $('#notification').fadeOut();
                    }, 5000);
                });
            }
*/
        }
    }
}
