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
                    hover = config.hover || '',
                    offset = {
                        'top': v === 'top' ? -v_offset + '%' : 'auto',
                        'bottom': v === 'bottom' ? -v_offset + '%' : 'auto',
                        'left': h === 'left' ? -h_offset + '%' : 'auto',
                        'right': h === 'right' ? -h_offset + '%' : 'auto'
                    },
                    $blur = $('<div class="chmln__blur-img-overlay">'),
                    $blur_inner = $('<div>');

                $blur
                    .append($blur_inner)
                    .css({'filter': 'blur(' + blur_val + 'px)', 'opacity': opacity_val / 100});

                $blur_inner.css($.extend({
                    'background-image': 'url(' + s.$img.attr('src') + ')',
                    'background-color': color.rgba
                }, offset));

                if ($elem.css('position') === 'static') $elem.css('position', 'relative');
                if (overflow) $elem.css('overflow', overflow);
                if (hover && typeof hover === 'function') hover($elem);

                $elem.prepend($blur);

                $blur.siblings().each(function(index, el) {
                    if ($(el).css('position') === 'static') {
                        $(el)
                            .css({'position': 'relative', 'z-index': 1})
                            .attr('data-old_position', 'static');
                    }
                });
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