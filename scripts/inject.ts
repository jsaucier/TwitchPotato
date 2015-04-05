// Some of these are documented, some aren't.
//
// Twitch player methods:
// playVideo, pauseVideo, mute, unmute, fullscreen, loadStream, loadVideo,
// setQuality, videoSeek, setOauthToken, onlineStatus, isPaused, setVideoTime,
// adFeedbackDone, setTrackingData, showChromecast, setChromecastConnected,
// togglePlayPause
//
// Twitch player events:
// chromecastMediaSet, chromecastSessionRequested, chromecastVolumeUpdated,
// pauseChromecastSession, offline, online, adCompanionRendered, loginRequest,
// mouseScroll, playerInit, popout, tosViolation, viewerCount, streamLoaded,
// videoLoaded, seekFailed, videoLoading, videoPlaying, adFeedbackShow

interface PlayerWindow extends Window {
    pc: PlayerController;
}

interface Player extends HTMLElement {
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

enum FullscreenAction {
    Toggle,
    Enter,
    Exit,
    Refresh
}

class PlayerController {
    private player: Player;
    private message: MessageEvent;
    private isFullscreen: boolean = false;
    private isMuted: boolean;

    constructor() {
        /* Setup event listeners.*/
        window.addEventListener('message', (data) => this.OnMessage(data));
        window.addEventListener('resize', () => this.SetFullscreen(FullscreenAction.Refresh));

        this.player = <Player>$('embed')[0];
    }

    public OnMessage(event): void {
        /* Save this message to reply with. */
        if (this.message === undefined) this.message = event;

        /* Parse the json message. */
        var json = JSON.parse(event.data);
        var params = json.params;

        /* Call the method based on the message. */
        switch (json.method) {
            case 'LoadVideo':
                this.LoadVideo(params.channel, params.isVideo);
                break;

            case 'Mute':
                this.SetMute(!this.isMuted);
                break;

            case 'PauseVideo':
                this.PauseVideo();
                break;

            case 'PlayVideo':
                this.PlayVideo();
                break;

            case 'PlayPause':
                this.PlayPause();
                break;

            case 'Fullscreen':
                this.SetFullscreen(params.action);
                break;

            case 'Quality':
                this.SetQuality(params.quality);
                break;

            default:
                console.log('Unhandled method: ' + json.method);
                break;
        }
    }

    private SetMute(mute): void {
        if (mute === true)
            this.player.mute();
        else
            this.player.unmute();

        this.isMuted = mute;
    }

    private PauseVideo(): void {
        this.player.pauseVideo();
    }

    private PlayVideo(): void {
        this.player.playVideo();
    }

    private PlayPause(): void {
        if (this.player.isPaused())
            this.PlayVideo();
        else
            this.PauseVideo();
    }

    private SetQuality(quality: string): void {
        this.player.setQuality(quality);
    }

    private LoadVideo(channel: string, isVideo: boolean): void {
        /* Determine if a stream or video is loaded. */
        if (isVideo === true)
            this.player.loadVideo(channel);
        else
            this.player.loadStream(channel);

        /* Ensure the video is playing. */
        this.player.playVideo();

        /* Ensure the video is not muted. */
        this.SetMute(false);

        /* Enter fullscreen mode. */
        this.SetFullscreen(FullscreenAction.Enter);
    }

    public SetFullscreen(action: FullscreenAction): void {
        if (action !== FullscreenAction.Enter)
            this.player.height = '100%';

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
            /* Set the player to fullscreen. */
            if (this.isFullscreen) heightStr = (height + 32) + 'px';
        } else {
            if (action === FullscreenAction.Toggle)
                action = (this.isFullscreen === true) ? FullscreenAction.Exit : FullscreenAction.Enter;

            if (action === FullscreenAction.Enter && this.isFullscreen === false) {
                // Toggle player to fullscreen.
                heightStr = (height + 32) + 'px';
                this.isFullscreen = true;
            } else if (action === FullscreenAction.Exit) {
                // Toggle player to normal.
                heightStr = "100%";
                this.isFullscreen = false;
            }
        }

        this.player.height = heightStr;
    }
}

$(() => {
    var pc = new PlayerController();
});
