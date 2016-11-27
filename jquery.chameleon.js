/*
 * Chameleon - jQuery plugin for colorize content
 *
 * Copyright (c) 2016 Vadim Fedorov
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *  http://vadimfedorov.ru/chameleon
 *
 */

'use strict';

(function ($) {
    var _s = {
            color: {
                black: '#000000',
                white: '#ffffff',
                readable_lum_diff: 5
            },
            sel: {
                chmln: '.chmln',
                chmln_canvas: '.chmln_canvas',
                chmln_img: '.chmln_img'
            },
            $: {},
            tpl: {}
        },
        _d = {},
        _f = {};

    var clearSel = function(sel) {
            return sel.slice(1);
        },
        setAttributes = function (el, attrs) {
            for (var a in attrs) {
                if (attrs.hasOwnProperty(a)) {
                    el.setAttribute(a, attrs[a]);
                }
            }

            return el;
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
        addHash = function(hex) {
            return '#' + hex;
        },
        prepareHex = function(hex) {
            if (hex) {
                hex = String(hex).replace(/[^0-9a-f]/gi, '').toLowerCase();

                if (hex.length < 6) {
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }

                return hex;
            } else {
                console.warn('No hex given!');
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

                if (lum_step > limit) break;
            }

            return lum_step > limit ? (lum_dir > 0 ? _s.color.white : _s.color.black) : new_hex;
        },
        getReadableColor = function(hex) {
            return lumDiff(hexToRGB(hex), hexToRGB(_s.color.black)) >= _s.color.readable_lum_diff ?
                _s.color.black :
                _s.color.white;
        },
        makeColorReadable = function (back_hex, limit, front_hex) {
            var back_rgb = hexToRGB(back_hex),
                front_rgb = hexToRGB(front_hex),
                new_hex = '',
                lum_dir = 1;

            if (lumDiff(back_rgb, front_rgb) >= _s.color.readable_lum_diff) {
                new_hex = addHash(front_hex);
            } else {
                if (lumDiff(back_rgb, hexToRGB(_s.color.black)) >= _s.color.readable_lum_diff)
                    lum_dir = -1;

                new_hex = findReadableColor(back_rgb, front_rgb, front_hex, lum_dir, limit);
            }

            return new_hex;
        },
        addAttrsToColorSpan = function ($elem, hex, class_name) {
            if (!($elem instanceof jQuery)) $elem = $($elem);

            hex = addHash(prepareHex(hex));

            $elem
                .attr('title', '[Click] Go to ColorHexa (' + hex + ')')
                .addClass(class_name + ' used_color label')
                .css({ 'background-color': hex, 'color': getReadableColor(hex) })
                .html(hex)
                .on('click', function (e) {
                    if (e.target !== this) return false;

                    window.open('http://www.colorhexa.com/' + prepareHex(hex), '_blank');

                    return false;
                });
        },
        buildSpanColor = function (adapt_hex, source_hex, background) {
            var $source_color_span = $('<span>'),
                $adapt_color_span = $('<span>'),
                $adapt_legend = $('<span>'),
                $container = $('<span>'),
                is_different = source_hex ? adapt_hex.toLowerCase() !== addHash(source_hex.toLowerCase()) : false;

            addAttrsToColorSpan($adapt_color_span, adapt_hex, '');

            if (source_hex && is_different) {
                var action = hexToRGB(source_hex).lum() - hexToRGB(adapt_hex).lum() > 0 ? ' darken' : ' lighten';

                addAttrsToColorSpan($source_color_span, source_hex, 'source_hex');

                $adapt_legend
                    .attr('title', 'Color #' + source_hex + action + ' to ' + adapt_hex + ' for readability.')
                    .addClass('adapt_legend')
                    .css('color', getReadableColor(background))
                    .html('&nbsp;&#8594;&nbsp;');

                $adapt_color_span.addClass('adapt_hex');
                $container.append($source_color_span);
                $source_color_span.append($adapt_legend);
            }

            $container.append($adapt_color_span);

            return $container;
        },
        colorizeItem = function (item_elem, item_colors, settings) {
            var element = item_elem || false;

            if (element) {
                var marks = [],
                    background = item_colors[0] || settings.dummy_back,
                    colors = [addHash(background)],
                    mark_amt_affix = 1;

                var tmp_marks = element.find(_s.sel.chmln + mark_amt_affix);

                while (tmp_marks.length > 0) {
                    marks.push(tmp_marks);
                    mark_amt_affix += 1;
                    tmp_marks = element.find(_s.sel.chmln + mark_amt_affix);
                }

                while (item_colors.length < mark_amt_affix) {
                    item_colors.push(settings.dummy_front);
                }

                if (settings.all_colors) {
                    mark_amt_affix = item_colors.length;
                }

                if (settings.adapt_colors) {
                    colors = colors.concat(
                        item_colors.slice(1, mark_amt_affix).map(
                            makeColorReadable.bind(this, background, settings.adapt_limit)
                        )
                    );
                } else {
                    for (var m = 1; m < mark_amt_affix; m += 1) {
                        colors.push(addHash(item_colors[m]));
                    }
                }

                var j = 0, apply = settings.apply_colors;

                if (apply) {
                    element.css('background-color', addHash(background));
                }

                for (var i = 0; i < marks.length; i += 1) {
                    j += 1;

                    if (apply) {
                        marks[i].css('color', colors[j]);

                        for (var l = 0; l < marks[i].length; l += 1) {
                            if (settings.rules.hasOwnProperty(marks[i][l].nodeName)) {
                                var rules = settings.rules[marks[i][l].nodeName].split(','), length = rules.length;
                                for (var k = 0; k < length; k += 1) {
                                    marks[i][l].style[rules[k].replace(/\s/g, '')] = colors[j];
                                }
                            }
                        }
                    }

                    if (settings.insert_colors) {
                        if (i === 0) {
                            var $colors_container = element.find('.chmln_colors');
                            if ($colors_container.length) {
                                $colors_container.html('');
                            } else {
                                $colors_container = $('<div class="chmln_colors">');
                                element.append($colors_container);
                            }
                            $colors_container.append(buildSpanColor(addHash(background)));
                        }
                        $colors_container.append(buildSpanColor(colors[j], item_colors[j], background));
                    }
                }
            }

            return colors;
        };

    $.fn.chameleon = function (options) {
        var $cur_elem = $(this);

        if (!$cur_elem.length) {
            $.error('Chameleon.js: nothing found, probably, bad selector.');
        }

        $cur_elem.each(function () {
            var $this = $(this);

            var settings = $.extend({
                img: $this.find(_s.sel.chmln_img).first(),
                dummy_back: 'ededef',
                dummy_front: '4f5155',
                adapt_colors: true,
                apply_colors: true,
                data_colors: false,
                insert_colors: false,
                all_colors: false,
                rules: {},
                adapt_limit: 200,
                alpha: 200
            }, options || {});

            if (settings.img.length) {
                var canvas = $(_s.sel.chmln_canvas)[0];

                if (!canvas) {
                    canvas = setAttributes($('<canvas>')[0], {
                        'class': clearSel(_s.sel.chmln_canvas),
                        'style': 'display: none;',
                        'width': 1000,
                        'height': 1000
                    });

                    $this[0].appendChild(canvas);
                }

                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, 1000, 1000);

                var colors = [],
                    item_colors = [],
                    img = new Image();

                img.onload = function () {

                    ctx.width = img.width;
                    ctx.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    var pix = ctx.getImageData(0, 0, img.width, img.height).data,
                        color_string = '';

                    for (var i = 0; i < pix.length; i += 4) {
                        if (pix[i + 3] > settings.alpha) {
                            color_string = pix[i] + ',' + pix[i + 1] + ',' + pix[i + 2] + ',' + pix[i + 3];
                            colors[color_string] ?
                                colors[color_string] += 1 :
                                colors[color_string] = 1;
                        }
                    }

                    var sorted_colors = sortArrByValue(colors),
                        dev_val = 30,
                        used_colors = [];

                    for (var clr in sorted_colors) {
                        if (sorted_colors.hasOwnProperty(clr)) {
                            var color_values = clr.split(','),
                                is_valid = true,
                                hex_val = '';

                            for (var k = 0; k < 3; k += 1) {
                                hex_val += decimalToHex(color_values[k], 2);
                            }

                            for (var l = 0; l < used_colors.length; l += 1) {
                                var color_dev_ttl = 0,
                                    rgba_val = used_colors[l].split(',');

                                for (var m = 0; m < 3; m += 1) {
                                    color_dev_ttl += Math.abs(color_values[m] - rgba_val[m]);
                                }

                                if (color_dev_ttl / 4 < dev_val) {
                                    is_valid = false;

                                    break;
                                }
                            }

                            if (is_valid) {
                                used_colors.push(clr);
                                item_colors.push(hex_val);
                            }
                        }
                    }

                    colors = colorizeItem($this, item_colors, settings);

                    if (settings.data_colors) {
                        setAttributes($this[0], {'data-colors': colors});
                    }

                    if (typeof settings.after_parsed === 'function') {
                        settings.after_parsed(colors);
                    }
                };

                img.onerror = function () {
                    if (typeof settings.after_parsed === 'function') {
                        settings.after_parsed(colors);
                    }

                    $.error('Chameleon.js: Failed to load resource. URL - ' + img.src);
                };

                img.src = settings.img[0].src;
            } else {
                $.error('Chameleon.js: Image not found. Each individual material must contain at least one image.');
            }
        });

        return this;
    };
})(jQuery);