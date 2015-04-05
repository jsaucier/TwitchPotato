module TwitchPotato {
    export module Utils {
        var guid = 0;

        /* Gets the number of entries in a dictionary. */
        export function DictionarySize(dictionary: Dictionary<any>): number {
            var count = 0;
            for (var key in dictionary) {
                count++;
            }
            return count;
        }

        /** Formats seconds to time. */
        export function FormatSeconds(seconds: number): string {
            var hours = Math.floor(seconds / (60 * 60));

            var minDiv = seconds % (60 * 60);
            var mins = Math.floor(minDiv / 60);

            var secDiv = minDiv % 60;
            var secs = Math.ceil(secDiv);

            return ((hours > 0) ? hours + ':' : '') + ':' +
                ((mins < 10) ? '0' + mins : mins) + ':' +
                ((secs < 10) ? '0' + secs : secs)
        }

        /** Formats the string. */
        export function Format(str: string, ...args: any[]): string {
            //    var args = arguments;
            return str.replace(/\{\{|\}\}|\{(\d+)\}/g, function(m, n) {
                if (m === "{{") {
                    return "{";
                }
                if (m === "}}") {
                    return "}";
                }
                return args[n];
            });
        }

        /** Deliminates a number with commas or a given character */
        export function Deliminate(num: number, char = ','): string {
            var str = num + '';
            var x = str.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + char + '$2');
            }

            return x1 + x2;
        }

        /** Generates a new id. */
        export function GenerateGuid(): string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        export function ConsoleMessage(e: any): void {
            var message = Utils.Format('webview:{0}:{1}: {2}', $(e.target).attr('type'), e.line, e.message);

            if (e.level === 0) console.log(message);
            else if (e.level === 1) console.warn(message);
            else if (e.level === 2) console.info(message);
            else if (e.level === 3) console.debug(message);
            else if (e.level === 4) console.error(message);
            else console.log(message);
        }
    }
}

$.fn.scrollTo = function(target, options, callback) {
    if (typeof options == 'function' && arguments.length == 2) {
        callback = options;
        options = target;
    }
    var settings: any = $.extend({
        scrollTarget: target,
        offsetTop: 50,
        duration: 500,
        easing: 'swing'
    }, options);
    return this.each(function() {
        var scrollPane = $(this);
        var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
        scrollPane.animate({
            scrollTop: scrollY
        }, parseInt(settings.duration), settings.easing, function() {
                if (typeof callback == 'function') {
                    callback.call(this);
                }
            });
    });
};
