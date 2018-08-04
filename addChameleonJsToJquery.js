module.exports = (jQuery, addDebug, modesPaths) => {
    if (typeof window === 'undefined') {
        const window = typeof global !== 'undefined' ? global : {};
    }

    window.jQuery = jQuery;

    require('./jquery.chameleon');

    if (addDebug) {
        require('./chameleonDebug');
    }

    if (modesPaths && modesPaths.length) {
        modesPaths.forEach(modePath => require(modePath));
    }
};