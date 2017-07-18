/**
 * Registers/unregisters ShifterGroups and shows/hides a ShifterDialog
 * 
 * A ShifterGroup is an object with the following interface:
 *     {String} name - displayed as the group heading
 *     {Number} weight - a number similar to z-index that determines the order it is displayed in
 *     {Function} getSuggestions - called each time the query changes
 *         args: {String} query
 *         returns: {jQuery.Deferred} to be resolved with an array of { value: any, label: String, keywords: Array|null }
 *     {Function} onSelection - called when one of the group's suggestions is chosen
 *         args: {any} value
 */
AJS.namespace('JIRA.ShifterComponent.ShifterController', window, Class.extend({

    MAX_RESULTS_PER_GROUP: 5,

    init: function(id) {
        this.id = id;
        this.groupFactories = []
    },

    /**
     * @param {Function} groupFactory - a function that returns a ShifterGroup, an Array of ShifterGroup, or null.
     * @returns groupFactory
     */
    register: function(groupFactory) {
        this.groupFactories.push(groupFactory);
        return groupFactory;
    },

    /**
     * @param {Function} groupFactory - a reference to an already registered group factory
     * @returns groupFactory
     */
    unregister: function(groupFactory) {
        this.groupFactories = _.without(this.groupFactories, groupFactory);
        return groupFactory;
    },

    /**
     * Creates and shows a ShifterDialog if one is not already visible.
     * If one is visible, simple focus the query field.
     */
    show: function() {
        if (!this.dialog || this.dialog.destroyed()) {
            var groups = _.chain(this.groupFactories)
            .map(function(factory) {
                return factory();
            })
            .compact()
            .flatten()
            .value()
            .sort(function(a, b) {
                return a.weight - b.weight;
            });
            this.dialog = new JIRA.ShifterComponent.ShifterDialog(this.id, groups, {
                maxResultsDisplayedPerGroup: this.MAX_RESULTS_PER_GROUP
            });
        }
        this.dialog.focus();
    },

    /**
     * Hides and destroys the currently visible ShifterDialog.
     * Does nothing if a ShifterDialog is not currently shown.
     */
    hide: function() {
        this.dialog && this.dialog.destroy();
    }

}));
