(function() {
    function createPicker($selectField) {
        new AJS.MultiSelect({
            element: $selectField,
            itemAttrDisplayed: "label",
            removeOnUnSelect: false,
            submitInputVal: true,
            errorMessage: AJS.I18n.getText("jira.ajax.autocomplete.versions.error"),
            maxInlineResultsDisplayed: 15
        });
    }

    function locateSelect(parent) {
        var $parent = AJS.$(parent),
            $selectField;

        if ($parent.is("select")) {
            $selectField = $parent;
        } else {
            $selectField = $parent.find("select");
        }

        return $selectField;
    }

    function findVersionSelectAndConvertToPicker(context, selector) {
        selector = selector || ".aui-field-versionspicker.frother-control-renderer";
        AJS.$(selector, context).each(function () {
            var $selectField = locateSelect(this);
            if ($selectField.length) {
                createPicker($selectField);
            }
        });
    }

    JIRA.bind(JIRA.Events.NEW_CONTENT_ADDED, function (e, context, reason) {
        if (reason !== JIRA.CONTENT_ADDED_REASON.panelRefreshed) {
            findVersionSelectAndConvertToPicker(context);
        }
    });

})();
