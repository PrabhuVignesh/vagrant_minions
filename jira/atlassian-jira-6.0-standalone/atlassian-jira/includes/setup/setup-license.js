if (!AJS.isDevMode) {
    AJS.isDevMode = function() {
        return AJS.Meta.get("dev-mode");
    }
}

// 30 second timeout on all requests by default.
AJS.$.ajaxSetup({timeout: 30000});

AJS.$(function() {
    var firstName, lastName, email, licenseKey, surveyQuestions;

    var browserSupportsCORS = _.once(function() {
        return "withCredentials" in new XMLHttpRequest();
    });

    // The following functions are for URL encoding for JSONP requests.
    // See https://extranet.atlassian.com/display/IT/JSONP+mapping+for+public+REST+APIs for more details.
    var encode_utf8 = function (s) {
        return unescape(encodeURIComponent(s));
    }

    var decode_utf8 = function (s) {
        return decodeURIComponent(escape(s));
    }

    var encodeRequestBody = function(obj) {
        var charmap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        var str = encode_utf8(JSON.stringify(obj)) + "  ";
        var result = [];
        for (var i = 0; i+2 < str.length; i += 3) {
            var threech = 0;
            for (var j = 0; j < 3; ++j) {
                threech = (threech << 8) + str.charCodeAt(i+j);
            }

            // threech is 24bits long, encode this as 4 chars, each with 6 bits
            for (var j = 3; j >= 0; --j) {
                var chpart = (threech >> (6*j)) & 0x3f;
                result.push(charmap.charAt(chpart));
            }
        }
        return result.join('');
    }

    var decodeRequestBody = function(str) {
        // this is very inefficient and is included as an example only

        if (str.length % 4 != 0) {
            return "wrong length fail " + str.length;
        }

        var charmap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

        var result = [];
        for (var i = 0; i < str.length; i += 4) {
            var threech = 0;
            for (var j = 0; j < 4; ++j) {
                var chpart = str.charCodeAt(i+j);
                chpart = charmap.indexOf(String.fromCharCode(chpart));
                threech = (threech << 6) + chpart;
            }

            for (var j = 2; j >= 0; --j) {
                var ch = (threech >> (j*8)) & 0xff;
                result.push(String.fromCharCode(ch));
            }
        }
        return decode_utf8(result.join(''));
    }

    var serializeObject = function(obj)
    {
        var o = {};
        var a = obj.serializeArray();
        AJS.$.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    // Return a copy of the object only containing the whitelisted properties.
    var pick = function(obj) {
        var copy = {};
        var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
        _.each(keys, function(key) {
            if (key in obj) copy[key] = obj[key];
        });
        return copy;
    };

    var $newMacUserForm = AJS.$(JIRA.Templates.LicenseSetup.renderAddUserForm());
    $newMacUserForm.submit(_.compose(formSubmitCleanup, newMacUserFormSubmit, showSpinner, disableRadioButtons, disableSubmit, clearErrorsOnForm, preventDefaultOnEvent));
    $newMacUserForm.find("#email").change(function() {
        clearWarningsOnForm();
        var email = AJS.$(this).val();
        if (AJS.$.trim(email) !== "") {
            checkIfUserExists(email);
        }
    });
    $newMacUserForm.find(".select").each(function () {
        new AJS.SingleSelect({
            element: this,
            setMaxHeightToWindow: true,
            hasLinks: false
        }).$container.addClass((' ' + this.className + ' ').replace(' select ', ' '));
    });

    var $existingMacUserForm = AJS.$(JIRA.Templates.LicenseSetup.renderLoginUserForm());
    $existingMacUserForm.submit(_.compose(formSubmitCleanup, existingMacUserFormSubmit, showSpinner, disableRadioButtons, disableSubmit, clearErrorsOnForm, preventDefaultOnEvent));

    var $existingLicenseForm = AJS.$(JIRA.Templates.LicenseSetup.renderExistingLicenseForm({
        serverId: AJS.Meta.get('server-id')
    }));
    $existingLicenseForm.submit(_.compose(formSubmitCleanup, existingLicenseFormSubmit, showSpinner, disableRadioButtons, disableSubmit, clearErrorsOnForm, preventDefaultOnEvent));

    var setupScreens = {
        "newAccount": showAddUserForm,
        "login" : showExistingMacUserForm,
        "existingLicense": showExistingLicenseForm
    };

    var $licenseInputContainer = AJS.$("#license-input-container");

    AJS.$("input[name=licenseSetupSelector]").change(switchSetupScreen);

    function switchSetupScreen() {
        setupScreens[AJS.$(this).val()]();
    }

    function showAddUserForm() {
        showForm($newMacUserForm);
        showSurveySection();
    }

    function showExistingMacUserForm() {
        showForm($existingMacUserForm);
    }

    function showExistingLicenseForm() {
        showForm($existingLicenseForm);
    }

    function showForm(form) {
        $licenseInputContainer.children().detach();
        $licenseInputContainer.append(form).removeClass("hidden");
    }

    function getEventRef(e) {
        return e.target || e.srcElement;
    }

    function getLasooURL() {
        return AJS.isDevMode() ? "https://id-staging.atlassian.com/" : "https://id.atlassian.com/";
    }

    function getHamletUrl() {
        return AJS.isDevMode() ? "https://intsys-staging.atlassian.com/hamlet/" : "https://hamlet.atlassian.com/";
    }

    function createMacUser(formValues) {
        var newUserValues = pick(formValues, "firstName", "lastName", "email", "password", "confirmPassword", "companyName", "country", "subscribeNewsletter");

        if (_.has(newUserValues, "subscribeNewsletter")) {
            newUserValues.subscribeNewsletter = "true";
        }

        firstName = newUserValues.firstName;
        lastName = newUserValues.lastName;
        email = newUserValues.email;

        var request;
        if (browserSupportsCORS()) {
            request = AJS.$.ajax({
                url: getLasooURL() + "profile/rest/signUp",
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify(newUserValues)
            });
        } else {
            request = AJS.$.ajax({
                url: getLasooURL() + "profile/rest/signUp",
                type: "GET",
                contentType: "application/json",
                dataType: "jsonp",
                jsonp: "jsonp",
                data: {
                    method: "POST",
                    "h-Content-Type": "application/json",
                    body: encodeRequestBody(newUserValues)
                }
            }).pipe(function(jqXHR, textStatus) {
                var jsonResponse = new Object();
                jsonResponse.status = jqXHR[0].status || jqXHR.status;
                jsonResponse.message = jqXHR[0].message || jqXHR.message;
                jsonResponse.responseText = JSON.stringify(jqXHR[1]) || "";
                if (jsonResponse.status != 200) {
                    return (jQuery.Deferred().rejectWith(jqXHR, [jsonResponse, textStatus]));
                } else {
                    jsonResponse.username = jqXHR[1].username;
                    jsonResponse.xsrfToken = jqXHR[1].xsrfToken;
                    return (jQuery.Deferred().resolveWith(jqXHR, [jsonResponse, textStatus]));
                }
            });
        }
        return request;
    }

    function surveyQuestionsAvailable(formValues) {
        return !_.isArray(surveyQuestions) || !surveyQuestions.length > 0 || !formValues[surveyQuestions[0].questionKey] === "undefined";
    }

    function submitSurveyQuestions(formValues, licenseId, xsrfToken) {
        if (surveyQuestionsAvailable(formValues)) {
            return jQuery.Deferred.reject();
        }

        var answerFunctions = {
            "SELECT" : getSurveySelectAnswer,
            "CHECKBOX" : getSurveyCheckboxAnswer,
            "TEXT" : getSurveyTextAnswer
        };

        var answers = [];
        AJS.$.each(surveyQuestions, function(key, question) {
            var answer = formValues[question.questionKey];
            if (question.responseType in answerFunctions) {
                answers.push(answerFunctions[question.responseType](question, answer));
            }
        });

        if (browserSupportsCORS()) {
            return AJS.$.ajax({
                url: getHamletUrl() + "1.0/public/survey/saveForLicense",
                type: "POST",
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("ATL-XSRF-Token", xsrfToken);
                },
                xhrFields: {
                    withCredentials: true
                },
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify({
                    licenseId: licenseId,
                    responses: answers
                })
            });
        } else {
            jsonpData = {
                licenseId: licenseId,
                responses: answers
            };
            return AJS.$.ajax({
                url: getHamletUrl() + "1.0/public/survey/saveForLicense",
                type: "GET",
                contentType: "application/json",
                dataType: "jsonp",
                jsonp: "jsonp",
                data: {
                    method: "POST",
                    "h-Content-Type": "application/json",
                    "h-ATL-XSRF-Token": xsrfToken,
                    body: encodeRequestBody(jsonpData)
                }
            });
        }
    }

    function doesAnswerAllowFreeText(answers, answerKey) {
        var answer = _.first(AJS.$.grep(answers, function(answer) {
            return answer.key == answerKey;
        }));
        if (answer == null) {
            return false;
        } else {
            return answer.freeText;
        }
    }

    function getSurveySelectAnswer(question, answer) {
        if (doesAnswerAllowFreeText(question.responseOptions, answer)) {
            var textResponse = AJS.$("input[id='" + question.questionKey + "-text']").val();
            return {questionKey : question.questionKey, freeTextAnswer: textResponse};
        } else {
            return {questionKey : question.questionKey, answers: [answer]};
        }
    }

    function getSurveyCheckboxAnswer(question, answers) {
        var responses = [];
        var freeTextAnswer = "";
        if (!AJS.$.isArray(answers)) {
            answers = [answers];
        }

        _.each(answers, function(answer) {
            if (doesAnswerAllowFreeText(question.responseOptions, answer)) {
                freeTextAnswer = AJS.$("#" + answer + "-text").val();
            } else {
                responses.push(answer);
            }
        });

        return {questionKey : question.questionKey, answers: responses, freeTextAnswer: freeTextAnswer};
    }

    function getSurveyTextAnswer(question, answer) {
        return {questionKey : question.questionKey, freeTextAnswer: answer || ""};
    }

    function userExists(username) {
        if (browserSupportsCORS()) {
            return AJS.$.ajax({
                url: getLasooURL() + "profile/rest/user/" + username,
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                }
            });
        } else {
            return AJS.$.ajax({
                url: getLasooURL() + "profile/rest/user/" + username,
                type: "GET",
                contentType: "application/json",
                dataType: "jsonp",
                jsonp: "jsonp",
                data: {
                    method: "GET",
                    "h-Content-Type": "application/json"
                }
            }).pipe(function(jqXHR, textStatus) {
                if (jqXHR[0].status != 200) {
                    return (jQuery.Deferred().rejectWith(jqXHR, [jqXHR[1], textStatus]));
                } else {
                    return (jQuery.Deferred().resolveWith(jqXHR, [jqXHR[1], textStatus]));
                }
            });
        }
    }

    function generateEvaluationLicense(xsrfToken) {
        if (browserSupportsCORS()) {
            return AJS.$.ajax({
                url: getHamletUrl() + "1.0/public/license/createEvaluation",
                type: "POST",
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("ATL-XSRF-Token", xsrfToken);
                },
                xhrFields: {
                    withCredentials: true
                },
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify({
                    productKey: "jira",
                    serverId: AJS.Meta.get('server-id')
                })
            });
        } else {
            jsonpData = {
                productKey: "jira",
                serverId: AJS.Meta.get('server-id')
            };
            return AJS.$.ajax({
                url: getHamletUrl() + "1.0/public/license/createEvaluation",
                type: "GET",
                contentType: "application/json",
                dataType: "jsonp",
                jsonp: "jsonp",
                data: {
                    method: "POST",
                    "h-Content-Type": "application/json",
                    "h-ATL-XSRF-Token": xsrfToken,
                    body: encodeRequestBody(jsonpData)
                }
            }).pipe(function(jqXHR, textStatus) {
                var jsonResponse = new Object();
                jsonResponse.status = jqXHR[0].status || jqXHR.status;
                jsonResponse.message = jqXHR[0].message || jqXHR.message;
                jsonResponse.responseText = JSON.stringify(jqXHR[1]) || "";
                if (jsonResponse.status != 200) {
                    return (jQuery.Deferred().rejectWith(jqXHR, [jsonResponse, textStatus]));
                } else {
                    jsonResponse.licenseKey = jqXHR[1].licenseKey;
                    jsonResponse.id = jqXHR[1].id;
                    return (jQuery.Deferred().resolveWith(jqXHR, [jsonResponse, textStatus]));
                }
            });
        }
    }

    function loginMacUser(formValues) {
        var loginUserValues = pick(formValues, "username", "password");
        email = loginUserValues.username;

        if (browserSupportsCORS()) {
            return AJS.$.ajax({
                url: getLasooURL() + "id/rest/login",
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify(loginUserValues)
            });
        } else {
            return AJS.$.ajax({
                url: getLasooURL() + "id/rest/login",
                type: "POST",
                contentType: "application/json",
                dataType: "jsonp",
                jsonp: "jsonp",
                data: {
                    method: "POST",
                    "h-Content-Type": "application/json",
                    body: encodeRequestBody(loginUserValues)
                }
            }).pipe(function(jqXHR, textStatus) {
                var jsonResponse = new Object();
                jsonResponse.status = jqXHR[0].status || jqXHR.status;
                jsonResponse.message = jqXHR[0].message || jqXHR.message;
                jsonResponse.responseText = JSON.stringify(jqXHR[1]) || "";
                if (jsonResponse.status != 200) {
                    return (jQuery.Deferred().rejectWith(jqXHR, [jsonResponse, textStatus]));
                } else {
                    jsonResponse.username = jqXHR[1].username;
                    jsonResponse.xsrfToken = jqXHR[1].xsrfToken;
                    return (jQuery.Deferred().resolveWith(jqXHR, [jsonResponse, textStatus]));
                }
            });
        }
    }

    function verifyLicense(licenseKey) {
        return AJS.$.ajax({
            url: contextPath + "SetupLicense!validateLicense.jspa?licenseToValidate=" + licenseKey,
            type: "POST"
        });
    }

    function errorCreatingMacUser(jqXHR, textStatus) {
        if (jqXHR.status === 400) {
            var errors = JSON.parse(jqXHR.responseText);
            // This would be handled as a error at the top of the form.
            var fieldErrors = errors.fieldErrors;
            if (!_.isUndefined(fieldErrors) && !AJS.$.isEmptyObject(fieldErrors)) {
                AJS.$.each(fieldErrors, function(key, value) {
                    showFieldError(AJS.$("#" + key), value);
                });
            } else if (!_.isUndefined(errors.unknownError)) {
                showFormErrorExpandable(AJS.I18n.getText("setupLicense.error.unknown.title"),
                                        AJS.I18n.getText("setupLicense.error.unknown.desc", "<a href='https://support.atlassian.com' target='_blank'>", "</a>"),
                                        fieldErrors.unknownError);
            } else {
                showFormError(AJS.I18n.getText("setupLicense.error.unknown.title"),
                              AJS.I18n.getText("setupLicense.error.unknown.desc", "<a href='https://support.atlassian.com' target='_blank'>", "</a>"));
            }
        } else {
            generalErrorLogging(jqXHR, textStatus);
        }
    }

    function checkIfUserExists(emailAddress) {
        var userExistsChecker = jQuery.Deferred();
        var serverRequest = userExists(emailAddress);
        serverRequest.done(function(jqXHR){
            if (!formSubmitted) {
                userExistsChecker.resolve(jqXHR);
            }
        });
        serverRequest.fail(function(jqXHR) {
            if (!formSubmitted) {
                userExistsChecker.reject(jqXHR)
            }
        });

        userExistsChecker.fail(clearGeneralErrorsOnForm);
        userExistsChecker.fail(generalErrorLogging);
        userExistsChecker.done(function(jqXHR) {
            if (jqXHR.exists == true) {
                showExistingEmailMessage(emailAddress);
            }
        });

        return userExistsChecker;
    };

    var formSubmitted = false;

    function newMacUserFormSubmit(e) {
        formSubmitted = true;
        clearErrorsOnForm();
        var mainDeferred = jQuery.Deferred();

        var formValues = serializeObject(AJS.$(getEventRef(e)));
        var createMacUserDeferred = createMacUser(formValues);
        createMacUserDeferred.fail(errorCreatingMacUser);
        createMacUserDeferred.fail(function() { mainDeferred.reject(); });
        createMacUserDeferred.done(function(jqXHR) {
            var xsrfToken = getXSRFTokenFromResponse(jqXHR);
            var evalLicenseGenerationDeferred = generateEvaluationLicense(xsrfToken);
            evalLicenseGenerationDeferred.fail(errorGeneratingEvaluationLicense);
            evalLicenseGenerationDeferred.fail(function() { mainDeferred.reject(); });

            evalLicenseGenerationDeferred.done(function(jqXHR) {
                var surveyDeferred = submitSurveyQuestions(formValues, getLicenseIdFromResponse(jqXHR), xsrfToken);

                surveyDeferred.always(function() {
                    var licenseVerificationDeferred = verifyLicense(getLicenseFromResponse(jqXHR));
                    licenseVerificationDeferred.fail(errorVerifyingLicense);
                    licenseVerificationDeferred.fail(function() { mainDeferred.reject(); });

                    licenseVerificationDeferred.done(function() {
                        licenseKey = getLicenseFromResponse(jqXHR);
                        mainDeferred.resolve();
                        submitLicenseKey();
                    });
                });
            });
        });
        createMacUserDeferred.always(function() { formSubmitted = false });

        return mainDeferred;
    };

    function errorLoggingInMacUser(jqXHR, textStatus) {
        if (jqXHR.status === 403) {
            var errors = JSON.parse(jqXHR.responseText);
            if (!_.isUndefined(errors)) {
                showFormError(AJS.I18n.getText("setup.loginmac.error.title"), errors.error);
            } else {
                showFormError(AJS.I18n.getText("setupLicense.error.unknown.title"), AJS.I18n.getText("setupLicense.error.unknown.desc", "<a href='https://support.atlassian.com' target='_blank'>", "</a>"));
            }
        } else {
            generalErrorLogging(jqXHR, textStatus);
        }
    }

    function generalErrorLogging(jqXHR, textStatus) {
        if (jqXHR.status === 500) {
            showFormError(AJS.I18n.getText("setupLicense.error.internalserver.title"), AJS.I18n.getText("setupLicense.error.internalserver.desc"));
        } else if (jqXHR.status === 404) {
            showFormError(AJS.I18n.getText("setupLicense.error.notfound.title"), AJS.I18n.getText("setupLicense.error.notfound.desc"));
        } else if (jqXHR.status === 0) {
            showFormError(AJS.I18n.getText("setupLicense.error.noconnection.title"), AJS.I18n.getText("setupLicense.error.noconnection.desc", "<a href='https://id.atlassian.com' target='_blank'>", "</a>"));
        } else if (textStatus == "timeout") {
            showFormError(AJS.I18n.getText("setupLicense.error.timeout.title"), AJS.I18n.getText("setupLicense.error.timeout.desc"));
        } else {
            showFormError(AJS.I18n.getText("setupLicense.error.unknown.title"), AJS.I18n.getText("setupLicense.error.unknown.desc", "<a href='https://support.atlassian.com' target='_blank'>", "</a>"));
        }
    }

    function errorGeneratingEvaluationLicense(jqXHR, textStatus) {
        generalErrorLogging(jqXHR, textStatus, "existingLicenseError");
    }

    function errorVerifyingLicense(jqXHR, textStatus) {
        if (jqXHR.status === 403) {
            var licenseErrors = JSON.parse(jqXHR.responseText);
            showFormErrorList(AJS.I18n.getText("setupLicense.error.licencevalidation.title"), licenseErrors.errors);
        } else {
            generalErrorLogging(jqXHR, textStatus);
        }
    }

    function getXSRFTokenFromResponse(jqXHR) {
        return jqXHR.xsrfToken;
    }

    function getLicenseFromResponse(jqXHR) {
        return jqXHR.licenseKey;
    }

    function getLicenseIdFromResponse(jqXHR) {
        return jqXHR.id;
    }

    function setPersonalDetailsFromLoginForAdminPage(jqXHR) {
        firstName = jqXHR.firstName;
        lastName = jqXHR.lastName;
        email = jqXHR.username;
    }

    function submitLicenseKey() {
        AJS.$("#setupLicenseKey").val(licenseKey);
        AJS.$("#setupFirstName").val(firstName);
        AJS.$("#setupLastName").val(lastName);
        AJS.$("#setupEmail").val(email);
        AJS.$("#setupLicenseForm").submit();
    }

    function existingMacUserFormSubmit(e) {
        clearErrorsOnForm();

        var mainDeferred = jQuery.Deferred();

        var formValues = serializeObject(AJS.$(getEventRef(e)));

        var loginMacUserDeferred = loginMacUser(formValues);
        loginMacUserDeferred.fail(errorLoggingInMacUser);
        loginMacUserDeferred.fail(function() { mainDeferred.reject(); });

        loginMacUserDeferred.done(function(jqXHR) {
            setPersonalDetailsFromLoginForAdminPage(jqXHR);
            var evalLicenseGenerationDeferred = generateEvaluationLicense(getXSRFTokenFromResponse(jqXHR));
            evalLicenseGenerationDeferred.fail(errorGeneratingEvaluationLicense);
            evalLicenseGenerationDeferred.fail(function() { mainDeferred.reject(); });

            evalLicenseGenerationDeferred.done(function(jqXHR) {
                var licenseVerificationDeferred = verifyLicense(getLicenseFromResponse(jqXHR));
                licenseVerificationDeferred.fail(errorVerifyingLicense);
                licenseVerificationDeferred.fail(function() { mainDeferred.reject(); });

                licenseVerificationDeferred.done(function() {
                    licenseKey = getLicenseFromResponse(jqXHR);
                    mainDeferred.resolve();
                    submitLicenseKey();
                });
            });
        });

        return mainDeferred;
    }

    function existingLicenseFormSubmit(e) {
        clearErrorsOnForm();

        var mainDeferred = jQuery.Deferred();

        var formValues = serializeObject(AJS.$(getEventRef(e)));
        var licenseVerificationDeferred = verifyLicense(formValues.licenseKey);
        licenseVerificationDeferred.fail(errorVerifyingLicense);
        licenseVerificationDeferred.fail(function() { mainDeferred.reject(); });

        licenseVerificationDeferred.done(function() {
            licenseKey = formValues.licenseKey;
            mainDeferred.resolve();
            submitLicenseKey();
        });

        return mainDeferred;
    }

    function showFieldError($field, msg) {
        AJS.$(JIRA.Templates.LicenseSetup.fieldError({msg: msg})).insertAfter($field);
    }

    function showExistingEmailMessage(emailAddress) {
        var msg = AJS.I18n.getText("setup.newmacuser.already.exists", "<a id='email-existing-login-link' href='#'>", "</a>");
        AJS.$("#email").next(".error").remove();
        AJS.$(JIRA.Templates.LicenseSetup.fieldMessage({id: "email-existing-warning"})).insertAfter(AJS.$("#email"));
        AJS.$("#email-existing-warning").html(msg);
        AJS.$("#email-existing-login-link").click(function() {
            AJS.$('input:radio[name="licenseSetupSelector"]').filter('[value="login"]').attr('checked', true);
            showExistingMacUserForm();
            AJS.$("#username").val(emailAddress);
        });
    }

    function showFormError(title, msg) {
        AJS.messages.error("#formError", {
            title: title,
            body: msg,
            closeable: false
        });
        AJS.$("#formError").scrollIntoView();
    }

    function showFormErrorList(title, msgList) {
        var errorStr = "";
        _.map(msgList, function(msg) {
            errorStr += msg + "<br />";
        });
        AJS.messages.error("#formError", {
            title: title,
            body: errorStr,
            closeable: false
        });
        AJS.$("#formError").scrollIntoView();
    }

    function showFormErrorExpandable(title, msg, expanded) {
        var $errorMsg = AJS.$(JIRA.Templates.LicenseSetup.expandableFormError({
            title: title,
            msg: msg,
            expandableMsg: expanded
        }));
        AJS.$("#formError").html($errorMsg).scrollIntoView();
        AJS.$("#expandError").click(function(e) {
            e.preventDefault();
            AJS.$("#expandError").hide();
            AJS.$("#expandedErrorMsg").show();
        });
    }

    function preventDefaultOnEvent(e) {
        e.preventDefault();
        return e;
    }

    function clearGeneralErrorsOnForm(e) {
        AJS.$(".aui-message.error").remove();
        return e;
    }

    function clearErrorsOnForm(e) {
        AJS.$(".error").remove();
        clearWarningsOnForm();
        return e;
    }

    function clearWarningsOnForm() {
        AJS.$(".warn").remove();
    }

    function disableSubmit(e) {
        AJS.$(getEventRef(e)).find(":submit").attr("disabled", "disabled");
        return e;
    }

    function disableRadioButtons(e) {
        AJS.$('input:radio[name="licenseSetupSelector"]').attr('disabled', "disabled");
        return e;
    }

    function showSpinner(e) {
        var spinnerMessage = getSpinnerMessage(e);
        AJS.$(getEventRef(e)).find(":submit").after(JIRA.Templates.LicenseSetup.renderSpinner({msg: spinnerMessage}));
        return e;
    }

    function getSpinnerMessage(e) {
        var currentDialog = AJS.$("input[name=licenseSetupSelector]:checked").val();
        var message = AJS.I18n.getText("setupLicense.loading");
        switch(currentDialog) {
            case "newAccount" :
                message = AJS.I18n.getText("setupLicense.new.user.spinner");
                break;
            case "login" :
                message = AJS.I18n.getText("setupLicense.existing.user.spinner");
                break;
            case "existingLicense" :
                message = AJS.I18n.getText("setupLicense.existing.license.spinner");
                break;
        }

        return message;
    }

    function formSubmitCleanup(deferred) {
        deferred.fail(function() {
            $licenseInputContainer.find(":submit").removeAttr("disabled");
            $licenseInputContainer.find(".throbber-message").remove();
            AJS.$('input:radio[name="licenseSetupSelector"]').removeAttr('disabled');
        });
    }

    function getSurveyQuestions() {
        if (browserSupportsCORS()) {
            return AJS.$.ajax({
                url: getHamletUrl() + "1.0/public/survey/retrieveQuestions?productKey=jira&licenseType=evaluation",
                type: "GET",
                contentType: "application/json",
                dataType: "json"
            });
        } else {
            return AJS.$.ajax({
                url: getHamletUrl() + "1.0/public/survey/retrieveQuestions?productKey=jira&licenseType=evaluation",
                type: "GET",
                contentType: "application/json",
                dataType: "jsonp",
                jsonp: "jsonp",
                data: {
                    method: "GET",
                    "h-Content-Type": "application/json"
                }
            }).pipe(function(jqXHR, textStatus) {
                if (surveyResponseOk(jqXHR[0].status)) {
                    return (jQuery.Deferred().resolveWith(jqXHR, [jqXHR[1], textStatus]));
                } else {
                    return (jQuery.Deferred().rejectWith(jqXHR, [jqXHR[1], textStatus]));
                }
            });
        }
    }

    function surveyResponseOk(statusCode) {
        return statusCode == 200 || statusCode == 204;
    }

    // Start loading the survey questions
    if (AJS.$("#license-input-container").length) {
        retrieveSurveyQuestions();
    }

    function retrieveSurveyQuestions() {
        var surveyQuestionsDeferred = getSurveyQuestions();
        surveyQuestionsDeferred.done(function(jqXHR) {
            if (isSurveyQuestionsRetrievalResponseValid(jqXHR)) {
                surveyQuestions = jqXHR;
                showSurveySection();
            } else {
                // got an invalid response from the service: just hide the survey questions
                AJS.$("#survey-section", $newMacUserForm).hide();
            }
        });
        surveyQuestionsDeferred.fail(function() {
            handleNoInternet();
        });
    }

    function isValidTextQuestion(question) {
        return _.has(question, "questionKey")
                && _.has(question, "questionText");
    }

    function isValidSelectOrCheckboxQuestion(question) {
        return isValidTextQuestion(question)
                && _.has(question, "responseOptions")
                && areValidAnswerOptions(question.responseOptions);
    }

    function areValidAnswerOptions(answers) {
        for (var i = 0; i < answers.length; i++) {
            if (!_.has(answers[i], "key") || !_.has(answers[i], "text")) {
                return false;
            }
        };

        return true;
    }

    function isSurveyQuestionsRetrievalResponseValid(questions) {
        if (questions == null || !_.isArray(questions)) {
            return false;
        }

        var validQuestionChecks = {
            "SELECT" : isValidSelectOrCheckboxQuestion,
            "CHECKBOX" : isValidSelectOrCheckboxQuestion,
            "TEXT" : isValidTextQuestion
        };

        for (var i = 0; i < questions.length; i++) {
            if (!_.has(questions[i], "responseType")
                    || !(questions[i].responseType in validQuestionChecks)
                    || !validQuestionChecks[questions[i].responseType](questions[i])) {
                return false;
            }
        };

        return true;
    }

    function showSurveySection() {
        if (surveyQuestions != undefined && AJS.$("#survey-section .throbber-message").length == 1) {
            $surveyContent = AJS.$(JIRA.Templates.LicenseSetup.surveyQuestionsSection({
                surveyQuestions: surveyQuestions
            }));
            $surveyContent.find(".select").each(function () {
                new AJS.SingleSelect({
                    element: this,
                    hasLinks: false
                }).$container.addClass((' ' + this.className + ' ').replace(' select ', ' '));
            });
            AJS.$("#survey-section").html($surveyContent);

            AJS.$(".survey-select").change(function(e) {
                var $freeTextContainer = AJS.$("div[id='" + e.target.id +  "-container']");
                var $selectedOption = AJS.$("option:selected", this);
                if ($selectedOption.hasClass("freeText")) {
                    $freeTextContainer.val("");
                    $freeTextContainer.show();
                } else {
                    $freeTextContainer.hide();
                }
            });
            $licenseInputContainer.find(".throbber-message").remove();
        }
    }

    function handleNoInternet() {
        AJS.$("#survey-section", $newMacUserForm).hide();
        // only switch to the import license form, if no form hasn't been selected yet
        if (!AJS.$("input[name='licenseSetupSelector']:checked").val()) {
            showExistingLicenseForm();
            AJS.$("#jira-setupwizard-licenseSetupSelectorexistingLicense").attr('checked', 'checked');
        }

        AJS.$("#no-connection-warning").show();
    }

    // Unselect radio button in case browser has remebered checked radio button in history.
    AJS.$("#license-radio-options").find("input").prop("checked", false);
});
