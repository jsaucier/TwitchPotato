interface ClearDataOptions { }
interface ClearDataTypes { }
interface Callback {
    (): void;
}
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
    clearData(options: ClearDataOptions, types: ClearDataTypes, func?: Callback): void;
    executeScript(details: InjectDetails, func?: ResultCallback): void;
    find(searchText: string, options: FindOptions, func?: Callback): void;
    forward(): void;
    getProcessId(): number;
    getUserAgent(): string;
    getZoom(func: Callback);
    go(relativeIndex: number, func?: Callback): void;
    insertCSS(details: InjectDetails, func?: Callback): void;
    isUserAgentOverridden(): void;
    print(): void;
    reload(): void;
    setUserAgentOverride(userAgent: string);
    setZoom(zoomFactor: number, func?: Callback): void;
    stop(): void;
    stopFinding(action: StopFindAction): void;
    loadDataWithBaseUrl(dataUrl: string, baseUrl: string, virtualUrl: string);
    terminate(): void;
}
