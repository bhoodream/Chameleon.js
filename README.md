[colorize]: http://localhost/~vadimfedorov/vadimfedorov.ru/wp-content/themes/mytwentysixteen/modules/chameleon_js/img/examples/colorize.png "Colorize content"
[getImageColors]: http://localhost/~vadimfedorov/vadimfedorov.ru/wp-content/themes/mytwentysixteen/modules/chameleon_js/img/examples/getImageColors.png "Get image colors"
[sortColors]: http://localhost/~vadimfedorov/vadimfedorov.ru/wp-content/themes/mytwentysixteen/modules/chameleon_js/img/examples/sortColors.png "Sort colors"
[colorObject]: http://localhost/~vadimfedorov/vadimfedorov.ru/wp-content/themes/mytwentysixteen/modules/chameleon_js/img/examples/colorObject.png "Get detailed color object"
[wrapColor]: http://localhost/~vadimfedorov/vadimfedorov.ru/wp-content/themes/mytwentysixteen/modules/chameleon_js/img/examples/wrapColor.png "Wrap color in jQuery element"

# Chameleon.js

A lightweight jQuery plugin for automatic content colorization.

## Features
1. Colorize the content with image;  
![alt text][colorize]
2. Get colors from an image;  
![alt text][getImageColors]
3. Sort colors by various parameters (hue, saturation, value, chroma, alpha);  
![alt text][sortColors]
4. Some color manipulations (format, luminance, transparency, readable);  
![alt text][colorObject]
5. Wrap the color in the jQuery element.  
![alt text][wrapColor]

## Usage

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


For more information and examples check the [demo page](https://vadimfedorov.ru/lab/chameleon_js).