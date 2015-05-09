module TwitchPotato {

    export class ContentHandler {

        /** Image blob lookup table. */
        private _objectUrls: Array<string> = [];

        /** The preview webview. */
        private _preview: Webview;

        /** The preview channel. */
        private _channel: string;

        /** The selected menu item. */
        private _selectedItem: JQuery;

        /** Gets or sets if the preview player has been loaded. */
        private _isLoaded: boolean = false;

        /** Gets or sets the timeout. */
        private _timeout: number;

        constructor() {
            $(() => this.InitializePreview());
        }

        /** The preview player webview. */
        PreviewWebview(): Webview { return this._preview; }

        /** Updates the guide content. */
        UpdateInfo(): void {

            this.UpdateSelectedItem();

            var key = this.SelectedItemAttribute('key');
            var menu = parseInt(this.SelectedItemAttribute('menu'));
            var isSetting = this.SelectedItemAttribute('setting') === 'true';

            if (isSetting) return this.ShowSetting();

            if (menu === MenuType.Channels ||
                menu === MenuType.Game)
                return this.ShowChannel(key, menu);

            if (menu === MenuType.Videos) return this.ShowVideo(key);

            if (menu === MenuType.Games) return this.ShowGame(key);
        }

        /** Loads the preview video. */
        LoadPreview(channel: string, imageUrl: string, isVideo = false): void {

            /** Remove any preview images. */
            $('#info #preview img').remove();

            /** Hide the content div. */
            $('#info .content').hide();

            /** Hide the preview video. */
            $(this._preview).hide();

            /** Show the preview div. */
            $('#info #preview').show();

            /** Load the preview image. */
            if (!App.Storage.UseVideoPreview())
                return this.LoadImage(imageUrl, $('#info #preview'));

            /** Show the preview video. */
            $(this._preview).show();

            /** Only load the channel if it is not loaded. */
            if (channel === this._channel) return;

            /** Video previews are disabled. */
            if (App.Storage.UseVideoPreview())
                this.PostMessage('LoadPreview', { channel: channel, isVideo: isVideo });

            /** Set the current preview channel. */
            this._channel = channel;
        }

        /** Pause the preview video. */
        PausePreview(): void {

            /** Video previews are disabled. */
            if (!App.Storage.UseVideoPreview()) return;

            /** Send the pause message to the preview player. */
            this.PostMessage('PauseVideo');
        }

        /** Play the preview video. */
        PlayPreview(): void {

            /** Video previews are disabled. */
            if (!App.Storage.UseVideoPreview()) return;

            /** Send the play message to the preview player. */
            this.PostMessage('PlayVideo');
        }

        /** Initialize the guide preview player. */
        private InitializePreview() {

            this._preview = <Webview>$('#preview webview')[0]

            this._preview.addEventListener('contentload', () => {
                /** Inject the script files. */
                this._preview.executeScript({ file: 'js/Vendor/jquery.min.js' });
                this._preview.executeScript({ file: 'js/Player/Controller.js' });

                /** Hook the console message event. */
                this._preview.addEventListener('consolemessage', (e) => ConsoleMessage(e));

                /** Sets the preview player as loaded. */
                this._isLoaded = true;
            });
        }

        /** Posts a message to the preview player. */
        private PostMessage(method: string, params = {}): void {

            // if (!this._isLoaded) {
            //
            //     /** Clear the timeout. */
            //     clearTimeout(this._timeout);
            //
            //     /** Set the timeout timer. */
            //     this._timeout = setTimeout(
            //         () => this.PostMessage(method, params), 100);
            // }
            // else
            //     PostMessage(this._preview, method, params);
        }

        /** Gets the selected item. */
        private UpdateSelectedItem(): JQuery {

            /** Set the selected item. */
            this._selectedItem = $('#guide .list.selected .item.selected');

            return this._selectedItem;
        }

        /** Gets the selected item attribute. */
        private SelectedItemAttribute(attrib: string): string {

            return this._selectedItem.attr(attrib);
        }

        private CreateObjectURL(blob): string {
            var objURL = URL.createObjectURL(blob);

            this._objectUrls = this._objectUrls || [];
            this._objectUrls.push(objURL);

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

        private ShowChannel(key: string, menu: MenuType): void {

            /** Get the channel data. */
            var channel = <ChannelItem>App.Twitch.GetItems(menu)[key];

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
            var game = <GameItem>App.Twitch.GetItems(MenuType.Games)[key];

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
            var video = <VideoItem>App.Twitch.GetItems(MenuType.Videos)[key];

            /** The game head template. */
            var head = $('#video-info-head-template').html().format(
                video.title,
                video.streamer,
                video.length.formatSeconds(),
                video.views.deliminate());

            /** Append the head html to the document. */
            $('#info .head').html(head);

            /** Load the channel preview. */
            this.LoadPreview(key, video.preview, true);
        }

        private ShowSetting(): void {

            /** Get the setting type. */
            var type = this.SelectedItemAttribute('type');

            /** Determine if this is an input setting. */
            var isInput = this.SelectedItemAttribute('input') === 'true';

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
                        .attr('id', type));

            /** Hide the preview div. */
            $('#preview').hide();
        }
    }
}
