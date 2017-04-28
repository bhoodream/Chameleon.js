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
            color: {
                black: '#000000',
                white: '#ffffff',
                adapt_limit: 200,
                alpha: 200,
                difference: 120,
                readable_lum_diff: 5,
                lum_step: 0.05
            },
            limits: {
                color_alpha: {
                    min: 0,
                    max: 255,
                    max_val: 255
                },
                color_difference: {
                    min: 50,
                    max: 765,
                    max_val: 765
                },
                color_adapt_limit: {
                    min: 0,
                    max: 1000
                }
            },
            canvas: {
                add_w: 10,
                add_h: 10
            },
            actions: {

            },
            sel: {
                chmln: '.chmln',
                chmln_canvas: '.chmln__canvas',
                chmln_img: '.chmln__img',
                chmln_colors: '.chmln__colors',
                chmln_async_colorize: '.chmln_async_colorize',
                chmln_colorize_done: '.chmln_colorize_done'
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
        getStopColorize = function($elem, val, remove) {
            if ($elem && $elem.length) {
                if (!isUndefined(val)) {
                    if ($elem.hasClass(clearSel(_s.sel.chmln_async_colorize))) {
                        $elem.attr('data-stopColorize', val);
                    } else {
                        logger('Cant stop colorize in not async_colorize mode!', 'warn');
                    }
                }

                if (remove) {
                    $elem.removeAttr('data-stopColorize');
                }

                return $elem.attr('data-stopColorize');
            } else {
                logger('getStopColorize $elem not given or all $elems are already colorized!', 'warn');
            }
        },
        getDefaultSettings = function(s) {
            s = s || {};

            var type = s.settings_type || 'colorizeContent',
                default_s = {
                    'colorizeContent': {
                        settings_type: 'colorizeContent',
                        dummy_back: 'aaaaaa',
                        dummy_front: '555555',
                        color_format: 'hex',
                        color_alpha: _s.color.alpha,
                        color_difference: _s.color.difference,
                        color_adapt_limit: _s.color.adapt_limit,
                        debug: false,
                        async_colorize: true,
                        apply_colors: true,
                        adapt_colors: true,
                        all_colors: false,
                        insert_colors: false,
                        data_colors: false,
                        rules: {},
                        afterColorized: function() {},
                        beforeAsyncColorized: function() {},
                        afterAsyncColorized: function() {}
                    },
                    'getImageColors': {
                        settings_type: 'getImageColors',
                        sort_colors: 'primary',
                        color_format: 'hex',
                        color_alpha: _s.color.alpha,
                        color_difference: _s.color.difference,
                        debug: false,
                        onGetColorsSuccess: function(colors, $container, s) {
                            logger(['getImageColors - onGetColorsSuccess is not given!', colors, $container, s], 'warn');
                        },
                        onGetColorsError: function(colors, $container, s) {
                            logger(['getImageColors - error on img load!', colors, $container, s], 'error');
                        }
                    }
                };

            if (default_s[type]) {
                return $.extend({}, default_s[type], s.settings_values || {});
            }

            logger('getDefaultSettings - Unknown settings type given "' + type + '"!', 'warn');

            return {};
        },
        extendSettings = function(s1, s2) {
            return $.extend({}, s1 || {}, s2 || {});
        },
        validateSettings = function(s) {
            if (typeof s === 'object') {
                toggleDebug(s);

                var fixed_settings = $.extend({}, s),
                    allowed_values = {
                        'settings_type': ['colorizeContent', 'getImageColors'],
                        'sort_colors': ['primary', 'hue'],
                        'color_format': ['hex', 'rgb', 'rgba']
                    },
                    val_types = [
                        {
                            type: 'number',
                            msg: function(prop) {
                                return 'Should be a number.' + ' Min: ' + _s.limits[prop].min + ', max: ' + _s.limits[prop].max + '.';
                            },
                            items: ['color_alpha', 'color_difference', 'color_adapt_limit']
                        },
                        {
                            type: 'string',
                            msg: function() {
                                return 'Should be a string.';
                            },
                            items: ['settings_type', 'sort_colors', 'color_format']
                        },
                        {
                            type: 'color',
                            msg: function() {
                                return 'Should be a color: hex (#xxx or #xxxxxx or xxx or xxxxxx) or array ([255, 255, 255, 255]) or object ({r: 255, g: 255, b: 255, alpha: 255}).';
                            },
                            items: ['dummy_back', 'dummy_front', 'hex', 'color']
                        },
                        {
                            type: 'boolean',
                            msg: function() {
                                return 'Should be a boolean value: true or false.';
                            },
                            items: ['debug', 'async_colorize', 'apply_colors', 'adapt_colors', 'all_colors', 'insert_colors', 'data_colors']
                        },
                        {
                            type: 'object',
                            msg: function() {
                                return 'Should be an object.';
                            },
                            items: ['$img', 'rules', 'settings_values']
                        },
                        {
                            type: 'function',
                            msg: function() {
                                return 'Should be a function.';
                            },
                            items: ['afterColorized', 'beforeAsyncColorized', 'afterAsyncColorized', 'onGetColorsSuccess', 'onGetColorsError']
                        }
                    ],
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
                                logger('validateSettings/checkNumberValue - limits for number setting "' + name + '" are missing!', 'warn');
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
                        stringValidation: function(val) {
                            return fixVal(val, typeof val === 'string', function(v) {
                                return String(v);
                            });
                        },
                        colorValidation: function(val) {
                            var is_valid = true,
                                isColorValid = function(v) {
                                    v = parseInt(v, 10);

                                    var is_val_valid = true;

                                    if (isNaN(v)) {
                                        is_val_valid = false;
                                    } else if (v < 0 || v > 255) {
                                        is_val_valid = false;
                                    }

                                    return is_val_valid;
                                };

                            if (typeof val === 'string') {
                                is_valid = /^#[0-9a-f]{6}$/i.test(addHashToHex(val).toLowerCase())
                            } else if (Array.isArray(val)) {
                                $.each(val, function(i, v) {
                                    if (!isColorValid(v)) {
                                        is_valid = false;
                                        return false;
                                    }
                                });
                            } else if (typeof val === 'object') {
                                if (!isColorValid(val.r) || !isColorValid(val.g) || !isColorValid(val.b) || !isColorValid(val.alpha || 255)) {
                                    is_valid = false;
                                }
                            }

                            return fixVal(val, is_valid, function(v) {
                                return clearHex(v);
                            });
                        },
                        booleanValidation: function(val) {
                            return fixVal(val, typeof val === 'boolean', function(v) {
                                return !!v;
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
                            var validated_item = validation[type + 'Validation'](val, prop);

                            if (allowed_values.hasOwnProperty(prop) && allowed_values[prop].indexOf(val) === -1) {
                                validated_item.fixed_val = allowed_values[prop][0];
                                validated_item.is_valid = false;
                                msg = 'Not allowed value for "' + prop + '". You can use only: [' + allowed_values[prop].join(', ') + '].';
                            }

                            return {
                                prop: prop,
                                val: val,
                                fixed_val: validated_item.fixed_val,
                                valid: validated_item.is_valid,
                                msg: msg
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

                var invalid = checkProps(s).filter(isNotValid);

                $.each(invalid, function(index, item) {
                    fixed_settings[item.prop] = item.fixed_val;
                });

                return {
                    invalid: invalid,
                    fixed_settings: fixed_settings
                };
            }

            return {
                invalid: [],
                fixed_settings: s
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
                    } else {
                        hex = _s.color.black;
                    }
                }

                if (hex.length > 6) {
                    hex = hex.slice(0, 6);
                }

                return hex;
            }

            return '';
        },
        convertValToPercent = function(s) {
            var max_percent = 1;

            s.val = parseFloat(s.val);
            s.max = typeof s.max === 'undefined' ? _s.limits.color_alpha.max : s.max;
            s.max_val = typeof s.max_val === 'undefined' ? _s.limits.color_alpha.max_val : s.max_val;

            if (isNaN(s.val)) {
                s.val = max_percent;
            } else {
                if (s.val > max_percent) {
                    s.val = ((s.val / (s.max_val / 100)) / 100).toFixed(2);
                }
            }

            return Math.min(max_percent, s.val);
        },
        colorObjectFromHex = function(s) {
            s.hex = clearHex(s.hex);

            // optimization: less function calls
            if (typeof s.alpha !== 'undefined' && s.alpha < _s.limits.color_alpha.max_val) {
                s.alpha = s.alpha === 0 ? 0 : convertValToPercent({val: s.alpha});
            } else {
                s.alpha = 1;
            }

            var r_index = 0,
                g_index = 2,
                b_index = 4,
                full_index = 6,
                hue_step = 360,
                r = parseInt(s.hex.substr(r_index, 2), 16),
                g = parseInt(s.hex.substr(g_index, 2), 16),
                b = parseInt(s.hex.substr(b_index, 2), 16),
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

            return {hex: s.hex, r: r, g: g, b: b, alpha: s.alpha, chroma: chr, hue: hue, sat: sat, val: val};
        },
        getRGBString = function(c) {
            return c ? 'rgb(' + [c.r, c.g, c.b].join(',') + ')' : '';
        },
        getRGBAString = function(c) {
            return c ? 'rgba(' + [c.r, c.g, c.b, (typeof c.alpha === 'undefined' ? 1 : c.alpha)].join(',') + ')' : '';
        },
        rgbToHex = function(color) {
            var hex = '';

            if (Array.isArray(color)) {
                for (var i = 0; i < 3; i += 1) {
                    hex += decToHexadec(color[i]);
                }
            } else if (typeof color === 'object') {
                hex += decToHexadec(color.r) + decToHexadec(color.g) + decToHexadec(color.b);
            }

            return clearHex(hex);
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
            new_color.hex = rgbToHex(new_color);

            return new_color;
        },
        findReadableColor = function (back_color, front_color, lum_dir, limit) {
            var lum_step = _s.color.lum_step,
                try_num = 1;

            while (lumDiff(back_color, front_color) < _s.color.readable_lum_diff) {
                try_num += 1;
                front_color = changeColorLum(front_color, lum_dir * lum_step * try_num);

                if (try_num > limit) {
                    break;
                }
            }

            return try_num > limit ? colorObjectFromHex({hex: lum_dir > 0 ? _s.color.white : _s.color.black}) : front_color;
        },
        whiteOrBlack = function(color) {
            if (typeof color === 'string') {
                color = colorObjectFromHex({hex: color});
            }

            var diff_with_black = lumDiff(color, colorObjectFromHex({hex: _s.color.black}));

            return diff_with_black >= _s.color.readable_lum_diff ? _s.color.black : _s.color.white;
        },
        makeColorReadable = function (back_color, limit, front_color) {
            var new_color = front_color,
                lum_dir = 1;

            if (lumDiff(back_color, front_color) < _s.color.readable_lum_diff) {
                if (lumDiff(back_color, colorObjectFromHex({hex: _s.color.black})) >= _s.color.readable_lum_diff) {
                    lum_dir = -1;
                }

                new_color = findReadableColor(back_color, front_color, lum_dir, limit);
            }

            return new_color;
        },
        getColorString = function(s) {
            var format = {
                'hex': function(c) {
                    return addHashToHex(c.hex);
                },
                'rgb': function(c) {
                    return getRGBString(c);
                },
                'rgba': function(c) {
                    return getRGBAString(c);
                }
            };

            if (format.hasOwnProperty(s.format)) {
                return format[s.format](s.color);
            }

            logger('getColorString - unknown format "' + s.format + '"!', 'warn');

            return '';
        },
        getColorElem = function (s) {
            if (s) {
                s.color = s.color || {};
                s.source_color = s.source_color || {};

                var $container = $('<div class="chmln__colors-elem-wrapper">'),
                    $color_elem = $('<span class="chmln__colors-elem">'),
                    $source_color_elem = $('<span class="chmln__colors-elem _source">'),
                    $adapt_arrow = $('<span class="chmln__colors-arrow">'),
                    is_color_adapted = s.source_color.hex && s.source_color.hex !== s.color.hex,
                    colorElem = function (s) {
                        var color = getColorString({color: s.color, format: s.format});

                        if (color) {
                            s.html = s.html || color;

                            if (s.format === 'rgba' && typeof s.color.alpha !== 'undefined' && s.color.alpha < 1) {
                                s.html =
                                    '<span class="chmln__colors-elem-text">' + s.html + '</span>' +
                                    '<div class="chmln__colors-elem-overlay" style="opacity: ' + (1 - s.color.alpha) + ';"></div>';
                                color = addHashToHex(s.color.hex);
                                s.color = s.color.alpha > 0.4 ? s.color : _s.color.white;
                            }

                            s.$elem.css({'background-color': color, 'color': whiteOrBlack(s.color)}).html(s.html);
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
        parseImageColors = function($container, img_src, s, onImgLoad, onImgError) {
            var $img = $('<img>');

            $img.on({
                'load': function (e) {
                    var target_img = e.target,
                        canvas_w = target_img.width + _s.canvas.add_w,
                        canvas_h = target_img.height + _s.canvas.add_h,
                        $old_canvas = $container.find(_s.sel.chmln_canvas),
                        $canvas = setElemAttributes($('<canvas>'), {
                            'class': clearSel(_s.sel.chmln_canvas),
                            'style': 'display: none;',
                            'width': canvas_w,
                            'height': canvas_h
                        });

                    $old_canvas.remove();
                    $container.append($canvas);

                    var ctx = $canvas[0].getContext("2d"),
                        img_colors = [];

                    ctx.clearRect(0, 0, canvas_w, canvas_h);
                    ctx.drawImage(target_img, 0, 0);

                    var pix = ctx.getImageData(0, 0, canvas_w, canvas_h).data,
                        rgba_key = '';

                    for (var i = 0; i < pix.length; i += 4) {
                        if (pix[i + 3] >= s.color_alpha) {
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
                                img_colors.push(colorObjectFromHex({hex: rgbToHex(rgba_arr), alpha: rgba_arr[3]}));
                            }
                        }
                    }

                    if (s.sort_colors) {
                        img_colors = sortImageColors({type: s.sort_colors, colors: img_colors});
                    }

                    onImgLoad(img_colors, $container, s);
                },
                'error': function() {
                    onImgError([], $container, s);
                }
            });

            $img.attr('src', img_src);
        },
        colorizeElem = function (item_elem, img_colors, s) {
            var $elem = item_elem || [],
                item_colors = [];

            if ($elem.length) {
                var marks = [],
                    background = img_colors[0] || colorObjectFromHex({hex: s.dummy_back}),
                    mark_amt_affix = 1,
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);

                item_colors.push(background);

                while (cur_marks.length > 0) {
                    marks.push(cur_marks);
                    mark_amt_affix += 1;
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);
                }

                while (img_colors.length < mark_amt_affix) {
                    img_colors.push(colorObjectFromHex({hex: s.dummy_front}));
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
                    $elem.css('background-color', getRGBAString(background));

                    for (var i = 0; i < marks.length; i += 1) {
                        marks[i].css('color', getRGBAString(item_colors[i + 1]));

                        for (var l = 0; l < marks[i].length; l += 1) {
                            var node_name = marks[i][l].nodeName.toLowerCase();

                            if (s.rules.hasOwnProperty(node_name)) {
                                var rules = s.rules[node_name].split(',');

                                for (var k = 0; k < rules.length; k += 1) {
                                    marks[i][l].style[rules[k].replace(/\s/g, '')] = getRGBAString(item_colors[i + 1]);
                                }
                            }
                        }
                    }
                }

                if (s.insert_colors) {
                    var $colors_container = $elem.find(_s.sel.chmln_colors);

                    if ($colors_container.length) {
                        $colors_container.html('');
                    } else {
                        $colors_container = $('<div class="' + clearSel(_s.sel.chmln_colors) + '">');
                        $elem.append($colors_container);
                    }

                    $.each(img_colors, function (index, item) {
                        if (index === 0) {
                            $colors_container.append(getColorElem({color: background, color_format: s.color_format}));
                        } else {
                            if (item_colors[index]) {
                                $colors_container.append(getColorElem({color: item_colors[index], source_color: item, color_format: s.color_format}));
                            } else if (s.all_colors) {
                                $colors_container.append(getColorElem({color: item, color_format: s.color_format}));
                            }
                        }
                    });
                }

                if (s.all_colors) {
                    item_colors = item_colors.concat(img_colors.slice(item_colors.length));
                }

                if (s.data_colors) {
                    setElemAttributes($elem, {'data-colors': item_colors.map(function(c) { return c.hex; })});
                }

                $elem.addClass(clearSel(_s.sel.chmln_colorize_done));
            }

            return item_colors;
        },
        actions = {
            colorizeContent: function($elements, o) {
                var s = extendSettings(getDefaultSettings(), o),
                    colorize = function () {
                        var $this = $(this),
                            item_s = extendSettings(s, { $img: $this.find(_s.sel.chmln_img).first() });

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
                    };

                if (!$elements.length) {
                    logger('Nothing found, probably, bad selector.', 'warn');
                }

                $elements
                    .removeClass(clearSel(_s.sel.chmln_colorize_done))
                    .toggleClass(clearSel(_s.sel.chmln_async_colorize), !!s.async_colorize);

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
                                if (isUndefined(getStopColorize($elem))) {
                                    colorize.call($elem);
                                    $elem = getNext($elements);

                                    if ($elem.length) {
                                        setTimeout(asyncColorize.bind(null, $elem), 0);
                                    } else {
                                        if (typeof s.afterAsyncColorized === 'function') {
                                            s.afterAsyncColorized();
                                        }
                                    }
                                } else {
                                    getStopColorize($elem, '', true);
                                }
                            }
                        };

                    if (typeof s.beforeAsyncColorized === 'function') {
                        s.beforeAsyncColorized();
                    }

                    asyncColorize(getNext($elements));
                } else {
                    $elements.each(colorize);
                }
            },
            getImageColors: function($elements, o) {
                var handleElement = function() {
                    var $img = $(this),
                        s = extendSettings(getDefaultSettings({
                            settings_type: 'getImageColors',
                            settings_values: {$img: $img}
                        }), o);

                    if ($img[0].nodeName.toLowerCase() === 'img') {
                        parseImageColors($img.parent(), $img.attr('src'), s, s.onGetColorsSuccess, s.onGetColorsError);
                    } else {
                        logger('Given element is not "img"!', 'error');
                    }
                };

                $elements.each(handleElement);
            },
            stopColorize: function($elements) {
                var $not_done_elements = $elements.filter(':not(' + _s.sel.chmln_colorize_done + ')');

                if ($not_done_elements.length) {
                    getStopColorize($not_done_elements, 1);
                }
            },
            get_s: {
                result: function() {
                    return _s;
                }
            },
            getDefaultSettings: {
                result: getDefaultSettings
            },
            getColorElem: {
                result: getColorElem
            },
            colorObjectFromHex: {
                result: colorObjectFromHex
            },
            sortColors: {
                result: sortImageColors
            }
        };

    $.fn.chameleon = function (action, settings) {
        var $elements = $(this),
            action_passed = typeof action === 'string',
            validation = validateSettings(action_passed ? settings : action),
            s = validation.fixed_settings;

        if (validation.invalid.length) {
            logger(['Bad settings are fixed!', validation.invalid], 'warn');
        }

        if (action_passed) {
            if (actions.hasOwnProperty(action)) {
                if (actions[action].result && typeof actions[action].result === 'function') {
                    return actions[action].result(s);
                }

                actions[action]($elements, s);
            } else {
                logger(['Unknown action!', action], 'error');
            }
        } else {
            actions.colorizeContent($elements, s);
        }

        return this;
    };
})(jQuery, window);