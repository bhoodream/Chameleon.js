module.exports = $ => {
    if (typeof window === 'undefined') {
        const window = typeof global !== 'undefined' ? global : {};
    }

    window.jQuery = $;

    require('./jquery.chameleon');
};