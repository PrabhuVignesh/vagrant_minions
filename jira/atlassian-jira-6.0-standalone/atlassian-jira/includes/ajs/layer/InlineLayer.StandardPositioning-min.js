AJS.InlineLayer.StandardPositioning=Class.extend({init:function(){this.rebuiltCallbacks=[]},left:function(){var offset=this.offset();return{left:offset.left,top:offset.top+this.offsetTarget().outerHeight()}},right:function(){var offset=this.offset();return{left:offset.left-this.layer().outerWidth()+this.offsetTarget().outerWidth(),top:offset.top+this.offsetTarget().outerHeight()}},window:function(){return window},offset:function(){var offset=this.offsetTarget().offset();if(this.offsetTarget().hasFixedParent()){this.layer().css("position","fixed");offset.top=offset.top-AJS.$(window).scrollTop()}else{this.layer().css("position","absolute")}return offset},rebuilt:function(arg){var instance=this;if(AJS.$.isFunction(arg)){this.rebuiltCallbacks.push(arg)}else{AJS.$.each(this.rebuiltCallbacks,function(){this(instance.layer())})}},appendToBody:function(){this.layer().appendTo("body")},appendToPlaceholder:function(){this.layer().appendTo(this.$placeholder)},scrollTo:function(){}});AJS.InlineLayer.WindowPositioning=AJS.InlineLayer.StandardPositioning.extend({_calculateOverflow:function(offset){var isFixed=this.layer().css("position")==="fixed",layerBottom=offset.top+this.layer().outerHeight(true),windowHeight=jQuery(window).outerHeight(),windowScroll=jQuery(window).scrollTop();if(isFixed){return Math.max(0,layerBottom-windowHeight)}else{return Math.max(0,layerBottom-windowScroll-windowHeight)}},left:function(){var offset=this._super(),overflow=this._calculateOverflow(offset);if(overflow>0){offset.left+=this.offsetTarget().outerWidth();offset.top-=overflow}return offset},right:function(){var offset=this._super(),overflow=this._calculateOverflow(offset);if(overflow>0){offset.left-=this.offsetTarget().outerWidth();offset.top-=overflow}return offset}});