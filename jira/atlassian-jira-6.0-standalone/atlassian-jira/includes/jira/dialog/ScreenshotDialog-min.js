JIRA.ScreenshotDialog=function(options){this.$trigger=jQuery(options.trigger);AJS.$(document).delegate(options.trigger,"click",function(e){e.preventDefault();if(JIRA.Dialog.current){JIRA.Dialog.current.hide()}if(AJS.InlineLayer.current){AJS.InlineLayer.current.hide()}window.open(AJS.$(this).attr("href")+"&decorator=popup","screenshot","width=800,height=700,scrollbars=yes,status=yes")})};AJS.namespace("jira.app.attachments.screenshot.ScreenshotWindow",null,JIRA.ScreenshotDialog);