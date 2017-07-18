JIRA.MentionUserModel = Backbone.Model.extend({ idAttribute: "name" });

/**
 * Provides autocomplete for username mentions in textareas.
 *
 * @constructor AJS.Mention
 * @extends AJS.Control
 */
JIRA.Mention = AJS.Control.extend({

    CLASS_SIGNATURE: "AJS_MENTION",

    lastInvalidUsername: "",

    lastRequestMatch: true,

    lastValidUsername: "",

    init: function () {
        var instance = this;
        this.listController = new AJS.MentionGroup();

        this.dataSource = new JIRA.ProgressiveDataSet([], {
            model: JIRA.MentionUserModel,
            queryEndpoint: contextPath + "/rest/api/2/user/viewissue/search",
            queryParamKey: "username",
            queryData: _.bind(this._getQueryParams, this)
        });
        this.dataSource.matcher = function(model, query) {
            var matches = false;
            matches = matches || instance._stringPartStartsWith(model.get("name"), query);
            matches = matches || instance._stringPartStartsWith(model.get("displayName"), query);
            return matches;
        };
        this.dataSource.bind('respond', function(response) {
            var results = response.results;
            var username = response.query;

            if (!username) return;

            // Update the state of mentions matches
            if (!results.length) {
                if (username) {
                    if (instance.dataSource.hasQueryCache(username)) {
                        if (!instance.lastInvalidUsername || username.length <= instance.lastInvalidUsername.length) {
                            instance.lastInvalidUsername = username;
                        }
                    }
                }
                instance.lastRequestMatch = false;
            } else {
                instance.lastInvalidUsername = "";
                instance.lastValidUsername = username;
                instance.lastRequestMatch = true;
            }

            // Set the results
            var $suggestions = instance.generateSuggestions(results, username);
            instance.updateSuggestions($suggestions);
        });
        this.dataSource.bind('activity', function(response) {
            if (response.activity) {
                instance.layerController._showLoading();
            } else {
                instance.layerController._hideLoading();
            }
        });
    },

    updateSuggestions: function($suggestions) {
        if (this.layerController) {
            this.layerController.content($suggestions);
            this.layerController.show();
            this.layerController.refreshContent();
        }
    },

    _getQueryParams: function() {
        return this.restParams;
    },

    _setQueryParams: function() {
        var params = {
            issueKey: this.$textarea.attr("data-issuekey"),
            projectKey: this.$textarea.attr("data-projectkey"),
            maxResults: 10
        }

        if (JIRA.Dialog.current && JIRA.Dialog.current.options.id === "create-issue-dialog") {
            delete params.issueKey;
        }

        this.restParams = params;
    },

    textarea: function(textarea) {

        var instance = this;

        if (textarea) {
            this.$textarea = AJS.$(textarea);

            AJS.$("#mentionDropDown").remove();

            this.layerController = new AJS.UncomplicatedInlineLayer({
                offsetTarget: this.textarea(),
                allowDownsize: true,

                /**
                 * Allows for shared object between comment boxes.
                 *
                 * Closure returns the width of the focused comment form.
                 * This comes into effect on the View Issue page where the top and
                 * bottom comment textareas are the same element moved up and down.
                 */
                width: function() {
                    return instance.$textarea.width();
                }
            });

            this.layerController.bind("showLayer", function () {
                    // Binds events to handle list navigation
                    instance.listController.trigger("focus");
                }).bind("hideLayer", function () {
                    // Unbinds events to handle list navigation
                    instance.listController.trigger("blur");
                }).bind("contentChanged", function () {
                    if (!instance.layerController.$content) return;
                    instance.listController.removeAllItems();
                    instance.layerController.$content.find("li").each(function () {
                        var li = AJS.$(this);
                        li.click(function(event) {
                            instance._acceptSuggestion(li);
                            event.preventDefault();
                        });

                        instance.listController.addItem(new AJS.Dropdown.ListItem({
                            element: li,
                            autoScroll: true
                        }));
                    });
                    instance.listController.prepareForInput();
                    instance.listController.shiftFocus(0);
                }).bind("setLayerPosition", function(event, positioning) {
                    if (JIRA.Dialog.current && JIRA.Dialog.current.$form) {
                        var buttonRow = JIRA.Dialog.current.$popup.find(".buttons-container:visible");
                        if (buttonRow.length && positioning.top > buttonRow.offset().top) {
                            positioning.top = buttonRow.offset().top;
                        }
                    }
                });

            this.layerController.layer().attr("id", "mentionDropDown");

            this._assignEvents("textarea", instance.$textarea);

            this._setQueryParams();
        } else {
            return this.$textarea;
        }
    },

    /**
     * Generates autocomplete suggestions for usernames from the server response.
     * @param data The server response.
     */
    generateSuggestions: function (data, username) {
        var regex = new RegExp("(^|.*?(\\s+|\\())(" + RegExp.escape(username) + ")(.*)", "i");

        function highlight(text) {
            var result = {
                text: text
            };
            
            if (text.toLowerCase().indexOf(username.toLowerCase()) > -1) {
                text.replace(regex, function (_, prefix, spaceOrParenthesis, match, suffix) {
                    result = {
                        prefix: prefix,
                        match: match,
                        suffix: suffix
                    };
                });
            }
            return result;
        }

        var filteredData = _.map(data, function(model) {
            var user = model.toJSON();
            user.username = user.name;
            user.emailAddress = highlight(user.emailAddress);
            user.displayName = highlight(user.displayName);
            user.name = highlight(user.name);
            return user;
        });

        return AJS.$(JIRA.Templates.mentionsSuggestions({
            suggestions: filteredData,
            query: username,
            activity: (this.dataSource.activeQueryCount > 0)
        }));
    },

    /**
     * Triggered when a user clicks on or presses enter on a highlighted username entry.
     *
     * The username value is stored in the rel attribute
     *
     * @param li The selected element.
     */
    _acceptSuggestion: function(li) {
        this._hide();
        this._replaceCurrentUserName(li.find("a").attr("rel"));
        this.listController.removeAllItems();
    },

    /**
     * Heavy-handed method to insert the selected user's username.
     *
     * Replaces the keyword used to search for the selected user with the
     * selected user's username.
     *
     * If a user is searched for with wiki-markup, the wiki-markup is replaced
     * with the @format mention.
     *
     * @param selectedUserName The username of the selected user.
     */
    _replaceCurrentUserName: function(selectedUserName) {
        var raw = this._rawInputValue(),
            caretPos = this._getCaretPosition(),
            beforeCaret = raw.substr(0, caretPos),
            wordStartIndex = JIRA.Mention.Matcher.getLastWordBoundaryIndex(beforeCaret, true);

        var before = raw.substr(0, wordStartIndex+1).replace(/\r\n/g, "\n");
        var username = "[~"+selectedUserName+"]";
        var after = raw.substr(caretPos);

        this._rawInputValue([before, username, after].join(""));
        this._setCursorPosition(before.length + username.length);
    },

    /**
     * Sets the cursor position to the specified index.
     *
     * @param index The index to move the cursor to.
     */
    _setCursorPosition: function(index) {
        var input = this.$textarea.get(0);
        if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(index, index);
        } else if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', index);
            range.moveStart('character', index);
            range.select();
        }
    },

    /**
     * Returns the position of the cursor in the textarea.
     */
    _getCaretPosition:function (){

        var element = this.$textarea.get(0);
        var rawElementValue = this._rawInputValue();
        var caretPosition, range, offset, normalizedElementValue, elementRange;

        if (typeof element.selectionStart === "number") {
            return element.selectionStart;
        }

        if (document.selection && element.createTextRange){
            range = document.selection.createRange();
            if (range) {
                elementRange = element.createTextRange();
                elementRange.moveToBookmark(range.getBookmark());

                if (elementRange.compareEndPoints("StartToEnd", element.createTextRange()) >= 0) {
                    return rawElementValue.length;
                } else {
                    normalizedElementValue = rawElementValue.replace(/\r\n/g, "\n");
                    offset = elementRange.moveStart("character", -rawElementValue.length);
                    caretPosition = normalizedElementValue.slice(0, -offset).split("\n").length - 1;
                    return caretPosition - offset;
                }
            }
            else {
                return rawElementValue.length
            }
        }
        return 0;
    },

    /**
     * Gets or sets the text value of our input via the browser, not jQuery.
     * @return The precise value of the input element as provided by the browser (and OS).
     * @private
     */
    _rawInputValue: function() {
        var el = this.$textarea.get(0);
        if (typeof arguments[0] == "string") el.value = arguments[0];
        return el.value;
    },

    /**
     * Sets the current username and triggers a content refresh.
     */
    fetchUserNames: function(username) {
        this.dataSource.query(username);
    },

    /**
     * Returns the current username search key.
     */
    _getCurrentUserName: function() {
        return this.currentUserName;
    },

    /**
     * Hides the autocomplete dropdown.
     */
    _hide: function() {
        this.layerController.hide();
    },

    /**
     * Shows the autocomplete dropdown.
     */
    _show: function() {
        this.layerController.show();
    },

    /**
     * Key up listener.
     *
     * Figure out what our input is, then if we need to, get some suggestions.
     */
    _keyUp: function() {
        var caret = this._getCaretPosition();
        var username = this._getUserNameFromInput(caret);
        username = jQuery.trim(username || "");
        if (this._isNewRequestRequired(username)) {
            this.fetchUserNames(username);
        } else if (!this._keepSuggestWindowOpen(username)) {
            this._hide();
        }
        this.lastQuery = username;
        delete this.willCheck;
    },


    /**
     *  Checks if suggest window should be open
     * @return {Boolean}
     */
    _keepSuggestWindowOpen: function(username) {
        if (!username) return false;
        if (this.layerController.isVisible()) {
           return this.dataSource.activeQueryCount || this.lastRequestMatch;
        }
        return false;
    },

    /**
     * Checks if server pool for user names is needed
     * @param username
     * @return {Boolean}
     */
    _isNewRequestRequired:function (username) {
        if (!username) {
            return false;
        }
        username = jQuery.trim(username);
        if (username === this.lastQuery) {
            return false;
        } else if (this.lastInvalidUsername) {
            // We use indexOf instead of stringPartStartsWith here, because we want to check the whole input, not parts.
            if (username.indexOf(this.lastInvalidUsername) === 0) {
                return false;
            }
        } else if (!this.lastRequestMatch && username === this.lastValidUsername) {
            return true;
        }

        return true;
    },

    _stringPartStartsWith: function(text,startsWith) {
        text = jQuery.trim(text || "").toLowerCase();
        startsWith = (startsWith || "").toLowerCase();
        var nameParts = text.split(/\s+/);

        if (!text || !startsWith) return false;
        if (text.indexOf(startsWith) === 0) return true;

        return _.any(nameParts, function(word) {
            return word.indexOf(startsWith) === 0;
        });
    },


    /**
     * Gets the username which the caret is currently next to from the textarea's value.
     *
     * WIKI markup form is matched, and then if nothing is found, @format.
     */
    _getUserNameFromInput: function(caret) {
        if (typeof caret != "number") caret = this._getCaretPosition();
        return this.currentUserName = JIRA.Mention.Matcher.getUserNameFromCurrentWord(this._rawInputValue(), caret);
    },

    _events: {
        textarea: {
            /**
             * Makes a check to update the suggestions after the field's value changes.
             *
             * Prevents the blurring of the field or closure of a dialog when the drop down is visible.
             *
             * Also takes into account IE removing text from an input when escape is pressed.
             *
             * When in a dialog, the general convention is that when escape is pressed when focused on an
             * input the dialog will close immediately rather then just unfocus the input. We follow this convetion
             * here.
             *
             * Please don't hurt me for using stopPropagation.
             *
             * @param e The key down event.
             */
            "keydown": function (e) {
                if (!this.willCheck) {
                    this.willCheck = _.defer(_.bind(this._keyUp, this));
                }

                if (e.keyCode === jQuery.ui.keyCode.ESCAPE) {
                    if (this.layerController.isVisible()) {

                        if (JIRA.Dialog.current) {
                            jQuery(AJS).one("Dialog.beforeHide", function(e) {
                                e.preventDefault();
                            });
                        }

                        this.$textarea.one("keyup", function(keyUpEvent) {
                            if (keyUpEvent.keyCode === jQuery.ui.keyCode.ESCAPE) {
                                keyUpEvent.stopPropagation(); // Prevent unfocusing the input when esc is pressed
                                JIRA.trigger("Mention.afterHide");
                            }
                        });
                    }

                    if (AJS.$.browser.msie) {
                        e.preventDefault();
                    }
                }
            },

            "focus": function() {
                this._keyUp();
            },

            "mouseup": function() {
                this._keyUp();
            },

            /**
             * Prevents a bug where another inline layer will focus on comment textarea when
             * an item in it is selected (quick admin search).
             */
            "blur": function() {
                this.listController.removeAllItems();
                this.lastQuery = this.lastValidUsername = this.lastInvalidUsername = "";
            }
        }
    }
});

JIRA.Mention.Matcher = {

    AT_USERNAME_START_REGEX: /^@(.*)/i,
    AT_USERNAME_REGEX: /[^\[]@(.*)/i,
    WIKI_MARKUP_REGEX: /\[[~@]+([^~@]*)/i,
    ACCEPTED_USER_REGEX: /\[~[^~\]]*\]/i,
    WORD_LIMIT: 3,

    getUserNameFromCurrentWord: function(text, caretPosition) {
        var before = text.substr(0, caretPosition);
        var lastWordStartIndex = this.getLastWordBoundaryIndex(before, false);
        var prevChar = before.charAt(lastWordStartIndex-1);
        var currentWord;
        var foundMatch = null;

        if (!prevChar || !/\w/i.test(prevChar)) {
            currentWord = this._removeAcceptedUsernames(before.substr(lastWordStartIndex));
            if (/[\r\n]/.test(currentWord)) return null;

            jQuery.each([this.AT_USERNAME_START_REGEX, this.AT_USERNAME_REGEX, this.WIKI_MARKUP_REGEX], function(i, regex) {
                var match = regex.exec(currentWord);
                if (match) {
                    foundMatch = match[1];
                    return false;
                }
            });
        }

        return (foundMatch != null && this.lengthWithinLimit(foundMatch, this.WORD_LIMIT)) ? foundMatch : null;
    },

    lengthWithinLimit: function(input, length) {
        var parts = jQuery.trim(input).split(/\s+/);
        return parts.length <= ~~length;
    },

    getLastWordBoundaryIndex: function(text, strip) {
        var lastAt = text.lastIndexOf("@"),
            lastWiki = text.lastIndexOf("[~");

        if(strip) {
            lastAt = lastAt - 1;
            lastWiki = lastWiki - 1;
        }

        return (lastAt > lastWiki) ? lastAt : lastWiki;
    },

    _removeAcceptedUsernames: function(phrase) {
        var match = this.ACCEPTED_USER_REGEX.exec(phrase);

        if (match) {
            return phrase.split(match)[1];
        } else{
            return phrase;
        }
    }
};
