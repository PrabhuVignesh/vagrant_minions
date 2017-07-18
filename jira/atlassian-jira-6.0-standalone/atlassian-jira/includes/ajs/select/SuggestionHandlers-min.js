(function(){AJS.SuggestHelper={createDescriptorFetcher:function(options,model){if(options.ajaxOptions&&options.ajaxOptions.url){if(model&&options.content==="mixed"){return new AJS.MixedDescriptorFetcher(options,model)}else{return new AJS.AjaxDescriptorFetcher(options.ajaxOptions)}}else{if(options.suggestions){return new AJS.FuncDescriptorFetcher(options)}else{if(model){return new AJS.StaticDescriptorFetcher(options,model)}}}},extractItems:function(descriptors){return _.flatten(_.map(descriptors,function(descriptor){if(descriptor instanceof AJS.GroupDescriptor){return descriptor.items()}else{return[descriptor]}}))},mirrorQuery:function(query,label,uppercaseValue){var value=uppercaseValue?query.toUpperCase():query;return new AJS.GroupDescriptor({label:"user inputted option",showLabel:false,replace:true}).addItem(new AJS.ItemDescriptor({value:value,label:value,labelSuffix:" ("+label+")",title:value,allowDuplicate:false,noExactMatch:true}))},isSelected:function(itemDescriptor,selectedVals){return _.any(selectedVals,function(descriptor){return itemDescriptor.value()===descriptor.value()})},removeDuplicates:function(descriptors,vals){vals=vals||[];return _.filter(descriptors,_.bind(function(descriptor){if(descriptor instanceof AJS.GroupDescriptor){descriptor.items(this.removeDuplicates(descriptor.items(),vals));return true}else{if(!_.include(vals,descriptor.value())){if(descriptor.value()){vals.push(descriptor.value())}return true}}},this))},removeSelected:function(descriptors,selectedValues){return _.filter(descriptors,_.bind(function(descriptor){if((descriptor instanceof AJS.ItemDescriptor)&&this.isSelected(descriptor,selectedValues)){return false}if(descriptor instanceof AJS.GroupDescriptor){descriptor.items(this.removeSelected(descriptor.items(),selectedValues))}return true},this))}};AJS.DefaultSuggestHandler=Class.extend({init:function(options){this.options=options;this.descriptorFetcher=AJS.SuggestHelper.createDescriptorFetcher(options)},validateMirroring:function(query){return this.options.userEnteredOptionsMsg&&query.length>0},formatSuggestions:function(descriptors,query){if(this.validateMirroring(query)){descriptors.push(AJS.SuggestHelper.mirrorQuery(query,this.options.userEnteredOptionsMsg,this.options.uppercaseUserEnteredOnSelect))}return descriptors},execute:function(query,force){var deferred=jQuery.Deferred();var fetcherDef=this.descriptorFetcher.execute(query,force).done(_.bind(function(descriptors){if(descriptors){descriptors=this.formatSuggestions(descriptors,query)}deferred.resolve(descriptors,query)},this));deferred.fail(function(){fetcherDef.reject()});return deferred}});AJS.SelectSuggestHandler=AJS.DefaultSuggestHandler.extend({init:function(options,model){this.descriptorFetcher=AJS.SuggestHelper.createDescriptorFetcher(options,model);this.options=options;this.model=model},formatSuggestions:function(descriptors,query){var suggestions=this._super(descriptors,query);var selectedDescriptors=this.model.getDisplayableSelectedDescriptors();if(this.options.removeDuplicates){suggestions=AJS.SuggestHelper.removeDuplicates(descriptors)}return AJS.SuggestHelper.removeSelected(suggestions,selectedDescriptors)}});JIRA.AssigneeSuggestHandler=AJS.SelectSuggestHandler.extend({formatSuggestions:function(descriptors,query){var descriptors=this._super(descriptors,query);if(query.length===0){descriptors[0].footerText(AJS.I18n.getText("user.picker.ajax.short.desc"))}return descriptors}});AJS.CheckboxMultiSelectSuggestHandler=AJS.SelectSuggestHandler.extend({createClearAll:function(){return"<li class='check-list-group-actions'><a class='clear-all' href='#'>"+AJS.I18n.getText("jira.ajax.autocomplete.clear.all")+"</a></li>"},formatSuggestions:function(descriptors,query){var selectedItems=AJS.SuggestHelper.removeDuplicates(this.model.getDisplayableSelectedDescriptors());var selectedGroup=new AJS.GroupDescriptor({styleClass:"selected-group",items:selectedItems,actionBarHtml:selectedItems.length>1?this.createClearAll():null});descriptors.splice(0,0,selectedGroup);if(query.length>0){descriptors=AJS.SuggestHelper.removeDuplicates(descriptors);var items=AJS.SuggestHelper.extractItems(descriptors).sort(function(a,b){a=a.label().toLowerCase();b=b.label().toLowerCase();return a.localeCompare(b)});descriptors=[new AJS.GroupDescriptor({items:items})]}return descriptors}});AJS.UserListSuggestHandler=AJS.SelectSuggestHandler.extend({emailExpression:/^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,validateMirroring:function(query){return this.options.freeEmailInput&&query.length>0&&this.emailExpression.test(query)}});AJS.StaticDescriptorFetcher=Class.extend({init:function(options,model){this.model=model;this.model.$element.data("static-suggestions",true)},execute:function(query){var deferred=jQuery.Deferred();deferred.resolve(this.model.getUnSelectedDescriptors(),query);return deferred}});AJS.AjaxDescriptorFetcher=Class.extend({init:function(options){this.options=_.extend({keyInputPeriod:75,minQueryLength:1,data:{},dataType:"json"},options)},makeRequest:function(deferred,ajaxOptions,query){ajaxOptions.complete=_.bind(function(){this.outstandingRequest=null},this);ajaxOptions.success=_.bind(function(data){if(ajaxOptions.query){deferred.resolve(ajaxOptions.formatResponse(data,query))}else{this.lastResponse=ajaxOptions.formatResponse(data,query);deferred.resolve(this.lastResponse)}},this);var originalError=ajaxOptions.error;ajaxOptions.error=function(xhr,textStatus,msg,smartAjaxResult){if(!smartAjaxResult.aborted){if(originalError){originalError.apply(this,arguments)}else{alert(JIRA.SmartAjax.buildSimpleErrorContent(smartAjaxResult,{alert:true}))}}};this.outstandingRequest=JIRA.SmartAjax.makeRequest(ajaxOptions)},incubateRequest:function(deferred,ajaxOptions,query,force){clearTimeout(this.queuedRequest);if(force&&this.outstandingRequest){this.outstandingRequest.abort();this.outstandingRequest=null}if(!ajaxOptions.query&&this.lastResponse){deferred.resolve(this.lastResponse)}else{if(!this.outstandingRequest){if(typeof ajaxOptions.data==="function"){ajaxOptions.data=ajaxOptions.data(query)}else{ajaxOptions.data.query=query}if(typeof ajaxOptions.url==="function"){ajaxOptions.url=ajaxOptions.url()}if((query.length>=parseInt(ajaxOptions.minQueryLength,10))||force){this.makeRequest(deferred,ajaxOptions,query)}else{deferred.resolve()}}else{this.queuedRequest=setTimeout(_.bind(function(){this.incubateRequest(deferred,ajaxOptions,query,true)},this),ajaxOptions.keyInputPeriod)}}return deferred},execute:function(query,force){var deferred=jQuery.Deferred();deferred.fail(_.bind(function(){clearTimeout(this.queuedRequest);if(this.outstandingRequest){this.outstandingRequest.abort()}},this));this.incubateRequest(deferred,_.extend({},this.options),query,force);return deferred}});AJS.MixedDescriptorFetcher=Class.extend({init:function(options,model){this.ajaxFetcher=new AJS.AjaxDescriptorFetcher(options.ajaxOptions);this.options=options;this.model=model},execute:function(query,force){var deferred=jQuery.Deferred();if(query.length>=1){var ajaxDeferred=this.ajaxFetcher.execute(query,force).done(_.bind(function(suggestions){var descriptors=[].concat(this.model.getAllDescriptors()).concat(suggestions);deferred.resolve(descriptors,query)},this));deferred.fail(function(){ajaxDeferred.reject()})}else{deferred.resolve(this.model.getUnSelectedDescriptors(),query)}return deferred}});AJS.FuncDescriptorFetcher=Class.extend({init:function(options){this.options=options},execute:function(query){var deferred=jQuery.Deferred();deferred.resolve(this.options.suggestions(query),query);return deferred}})})();