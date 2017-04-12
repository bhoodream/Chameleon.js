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
                distinction: 120,
                readable_lum_diff: 5
            },
            limits: {
                color_alpha: {
                    min: 0,
                    max: 255
                },
                color_distinction: {
                    min: 50,
                    max: 765
                },
                color_adapt_limit: {
                    min: 0,
                    max: 1000
                }
            },
            canvas: {
                w: 1000,
                h: 1000
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
        _f = {};

    var clearSel = function(sel) {
            return sel.slice(1);
        },
        isUndefined = function(val) {
            return typeof val === 'undefined';
        },
        logger = function(msg, type) {
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
        getDefaultSettings = function(options) {
            options = options || {};

            var type = options.settings_type || 'colorizeContent',
                settings = {
                'colorizeContent': {
                    dummy_back: 'ededef',
                    dummy_front: '4f5155',
                    color_alpha: _s.color.alpha,
                    color_distinction: _s.color.distinction,
                    color_adapt_limit: _s.color.adapt_limit,
                    async_colorize: true,
                    apply_colors: true,
                    adapt_colors: true,
                    all_colors: false,
                    insert_colors: false,
                    data_colors: false,
                    $img: null,
                    rules: {},
                    after_parsed: function() {},
                    before_async_colorized: function() {},
                    after_async_colorized: function() {}
                },
                'getImageColors': {
                    color_alpha: _s.color.alpha,
                    color_distinction: _s.color.distinction,
                    $img: null,
                    onSuccess: function(colors, $container, settings) {
                        logger(['getImageColors onSuccess is not given!', colors, $container, settings], 'warn');
                    },
                    onError: function(img_src, $container, settings) {
                        logger(['getImageColors error on img load!', img_src, $container, settings], 'error');
                    }
                }
            };

            if (settings[type]) {
                return $.extend(settings[type], options.settings_values || {});
            }

            logger('getDefaultSettings - Unknown settings type given "' + type + '"!', 'warn');

            return {};
        },
        extendSettings = function(settings, options) {
            return $.extend(settings || {}, options || {});
        },
        validateSettings = function(settings) {
            if (typeof settings === 'object') {
                var fixed_settings = $.extend({}, settings),
                    val_types = [
                        {
                            type: 'number',
                            msg: 'Should be a number.',
                            items: ['color_alpha', 'color_distinction', 'color_adapt_limit']
                        },
                        {
                            type: 'string',
                            msg: 'Should be a string.',
                            items: ['settings_type']
                        },
                        {
                            type: 'hex',
                            msg: 'Should be a hex color: #xxx or #xxxxxx.',
                            items: ['dummy_back', 'dummy_front']
                        },
                        {
                            type: 'boolean',
                            msg: 'Should be a boolean value: true or false.',
                            items: ['async_colorize', 'apply_colors', 'adapt_colors', 'all_colors', 'insert_colors', 'data_colors']
                        },
                        {
                            type: 'object',
                            msg: 'Should be an object.',
                            items: ['$img', 'rules', 'settings_values']
                        },
                        {
                            type: 'function',
                            msg: 'Should be a function.',
                            items: ['after_parsed', 'before_async_colorized', 'after_async_colorized', 'onSuccess', 'onError']
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
                        hexValidation: function(val) {
                            return fixVal(val, /^#[0-9a-f]{6}$/i.test(addHashToHex(val).toLowerCase()), function(v) {
                                return prepareHex(v);
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
                    checkProps = function(settings) {
                        var check = [], check_prop;

                        for (var prop in settings) {
                            if (settings.hasOwnProperty(prop)) {
                                check.push(checkProp(settings[prop], prop));
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
                                msg = val_type.msg;

                                if (type === 'number') {
                                    msg += ' Min: ' + _s.limits[prop].min + ', max: ' + _s.limits[prop].max + '.';
                                }

                                return false;
                            }
                        });

                        if (type) {
                            var validated_item = validation[type + 'Validation'](val, prop);

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
                            msg: 'Unknown value type.'
                        };
                    },
                    isNotValid = function(c) { return !c.valid; };

                var invalid = checkProps(settings).filter(isNotValid);

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
                fixed_settings: settings
            };
        },
        setAttributes = function ($elem, attrs) {
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
        decimalToHex = function (dec, pad) {
            var hex = Number(dec).toString(16);

            pad = typeof pad == 'undefined' || pad === null ? 2 : pad;

            while (hex.length < pad) {
                hex = '0' + hex;
            }

            return hex;
        },
        addHashToHex = function(hex) {
            if (typeof hex === 'string') {
                return '#' + hex.replace(/#/g, '');
            } else {
                logger('addHashToHex - given hex is not a string!', 'warn');
            }
        },
        prepareHex = function(hex) {
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
            } else {
                logger('No hex given!', 'warn');
                return '';
            }
        },
        hexToRGB = function (hex) {
            hex = prepareHex(hex);

            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16),

                lum: function () {
                    return this.r + this.g + this.b;
                }
            };
        },
        rgbToHex = function(rgb) {
            var hex = '';

            if (Array.isArray(rgb)) {
                for (var k = 0; k < 3; k += 1) {
                    hex += decimalToHex(rgb[k], 2);
                }
            }

            return hex;
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
        changeColorLum = function (hex, multiplier) {
            hex = prepareHex(hex);

            multiplier = multiplier || 0;

            var new_hex = '#', c;

            for (var i = 0; i < 3; i += 1) {
                c = parseInt(hex.substr(i * 2, 2), 16);
                c = Math.round(Math.min(Math.max(0, c + (c * multiplier)), 255)).toString(16);
                new_hex += ('00' + c).substr(c.length);
            }

            return new_hex;
        },
        findReadableColor = function (back_rgb, front_rgb, front_hex, lum_dir, limit) {
            var new_hex = '',
                lum = 0.05,
                lum_step = 1;

            while (lumDiff(back_rgb, front_rgb) < _s.color.readable_lum_diff) {
                new_hex = changeColorLum(front_hex, lum_dir * lum * lum_step);
                lum_step += 1;
                front_rgb = hexToRGB(new_hex);

                if (lum_step > limit) {
                    break;
                }
            }

            return lum_step > limit ? (lum_dir > 0 ? _s.color.white : _s.color.black) : new_hex;
        },
        getReadableColor = function(hex) {
            return lumDiff(hexToRGB(hex), hexToRGB(_s.color.black)) >= _s.color.readable_lum_diff ? _s.color.black : _s.color.white;
        },
        makeColorReadable = function (back_hex, limit, front_hex) {
            var back_rgb = hexToRGB(back_hex),
                front_rgb = hexToRGB(front_hex),
                new_hex = '',
                lum_dir = 1;

            if (lumDiff(back_rgb, front_rgb) >= _s.color.readable_lum_diff) {
                new_hex = addHashToHex(front_hex);
            } else {
                if (lumDiff(back_rgb, hexToRGB(_s.color.black)) >= _s.color.readable_lum_diff) {
                    lum_dir = -1;
                }

                new_hex = findReadableColor(back_rgb, front_rgb, front_hex, lum_dir, limit);
            }

            return new_hex;
        },
        addAttrsToColorSpan = function ($elem, hex, class_name) {
            if (!($elem instanceof jQuery)) {
                $elem = $($elem);
            }

            hex = addHashToHex(prepareHex(hex));

            $elem
                .attr('title', '[Click] Go to ColorHexa (' + hex + ')')
                .addClass(class_name + ' used_color label')
                .css({ 'background-color': hex, 'color': getReadableColor(hex) })
                .html(hex)
                .on('click', function (e) {
                    window.open('http://www.colorhexa.com/' + prepareHex(hex), '_blank');

                    return false;
                });
        },
        buildSpanColor = function (adapt_hex, source_hex) {
            var $source_color_span = $('<span>'),
                $adapt_color_span = $('<span>'),
                $adapt_legend = $('<span>'),
                $container = $('<div>'),
                is_different = source_hex ? prepareHex(adapt_hex) !== prepareHex(source_hex) : false;

            addAttrsToColorSpan($adapt_color_span, adapt_hex, '');

            if (source_hex && is_different) {
                var action = hexToRGB(source_hex).lum() - hexToRGB(adapt_hex).lum() > 0 ? ' darken' : ' lighten';

                addAttrsToColorSpan($source_color_span, source_hex, 'source_hex');

                $adapt_legend
                    .attr('title', 'Color #' + source_hex + action + ' to ' + adapt_hex + ' for readability.')
                    .addClass('adapt_legend')
                    .css('color', getReadableColor(source_hex))
                    .html('&nbsp;&#8594;&nbsp;');

                $adapt_color_span.addClass('adapt_hex');
                $source_color_span.append($adapt_legend);
                $container.append($source_color_span);
            }

            $container.append($adapt_color_span);

            return $container;
        },
        colorizeItem = function (item_elem, img_colors, settings) {
            var $elem = item_elem || [],
                item_colors = [];

            if ($elem.length) {
                var marks = [],
                    background = img_colors[0] || prepareHex(settings.dummy_back),
                    mark_amt_affix = 1,
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);

                item_colors.push(addHashToHex(background));

                while (cur_marks.length > 0) {
                    marks.push(cur_marks);
                    mark_amt_affix += 1;
                    cur_marks = $elem.find(_s.sel.chmln + mark_amt_affix);
                }

                while (img_colors.length < mark_amt_affix) {
                    img_colors.push(prepareHex(settings.dummy_front));
                }

                if (settings.adapt_colors) {
                    var adapted_colors =
                        img_colors
                            .slice(1, mark_amt_affix)
                            .map(makeColorReadable.bind(this, background, settings.color_adapt_limit));

                    item_colors = item_colors.concat(adapted_colors);
                } else {
                    for (var m = 1; m < mark_amt_affix; m += 1) {
                        item_colors.push(addHashToHex(img_colors[m]));
                    }
                }

                if (settings.apply_colors) {
                    $elem.css('background-color', addHashToHex(background));

                    for (var i = 0; i < marks.length; i += 1) {
                        marks[i].css('color', item_colors[i + 1]);

                        for (var l = 0; l < marks[i].length; l += 1) {
                            var node_name = marks[i][l].nodeName.toLowerCase();

                            if (settings.rules.hasOwnProperty(node_name)) {
                                var rules = settings.rules[node_name].split(','),
                                    length = rules.length;

                                for (var k = 0; k < length; k += 1) {
                                    marks[i][l].style[rules[k].replace(/\s/g, '')] = item_colors[i + 1];
                                }
                            }
                        }
                    }
                }

                if (settings.insert_colors) {
                    var $colors_container = $elem.find(_s.sel.chmln_colors);

                    if ($colors_container.length) {
                        $colors_container.html('');
                    } else {
                        $colors_container = $('<div class="' + clearSel(_s.sel.chmln_colors) + '">');
                        $elem.append($colors_container);
                    }

                    $.each(img_colors, function (index, item) {
                        if (index === 0) {
                            $colors_container.append(buildSpanColor(background));
                        } else {
                            if (item_colors[index]) {
                                $colors_container.append(buildSpanColor(item_colors[index], item));
                            } else if (settings.all_colors) {
                                $colors_container.append(buildSpanColor(item));
                            }
                        }
                    });
                }

                if (settings.all_colors) {
                    var rest_img_colors = img_colors.slice(item_colors.length).map(addHashToHex);

                    item_colors = item_colors.concat(rest_img_colors);
                }

                if (settings.data_colors) {
                    setAttributes($elem, {'data-colors': item_colors});
                }

                $elem.addClass(clearSel(_s.sel.chmln_colorize_done));
            }

            return item_colors;
        },
        parseImageColors = function($container, img_src, settings, onImgLoad, onImgError) {
            var $img = $('<img>');

            $img.on({
                'load': function (e) {
                    var target_img = e.target,
                        $canvas = setAttributes($('<canvas>'), {
                            'class': clearSel(_s.sel.chmln_canvas),
                            'style': 'display: none;',
                            'width': target_img.width,
                            'height': target_img.height
                        });

                    $container.append($canvas);

                    var ctx = $canvas[0].getContext("2d"),
                        img_colors = [];

                    ctx.clearRect(0, 0, _s.canvas.w, _s.canvas.h);
                    ctx.drawImage(target_img, 0, 0);

                    var pix = ctx.getImageData(0, 0, target_img.width, target_img.height).data,
                        rgba_key = '';

                    for (var i = 0; i < pix.length; i += 4) {
                        if (pix[i + 3] > settings.color_alpha) {
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
                                var color_distinction = 0,
                                    used_rgba_arr = used_colors[l].split(',');

                                for (var m = 0; m < 3; m += 1) {
                                    color_distinction += Math.abs(rgba_arr[m] - used_rgba_arr[m]);
                                }

                                if (color_distinction < settings.color_distinction) {
                                    is_valid = false;

                                    break;
                                }
                            }

                            if (is_valid) {
                                used_colors.push(rgba_string);
                                img_colors.push(rgbToHex(rgba_arr));
                            }
                        }
                    }

                    onImgLoad(img_colors, $container, settings);
                },
                'error': function() {
                    onImgError(img_src, $container, settings);
                }
            });

            $img.attr('src', img_src);
        },
        actions = {
            colorizeContent: function($elements, options) {
                var settings = extendSettings(getDefaultSettings(), options),
                    colorize = function () {
                        var $this = $(this),
                            item_settings = extendSettings(settings, { $img: $this.find(_s.sel.chmln_img).first() });

                        if (item_settings.$img.length) {
                            parseImageColors($this, item_settings.$img[0].src, settings,
                                function(img_colors, $container, settings) {
                                    var item_colors = colorizeItem($container, img_colors, settings);

                                    if (typeof item_settings.after_parsed === 'function') {
                                        item_settings.after_parsed(item_colors);
                                    }
                                },
                                function(img_src, $container, settings) {
                                    if (typeof item_settings.after_parsed === 'function') {
                                        item_settings.after_parsed([]);
                                    }

                                    logger('Failed to load image with url "' + img_src + '".', 'error');
                                }
                            );
                        } else {
                            logger('Image not found. Each individual material must contain at least one image.', 'error');
                        }
                    };

                if (!$elements.length) {
                    logger('Nothing found, probably, bad selector.', 'error');
                }

                $elements
                    .removeClass(clearSel(_s.sel.chmln_colorize_done))
                    .toggleClass(clearSel(_s.sel.chmln_async_colorize), !!settings.async_colorize);

                if (settings.async_colorize) {
                    var getNext = function() {
                            var next = false;

                            if ($elements.length) {
                                next = $elements.splice(0, 1)[0];
                            }

                            return $(next);
                        },
                        asyncColorize = function($elem) {
                            if ($elem && $elem.length) {
                                if (isUndefined(getStopColorize($elem))) {
                                    colorize.call($elem);
                                    $elem = getNext();

                                    if ($elem) {
                                        setTimeout(asyncColorize.bind(null, $elem), 0);
                                    } else {
                                        if (typeof settings.after_async_colorized === 'function') {
                                            settings.after_async_colorized();
                                        }
                                    }
                                } else {
                                    getStopColorize($elem, '', true);
                                }
                            }
                        };

                    if (typeof settings.before_async_colorized === 'function') {
                        settings.before_async_colorized();
                    }

                    asyncColorize(getNext());
                } else {
                    $elements.each(colorize);
                }
            },
            getImageColors: function($elements, options) {
                var handleElement = function() {
                    var $img = $(this),
                        settings = extendSettings(getDefaultSettings({
                            settings_type: 'getImageColors',
                            settings_values: {$img: $img}
                        }), options),
                        onImgLoad = settings.onSuccess,
                        onImgError = settings.onError;

                    if ($img[0].nodeName.toLowerCase() === 'img') {
                        parseImageColors($img.parent(), $img.attr('src'), settings, onImgLoad, onImgError);
                    } else {
                        logger('Given element is not <img>!', 'error');
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
                result: function(options) {
                    return getDefaultSettings(options);
                }
            }
        };

    $.fn.chameleon = function (action, options) {
        var $elements = $(this),
            action_passed = typeof action === 'string',
            validation = validateSettings(action_passed ? options : action);

        options = validation.fixed_settings;

        if (validation.invalid.length) {
            logger(['Some bad options passed!', validation.invalid], 'warn');
        }

        if (action_passed) {
            if (actions.hasOwnProperty(action)) {
                if (actions[action].result && typeof actions[action].result === 'function') {
                    return actions[action].result(options);
                }

                actions[action]($elements, options);
            } else {
                logger(['Unknown action!', action], 'error');
            }
        } else {
            actions.colorizeContent($elements, options);
        }

        return this;
    };
})(jQuery, window);