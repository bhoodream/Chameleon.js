# Chameleon.js

A lightweight jQuery plugin for automatic content colorization.

## Features
1. Colorize the content with image;
2. Get colors from an image;
3. Sort colors by various parameters (hue, saturation, value, chroma, alpha);
4. Some color manipulations (format, luminance, transparency, readable);
5. Wrap the color in the jQuery element.

## Installation
Download directly from here or install via [npm](https://www.npmjs.com/package/jquery.chameleon.js)/[Bower](http://bower.io/search/?q=jquery.chameleon.js).

Include jQuery and the plugin.
```html
<script src="path/to/jquery.js"></script>
<script src="path/to/jquery.chameleon.js"></script>
```

If you need debug, include it.
```html
<script src="path/to/chameleonDebug.js"></script>
```

If you need styles, include it.
```html
<link rel="stylesheet" href="path/to/chameleon.css">
```

Run the plugin.
```javascript
$(document).ready(function() {
    $('.chmln').chameleon();
});
```


For more information and examples check the [demo page](https://vadimfedorov.ru/lab/chameleon-js).