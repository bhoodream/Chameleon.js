## Chameleon.js

You can easy get and use colors from image. To see how it works check the [demo](http://vadimfedorov.ru/chameleon).

## How to use?

Include jquery.js, include jquery.chameleon.js, assign a chmln-marks to elements. If you get confused look at the examples.

```
$('.chmln').chameleon();
```
## Settings

Next properties you can pass:
* `img` - default `$('.chmln .chmln_img:first-child')`, how you can see, selector get first image in each
`.chmln` container. You can pass concrete image like this `$('.my_img)` or you can pass source url 
like this `/images/my_image.png`. Images should be on your Web server (cross domain security);
* `dummy_back` - default `ededef`. Color for background, if image doesn't have any colors (low alpha). 
Pass hex colors without '#';
* `dummy_front` -  default `4f5155`. Color for text;
* `adapt_colors` - default `true`. Pass `false`, if you dont want/need adapt colors to background;
* `apply_colors` - default `true`. Pass `false`, if you don't want colorization;
* `data_colors` - default `false`. Pass `true`, if you want add `data-colors` attr to `.chmln` container.
Colors will added through commas like this `#eae7e0,#62615b,#9e4343,#5c5c5a,#4f5155`;
* `insert_colors` - default `false`. Pass `true`, if you want insert extracted colors to `.chmln_colors` 
container. Look at [demo](http://vadimfedorov.ru/chameleon);
* `all_colors` - default `false`. Pass `true`, if you want all colors in callback, even that don't used;
* `rules` - default `{}`. Example of rules: `{ BLOCKQUOTE : 'borderColor,backgroundColor'}`;
* `adapt_limit` - default 200. Amount of adapt steps, when color not compatible with back;
* `alpha` - default 200. Colors with alpha lower than this, not taking;

**Example:**
```
$('.chmln').chameleon({
  img           : $('#my_pic'),
  dummy_back    : '000000',
  dummy_front   : 'ffffff',
  adapt_colors  : false,
  apply_colors  : false,
  data_colors   : true,
  insert_colors : true,
  all_colors    : true,
  rules         : {'P' : 'borderColor'},
  adapt_limit   : 100,
  alpha         : 110
});
```

## Callback

In callback you can use extracted colors.

**Example:**
```
$('.chmln').chameleon(settings, function(colors) {
  console.log(colors);
});
```

## Example of HTML:

```
<div class="chmln">
  <h2 class="chmln1">The Metamorphosis</h2>
  <blockquote class="chmln2">
    <p>He was a tool of the boss, without brains or backbone.</p>
    <small class="chmln3">Franz Kafka</small>
  </blockquote>
  <p class="chmln4">
    Metamorphosis is the story of Gregor Samsa, a young traveling salesman.
  </p>
  <img class="chmln_img" src="/codeschool/jquery_air_captains_log.png" alt="img" /> 
  <div class='chmln_colors'></div>
</div>
```
**Where:**
* `.chmln` - wrapper
* `.chmln_img` - img that will use for colorization
* `.chmln1`...`.chmlnN` - elements that should be colored
* `.chmln_colors` - container for colors, if you insert colors
