(function () {


    /**
     * A utility object to manipulate/create suggestions
     */
    AJS.SuggestHelper = {

        /**
         * Factory method to create descriptor fetcher based on user optiosn
         *
         * @param options
         * @param model
         */
        createDescriptorFetcher:function (options, model) {
            if (options.ajaxOptions && options.ajaxOptions.url) {
                if (model && options.content === "mixed") {
                    return new AJS.MixedDescriptorFetcher(options, model);
                } else {
                    return new AJS.AjaxDescriptorFetcher(options.ajaxOptions);
                }
            } else if (options.suggestions) {
                return new AJS.FuncDescriptorFetcher(options);
            } else if (model) {
                return new AJS.StaticDescriptorFetcher(options, model);
            }
        },

        /**
         * Extract all item descriptors within an array of group descriptors.
         *
         * @param descriptors {AJS.GroupDescriptor[]} The group descriptors.
         * @return {AJS.ItemDescriptor[]} All item descriptors within.
         */
        extractItems: function (descriptors) {
            return _.flatten(_.map(descriptors, function(descriptor) {
                if (descriptor instanceof AJS.GroupDescriptor) {
                    return descriptor.items();
                } else {
                    return [descriptor];
                }
            }));
        },
        /**
         * Creates a descriptor group that mirrors the inputted query
         * @param {String} query
         * @param {String} label
         * @return {AJS.GroupDescriptor}
         */
        mirrorQuery: function (query, label, uppercaseValue) {
            var value = uppercaseValue ? query.toUpperCase() : query;
            return new AJS.GroupDescriptor({
                label: "user inputted option",
                showLabel: false,
                replace: true
            }).addItem(new AJS.ItemDescriptor({
                value: value,
                label: value,
                labelSuffix: " (" + label + ")",
                title: value,
                allowDuplicate: false,
                noExactMatch: true          // this item doesn't count as an exact query match for selthis.ection purposes
            }));
        },
        /**
         * Does the item descriptor match any of the selected values
         * @param {AJS.ItemDescriptor} descriptor
         * @param {String[]} selectedValues
         * @return {Boolean}
         */
        isSelected: function (itemDescriptor, selectedVals) {
            return _.any(selectedVals, function (descriptor) {
                return itemDescriptor.value() === descriptor.value();
            });
        },
        /**
         * Removes duplicat descriptors
         *
         * @param descriptors
         * @return {Array}
         */
        removeDuplicates: function (descriptors, vals) {
            vals = vals || [];
            return _.filter(descriptors, _.bind(function (descriptor) {
                if (descriptor instanceof AJS.GroupDescriptor) {
                    descriptor.items(this.removeDuplicates(descriptor.items(), vals));
                    return true;
                } else if (!_.include(vals, descriptor.value())) {
                    if (descriptor.value()) {
                        vals.push(descriptor.value());
                    }
                    return true;
                }
            }, this));
        },
        /**
         * Loop over all descriptors and remove descriptors that match selected vals. Usually if the user has already
         * selected a suggestion, we don't want to show it.
         * @param {AJS.GroupDescriptor[], AJS.ItemDescriptor[]} descriptors
         * @param {String[]} selectedValues
         * @return {AJS.GroupDescriptor[], AJS.ItemDescriptor[]} descriptors
         * @private
         */
        removeSelected: function (descriptors, selectedValues) {
            return _.filter(descriptors, _.bind(function (descriptor) {
                if ((descriptor instanceof AJS.ItemDescriptor) && this.isSelected(descriptor, selectedValues)) {
                    return false;
                }
                if (descriptor instanceof AJS.GroupDescriptor) {
                    descriptor.items(this.removeSelected(descriptor.items(), selectedValues));
                }
                return true;
            }, this));
        }
    };


    /**
     * A default suggestion handler. Used for autocomplete without a backing <select>
     */
    AJS.DefaultSuggestHandler = Class.extend({
        /**
         * @constructor
         * @param options
         */
        init: function (options) {
            this.options = options;
            this.descriptorFetcher = AJS.SuggestHelper.createDescriptorFetcher(options);
        },
        /**
         * Check if we should mirror input as a suggestion
         * @param {String} query
         * @param {Object} options
         * @return {Boolean}
         */
        validateMirroring: function (query) {
            return this.options.userEnteredOptionsMsg && query.length > 0
        },
        /**
         * Applies default formatting
         *
         * @param {Array} descriptors
         * @param {String} query
         * @param {Object} options
         * @return {*}
         */
        formatSuggestions: function (descriptors, query) {
            if (this.validateMirroring(query)) {

                descriptors.push(AJS.SuggestHelper.mirrorQuery(query, this.options.userEnteredOptionsMsg, this.options.uppercaseUserEnteredOnSelect));
            }
            return descriptors;
        },

        /**
         * Requests descriptors then formats them
         * @param {String} query
         * @return {*}
         */
        execute: function (query, force) {
            var deferred = jQuery.Deferred();
            var fetcherDef = this.descriptorFetcher.execute(query, force).done(_.bind(function (descriptors) {
                if (descriptors) {
                    descriptors = this.formatSuggestions(descriptors, query)
                }
                deferred.resolve(descriptors, query);
            }, this));
            deferred.fail(function () {
                fetcherDef.reject();
            });
            return deferred;
        }
    });

    /**
     * A suggestion handler that removes suggestions that have already been selected in <select>
     */
    AJS.SelectSuggestHandler = AJS.DefaultSuggestHandler.extend({
        /**
         * @constructor
         * @param {Object} options
         * @param {AJS.SelectModel} model
         */
        init: function (options, model) {
            this.descriptorFetcher = AJS.SuggestHelper.createDescriptorFetcher(options, model);
            this.options = options;
            this.model = model;
        },
        /**
         * Formats suggestions removing already selected descriptors
         * @param descriptors
         * @param query
         * @return {AJS.GroupDescriptor[]}*/
        formatSuggestions: function (descriptors, query) {
            var suggestions = this._super(descriptors, query);
            var selectedDescriptors = this.model.getDisplayableSelectedDescriptors();
            if (this.options.removeDuplicates) {
                suggestions = AJS.SuggestHelper.removeDuplicates(descriptors);
            }
            return AJS.SuggestHelper.removeSelected(suggestions, selectedDescriptors);
        }
    });

    /**
     * Special handler for assignee picker that appends some footer text prompting user to start typing for more options.
     */
    JIRA.AssigneeSuggestHandler = AJS.SelectSuggestHandler.extend({
        /**
         * Formats suggestions removing already selected descriptors
         * @param descriptors
         * @param query
         * @return {AJS.GroupDescriptor[]}*/
        formatSuggestions: function (descriptors, query) {
            var descriptors = this._super(descriptors, query);
            if (query.length === 0) {
                descriptors[0].footerText(AJS.I18n.getText("user.picker.ajax.short.desc"));
            }
            return descriptors;
        }
    });


    /**
     * A suggestion handler that without a query, shows selected items at the top followed by unselected items in their groups.
     * When querying selected and unselected items are munged together and sorted in alphabetical order.
     */
    AJS.CheckboxMultiSelectSuggestHandler = AJS.SelectSuggestHandler.extend({

        /**
         * Creates html string for clear all
         * @return {String}
         */
        createClearAll: function () {
            return "<li class='check-list-group-actions'><a class='clear-all' href='#'>" + AJS.I18n.getText("jira.ajax.autocomplete.clear.all") + "</a></li>";
        },

        /**
         * Formats descriptors for display in checkbox multiselect
         *
         * @param descriptors
         * @return {Array} formatted descriptors
         */
        formatSuggestions: function (descriptors, query) {

            var selectedItems = AJS.SuggestHelper.removeDuplicates(this.model.getDisplayableSelectedDescriptors());
            var selectedGroup = new AJS.GroupDescriptor({
                styleClass: "selected-group",
                items: selectedItems,
                actionBarHtml: selectedItems.length > 1 ? this.createClearAll()  : null
            });
            descriptors.splice(0, 0, selectedGroup);
            if (query.length > 0) {
                descriptors = AJS.SuggestHelper.removeDuplicates(descriptors);
                // Extract all items from the descriptors and sort them by label.
                var items = AJS.SuggestHelper.extractItems(descriptors).sort(function(a, b) {
                    a = a.label().toLowerCase();
                    b = b.label().toLowerCase();
                    return a.localeCompare(b);
                });
                descriptors = [new AJS.GroupDescriptor({items: items})];
            }
            return descriptors;
        }
    });

    /**
     * Special handler for share dialog pickers.
     */
    AJS.UserListSuggestHandler = AJS.SelectSuggestHandler.extend({
        /**
         * Tests valid email address
         */
        emailExpression: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        /**
         * Only mirror user input if it is a valid email address
         * @param {String} query
         * @return {Boolean}
         */
        validateMirroring: function (query) {
            return this.options.freeEmailInput && query.length > 0 && this.emailExpression.test(query)
        }
    });

    /**
     * Gets unselected <option>s from <select> as suggestions
     *
     * @param {Object} options - empty in this case
     * @param {JIRA.SelectModel} model - a wrapper around <select> element
     * @return {jQuery.Deferred}
     */
    AJS.StaticDescriptorFetcher = Class.extend({
        init: function (options, model) {
            this.model = model;
            this.model.$element.data("static-suggestions", true);
        },
        execute: function (query) {
            var deferred = jQuery.Deferred();
            deferred.resolve(this.model.getUnSelectedDescriptors(), query);
            return deferred;
        }
    });

    /**
     * Retrieves json from server and converts it into descriptors using formatSuggestions function supplied by user.
     */
    AJS.AjaxDescriptorFetcher = Class.extend({

        /**
         * @constructor
         * @param options
         */
        init: function (options) {
            this.options = _.extend({
                keyInputPeriod: 75, // Wait this long between key strokes before going to server
                minQueryLength: 1, // Need these many characters before we go to server
                data: {},
                dataType: "json"
            }, options);
        },

        // Actually make the request and notify those interested
        makeRequest: function(deferred, ajaxOptions, query) {
            ajaxOptions.complete = _.bind(function () {
                this.outstandingRequest = null;
            }, this);
            ajaxOptions.success = _.bind(function (data) {
                if (ajaxOptions.query) {
                    deferred.resolve(ajaxOptions.formatResponse(data, query));
                } else {
                    this.lastResponse = ajaxOptions.formatResponse(data, query);
                    deferred.resolve(this.lastResponse);
                }
            }, this);
            var originalError = ajaxOptions.error;
            ajaxOptions.error = function (xhr, textStatus, msg, smartAjaxResult) {
                if (!smartAjaxResult.aborted) {
                    if (originalError) {
                        originalError.apply(this, arguments);
                    } else {
                        alert(JIRA.SmartAjax.buildSimpleErrorContent(smartAjaxResult,{ alert : true }));
                    }
                }
            };

            this.outstandingRequest = JIRA.SmartAjax.makeRequest(ajaxOptions); // issue requestcle
        },

        /**
         * Prepare the data and prevent throttling of server
         * @param {jQuery.Deferred} deferred
         * @param {Object} ajaxOptions - standard jQuery ajax options
         * @param {String} query - in most cases this is the user input
         * @param {Boolean} force - ignore request buffers. I want my request dispatched NOW.
         */
        incubateRequest: function(deferred, ajaxOptions, query, force) {

            clearTimeout(this.queuedRequest); // cancel any queued requests

            if (force && this.outstandingRequest) {
                this.outstandingRequest.abort();
                this.outstandingRequest = null;
            }

            if (!ajaxOptions.query && this.lastResponse) {
                deferred.resolve(this.lastResponse);
            } else if (!this.outstandingRequest) {
                if (typeof ajaxOptions.data === 'function') {
                    ajaxOptions.data = ajaxOptions.data(query);
                } else {
                    ajaxOptions.data.query = query;
                }

                if (typeof ajaxOptions.url === 'function') {
                    ajaxOptions.url = ajaxOptions.url();
                }

                if ((query.length >= parseInt(ajaxOptions.minQueryLength, 10)) || force) {
                    this.makeRequest(deferred, ajaxOptions, query);
                } else {
                    deferred.resolve();
                }
            } else {
                this.queuedRequest = setTimeout(_.bind(function () {
                    this.incubateRequest(deferred, ajaxOptions, query, true);
                }, this), ajaxOptions.keyInputPeriod);
            }

            return deferred;
        },
        /**
         * Sets up a request
         * @param {Function} query - lazily evaluated value of input field.
         * @param {Boolean} force - Piss off all buffers etc. Make request now!
         * @return {jQuery.Deferred}
         */
        execute: function (query, force) {
            var deferred = jQuery.Deferred();
            deferred.fail(_.bind(function () {
                clearTimeout(this.queuedRequest);
                if (this.outstandingRequest) {
                    this.outstandingRequest.abort();
                }
            }, this));
            this.incubateRequest(deferred, _.extend({}, this.options), query, force);
            return deferred;
        }
    });


    /**
     * Gets suggestions from unselected <option>s in <select> as well as going to the server upon character for more
     * results on input.
     *
     * @param {Object} options - jQuery ajax options object. With additional:
     * - {function} formatResponse - function for creating descriptors out of server response
     * - {number} minQueryLength - min input length before a request is made
     * @param {JIRA.SelectModel} model - a wrapper around <select> element
     * @return {jQuery.Deferred}
     */
    AJS.MixedDescriptorFetcher = Class.extend({
        init: function (options, model) {
            this.ajaxFetcher = new AJS.AjaxDescriptorFetcher(options.ajaxOptions);
            this.options = options;
            this.model = model;
        },
        execute: function (query, force) {
            var deferred = jQuery.Deferred();
            // This needs to come after the return statement...
            if (query.length >= 1) {
                var ajaxDeferred = this.ajaxFetcher.execute(query, force).done(_.bind(function (suggestions) {
                    var descriptors = [].concat(this.model.getAllDescriptors()).concat(suggestions);
                    deferred.resolve(descriptors, query);
                }, this));
                deferred.fail(function () {
                    ajaxDeferred.reject();
                });
            } else {
                deferred.resolve(this.model.getUnSelectedDescriptors(), query);
            }
            return deferred;
        }
    });

    /**
     * A single fetcher that will just return the result of calling supplied function
     */
    AJS.FuncDescriptorFetcher = Class.extend({
        /**
         * @constructor
         * @param options
         */
        init: function (options) {
             this.options = options;
        },
        /**
         * Gets result of function
         * @param query

         */
        execute: function (query) {
            var deferred = jQuery.Deferred();
            deferred.resolve(this.options.suggestions(query), query);
            return deferred;
        }
    });


})();


