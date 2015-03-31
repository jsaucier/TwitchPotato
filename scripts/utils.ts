module TwitchPotato {
    export module Utils {
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
    }
}