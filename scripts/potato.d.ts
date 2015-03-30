declare var chrome: any;

interface Dictionary<T> {
    [key: string]: T
}

interface UserTokens {
    [key: string]: string;
}

interface Channel {
    name: string,
    streamer: string,
    title: string,
    viewers: number,
    game: string,
    preview: string,
}

interface Game {
    name: string,
    channels: number,
    viewers: number,
    boxArt: string,
}

interface Video {
    id: string,
    name: string,
    streamer: string,
    title: string,
    views: number,
    length: number,
    preview: string
}
