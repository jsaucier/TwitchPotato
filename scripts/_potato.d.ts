declare var chrome: any;

interface ITwitchUserCallback {
    (user: ITwitchUser): void;
}

interface IWebviewCallback {
    (webview: Webview): void;
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


interface IDictionary<T> {
    [key: string]: T;
}

interface IDictionary<T> {
    [key: number]: T;
}

interface IChannel {
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

interface IGame {
    name: string;
    channels: number;
    viewers: number;
    boxArt: string;
}

interface IVideo {
    name: string;
    streamer: string;
    title: string;
    views: number;
    length: number;
    preview: string;
}

interface IInput {
    input: TwitchPotato.Inputs;
    type: TwitchPotato.InputType;
    name: string;
    desc: string;
    code: number;
}

interface Input {
    name: string;
    desc: string;
    type: TwitchPotato.Inputs;
    key?: string;
    keyCode?: number;
    hidden?: boolean;
}


interface IStorage {
    users: string[];
    hidden: string[];
    fontSize: number;
}

interface ITwitchUser {
    id: string;
    name: string;
    token: string;
}
