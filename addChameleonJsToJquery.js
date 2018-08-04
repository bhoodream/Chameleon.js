module.exports = jQuery => {
    if (typeof window === 'undefined') {
        const window = typeof global !== 'undefined' ? global : {};
    }

    window.jQuery = jQuery;

    require('./jquery.chameleon');
    require('./chameleonDebug');
    require('./modes/chameleonBlur');
};