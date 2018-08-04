# Chameleon.js

A jQuery plugin for automatic content colorization.

## Features
1. Colorize the content with image;
2. Get colors from an image;
3. Sort colors by various parameters (hue, saturation, value, chroma, alpha);
4. Some color manipulations (format, luminance, transparency, readable);
5. Wrap the color in the jQuery element.

## Install
Download directly from [GitHub](https://github.com/bhoodream/Chameleon.js) or install via [npm](https://www.npmjs.com/package/jquery.chameleon.js)/[Bower](http://bower.io/search/?q=jquery.chameleon.js).

Include jQuery and the plugin:
```html
<script src="path/to/jquery.js"></script>
<script src="path/to/jquery.chameleon.js"></script>
```

Or add Chameleon.js to jQuery:
```javascript
import $ from 'jquery';
import addChameleonJsToJquery from 'jquery.chameleon.js/addChameleonJsToJquery';

addChameleonJsToJquery($);
```

## Debug
If you need debug, include it:
```html
<script src="path/to/chameleonDebug.js"></script>
```

`addChameleonJsToJquery` add it automatically.

Enable debug:
```javascript
$(document).ready(function() {
    $('.chmln').chameleon({
        debug: true
    });
});
```

## Modes
If you need colorization modes, include it:
```html
<script src="path/to/colorization/mode.js"></script>
```

`addChameleonJsToJquery` add it automatically.

Use modes:
```javascript
$(document).ready(function() {
    $('.chmln').chameleon({
        colorize_mode: {
            name: "blur",
            config: {}
          }
    });
});
```

## Styles
If you need styles for color elements, include it:
```html
<link rel="stylesheet" href="path/to/chmln__colors.css">
```

Or add:
```javascript
import 'jquery.chameleon.js/css/chmln__colors.css';
```

## Use
Run the plugin:
```javascript
$(document).ready(function() {
    $('.chmln').chameleon();
});
```

For more information and examples check the [demo page](https://vadimfedorov.ru/lab/chameleon-js).