module.exports = $ => {
    const jQuery = $;
    const window = typeof window !== 'undefined' ?
        window :
        (typeof global !== 'undefined' ? global : {});

    require('./jquery.chameleon');
};