/**
 * Handles standing positioning of dropdowns
 *
 * @constructor AJS.InlineLayer.StandardPositioning
 */

AJS.InlineLayer.StandardPositioning = Class.extend({

    init: function () {
        this.rebuiltCallbacks =[];
    },
    
    left: function () {
        var offset = this.offset();
        return {
            left: offset.left,
            top: offset.top + this.offsetTarget().outerHeight()
        };
    },

    right: function () {
        var offset = this.offset();
        return {
            left: offset.left - this.layer().outerWidth() + this.offsetTarget().outerWidth(),
            top: offset.top + this.offsetTarget().outerHeight()
        };
    },

    /**
     * Get window. This can change dependant on if your in an iframe or not.
     *
     * @method window
     */
    window: function () {
        return window;  
    },

    /**
     * Get offset of target
     *
     * @method offset
     * @return {Object}
     */
    offset: function () {

        var offset = this.offsetTarget().offset();

        if(this.offsetTarget().hasFixedParent()) {
            this.layer().css("position", "fixed");
            offset.top = offset.top - AJS.$(window).scrollTop();
        } else {
            this.layer().css("position", "absolute");
        }
        
        return offset;
    },

    /**
     * A callback for when elements have been modified/rebuilt. IE7 needs to do this when moving elements to parent
     * document.
     *
     * @method rebuilt
     * @param arg
     */
    rebuilt: function (arg) {

        var instance = this;

        if (AJS.$.isFunction(arg)) {
            this.rebuiltCallbacks.push(arg);
        } else {
            AJS.$.each(this.rebuiltCallbacks, function () {
               this(instance.layer());
            });
        }
    },

    /**
     * Appends to body
     *
     * @method appendToBody
     */
    appendToBody: function () {
        this.layer().appendTo("body");
    },

    /**
     * Appends to placeholder
     *
     * @method appendToPlaceholder
     */
    appendToPlaceholder: function () {
        this.layer().appendTo(this.$placeholder);
    },

    /**
     * If out of view, scrolls inline layer into view.
     *
     * @method scrollTo
     */
    scrollTo: function () {
        // JRADEV-2900 says we shouldn't scroll InlineLayers anymore so the following
        // is commented out but preserved for future generations to discover.
        /*
        this.layer().scrollIntoView({
            duration: 750,
            marginTop: this.$offsetTarget.outerHeight()
        });
        //*/
    }

});


/**
 * An <tt>AJS.InlineLayer</tt> positioning controller that ensures the layer doesn't overflow the bottom of the window.
 */
AJS.InlineLayer.WindowPositioning = AJS.InlineLayer.StandardPositioning.extend({
    /**
     * @param {object} offset The offset from which to calculate the overflow.
     * @return {Number} The amount by which the layer overflows the window.
     * @private
     */
    _calculateOverflow: function (offset) {
        var isFixed = this.layer().css("position") === "fixed",
                layerBottom = offset.top + this.layer().outerHeight(true),
                windowHeight = jQuery(window).outerHeight(),
                windowScroll = jQuery(window).scrollTop();

        if (isFixed) {
            return Math.max(0, layerBottom - windowHeight);
        } else {
            return Math.max(0, layerBottom - windowScroll - windowHeight);
        }
    },

    left: function () {
        var offset = this._super(),
                overflow = this._calculateOverflow(offset);

        if (overflow > 0) {
            offset.left += this.offsetTarget().outerWidth();
            offset.top -= overflow;
        }

        return offset;
    },

    right: function () {
        var offset = this._super(),
                overflow = this._calculateOverflow(offset);

        if (overflow > 0) {
            offset.left -= this.offsetTarget().outerWidth();
            offset.top -= overflow;
        }

        return offset;
    }
});