function toggleFullscreen(state) {

    var body = document.body;
    var html = document.documentElement;

    var height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight);

    var embed = document.getElementsByTagName("embed")[0];

    if (state === undefined) {
        if (embed.height === "100%") {
            state = true;
        } else {
            state = false;
        }
    }

    if (state === true) {
        // Toggle player to fullscreen.
        embed.height = (height + 32) + 'px';
    } else if (state === false) {
        // Toggle player to normal.
        embed.height = "100%";
    }

}