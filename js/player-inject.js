(function(window, undefined) {

    var Potato = function() {
        this.fullscreen = false;
        this.embed = document.getElementsByTagName("embed")[0];
    };

    Potato.prototype.executeMethod = function(data) {

        // Parse the data.
        data = JSON.parse(data);

        // Call the method.
        this[data.method].apply(this, data.args);

    };

    Potato.prototype.updateFullscreen = function(state) {

        var prevHeight = this.embed.height + '';

        if (state !== true)
            this.embed.height = '100%';

        var body = document.body;
        var html = document.documentElement;

        var height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight);

        if (state === 'update') {
            if (this.fullscreen) {
                // Toggle player to fullscreen.
                height = (height + 32) + 'px';
            } else {
                // Toggle player to normal.
                height = "100%";
            }
        } else {
            if (state === null) {
                state = !this.fullscreen;
            } //if (state !== this.fullscreen) {

            if (state === true && this.fullscreen !== true) {
                // Toggle player to fullscreen.
                height = (height + 32) + 'px';
                this.fullscreen = true;
            } else if (state === false) {
                // Toggle player to normal.
                height = "100%";
                this.fullscreen = false;
            }
        }

        this.embed.height = height;

    };

    $(function() {
        window.potato = new Potato();

        potato.updateFullscreen(true);
    });

    window.addEventListener('resize', function() {
        window.potato.updateFullscreen('update');
    }.bind(window.potato));

}(window));