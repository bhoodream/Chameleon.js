/*
 * Chameleon - jQuery plugin for colorize content
 *
 * Copyright (c) 2017 Vadim Fedorov
 *
 * Licensed under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *    http://vadimfedorov.ru/lab/chameleon-js
 */

'use strict';

(function ($, window, undefined) {
    var _s = {
            content_prefix: 'chmln',
            actions: {
                COLORIZE: 'colorize',
                GETCOLORIZEMODE: 'getColorizeMode',
                REGISTERCOLORIZEMODE: 'registerColorizeMode',
                GETIMAGECOLORS: 'getImageColors',
                WRAPCOLOR: 'wrapColor',
                COLOROBJECT: 'colorObject',
                SORTCOLORS: 'sortColors'
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
                lum_step: 0.05,
                colors_skip: 0,
                default_colorize_mode: 'basic',
                default_format: 'hex',
                default_sorting: 'disabled',
                default_wrap_color_mode: 'tile',
                default_wrap_arrow_mode: 'arrow',
                default_rules: ['container', 'element']
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
                },
                colors_skip: {
                    min: 0,
                    max: 1000
                }
            },
            sel: {
                chmln: '.chmln'
            },
            _sel: {
                _colorize_mode: '__colorize-mode',
                _canvas: '__canvas',
                _img: '__img',
                _colors: '__colors',
                _async_colorize: '_async_colorize',
                _colorize_done: '_colorize_done'
            },
            $: {},
            tpl: {}
        },
        _d = {
            colorize_modes: {}
        },
        _f = {
            skip_validation: false
        };

    var clearSel = function(sel) { return sel.slice(1); },
        isUndefined = function(val) { return typeof val === 'undefined'; },
        getRandomFromTo = function(from, to) { return from + parseInt((Math.random() * (to - from)).toFixed(0), 10); },
        logger = function(msg, type) { if (hasDebug()) chameleonDebug.logger(msg, type); },
        hasDebug = function() { return window && typeof window.chameleonDebug !== 'undefined'; },
        canValidate = function () { return !_f.skip_validation && hasDebug(); },
        validateSettings = function(s, a, es) {
            if (canValidate()) {
                chameleonDebug.init({_s: _s});

                var validation = chameleonDebug.validateSettings(s, a, es);

                s = validation.fixed_settings;

                if (validation.invalid.length) {
                    logger(['Bad settings are fixed!', validation.invalid], 'warn');
                }
            }

            _f.skip_validation = false;

            return s;
        },
        get_s = function() { return $.extend({}, _s); },
        get_d = function() { return $.extend({}, _d); },
        getDefaultSettings = function(s) {
            s = s || {};

            var type = s.settings_type || _s.actions.COLORIZE,
                default_s = {};

            default_s[_s.actions.COLORIZE] = {
                content_prefix: _s.content_prefix,
                color_format: _s.color.default_format,
                color_alpha: _s.color.alpha,
                color_difference: _s.color.difference,
                color_adapt_limit: _s.color.adapt_limit,
                canvas_side: _s.canvas.side,
                colors_skip: _s.color.colors_skip,
                debug: false,
                async_colorize: false,
                apply_colors: true,
                adapt_colors: true,
                all_colors: false,
                insert_colors: false,
                data_colors: false,
                dummy_back: _s.color.white.hex,
                dummy_front: _s.color.black.hex,
                content: {root: 'body', items: []},
                rules: {'container': {'prop': 'background-color'}, 'element': {'prop': 'color'}},
                colorize_mode: {'name': _s.color.default_colorize_mode, 'config': {}},
                afterColorized: function(item_colors, s) {},
                beforeAsyncColorized: function(s) {},
                afterAsyncColorized: function(s) {}
            };

            default_s[_s.actions.GETIMAGECOLORS] = {
                sort_type: 'disabled',
                color_format: 'hex',
                img_src: '',
                color_alpha: _s.color.alpha,
                color_difference: _s.color.difference,
                canvas_side: _s.canvas.side,
                debug: false,
                onGetColorsSuccess: function(img_colors, $container, s) {},
                onGetColorsError: function(img_colors, error, $container, s, img_src) {}
            };

            default_s[_s.actions.WRAPCOLOR] = {
                color_format: 'hex',
                wrap_color_mode: 'tile',
                wrap_arrow_mode: 'arrow',
                color_html: '',
                source_color_html: '',
                color: _s.color.black.hex,
                source_color: _s.color.white.hex,
                debug: false
            };

            default_s[_s.actions.COLOROBJECT] = {
                alpha: _s.limits.alpha.max,
                color: _s.color.black.hex,
                debug: false
            };

            default_s[_s.actions.SORTCOLORS] = {
                sort_type: _s.color.default_sorting,
                colors: [],
                debug: false
            };

            if (default_s.hasOwnProperty(type)) {
                return $.extend({}, default_s[type], s.settings_values || {});
            }

            logger('getDefaultSettings - Unknown settings type given "' + type + '"!', 'warn');

            return {};
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
        setChmlnSel = function(s) {
            _s.sel.chmln = '.' + (s && s.content_prefix ? s.content_prefix : _s.content_prefix);

            return _s.sel.chmln;
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
        getAlpha = function() {
            var args = [].slice.apply(arguments),
                alpha = _s.limits.alpha.max;

            $.each(args, function(i, a) {
                if (typeof a !== 'undefined' && !isNaN(a)) {
                    alpha = a;

                    return false;
                }
            });

            return alpha;
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
        colorObject = function(s) {
            s = s || {};

            var r_index = 0,
                g_index = 2,
                b_index = 4,
                color, hex, alpha, r, g, b, clone_color;

            if (typeof s === 'object') {
                if (Array.isArray(s)) {
                    clone_color = s.slice();
                    s = {};

                    s.color = {
                        r: clone_color[0],
                        g: clone_color[1],
                        b: clone_color[2],
                        alpha: clone_color[3]
                    };
                }

                if (typeof s.color === 'object' || typeof s.color === 'undefined') {
                    if (Array.isArray(s.color)) {
                        clone_color = s.color.slice();

                        s.color = {
                            r: clone_color[0],
                            g: clone_color[1],
                            b: clone_color[2],
                            alpha: clone_color[3]
                        };
                    }

                    if (typeof s.color === 'undefined') {
                        if (typeof s.r !== 'undefined' && typeof s.g !== 'undefined' && typeof s.b !== 'undefined') {
                            clone_color = $.extend({}, s);
                            s = {color: clone_color};
                        } else {
                            return false;
                        }
                    }

                    r = limitRGBAValue(s.color.r);
                    g = limitRGBAValue(s.color.g);
                    b = limitRGBAValue(s.color.b);
                    alpha = limitRGBAValue(getAlpha(s.alpha, s.color.alpha, s.color.a, _s.limits.color_alpha.max));
                    hex = rgbaToHexAlpha([r, g, b, alpha]).hex;
                } else {
                    color = colorStrToHexAlpha(s.color);

                    if (!color.hex) return false;

                    hex = color.hex;
                    alpha = getAlpha(s.alpha, color.alpha);
                    r = parseInt(hex.substr(r_index, 2), 16);
                    g = parseInt(hex.substr(g_index, 2), 16);
                    b = parseInt(hex.substr(b_index, 2), 16);
                }
            } else {
                color = colorStrToHexAlpha(s);

                if (!color.hex) return false;

                hex = color.hex;
                alpha = getAlpha(s.alpha, color.alpha);
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

            if (typeof alpha !== 'undefined' && alpha < _s.limits.color_alpha.max) {
                alpha = alpha === 0 ? 0 : convertValToPercent({val: alpha});
            } else {
                alpha = 1;
            }

            return {
                hex: hex, r: r, g: g, b: b, alpha: alpha, chroma: chr, hue: hue, sat: sat, val: val,
                rgb: 'rgb(' + r + ',' + g + ',' + b + ')',
                rgba: 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')',
                adjustLum: function(lum) {
                    return adjustColorLum(this, lum);
                },
                setAlpha: function(a) {
                    return colorObject({color: this, alpha: a});
                },
                readable: function(back, limit) {
                    back = colorObject(back);
                    limit = limit || _s.limits.color_adapt_limit.max;

                    return makeColorReadable(back, limit, this);
                }
            };
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
        adjustColorLum = function (color, lum) {
            lum = lum || 0;

            var new_color = $.extend({}, color),
                r = new_color.r,
                g = new_color.g,
                b = new_color.b;

            new_color.r = Math.round(Math.min(Math.max(0, r + (r * lum)), _s.limits.color_rgba.max));
            new_color.g = Math.round(Math.min(Math.max(0, g + (g * lum)), _s.limits.color_rgba.max));
            new_color.b = Math.round(Math.min(Math.max(0, b + (b * lum)), _s.limits.color_rgba.max));
            new_color = colorObject(new_color);

            return new_color;
        },
        findReadableColor = function (back_color, front_color, lum_dir, limit, new_alpha) {
            var lum_step = _s.color.lum_step,
                try_num = 1;

            while (lumDiff(back_color, front_color) < _s.color.readable_lum_diff) {
                try_num += 1;
                front_color = adjustColorLum(front_color, lum_dir * lum_step * try_num);

                if (try_num > limit) break;
            }

            if (typeof new_alpha === 'number' && front_color.alpha < new_alpha) {
                front_color.alpha = new_alpha;
            }

            return try_num > limit ?
                colorObject(lum_dir > 0 ? _s.color.white.hex : _s.color.black.hex) :
                front_color;
        },
        whiteOrBlack = function(s) {
            var color = {};

            if (typeof s === 'string') {
                color = colorObject(s);
            } else if (typeof s === 'object' && s.back_color) {
                color = s.back_color;
            } else if (typeof s === 'object') {
                color = $.extend({}, s);
            }

            var black = colorObject(_s.color.black.hex),
                white = colorObject(_s.color.white.hex),
                diff_with_black = lumDiff(color, black);

            return diff_with_black >= _s.color.readable_lum_diff ? black : white;
        },
        makeColorReadable = function (back_color, limit, front_color) {
            var new_color = $.extend({}, front_color),
                lum_dir = 1;

            if (lumDiff(back_color, front_color) < _s.color.readable_lum_diff) {
                if (lumDiff(back_color, colorObject(_s.color.black.hex)) >= _s.color.readable_lum_diff) {
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
            val = parseFloat(val);

            if (isNaN(val)) {
                val = _s.limits.color_rgba.min;
            } else {
                val = Math.max(_s.limits.color_rgba.min, Math.min(_s.limits.color_rgba.max, val));
            }

            return val;
        },
        getRandomColor = function() {
            var f = _s.limits.color_rgba.min, t = _s.limits.color_rgba.max;

            return colorObject([getRandomFromTo(f, t), getRandomFromTo(f, t), getRandomFromTo(f, t), getRandomFromTo(f, t)]);
        },
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
                    return c !== '' && c.toLowerCase().indexOf(type) === 0;
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
                s.color = colorObject(s);
            }

            var format = {
                'hex': function(c) { return addHashToHex(c.hex); },
                'rgb': function (c) { return c.rgb; },
                'rgba': function (c) { return c.rgba; }
            };

            if (format.hasOwnProperty(s.format)) {
                return format[s.format](s.color);
            }

            logger('getColorString - unknown format "' + s.format + '"!', 'warn');

            return '';
        },
        wrapColor = function (s, $elements, extra_s) {
            if (s) {
                var has_extra_s = typeof extra_s === 'object',
                    extra_s_format = has_extra_s ? extra_s[0] : _s.color.default_format,
                    extra_s_source_color = false,
                    extra_s_wrap_color_mode = _s.color.default_wrap_color_mode,
                    extra_s_wrap_arrow_mode = _s.color.default_wrap_arrow_mode;

                if (isColorValid(extra_s_format)) {
                    extra_s_format = _s.color.default_format;
                    extra_s_source_color = extra_s[0];
                }

                if (has_extra_s && extra_s.length > 1) {
                    extra_s_source_color = extra_s[0];
                    extra_s_format = extra_s[1] || _s.color.default_format;

                    if (extra_s.length > 2) {
                        extra_s_wrap_color_mode = extra_s[2] || _s.color.default_wrap_color_mode;

                        if (extra_s.length > 3) {
                            extra_s_wrap_arrow_mode = extra_s[3] || _s.color.default_wrap_arrow_mode;
                        }
                    }
                }

                if (typeof s === 'object') {
                    if (Array.isArray(s)) {
                        var $colors = null;

                        if (isColorValid(s)) {
                            $colors = wrapColor(colorObject(s), $elements, extra_s);
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
                            s = {color: s, source_color: extra_s_source_color, color_format: extra_s_format,
                                wrap_color_mode: extra_s_wrap_color_mode, wrap_arrow_mode: extra_s_wrap_arrow_mode};
                        }
                    }
                } else if (typeof s === 'string') {
                    s = {color: s, source_color: extra_s_source_color, color_format: extra_s_format,
                        wrap_color_mode: extra_s_wrap_color_mode, wrap_arrow_mode: extra_s_wrap_arrow_mode};
                }

                s.color = colorObject(s.color);
                s.source_color = colorObject(s.source_color);
                s.color_format = s.color_format || _s.color.default_format;
                s.wrap_color_mode = s.wrap_color_mode || _s.color.default_wrap_color_mode;
                s.wrap_arrow_mode = s.wrap_arrow_mode || _s.color.default_wrap_arrow_mode;
                s.color_html = s.color_html || false;
                s.source_color_html = s.source_color_html || false;

                if (s.color) {
                    var $container = $('<div class="chmln__colors-elem-wrapper">'),
                        $color_elem = $('<span class="chmln__colors-elem">'),
                        $source_color_elem = $('<span class="chmln__colors-elem _source">'),
                        $adapt_arrow = $('<span class="chmln__colors-arrow">'),
                        right_arrow_symbol = '&#8594',
                        is_color_adapted = s.source_color.hex &&
                            (s.source_color.hex !== s.color.hex || s.source_color.alpha !== s.color.alpha),
                        colorElem = function (s) {
                            var color = getColorString({color: s.color, format: s.format});

                            if (color) {
                                var color_ph = '::color::';

                                s.html = s.html || color_ph;
                                s.html = s.html.replace(color_ph, color);

                                var style = {};

                                if (s.wrap_arrow_mode) {
                                    s.$elem.addClass('_' + s.wrap_arrow_mode);

                                    if (s.wrap_arrow_mode === 'gradient' && s.wrap_color_mode === 'tile') {
                                        s.$elem.css({
                                            'color': 'transparent',
                                            'background-image': 'linear-gradient(to right, ' + addHashToHex(s.source_color.hex) + ', ' + color + ')'
                                        });
                                    }
                                } else {
                                    if (s.wrap_color_mode === 'tile' && s.format === 'rgba' && !isUndefined(s.color.alpha) && s.color.alpha < 1) {
                                        s.html =
                                            '<span class="chmln__colors-elem-text">' + s.html + '</span>' +
                                            '<div class="chmln__colors-elem-overlay" style="opacity: ' + (1 - s.color.alpha) + ';"></div>';
                                        color = addHashToHex(s.color.hex);
                                        s.color = s.color.alpha > _s.color.readable_alpha ? s.color : _s.color.white.hex;
                                    }

                                    if (s.wrap_color_mode === 'tile') {
                                        style = {
                                            'background-color': color,
                                            'color': addHashToHex(whiteOrBlack(s.color).hex)
                                        };
                                    } else if (s.wrap_color_mode === 'text') {
                                        style = {
                                            'color': color
                                        };
                                    }
                                }

                                s.$elem.css(style).html(s.html);
                            }
                        };

                    colorElem({$elem: $color_elem, color: s.color, html: s.color_html,
                        format: s.color_format, wrap_color_mode: s.wrap_color_mode});

                    if (is_color_adapted) {
                        colorElem({$elem: $source_color_elem, color: s.source_color, html: s.source_color_html,
                            format: s.color_format, wrap_color_mode: s.wrap_color_mode});
                        colorElem({$elem: $adapt_arrow, color: s.color, source_color: s.source_color,
                            format: s.color_format, wrap_color_mode: s.wrap_color_mode,
                            wrap_arrow_mode: s.wrap_arrow_mode, html: right_arrow_symbol});

                        $color_elem.addClass('_adapted');
                        $source_color_elem.append($adapt_arrow);
                        $container.append($source_color_elem);
                    }

                    $container
                        .append($color_elem)
                        .addClass('_' + s.wrap_color_mode)
                        .addClass('_' + s.wrap_arrow_mode);

                    return $container;
                }
            }
        },
        sortColors = function(s) {
            if (s) {
                if (Array.isArray(s)) {
                    var arr = s.slice();

                    s = {colors: arr};
                }

                s.sort_type = s.sort_type || _s.color.default_sorting;

                var sort = function(type, colors) {
                    if (type === 'disabled') {
                        return colors;
                    } else {
                        return colors.sort(function(a, b) {
                            if (isUndefined(a[type])) a = colorObject(a);
                            if (isUndefined(b[type])) b = colorObject(b);

                            return a[type] - b[type];
                        });
                    }
                }

                if (_s.allowed_values.sort_type.indexOf(s.sort_type) !== -1 && s.colors && s.colors.length) {
                    return sort(s.sort_type, s.colors.slice());
                } else {
                    if (!s.colors || !s.colors.length) {
                        logger('sortColors - No colors given!', 'warn');
                    } else {
                        logger('sortColors - Unknown sort type "' + s.sort_type + '".', 'warn');
                    }
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
                        $canvas = setElemAttributes($('<canvas>'), {
                            'class': clearSel(_s.sel.chmln + _s._sel._canvas),
                            'style': 'display: none;',
                            'width': canvas.w,
                            'height': canvas.h
                        });

                    $container.append($canvas);

                    var ctx = $canvas[0].getContext("2d"),
                        img_colors = [];

                    ctx.clearRect(0, 0, canvas.w, canvas.h);
                    ctx.drawImage(target_img, 0, 0, canvas.w, canvas.h);

                    try {
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
                                    img_colors.push(colorObject({color: rgbaToHexAlpha(rgba_arr).hex, alpha: rgba_arr[3]}));
                                }
                            }
                        }

                        if (s.sort_type) {
                            img_colors = sortColors({sort_type: s.sort_type, colors: img_colors});
                        }

                        onImgLoad(img_colors, $container, s);
                    } catch (error) {
                        onImgError([], error, $container, s, img_src);
                    }

                    $canvas.remove();
                    $img.off();
                },
                'error': function(e) {
                    onImgError([], e, $container, s, img_src);
                    $img.off();
                }
            });

            $img.attr('crossOrigin', 'anonymous').attr('src', img_src);
        },
        getColorizeMode = function(name) {
            if (_d.colorize_modes.hasOwnProperty(name)) {
                return _d.colorize_modes[name];
            } else {
                logger(['getColorizeMode: unknown colorization mode name', name], 'warn');
            }
        },
        registerColorizeMode = function(s) {
            s = s || {};

            if (typeof s.colorize_mode_name === 'string') {
                _d.colorize_modes[s.colorize_mode_name] = {};
                _d.colorize_modes[s.colorize_mode_name].mode = s;
                _d.colorize_modes[s.colorize_mode_name].apply = s.colorizeModeApply || function () {};
                _d.colorize_modes[s.colorize_mode_name].remove = s.colorizeModeRemove || function () {};
            } else {
                logger(['registerColorizeMode: colorize_mode_name  is missed'], 'warn');
            }
        },
        toggleColorizeMode = function (action, s, $elem, item_colors) {
            if (s && $elem.length) {
                s.colorize_mode = s.colorize_mode || _s.color.default_colorize_mode;

                if (!Array.isArray(s.colorize_mode)) s.colorize_mode = [$.extend({}, s.colorize_mode)];

                $.each(s.colorize_mode, function(index, mode) {
                    if (_d.colorize_modes.hasOwnProperty(mode.name)) {
                        _d.colorize_modes[mode.name][action](mode.name, mode.config, s, $elem, item_colors);
                    }
                });
            } else {
                logger(['toggleColorizeMode: s or $elem is missed'], 'warn');
            }
        },
        colorizeElem = function (item_elem, img_colors, s) {
            var $elem = item_elem || [],
                item_colors = [];

            if ($elem.length) {
                var all_colors = img_colors.slice();

                if (s.colors_skip) img_colors = img_colors.slice(s.colors_skip);

                var marks = [],
                    main_color = img_colors[0] || colorObject(s.dummy_back),
                    mark_amt_affix =  1,
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);

                item_colors.push(main_color);

                while (cur_marks.length > 0) {
                    marks.push(cur_marks);
                    mark_amt_affix += 1;
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);
                }

                while (img_colors.length < mark_amt_affix) {
                    img_colors.push(colorObject(s.dummy_front));
                }

                if (s.adapt_colors) {
                    var adapted_colors =
                        img_colors
                            .slice(1, mark_amt_affix)
                            .map(makeColorReadable.bind(this, main_color, s.color_adapt_limit));

                    item_colors = item_colors.concat(adapted_colors);
                } else {
                    for (var m = 1; m < mark_amt_affix; m += 1) {
                        item_colors.push(img_colors[m]);
                    }
                }

                if (s.apply_colors && s.rules) {
                    var applyRules = function(rule, $elem, color, color_index, default_prop) {
                        default_prop = default_prop || 'color';

                        if (rule) {
                            if (typeof rule === 'function') {
                                rule($elem, color, color_index, img_colors);
                            } else if (typeof rule === 'object') {
                                if (Array.isArray(rule)) {
                                    $.each(rule, function(i, r) { applyRules(r, $elem, color, color_index); });
                                } else {
                                    $elem.css(rule.prop || default_prop, color.rgba);
                                }
                            } else {
                                $elem.css(default_prop, color.rgba);
                            }
                        }
                    };

                    applyRules(s.rules.container, $elem, main_color, 0, 'background-color');

                    for (var i = 0; i < marks.length; i += 1) {
                        applyRules(s.rules.element, marks[i], item_colors[i + 1], i + 1);

                        for (var key in s.rules) {
                            if (_s.color.default_rules.indexOf(key) === -1 && s.rules.hasOwnProperty(key) && marks[i].filter(key).length) {
                                applyRules(s.rules[key], marks[i].filter(key), item_colors[i + 1], i + 1);
                            }
                        }
                    }
                }

                if (s.all_colors) {
                    item_colors = item_colors.concat(img_colors.slice(item_colors.length));
                }

                if (s.insert_colors) {
                    var $colors_container = $elem.find(_s.sel.chmln + _s._sel._colors);

                    if ($colors_container.length) {
                        $colors_container.html('');
                    } else {
                        $colors_container = $('<div class="' + clearSel(_s.sel.chmln + _s._sel._colors) + '">');
                        $elem.append($colors_container);
                    }

                    $.each(item_colors, function (index, item) {
                        $colors_container.append(wrapColor({
                            color: item,
                            source_color: all_colors[s.colors_skip + index],
                            color_format: s.color_format
                        }));
                    });
                }

                if (s.data_colors) {
                    setElemAttributes($elem, {'data-colors': item_colors.map(function(c) {
                        return getColorString({color: c, format: s.color_format}); })
                    });
                }

                toggleColorizeMode('apply', s, $elem, item_colors);

                $elem.addClass(clearSel(_s.sel.chmln + _s._sel._colorize_done));
            }

            return item_colors;
        },
        colorize = function(s, $elements) {
            s = $.extend({}, getDefaultSettings(), s);

            var elementsCount = $elements.length;
            var elementsColorizedCount = 0;
            var checkAsyncColorizeFinish = function () {
                elementsColorizedCount += 1;

                if (typeof s.afterAsyncColorized === 'function' && elementsColorizedCount >= elementsCount) {
                    s.afterAsyncColorized(s);
                }
            }
            var colorize = function () {
                    var $this = $(this),
                        item_s = $.extend({}, s, { $img: $this.find(_s.sel.chmln + _s._sel._img).first() });

                    if (item_s.$img.length) {
                        parseImageColors($this, item_s.$img[0].src, item_s,
                            function(img_colors, $container, s) {
                                checkAsyncColorizeFinish();

                                var item_colors = colorizeElem($container, img_colors, s);

                                if (typeof s.afterColorized === 'function') {
                                    s.afterColorized(item_colors, s);
                                }
                            },
                            function(img_colors, error, $container, s, img_src) {
                                checkAsyncColorizeFinish();

                                if (typeof s.afterColorized === 'function') {
                                    s.afterColorized(img_colors, s);
                                }

                                logger(['Failed to load image with url "' + img_src + '".', error], 'error');
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

                                    s.elem = $.extend({}, {tag: 'div', class: '', content: '', ignore: false, children: []}, s.elem);
                                    s.type = s.type || 'element';

                                    var ignore_tags = ['img'];

                                    switch (s.type) {
                                        case 'container':
                                            s.elem.class += ' ' + content_prefix;

                                            break;
                                        case 'element':
                                            if (!s.elem.ignore && ignore_tags.indexOf(s.elem.tag) === -1) {
                                                chmln_index += 1;
                                                s.elem.class += ' ' + content_prefix + chmln_index;
                                            }

                                            if (s.elem.tag === 'img' && s.elem.main_img) {
                                                s.elem.class += ' ' + content_prefix + _s._sel._img;
                                            }

                                            break;
                                        default:
                                            logger([_s.actions.COLORIZE + '/renderElements/renderElem - unknown elem type!', s.type], 'warn');
                                    }

                                    var $elem = $('<' + s.elem.tag + '>');

                                    $elem.addClass(s.elem.class || '');
                                    $elem.html(s.elem.content || '');
                                    $elem.append(renderChildren(s.elem.children));

                                    if (s.elem.src && s.elem.tag === 'img') {
                                        $elem.attr('src', s.elem.src).attr('alt', s.elem.alt || 'Chameleon image');
                                    }

                                    if (s.elem.id) {
                                        $elem.attr('id', s.elem.id);
                                    }

                                    return $elem;
                                },
                                renderItem = function(item) {
                                    var $item;

                                    if (typeof item === 'string') {
                                        $item = $(item);

                                        var item_content_prefix = $item.attr('data-content_prefix');

                                        if (item_content_prefix && item_content_prefix !== content_prefix) {
                                            $item.addClass(content_prefix);
                                            $item.find('.' + item_content_prefix + _s._sel._img).addClass(content_prefix + _s._sel._img);

                                            var i = 1,
                                                $content_item = $item.find('.' + item_content_prefix + i);

                                            while ($content_item.length) {
                                                $content_item.addClass(content_prefix + i);
                                                $content_item = $item.find('.' + item_content_prefix + i);
                                                i += 1;
                                            }
                                        }
                                    } else {
                                        $item = renderElem({elem: item.container, type: 'container'});
                                        $item.append(renderChildren(item.elements));
                                    }

                                    chmln_index = 0;

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
        },
        getImageColors = function(s, $elements) {
            var handleElement = function() {
                var $img = $(this);

                s = $.extend({}, getDefaultSettings({settings_type: _s.actions.GETIMAGECOLORS, settings_values: {$img: $img} }), s);

                if ($img[0].nodeName.toLowerCase() === 'img') {
                    parseImageColors($img.parent(), $img.attr('src'), s, s.onGetColorsSuccess, s.onGetColorsError);
                } else {
                    logger('Given element is not "img"!', 'error');
                }
            };

            $elements.each(handleElement);

            if (!$elements.length) {
                if (s.img_src) {
                    s = $.extend({}, getDefaultSettings({settings_type: _s.actions.GETIMAGECOLORS }), s);

                    parseImageColors($('body'), s.img_src, s, s.onGetColorsSuccess, s.onGetColorsError);
                }
            }
        },
        stopColorize = function(s, $elements) {
            var $not_done_elements = $elements.filter(':not(' + _s.sel.chmln + _s._sel._colorize_done + ')');

            if ($not_done_elements.length) {
                getStopColorize({$elem: $not_done_elements, val: 1});
            }
        },
        decolorize = function(s, $elements) {
            s = $.extend({}, getDefaultSettings(), s);

            $.each($elements, function() {
                var $element = $(this),
                    i = 1,
                    $content_item = $element.find('.' + s.content_prefix + i),
                    removeColorize = function($el, rule) {
                        if (typeof rule === 'function') {
                            rule($el, null, null, null, true);
                        } else {
                            if (Array.isArray(rule)) {
                                $.each(rule, function(index, r) {
                                    removeColorize($el, r);
                                });
                            } else if (typeof rule === 'object') {
                                $el.css(rule.prop, '');
                            }
                        }
                    };

                toggleColorizeMode('remove', s, $element);
                removeColorize($element, s.rules.container);

                $element
                    .removeClass(s.content_prefix + _s._sel._colorize_done)
                    .removeClass(s.content_prefix + _s._sel._async_colorize)
                    .find('.' + s.content_prefix + _s._sel._canvas)
                    .remove();

                while ($content_item.length) {
                    removeColorize($content_item, s.rules.element);
                    $content_item = $element.find('.' + s.content_prefix + i);
                    i += 1;
                }

                for (var key in s.rules) {
                    if (_s.color.default_rules.indexOf(key) === -1 && s.rules.hasOwnProperty(key)) {
                        $content_item = $element.find(key);

                        if ($content_item.length) {
                            $content_item.each(function(index, el) {
                                removeColorize($(el), s.rules[key]);
                            });
                        }
                    }
                }
            });
        },
        skipValidation = function() {
            _f.skip_validation = true;

            return $.fn.chameleon;
        };

    var actions = {
        stopColorize: stopColorize,
        decolorize: decolorize,
        get_s: {result: get_s},
        get_d: {result: get_d},
        skipValidation: {result: skipValidation},
        getDefaultSettings: {result: getDefaultSettings},
        isColorValid: {result: isColorValid},
        fixColor: {result: fixColor},
        getRandomColor: {result: getRandomColor},
        whiteOrBlack: {result: whiteOrBlack}
    };

    actions[_s.actions.COLORIZE] = colorize;
    actions[_s.actions.REGISTERCOLORIZEMODE] = registerColorizeMode;
    actions[_s.actions.GETIMAGECOLORS] = getImageColors;
    actions[_s.actions.GETCOLORIZEMODE] = {result: getColorizeMode};
    actions[_s.actions.WRAPCOLOR] = {result: wrapColor};
    actions[_s.actions.COLOROBJECT] = {result: colorObject};
    actions[_s.actions.SORTCOLORS] = {result: sortColors};

    _s.allowed_values = {
        'settings_type': [
            _s.actions.COLORIZE,
            _s.actions.GETIMAGECOLORS,
            _s.actions.WRAPCOLOR,
            _s.actions.COLOROBJECT,
            _s.actions.SORTCOLORS
        ],
        'wrap_color_mode': ['tile', 'text'],
        'wrap_arrow_mode': ['arrow', 'gradient'],
        'sort_type': ['disabled', 'hue', 'sat', 'val', 'chroma', 'alpha'],
        'color_format': ['hex', 'rgb', 'rgba']
    };
    _s.can_be_empty = ['alpha', 'colors_skip', 'img_src', 'source_color', 'color_html', 'source_color_html'];
    _s.settings_dependencies = {
        'wrap_arrow_mode': {
            'depend': [{'val': 'gradient', 'prop': 'wrap_color_mode', 'prop_val': ['tile']}]
        }
    };

    registerColorizeMode({
        'colorize_mode_name': 'basic',
        'colorizeModeApply': function () {},
        'colorizeModeRemove': function () {}
    });

    $.fn.chameleon = function (action, settings) {
        var $elements = $(this),
            is_action_passed = typeof action === 'string',
            extra_s = [].slice.call(arguments, is_action_passed ? 2 : 1);

        settings = is_action_passed ? settings : action;
        action = is_action_passed ? action : _s.actions.COLORIZE;
        settings = validateSettings(settings, action, extra_s);

        setChmlnSel(settings);

        if (actions.hasOwnProperty(action)) {
            if (actions[action].result && typeof actions[action].result === 'function') {
                return actions[action].result(settings, $elements, extra_s);
            }

            actions[action](settings, $elements, extra_s);
        } else {
            logger(['Unknown action!', action], 'error');
        }

        return this;
    };
})(jQuery, window);