/*
 * Chameleon - jQuery plugin for colorize content
 *
 * Copyright (c) 2017 Vadim Fedorov
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *  http://vadimfedorov.ru/chameleon
 *
 */

'use strict';

(function ($, window, undefined) {
    var _s = {
            content_prefix: 'chmln',
            actions: {
                COLORIZECONTENT: 'colorizeContent',
                GETIMAGECOLORS: 'getImageColors',
                WRAPCOLOR: 'wrapColor'
            },
            color: {
                black: {
                    hex: '000000',
                    rgb: {r: 0, g: 0, b: 0}
                },
                white: {
                    hex: 'ffffff',
                    rgb: {r: 255, g: 255, b: 255}
                },
                adapt_limit: 200,
                alpha: 200,
                difference: 120,
                readable_lum_diff: 5,
                readable_alpha: 0.5,
                contrast_alpha: 0.3,
                lum_step: 0.05,
                default_format: 'hex'
            },
            canvas: {
                side: 400
            },
            limits: {
                color_rgba: {
                    min: 0,
                    max: 255
                },
                color_alpha: {
                    min: 0,
                    max: 255
                },
                alpha: {
                    min: 0,
                    max: 1
                },
                color_difference: {
                    min: 50,
                    max: 765
                },
                color_adapt_limit: {
                    min: 1,
                    max: 1000
                },
                canvas_side: {
                    min: 50,
                    max: 10000
                }
            },
            sel: {
                chmln: '.chmln'
            },
            _sel: {
                _canvas: '__canvas',
                _img: '__img',
                _colors: '__colors',
                _async_colorize: '_async_colorize',
                _colorize_done: '_colorize_done'
            },
            $: {},
            tpl: {}
        },
        _d = {},
        _f = {
            debug: false
        };

    var clearSel = function(sel) {
            return sel.slice(1);
        },
        isUndefined = function(val) {
            return typeof val === 'undefined';
        },
        toggleDebug = function(s) {
            _f.debug = s ? !!s.debug : false;
        },
        logger = function(msg, type) {
            if (_f.debug) {
                type = type || 'log';

                var logAction = {
                    'error': function(m) {
                        console.error('Chameleon.js:', m);
                    },
                    'warn': function(m) {
                        console.warn('Chameleon.js:', m);
                    },
                    'log': function(m) {
                        console.log('Chameleon.js:', m);
                    }
                };

                if (isUndefined(msg)) {
                    logAction.error('Msg given to logger is undefined!');
                } else {
                    if (logAction.hasOwnProperty(type)) {
                        logAction[type](msg);
                    } else {
                        logAction.error(['Unknown logAction type!', type]);
                    }
                }
            }
        },
        getStopColorize = function(s) {
            if (s && s.$elem && s.$elem.length) {
                if (!isUndefined(s.val)) {
                    if (s.$elem.hasClass(clearSel(_s.sel.chmln + _s._sel._async_colorize))) {
                        s.$elem.attr('data-stopColorize', s.val);
                    }
                }

                if (s.remove) {
                    s.$elem.removeAttr('data-stopColorize');
                }

                return s.$elem.attr('data-stopColorize');
            } else {
                logger('getStopColorize s or s.$elem not given or all $elems are already colorized!', 'warn');
            }
        },
        getDefaultSettings = function(s) {
            s = s || {};

            var type = s.settings_type || _s.actions.COLORIZECONTENT,
                default_s = {};

            default_s[_s.actions.COLORIZECONTENT] = {
                content_prefix: _s.content_prefix,
                color_format: 'hex',
                color_alpha: _s.color.alpha,
                color_difference: _s.color.difference,
                color_adapt_limit: _s.color.adapt_limit,
                canvas_side: _s.canvas.side,
                debug: false,
                async_colorize: false,
                apply_colors: true,
                adapt_colors: true,
                all_colors: false,
                insert_colors: false,
                data_colors: false,
                dummy_back: _s.color.white.hex,
                dummy_front: _s.color.black.hex,
                content: {
                    root: 'body',
                    items: [
                        {
                            container: {
                                'tag': 'div'
                            },
                            elements: [
                                {
                                    'tag': 'div',
                                    'class': 'chmln__wrapper _clearfix',
                                    'content': '',
                                    'no_colorize': true,
                                    'children': [
                                        {
                                            'tag': 'div',
                                            'class': 'chmln__wrapper _example-text',
                                            'content': '',
                                            'no_colorize': true,
                                            'children': [
                                                {
                                                    'tag': 'h2',
                                                    'class': 'chmln__title',
                                                    'content': 'Chameleon Title'
                                                },
                                                {
                                                    'tag': 'blockquote',
                                                    'class': 'chmln__blockquote',
                                                    'content': 'Chameleon Blockquote',
                                                    'children': [
                                                        {
                                                            'tag': 'cite',
                                                            'class': 'chmln__cite',
                                                            'content': 'Chameleon Blockquote Cite'
                                                        }
                                                    ]
                                                },
                                                {
                                                    'tag': 'p',
                                                    'class': 'chmln__paragraph',
                                                    'content': 'Chameleon Paragraph'
                                                }
                                            ]
                                        },
                                        {
                                            'tag': 'div',
                                            'class': 'chmln__wrapper _example-img',
                                            'content': '',
                                            'no_colorize': true,
                                            'children': [
                                                {
                                                    'tag': 'img',
                                                    'content': '',
                                                    'no_colorize': true,
                                                    'src': 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                rules: {
                    'background': {
                        'prop': 'background-color'
                    },
                    'elem': {
                        'prop': 'color'
                    }
                },
                afterColorized: function() {},
                beforeAsyncColorized: function() {},
                afterAsyncColorized: function() {}
            };

            default_s[_s.actions.GETIMAGECOLORS] = {
                sort_colors: 'primary',
                color_format: 'hex',
                color_alpha: _s.color.alpha,
                color_difference: _s.color.difference,
                canvas_side: _s.canvas.side,
                debug: false,
                onGetColorsSuccess: function() {},
                onGetColorsError: function() {}
            };

            default_s[_s.actions.WRAPCOLOR] = {
                color_format: 'hex',
                color: _s.color.black.hex,
                source_color: _s.color.white.hex,
                debug: false
            };

            if (default_s.hasOwnProperty(type)) {
                return $.extend({}, default_s[type], s.settings_values || {});
            }

            logger('getDefaultSettings - Unknown settings type given "' + type + '"!', 'warn');

            return {};
        },
        getChmlnSel = function(s) {
            return '.' + (s.content_prefix || _s.content_prefix);
        },
        extendSettings = function(s1, s2) {
            return $.extend({}, s1 || {}, s2 || {});
        },
        isSettingAllowed = function(prop, val) {
            var allowed_values = _s.allowed_values,
                fixValCase = function(allowed_values, prop, val) {
                    var case_fixed_val = false;

                    if (allowed_values.hasOwnProperty(prop)) {
                        $.each(allowed_values[prop], function(i, allowed_val) {
                            if (val.toLowerCase() === allowed_val.toLowerCase()) {
                                case_fixed_val = allowed_val;
                                return false;
                            }
                        });
                    }

                    return case_fixed_val || val;
                },
                validated_item = {is_allowed: true};

            if (allowed_values.hasOwnProperty(prop)) {
                var caseFixedVal = fixValCase(allowed_values, prop, val);

                if (caseFixedVal !== val) {
                    validated_item = {
                        is_allowed: true,
                        fixed_val: caseFixedVal,
                        is_valid: false,
                        msg: 'Setting "' + prop + '" with value "' + val + '" case fixed to "' + caseFixedVal + '".'
                    };
                } else if (allowed_values[prop].indexOf(val) === -1) {
                    validated_item = {
                        is_allowed: false,
                        fixed_val: allowed_values[prop][0],
                        is_valid: false,
                        msg: 'Not allowed value for "' + prop + '". You can use only: [' + allowed_values[prop].join(', ') + '].'
                    };
                }
            }

            return validated_item;
        },
        isSettingEmpty = function(val) {
            var is_empty = false;

            if (typeof val === 'string') {
                is_empty = val === '';
            }

            return is_empty;
        },
        isSettingCanBeIgnored = function(prop, val) {
            var can_be_ignored = ['source_color'];

            return {
                ignore: isSettingEmpty(val) && can_be_ignored.indexOf(prop) !== -1,
                result: function() {
                    logger('isSettingCanBeIgnored - setting "' + prop + '" will be ignored.', 'log');

                    return {
                        prop: prop,
                        val: val,
                        fixed_val: val,
                        valid: true,
                        msg: 'Setting "' + prop + '" is ignored.'
                    }
                }
            };
        },
        validateSettings = function(s, a) {
            var invalid = [],
                fixed_settings = s || {},
                val_types = [
                    {
                        type: 'number',
                        msg: function(prop) {
                            return 'Should be a number.' + ' Min: ' + _s.limits[prop].min + ', max: ' + _s.limits[prop].max + '.';
                        },
                        items: ['color_alpha', 'alpha', 'color_difference', 'color_adapt_limit', 'canvas_side']
                    },
                    {
                        type: 'string',
                        msg: function() {
                            return 'Should be a string.';
                        },
                        items: ['content_prefix', 'settings_type', 'sort_colors', 'color_format']
                    },
                    {
                        type: 'color',
                        msg: function() {
                            return 'Should be a color! String: hex (#xxx or #xxxxxx or xxx or xxxxxx) or rgb(x,x,x) or rgba(x,x,x,x). Array ([x, x, x, x]) or object ({"r": x, "g": x, "b": x, "alpha": x}).';
                        },
                        items: ['dummy_back', 'dummy_front', 'color', 'source_color']
                    },
                    {
                        type: 'boolean',
                        msg: function() {
                            return 'Should be a boolean value: true or false.';
                        },
                        items: ['debug', 'async_colorize', 'apply_colors', 'adapt_colors', 'all_colors', 'insert_colors', 'data_colors']
                    },
                    {
                        type: 'array',
                        msg: function() {
                            return 'Should be an array.';
                        },
                        items: []
                    },
                    {
                        type: 'object',
                        msg: function() {
                            return 'Should be an object.';
                        },
                        items: ['$img', 'content', 'rules', 'settings_values']
                    },
                    {
                        type: 'function',
                        msg: function() {
                            return 'Should be a function.';
                        },
                        items: ['afterColorized', 'beforeAsyncColorized', 'afterAsyncColorized', 'onGetColorsSuccess', 'onGetColorsError']
                    }
                ],
                fixColor = function(c) {
                    if (c) {
                        var isWithColor = function() {
                                return !isUndefined(c.color);
                            },
                            fixWithColor = function(c) {
                                var fixed_c = $.extend(c, {
                                    color: getColorString({color: c.color, format: getColorFormat(c.color)})
                                });

                                if (c.source_color) {
                                    fixed_c = $.extend(fixed_c, {
                                        source_color: getColorString({
                                            color: c.source_color,
                                            format: getColorFormat(c.source_color)}
                                        )
                                    });
                                }

                                return fixed_c;
                            };

                        if (isWithColor(c)) {
                            return fixWithColor(c);
                        } else {
                            return getColorString({color: c, format: getColorFormat(c)});
                        }
                    }

                    return _s.color.black.hex;
                },
                fixVal = function(val, is_valid, fixCB) {
                    var fixed_val = val;

                    if (typeof fixCB === 'function' && !is_valid) {
                        fixed_val = fixCB(val);
                    }

                    return {
                        is_valid: is_valid,
                        fixed_val: fixed_val
                    };
                },
                validation = {
                    numberValidation: function(val, name) {
                        val = parseFloat(val);

                        var is_valid = true;

                        if (_s.limits.hasOwnProperty(name)) {
                            is_valid = !isNaN(val) && _s.limits[name].min <= val && val <= _s.limits[name].max;
                        } else {
                            logger('validateSettings/numberValidation - limits for number setting "' + name + '" are missing!', 'warn');
                        }

                        return fixVal(val, is_valid, function(v) {
                            if (isNaN(v)) {
                                v = _s.limits[name].min;
                            } else {
                                v = Math.min(Math.max(v, _s.limits[name].min), _s.limits[name].max);
                            }

                            return v;
                        });
                    },
                    stringValidation: function(val, prop) {
                        return fixVal(val, typeof val === 'string', function(v) {
                            if (prop === 'content_prefix') {
                                v = _s.content_prefix;
                            }

                            return String(v);
                        });
                    },
                    colorValidation: function(val) {
                        return fixVal(val, isColorValid(val), fixColor);
                    },
                    booleanValidation: function(val) {
                        return fixVal(val, typeof val === 'boolean', function(v) {
                            return !!v;
                        });
                    },
                    arrayValidation: function(val) {
                        return fixVal(val, Array.isArray(val), function(v) {
                            return [];
                        });
                    },
                    objectValidation: function(val) {
                        return fixVal(val, typeof val === 'object', function(v) {
                            return {};
                        });
                    },
                    functionValidation: function(val) {
                        return fixVal(val, typeof val === 'function', function(v) {
                            return function() {};
                        });
                    }
                },
                checkProps = function(s) {
                    var check = [];

                    for (var prop in s) {
                        if (s.hasOwnProperty(prop)) {
                            check.push(checkProp(s[prop], prop));
                        }
                    }

                    return check;
                },
                checkProp = function(val, prop) {
                    var type = false,
                        msg = '';

                    $.each(val_types, function(index, val_type) {
                        if (val_type.items.indexOf(prop) !== -1) {
                            type = val_type.type;
                            msg = val_type.msg(prop);

                            return false;
                        }
                    });

                    if (type) {
                        var ignore_setting = isSettingCanBeIgnored(prop, val);

                        if (ignore_setting.ignore) {
                            return ignore_setting.result();
                        }

                        var validated_item = $.extend(
                            $.extend(validation[type + 'Validation'](val, prop), {msg: msg}),
                            isSettingAllowed(prop, val)
                        );

                        return {
                            prop: prop,
                            val: val,
                            fixed_val: validated_item.fixed_val,
                            valid: validated_item.is_valid,
                            msg: validated_item.msg
                        };
                    }

                    logger('validateSettings - Unknown val_type "' + prop + '".', 'warn');

                    return {
                        prop: prop,
                        val: val,
                        fixed_val: val,
                        valid: false,
                        msg: 'Unknown value type "' + prop + '".'
                    };
                },
                isNotValid = function(c) { return !c.valid; };

            var check_result;

            if (typeof s === 'string') {
                toggleDebug({debug: true});

                var checkString = {};

                checkString[_s.actions.WRAPCOLOR] = function(s) {
                    var r = false,
                        invalid = !isColorValid(s);

                    if (invalid) {
                        var fixed_val = fixColor(s);

                        r = {
                            invalid: {
                                prop: _s.actions.WRAPCOLOR,
                                val: s,
                                fixed_val: fixed_val,
                                valid: false,
                                msg: 'Color should be valid! Invalid color: ' + JSON.stringify(s) + '.'
                            },
                            fixed_settings: fixed_val
                        };
                    }

                    return r;
                };

                if (checkString.hasOwnProperty(a)) {
                    check_result = checkString[a](s);

                    if (check_result) {
                        invalid.push(check_result.invalid);
                        fixed_settings = check_result.fixed_settings;
                    }
                }
            } else if (typeof s === 'number') {

            }  else if (Array.isArray(s)) {
                toggleDebug({debug: true});

                var checkArray = {};

                checkArray[_s.actions.WRAPCOLOR] = function(s) {
                    var r = false,
                        invalid = false,
                        arr_is_color = isColorValid(s);

                    if (arr_is_color) {
                        invalid = !arr_is_color;
                    } else {
                        invalid = s.filter(function(c) {
                            var is_valid = false;

                            if (typeof c === 'string') {
                                is_valid = isColorValid(c);
                            } else if (typeof c === 'object') {
                                if (Array.isArray(c)) {
                                    is_valid = isColorValid(c);
                                } else if (!isUndefined(c.color)) {
                                    is_valid = isColorValid(c.color);

                                    if (c.source_color) {
                                        is_valid = is_valid && isColorValid(c.source_color);
                                    }
                                }
                            }

                            return !is_valid;
                        });
                    }

                    if (invalid && invalid.length) {
                        var fixed_val = s.map(fixColor);

                        r = {
                            invalid: {
                                prop: _s.actions.WRAPCOLOR,
                                val: s,
                                fixed_val: fixed_val,
                                valid: false,
                                msg: 'All colors should be valid! Invalid colors: ' + JSON.stringify(invalid) + '.'
                            },
                            fixed_settings: fixed_val
                        };
                    }

                    return r;
                };

                if (checkArray.hasOwnProperty(a)) {
                    check_result = checkArray[a](s);

                    if (check_result) {
                        invalid.push(check_result.invalid);
                        fixed_settings = check_result.fixed_settings;
                    }
                }
            } else if (typeof s === 'object') {
                toggleDebug(s);

                fixed_settings = $.extend({}, s);
                invalid = checkProps(s).filter(isNotValid);

                $.each(invalid, function(index, item) {
                    fixed_settings[item.prop] = item.fixed_val;
                });
            }

            return {
                invalid: invalid,
                fixed_settings: fixed_settings
            };
        },
        setElemAttributes = function ($elem, attrs) {
            for (var a in attrs) {
                if (attrs.hasOwnProperty(a)) {
                    $elem.attr(a, attrs[a]);
                }
            }

            return $elem;
        },
        sortArrByValue = function (arr) {
            var tmp_arr = [],
                new_arr = [];

            for (var k in arr) {
                if (arr.hasOwnProperty(k)) {
                    tmp_arr.push([k, arr[k]]);
                }
            }

            tmp_arr.sort(function (a, b) {
                return b[1] - a[1];
            });

            for (var i = 0; i < tmp_arr.length; i += 1) {
                new_arr[tmp_arr[i][0]] = tmp_arr[i][1];
            }

            return new_arr;
        },
        decToHexadec = function (dec, pad) {
            pad = pad || 2;

            var hexadec = Number(dec).toString(16);

            while (hexadec.length < pad) {
                hexadec = '0' + hexadec;
            }

            return hexadec;
        },
        addHashToHex = function(hex) {
            if (hex) {
                return '#' + String(hex).replace(/#/g, '');
            }

            return '';
        },
        clearHex = function(hex) {
            if (hex) {
                hex = String(hex).replace(/[^0-9a-f]/gi, '').toLowerCase();

                if (hex.length < 6) {
                    if (hex.length >= 3) {
                        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                    } else if (hex.length === 2) {
                        hex = hex[0] + hex[0] + hex[0] + hex[1] + hex[1] + hex[1];
                    } else if (hex.length === 1) {
                        hex = new Array(7).join(hex[0]);
                    } else {
                        hex = _s.color.black.hex;
                    }
                }

                if (hex.length > 6) {
                    hex = hex.slice(0, 6);
                }

                return hex;
            }

            return '';
        },
        getAlpha = function(c) {
          return c.alpha || c.a;
        },
        convertValToPercent = function(s) {
            var max_percent = 1,
                hundred = 100,
                val = parseFloat(s.val),
                max = isUndefined(s.max) ? _s.limits.color_alpha.max : s.max;

            if (isNaN(val)) {
                val = max_percent;
            } else {
                if (val > max_percent) {
                    val = ((val / (max / hundred)) / hundred).toFixed(2);
                } else {
                    if (val < 0) {
                        val = max_percent
                    }
                }
            }

            return Math.min(max_percent, val);
        },
        colorObjectFromStr = function(s) {
            var r_index = 0,
                g_index = 2,
                b_index = 4,
                color, hex, alpha, r, g, b;

            if (typeof s.color === 'object') {
                if (Array.isArray(s.color)) {
                    var clone_color = s.color.slice();

                    s.color = {
                        r: clone_color[0],
                        g: clone_color[1],
                        b: clone_color[2],
                        alpha: clone_color[3]
                    };
                }

                r = limitRGBAValue(s.color.r);
                g = limitRGBAValue(s.color.g);
                b = limitRGBAValue(s.color.b);
                alpha = s.color.alpha || s.alpha || _s.limits.color_alpha.max;
                hex = rgbaToHexAlpha([r, g, b, alpha]).hex;
            } else {
                color = colorStrToHexAlpha(s.color);

                if (!color.hex) {
                    return false;
                }

                hex = color.hex;
                alpha = s.alpha || color.alpha;
                r = parseInt(hex.substr(r_index, 2), 16);
                g = parseInt(hex.substr(g_index, 2), 16);
                b = parseInt(hex.substr(b_index, 2), 16);
            }

            var full_index = 6,
                hue_step = 60,
                max = Math.max(r, g, b),
                min = Math.min(r, g, b),
                val = max,
                chr = max - min,
                hue = 0,
                sat = 0;


            if (val > 0) {
                sat = chr / val;

                if (sat > 0) {
                    if (r === max) {
                        hue = (r_index * hue_step) + hue_step * (((g - min) - (b - min)) / chr);

                        if (hue < 0) {
                            hue += full_index * hue_step;
                        }
                    } else if (g === max) {
                        hue = (g_index * hue_step) + hue_step * (((b - min) - (r - min)) / chr);
                    } else if (b === max) {
                        hue = (b_index * hue_step) + hue_step * (((r - min) - (g - min)) / chr);
                    }
                }
            }

            // optimization: less function calls
            if (!isUndefined(alpha) && alpha < _s.limits.color_alpha.max) {
                alpha = alpha === 0 ? 0 : convertValToPercent({val: alpha});
            } else {
                alpha = 1;
            }

            return {hex: hex, r: r, g: g, b: b, alpha: alpha, chroma: chr, hue: hue, sat: sat, val: val};
        },
        getRGBStrFromObj = function(c) {
            return c ? 'rgb(' + [c.r, c.g, c.b].join(',') + ')' : '';
        },
        getRGBAStrFromObj = function(c) {
            return c ? 'rgba(' + [c.r, c.g, c.b, (isUndefined(c.alpha) ? 1 : c.alpha)].join(',') + ')' : '';
        },
        rgbaToHexAlpha = function(color) {
            var hex = '',
                alpha = 1;

            if (typeof color === 'string') {
                var color_split_by_bracket = color.split('(');

                if (color_split_by_bracket.length > 1) {
                    if (validateColorStr(color)) {
                        color = parseColorStr(color, color_split_by_bracket[0].trim().toLowerCase());
                    } else {
                        hex = color;
                        logger(['rgbaToHexAlpha - not valid rgb/rgba color!', color], 'warn');
                    }
                }
            }

            if (Array.isArray(color)) {
                for (var i = 0; i < 3; i += 1) {
                    hex += decToHexadec(color[i]);
                }

                if (!isUndefined(color[3])) {
                    alpha = parseFloat(color[3]);
                }
            } else if (typeof color === 'object') {
                hex += decToHexadec(color.r) + decToHexadec(color.g) + decToHexadec(color.b);

                if (!isUndefined(color.alpha)) {
                    alpha = parseFloat(color.alpha);
                }
            }

            return {
                hex: clearHex(hex),
                alpha: alpha
            };
        },
        colorStrToHexAlpha = function(str) {
            var alpha = 1;

            if (str) {
                if (isColorRGBA(str) || isColorRGB(str)) {
                    var color = rgbaToHexAlpha(str);

                    str = color.hex;
                    alpha = color.alpha;
                } else {
                    str = clearHex(str);
                }
            }

            return {
                hex: str || '',
                alpha: alpha
            };
        },
        lumDiff = function (rgb1, rgb2) {
            var getLum = function(c) {
                    var r = 0.2126,
                        g = 0.7152,
                        b = 0.0722,
                        a = 255,
                        p = 2.2;

                    return r * Math.pow(c.r / a, p) + g * Math.pow(c.g / a, p) + b * Math.pow(c.b / a, p);
                },
                l1 = getLum(rgb1),
                l2 = getLum(rgb2),
                g = 0.05;

            return l1 > l2 ? (l1 + g) / (l2 + g) : (l2 + g) / (l1 + g);
        },
        changeColorLum = function (color, multiplier) {
            multiplier = multiplier || 0;

            var new_color = $.extend({}, color),
                r = new_color.r,
                g = new_color.g,
                b = new_color.b;

            new_color.r = Math.round(Math.min(Math.max(0, r + (r * multiplier)), 255));
            new_color.g = Math.round(Math.min(Math.max(0, g + (g * multiplier)), 255));
            new_color.b = Math.round(Math.min(Math.max(0, b + (b * multiplier)), 255));
            new_color.hex = rgbaToHexAlpha(new_color).hex;

            return new_color;
        },
        findReadableColor = function (back_color, front_color, lum_dir, limit, new_alpha) {
            var lum_step = _s.color.lum_step,
                try_num = 1;

            while (lumDiff(back_color, front_color) < _s.color.readable_lum_diff) {
                try_num += 1;
                front_color = changeColorLum(front_color, lum_dir * lum_step * try_num);

                if (try_num > limit) {
                    break;
                }
            }

            if (typeof new_alpha === 'number' && front_color.alpha < new_alpha) {
                front_color.alpha = new_alpha;
            }

            return try_num > limit ?
                colorObjectFromStr({color: lum_dir > 0 ? _s.color.white.hex : _s.color.black.hex}) :
                front_color;
        },
        whiteOrBlackHex = function(color) {
            if (typeof color === 'string') {
                color = colorObjectFromStr({color: color});
            }

            var diff_with_black = lumDiff(color, colorObjectFromStr({color: _s.color.black.hex}));

            return diff_with_black >= _s.color.readable_lum_diff ? _s.color.black.hex : _s.color.white.hex;
        },
        makeColorReadable = function (back_color, limit, front_color) {
            var new_color = $.extend({}, front_color),
                lum_dir = 1;

            if (lumDiff(back_color, front_color) < _s.color.readable_lum_diff) {
                if (lumDiff(back_color, colorObjectFromStr({color: _s.color.black.hex})) >= _s.color.readable_lum_diff) {
                    lum_dir = -1;
                }

                new_color = findReadableColor(back_color, front_color, lum_dir, limit, _s.color.readable_alpha);
            }

            return new_color;
        },
        parseColorStr = function(color, format) {
            var validations = {
                'hex': function(c) {
                    return /^#([0-9a-f]{3,6})$/i.exec(addHashToHex(c).toLowerCase());
                },
                'rgba': function(c) {
                    var result = /rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*((?:\d+)?(?:\.)?\d+)\)/i.exec(c);

                    return result && result.length > 4 ? result.slice(1, 5) : false;
                },
                'rgb': function(c) {
                    var result = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(?:\d+)?(?:\.)?\d+)?\)/i.exec(c);

                    return result && result.length > 3 ? result.slice(1, 4) : false;
                }
            };

            if (validations.hasOwnProperty(format)) {
                return validations[format](color);
            } else {
                logger(['parseColorStr - unknown format of color "' + color + '"!', format], 'warn');
                return false;
            }
        },
        validateColorStr = function(c) {
            var format = getColorFormat(c) || _s.color.default_format,
                color_arr = parseColorStr(c, format);

            if (format === 'hex') {
                return color_arr !== null;
            } else {
                return color_arr ? validateRGBAArr(color_arr) : false;
            }
        },
        validateRGBAArr = function(arr) {
            var is_valid = true;

            $.each(arr, function(i, v) {
                if (!isRGBAValueValid(v)) {
                    is_valid = false;

                    return false;
                }
            });

            if (!is_valid) {
                var is_numbers = !arr.filter(function(c) { return isNaN(parseFloat(c)); }).length;

                is_valid = (arr.length === 3 || arr.length === 4) && is_numbers;
            }

            return is_valid;
        },
        validateRGBAObj = function(obj) {
            var is_valid = true;

            if (!isRGBAValueValid(obj.r) ||
                !isRGBAValueValid(obj.g) ||
                !isRGBAValueValid(obj.b) ||
                !isRGBAValueValid(obj.alpha || _s.limits.color_alpha.max)) {
                is_valid = false;
            }

            if (!is_valid) {
                is_valid = !isUndefined(obj.r) && !isUndefined(obj.g) && !isUndefined(obj.b);
            }

            return is_valid;
        },
        limitRGBAValue = function(val) {
            return val ?
                Math.max(
                    _s.limits.color_rgba.min,
                    Math.min(
                        _s.limits.color_rgba.max,
                        parseInt(String(val).slice(0, 3), 10))
                ) : 0;
        },
        isColorValid = function(color) {
            var is_valid = true;

            if (typeof color === 'string') {
                is_valid = validateColorStr(color);
            } else if (Array.isArray(color)) {
                is_valid = validateRGBAArr(color);
            } else if (typeof color === 'object') {
                is_valid = validateRGBAObj(color);
            }

            return is_valid;
        },
        isRGBAValueValid = function(v) {
            v = parseFloat(v);

            var is_val_valid = true;

            if (isNaN(v)) {
                is_val_valid = false;
            } else if (v < _s.limits.color_rgba.min || v > _s.limits.color_rgba.max) {
                is_val_valid = false;
            }

            return is_val_valid;
        },
        isColorHex = function(c) {
            return typeof c === 'string' && c !== '' && (c.charAt(0) === "#" || (c.length < 7 && !/(\[|\]|\{|\}|%)/.test(c)));
        },
        isColorRGBorRGBA = function(c, type) {
            var types = ['rgb', 'rgba'];

            if (types.indexOf(type) !== -1) {
                if (typeof c === 'string') {
                    return typeof c === 'string' && c !== '' && c.toLowerCase().indexOf(type) === 0;
                } else if (Array.isArray(c)) {
                    return validateRGBAArr(c);
                } else if (typeof c === 'object') {
                    return validateRGBAObj(c);
                } else {
                    logger(['isColorRGBorRGBA - Unknown type of value!', c], 'warn');
                    return false;
                }
            } else {
                logger(['isColorRGBorRGBA - Unknown type "' + type + '"!'], 'warn');
                return false;
            }
        },
        isColorRGBA = function(c) {
            return isColorRGBorRGBA(c, 'rgba');
        },
        isColorRGB = function(c) {
            return isColorRGBorRGBA(c, 'rgb');
        },
        getColorFormat = function(color) {
            var checkColorFormat = [
                    {format: 'hex', check: isColorHex},
                    {format: 'rgba', check: isColorRGBA},
                    {format: 'rgb', check: isColorRGB}
                ],
                format = _s.color.default_format;

            $.each(checkColorFormat, function(i, item) {
                if (item.check(color)) {
                    format = item.format;

                    return false;
                }
            });

            return format;
        },
        getColorString = function(s) {
            s = s || {};
            s.format = s.format || _s.color.default_format;

            if (typeof s.color === 'string') {
                s.color = colorObjectFromStr(s);
            }

            var format = {
                'hex': function(c) {
                    return addHashToHex(c.hex);
                },
                'rgb': getRGBStrFromObj,
                'rgba': getRGBAStrFromObj
            };

            if (format.hasOwnProperty(s.format)) {
                return format[s.format](s.color);
            }

            logger('getColorString - unknown format "' + s.format + '"!', 'warn');

            return '';
        },
        wrapColor = function (s, $elements, extra_s) {
            if (s) {
                var extra_s_format = extra_s ? extra_s[0] : _s.color.default_format;

                if (typeof s === 'object') {
                    if (Array.isArray(s)) {
                        var $colors = null;

                        if (isColorValid(s)) {
                            $colors = wrapColor(colorObjectFromStr({color: s}), $elements, extra_s);
                        } else {
                            $.each(s, function (i, c) {
                                c = $.extend({}, {color_format: extra_s_format}, typeof c === 'object' ? $.extend({}, c) : {color: c});

                                var $color = wrapColor(c, $elements, extra_s);

                                $colors = $colors === null ? $color : $colors.add($color);
                            });
                        }

                        return $colors;
                    } else {
                        if (!s.color) {
                            s = {color: s, color_format: extra_s_format};
                        }
                    }
                } else if (typeof s === 'string') {
                    s = {color: s, color_format: extra_s_format};
                }

                s.color = colorObjectFromStr({color: s.color});
                s.source_color = colorObjectFromStr({color: s.source_color});
                s.color_format = s.color_format || _s.color.default_format;

                if (s.color) {
                    var $container = $('<div class="chmln__colors-elem-wrapper">'),
                        $color_elem = $('<span class="chmln__colors-elem">'),
                        $source_color_elem = $('<span class="chmln__colors-elem _source">'),
                        $adapt_arrow = $('<span class="chmln__colors-arrow">'),
                        is_color_adapted =
                            s.source_color.hex &&
                            (s.source_color.hex !== s.color.hex || s.source_color.alpha !== s.color.alpha),
                        colorElem = function (s) {
                            var color = getColorString({color: s.color, format: s.format});

                            if (color) {
                                s.html = s.html || color;

                                if (s.format === 'rgba' && !isUndefined(s.color.alpha) && s.color.alpha < 1) {
                                    s.html =
                                        '<span class="chmln__colors-elem-text">' + s.html + '</span>' +
                                        '<div class="chmln__colors-elem-overlay" style="opacity: ' + (1 - s.color.alpha) + ';"></div>';
                                    color = addHashToHex(s.color.hex);
                                    s.color = s.color.alpha > _s.color.contrast_alpha ? s.color : _s.color.white.hex;
                                }

                                s.$elem.css({
                                    'background-color': color,
                                    'color': addHashToHex(whiteOrBlackHex(s.color))
                                }).html(s.html);
                            }
                        };

                    colorElem({$elem: $color_elem, color: s.color, format: s.color_format});

                    if (is_color_adapted) {
                        colorElem({$elem: $source_color_elem, color: s.source_color, format: s.color_format});
                        colorElem({$elem: $adapt_arrow, color: s.source_color, format: s.color_format, html: '&#8594'});

                        $color_elem.addClass('_adapted');
                        $source_color_elem.append($adapt_arrow);
                        $container.append($source_color_elem);
                    }

                    $container.append($color_elem);

                    return $container;
                }
            }
        },
        sortImageColors = function(s) {
            if (s) {
                s.type = s.type || 'primary';

                var sortColors = {
                    'primary': function(colors) {
                        return colors;
                    },
                    'hue': function(colors) {
                        return colors.sort(function(a, b) { return a.hue - b.hue; });
                    }
                };

                if (sortColors.hasOwnProperty(s.type) && s.colors && s.colors.length) {
                    return sortColors[s.type](s.colors);
                } else {
                    logger('sortImageColors - Unknown sort type "' + s.type + '".', 'warn');
                }
            }

            return [];
        },
        canvasSide = function(s) {
            var max_side = Math.max(s.w, s.h),
                sides = $.extend({}, s);

            if (max_side > s.side) {
                if (max_side === s.h) {
                    sides.w = s.w * (s.side / s.h);
                    sides.h = s.side;
                } else {
                    sides.h = s.h * (s.side / s.w);
                    sides.w = s.side;
                }
            }

            return sides;
        },
        parseImageColors = function($container, img_src, s, onImgLoad, onImgError) {
            var $img = $('<img>');

            $img.on({
                'load': function (e) {
                    var target_img = e.target,
                        canvas = canvasSide({w: target_img.width, h: target_img.height, side: s.canvas_side}),
                        $old_canvas = $container.find(_s.sel.chmln + _s._sel._canvas),
                        $canvas = setElemAttributes($('<canvas>'), {
                            'class': clearSel(_s.sel.chmln + _s._sel._canvas),
                            'style': 'display: none;',
                            'width': canvas.w,
                            'height': canvas.h
                        });

                    $old_canvas.remove();
                    $container.append($canvas);

                    var ctx = $canvas[0].getContext("2d"),
                        img_colors = [];

                    ctx.clearRect(0, 0, canvas.w, canvas.h);
                    ctx.drawImage(target_img, 0, 0, canvas.w, canvas.h);

                    var pix = ctx.getImageData(0, 0, canvas.w, canvas.h).data,
                        rgba_key = '';

                    for (var i = 0; i < pix.length; i += 4) {
                        if (pix[i + 3] > 0 && pix[i + 3] >= s.color_alpha) {
                            rgba_key = pix[i] + ',' + pix[i + 1] + ',' + pix[i + 2] + ',' + pix[i + 3];

                            if (img_colors[rgba_key]) {
                                img_colors[rgba_key] += 1
                            } else {
                                img_colors[rgba_key] = 1
                            }
                        }
                    }

                    var sorted_colors = sortArrByValue(img_colors),
                        used_colors = [];

                    img_colors = [];

                    for (var rgba_string in sorted_colors) {
                        if (sorted_colors.hasOwnProperty(rgba_string)) {
                            var rgba_arr = rgba_string.split(','),
                                is_valid = true;

                            for (var l = 0; l < used_colors.length; l += 1) {
                                var color_difference = 0,
                                    used_rgba_arr = used_colors[l].split(',');

                                for (var m = 0; m < 3; m += 1) {
                                    color_difference += Math.abs(rgba_arr[m] - used_rgba_arr[m]);
                                }

                                if (color_difference <= s.color_difference) {
                                    is_valid = false;

                                    break;
                                }
                            }

                            if (is_valid) {
                                used_colors.push(rgba_string);
                                img_colors.push(colorObjectFromStr({color: rgbaToHexAlpha(rgba_arr).hex, alpha: rgba_arr[3]}));
                            }
                        }
                    }

                    if (s.sort_colors) {
                        img_colors = sortImageColors({type: s.sort_colors, colors: img_colors});
                    }

                    onImgLoad(img_colors, $container, s);
                },
                'error': function() {
                    onImgError([], $container, s, img_src);
                }
            });

            $img.attr('src', img_src);
        },
        colorizeElem = function (item_elem, img_colors, s) {
            var $elem = item_elem || [],
                item_colors = [];

            if ($elem.length) {
                var marks = [],
                    background = img_colors[0] || colorObjectFromStr({color: s.dummy_back}),
                    mark_amt_affix = 1,
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);

                item_colors.push(background);

                while (cur_marks.length > 0) {
                    marks.push(cur_marks);
                    mark_amt_affix += 1;
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);
                }

                while (img_colors.length < mark_amt_affix) {
                    img_colors.push(colorObjectFromStr({color: s.dummy_front}));
                }

                if (s.adapt_colors) {
                    var adapted_colors =
                        img_colors
                            .slice(1, mark_amt_affix)
                            .map(makeColorReadable.bind(this, background, s.color_adapt_limit));

                    item_colors = item_colors.concat(adapted_colors);
                } else {
                    for (var m = 1; m < mark_amt_affix; m += 1) {
                        item_colors.push(img_colors[m]);
                    }
                }

                if (s.apply_colors) {
                    var applyRules = function(rule, $elem, color, default_prop) {
                        default_prop = default_prop || 'color';

                        if (rule) {
                            if (typeof rule === 'function') {
                                rule($elem, color);
                            } else if (typeof rule === 'object') {
                                if (Array.isArray(rule)) {
                                    $.each(rule, function(i, r) { applyRules(r, $elem, color); });
                                } else {
                                    $elem.css(rule.prop || default_prop, getRGBAStrFromObj(color));
                                }
                            } else {
                                $elem.css(default_prop, getRGBAStrFromObj(color));
                            }
                        }
                    };

                    applyRules(s.rules.background, $elem, background, 'background-color');

                    for (var i = 0; i < marks.length; i += 1) {
                        applyRules(s.rules.elem, marks[i], item_colors[i + 1]);

                        $.each(marks[i], function(index, m) {
                            var node_name = m.nodeName.toLowerCase();

                            if (s.rules.hasOwnProperty(node_name)) {
                                applyRules(s.rules[node_name], $(m), item_colors[i + 1]);
                            }
                        });
                    }
                }

                if (s.insert_colors) {
                    var $colors_container = $elem.find(_s.sel.chmln + _s._sel._colors);

                    if ($colors_container.length) {
                        $colors_container.html('');
                    } else {
                        $colors_container = $('<div class="' + clearSel(_s.sel.chmln + _s._sel._colors) + '">');
                        $elem.append($colors_container);
                    }

                    $.each(img_colors, function (index, item) {
                        if (index === 0) {
                            $colors_container.append(wrapColor({color: background, color_format: s.color_format}));
                        } else {
                            if (item_colors[index]) {
                                $colors_container.append(wrapColor({color: item_colors[index], source_color: item, color_format: s.color_format}));
                            } else if (s.all_colors) {
                                $colors_container.append(wrapColor({color: item, color_format: s.color_format}));
                            }
                        }
                    });
                }

                if (s.all_colors) {
                    item_colors = item_colors.concat(img_colors.slice(item_colors.length));
                }

                if (s.data_colors) {
                    setElemAttributes($elem, {'data-colors': item_colors.map(function(c) {
                        return getColorString({color: c, format: s.color_format}); })
                    });
                }

                $elem.addClass(clearSel(_s.sel.chmln + _s._sel._colorize_done));
            }

            return item_colors;
        },
        actions = {
            stopColorize: function(s, $elements) {
                var $not_done_elements = $elements.filter(':not(' + _s.sel.chmln + _s._sel._colorize_done + ')');

                if ($not_done_elements.length) {
                    getStopColorize({$elem: $not_done_elements, val: 1});
                }
            },
            get_s: {
                result: function() {
                    return $.extend({}, _s);
                }
            },
            getDefaultSettings: {
                result: getDefaultSettings
            },
            colorObjectFromStr: {
                result: colorObjectFromStr
            },
            sortColors: {
                result: sortImageColors
            }
        };

    actions[_s.actions.COLORIZECONTENT] = function(s, $elements) {
        s = extendSettings(getDefaultSettings(), s);

        var colorize = function () {
                var $this = $(this),
                    item_s = extendSettings(s, { $img: $this.find(_s.sel.chmln + _s._sel._img).first() });

                if (item_s.$img.length) {
                    parseImageColors($this, item_s.$img[0].src, item_s,
                        function(img_colors, $container, s) {
                            var item_colors = colorizeElem($container, img_colors, s);

                            if (typeof s.afterColorized === 'function') {
                                s.afterColorized(item_colors, s);
                            }
                        },
                        function(img_src, $container, s) {
                            if (typeof s.afterColorized === 'function') {
                                s.afterColorized([], s);
                            }

                            logger('Failed to load image with url "' + img_src + '".', 'error');
                        }
                    );
                } else {
                    logger('Image not found. Each individual material must contain at least one image.', 'error');
                }
            },
            renderElements = function(s, $elements) {
                var no_elements = false;

                if (!$elements.length) {
                    if (s.content) {
                        var content_prefix = s.content_prefix,
                            chmln_index = 0,
                            $root = $(s.content.root),
                            wrapJQueryArr = function($elem) {
                                return $('<div>').append($elem).children();
                            },
                            renderChildren = function(children) {
                                var $children = false;

                                if (children.length) {
                                    var renderChild = function(c) {
                                            return renderElem({elem: c});
                                        };

                                    $children = wrapJQueryArr(children.map(renderChild));
                                }

                                return $children;
                            },
                            renderElem = function(s) {
                                s = s || {};

                                s.elem = $.extend({}, {tag: 'div', class: '', content: '', no_colorize: false, children: []}, s.elem);
                                s.type = s.type || 'element';

                                if (s.type === 'element' && !s.elem.no_colorize) {
                                    chmln_index += 1;
                                }

                                switch (s.type) {
                                    case 'container':
                                        s.elem.class += ' ' + content_prefix;

                                        break;
                                    case 'element':
                                        if (!s.elem.no_colorize) {
                                            s.elem.class += ' ' + content_prefix + chmln_index;
                                        }

                                        if (s.elem.tag === 'img') {
                                            s.elem.class += ' ' + content_prefix + _s._sel._img;
                                        }

                                        break;
                                    default:
                                        logger([_s.actions.COLORIZECONTENT + '/renderElements/renderElem - unknown elem type!', s.type], 'warn');
                                }

                                var $elem = $('<' + s.elem.tag + '>');

                                $elem.addClass(s.elem.class);
                                $elem.html(s.elem.content);
                                $elem.append(renderChildren(s.elem.children));

                                if (s.elem.src && s.elem.tag === 'img') {
                                    $elem.attr('src', s.elem.src);
                                }

                                return $elem;
                            },
                            renderItem = function(item) {
                                var $item = renderElem({elem: item.container, type: 'container'});

                                $item.append(renderChildren(item.elements));

                                return $item;
                            };

                        if ($root.length && s.content.items && s.content.items.length) {
                            $elements = wrapJQueryArr(s.content.items.map(renderItem));

                            $root.append($elements);
                        } else {
                            no_elements = true;
                        }
                    } else {
                        no_elements = true;
                    }
                }

                if (no_elements) {
                    logger('No $elements found.', 'warn');
                }

                return $elements;
            };

        $elements = renderElements(s, $elements);

        $elements
            .removeClass(clearSel(_s.sel.chmln + _s._sel._colorize_done))
            .toggleClass(clearSel(_s.sel.chmln + _s._sel._async_colorize), !!s.async_colorize);

        if (s.async_colorize) {
            var getNext = function($items) {
                    var next = false;

                    if ($items.length) {
                        next = $items.splice(0, 1)[0];
                    }

                    return $(next);
                },
                asyncColorize = function($elem) {
                    if ($elem && $elem.length) {
                        if (isUndefined(getStopColorize({$elem: $elem}))) {
                            colorize.call($elem);
                            $elem = getNext($elements);

                            if ($elem.length) {
                                setTimeout(asyncColorize.bind(null, $elem), 0);
                            } else {
                                if (typeof s.afterAsyncColorized === 'function') {
                                    s.afterAsyncColorized(s);
                                }
                            }
                        } else {
                            getStopColorize({$elem: $elem, val: '', remove: true});
                        }
                    }
                };

            if (typeof s.beforeAsyncColorized === 'function') {
                s.beforeAsyncColorized(s);
            }

            asyncColorize(getNext($elements));
        } else {
            $elements.each(colorize);
        }

        return $elements;
    };

    actions[_s.actions.GETIMAGECOLORS] = function(s, $elements) {
        var handleElement = function() {
            var $img = $(this);

            s = extendSettings(getDefaultSettings({
                settings_type: _s.actions.GETIMAGECOLORS,
                settings_values: {$img: $img}
            }), s);

            if ($img[0].nodeName.toLowerCase() === 'img') {
                parseImageColors($img.parent(), $img.attr('src'), s, s.onGetColorsSuccess, s.onGetColorsError);
            } else {
                logger('Given element is not "img"!', 'error');
            }
        };

        $elements.each(handleElement);
    };

    actions[_s.actions.WRAPCOLOR] = {
        result: wrapColor
    };

    _s.allowed_values = {
        'settings_type': [_s.actions.COLORIZECONTENT, _s.actions.GETIMAGECOLORS, _s.actions.WRAPCOLOR],
        'sort_colors': ['primary', 'hue'],
        'color_format': ['hex', 'rgb', 'rgba']
    };

    $.fn.chameleon = function (action, settings) {
        var $elements = $(this),
            action_passed = typeof action === 'string',
            extra_s = Array.prototype.slice.call(arguments, 2);

        settings = action_passed ? settings : action;
        action = action_passed ? action : _s.actions.COLORIZECONTENT;

        var validation = validateSettings(settings, action),
            s = validation.fixed_settings;

        if (validation.invalid.length) {
            logger(['Bad settings are fixed!', validation.invalid], 'warn');
        }

        _s.sel.chmln = getChmlnSel(s);

        if (actions.hasOwnProperty(action)) {
            if (actions[action].result && typeof actions[action].result === 'function') {
                return actions[action].result(s, $elements, extra_s);
            }

            actions[action](s, $elements, extra_s);
        } else {
            logger(['Unknown action!', action], 'error');
        }

        return this;
    };
})(jQuery, window);