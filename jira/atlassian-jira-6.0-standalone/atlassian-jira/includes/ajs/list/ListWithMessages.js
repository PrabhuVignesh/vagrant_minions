/**
 * AJS.List that can contain AJS.MessageDescriptors as well
 *
 * @constructor AJS.ListWithMessages
 * @extends AJS.List
 */
AJS.ListWithMessages = AJS.List.extend({
    _filterOption: function(item, keywordsRegex, labelRegex) {
        if (item instanceof AJS.MessageDescriptor) {
            // Always display messages
            return item;
        } else {
            return this._super(item, keywordsRegex, labelRegex);
        }
    },
    _computeVisibleItems: function() {
        return this.items.not(".hidden, .disabled, .nofocus");
    },
    _generateOption: function (item, query, labelRegex) {
        if (item instanceof AJS.MessageDescriptor) {
            return this._render((item.useAUI()?"AUImessage":"message"), item);
        } else {
            return this._super(item, query, labelRegex)
        }
    }
});

/**
 * Renders a regular message
 * @param descriptor {AJS.MessageDescriptor} Descriptor to render
 * @return {*} Enhanced DOMElement that represents the descriptor
 */
AJS.ListWithMessages.prototype._renders.message = function (descriptor) {
    //adding the label as a class for testing.
    var rawItemId = descriptor.messageID() || descriptor.fieldText() || descriptor.label(),
            itemId = AJS.escapeHTML(AJS.$.trim(rawItemId).toLowerCase()).replace(/[\s\.]+/g, "-"),
            listElem = AJS.$('<li class="aui-list-item nofocus aui-list-item-li-' + itemId + '">'),
            messageElem = AJS.$('<span class="aui-list-item-message" />');

    //If no styleClass, use 'generic' as default
    if (descriptor.styleClass()) {
        messageElem.addClass(descriptor.styleClass());
    }

    //Add the text
    messageElem.text(descriptor.label());

    //Assemble the html and return it
    listElem.append(messageElem).data("descriptor", descriptor);

    return listElem;
};

/**
 * Renders an AUI message
 * @param descriptor {AJS.MessageDescriptor} Descriptor to render
 * @return {*} Enhanced DOMElement that represents the descriptor
 */
AJS.ListWithMessages.prototype._renders.AUImessage = function (descriptor) {
    //adding the label as a class for testing.
    var rawItemId = descriptor.messageID() || descriptor.fieldText() || descriptor.label(),
            itemId = AJS.escapeHTML(AJS.$.trim(rawItemId).toLowerCase()).replace(/[\s\.]+/g, "-"),
            listElem = AJS.$('<li class="aui-list-item nofocus aui-list-item-li-' + itemId + '">'),
            messageElem = AJS.$('<div class="aui-list-item-aui-message aui-message" />'),
            iconElem = AJS.$('<span class="aui-icon"/>'),
            contentElem = AJS.$('<p />');

    //If no styleClass, use 'generic' as default
    if (descriptor.styleClass()) {
        messageElem.addClass(descriptor.styleClass());
        iconElem.addClass("icon-"+descriptor.styleClass());
    }else {
        iconElem.addClass("icon-generic");
    }

    //Add the text
    contentElem.text(descriptor.label());

    //Assemble the html and return it
    messageElem.append(iconElem).append(contentElem);
    listElem.append(messageElem).data("descriptor", descriptor);

    return listElem;
};
