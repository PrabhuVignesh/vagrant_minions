AJS.CheckboxMultiSelect=AJS.QueryableDropdownSelect.extend({init:function(options){var instance=this;AJS.$.extend(this,AJS.SelectHelper);this._setOptions(options);var element=AJS.$(this.options.element);if(!element.attr("multiple")){throw"Cannot create CheckboxMultiSelect without multiple-select select element."}this.options.element=AJS.$(this.options.element).hide();this.model=new AJS.SelectModel({element:this.options.element,removeOnUnSelect:this.options.removeOnUnSelect});this.suggestionsHandler=this.options.suggestionsHandler?new this.options.suggestionsHandler(this.options,this.model):new AJS.CheckboxMultiSelectSuggestHandler(this.options,this.model);this.options.element.bind("updateOptions",function(){instance._setOptions(options)}).bind("selectOption",function(e,descriptor){instance.selectItem(descriptor)}).bind("removeOption",function(e,descriptor){instance.unselectItem(descriptor)}).bind("clear",function(){instance.clear()});this._createFurniture();this.dropdownController={show:AJS.$.noop,setWidth:AJS.$.noop,setPosition:AJS.$.noop,hide:AJS.$.noop};this.listController=new AJS.List({stallEventBind:this.options.stallEventBind,containerSelector:AJS.$(".aui-list",this.$container),scrollContainer:".aui-list-scroll",selectionEvent:"change",delegateTarget:this.$field,hasLinks:false,itemSelector:".check-list-item",groupSelector:"ul.aui-list-section",matchingStrategy:this.options.matchingStrategy,maxInlineResultsDisplayed:this.options.maxInlineResultsDisplayed,renderers:{suggestion:this._renders.suggestionItem},selectionHandler:function(e){var focusedItem;if(e.type==="change"){focusedItem=AJS.$(e.target).closest(this.options.itemSelector)}else{focusedItem=this.getFocused()}instance._selectionHandler(focusedItem,e);return false}});this._assignEventsToFurniture();this.render();this.model.$element.addClass("check-list-select-select").trigger("initialized",[this]);JIRA.trigger(JIRA.Events.CHECKBOXMULITSELECT_READY,[this.model.$element,this]);return this},_handleCharacterInput:function(force){AJS.$.each(this.listController.$container.find(".invalid-item"),function(){AJS.$(this).tipsy("hide")});this.requestSuggestions(force).done(_.bind(function(suggestions){this._setSuggestions(suggestions)},this));this.$dropDownIcon.toggleClass("clear-field",!!this.getQueryVal());this.listController.moveToFirst()},_getDefaultOptions:function(){return AJS.$.extend(true,this._super(),{errorMessage:AJS.I18n.getText("jira.ajax.autocomplete.error"),stallEventBind:true})},_createFurniture:function(){var id=this.model.$element.attr("id");this.$container=this._render("container",id);this.$fieldContainer=this._render("fieldContainer").appendTo(this.$container);this.$field=this._render("field",id,this._getPlaceholderText()).appendTo(this.$fieldContainer);this.$container.append(this._render("suggestionsContainer",id));this.$container.insertBefore(this.model.$element);this.$dropDownIcon=this._render("dropdownAndLoadingIcon").appendTo(this.$fieldContainer)},_getPlaceholderText:function(){var placeholderText=AJS.$.trim(this.model.$element.data("placeholder-text"));return(placeholderText&&placeholderText!=="")?placeholderText:AJS.I18n.getText("common.concepts.search")},_assignEventsToFurniture:function(){var instance=this;this._assignEvents("body",document);if(this.options.stallEventBind){window.setTimeout(function(){instance._assignEvents("field",instance.$field)._assignEvents("keys",instance.$field)._assignEvents("container",instance.$container)._assignEvents("fieldIcon",instance.$dropDownIcon)},0)}else{instance._assignEvents("field",instance.$field)._assignEvents("keys",instance.$field)._assignEvents("fieldIcon",instance.$dropDownIcon)}this.listController.$container.delegate(".clear-all","click",function(event){event.preventDefault();var $clearAll=jQuery(event.target);if($clearAll.hasClass("disabled")){return }$clearAll.parent().remove();instance.clear()})},clear:function(){var instance=this;var selectedDescriptors=this.model.getDisplayableSelectedDescriptors();this.model.setAllUnSelected();if(this.$field.val().length===0){this.$field.val("");this.listController.$container.find(":checkbox").removeAttr("checked")}else{this.clearQueryField();this.listController.moveToFirst()}this._toggleClearButton();jQuery.each(selectedDescriptors,function(){instance.model.$element.trigger("unselect",[this,instance,true])})},clearQueryField:function(){this.$field.val("");this._handleCharacterInput(true);this.$field.focus()},unselectItem:function(descriptor){this.model.setUnSelected(descriptor);this.model.$element.trigger("unselect",[descriptor,this,false]);this.$container.find(".aui-list input[type=checkbox]").each(function(){if(this.value===descriptor.value()){this.checked=false}})},_handleEscape:function(e){var $field=this.$field;if(e.type==="keydown"&&$field.val()!==""){e.stopPropagation();$field.val("");$field.on("keyup",handleEscKeyUp);this._handleCharacterInput(true)}function handleEscKeyUp(event){if(event.keyCode===27){event.stopPropagation();$field.off("keyup",handleEscKeyUp)}}},selectItem:function(descriptor,initialize){this.model.setSelected(descriptor);if(!initialize){this.model.$element.trigger("selected",[descriptor,this])}this.$container.find(".aui-list input[type=checkbox]").each(function(){if(this.value===descriptor.value()){this.checked=true}})},_selectionHandler:function(selected,event){var instance=this;selected.each(function(){var descriptor=AJS.$.data(this,"descriptor"),$input=AJS.$(this).find(":input");if(instance._directCheckboxClick||event.shiftKey){descriptor.properties.fromCheckbox=true}instance._setDescriptorSelection(descriptor,$input)});this._toggleClearButton()},_toggleClearButton:function(){var hasSelection=this.model.getSelectedValues().length>0;this.listController.$container.find(".clear-all").attr("tabindex",hasSelection?null:-1).closest(".check-list-group-actions").toggleClass("hidden",!hasSelection)},_setDescriptorSelection:function(descriptor,$input){if(!descriptor.selected()){this.selectItem(descriptor);$input.attr("checked","checked")}else{this.unselectItem(descriptor);$input.removeAttr("checked")}},render:function(){this._handleCharacterInput(true)},_events:{field:{"keydown":function(event){if(event.keyCode===13){event.preventDefault();var instance=this;this.model.$element.bind("unselect selected",handleSelected);setTimeout(function(){instance.model.$element.unbind("unselect selected",handleSelected)},0)}function handleSelected(){if(jQuery.trim(instance.$field.val())!==""){instance.$field.val("");instance._handleCharacterInput(true)}}}},container:{mousedown:function(event){var instance=this;function onmouseup(event){if(event.type==="mouseup"){instance._directCheckboxClick=true;setTimeout(function(){instance._directCheckboxClick=false},40)}jQuery(document).unbind("mouseup mouseleave",onmouseup)}if(jQuery(event.target).is("input[type=checkbox]")){jQuery(document).unbind("mouseup mouseleave",onmouseup).bind("mouseup mouseleave",onmouseup)}if(event.target!==this.$field.get(0)){event.preventDefault()}},click:function(){if(this.$field.get(0)!==document.activeElement){this.$field.focus()}}},fieldIcon:{click:function(e){if(AJS.$(e.target).hasClass("clear-field")){this.clearQueryField()}}}},_renders:{errorMessage:function(idPrefix){return AJS.$('<div class="error" />').attr("id",idPrefix+"-error")},fieldContainer:function(){return AJS.$("<div class='check-list-field-container' />")},field:function(idPrefix,placeholderText){return jQuery("<input>").attr({"autocomplete":"off","placeholder":placeholderText,"class":"aui-field check-list-field","id":idPrefix+"-input","wrap":"off"})},disableSelectField:function(id){return AJS.$("<input type='text' class='long-field' name='"+id+"' id='"+id+"' />")},container:function(idPrefix){return AJS.$('<div class="check-list-select" id="'+idPrefix+'-multi-select">')},suggestionsContainer:function(idPrefix){return AJS.$('<div class="aui-list" id="'+idPrefix+'-suggestions"></div>')},suggestionItem:function(descriptor,replacementText){var $checkbox=AJS.$("<input type='checkbox' tabindex='-1' />").val(descriptor.value()),$listElem=AJS.$('<li class="check-list-item">'),$label=AJS.$("<label class='item-label' />"),$tipsyTarget,$img;if(descriptor.styleClass()){$listElem.addClass(descriptor.styleClass())}if(replacementText){$label.html(replacementText)}else{if(descriptor.html()){$label.html(descriptor.html())}else{$label.text(descriptor.label())}}if(descriptor.selected()){$checkbox.attr("checked","checked")}if(descriptor.icon()&&descriptor.icon()!=="none"){$img=AJS.$("<img src='"+descriptor.icon()+"' height='16' width='16' align='absmiddle' />");if(descriptor.fallbackIcon()&&descriptor.fallbackIcon()!=="none"){$img.one("error",function(){this.src=descriptor.fallbackIcon()})}$label.prepend($img)}if(descriptor.title()){$label.attr("title",descriptor.title())}if(descriptor.disabled()){$listElem.addClass("disabled");$checkbox.attr("disabled","disabled")}$label.prepend($checkbox);if(descriptor.invalid()||descriptor.disabled()){$listElem.addClass("has-invalid-item");$label.append("<span class='invalid-item'></span>");$tipsyTarget=$label.find(".invalid-item");_.defer(function(){$listElem.attr("original-title",$listElem.attr("title"));$listElem.removeAttr("title")});var title;if(descriptor.title()){title=descriptor.title();$label.attr("original-title",title);$label.removeAttr("title")}else{title=AJS.I18n.getText("jira.search.context.invalid.generic",AJS.I18n.getText("common.concepts.value"),descriptor.label())}$tipsyTarget.tipsy({title:function(){return title},className:"tipsy-front",trigger:"manual"});$tipsyTarget.hoverIntent({interval:200,over:function(){$tipsyTarget.tipsy("show")},out:function(){$tipsyTarget.tipsy("hide")}})}return $listElem.append($label).data("descriptor",descriptor)}},handleFreeInput:jQuery.noop,hideSuggestions:jQuery.noop,showErrorMessage:jQuery.noop,_deactivate:jQuery.noop});JIRA.Events.CHECKBOXMULITSELECT_READY="checkboxMultiSelectReady";