AJS.Navigator=jQuery.extend({},AJS.Navigator,{family:function(){if(jQuery.browser["msie"]){return this.Families.INTERNET_EXPLORER}if(jQuery.browser["mozilla"]){return this.Families.MOZILLA}if(jQuery.browser["webkit"]){return this.Families.WEBKIT}if(jQuery.browser["opera"]){return this.Families.OPERA}return this.Families.UNKNOWN},modifierKey:function(){if(this.family()===this.Families.INTERNET_EXPLORER){return"Alt"}if(this.family()===this.Families.MOZILLA){if(jQuery.os.mac){return"Ctrl"}else{return"Alt+Shift"}}if(this.family()===this.Families.WEBKIT){if(jQuery.os.windows){return"Alt"}else{return"Ctrl+Alt"}}if(this.family()===this.Families.OPERA){return"Shift+Esc"}return"Alt"}});AJS.Navigator.Families=jQuery.extend({},AJS.Navigator.Families,{INTERNET_EXPLORER:"msie",MOZILLA:"mozilla",WEBKIT:"webkit",OPERA:"opera",UNKNOWN:"unknown"});