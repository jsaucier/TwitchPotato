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
    clearData(options: ClearDataOptions, types: ClearDataTypes, func?: EmptyCallback): void;
    executeScript(details: InjectDetails, func?: ResultCallback): void;
    find(searchText: string, options: FindOptions, func?: EmptyCallback): void;
    forward(): void;
    getProcessId(): number;
    getUserAgent(): string;
    getZoom(func: EmptyCallback);
    go(relativeIndex: number, func?: EmptyCallback): void;
    insertCSS(details: InjectDetails, func?: EmptyCallback): void;
    isUserAgentOverridden(): void;
    print(): void;
    reload(): void;
    setUserAgentOverride(userAgent: string);
    setZoom(zoomFactor: number, func?: EmptyCallback): void;
    stop(): void;
    stopFinding(action: StopFindAction): void;
    loadDataWithBaseUrl(dataUrl: string, baseUrl: string, virtualUrl: string);
    terminate(): void;
}
