module.exports = $ => {
    const jQuery = $;

    if (typeof window === 'undefined') {
        const window = typeof global !== 'undefined' ? global : {};
    }

    require('./jquery.chameleon');
};