/*
Copyright (c) 2015, EDINA.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this
   list of conditions and the following disclaimer in the documentation and/or
   other materials provided with the distribution.
3. All advertising materials mentioning features or use of this software must
   display the following acknowledgement: This product includes software
   developed by the EDINA.
4. Neither the name of the EDINA nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific prior
   written permission.

THIS SOFTWARE IS PROVIDED BY EDINA ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL EDINA BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*/

'use strict';

/* global _ */
/* global cordova */

define(['records', 'utils', 'file', 'widgets'], function(records, utils, file, widgets) { // jshint ignore:line
    var bleData;

    var onFinishDtree;

    var pluginRoot = 'plugins/ble/';

    var fieldId = 'fieldcontain-ble-1';

    var inputValue = _.template(
        '<div id="ble-data">' +
            '<div class="ble-value">' +
                '<input type="text" ' +
                       'id="ble-value"' +
                       'value="<%= value %>" ' +
                       'data-ble-value="<%= ble %>" ' +
                       'readonly >' +
            '</div>' +
            '<div class="ble-delete">' +
                '<a href="#" data-role="button" ' +
                            'data-iconpos="notext" ' +
                            'data-icon="delete"></a>' +
            '</div>' +
        '</div>'
    );


    var addRecordBLE = function(e, annotation) {
        var field;

        field = {
            id: fieldId,
            label: 'Bluetooth weather data'
        };
        field.val = bleData;

        annotation.record.properties.fields.push(field);
    };

    /**
     * Implements the records.processEditor interface
     * @param editorName name of the editor
     * @param html html content of the editor
     * @param group from records.EDITOR_GROUP
     * @param online boolean value if the processing is held online
     */
    var processEditor = function(editorName, html, group, online) {
        var $form = $(html);
        var editorsObj = records.loadEditorsMetadata();

        // Add the dom class that will be used in the buttons
        var editorClass = $('#dtree-form-class-name', $form).text();
        if (editorClass !== '') {
            if (editorsObj[group][editorName] === undefined) {
                editorsObj[group][editorName] = {};
            }

            editorsObj[group][editorName]['class'] = editorClass;

            // Save the result
            records.saveEditorsMetadata(editorsObj);
        }
    };

    // Add the plugin editor process to the pipeline
    records.addProcessEditor(processEditor);

    var registerOnFinish = function(func) {
        onFinishDtree = func;
    };


    /*********EVENTS************/

    // Dtree from a button inside an editor
    $(document).off('vclick', '.annotate-ble');
    $(document).on('vclick', '.annotate-ble', function(event) {
        event.stopPropagation();
        event.preventDefault();
        var html, label;
        var fieldcontain = $(event.target).closest('.fieldcontain').get(0);
        var $fieldcontain = $(fieldcontain);

        if(cordova && cordova.plugins && cordova.plugins.cobwebbleplugin){
            console.log('cordova plugin exists');
            utils.showPageLoadingMsg('The mobile is connecting to the weather station!');
            var addPropertFromCordova = function(result){
                $.mobile.loading('hide');
                bleData = result;

                label = $fieldcontain
                            .find('label[for="' + fieldcontain.id + '"]')
                            .text();

                html = inputValue({
                    label: bleData.label,
                    value: result,
                    ble: bleData
                });

                $("#ble-data").remove();
                $(html)
                    .insertBefore('#'+fieldcontain.id+' .button-ble')
                    .trigger('create');
            };

            var addPropertFromCordovaError = function(error){
                console.log(error);
            };

            cordova.plugins.cobwebbleplugin.testArrayBLEData(addPropertFromCordova, addPropertFromCordovaError);
        }

        return false;
    });

    $(document).off('vclick', '.ble-delete');
    $(document).on('vclick', '.ble-delete', function(event) {
        event.stopPropagation();
        event.preventDefault();

        var $target = $(event.currentTarget);
        $target.parent().remove();

        return false;
    });

    // TODO: do this in a more clean and modular way
    // Self register as a widget

    (function() {
        var WIDGET_NAME = 'ble';

        var initialize = function(index, element) {
            var $el = $(element);

            $.each($('.button-ble', element), function(index, input) {

                var btn = '<a class="annotate-ble" data-role="button" href="#">' +
                              'Retrieve ' +
                          '</a>';

                $(input)
                    .append(btn)
                    .trigger('create');
            });
        };

        var validate = function(html) {
            return {
                valid: true,
                errors: []
            };
        };

        var serialize = function(element) {
            var $el = $(element);
            var values = [];
            var label;

            $el.find('input[data-ble-value]').each(function(i, item) {
                values.push(item.value);
            });

            label = $el.find('label[for="' + element.id + '"]').text();

            return {
                serialize: true,
                label: label,
                value: values
            };
        };

        widgets.registerWidget({
            name: WIDGET_NAME,
            initialize: initialize,
            validate: validate,
            serialize: serialize
        });
    })();

    // listen on any page with class sync-page
    $(document).on(records.EVT_EDIT_ANNOTATION, addRecordBLE);

    //$('head').prepend('<link rel="stylesheet" href="plugins/ble/css/style.css" type="text/css" />');
});
