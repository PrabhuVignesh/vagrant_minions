AJS.DeferredContentRetriever=AJS.ContentRetriever.extend({init:function(func){this.func=func},content:function(callback){if(AJS.$.isFunction(callback)){var res=this.func();if(res instanceof jQuery){callback(res)}else{res.done(_.bind(function(content){callback(content)},this))}}},cache:function(){return false},isLocked:function(){},startingRequest:function(){},finishedRequest:function(){}});