interface ClearDataOptions { }
interface ClearDataTypes { }

interface ResultCallback {
    (results: any[]): void;
}
interface InjectDetails { }
interface FindOptions { }
declare enum StopFindAction {
    'clear',
    'keep',
    'activate'
}
interface Webview extends HTMLElement {
    contentWindow: HTMLDocument;
    request;

    back(): void;
    canGoBack(): boolean;
    canGoForward(): boolean;
    clearData(options: ClearDataOptions, types: ClearDataTypes, func?: () => void): void;
    executeScript(details: InjectDetails, func?: ResultCallback): void;
    find(searchText: string, options: FindOptions, func?: () => void): void;
    forward(): void;
    getProcessId(): number;
    getUserAgent(): string;
    getZoom(func: () => void);
    go(relativeIndex: number, func?: () => void): void;
    insertCSS(details: InjectDetails, func?: () => void): void;
    isUserAgentOverridden(): void;
    print(): void;
    reload(): void;
    setUserAgentOverride(userAgent: string);
    setZoom(zoomFactor: number, func?: () => void): void;
    stop(): void;
    stopFinding(action: StopFindAction): void;
    loadDataWithBaseUrl(dataUrl: string, baseUrl: string, virtualUrl: string): void;
    terminate(): void;
    addEventListener(type: string, listener: (event: LoadCommitEvent) => void): void;
    addEventListener(type: string, listener: (event: Event) => void): void;
}

interface LoadCommitEvent {
    url: string;
    isTopLevel: boolean;
}
