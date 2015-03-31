module PlayerInject {
    interface Embed extends HTMLElement {
        height: string
    }

    export class Inject {
        private isFullscreen: boolean = false;
        private embed: Embed = document.getElementsByTagName("embed")[0];

        constructor() {
            window.addEventListener('resize', () => PlayerInject.UpdateFullscreen('update'));
        }

        private ExecuteMethod(data) {
            // Parse the data.
            data = JSON.parse(data);

            // Call the method.
            this[data.method].apply(this, data.args);
        }

        private UpdateFullscreen(state) {
            var prevHeight: string = this.embed.height + '';

            if (state !== true)
                this.embed.height = '100%';

            var body = document.body;
            var html = document.documentElement;

            var height: string = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.clientHeight,
                html.scrollHeight,
                html.offsetHeight) + '';

            if (state === 'update') {
                if (this.isFullscreen) {
                    // Toggle player to fullscreen.
                    height = (height + 32) + 'px';
                } else {
                    // Toggle player to normal.
                    height = "100%";
                }
            } else {
                if (state === null) {
                    state = !this.isFullscreen;
                } //if (state !== this.fullscreen) {

                if (state === true && this.isFullscreen !== true) {
                    // Toggle player to fullscreen.
                    height = (height + 32) + 'px';
                    this.isFullscreen = true;
                } else if (state === false) {
                    // Toggle player to normal.
                    height = "100%";
                    this.isFullscreen = false;
                }
            }

            this.embed.height = height;
        }
    }
    export var PlayerInject: Inject = new Inject();
}
