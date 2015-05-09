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



interface ITwitchUser {
    id: string;
    name: string;
    token: string;
}
