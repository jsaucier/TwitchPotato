declare var chrome: any;

interface EmptyCallback {
    (): void;
}

interface TwitchUserCallback {
    (user: TwitchUser): void
}

interface XMLHttpRequest {
    contentType: string;
}

interface HTMLDocument {
    postMessage(message: string, filter: string): void;
}

interface JQuery {
    scrollTo(selector: string, options: Object): JQuery;
    sort(func: (a: HTMLElement, b: HTMLElement) => any);
}


interface Dictionary<T> {
    [key: string]: T;
}

interface Dictionary<T> {
    [key: number]: T;
}

interface Channel {
    /** The channel's name. */
    name: string;
    /** The display name of the channel. */
    streamer: string;
    /** The current title of the channel. */
    title: string;
    /** The number of channel viewers. */
    viewers: number;
    /** The current game of the channel. */
    game: string;
    /** The preview image of the channel. */
    preview: string;
}

interface Game {
    name: string;
    channels: number;
    viewers: number;
    boxArt: string;
}

interface Video {
    name: string;
    streamer: string;
    title: string;
    views: number;
    length: number;
    preview: string;
}

interface Input {
    input: TwitchPotato.Inputs;
    type: TwitchPotato.InputType;
    name: string;
    desc: string;
    code: number;
}

interface Player {
    channel: string;
    isLoaded: boolean;
    number: number;
    flashback?: string;
    webview: Webview;
}

interface StorageData {
    users: string[];
    zoom: number;
}

interface TwitchUser {
    id: string;
    name: string;
    token: string;
}
