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
    onlineStatus(): string;
    setVideoTime(time: number): void;
    isPaused(): boolean;
    setQuality(quality: string): void;
    togglePlayPause(): void;
    height: string;
}

enum PlayerActions {
    ViewMode,
    Load,
    State,
    Mute,
    Quality,
    Preview
}

enum PlayerState {
    Playing,
    Stopped
}

enum ViewMode {
    Fullscreen,
    Windowed
}

enum Quality {
    Mobile,
    Low,
    Medium,
    High,
    Source
}

class Controller {

    private _player: PlayerEmbed;
    // private _message: MessageEvent;
    private _viewMode: ViewMode;
    private _isMuted: boolean;
    private _queue: Array<any> = [];
    private _isLoaded = false;

    constructor() {

        window.addEventListener('message', (event) => this.OnMessage(event.data));
        window.addEventListener('resize', () => this.ViewMode());

        this._player = <PlayerEmbed>$('embed')[0];

        this.CheckLoaded();
    }

    OnMessage(data: string): void {

        // if (this._message === undefined) this._message = event;

        var json = JSON.parse(data);
        var params = json.params;

        if (this.QueueMessage(json)) return;

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

            // case PlayerActions.Preview:
            //     this.Preview(params.id, params.isVideo);
            //     break;

            default:
                console.log('Unhandled method: {0}'.format(PlayerActions[json.action]));
                break;
        }
    }

    private QueueMessage(json: any): boolean {

        if (this._isLoaded || json.params.queue === undefined) return false;

        var data = JSON.stringify(json);

        this._queue.push(data);

        return true;
    }

    private ProcessQueue(): void {

        if (this._isLoaded) return

        this._isLoaded = true;

        for (var i = 0; i < this._queue.length; i++)
            this.OnMessage(this._queue[i]);

        this._queue = [];
    }

    private CheckLoaded(): void {

        if (this._isLoaded) return

        var status = this._player.onlineStatus();

        if (status === 'unknown')
            setTimeout(() => this.CheckLoaded(), 100);
        else
            setTimeout(() => this.ProcessQueue(), 100);
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

    private Quality(quality: number): void {
        this._player.setQuality(Quality[quality]);
    }

    // private Preview(channel: string, isVideo: boolean): void {
    //
    //     /** Set the quality to low. */
    //     this.Quality(Quality.Low);
    //
    //     /** Determine if a stream or video is loaded. */
    //     if (isVideo)
    //         this._player.loadVideo(channel);
    //     else
    //         this._player.loadStream(channel);
    //
    //     /** Ensure the video is playing. */
    //     this._player.playVideo();
    //
    //     /** Ensure the video is muted. */
    //     this.Mute(true);
    //
    //     /** Set the quality to low. */
    //     setTimeout(() => this.Quality(Quality.Low), 5000);
    //
    //     /** Enter fullscreen mode. */
    //     //this.SetFullscreen(FullscreenAction.Enter);
    // }

    private Load(id: string, isVideo: boolean): void {

        if (isVideo)
            this._player.loadVideo(id);
        else
            this._player.loadStream(id);
    }

    private ViewMode(mode?: ViewMode): void {

        if (mode !== ViewMode.Fullscreen)
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

        if (mode !== undefined) this._viewMode = mode;

        if (this._viewMode === ViewMode.Fullscreen)
            heightStr = (height + 32) + 'px';
        else if (mode === ViewMode.Windowed)
            heightStr = "100%";

        this._player.height = heightStr;
    }
}

$(() => {
    var pc = new Controller();
});

//  Some of these are documented, some aren't.

//  Twitch player methods:
//  playVideo, pauseVideo, mute, unmute, fullscreen, loadStream, loadVideo,
//  setQuality, videoSeek, setOauthToken, onlineStatus, isPaused, setVideoTime,
//  adFeedbackDone, setTrackingData, showChromecast, setChromecastConnected,
//  togglePlayPause

//  Twitch player events:
//  chromecastMediaSet, chromecastSessionRequested, chromecastVolumeUpdated,
//  pauseChromecastSession, offline, online, adCompanionRendered, loginRequest,
//  mouseScroll, playerInit, popout, tosViolation, viewerCount, streamLoaded,
//  videoLoaded, seekFailed, videoLoading, videoPlaying, adFeedbackShow
