AJS.SelectHelper = {


    updateFreeInputVal: function () {
        if (this.options.submitInputVal) {
            this.model.updateFreeInput(this.$field.val());
        }
    },

    removeFreeInputVal: function () {
        if (this.options.submitInputVal) {
            this.model.removeFreeInputVal();
        }
    }
};
