declare var chrome: any

interface Dictionary<T> {
    [key: string]: T
}

interface Dictionary<T> {
    [index: number]: T
}

interface Channel {
    name: string
    streamer: string
    title: string
    viewers: number
    game: string
    preview: string
}

interface Game {
    name: string
    channels: number
    viewers: number
    boxArt: string
}

interface Video {
    id: string
    name: string
    streamer: string
    title: string
    views: number
    length: number
    preview: string
}

interface InputData {
    id: string
    type: TwitchPotato.InputType
    name: string
    desc: string
    code: number
}

interface PlayerData {
    id: string
    isPlaying: boolean
    isLoaded: boolean
    isMuted: boolean
    number: number
    flashback?: string
    webview: Webview
}
