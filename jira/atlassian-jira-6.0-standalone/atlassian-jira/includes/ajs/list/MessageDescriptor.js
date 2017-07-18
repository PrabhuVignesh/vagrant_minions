/**
 * The message descriptor is used in @see AJS.QueryableDropdownSelect to define characteristics and
 * display of items added to suggestions dropdown and in the case of AJS.QueryableDropdownSelect
 * and AJS.SelectModel also.
 *
 * It displays an AUI message instead a regular item
 *
 * @constructor AJS.MessageDescriptor
 * @extends AJS.ItemDescriptor
 */
AJS.MessageDescriptor = AJS.ItemDescriptor.extend({
    /**
     * Gets the useAUI attribute
     *
     * @method useAUI
     * @return {Boolean}
     */
    useAUI: function () {
        return this.properties.useAUI;
    },

    /**
     * Gets message ID, used for the DOM Element
     *
     * @method domID
     * @return {String}
     */
    messageID: function () {
        return this.properties.messageID;
    },

    _getDefaultOptions: function() {
        return AJS.$.extend(this._super(), {
            useAUI: true
        });
    }
});

/**
 * Factory method.
 *
 * This method knows how to create a AJS.MessageDescriptor and descendant classes (delegating the creation to their
 * factories)
 * @param suggestion
 * @param groupIndex
 * @return {AJS.MessageDescriptor}
 */
AJS.MessageDescriptor.create = function(suggestion, groupIndex) {
    return new AJS.MessageDescriptor({
        label: suggestion.label,
        styleClass: suggestion.styleClass,
        useAUI: suggestion.useAUI,
        messageID: suggestion.messageID,
        value: suggestion.value,
        keywords: suggestion.keywords,
        meta: { groupIndex: groupIndex }
    })
};
