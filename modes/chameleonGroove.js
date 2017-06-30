;(function($) {
    if ($) {
        var mode = {
            'colorize_mode_name': 'groove',
            'colorizeModeApply': function (mode_name, config, s, $elem, item_colors) {
                console.log(mode_name, config, s, item_colors);
            },
            'colorizeModeRemove': function (mode_name, config, s, $elem, item_colors) {
                console.log(mode_name, config, s, item_colors);
            }
        };

        $.fn.chameleon("registerColorizeMode", mode);
    }
})(jQuery);