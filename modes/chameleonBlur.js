;(function($) {
    if ($) {
        var mode = {
            'colorize_mode_name': 'blur',
            'colorizeModeApply': function (mode_name, config, s, $elem, item_colors) {
                config = config || {};

                var color = item_colors[0] ? item_colors[0] : 'transparent',
                    img_css = config.img_css || '',
                    blur_val = Math.min(100, config.blur_val || 0),
                    opacity_val = Math.min(100, config.opacity || 0),
                    modify_position = config.modify_position || false,
                    events = config.events || '',
                    offset = {},
                    $blur = $('<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;">'),
                    $blur_img = $('<img src="' + s.$img.attr('src')  + '" style="position: absolute; ' + img_css + '" alt="chameleonBur image">');

                $blur_img.css({'filter': 'blur(' + blur_val + 'px)'});
                $blur.append($blur_img)

                if (config.overflow_hidden) $blur.css({'overflow': 'hidden'});
                if (modify_position) {
                    if ($elem.css('position') === 'static') {
                        $elem.attr('data-old_position', $elem.css('position')).css('position', 'relative');
                    }
                }

                if (events) {
                    if (typeof events === 'object') {
                        $elem.on(events)
                    } else if (typeof events === 'function') {
                        events($elem, $blur, item_colors);
                    }
                };

                $elem.prepend($blur);

                if (modify_position) {
                    $blur.siblings().each(function(index, el) {
                        if ($(el).css('position') === 'static') {
                            $(el).css({'position': 'relative', 'z-index': 1}).attr('data-old_position', 'static');
                        }
                    });
                }
            },
            'colorizeModeRemove': function (mode_name, config, s, $elem, item_colors) {
                var $blur = $elem.find('.chmln__blur-img-overlay');

                if ($elem.attr('data-old_position')) {
                    $elem.css('position', $elem.attr('data-old_position')).removeAttr('data-old_position');
                }

                if (config.events) {
                    if (typeof config.events === 'object') {
                        $.each(config.events, function (e_name, e_handler) {
                            $elem.off(e_name, e_handler);
                        });
                    } else if (typeof config.events === 'function') {
                        config.events($elem, $blur, item_colors, true);
                    }
                };

                $blur.siblings()
                    .filter('[data-old_position]')
                    .each(function (index, elem) { $(el).css('position', ''); });

                $blur.remove();
            }
        };

        if (typeof $.fn.chameleon === 'function') {
            $.fn.chameleon("registerColorizeMode", mode);
        }
    }
})(jQuery);