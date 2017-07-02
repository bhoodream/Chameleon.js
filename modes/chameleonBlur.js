;(function($) {
    if ($) {
        var mode = {
            'colorize_mode_name': 'blur',
            'colorizeModeApply': function (mode_name, config, s, $elem, item_colors) {
                config = config || {};

                var color = item_colors[0] ? item_colors[0] : 'transparent',
                    h = config.h_pos || 'center',
                    v = config.v_pos || 'center',
                    h_offset = Math.min(100, config.h_offset || 30),
                    v_offset = Math.min(100, config.v_offset || 30),
                    blur_val = Math.min(100, config.blur_val || 40),
                    opacity_val = Math.min(100, config.opacity || 50),
                    overflow = config.overflow || '',
                    modify_position = config.modify_position || false,
                    events = config.events || '',
                    offset = {
                        'top': v === 'top' ? -v_offset + '%' : 'auto',
                        'bottom': v === 'bottom' ? -v_offset + '%' : 'auto',
                        'left': h === 'left' ? -h_offset + '%' : 'auto',
                        'right': h === 'right' ? -h_offset + '%' : 'auto'
                    },
                    $blur = $('<div class="chmln__blur-img-overlay">'),
                    $blur_color = $('<div>'),
                    $blur_img = $('<div>');

                $blur_color.css($.extend({'background-color': color.rgba, 'opacity': opacity_val / 100}, offset))
                $blur_img.css($.extend({'background-image': 'url(' + s.$img.attr('src') + ')', 'opacity': opacity_val / 100}, offset))
                $blur.append($blur_color).append($blur_img).css({'filter': 'blur(' + blur_val + 'px)'});

                if ($elem.css('position') === 'static' && modify_position) $elem.css('position', 'relative');
                if (overflow) $elem.css('overflow', overflow);
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

                $blur.siblings()
                    .filter('[data-old_position]')
                    .each(function (index, elem) {$(el).css('position', '');})

                $blur.remove();
            }
        };

        $.fn.chameleon("registerColorizeMode", mode);
    }
})(jQuery);