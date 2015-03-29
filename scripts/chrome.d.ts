interface ClearDataOptions { }
interface ClearDataTypes { }
interface Callback {
    (): void;
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
    clearData(options: ClearDataOptions, types: ClearDataTypes, func?: Callback);
    executeScript(details: InjectDetails, func?: Callback);
    find(searchText: string, options: FindOptions, func?: Callback);
    forward(): void;
    getProcessId(): number;
    getUserAgent(): string;
    getZoom(func: Callback);
    go(relativeIndex: number, func?: Callback);
    insertCSS(details: InjectDetails, func?: Callback);
    isUserAgentOverridden(): void;
    print(): void;
    reload(): void;
    setUserAgentOverride(userAgent: string);
    setZoom(zoomFactor: number, func?: Callback);
    stop(): void;
    stopFinding(action: StopFindAction);
    loadDataWithBaseUrl(dataUrl: string, baseUrl: string, virtualUrl: string);
    terminate(): void;
}
