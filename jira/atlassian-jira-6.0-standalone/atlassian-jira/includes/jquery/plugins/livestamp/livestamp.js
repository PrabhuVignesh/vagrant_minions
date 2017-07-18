(function ($, moment) {

    "use strict";

    var timeout,

        updateInterval = 6000,

        livestamps = [],

        prep = function ($el, timestamp) {
            $el.data("livestampdata", timestamp);
            livestamps.push($el);
        },

        run = function () {
            update();
            clearTimeout(timeout);
            timeout = setTimeout(run, updateInterval);
        },

        update = function () {
            var now = moment(),
                sod = moment().startOf("day");
            livestamps = $.grep(livestamps, function ($el) {
                var timestamp = $el.data("livestampdata"),
                    from,
                    to;
                if (!moment.isMoment(timestamp) || !$el.closest("html").length) {
                    $el.removeData("livestampdata");
                } else {
                    from = $el.text();
                    if (now.diff(timestamp, "hours") <= 1) {
                        //humanized time
                        if (timestamp.isBefore(now) || $el.hasClass("allow-future")) {
                            to = timestamp.fromNow();
                        } else {
                            to = now.fromNow();
                        }
                    } else {
                        //calendar time
                        to = timestamp.calendar();
                        //remove from the list any fields that will not need updating ever again (i.e. a week or more ago)
                        if (sod.diff(timestamp, "weeks")) {
                            $el.removeData("livestampdata");
                        }
                    }
                    if (from !== to) {
                        $el.text(to);
                    }
                }
                return !!$el.data("livestampdata");
            });
        },

        add = function ($el) {
            $el.each(function () {
                var $this = $(this),
                    timestamp = $this.attr("datetime");
                if (timestamp) {
                    prep($this, moment(timestamp));
                }
            });
            run();
            return $el;
        };

    $.fn.livestamp = function () {
        return add(this);
    };

}(jQuery, moment));
