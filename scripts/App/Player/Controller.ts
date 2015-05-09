/** Some of these are documented, some aren't. */
//
/** Twitch player methods: */
/** playVideo, pauseVideo, mute, unmute, fullscreen, loadStream, loadVideo, */
/** setQuality, videoSeek, setOauthToken, onlineStatus, isPaused, setVideoTime, */
/** adFeedbackDone, setTrackingData, showChromecast, setChromecastConnected, */
/** togglePlayPause */
//
/** Twitch player events: */
/** chromecastMediaSet, chromecastSessionRequested, chromecastVolumeUpdated, */
/** pauseChromecastSession, offline, online, adCompanionRendered, loginRequest, */
/** mouseScroll, playerInit, popout, tosViolation, viewerCount, streamLoaded, */
/** videoLoaded, seekFailed, videoLoading, videoPlaying, adFeedbackShow */

module TwitchPotato {

    interface PlayerWindow extends Window {
        pc: Controller;
    }

    interface PlayerEmbed extends HTMLElement {
        pauseVideo(): void;
        playVideo(): void;
        mute(): void;
        unmute(): void;
        loadStream(stream: string): void;
        loadVideo(video: string): void;
        setVideoTime(time: number): void;
        isPaused(): boolean;
        setQuality(quality: string): void;
        togglePlayPause(): void;
        height: string;
    }

    class Controller {

        private _player: PlayerEmbed;
        private _message: MessageEvent;
        private _isFullscreen = false;
        private _isMuted: boolean;

        constructor() {

            window.addEventListener('message', (event) => this.OnMessage(event));
            window.addEventListener('resize', () => this.ViewMode(FullscreenAction.Refresh));

            this._player = <PlayerEmbed>$('embed')[0];
        }

        OnMessage(event): void {

            /** Save this message to reply with. */
            if (this._message === undefined) this._message = event;

            var json = JSON.parse(event.data);
            var params = json.params;
            console.log(event.data);
            switch (json.action) {
                case PlayerActions.Load:
                    this.Load(params.id, params.isVideo);
                    break;

                case PlayerActions.Mute:
                    this.Mute(params.mute);
                    break;

                case PlayerActions.State:
                    this.State(params.state);
                    break;

                case PlayerActions.ViewMode:
                    this.ViewMode(params.viewMode);
                    break;

                case PlayerActions.Quality:
                    this.Quality(params.quality);
                    break;

                case PlayerActions.Preview:
                    this.Preview(params.id, params.isVideo);
                    break;

                default:
                    console.log('Unhandled method: {0}'.format(PlayerActions[json.action]))
                    break;
            }
        }

        private Mute(mute): void {
            if (mute === true)
                this._player.mute();
            else
                this._player.unmute();

            this._isMuted = mute;
        }

        private State(state: PlayerState): void {

            if (state === PlayerState.Playing)
                this._player.playVideo();
            else if (state === PlayerState.Stopped)
                this._player.pauseVideo();
        }

        private Quality(quality: string): void {
            this._player.setQuality(quality);
        }

        private Preview(channel: string, isVideo: boolean): void {

            /** Set the quality to low. */
            this.Quality('Low');

            /** Determine if a stream or video is loaded. */
            if (isVideo)
                this._player.loadVideo(channel);
            else
                this._player.loadStream(channel);

            /** Ensure the video is playing. */
            this._player.playVideo();

            /** Ensure the video is muted. */
            this.Mute(true);

            /** Set the quality to low. */
            setTimeout(() => this.Quality('Low'), 5000);

            /** Enter fullscreen mode. */
            //this.SetFullscreen(FullscreenAction.Enter);
        }

        private Load(id: string, isVideo: boolean): void {
            /** Determine if a stream or video is loaded. */
            if (isVideo)
                this._player.loadVideo(id);
            else
                this._player.loadStream(id);

            /** Ensure the video is playing. */
            //this._player.playVideo();

            /** Ensure the video is not muted. */
            //this.Mute(false);

            /** Enter fullscreen mode. */
            //this.ViewMode(FullscreenAction.Enter);
        }

        private ViewMode(action: FullscreenAction): void {

            if (action !== FullscreenAction.Enter)
                this._player.height = '100%';

            var body = document.body;
            var html = document.documentElement;

            var height = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.clientHeight,
                html.scrollHeight,
                html.offsetHeight);

            var heightStr = height + '';

            if (action === FullscreenAction.Refresh) {
                /** Set the player to fullscreen. */
                if (this._isFullscreen) heightStr = (height + 32) + 'px';
            } else {
                if (action === FullscreenAction.Toggle)
                    action = (this._isFullscreen === true) ? FullscreenAction.Exit : FullscreenAction.Enter;

                if (action === FullscreenAction.Enter && this._isFullscreen === false) {
                    /** Toggle player to fullscreen. */
                    heightStr = (height + 32) + 'px';
                    this._isFullscreen = true;
                } else if (action === FullscreenAction.Exit) {
                    /** Toggle player to normal. */
                    heightStr = "100%";
                    this._isFullscreen = false;
                }
            }

            this._player.height = heightStr;
        }
    }

    $(() => {
        var pc = new Controller();
    });
}
