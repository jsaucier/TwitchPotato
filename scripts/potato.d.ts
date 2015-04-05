declare var chrome: any;

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

interface TwitchItems {
    0: Dictionary<Channel>;
    1: Dictionary<Channel>;
    2: Dictionary<Game>;
    3: Dictionary<Video>;
}

interface Dictionary<T> {
    [key: string]: T;
}

interface Dictionary<T> {
    [key: number]: T;
}

interface Channel {
    name: string;
    streamer: string;
    title: string;
    viewers: number;
    game: string;
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

interface PlayerData {
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
