var PlayerInject;
(function (_PlayerInject) {
    var Inject = (function () {
        function Inject() {
            this.isFullscreen = false;
            this.embed = document.getElementsByTagName("embed")[0];
            window.addEventListener('resize', function () {
                return _PlayerInject.PlayerInject.UpdateFullscreen('update');
            });
        }
        Inject.prototype.ExecuteMethod = function (data) {
            data = JSON.parse(data);
            this[data.method].apply(this, data.args);
        };
        Inject.prototype.UpdateFullscreen = function (state) {
            var prevHeight = this.embed.height + '';
            if (state !== true)
                this.embed.height = '100%';
            var body = document.body;
            var html = document.documentElement;
            var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight) + '';
            if (state === 'update') {
                if (this.isFullscreen) {
                    height = (height + 32) + 'px';
                }
                else {
                    height = "100%";
                }
            }
            else {
                if (state === null) {
                    state = !this.isFullscreen;
                }
                if (state === true && this.isFullscreen !== true) {
                    height = (height + 32) + 'px';
                    this.isFullscreen = true;
                }
                else if (state === false) {
                    height = "100%";
                    this.isFullscreen = false;
                }
            }
            this.embed.height = height;
        };
        return Inject;
    })();
    _PlayerInject.Inject = Inject;
    _PlayerInject.PlayerInject = new Inject();
})(PlayerInject || (PlayerInject = {}));
//# sourceMappingURL=inject.js.map