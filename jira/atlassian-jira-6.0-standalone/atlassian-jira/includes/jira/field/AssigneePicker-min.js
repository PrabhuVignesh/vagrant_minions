JIRA.AssigneePicker=AJS.SingleSelect.extend({init:function(options){var element=options.element;function data(query){AJS.populateParameters();return{username:query,projectKeys:AJS.params.projectKeys,issueKey:AJS.params.assigneeEditIssueKey,actionDescriptorId:AJS.params.actionDescriptorId,maxResults:1000}}function formatResponse(response){var ret=[];if(response.length){var groupDescriptor=new AJS.GroupDescriptor({weight:1,id:"assignee-group-search",uniqueItemScope:"container",replace:true,label:AJS.I18n.getText("assignee.picker.group.search")});for(var i=0,len=response.length;i<len;i++){var user=response[i];var username=user.name;var displayName=user.displayName;var emailAddress=user.emailAddress;var label=displayName+" - "+emailAddress+" ("+username+")";groupDescriptor.addItem(new AJS.ItemDescriptor({value:username,fieldText:displayName,label:label,allowDuplicate:false,icon:user.avatarUrls["16x16"]}))}ret.push(groupDescriptor)}return ret}AJS.$.extend(options,{submitInputVal:true,showDropdownButton:!!element.data("show-dropdown-button"),errorMessage:AJS.I18n.getText("assignee.picker.invalid.user"),localDataGroupId:"assignee-group-suggested",content:"mixed",removeDuplicates:true,ajaxOptions:{url:function(){AJS.params.assigneeEditIssueKey=undefined;AJS.populateParameters();var path=AJS.params.assigneeEditIssueKey?"search":"multiProjectSearch";return contextPath+"/rest/api/latest/user/assignable/"+path},query:true,data:data,formatResponse:formatResponse}});this._super(options);this.suggestionsHandler=new JIRA.AssigneeSuggestHandler(this.options,this.model)},handleFreeInput:function(value){if(""===AJS.$.trim(value||this.$field.val())){this.setSelection(this.model.getDescriptor("-1"))}else{this._super(value)}},cleanUpModel:function(){}});