const zn = (e) => {
  console.error("Log function was called before initialization", e);
}, We = {
  trace: zn,
  debug: zn,
  info: zn,
  warn: zn,
  error: zn,
  fatal: zn
};
let h0;
const ph = (e, t, n, r, s) => {
  e.info("Mermaid utils injected"), We.trace = e.trace, We.debug = e.debug, We.info = e.info, We.warn = e.warn, We.error = e.error, We.fatal = e.fatal, h0 = n;
}, fh = {
  parser: { yy: {} },
  parse: () => {
  }
};
(function() {
  try {
    if (typeof document < "u") {
      var e = document.createElement("style");
      e.appendChild(document.createTextNode('.tooltip[data-v-70836592]{cursor:pointer;position:relative;display:block;width:100%;text-align:center;z-index:10}.tooltip span[data-v-70836592]{border-bottom:1px dotted}.tooltip[data-v-70836592]:after{display:none;content:attr(data-tooltip);background:#e8e9e9;max-width:500px;width:200px;position:absolute;left:-200px;right:0;margin:auto;opacity:0;height:auto;font-size:14px;padding:10px;border-radius:4px;color:#111;text-align:left}.tooltip.bottom[data-v-70836592]:after{top:80%;transition:opacity .3s ease .3s,top .3s cubic-bezier(.175,.885,.32,1.275) .3s}.tooltip.bottom[data-v-70836592]:hover:after{display:block;top:130%;opacity:1}.lifeline .line[data-v-4798b9e7]{background-size:1px 20px}.interaction{border:dashed transparent;border-width:0 7px}.interaction:hover{cursor:pointer}.message{position:relative}.message>.name{text-align:center}.interaction.right-to-left>.occurrence{left:-14px}.interaction.self>.occurrence{left:-8px;margin-top:-10px}.fragment{border-width:1px;margin:8px 0 0;padding-bottom:10px}.sequence-diagram *{box-sizing:inherit}.sequence-diagram{line-height:normal}.participant{border-width:2px;padding:8px 4px;min-width:88px;max-width:250px;text-align:center}.no-fill svg.arrow polyline[data-v-ca07199a]{fill:none!important}.async>.message>.point>svg.arrow>polyline[data-v-ca07199a]{fill:none}.right-to-left.point[data-v-ca07199a]{left:0;right:auto}.right-to-left.point>svg>polyline.right[data-v-ca07199a]{display:none}.right-to-left.point>svg>polyline.left[data-v-ca07199a]{display:inline}.point>svg>polyline.left[data-v-ca07199a]{display:none}*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";font-feature-settings:normal}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}:root{--color-bg-base: #fff;--color-text-base: #000;--color-text-secondary: #333;--color-border-base: #000}.theme-default{--color-text-base: #222;--color-border-base: #666;--color-message-arrow: #000;--color-bg-occurrence: #dedede}.theme-mermaid{--color-bg-base: #fff;--color-text-base: #222;--color-border-base: #666;--color-bg-occurrence: #dedede}.theme-mermaid .footer{visibility:hidden}.theme-darcula{--color-bg-canvas: #ffffff;--color-bg-frame: #2b2b2b;--color-border-frame: #cccccc;--color-bg-title: #2b2b2b;--color-text-title: #f8f8f2;--color-bg-participant: #44475a;--color-text-participant: #f8f8f2;--color-border-participant: #cccccc;--color-text-message: #ffb86c;--color-message-arrow: #cccccc;--color-bg-message-hover: #a6d2ff;--color-text-message-hover: #174ad4;--color-text-comment: #666666;--color-bg-fragment-header: #44475a;--color-text-fragment: #8be9fd;--color-border-fragment: #cccccc;--color-bg-occurrence: #44475a;--color-border-occurrence: #555555;--color-text-link: #a6d2ff;--color-text-control: #e2ba88}.theme-sky{--color-bg-canvas: #ffffff;--color-bg-frame: #ffffff;--color-border-frame: #cccccc;--color-bg-title: #deecfb;--color-text-title: #032c72;--color-bg-participant: #deecfb;--color-text-participant: #032c72;--color-border-participant: #032c72;--color-text-message: #032c72;--color-message-arrow: #032c72;--color-bg-message-hover: #a6d2ff;--color-text-message-hover: #174ad4;--color-text-comment: #666666;--color-bg-fragment-header: #f0f0f0;--color-text-fragment: #032c72;--color-border-fragment: #032c72;--color-bg-occurrence: #deecfb;--color-border-occurrence: #555555;--color-text-link: #a6d2ff;--color-text-control: #a6d2ff}.theme-idle-afternoon{--color-bg-canvas: #d8dad9;--color-bg-frame: #d8dad9;--color-border-frame: #324939;--color-bg-title: #d8dad9;--color-text-title: #182e27;--color-bg-participant: #f3f5f7;--color-text-participant: #182e27;--color-border-participant: #182e27;--color-text-message: #030809;--color-message-arrow: #324939;--color-bg-message-hover: #aea690;--color-text-message-hover: #000000;--color-text-comment: #030809;--color-bg-fragment-header: #f0f0f0;--color-text-fragment: #182e27;--color-border-fragment: #344337;--color-bg-occurrence: #f3f5f7;--color-border-occurrence: #344337;--color-text-link: #344337;--color-text-control: #97a49b}.theme-coles{--color-bg-canvas: #ffffff;--color-bg-frame: #ffde00;--color-border-frame: #ee141f;--color-bg-title: #ffffff;--color-text-title: #182e27;--color-bg-participant: #f3f5f7;--color-text-participant: #000000;--color-border-participant: #344337;--color-text-message: #000000;--color-message-arrow: #000000;--color-bg-message-hover: #ee141f;--color-text-message-hover: #ffffff;--color-text-comment: #000000;--color-bg-fragment-header: #ee141f;--color-text-fragment: #ffffff;--color-border-fragment: #ee141f;--color-bg-occurrence: #f3f5f7;--color-border-occurrence: #344337;--color-text-link: #344337;--color-text-control: #97a49b}.theme-coles .footer{background-color:#fff}.theme-woolworths{--color-bg-canvas: #e6eaf3;--color-bg-frame: #e6eaf3;--color-border-frame: #049e50;--color-bg-title: #ffffff;--color-text-title: #12522f;--color-bg-participant: #aacb51;--color-text-participant: #000000;--color-border-participant: #344337;--color-text-message: #12522f;--color-message-arrow: #049e50;--color-bg-message-hover: #fffefb;--color-text-message-hover: #ffffff;--color-text-comment: #000000;--color-bg-fragment-header: #aacb51;--color-text-fragment: #12522f;--color-border-fragment: #049e50;--color-bg-occurrence: #aacb51;--color-border-occurrence: #344337;--color-text-link: #344337;--color-text-control: #335c80}.theme-anz{--color-bg-canvas: #ffffff;--color-bg-frame: #ffffff;--color-border-frame: #089fd8;--color-bg-title: #ffffff;--color-text-title: #006e9c;--color-bg-participant: #fcfdf8;--color-text-participant: #00abd8;--color-border-participant: #00abd8;--color-text-message: #42a4e0;--color-message-arrow: #089fd8;--color-bg-message-hover: #006e9c;--color-text-message-hover: #ffffff;--color-text-comment: #000000;--color-bg-fragment-header: #42a4e0;--color-text-fragment: #006e9c;--color-border-fragment: #089fd8;--color-bg-occurrence: #fcfdf8;--color-border-occurrence: #006e9c;--color-text-link: #c9d8e7;--color-text-control: #335c80}.theme-anz .fragment .header{color:#fff}.theme-nab{--color-bg-canvas: #f2f4f6;--color-bg-participant: #c30000;--color-text-participant: #ffffff;--color-border-participant: #c30000;--color-text-message: #c30000;--color-bg-fragment-header: #c30000;--color-text-fragment-header: #ffffff}.theme-google{--color-white: #ffffff;--color-red-google: #db4437;--color-blue-google: #4285f4;--color-green-google: #0f9d58;--color-yellow-google: #f4b400;--color-bg-canvas: var(--color-white);--color-bg-frame: #f2f4f6;--color-border-frame: #4285f4;--color-bg-title: #4285f4;--color-text-title: #ffffff;--color-bg-participant: var(--color-red-google);--color-text-participant: #ffffff;--color-border-participant: #4285f4;--color-text-message: var(--color-red-google);--color-message-arrow: var(--color-red-google);--color-bg-message-hover: #fffefb;--color-text-message-hover: #ffffff;--color-text-comment: #000000;--color-bg-fragment-header: var(--color-green-google);--color-text-fragment: #ffffff;--color-border-fragment: #4285f4;--color-bg-occurrence: #f4b400;--color-border-occurrence: #4285f4;--color-text-link: #c9d8e7;--color-text-control: #335c80}*,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }::-webkit-backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.container{width:100%}@media (min-width: 640px){.container{max-width:640px}}@media (min-width: 768px){.container{max-width:768px}}@media (min-width: 1024px){.container{max-width:1024px}}@media (min-width: 1280px){.container{max-width:1280px}}@media (min-width: 1536px){.container{max-width:1536px}}.zenuml .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.zenuml .pointer-events-none{pointer-events:none}.zenuml .pointer-events-auto{pointer-events:auto}.zenuml .invisible{visibility:hidden}.zenuml .fixed{position:fixed}.zenuml .absolute{position:absolute}.zenuml .relative{position:relative}.zenuml .inset-0{top:0px;right:0px;bottom:0px;left:0px}.zenuml .bottom-1{bottom:.25rem}.zenuml .left-1{left:.25rem}.zenuml .right-1{right:.25rem}.zenuml .left-1\\/2{left:50%}.zenuml .right-0{right:0px}.zenuml .left-full{left:100%}.zenuml .z-40{z-index:40}.zenuml .z-10{z-index:10}.zenuml .col-span-2{grid-column:span 2 / span 2}.zenuml .col-span-1{grid-column:span 1 / span 1}.zenuml .col-span-4{grid-column:span 4 / span 4}.zenuml .float-right{float:right}.zenuml .m-1{margin:.25rem}.zenuml .m-2{margin:.5rem}.zenuml .m-auto{margin:auto}.zenuml .mx-auto{margin-left:auto;margin-right:auto}.zenuml .mx-2{margin-left:.5rem;margin-right:.5rem}.zenuml .-my-px{margin-top:-1px;margin-bottom:-1px}.zenuml .ml-4{margin-left:1rem}.zenuml .mt-3{margin-top:.75rem}.zenuml .mt-4{margin-top:1rem}.zenuml .mb-4{margin-bottom:1rem}.zenuml .mt-8{margin-top:2rem}.zenuml .-mt-12{margin-top:-3rem}.zenuml .mt-1{margin-top:.25rem}.zenuml .mt-2{margin-top:.5rem}.zenuml .box-border{box-sizing:border-box}.zenuml .block{display:block}.zenuml .inline-block{display:inline-block}.zenuml .inline{display:inline}.zenuml .flex{display:flex}.zenuml .inline-flex{display:inline-flex}.zenuml .table{display:table}.zenuml .grid{display:grid}.zenuml .contents{display:contents}.zenuml .hidden{display:none}.zenuml .h-screen{height:100vh}.zenuml .h-full{height:100%}.zenuml .h-10{height:2.5rem}.zenuml .h-5{height:1.25rem}.zenuml .h-0{height:0px}.zenuml .h-4{height:1rem}.zenuml .h-6{height:1.5rem}.zenuml .h-12{height:3rem}.zenuml .h-8{height:2rem}.zenuml .h-14{height:3.5rem}.zenuml .h-3{height:.75rem}.zenuml .min-h-screen{min-height:100vh}.zenuml .w-full{width:100%}.zenuml .w-96{width:24rem}.zenuml .w-28{width:7rem}.zenuml .w-4{width:1rem}.zenuml .w-6{width:1.5rem}.zenuml .w-8{width:2rem}.zenuml .w-11\\/12{width:91.666667%}.zenuml .w-px{width:1px}.zenuml .w-3{width:.75rem}.zenuml .min-w-\\[100px\\]{min-width:100px}.zenuml .max-w-full{max-width:100%}.zenuml .max-w-7xl{max-width:80rem}.zenuml .flex-shrink-0,.zenuml .shrink-0{flex-shrink:0}.zenuml .flex-grow,.zenuml .grow{flex-grow:1}.zenuml .origin-top-left{transform-origin:top left}.zenuml .-translate-x-1\\/2{--tw-translate-x: -50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .-translate-y-full{--tw-translate-y: -100%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .-translate-y-8{--tw-translate-y: -2rem;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .-translate-x-full{--tw-translate-x: -100%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .-translate-y-1\\/2{--tw-translate-y: -50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .translate-y-1\\/2{--tw-translate-y: 50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.zenuml .resize{resize:both}.zenuml .grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}.zenuml .grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.zenuml .grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.zenuml .flex-row-reverse{flex-direction:row-reverse}.zenuml .flex-col{flex-direction:column}.zenuml .flex-nowrap{flex-wrap:nowrap}.zenuml .items-start{align-items:flex-start}.zenuml .items-end{align-items:flex-end}.zenuml .items-center{align-items:center}.zenuml .justify-center{justify-content:center}.zenuml .justify-between{justify-content:space-between}.zenuml .justify-around{justify-content:space-around}.zenuml .gap-5{gap:1.25rem}.zenuml .overflow-hidden{overflow:hidden}.zenuml .overflow-visible{overflow:visible}.zenuml .overflow-y-auto{overflow-y:auto}.zenuml .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zenuml .whitespace-normal{white-space:normal}.zenuml .whitespace-nowrap{white-space:nowrap}.zenuml .rounded{border-radius:.25rem}.zenuml .rounded-sm{border-radius:.125rem}.zenuml .rounded-md{border-radius:.375rem}.zenuml .rounded-lg{border-radius:.5rem}.zenuml .rounded-t{border-top-left-radius:.25rem;border-top-right-radius:.25rem}.zenuml .rounded-t-md{border-top-left-radius:.375rem;border-top-right-radius:.375rem}.zenuml .rounded-b-md{border-bottom-right-radius:.375rem;border-bottom-left-radius:.375rem}.zenuml .border-2{border-width:2px}.zenuml .border{border-width:1px}.zenuml .border-b-2{border-bottom-width:2px}.zenuml .border-b{border-bottom-width:1px}.zenuml .border-t{border-top-width:1px}.zenuml .border-r{border-right-width:1px}.zenuml .border-solid{border-style:solid}.zenuml .border-dashed{border-style:dashed}.zenuml .border-red-900{--tw-border-opacity: 1;border-color:rgb(127 29 29 / var(--tw-border-opacity))}.zenuml .border-skin-frame{border-color:var(--color-border-frame, var(--color-border-base, #000))}.zenuml .border-gray-200{--tw-border-opacity: 1;border-color:rgb(229 231 235 / var(--tw-border-opacity))}.zenuml .border-skin-participant{border-color:var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000)))}.zenuml .border-transparent{border-color:transparent}.zenuml .border-skin-fragment{border-color:var(--color-border-fragment, var(--color-border-frame, var(--color-border-base, #000)))}.zenuml .border-skin-message-arrow{border-color:var(--color-message-arrow, var(--color-border-frame, var(--color-border-base, #000)))}.zenuml .border-skin-occurrence{border-color:var(--color-border-occurrence, var(--color-border-frame, var(--color-border-base, #000)))}.zenuml .bg-gray-50{--tw-bg-opacity: 1;background-color:rgb(249 250 251 / var(--tw-bg-opacity))}.zenuml .bg-skin-canvas{background-color:var(--color-bg-canvas, var(--color-bg-base, #fff))}.zenuml .bg-skin-frame{background-color:var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff)))}.zenuml .bg-skin-title{background-color:var(--color-bg-title, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff))))}.zenuml .bg-skin-base{background-color:var(--color-bg-base)}.zenuml .bg-green-200{--tw-bg-opacity: 1;background-color:rgb(187 247 208 / var(--tw-bg-opacity))}.zenuml .bg-white{--tw-bg-opacity: 1;background-color:rgb(255 255 255 / var(--tw-bg-opacity))}.zenuml .bg-gray-500{--tw-bg-opacity: 1;background-color:rgb(107 114 128 / var(--tw-bg-opacity))}.zenuml .bg-skin-lifeline{background-color:var(--color-border-participant, var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000))))}.zenuml .bg-skin-participant{background-color:var(--color-bg-participant, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff))))}.zenuml .bg-gray-400{--tw-bg-opacity: 1;background-color:rgb(156 163 175 / var(--tw-bg-opacity))}.zenuml .bg-skin-divider{background-color:var(--color-border-participant, var(--color-border-frame, var(--color-border-base, #000)))}.zenuml .bg-skin-fragment-header{background-color:var(--color-bg-fragment-header, transparent)}.zenuml .bg-skin-occurrence{background-color:var(--color-bg-occurrence, var(--color-bg-participant, var(--color-bg-frame, var(--color-bg-canvas, var(--color-bg-base, #fff)))))}.zenuml .bg-opacity-75{--tw-bg-opacity: .75}.zenuml .fill-current{fill:currentColor}.zenuml .fill-none{fill:none}.zenuml .stroke-current{stroke:currentColor}.zenuml .stroke-2{stroke-width:2}.zenuml .object-contain{object-fit:contain}.zenuml .p-1{padding:.25rem}.zenuml .p-2{padding:.5rem}.zenuml .p-0{padding:0}.zenuml .px-1{padding-left:.25rem;padding-right:.25rem}.zenuml .px-3{padding-left:.75rem;padding-right:.75rem}.zenuml .py-1{padding-top:.25rem;padding-bottom:.25rem}.zenuml .px-2{padding-left:.5rem;padding-right:.5rem}.zenuml .py-2{padding-top:.5rem;padding-bottom:.5rem}.zenuml .px-4{padding-left:1rem;padding-right:1rem}.zenuml .py-5{padding-top:1.25rem;padding-bottom:1.25rem}.zenuml .px-px{padding-left:1px;padding-right:1px}.zenuml .pb-8{padding-bottom:2rem}.zenuml .pt-8{padding-top:2rem}.zenuml .pt-4{padding-top:1rem}.zenuml .pb-20{padding-bottom:5rem}.zenuml .pb-4{padding-bottom:1rem}.zenuml .pb-32{padding-bottom:8rem}.zenuml .pb-2{padding-bottom:.5rem}.zenuml .pr-24{padding-right:6rem}.zenuml .pt-24{padding-top:6rem}.zenuml .pb-10{padding-bottom:2.5rem}.zenuml .text-left{text-align:left}.zenuml .text-center{text-align:center}.zenuml .align-bottom{vertical-align:bottom}.zenuml .text-xs{font-size:.75rem;line-height:1rem}.zenuml .text-sm{font-size:.875rem;line-height:1.25rem}.zenuml .text-base{font-size:1rem;line-height:1.5rem}.zenuml .text-xl{font-size:1.25rem;line-height:1.75rem}.zenuml .text-lg{font-size:1.125rem;line-height:1.75rem}.zenuml .font-bold{font-weight:700}.zenuml .font-semibold{font-weight:600}.zenuml .font-medium{font-weight:500}.zenuml .italic{font-style:italic}.zenuml .leading-6{line-height:1.5rem}.zenuml .leading-4{line-height:1rem}.zenuml .text-skin-title{color:var(--color-text-title, var(--color-text-message, var(--color-text-base, #000)))}.zenuml .text-skin-control{color:var(--color-text-control, var(--color-text-secondary, var(--color-text-base, #000)))}.zenuml .text-skin-link{color:var(--color-text-link, var(--color-text-secondary, var(--color-text-base, #000)))}.zenuml .text-green-700{--tw-text-opacity: 1;color:rgb(21 128 61 / var(--tw-text-opacity))}.zenuml .text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity))}.zenuml .text-gray-900{--tw-text-opacity: 1;color:rgb(17 24 39 / var(--tw-text-opacity))}.zenuml .text-gray-400{--tw-text-opacity: 1;color:rgb(156 163 175 / var(--tw-text-opacity))}.zenuml .text-gray-600{--tw-text-opacity: 1;color:rgb(75 85 99 / var(--tw-text-opacity))}.zenuml .text-gray-500{--tw-text-opacity: 1;color:rgb(107 114 128 / var(--tw-text-opacity))}.zenuml .text-skin-participant{color:var(--color-text-participant, var(--color-text-message, var(--color-text-base, #000)))}.zenuml .text-skin-base{color:var(--color-text-base)}.zenuml .text-skin-message{color:var(--color-text-message, var(--color-text-base, #000))}.zenuml .text-skin-comment{color:var(--color-text-comment, var(--color-text-secondary, var(--color-text-base, #000)))}.zenuml .text-skin-fragment-header{color:var(--color-text-fragment-header, var(--color-text-message, #000))}.zenuml .text-skin-fragment{color:var(--color-text-fragment, var(--color-text-message, #000))}.zenuml .text-skin-message-arrow{color:var(--color-message-arrow, var(--color-border-frame, var(--color-border-base, #000)))}.zenuml .opacity-50{opacity:.5}.zenuml .shadow-sm{--tw-shadow: 0 1px 2px 0 rgb(0 0 0 / .05);--tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.zenuml .shadow-xl{--tw-shadow: 0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1);--tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.zenuml .shadow{--tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);--tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.zenuml .shadow-slate-500\\/50{--tw-shadow-color: rgb(100 116 139 / .5);--tw-shadow: var(--tw-shadow-colored)}.zenuml .blur{--tw-blur: blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.zenuml .grayscale{--tw-grayscale: grayscale(100%);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.zenuml .filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.zenuml .transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.zenuml .transition-opacity{transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.zenuml .transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.zenuml .hover\\:whitespace-normal:hover{white-space:normal}.zenuml .hover\\:bg-yellow-300:hover{--tw-bg-opacity: 1;background-color:rgb(253 224 71 / var(--tw-bg-opacity))}.zenuml .hover\\:bg-gray-100:hover{--tw-bg-opacity: 1;background-color:rgb(243 244 246 / var(--tw-bg-opacity))}.zenuml .hover\\:bg-skin-message-hover:hover{background-color:var(--color-bg-message-hover, var(--color-text-base, #000))}.zenuml .hover\\:text-gray-600:hover{--tw-text-opacity: 1;color:rgb(75 85 99 / var(--tw-text-opacity))}.zenuml .hover\\:text-gray-500:hover{--tw-text-opacity: 1;color:rgb(107 114 128 / var(--tw-text-opacity))}.zenuml .hover\\:text-skin-message-hover:hover{color:var(--color-text-message-hover, var(--color-bg-base, #fff))}.zenuml .hover\\:opacity-100:hover{opacity:1}.zenuml .focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.zenuml .focus\\:ring-2:focus{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.zenuml .focus\\:ring-inset:focus{--tw-ring-inset: inset}.zenuml .focus\\:ring-indigo-500:focus{--tw-ring-opacity: 1;--tw-ring-color: rgb(99 102 241 / var(--tw-ring-opacity))}.zenuml .group:hover .group-hover\\:flex{display:flex}@media (min-width: 640px){.zenuml .sm\\:my-8{margin-top:2rem;margin-bottom:2rem}.zenuml .sm\\:block{display:block}.zenuml .sm\\:inline-block{display:inline-block}.zenuml .sm\\:h-screen{height:100vh}.zenuml .sm\\:grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}.zenuml .sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.zenuml .sm\\:gap-6{gap:1.5rem}.zenuml .sm\\:p-2{padding:.5rem}.zenuml .sm\\:px-6{padding-left:1.5rem;padding-right:1.5rem}.zenuml .sm\\:align-middle{vertical-align:middle}}@media (min-width: 1024px){.zenuml .lg\\:mx-auto{margin-left:auto;margin-right:auto}.zenuml .lg\\:mx-0{margin-left:0;margin-right:0}.zenuml .lg\\:max-w-none{max-width:none}.zenuml .lg\\:grid-cols-8{grid-template-columns:repeat(8,minmax(0,1fr))}.zenuml .lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.zenuml .lg\\:px-8{padding-left:2rem;padding-right:2rem}}.zenuml .\\[\\&\\>svg\\]\\:h-full>svg{height:100%}.zenuml .\\[\\&\\>svg\\]\\:w-full>svg{width:100%}.zenuml{font-family:Helvetica,Verdana,serif;font-size:16px}.zenuml .frame .sequence-diagram .comments code{background-color:#f9f2f4;padding:2px;margin:1px 0;border-radius:2px}.zenuml .frame .sequence-diagram .comments .rest-api .http-method-post{color:#0d4b3b}.zenuml .frame .sequence-diagram .comments .rest-api .http-method-get{color:#2f3d89}.zenuml .frame .sequence-diagram .comments .rest-api .http-method-delete{color:#7e1e23}.zenuml .frame .sequence-diagram .comments ol,.zenuml .frame .sequence-diagram .comments ul{margin:0;padding-left:20px}.zenuml .frame .sequence-diagram .comments ul li{list-style-type:none}.zenuml .frame .sequence-diagram .comments ul li input[type=checkbox]{margin-left:-1em}.zenuml .frame .sequence-diagram .comments table{border-collapse:collapse;border-spacing:0;empty-cells:show;border-color:#cbcbcb}.zenuml .frame .sequence-diagram .comments table td,.zenuml .frame .sequence-diagram .comments table th{padding:.5em}.zenuml .frame .sequence-diagram .comments table thead{background-color:#e0e0e0}.zenuml .frame .sequence-diagram .comments table td{background-color:transparent}.theme-blue .sequence-diagram .divider .name{border-radius:4px;border:1px solid #e28553;color:#e28553}.theme-blue .sequence-diagram .divider .left,.theme-blue .sequence-diagram .divider .right{background:#e28553}.theme-blue .sequence-diagram .lifeline .participant{border-color:#032c72;background:rgba(146,192,240,.3)}.theme-blue .sequence-diagram .lifeline .participant label{color:#032c72}.theme-blue .sequence-diagram .lifeline .line{border-left-color:#032c72}.theme-blue .sequence-diagram .message{border-bottom-color:#032c72}.theme-blue .sequence-diagram .message .name{color:#032c72}.theme-blue .sequence-diagram .message svg polyline{stroke:#032c72}.theme-blue .sequence-diagram .message svg polyline.head{fill:#032c72}.theme-blue .sequence-diagram .occurrence{border-color:#032c72;background-color:#fff}.theme-blue .sequence-diagram .fragment{border-radius:4px;border-color:#042e6e4d}.theme-blue .sequence-diagram .fragment .header .name{background:rgba(4,46,110,.1)}.theme-blue .sequence-diagram .fragment .header label{color:#032c72}.theme-black-white .sequence-diagram .divider .name{border-radius:0;border-color:#000;box-shadow:2px 2px #000}.theme-black-white .sequence-diagram .divider .left,.theme-black-white .sequence-diagram .divider .right{background:#000}.theme-black-white .sequence-diagram .lifeline .participant{border-color:#000;background:#fff;box-shadow:2px 2px #000}.theme-black-white .sequence-diagram .lifeline .line{border-left-color:#0006}.theme-black-white .sequence-diagram .message{border-bottom-color:#000}.theme-black-white .sequence-diagram .message .name{color:#000}.theme-black-white .sequence-diagram .message svg polyline{stroke:#000}.theme-black-white .sequence-diagram .message svg polyline.head{fill:#000}.theme-black-white .sequence-diagram .occurrence{border-color:#000;background-color:#f5f5f5}.theme-black-white .sequence-diagram .fragment{border-color:#0000004d}.theme-black-white .sequence-diagram .fragment .header .name{background:rgba(0,0,0,.07)}.theme-star-uml .sequence-diagram .lifeline .participant{border-color:#b94065;background-color:#fffec8}.theme-star-uml .sequence-diagram .lifeline .line{border-left-color:#b94065}.theme-star-uml .sequence-diagram .message{border-bottom-color:#b94065}.theme-star-uml .sequence-diagram .message svg polyline{stroke:#b94065}.theme-star-uml .sequence-diagram .message svg polyline.head{fill:#b94065}.theme-star-uml .sequence-diagram .occurrence{background-color:#fffec8;border-color:#b94065}.blue-river .sequence-diagram{color:#5452f6}.blue-river .sequence-diagram .life-line-layer .lifeline.actor .participant:before{filter:invert(100%) sepia(0%) saturate(0%) hue-rotate(93deg) brightness(103%) contrast(103%)}.blue-river .sequence-diagram .life-line-layer .participant{background:#2097f7;box-shadow:4px 4px #83c4f8;border-radius:9px;color:#fff}.blue-river .sequence-diagram .life-line-layer .participant .interface{font-size:.8em}.blue-river .sequence-diagram .life-line-layer .line{border-left-color:#2097f7}.blue-river .sequence-diagram .message-layer .message{border-bottom-color:#2097f7}.blue-river .sequence-diagram .message-layer .message svg.arrow polyline{stroke:#2097f7;fill:#2097f7}.blue-river .sequence-diagram .message-layer .message.self svg.arrow polyline{fill:none}.blue-river .sequence-diagram .message-layer .message.self svg.arrow polyline.head{fill:#2097f7}.blue-river .sequence-diagram .message-layer .occurrence{background:#e5fde8;border-color:#65bf73;box-shadow:4px 4px #93c69b}.blue-river .sequence-diagram .message-layer .fragment{border-color:#2097f7}.blue-river .sequence-diagram .message-layer .fragment .header .name label{display:inline-block;min-width:50px;background:#5452f6;color:#fff;padding:2px 0 2px 10px}.blue-river .sequence-diagram .message-layer .fragment .header .name:after{content:"SO";display:inline-block;background:#5452f6;margin-left:-23px;width:34px;transform:translateY(-2px);height:22px;-webkit-clip-path:polygon(66% 0,100% 0,100% 66%,66% 100%);clip-path:polygon(66% 0,100% 0,100% 66%,66% 100%)}.blue-river .sequence-diagram .message-layer .fragment .header>label{display:inline-block;min-width:50px;font-weight:700;color:#fff;background:#65bf73}.blue-river .sequence-diagram .message-layer .fragment .comments{border-color:inherit}.blue-river .sequence-diagram .message-layer .fragment .divider{border-bottom-color:inherit}:root{--background: #282a36;--hover: #2b2b2b;--occurance-border: #6e7191;--border: #585b74;--white: #f8f8f2;--current: #44475a;--comment: #6272a4;--cyan: #8be9fd;--green: #50fa7b;--orange: #ffb86c;--pink: #ff79c6;--purple: #bd93f9;--red: #ff5555;--yellow: #f1fa8c;--crayola: #a9b7c6}body .zenuml.theme-dark{background-color:var(--background)}.zenuml.theme-dark .header{color:var(--crayola);font-weight:700}.zenuml.theme-dark .sequence-diagram .lifeline-group:hover{background-color:#223049}.zenuml.theme-dark .sequence-diagram .lifeline .participant{border-color:var(--border);border-radius:2px;background:var(--background)}.zenuml.theme-dark .sequence-diagram .lifeline .participant label{color:var(--cyan)}.zenuml.theme-dark .sequence-diagram .lifeline .line{background:var(--border)}.zenuml.theme-dark .fragment>.header>.condition{color:var(--crayola);padding:6px}.zenuml.theme-dark .sequence-diagram .fragment .header label{color:var(--crayola);padding:6px}.zenuml.theme-dark .sequence-diagram .fragment .header .name{border-bottom-color:var(--border)}.zenuml.theme-dark .sequence-diagram .fragment .header .name label{color:var(--pink);font-weight:400}.zenuml.theme-dark .sequence-diagram .fragment{border-color:var(--border)}.zenuml.theme-dark .sequence-diagram .comments{border:none;background:transparent;color:var(--comment)}.zenuml.theme-dark .sequence-diagram .fragment .segment:not(:first-child){border-top-color:var(--border)}.zenuml.theme-dark .sequence-diagram .interaction{color:var(--orange)}.zenuml.theme-dark .sequence-diagram .message{border-bottom-color:var(--border)}.zenuml.theme-dark .sequence-diagram .message .name:hover{color:var(--crayola)}.zenuml.theme-dark .sequence-diagram .message svg polyline{fill:var(--border);stroke:var(--border)}.zenuml.theme-dark .sequence-diagram .message.self svg>polyline:not(.head){fill:none}.zenuml.theme-dark .sequence-diagram .occurrence{background-color:var(--current);box-shadow:0 0 0 1px var(--occurance-border);border-radius:2px}.zenuml.theme-dark .sequence-diagram .divider .left,.zenuml.theme-dark .sequence-diagram .divider .right{background:var(--border)}.zenuml.theme-dark .sequence-diagram .divider .name{color:var(--comment)}.zenuml.theme-dark .interaction .message>.name:hover{background-color:#228b22;color:#fff}p[data-v-15224042]{margin:0;line-height:1.25em}.occurrence[data-v-054f42d1]{width:15px;padding:16px 0 16px 5px}[data-v-054f42d1]>.statement-container:last-child>.interaction.return:last-of-type{margin-bottom:0;border-bottom:0;transform:translateY(1px)}[data-v-054f42d1]>.statement-container:last-child>.interaction.return:last-of-type>.message{bottom:-17px;height:0}.right-to-left.occurrence[data-v-054f42d1]{left:-14px}.occurrence{margin-top:-2px}.interaction .occurrence.source[data-v-86ce6a08]{position:absolute;height:calc(100% + 14px);left:-12px;display:none}.interaction .occurrence.source.right-to-left[data-v-86ce6a08]{left:unset;right:-13px}.message.self[data-v-25f755f6]{transform:translate(-5px)}.interaction .invisible-occurrence[data-v-4d783075]{height:20px}.interaction.async[data-v-4d783075] .message{width:100%}*[data-v-c5cae879],*[data-v-bc96f29d]{border-color:inherit}.fragment.par>.block>.statement-container:not(:first-child){border-top-color:inherit;border-top-width:1px;border-top-style:solid}*[data-v-62b3ca90],*[data-v-e9cc75db],*[data-v-107670fe]{border-color:inherit}.divider[data-v-9e567e69]{display:flex;align-items:center}.name[data-v-9e567e69]{margin:0;padding:2px 6px}.left[data-v-9e567e69],.right[data-v-9e567e69]{height:1px;flex-grow:1}')), document.head.appendChild(e);
    }
  } catch (t) {
    console.error("vite-plugin-css-injected-by-js", t);
  }
})();
var gh = Object.defineProperty, mh = (e, t, n) => t in e ? gh(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, B = (e, t, n) => (mh(e, typeof t != "symbol" ? t + "" : t, n), n), ss = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function xh(e) {
  try {
    return JSON.stringify(e);
  } catch {
    return '"[Circular]"';
  }
}
var Lh = yh;
function yh(e, t, n) {
  var r = n && n.stringify || xh, s = 1;
  if (typeof e == "object" && e !== null) {
    var i = t.length + s;
    if (i === 1)
      return e;
    var o = new Array(i);
    o[0] = r(e);
    for (var a = 1; a < i; a++)
      o[a] = r(t[a]);
    return o.join(" ");
  }
  if (typeof e != "string")
    return e;
  var l = t.length;
  if (l === 0)
    return e;
  for (var c = "", u = 1 - s, d = -1, f = e && e.length || 0, m = 0; m < f; ) {
    if (e.charCodeAt(m) === 37 && m + 1 < f) {
      switch (d = d > -1 ? d : 0, e.charCodeAt(m + 1)) {
        case 100:
        case 102:
          if (u >= l || t[u] == null)
            break;
          d < m && (c += e.slice(d, m)), c += Number(t[u]), d = m + 2, m++;
          break;
        case 105:
          if (u >= l || t[u] == null)
            break;
          d < m && (c += e.slice(d, m)), c += Math.floor(Number(t[u])), d = m + 2, m++;
          break;
        case 79:
        case 111:
        case 106:
          if (u >= l || t[u] === void 0)
            break;
          d < m && (c += e.slice(d, m));
          var I = typeof t[u];
          if (I === "string") {
            c += "'" + t[u] + "'", d = m + 2, m++;
            break;
          }
          if (I === "function") {
            c += t[u].name || "<anonymous>", d = m + 2, m++;
            break;
          }
          c += r(t[u]), d = m + 2, m++;
          break;
        case 115:
          if (u >= l)
            break;
          d < m && (c += e.slice(d, m)), c += String(t[u]), d = m + 2, m++;
          break;
        case 37:
          d < m && (c += e.slice(d, m)), c += "%", d = m + 2, m++, u--;
          break;
      }
      ++u;
    }
    ++m;
  }
  return d === -1 ? e : (d < f && (c += e.slice(d)), c);
}
const wa = Lh;
var vh = De;
const Fr = Rh().console || {}, bh = {
  mapHttpRequest: is,
  mapHttpResponse: is,
  wrapRequestSerializer: Ni,
  wrapResponseSerializer: Ni,
  wrapErrorSerializer: Ni,
  req: is,
  res: is,
  err: Eh
};
function wh(e, t) {
  return Array.isArray(e) ? e.filter(function(n) {
    return n !== "!stdSerializers.err";
  }) : e === !0 ? Object.keys(t) : !1;
}
function De(e) {
  e = e || {}, e.browser = e.browser || {};
  const t = e.browser.transmit;
  if (t && typeof t.send != "function")
    throw Error("pino: transmit option must have a send function");
  const n = e.browser.write || Fr;
  e.browser.write && (e.browser.asObject = !0);
  const r = e.serializers || {}, s = wh(e.browser.serialize, r);
  let i = e.browser.serialize;
  Array.isArray(e.browser.serialize) && e.browser.serialize.indexOf("!stdSerializers.err") > -1 && (i = !1);
  const o = ["error", "fatal", "warn", "info", "debug", "trace"];
  typeof n == "function" && (n.error = n.fatal = n.warn = n.info = n.debug = n.trace = n), (e.enabled === !1 || e.browser.disabled) && (e.level = "silent");
  const a = e.level || "info", l = Object.create(n);
  l.log || (l.log = zr), Object.defineProperty(l, "levelVal", {
    get: u
  }), Object.defineProperty(l, "level", {
    get: d,
    set: f
  });
  const c = {
    transmit: t,
    serialize: s,
    asObject: e.browser.asObject,
    levels: o,
    timestamp: Th(e)
  };
  l.levels = De.levels, l.level = a, l.setMaxListeners = l.getMaxListeners = l.emit = l.addListener = l.on = l.prependListener = l.once = l.prependOnceListener = l.removeListener = l.removeAllListeners = l.listeners = l.listenerCount = l.eventNames = l.write = l.flush = zr, l.serializers = r, l._serialize = s, l._stdErrSerialize = i, l.child = m, t && (l._logEvent = Ji());
  function u() {
    return this.level === "silent" ? 1 / 0 : this.levels.values[this.level];
  }
  function d() {
    return this._level;
  }
  function f(I) {
    if (I !== "silent" && !this.levels.values[I])
      throw Error("unknown level " + I);
    this._level = I, Dn(c, l, "error", "log"), Dn(c, l, "fatal", "error"), Dn(c, l, "warn", "error"), Dn(c, l, "info", "log"), Dn(c, l, "debug", "log"), Dn(c, l, "trace", "log");
  }
  function m(I, M) {
    if (!I)
      throw new Error("missing bindings for child Pino");
    M = M || {}, s && I.serializers && (M.serializers = I.serializers);
    const tt = M.serializers;
    if (s && tt) {
      var G = Object.assign({}, r, tt), J = e.browser.serialize === !0 ? Object.keys(G) : s;
      delete I.serializers, Vs([I], J, G, this._stdErrSerialize);
    }
    function q(Q) {
      this._childLevel = (Q._childLevel | 0) + 1, this.error = Bn(Q, I, "error"), this.fatal = Bn(Q, I, "fatal"), this.warn = Bn(Q, I, "warn"), this.info = Bn(Q, I, "info"), this.debug = Bn(Q, I, "debug"), this.trace = Bn(Q, I, "trace"), G && (this.serializers = G, this._serialize = J), t && (this._logEvent = Ji(
        [].concat(Q._logEvent.bindings, I)
      ));
    }
    return q.prototype = this, new q(this);
  }
  return l;
}
De.levels = {
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  },
  labels: {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal"
  }
};
De.stdSerializers = bh;
De.stdTimeFunctions = Object.assign({}, { nullTime: u0, epochTime: d0, unixTime: Ah, isoTime: Sh });
function Dn(e, t, n, r) {
  const s = Object.getPrototypeOf(t);
  t[n] = t.levelVal > t.levels.values[n] ? zr : s[n] ? s[n] : Fr[n] || Fr[r] || zr, Ch(e, t, n);
}
function Ch(e, t, n) {
  !e.transmit && t[n] === zr || (t[n] = function(r) {
    return function() {
      const s = e.timestamp(), i = new Array(arguments.length), o = Object.getPrototypeOf && Object.getPrototypeOf(this) === Fr ? Fr : this;
      for (var a = 0; a < i.length; a++)
        i[a] = arguments[a];
      if (e.serialize && !e.asObject && Vs(i, this._serialize, this.serializers, this._stdErrSerialize), e.asObject ? r.call(o, _h(this, n, i, s)) : r.apply(o, i), e.transmit) {
        const l = e.transmit.level || t.level, c = De.levels.values[l], u = De.levels.values[n];
        if (u < c)
          return;
        kh(this, {
          ts: s,
          methodLevel: n,
          methodValue: u,
          transmitLevel: l,
          transmitValue: De.levels.values[e.transmit.level || t.level],
          send: e.transmit.send,
          val: t.levelVal
        }, i);
      }
    };
  }(t[n]));
}
function _h(e, t, n, r) {
  e._serialize && Vs(n, e._serialize, e.serializers, e._stdErrSerialize);
  const s = n.slice();
  let i = s[0];
  const o = {};
  r && (o.time = r), o.level = De.levels.values[t];
  let a = (e._childLevel | 0) + 1;
  if (a < 1 && (a = 1), i !== null && typeof i == "object") {
    for (; a-- && typeof s[0] == "object"; )
      Object.assign(o, s.shift());
    i = s.length ? wa(s.shift(), s) : void 0;
  } else
    typeof i == "string" && (i = wa(s.shift(), s));
  return i !== void 0 && (o.msg = i), o;
}
function Vs(e, t, n, r) {
  for (const s in e)
    if (r && e[s] instanceof Error)
      e[s] = De.stdSerializers.err(e[s]);
    else if (typeof e[s] == "object" && !Array.isArray(e[s]))
      for (const i in e[s])
        t && t.indexOf(i) > -1 && i in n && (e[s][i] = n[i](e[s][i]));
}
function Bn(e, t, n) {
  return function() {
    const r = new Array(1 + arguments.length);
    r[0] = t;
    for (var s = 1; s < r.length; s++)
      r[s] = arguments[s - 1];
    return e[n].apply(this, r);
  };
}
function kh(e, t, n) {
  const r = t.send, s = t.ts, i = t.methodLevel, o = t.methodValue, a = t.val, l = e._logEvent.bindings;
  Vs(
    n,
    e._serialize || Object.keys(e.serializers),
    e.serializers,
    e._stdErrSerialize === void 0 ? !0 : e._stdErrSerialize
  ), e._logEvent.ts = s, e._logEvent.messages = n.filter(function(c) {
    return l.indexOf(c) === -1;
  }), e._logEvent.level.label = i, e._logEvent.level.value = o, r(i, e._logEvent, a), e._logEvent = Ji(l);
}
function Ji(e) {
  return {
    ts: 0,
    messages: [],
    bindings: e || [],
    level: { label: "", value: 0 }
  };
}
function Eh(e) {
  const t = {
    type: e.constructor.name,
    msg: e.message,
    stack: e.stack
  };
  for (const n in e)
    t[n] === void 0 && (t[n] = e[n]);
  return t;
}
function Th(e) {
  return typeof e.timestamp == "function" ? e.timestamp : e.timestamp === !1 ? u0 : d0;
}
function is() {
  return {};
}
function Ni(e) {
  return e;
}
function zr() {
}
function u0() {
  return !1;
}
function d0() {
  return Date.now();
}
function Ah() {
  return Math.round(Date.now() / 1e3);
}
function Sh() {
  return new Date(Date.now()).toISOString();
}
function Rh() {
  function e(t) {
    return typeof t < "u" && t;
  }
  try {
    return typeof globalThis < "u" || Object.defineProperty(Object.prototype, "globalThis", {
      get: function() {
        return delete Object.prototype.globalThis, this.globalThis = this;
      },
      configurable: !0
    }), globalThis;
  } catch {
    return e(self) || e(window) || e(this) || {};
  }
}
const Ih = vh({
  level: "warn"
}), Ca = ["log", "trace", "debug", "info", "warn", "error"];
function Oh(e, t) {
  e[t] = (console[t] || console.log).bind(console);
}
function Nh(e, t, n) {
  e[t] = (console[t] || console.log).bind(console, n[0], n[1]);
}
function Ph(e) {
  Ca.forEach((n) => Oh(e, n));
  const t = e.child;
  return e.child = function(n) {
    const r = t.call(e, n);
    return Ca.forEach((s) => Nh(r, s, ["%c" + n.name || "", "color: #00f"])), r;
  }, e;
}
let qr = Ph(Ih);
function O1(e, t) {
  const n = /* @__PURE__ */ Object.create(null), r = e.split(",");
  for (let s = 0; s < r.length; s++)
    n[r[s]] = !0;
  return t ? (s) => !!n[s.toLowerCase()] : (s) => !!n[s];
}
function gt(e) {
  if (nt(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const r = e[n], s = Ft(r) ? Dh(r) : gt(r);
      if (s)
        for (const i in s)
          t[i] = s[i];
    }
    return t;
  } else if (Ft(e) || Pt(e))
    return e;
}
const Mh = /;(?![^(]*\))/g, Fh = /:([^]+)/, zh = /\/\*.*?\*\//gs;
function Dh(e) {
  const t = {};
  return e.replace(zh, "").split(Mh).forEach((n) => {
    if (n) {
      const r = n.split(Fh);
      r.length > 1 && (t[r[0].trim()] = r[1].trim());
    }
  }), t;
}
function ne(e) {
  let t = "";
  if (Ft(e))
    t = e;
  else if (nt(e))
    for (let n = 0; n < e.length; n++) {
      const r = ne(e[n]);
      r && (t += r + " ");
    }
  else if (Pt(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Bh = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Uh = /* @__PURE__ */ O1(Bh);
function p0(e) {
  return !!e || e === "";
}
const Ht = (e) => Ft(e) ? e : e == null ? "" : nt(e) || Pt(e) && (e.toString === x0 || !st(e.toString)) ? JSON.stringify(e, f0, 2) : String(e), f0 = (e, t) => t && t.__v_isRef ? f0(e, t.value) : qn(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce((n, [r, s]) => (n[`${r} =>`] = s, n), {})
} : g0(t) ? {
  [`Set(${t.size})`]: [...t.values()]
} : Pt(t) && !nt(t) && !L0(t) ? String(t) : t, Et = {}, Vn = [], Be = () => {
}, Hh = () => !1, Gh = /^on[^a-z]/, qs = (e) => Gh.test(e), N1 = (e) => e.startsWith("onUpdate:"), re = Object.assign, P1 = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, $h = Object.prototype.hasOwnProperty, ut = (e, t) => $h.call(e, t), nt = Array.isArray, qn = (e) => Zs(e) === "[object Map]", g0 = (e) => Zs(e) === "[object Set]", st = (e) => typeof e == "function", Ft = (e) => typeof e == "string", M1 = (e) => typeof e == "symbol", Pt = (e) => e !== null && typeof e == "object", m0 = (e) => Pt(e) && st(e.then) && st(e.catch), x0 = Object.prototype.toString, Zs = (e) => x0.call(e), jh = (e) => Zs(e).slice(8, -1), L0 = (e) => Zs(e) === "[object Object]", F1 = (e) => Ft(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, ys = /* @__PURE__ */ O1(
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Ws = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, Vh = /-(\w)/g, He = Ws((e) => e.replace(Vh, (t, n) => n ? n.toUpperCase() : "")), qh = /\B([A-Z])/g, sr = Ws((e) => e.replace(qh, "-$1").toLowerCase()), Ys = Ws((e) => e.charAt(0).toUpperCase() + e.slice(1)), Pi = Ws((e) => e ? `on${Ys(e)}` : ""), Es = (e, t) => !Object.is(e, t), Mi = (e, t) => {
  for (let n = 0; n < e.length; n++)
    e[n](t);
}, Ts = (e, t, n) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    value: n
  });
}, y0 = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let _a;
const Zh = () => _a || (_a = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
let Ne;
class v0 {
  constructor(t = !1) {
    this.detached = t, this.active = !0, this.effects = [], this.cleanups = [], this.parent = Ne, !t && Ne && (this.index = (Ne.scopes || (Ne.scopes = [])).push(this) - 1);
  }
  run(t) {
    if (this.active) {
      const n = Ne;
      try {
        return Ne = this, t();
      } finally {
        Ne = n;
      }
    }
  }
  on() {
    Ne = this;
  }
  off() {
    Ne = this.parent;
  }
  stop(t) {
    if (this.active) {
      let n, r;
      for (n = 0, r = this.effects.length; n < r; n++)
        this.effects[n].stop();
      for (n = 0, r = this.cleanups.length; n < r; n++)
        this.cleanups[n]();
      if (this.scopes)
        for (n = 0, r = this.scopes.length; n < r; n++)
          this.scopes[n].stop(!0);
      if (!this.detached && this.parent && !t) {
        const s = this.parent.scopes.pop();
        s && s !== this && (this.parent.scopes[this.index] = s, s.index = this.index);
      }
      this.parent = void 0, this.active = !1;
    }
  }
}
function Wh(e) {
  return new v0(e);
}
function Yh(e, t = Ne) {
  t && t.active && t.effects.push(e);
}
const z1 = (e) => {
  const t = new Set(e);
  return t.w = 0, t.n = 0, t;
}, b0 = (e) => (e.w & pn) > 0, w0 = (e) => (e.n & pn) > 0, Kh = ({ deps: e }) => {
  if (e.length)
    for (let t = 0; t < e.length; t++)
      e[t].w |= pn;
}, Qh = (e) => {
  const { deps: t } = e;
  if (t.length) {
    let n = 0;
    for (let r = 0; r < t.length; r++) {
      const s = t[r];
      b0(s) && !w0(s) ? s.delete(e) : t[n++] = s, s.w &= ~pn, s.n &= ~pn;
    }
    t.length = n;
  }
}, t1 = /* @__PURE__ */ new WeakMap();
let Er = 0, pn = 1;
const e1 = 30;
let _e;
const En = Symbol(""), n1 = Symbol("");
class D1 {
  constructor(t, n = null, r) {
    this.fn = t, this.scheduler = n, this.active = !0, this.deps = [], this.parent = void 0, Yh(this, r);
  }
  run() {
    if (!this.active)
      return this.fn();
    let t = _e, n = hn;
    for (; t; ) {
      if (t === this)
        return;
      t = t.parent;
    }
    try {
      return this.parent = _e, _e = this, hn = !0, pn = 1 << ++Er, Er <= e1 ? Kh(this) : ka(this), this.fn();
    } finally {
      Er <= e1 && Qh(this), pn = 1 << --Er, _e = this.parent, hn = n, this.parent = void 0, this.deferStop && this.stop();
    }
  }
  stop() {
    _e === this ? this.deferStop = !0 : this.active && (ka(this), this.onStop && this.onStop(), this.active = !1);
  }
}
function ka(e) {
  const { deps: t } = e;
  if (t.length) {
    for (let n = 0; n < t.length; n++)
      t[n].delete(e);
    t.length = 0;
  }
}
let hn = !0;
const C0 = [];
function ir() {
  C0.push(hn), hn = !1;
}
function or() {
  const e = C0.pop();
  hn = e === void 0 ? !0 : e;
}
function pe(e, t, n) {
  if (hn && _e) {
    let r = t1.get(e);
    r || t1.set(e, r = /* @__PURE__ */ new Map());
    let s = r.get(n);
    s || r.set(n, s = z1()), _0(s);
  }
}
function _0(e, t) {
  let n = !1;
  Er <= e1 ? w0(e) || (e.n |= pn, n = !b0(e)) : n = !e.has(_e), n && (e.add(_e), _e.deps.push(e));
}
function Qe(e, t, n, r, s, i) {
  const o = t1.get(e);
  if (!o)
    return;
  let a = [];
  if (t === "clear")
    a = [...o.values()];
  else if (n === "length" && nt(e)) {
    const l = y0(r);
    o.forEach((c, u) => {
      (u === "length" || u >= l) && a.push(c);
    });
  } else
    switch (n !== void 0 && a.push(o.get(n)), t) {
      case "add":
        nt(e) ? F1(n) && a.push(o.get("length")) : (a.push(o.get(En)), qn(e) && a.push(o.get(n1)));
        break;
      case "delete":
        nt(e) || (a.push(o.get(En)), qn(e) && a.push(o.get(n1)));
        break;
      case "set":
        qn(e) && a.push(o.get(En));
        break;
    }
  if (a.length === 1)
    a[0] && r1(a[0]);
  else {
    const l = [];
    for (const c of a)
      c && l.push(...c);
    r1(z1(l));
  }
}
function r1(e, t) {
  const n = nt(e) ? e : [...e];
  for (const r of n)
    r.computed && Ea(r);
  for (const r of n)
    r.computed || Ea(r);
}
function Ea(e, t) {
  (e !== _e || e.allowRecurse) && (e.scheduler ? e.scheduler() : e.run());
}
const Xh = /* @__PURE__ */ O1("__proto__,__v_isRef,__isVue"), k0 = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(M1)
), Jh = /* @__PURE__ */ B1(), tu = /* @__PURE__ */ B1(!1, !0), eu = /* @__PURE__ */ B1(!0), Ta = /* @__PURE__ */ nu();
function nu() {
  const e = {};
  return ["includes", "indexOf", "lastIndexOf"].forEach((t) => {
    e[t] = function(...n) {
      const r = vt(this);
      for (let i = 0, o = this.length; i < o; i++)
        pe(r, "get", i + "");
      const s = r[t](...n);
      return s === -1 || s === !1 ? r[t](...n.map(vt)) : s;
    };
  }), ["push", "pop", "shift", "unshift", "splice"].forEach((t) => {
    e[t] = function(...n) {
      ir();
      const r = vt(this)[t].apply(this, n);
      return or(), r;
    };
  }), e;
}
function B1(e = !1, t = !1) {
  return function(n, r, s) {
    if (r === "__v_isReactive")
      return !e;
    if (r === "__v_isReadonly")
      return e;
    if (r === "__v_isShallow")
      return t;
    if (r === "__v_raw" && s === (e ? t ? Lu : R0 : t ? S0 : A0).get(n))
      return n;
    const i = nt(n);
    if (!e && i && ut(Ta, r))
      return Reflect.get(Ta, r, s);
    const o = Reflect.get(n, r, s);
    return (M1(r) ? k0.has(r) : Xh(r)) || (e || pe(n, "get", r), t) ? o : te(o) ? i && F1(r) ? o : o.value : Pt(o) ? e ? I0(o) : Qs(o) : o;
  };
}
const ru = /* @__PURE__ */ E0(), su = /* @__PURE__ */ E0(!0);
function E0(e = !1) {
  return function(t, n, r, s) {
    let i = t[n];
    if (Dr(i) && te(i) && !te(r))
      return !1;
    if (!e && (!s1(r) && !Dr(r) && (i = vt(i), r = vt(r)), !nt(t) && te(i) && !te(r)))
      return i.value = r, !0;
    const o = nt(t) && F1(n) ? Number(n) < t.length : ut(t, n), a = Reflect.set(t, n, r, s);
    return t === vt(s) && (o ? Es(r, i) && Qe(t, "set", n, r) : Qe(t, "add", n, r)), a;
  };
}
function iu(e, t) {
  const n = ut(e, t);
  e[t];
  const r = Reflect.deleteProperty(e, t);
  return r && n && Qe(e, "delete", t, void 0), r;
}
function ou(e, t) {
  const n = Reflect.has(e, t);
  return (!M1(t) || !k0.has(t)) && pe(e, "has", t), n;
}
function au(e) {
  return pe(e, "iterate", nt(e) ? "length" : En), Reflect.ownKeys(e);
}
const T0 = {
  get: Jh,
  set: ru,
  deleteProperty: iu,
  has: ou,
  ownKeys: au
}, lu = {
  get: eu,
  set(e, t) {
    return !0;
  },
  deleteProperty(e, t) {
    return !0;
  }
}, cu = /* @__PURE__ */ re({}, T0, {
  get: tu,
  set: su
}), U1 = (e) => e, Ks = (e) => Reflect.getPrototypeOf(e);
function os(e, t, n = !1, r = !1) {
  e = e.__v_raw;
  const s = vt(e), i = vt(t);
  n || (t !== i && pe(s, "get", t), pe(s, "get", i));
  const { has: o } = Ks(s), a = r ? U1 : n ? j1 : $1;
  if (o.call(s, t))
    return a(e.get(t));
  if (o.call(s, i))
    return a(e.get(i));
  e !== s && e.get(t);
}
function as(e, t = !1) {
  const n = this.__v_raw, r = vt(n), s = vt(e);
  return t || (e !== s && pe(r, "has", e), pe(r, "has", s)), e === s ? n.has(e) : n.has(e) || n.has(s);
}
function ls(e, t = !1) {
  return e = e.__v_raw, !t && pe(vt(e), "iterate", En), Reflect.get(e, "size", e);
}
function Aa(e) {
  e = vt(e);
  const t = vt(this);
  return Ks(t).has.call(t, e) || (t.add(e), Qe(t, "add", e, e)), this;
}
function Sa(e, t) {
  t = vt(t);
  const n = vt(this), { has: r, get: s } = Ks(n);
  let i = r.call(n, e);
  i || (e = vt(e), i = r.call(n, e));
  const o = s.call(n, e);
  return n.set(e, t), i ? Es(t, o) && Qe(n, "set", e, t) : Qe(n, "add", e, t), this;
}
function Ra(e) {
  const t = vt(this), { has: n, get: r } = Ks(t);
  let s = n.call(t, e);
  s || (e = vt(e), s = n.call(t, e)), r && r.call(t, e);
  const i = t.delete(e);
  return s && Qe(t, "delete", e, void 0), i;
}
function Ia() {
  const e = vt(this), t = e.size !== 0, n = e.clear();
  return t && Qe(e, "clear", void 0, void 0), n;
}
function cs(e, t) {
  return function(n, r) {
    const s = this, i = s.__v_raw, o = vt(i), a = t ? U1 : e ? j1 : $1;
    return !e && pe(o, "iterate", En), i.forEach((l, c) => n.call(r, a(l), a(c), s));
  };
}
function hs(e, t, n) {
  return function(...r) {
    const s = this.__v_raw, i = vt(s), o = qn(i), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, c = s[e](...r), u = n ? U1 : t ? j1 : $1;
    return !t && pe(i, "iterate", l ? n1 : En), {
      next() {
        const { value: d, done: f } = c.next();
        return f ? { value: d, done: f } : {
          value: a ? [u(d[0]), u(d[1])] : u(d),
          done: f
        };
      },
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function on(e) {
  return function(...t) {
    return e === "delete" ? !1 : this;
  };
}
function hu() {
  const e = {
    get(s) {
      return os(this, s);
    },
    get size() {
      return ls(this);
    },
    has: as,
    add: Aa,
    set: Sa,
    delete: Ra,
    clear: Ia,
    forEach: cs(!1, !1)
  }, t = {
    get(s) {
      return os(this, s, !1, !0);
    },
    get size() {
      return ls(this);
    },
    has: as,
    add: Aa,
    set: Sa,
    delete: Ra,
    clear: Ia,
    forEach: cs(!1, !0)
  }, n = {
    get(s) {
      return os(this, s, !0);
    },
    get size() {
      return ls(this, !0);
    },
    has(s) {
      return as.call(this, s, !0);
    },
    add: on("add"),
    set: on("set"),
    delete: on("delete"),
    clear: on("clear"),
    forEach: cs(!0, !1)
  }, r = {
    get(s) {
      return os(this, s, !0, !0);
    },
    get size() {
      return ls(this, !0);
    },
    has(s) {
      return as.call(this, s, !0);
    },
    add: on("add"),
    set: on("set"),
    delete: on("delete"),
    clear: on("clear"),
    forEach: cs(!0, !0)
  };
  return ["keys", "values", "entries", Symbol.iterator].forEach((s) => {
    e[s] = hs(s, !1, !1), n[s] = hs(s, !0, !1), t[s] = hs(s, !1, !0), r[s] = hs(s, !0, !0);
  }), [
    e,
    n,
    t,
    r
  ];
}
const [uu, du, pu, fu] = /* @__PURE__ */ hu();
function H1(e, t) {
  const n = t ? e ? fu : pu : e ? du : uu;
  return (r, s, i) => s === "__v_isReactive" ? !e : s === "__v_isReadonly" ? e : s === "__v_raw" ? r : Reflect.get(ut(n, s) && s in r ? n : r, s, i);
}
const gu = {
  get: /* @__PURE__ */ H1(!1, !1)
}, mu = {
  get: /* @__PURE__ */ H1(!1, !0)
}, xu = {
  get: /* @__PURE__ */ H1(!0, !1)
}, A0 = /* @__PURE__ */ new WeakMap(), S0 = /* @__PURE__ */ new WeakMap(), R0 = /* @__PURE__ */ new WeakMap(), Lu = /* @__PURE__ */ new WeakMap();
function yu(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function vu(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : yu(jh(e));
}
function Qs(e) {
  return Dr(e) ? e : G1(e, !1, T0, gu, A0);
}
function bu(e) {
  return G1(e, !1, cu, mu, S0);
}
function I0(e) {
  return G1(e, !0, lu, xu, R0);
}
function G1(e, t, n, r, s) {
  if (!Pt(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const i = s.get(e);
  if (i)
    return i;
  const o = vu(e);
  if (o === 0)
    return e;
  const a = new Proxy(e, o === 2 ? r : n);
  return s.set(e, a), a;
}
function Zn(e) {
  return Dr(e) ? Zn(e.__v_raw) : !!(e && e.__v_isReactive);
}
function Dr(e) {
  return !!(e && e.__v_isReadonly);
}
function s1(e) {
  return !!(e && e.__v_isShallow);
}
function O0(e) {
  return Zn(e) || Dr(e);
}
function vt(e) {
  const t = e && e.__v_raw;
  return t ? vt(t) : e;
}
function N0(e) {
  return Ts(e, "__v_skip", !0), e;
}
const $1 = (e) => Pt(e) ? Qs(e) : e, j1 = (e) => Pt(e) ? I0(e) : e;
function wu(e) {
  hn && _e && (e = vt(e), _0(e.dep || (e.dep = z1())));
}
function Cu(e, t) {
  e = vt(e), e.dep && r1(e.dep);
}
function te(e) {
  return !!(e && e.__v_isRef === !0);
}
function _u(e) {
  return te(e) ? e.value : e;
}
const ku = {
  get: (e, t, n) => _u(Reflect.get(e, t, n)),
  set: (e, t, n, r) => {
    const s = e[t];
    return te(s) && !te(n) ? (s.value = n, !0) : Reflect.set(e, t, n, r);
  }
};
function P0(e) {
  return Zn(e) ? e : new Proxy(e, ku);
}
var M0;
class Eu {
  constructor(t, n, r, s) {
    this._setter = n, this.dep = void 0, this.__v_isRef = !0, this[M0] = !1, this._dirty = !0, this.effect = new D1(t, () => {
      this._dirty || (this._dirty = !0, Cu(this));
    }), this.effect.computed = this, this.effect.active = this._cacheable = !s, this.__v_isReadonly = r;
  }
  get value() {
    const t = vt(this);
    return wu(t), (t._dirty || !t._cacheable) && (t._dirty = !1, t._value = t.effect.run()), t._value;
  }
  set value(t) {
    this._setter(t);
  }
}
M0 = "__v_isReadonly";
function Tu(e, t, n = !1) {
  let r, s;
  const i = st(e);
  return i ? (r = e, s = Be) : (r = e.get, s = e.set), new Eu(r, s, i || !s, n);
}
function un(e, t, n, r) {
  let s;
  try {
    s = r ? e(...r) : e();
  } catch (i) {
    Xs(i, t, n);
  }
  return s;
}
function Ee(e, t, n, r) {
  if (st(e)) {
    const i = un(e, t, n, r);
    return i && m0(i) && i.catch((o) => {
      Xs(o, t, n);
    }), i;
  }
  const s = [];
  for (let i = 0; i < e.length; i++)
    s.push(Ee(e[i], t, n, r));
  return s;
}
function Xs(e, t, n, r = !0) {
  const s = t ? t.vnode : null;
  if (t) {
    let i = t.parent;
    const o = t.proxy, a = n;
    for (; i; ) {
      const c = i.ec;
      if (c) {
        for (let u = 0; u < c.length; u++)
          if (c[u](e, o, a) === !1)
            return;
      }
      i = i.parent;
    }
    const l = t.appContext.config.errorHandler;
    if (l) {
      un(l, null, 10, [e, o, a]);
      return;
    }
  }
  Au(e, n, s, r);
}
function Au(e, t, n, r = !0) {
  console.error(e);
}
let Br = !1, i1 = !1;
const Wt = [];
let Fe = 0;
const Wn = [];
let Ze = null, wn = 0;
const F0 = /* @__PURE__ */ Promise.resolve();
let V1 = null;
function Su(e) {
  const t = V1 || F0;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Ru(e) {
  let t = Fe + 1, n = Wt.length;
  for (; t < n; ) {
    const r = t + n >>> 1;
    Ur(Wt[r]) < e ? t = r + 1 : n = r;
  }
  return t;
}
function q1(e) {
  (!Wt.length || !Wt.includes(e, Br && e.allowRecurse ? Fe + 1 : Fe)) && (e.id == null ? Wt.push(e) : Wt.splice(Ru(e.id), 0, e), z0());
}
function z0() {
  !Br && !i1 && (i1 = !0, V1 = F0.then(B0));
}
function Iu(e) {
  const t = Wt.indexOf(e);
  t > Fe && Wt.splice(t, 1);
}
function Ou(e) {
  nt(e) ? Wn.push(...e) : (!Ze || !Ze.includes(e, e.allowRecurse ? wn + 1 : wn)) && Wn.push(e), z0();
}
function Oa(e, t = Br ? Fe + 1 : 0) {
  for (; t < Wt.length; t++) {
    const n = Wt[t];
    n && n.pre && (Wt.splice(t, 1), t--, n());
  }
}
function D0(e) {
  if (Wn.length) {
    const t = [...new Set(Wn)];
    if (Wn.length = 0, Ze) {
      Ze.push(...t);
      return;
    }
    for (Ze = t, Ze.sort((n, r) => Ur(n) - Ur(r)), wn = 0; wn < Ze.length; wn++)
      Ze[wn]();
    Ze = null, wn = 0;
  }
}
const Ur = (e) => e.id == null ? 1 / 0 : e.id, Nu = (e, t) => {
  const n = Ur(e) - Ur(t);
  if (n === 0) {
    if (e.pre && !t.pre)
      return -1;
    if (t.pre && !e.pre)
      return 1;
  }
  return n;
};
function B0(e) {
  i1 = !1, Br = !0, Wt.sort(Nu);
  try {
    for (Fe = 0; Fe < Wt.length; Fe++) {
      const t = Wt[Fe];
      t && t.active !== !1 && un(t, null, 14);
    }
  } finally {
    Fe = 0, Wt.length = 0, D0(), Br = !1, V1 = null, (Wt.length || Wn.length) && B0();
  }
}
function Pu(e, t, ...n) {
  if (e.isUnmounted)
    return;
  const r = e.vnode.props || Et;
  let s = n;
  const i = t.startsWith("update:"), o = i && t.slice(7);
  if (o && o in r) {
    const u = `${o === "modelValue" ? "model" : o}Modifiers`, { number: d, trim: f } = r[u] || Et;
    f && (s = n.map((m) => Ft(m) ? m.trim() : m)), d && (s = n.map(y0));
  }
  let a, l = r[a = Pi(t)] || r[a = Pi(He(t))];
  !l && i && (l = r[a = Pi(sr(t))]), l && Ee(l, e, 6, s);
  const c = r[a + "Once"];
  if (c) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, Ee(c, e, 6, s);
  }
}
function U0(e, t, n = !1) {
  const r = t.emitsCache, s = r.get(e);
  if (s !== void 0)
    return s;
  const i = e.emits;
  let o = {}, a = !1;
  if (!st(e)) {
    const l = (c) => {
      const u = U0(c, t, !0);
      u && (a = !0, re(o, u));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !i && !a ? (Pt(e) && r.set(e, null), null) : (nt(i) ? i.forEach((l) => o[l] = null) : re(o, i), Pt(e) && r.set(e, o), o);
}
function Js(e, t) {
  return !e || !qs(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), ut(e, t[0].toLowerCase() + t.slice(1)) || ut(e, sr(t)) || ut(e, t));
}
let Yt = null, ti = null;
function As(e) {
  const t = Yt;
  return Yt = e, ti = e && e.type.__scopeId || null, t;
}
function $e(e) {
  ti = e;
}
function je() {
  ti = null;
}
function Mu(e, t = Yt, n) {
  if (!t || e._n)
    return e;
  const r = (...s) => {
    r._d && Ha(-1);
    const i = As(t);
    let o;
    try {
      o = e(...s);
    } finally {
      As(i), r._d && Ha(1);
    }
    return o;
  };
  return r._n = !0, r._c = !0, r._d = !0, r;
}
function Fi(e) {
  const { type: t, vnode: n, proxy: r, withProxy: s, props: i, propsOptions: [o], slots: a, attrs: l, emit: c, render: u, renderCache: d, data: f, setupState: m, ctx: I, inheritAttrs: M } = e;
  let tt, G;
  const J = As(e);
  try {
    if (n.shapeFlag & 4) {
      const Q = s || r;
      tt = Me(u.call(Q, Q, d, i, m, f, I)), G = l;
    } else {
      const Q = t;
      tt = Me(Q.length > 1 ? Q(i, { attrs: l, slots: a, emit: c }) : Q(i, null)), G = t.props ? l : Fu(l);
    }
  } catch (Q) {
    Rr.length = 0, Xs(Q, e, 1), tt = at(fn);
  }
  let q = tt;
  if (G && M !== !1) {
    const Q = Object.keys(G), { shapeFlag: Rt } = q;
    Q.length && Rt & 7 && (o && Q.some(N1) && (G = zu(G, o)), q = Qn(q, G));
  }
  return n.dirs && (q = Qn(q), q.dirs = q.dirs ? q.dirs.concat(n.dirs) : n.dirs), n.transition && (q.transition = n.transition), tt = q, As(J), tt;
}
const Fu = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || qs(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, zu = (e, t) => {
  const n = {};
  for (const r in e)
    (!N1(r) || !(r.slice(9) in t)) && (n[r] = e[r]);
  return n;
};
function Du(e, t, n) {
  const { props: r, children: s, component: i } = e, { props: o, children: a, patchFlag: l } = t, c = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return r ? Na(r, o, c) : !!o;
    if (l & 8) {
      const u = t.dynamicProps;
      for (let d = 0; d < u.length; d++) {
        const f = u[d];
        if (o[f] !== r[f] && !Js(c, f))
          return !0;
      }
    }
  } else
    return (s || a) && (!a || !a.$stable) ? !0 : r === o ? !1 : r ? o ? Na(r, o, c) : !0 : !!o;
  return !1;
}
function Na(e, t, n) {
  const r = Object.keys(t);
  if (r.length !== Object.keys(e).length)
    return !0;
  for (let s = 0; s < r.length; s++) {
    const i = r[s];
    if (t[i] !== e[i] && !Js(n, i))
      return !0;
  }
  return !1;
}
function Bu({ vnode: e, parent: t }, n) {
  for (; t && t.subTree === e; )
    (e = t.vnode).el = n, t = t.parent;
}
const Uu = (e) => e.__isSuspense;
function Hu(e, t) {
  t && t.pendingBranch ? nt(e) ? t.effects.push(...e) : t.effects.push(e) : Ou(e);
}
function Gu(e, t) {
  if (Vt) {
    let n = Vt.provides;
    const r = Vt.parent && Vt.parent.provides;
    r === n && (n = Vt.provides = Object.create(r)), n[e] = t;
  }
}
function vs(e, t, n = !1) {
  const r = Vt || Yt;
  if (r) {
    const s = r.parent == null ? r.vnode.appContext && r.vnode.appContext.provides : r.parent.provides;
    if (s && e in s)
      return s[e];
    if (arguments.length > 1)
      return n && st(t) ? t.call(r.proxy) : t;
  }
}
const us = {};
function Tr(e, t, n) {
  return H0(e, t, n);
}
function H0(e, t, { immediate: n, deep: r, flush: s, onTrack: i, onTrigger: o } = Et) {
  const a = Vt;
  let l, c = !1, u = !1;
  if (te(e) ? (l = () => e.value, c = s1(e)) : Zn(e) ? (l = () => e, r = !0) : nt(e) ? (u = !0, c = e.some((q) => Zn(q) || s1(q)), l = () => e.map((q) => {
    if (te(q))
      return q.value;
    if (Zn(q))
      return kn(q);
    if (st(q))
      return un(q, a, 2);
  })) : st(e) ? t ? l = () => un(e, a, 2) : l = () => {
    if (!(a && a.isUnmounted))
      return d && d(), Ee(e, a, 3, [f]);
  } : l = Be, t && r) {
    const q = l;
    l = () => kn(q());
  }
  let d, f = (q) => {
    d = G.onStop = () => {
      un(q, a, 4);
    };
  }, m;
  if (Gr)
    if (f = Be, t ? n && Ee(t, a, 3, [
      l(),
      u ? [] : void 0,
      f
    ]) : l(), s === "sync") {
      const q = M3();
      m = q.__watcherHandles || (q.__watcherHandles = []);
    } else
      return Be;
  let I = u ? new Array(e.length).fill(us) : us;
  const M = () => {
    if (G.active)
      if (t) {
        const q = G.run();
        (r || c || (u ? q.some((Q, Rt) => Es(Q, I[Rt])) : Es(q, I))) && (d && d(), Ee(t, a, 3, [
          q,
          I === us ? void 0 : u && I[0] === us ? [] : I,
          f
        ]), I = q);
      } else
        G.run();
  };
  M.allowRecurse = !!t;
  let tt;
  s === "sync" ? tt = M : s === "post" ? tt = () => oe(M, a && a.suspense) : (M.pre = !0, a && (M.id = a.uid), tt = () => q1(M));
  const G = new D1(l, tt);
  t ? n ? M() : I = G.run() : s === "post" ? oe(G.run.bind(G), a && a.suspense) : G.run();
  const J = () => {
    G.stop(), a && a.scope && P1(a.scope.effects, G);
  };
  return m && m.push(J), J;
}
function $u(e, t, n) {
  const r = this.proxy, s = Ft(e) ? e.includes(".") ? G0(r, e) : () => r[e] : e.bind(r, r);
  let i;
  st(t) ? i = t : (i = t.handler, n = t);
  const o = Vt;
  Xn(this);
  const a = H0(s, i.bind(r), n);
  return o ? Xn(o) : Tn(), a;
}
function G0(e, t) {
  const n = t.split(".");
  return () => {
    let r = e;
    for (let s = 0; s < n.length && r; s++)
      r = r[n[s]];
    return r;
  };
}
function kn(e, t) {
  if (!Pt(e) || e.__v_skip || (t = t || /* @__PURE__ */ new Set(), t.has(e)))
    return e;
  if (t.add(e), te(e))
    kn(e.value, t);
  else if (nt(e))
    for (let n = 0; n < e.length; n++)
      kn(e[n], t);
  else if (g0(e) || qn(e))
    e.forEach((n) => {
      kn(n, t);
    });
  else if (L0(e))
    for (const n in e)
      kn(e[n], t);
  return e;
}
const Ar = (e) => !!e.type.__asyncLoader, $0 = (e) => e.type.__isKeepAlive;
function ju(e, t) {
  j0(e, "a", t);
}
function Vu(e, t) {
  j0(e, "da", t);
}
function j0(e, t, n = Vt) {
  const r = e.__wdc || (e.__wdc = () => {
    let s = n;
    for (; s; ) {
      if (s.isDeactivated)
        return;
      s = s.parent;
    }
    return e();
  });
  if (ei(t, r, n), n) {
    let s = n.parent;
    for (; s && s.parent; )
      $0(s.parent.vnode) && qu(r, t, n, s), s = s.parent;
  }
}
function qu(e, t, n, r) {
  const s = ei(t, e, r, !0);
  V0(() => {
    P1(r[t], s);
  }, n);
}
function ei(e, t, n = Vt, r = !1) {
  if (n) {
    const s = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...o) => {
      if (n.isUnmounted)
        return;
      ir(), Xn(n);
      const a = Ee(t, n, e, o);
      return Tn(), or(), a;
    });
    return r ? s.unshift(i) : s.push(i), i;
  }
}
const en = (e) => (t, n = Vt) => (!Gr || e === "sp") && ei(e, (...r) => t(...r), n), Zu = en("bm"), Wu = en("m"), Yu = en("bu"), Ku = en("u"), Qu = en("bum"), V0 = en("um"), Xu = en("sp"), Ju = en("rtg"), t3 = en("rtc");
function e3(e, t = Vt) {
  ei("ec", e, t);
}
function n3(e, t) {
  const n = Yt;
  if (n === null)
    return e;
  const r = si(n) || n.proxy, s = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [o, a, l, c = Et] = t[i];
    o && (st(o) && (o = {
      mounted: o,
      updated: o
    }), o.deep && kn(a), s.push({
      dir: o,
      instance: r,
      value: a,
      oldValue: void 0,
      arg: l,
      modifiers: c
    }));
  }
  return e;
}
function Ln(e, t, n, r) {
  const s = e.dirs, i = t && t.dirs;
  for (let o = 0; o < s.length; o++) {
    const a = s[o];
    i && (a.oldValue = i[o].value);
    let l = a.dir[r];
    l && (ir(), Ee(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), or());
  }
}
const Z1 = "components";
function ot(e, t) {
  return Z0(Z1, e, !0, t) || e;
}
const q0 = Symbol();
function W1(e) {
  return Ft(e) ? Z0(Z1, e, !1) || e : e || q0;
}
function Z0(e, t, n = !0, r = !1) {
  const s = Yt || Vt;
  if (s) {
    const i = s.type;
    if (e === Z1) {
      const a = O3(i, !1);
      if (a && (a === t || a === He(t) || a === Ys(He(t))))
        return i;
    }
    const o = Pa(s[e] || i[e], t) || Pa(s.appContext[e], t);
    return !o && r ? i : o;
  }
}
function Pa(e, t) {
  return e && (e[t] || e[He(t)] || e[Ys(He(t))]);
}
function Sn(e, t, n, r) {
  let s;
  const i = n && n[r];
  if (nt(e) || Ft(e)) {
    s = new Array(e.length);
    for (let o = 0, a = e.length; o < a; o++)
      s[o] = t(e[o], o, void 0, i && i[o]);
  } else if (typeof e == "number") {
    s = new Array(e);
    for (let o = 0; o < e; o++)
      s[o] = t(o + 1, o, void 0, i && i[o]);
  } else if (Pt(e))
    if (e[Symbol.iterator])
      s = Array.from(e, (o, a) => t(o, a, void 0, i && i[a]));
    else {
      const o = Object.keys(e);
      s = new Array(o.length);
      for (let a = 0, l = o.length; a < l; a++) {
        const c = o[a];
        s[a] = t(e[c], c, a, i && i[a]);
      }
    }
  else
    s = [];
  return n && (n[r] = s), s;
}
function r3(e, t, n = {}, r, s) {
  if (Yt.isCE || Yt.parent && Ar(Yt.parent) && Yt.parent.isCE)
    return t !== "default" && (n.name = t), at("slot", n, r && r());
  let i = e[t];
  i && i._c && (i._d = !1), R();
  const o = i && W0(i(n)), a = wt(zt, {
    key: n.key || o && o.key || `_${t}`
  }, o || (r ? r() : []), o && e._ === 1 ? 64 : -2);
  return !s && a.scopeId && (a.slotScopeIds = [a.scopeId + "-s"]), i && i._c && (i._d = !0), a;
}
function W0(e) {
  return e.some((t) => sc(t) ? !(t.type === fn || t.type === zt && !W0(t.children)) : !0) ? e : null;
}
const o1 = (e) => e ? ac(e) ? si(e) || e.proxy : o1(e.parent) : null, Sr = /* @__PURE__ */ re(/* @__PURE__ */ Object.create(null), {
  $: (e) => e,
  $el: (e) => e.vnode.el,
  $data: (e) => e.data,
  $props: (e) => e.props,
  $attrs: (e) => e.attrs,
  $slots: (e) => e.slots,
  $refs: (e) => e.refs,
  $parent: (e) => o1(e.parent),
  $root: (e) => o1(e.root),
  $emit: (e) => e.emit,
  $options: (e) => Y1(e),
  $forceUpdate: (e) => e.f || (e.f = () => q1(e.update)),
  $nextTick: (e) => e.n || (e.n = Su.bind(e.proxy)),
  $watch: (e) => $u.bind(e)
}), zi = (e, t) => e !== Et && !e.__isScriptSetup && ut(e, t), s3 = {
  get({ _: e }, t) {
    const { ctx: n, setupState: r, data: s, props: i, accessCache: o, type: a, appContext: l } = e;
    let c;
    if (t[0] !== "$") {
      const m = o[t];
      if (m !== void 0)
        switch (m) {
          case 1:
            return r[t];
          case 2:
            return s[t];
          case 4:
            return n[t];
          case 3:
            return i[t];
        }
      else {
        if (zi(r, t))
          return o[t] = 1, r[t];
        if (s !== Et && ut(s, t))
          return o[t] = 2, s[t];
        if ((c = e.propsOptions[0]) && ut(c, t))
          return o[t] = 3, i[t];
        if (n !== Et && ut(n, t))
          return o[t] = 4, n[t];
        a1 && (o[t] = 0);
      }
    }
    const u = Sr[t];
    let d, f;
    if (u)
      return t === "$attrs" && pe(e, "get", t), u(e);
    if ((d = a.__cssModules) && (d = d[t]))
      return d;
    if (n !== Et && ut(n, t))
      return o[t] = 4, n[t];
    if (f = l.config.globalProperties, ut(f, t))
      return f[t];
  },
  set({ _: e }, t, n) {
    const { data: r, setupState: s, ctx: i } = e;
    return zi(s, t) ? (s[t] = n, !0) : r !== Et && ut(r, t) ? (r[t] = n, !0) : ut(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({ _: { data: e, setupState: t, accessCache: n, ctx: r, appContext: s, propsOptions: i } }, o) {
    let a;
    return !!n[o] || e !== Et && ut(e, o) || zi(t, o) || (a = i[0]) && ut(a, o) || ut(r, o) || ut(Sr, o) || ut(s.config.globalProperties, o);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : ut(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
let a1 = !0;
function i3(e) {
  const t = Y1(e), n = e.proxy, r = e.ctx;
  a1 = !1, t.beforeCreate && Ma(t.beforeCreate, e, "bc");
  const {
    data: s,
    computed: i,
    methods: o,
    watch: a,
    provide: l,
    inject: c,
    created: u,
    beforeMount: d,
    mounted: f,
    beforeUpdate: m,
    updated: I,
    activated: M,
    deactivated: tt,
    beforeDestroy: G,
    beforeUnmount: J,
    destroyed: q,
    unmounted: Q,
    render: Rt,
    renderTracked: Dt,
    renderTriggered: we,
    errorCaptured: Gt,
    serverPrefetch: rn,
    expose: qe,
    inheritAttrs: xn,
    components: Mn,
    directives: Fn,
    filters: mr
  } = t;
  if (c && o3(c, r, null, e.appContext.config.unwrapInjectedRef), o)
    for (const _t in o) {
      const yt = o[_t];
      st(yt) && (r[_t] = yt.bind(n));
    }
  if (s) {
    const _t = s.call(n, n);
    Pt(_t) && (e.data = Qs(_t));
  }
  if (a1 = !0, i)
    for (const _t in i) {
      const yt = i[_t], Ce = st(yt) ? yt.bind(n, n) : st(yt.get) ? yt.get.bind(n, n) : Be, xr = !st(yt) && st(yt.set) ? yt.set.bind(n) : Be, Se = cc({
        get: Ce,
        set: xr
      });
      Object.defineProperty(r, _t, {
        enumerable: !0,
        configurable: !0,
        get: () => Se.value,
        set: (sn) => Se.value = sn
      });
    }
  if (a)
    for (const _t in a)
      Y0(a[_t], r, n, _t);
  if (l) {
    const _t = st(l) ? l.call(n) : l;
    Reflect.ownKeys(_t).forEach((yt) => {
      Gu(yt, _t[yt]);
    });
  }
  u && Ma(u, e, "c");
  function Tt(_t, yt) {
    nt(yt) ? yt.forEach((Ce) => _t(Ce.bind(n))) : yt && _t(yt.bind(n));
  }
  if (Tt(Zu, d), Tt(Wu, f), Tt(Yu, m), Tt(Ku, I), Tt(ju, M), Tt(Vu, tt), Tt(e3, Gt), Tt(t3, Dt), Tt(Ju, we), Tt(Qu, J), Tt(V0, Q), Tt(Xu, rn), nt(qe))
    if (qe.length) {
      const _t = e.exposed || (e.exposed = {});
      qe.forEach((yt) => {
        Object.defineProperty(_t, yt, {
          get: () => n[yt],
          set: (Ce) => n[yt] = Ce
        });
      });
    } else
      e.exposed || (e.exposed = {});
  Rt && e.render === Be && (e.render = Rt), xn != null && (e.inheritAttrs = xn), Mn && (e.components = Mn), Fn && (e.directives = Fn);
}
function o3(e, t, n = Be, r = !1) {
  nt(e) && (e = l1(e));
  for (const s in e) {
    const i = e[s];
    let o;
    Pt(i) ? "default" in i ? o = vs(i.from || s, i.default, !0) : o = vs(i.from || s) : o = vs(i), te(o) && r ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => o.value,
      set: (a) => o.value = a
    }) : t[s] = o;
  }
}
function Ma(e, t, n) {
  Ee(nt(e) ? e.map((r) => r.bind(t.proxy)) : e.bind(t.proxy), t, n);
}
function Y0(e, t, n, r) {
  const s = r.includes(".") ? G0(n, r) : () => n[r];
  if (Ft(e)) {
    const i = t[e];
    st(i) && Tr(s, i);
  } else if (st(e))
    Tr(s, e.bind(n));
  else if (Pt(e))
    if (nt(e))
      e.forEach((i) => Y0(i, t, n, r));
    else {
      const i = st(e.handler) ? e.handler.bind(n) : t[e.handler];
      st(i) && Tr(s, i, e);
    }
}
function Y1(e) {
  const t = e.type, { mixins: n, extends: r } = t, { mixins: s, optionsCache: i, config: { optionMergeStrategies: o } } = e.appContext, a = i.get(t);
  let l;
  return a ? l = a : !s.length && !n && !r ? l = t : (l = {}, s.length && s.forEach((c) => Ss(l, c, o, !0)), Ss(l, t, o)), Pt(t) && i.set(t, l), l;
}
function Ss(e, t, n, r = !1) {
  const { mixins: s, extends: i } = t;
  i && Ss(e, i, n, !0), s && s.forEach((o) => Ss(e, o, n, !0));
  for (const o in t)
    if (!(r && o === "expose")) {
      const a = a3[o] || n && n[o];
      e[o] = a ? a(e[o], t[o]) : t[o];
    }
  return e;
}
const a3 = {
  data: Fa,
  props: vn,
  emits: vn,
  methods: vn,
  computed: vn,
  beforeCreate: Qt,
  created: Qt,
  beforeMount: Qt,
  mounted: Qt,
  beforeUpdate: Qt,
  updated: Qt,
  beforeDestroy: Qt,
  beforeUnmount: Qt,
  destroyed: Qt,
  unmounted: Qt,
  activated: Qt,
  deactivated: Qt,
  errorCaptured: Qt,
  serverPrefetch: Qt,
  components: vn,
  directives: vn,
  watch: c3,
  provide: Fa,
  inject: l3
};
function Fa(e, t) {
  return t ? e ? function() {
    return re(st(e) ? e.call(this, this) : e, st(t) ? t.call(this, this) : t);
  } : t : e;
}
function l3(e, t) {
  return vn(l1(e), l1(t));
}
function l1(e) {
  if (nt(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function Qt(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function vn(e, t) {
  return e ? re(re(/* @__PURE__ */ Object.create(null), e), t) : t;
}
function c3(e, t) {
  if (!e)
    return t;
  if (!t)
    return e;
  const n = re(/* @__PURE__ */ Object.create(null), e);
  for (const r in t)
    n[r] = Qt(e[r], t[r]);
  return n;
}
function h3(e, t, n, r = !1) {
  const s = {}, i = {};
  Ts(i, ri, 1), e.propsDefaults = /* @__PURE__ */ Object.create(null), K0(e, t, s, i);
  for (const o in e.propsOptions[0])
    o in s || (s[o] = void 0);
  n ? e.props = r ? s : bu(s) : e.type.props ? e.props = s : e.props = i, e.attrs = i;
}
function u3(e, t, n, r) {
  const { props: s, attrs: i, vnode: { patchFlag: o } } = e, a = vt(s), [l] = e.propsOptions;
  let c = !1;
  if ((r || o > 0) && !(o & 16)) {
    if (o & 8) {
      const u = e.vnode.dynamicProps;
      for (let d = 0; d < u.length; d++) {
        let f = u[d];
        if (Js(e.emitsOptions, f))
          continue;
        const m = t[f];
        if (l)
          if (ut(i, f))
            m !== i[f] && (i[f] = m, c = !0);
          else {
            const I = He(f);
            s[I] = c1(l, a, I, m, e, !1);
          }
        else
          m !== i[f] && (i[f] = m, c = !0);
      }
    }
  } else {
    K0(e, t, s, i) && (c = !0);
    let u;
    for (const d in a)
      (!t || !ut(t, d) && ((u = sr(d)) === d || !ut(t, u))) && (l ? n && (n[d] !== void 0 || n[u] !== void 0) && (s[d] = c1(l, a, d, void 0, e, !0)) : delete s[d]);
    if (i !== a)
      for (const d in i)
        (!t || !ut(t, d)) && (delete i[d], c = !0);
  }
  c && Qe(e, "set", "$attrs");
}
function K0(e, t, n, r) {
  const [s, i] = e.propsOptions;
  let o = !1, a;
  if (t)
    for (let l in t) {
      if (ys(l))
        continue;
      const c = t[l];
      let u;
      s && ut(s, u = He(l)) ? !i || !i.includes(u) ? n[u] = c : (a || (a = {}))[u] = c : Js(e.emitsOptions, l) || (!(l in r) || c !== r[l]) && (r[l] = c, o = !0);
    }
  if (i) {
    const l = vt(n), c = a || Et;
    for (let u = 0; u < i.length; u++) {
      const d = i[u];
      n[d] = c1(s, l, d, c[d], e, !ut(c, d));
    }
  }
  return o;
}
function c1(e, t, n, r, s, i) {
  const o = e[n];
  if (o != null) {
    const a = ut(o, "default");
    if (a && r === void 0) {
      const l = o.default;
      if (o.type !== Function && st(l)) {
        const { propsDefaults: c } = s;
        n in c ? r = c[n] : (Xn(s), r = c[n] = l.call(null, t), Tn());
      } else
        r = l;
    }
    o[0] && (i && !a ? r = !1 : o[1] && (r === "" || r === sr(n)) && (r = !0));
  }
  return r;
}
function Q0(e, t, n = !1) {
  const r = t.propsCache, s = r.get(e);
  if (s)
    return s;
  const i = e.props, o = {}, a = [];
  let l = !1;
  if (!st(e)) {
    const u = (d) => {
      l = !0;
      const [f, m] = Q0(d, t, !0);
      re(o, f), m && a.push(...m);
    };
    !n && t.mixins.length && t.mixins.forEach(u), e.extends && u(e.extends), e.mixins && e.mixins.forEach(u);
  }
  if (!i && !l)
    return Pt(e) && r.set(e, Vn), Vn;
  if (nt(i))
    for (let u = 0; u < i.length; u++) {
      const d = He(i[u]);
      za(d) && (o[d] = Et);
    }
  else if (i)
    for (const u in i) {
      const d = He(u);
      if (za(d)) {
        const f = i[u], m = o[d] = nt(f) || st(f) ? { type: f } : Object.assign({}, f);
        if (m) {
          const I = Ua(Boolean, m.type), M = Ua(String, m.type);
          m[0] = I > -1, m[1] = M < 0 || I < M, (I > -1 || ut(m, "default")) && a.push(d);
        }
      }
    }
  const c = [o, a];
  return Pt(e) && r.set(e, c), c;
}
function za(e) {
  return e[0] !== "$";
}
function Da(e) {
  const t = e && e.toString().match(/^\s*function (\w+)/);
  return t ? t[1] : e === null ? "null" : "";
}
function Ba(e, t) {
  return Da(e) === Da(t);
}
function Ua(e, t) {
  return nt(t) ? t.findIndex((n) => Ba(n, e)) : st(t) && Ba(t, e) ? 0 : -1;
}
const X0 = (e) => e[0] === "_" || e === "$stable", K1 = (e) => nt(e) ? e.map(Me) : [Me(e)], d3 = (e, t, n) => {
  if (t._n)
    return t;
  const r = Mu((...s) => K1(t(...s)), n);
  return r._c = !1, r;
}, J0 = (e, t, n) => {
  const r = e._ctx;
  for (const s in e) {
    if (X0(s))
      continue;
    const i = e[s];
    if (st(i))
      t[s] = d3(s, i, r);
    else if (i != null) {
      const o = K1(i);
      t[s] = () => o;
    }
  }
}, tc = (e, t) => {
  const n = K1(t);
  e.slots.default = () => n;
}, p3 = (e, t) => {
  if (e.vnode.shapeFlag & 32) {
    const n = t._;
    n ? (e.slots = vt(t), Ts(t, "_", n)) : J0(t, e.slots = {});
  } else
    e.slots = {}, t && tc(e, t);
  Ts(e.slots, ri, 1);
}, f3 = (e, t, n) => {
  const { vnode: r, slots: s } = e;
  let i = !0, o = Et;
  if (r.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : (re(s, t), !n && a === 1 && delete s._) : (i = !t.$stable, J0(t, s)), o = t;
  } else
    t && (tc(e, t), o = { default: 1 });
  if (i)
    for (const a in s)
      !X0(a) && !(a in o) && delete s[a];
};
function ec() {
  return {
    app: null,
    config: {
      isNativeTag: Hh,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let g3 = 0;
function m3(e, t) {
  return function(n, r = null) {
    st(n) || (n = Object.assign({}, n)), r != null && !Pt(r) && (r = null);
    const s = ec(), i = /* @__PURE__ */ new Set();
    let o = !1;
    const a = s.app = {
      _uid: g3++,
      _component: n,
      _props: r,
      _container: null,
      _context: s,
      _instance: null,
      version: F3,
      get config() {
        return s.config;
      },
      set config(l) {
      },
      use(l, ...c) {
        return i.has(l) || (l && st(l.install) ? (i.add(l), l.install(a, ...c)) : st(l) && (i.add(l), l(a, ...c))), a;
      },
      mixin(l) {
        return s.mixins.includes(l) || s.mixins.push(l), a;
      },
      component(l, c) {
        return c ? (s.components[l] = c, a) : s.components[l];
      },
      directive(l, c) {
        return c ? (s.directives[l] = c, a) : s.directives[l];
      },
      mount(l, c, u) {
        if (!o) {
          const d = at(n, r);
          return d.appContext = s, c && t ? t(d, l) : e(d, l, u), o = !0, a._container = l, l.__vue_app__ = a, si(d.component) || d.component.proxy;
        }
      },
      unmount() {
        o && (e(null, a._container), delete a._container.__vue_app__);
      },
      provide(l, c) {
        return s.provides[l] = c, a;
      }
    };
    return a;
  };
}
function h1(e, t, n, r, s = !1) {
  if (nt(e)) {
    e.forEach((f, m) => h1(f, t && (nt(t) ? t[m] : t), n, r, s));
    return;
  }
  if (Ar(r) && !s)
    return;
  const i = r.shapeFlag & 4 ? si(r.component) || r.component.proxy : r.el, o = s ? null : i, { i: a, r: l } = e, c = t && t.r, u = a.refs === Et ? a.refs = {} : a.refs, d = a.setupState;
  if (c != null && c !== l && (Ft(c) ? (u[c] = null, ut(d, c) && (d[c] = null)) : te(c) && (c.value = null)), st(l))
    un(l, a, 12, [o, u]);
  else {
    const f = Ft(l), m = te(l);
    if (f || m) {
      const I = () => {
        if (e.f) {
          const M = f ? ut(d, l) ? d[l] : u[l] : l.value;
          s ? nt(M) && P1(M, i) : nt(M) ? M.includes(i) || M.push(i) : f ? (u[l] = [i], ut(d, l) && (d[l] = u[l])) : (l.value = [i], e.k && (u[e.k] = l.value));
        } else
          f ? (u[l] = o, ut(d, l) && (d[l] = o)) : m && (l.value = o, e.k && (u[e.k] = o));
      };
      o ? (I.id = -1, oe(I, n)) : I();
    }
  }
}
const oe = Hu;
function x3(e) {
  return L3(e);
}
function L3(e, t) {
  const n = Zh();
  n.__VUE__ = !0;
  const { insert: r, remove: s, patchProp: i, createElement: o, createText: a, createComment: l, setText: c, setElementText: u, parentNode: d, nextSibling: f, setScopeId: m = Be, insertStaticContent: I } = e, M = (p, g, v, C = null, w = null, S = null, P = !1, T = null, N = !!g.dynamicChildren) => {
    if (p === g)
      return;
    p && !Lr(p, g) && (C = It(p), Re(p, w, S, !0), p = null), g.patchFlag === -2 && (N = !1, g.dynamicChildren = null);
    const { type: _, ref: E, shapeFlag: V } = g;
    switch (_) {
      case ni:
        tt(p, g, v, C);
        break;
      case fn:
        G(p, g, v, C);
        break;
      case bs:
        p == null && J(g, v, C, P);
        break;
      case zt:
        Mn(p, g, v, C, w, S, P, T, N);
        break;
      default:
        V & 1 ? Rt(p, g, v, C, w, S, P, T, N) : V & 6 ? Fn(p, g, v, C, w, S, P, T, N) : (V & 64 || V & 128) && _.process(p, g, v, C, w, S, P, T, N, qt);
    }
    E != null && w && h1(E, p && p.ref, S, g || p, !g);
  }, tt = (p, g, v, C) => {
    if (p == null)
      r(g.el = a(g.children), v, C);
    else {
      const w = g.el = p.el;
      g.children !== p.children && c(w, g.children);
    }
  }, G = (p, g, v, C) => {
    p == null ? r(g.el = l(g.children || ""), v, C) : g.el = p.el;
  }, J = (p, g, v, C) => {
    [p.el, p.anchor] = I(p.children, g, v, C, p.el, p.anchor);
  }, q = ({ el: p, anchor: g }, v, C) => {
    let w;
    for (; p && p !== g; )
      w = f(p), r(p, v, C), p = w;
    r(g, v, C);
  }, Q = ({ el: p, anchor: g }) => {
    let v;
    for (; p && p !== g; )
      v = f(p), s(p), p = v;
    s(g);
  }, Rt = (p, g, v, C, w, S, P, T, N) => {
    P = P || g.type === "svg", p == null ? Dt(g, v, C, w, S, P, T, N) : rn(p, g, w, S, P, T, N);
  }, Dt = (p, g, v, C, w, S, P, T) => {
    let N, _;
    const { type: E, props: V, shapeFlag: F, transition: H, dirs: et } = p;
    if (N = p.el = o(p.type, S, V && V.is, V), F & 8 ? u(N, p.children) : F & 16 && Gt(p.children, N, null, C, w, S && E !== "foreignObject", P, T), et && Ln(p, null, C, "created"), V) {
      for (const dt in V)
        dt !== "value" && !ys(dt) && i(N, dt, null, V[dt], S, p.children, C, w, lt);
      "value" in V && i(N, "value", null, V.value), (_ = V.onVnodeBeforeMount) && Oe(_, C, p);
    }
    we(N, p, p.scopeId, P, C), et && Ln(p, null, C, "beforeMount");
    const Lt = (!w || w && !w.pendingBranch) && H && !H.persisted;
    Lt && H.beforeEnter(N), r(N, g, v), ((_ = V && V.onVnodeMounted) || Lt || et) && oe(() => {
      _ && Oe(_, C, p), Lt && H.enter(N), et && Ln(p, null, C, "mounted");
    }, w);
  }, we = (p, g, v, C, w) => {
    if (v && m(p, v), C)
      for (let S = 0; S < C.length; S++)
        m(p, C[S]);
    if (w) {
      let S = w.subTree;
      if (g === S) {
        const P = w.vnode;
        we(p, P, P.scopeId, P.slotScopeIds, w.parent);
      }
    }
  }, Gt = (p, g, v, C, w, S, P, T, N = 0) => {
    for (let _ = N; _ < p.length; _++) {
      const E = p[_] = T ? an(p[_]) : Me(p[_]);
      M(null, E, g, v, C, w, S, P, T);
    }
  }, rn = (p, g, v, C, w, S, P) => {
    const T = g.el = p.el;
    let { patchFlag: N, dynamicChildren: _, dirs: E } = g;
    N |= p.patchFlag & 16;
    const V = p.props || Et, F = g.props || Et;
    let H;
    v && yn(v, !1), (H = F.onVnodeBeforeUpdate) && Oe(H, v, g, p), E && Ln(g, p, v, "beforeUpdate"), v && yn(v, !0);
    const et = w && g.type !== "foreignObject";
    if (_ ? qe(p.dynamicChildren, _, T, v, C, et, S) : P || Ce(p, g, T, null, v, C, et, S, !1), N > 0) {
      if (N & 16)
        xn(T, g, V, F, v, C, w);
      else if (N & 2 && V.class !== F.class && i(T, "class", null, F.class, w), N & 4 && i(T, "style", V.style, F.style, w), N & 8) {
        const Lt = g.dynamicProps;
        for (let dt = 0; dt < Lt.length; dt++) {
          const At = Lt[dt], z = V[At], Z = F[At];
          (Z !== z || At === "value") && i(T, At, z, Z, w, p.children, v, C, lt);
        }
      }
      N & 1 && p.children !== g.children && u(T, g.children);
    } else
      !P && _ == null && xn(T, g, V, F, v, C, w);
    ((H = F.onVnodeUpdated) || E) && oe(() => {
      H && Oe(H, v, g, p), E && Ln(g, p, v, "updated");
    }, C);
  }, qe = (p, g, v, C, w, S, P) => {
    for (let T = 0; T < g.length; T++) {
      const N = p[T], _ = g[T], E = N.el && (N.type === zt || !Lr(N, _) || N.shapeFlag & 70) ? d(N.el) : v;
      M(N, _, E, null, C, w, S, P, !0);
    }
  }, xn = (p, g, v, C, w, S, P) => {
    if (v !== C) {
      if (v !== Et)
        for (const T in v)
          !ys(T) && !(T in C) && i(p, T, v[T], null, P, g.children, w, S, lt);
      for (const T in C) {
        if (ys(T))
          continue;
        const N = C[T], _ = v[T];
        N !== _ && T !== "value" && i(p, T, _, N, P, g.children, w, S, lt);
      }
      "value" in C && i(p, "value", v.value, C.value);
    }
  }, Mn = (p, g, v, C, w, S, P, T, N) => {
    const _ = g.el = p ? p.el : a(""), E = g.anchor = p ? p.anchor : a("");
    let { patchFlag: V, dynamicChildren: F, slotScopeIds: H } = g;
    H && (T = T ? T.concat(H) : H), p == null ? (r(_, v, C), r(E, v, C), Gt(g.children, v, E, w, S, P, T, N)) : V > 0 && V & 64 && F && p.dynamicChildren ? (qe(p.dynamicChildren, F, v, w, S, P, T), (g.key != null || w && g === w.subTree) && nc(p, g, !0)) : Ce(p, g, v, E, w, S, P, T, N);
  }, Fn = (p, g, v, C, w, S, P, T, N) => {
    g.slotScopeIds = T, p == null ? g.shapeFlag & 512 ? w.ctx.activate(g, v, C, P, N) : mr(g, v, C, w, S, P, N) : Tt(p, g, N);
  }, mr = (p, g, v, C, w, S, P) => {
    const T = p.component = T3(p, C, w);
    if ($0(p) && (T.ctx.renderer = qt), A3(T), T.asyncDep) {
      if (w && w.registerDep(T, _t), !p.el) {
        const N = T.subTree = at(fn);
        G(null, N, g, v);
      }
      return;
    }
    _t(T, p, g, v, w, S, P);
  }, Tt = (p, g, v) => {
    const C = g.component = p.component;
    if (Du(p, g, v))
      if (C.asyncDep && !C.asyncResolved) {
        yt(C, g, v);
        return;
      } else
        C.next = g, Iu(C.update), C.update();
    else
      g.el = p.el, C.vnode = g;
  }, _t = (p, g, v, C, w, S, P) => {
    const T = () => {
      if (p.isMounted) {
        let { next: E, bu: V, u: F, parent: H, vnode: et } = p, Lt = E, dt;
        yn(p, !1), E ? (E.el = et.el, yt(p, E, P)) : E = et, V && Mi(V), (dt = E.props && E.props.onVnodeBeforeUpdate) && Oe(dt, H, E, et), yn(p, !0);
        const At = Fi(p), z = p.subTree;
        p.subTree = At, M(
          z,
          At,
          d(z.el),
          It(z),
          p,
          w,
          S
        ), E.el = At.el, Lt === null && Bu(p, At.el), F && oe(F, w), (dt = E.props && E.props.onVnodeUpdated) && oe(() => Oe(dt, H, E, et), w);
      } else {
        let E;
        const { el: V, props: F } = g, { bm: H, m: et, parent: Lt } = p, dt = Ar(g);
        if (yn(p, !1), H && Mi(H), !dt && (E = F && F.onVnodeBeforeMount) && Oe(E, Lt, g), yn(p, !0), V && ie) {
          const At = () => {
            p.subTree = Fi(p), ie(V, p.subTree, p, w, null);
          };
          dt ? g.type.__asyncLoader().then(
            () => !p.isUnmounted && At()
          ) : At();
        } else {
          const At = p.subTree = Fi(p);
          M(null, At, v, C, p, w, S), g.el = At.el;
        }
        if (et && oe(et, w), !dt && (E = F && F.onVnodeMounted)) {
          const At = g;
          oe(() => Oe(E, Lt, At), w);
        }
        (g.shapeFlag & 256 || Lt && Ar(Lt.vnode) && Lt.vnode.shapeFlag & 256) && p.a && oe(p.a, w), p.isMounted = !0, g = v = C = null;
      }
    }, N = p.effect = new D1(
      T,
      () => q1(_),
      p.scope
    ), _ = p.update = () => N.run();
    _.id = p.uid, yn(p, !0), _();
  }, yt = (p, g, v) => {
    g.component = p;
    const C = p.vnode.props;
    p.vnode = g, p.next = null, u3(p, g.props, C, v), f3(p, g.children, v), ir(), Oa(), or();
  }, Ce = (p, g, v, C, w, S, P, T, N = !1) => {
    const _ = p && p.children, E = p ? p.shapeFlag : 0, V = g.children, { patchFlag: F, shapeFlag: H } = g;
    if (F > 0) {
      if (F & 128) {
        Se(_, V, v, C, w, S, P, T, N);
        return;
      } else if (F & 256) {
        xr(_, V, v, C, w, S, P, T, N);
        return;
      }
    }
    H & 8 ? (E & 16 && lt(_, w, S), V !== _ && u(v, V)) : E & 16 ? H & 16 ? Se(_, V, v, C, w, S, P, T, N) : lt(_, w, S, !0) : (E & 8 && u(v, ""), H & 16 && Gt(V, v, C, w, S, P, T, N));
  }, xr = (p, g, v, C, w, S, P, T, N) => {
    p = p || Vn, g = g || Vn;
    const _ = p.length, E = g.length, V = Math.min(_, E);
    let F;
    for (F = 0; F < V; F++) {
      const H = g[F] = N ? an(g[F]) : Me(g[F]);
      M(p[F], H, v, null, w, S, P, T, N);
    }
    _ > E ? lt(p, w, S, !0, !1, V) : Gt(g, v, C, w, S, P, T, N, V);
  }, Se = (p, g, v, C, w, S, P, T, N) => {
    let _ = 0;
    const E = g.length;
    let V = p.length - 1, F = E - 1;
    for (; _ <= V && _ <= F; ) {
      const H = p[_], et = g[_] = N ? an(g[_]) : Me(g[_]);
      if (Lr(H, et))
        M(H, et, v, null, w, S, P, T, N);
      else
        break;
      _++;
    }
    for (; _ <= V && _ <= F; ) {
      const H = p[V], et = g[F] = N ? an(g[F]) : Me(g[F]);
      if (Lr(H, et))
        M(H, et, v, null, w, S, P, T, N);
      else
        break;
      V--, F--;
    }
    if (_ > V) {
      if (_ <= F) {
        const H = F + 1, et = H < E ? g[H].el : C;
        for (; _ <= F; )
          M(null, g[_] = N ? an(g[_]) : Me(g[_]), v, et, w, S, P, T, N), _++;
      }
    } else if (_ > F)
      for (; _ <= V; )
        Re(p[_], w, S, !0), _++;
    else {
      const H = _, et = _, Lt = /* @__PURE__ */ new Map();
      for (_ = et; _ <= F; _++) {
        const Bt = g[_] = N ? an(g[_]) : Me(g[_]);
        Bt.key != null && Lt.set(Bt.key, _);
      }
      let dt, At = 0;
      const z = F - et + 1;
      let Z = !1, rt = 0;
      const ht = new Array(z);
      for (_ = 0; _ < z; _++)
        ht[_] = 0;
      for (_ = H; _ <= V; _++) {
        const Bt = p[_];
        if (At >= z) {
          Re(Bt, w, S, !0);
          continue;
        }
        let xe;
        if (Bt.key != null)
          xe = Lt.get(Bt.key);
        else
          for (dt = et; dt <= F; dt++)
            if (ht[dt - et] === 0 && Lr(Bt, g[dt])) {
              xe = dt;
              break;
            }
        xe === void 0 ? Re(Bt, w, S, !0) : (ht[xe - et] = _ + 1, xe >= rt ? rt = xe : Z = !0, M(Bt, g[xe], v, null, w, S, P, T, N), At++);
      }
      const $t = Z ? y3(ht) : Vn;
      for (dt = $t.length - 1, _ = z - 1; _ >= 0; _--) {
        const Bt = et + _, xe = g[Bt], ba = Bt + 1 < E ? g[Bt + 1].el : C;
        ht[_] === 0 ? M(null, xe, v, ba, w, S, P, T, N) : Z && (dt < 0 || _ !== $t[dt] ? sn(xe, v, ba, 2) : dt--);
      }
    }
  }, sn = (p, g, v, C, w = null) => {
    const { el: S, type: P, transition: T, children: N, shapeFlag: _ } = p;
    if (_ & 6) {
      sn(p.component.subTree, g, v, C);
      return;
    }
    if (_ & 128) {
      p.suspense.move(g, v, C);
      return;
    }
    if (_ & 64) {
      P.move(p, g, v, qt);
      return;
    }
    if (P === zt) {
      r(S, g, v);
      for (let E = 0; E < N.length; E++)
        sn(N[E], g, v, C);
      r(p.anchor, g, v);
      return;
    }
    if (P === bs) {
      q(p, g, v);
      return;
    }
    if (C !== 2 && _ & 1 && T)
      if (C === 0)
        T.beforeEnter(S), r(S, g, v), oe(() => T.enter(S), w);
      else {
        const { leave: E, delayLeave: V, afterLeave: F } = T, H = () => r(S, g, v), et = () => {
          E(S, () => {
            H(), F && F();
          });
        };
        V ? V(S, H, et) : et();
      }
    else
      r(S, g, v);
  }, Re = (p, g, v, C = !1, w = !1) => {
    const { type: S, props: P, ref: T, children: N, dynamicChildren: _, shapeFlag: E, patchFlag: V, dirs: F } = p;
    if (T != null && h1(T, null, v, p, !0), E & 256) {
      g.ctx.deactivate(p);
      return;
    }
    const H = E & 1 && F, et = !Ar(p);
    let Lt;
    if (et && (Lt = P && P.onVnodeBeforeUnmount) && Oe(Lt, g, p), E & 6)
      ct(p.component, v, C);
    else {
      if (E & 128) {
        p.suspense.unmount(v, C);
        return;
      }
      H && Ln(p, null, g, "beforeUnmount"), E & 64 ? p.type.remove(p, g, v, w, qt, C) : _ && (S !== zt || V > 0 && V & 64) ? lt(_, g, v, !1, !0) : (S === zt && V & 384 || !w && E & 16) && lt(N, g, v), C && k(p);
    }
    (et && (Lt = P && P.onVnodeUnmounted) || H) && oe(() => {
      Lt && Oe(Lt, g, p), H && Ln(p, null, g, "unmounted");
    }, v);
  }, k = (p) => {
    const { type: g, el: v, anchor: C, transition: w } = p;
    if (g === zt) {
      j(v, C);
      return;
    }
    if (g === bs) {
      Q(p);
      return;
    }
    const S = () => {
      s(v), w && !w.persisted && w.afterLeave && w.afterLeave();
    };
    if (p.shapeFlag & 1 && w && !w.persisted) {
      const { leave: P, delayLeave: T } = w, N = () => P(v, S);
      T ? T(p.el, S, N) : N();
    } else
      S();
  }, j = (p, g) => {
    let v;
    for (; p !== g; )
      v = f(p), s(p), p = v;
    s(g);
  }, ct = (p, g, v) => {
    const { bum: C, scope: w, update: S, subTree: P, um: T } = p;
    C && Mi(C), w.stop(), S && (S.active = !1, Re(P, p, g, v)), T && oe(T, g), oe(() => {
      p.isUnmounted = !0;
    }, g), g && g.pendingBranch && !g.isUnmounted && p.asyncDep && !p.asyncResolved && p.suspenseId === g.pendingId && (g.deps--, g.deps === 0 && g.resolve());
  }, lt = (p, g, v, C = !1, w = !1, S = 0) => {
    for (let P = S; P < p.length; P++)
      Re(p[P], g, v, C, w);
  }, It = (p) => p.shapeFlag & 6 ? It(p.component.subTree) : p.shapeFlag & 128 ? p.suspense.next() : f(p.anchor || p.el), Ie = (p, g, v) => {
    p == null ? g._vnode && Re(g._vnode, null, null, !0) : M(g._vnode || null, p, g, null, null, null, v), Oa(), D0(), g._vnode = p;
  }, qt = {
    p: M,
    um: Re,
    m: sn,
    r: k,
    mt: mr,
    mc: Gt,
    pc: Ce,
    pbc: qe,
    n: It,
    o: e
  };
  let se, ie;
  return t && ([se, ie] = t(qt)), {
    render: Ie,
    hydrate: se,
    createApp: m3(Ie, se)
  };
}
function yn({ effect: e, update: t }, n) {
  e.allowRecurse = t.allowRecurse = n;
}
function nc(e, t, n = !1) {
  const r = e.children, s = t.children;
  if (nt(r) && nt(s))
    for (let i = 0; i < r.length; i++) {
      const o = r[i];
      let a = s[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = s[i] = an(s[i]), a.el = o.el), n || nc(o, a)), a.type === ni && (a.el = o.el);
    }
}
function y3(e) {
  const t = e.slice(), n = [0];
  let r, s, i, o, a;
  const l = e.length;
  for (r = 0; r < l; r++) {
    const c = e[r];
    if (c !== 0) {
      if (s = n[n.length - 1], e[s] < c) {
        t[r] = s, n.push(r);
        continue;
      }
      for (i = 0, o = n.length - 1; i < o; )
        a = i + o >> 1, e[n[a]] < c ? i = a + 1 : o = a;
      c < e[n[i]] && (i > 0 && (t[r] = n[i - 1]), n[i] = r);
    }
  }
  for (i = n.length, o = n[i - 1]; i-- > 0; )
    n[i] = o, o = t[o];
  return n;
}
const v3 = (e) => e.__isTeleport, zt = Symbol(void 0), ni = Symbol(void 0), fn = Symbol(void 0), bs = Symbol(void 0), Rr = [];
let ke = null;
function R(e = !1) {
  Rr.push(ke = e ? null : []);
}
function b3() {
  Rr.pop(), ke = Rr[Rr.length - 1] || null;
}
let Hr = 1;
function Ha(e) {
  Hr += e;
}
function rc(e) {
  return e.dynamicChildren = Hr > 0 ? ke || Vn : null, b3(), Hr > 0 && ke && ke.push(e), e;
}
function W(e, t, n, r, s, i) {
  return rc(b(e, t, n, r, s, i, !0));
}
function wt(e, t, n, r, s) {
  return rc(at(e, t, n, r, s, !0));
}
function sc(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Lr(e, t) {
  return e.type === t.type && e.key === t.key;
}
const ri = "__vInternal", ic = ({ key: e }) => e ?? null, ws = ({ ref: e, ref_key: t, ref_for: n }) => e != null ? Ft(e) || te(e) || st(e) ? { i: Yt, r: e, k: t, f: !!n } : e : null;
function b(e, t = null, n = null, r = 0, s = null, i = e === zt ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && ic(t),
    ref: t && ws(t),
    scopeId: ti,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: i,
    patchFlag: r,
    dynamicProps: s,
    dynamicChildren: null,
    appContext: null,
    ctx: Yt
  };
  return a ? (Q1(l, n), i & 128 && e.normalize(l)) : n && (l.shapeFlag |= Ft(n) ? 8 : 16), Hr > 0 && !o && ke && (l.patchFlag > 0 || i & 6) && l.patchFlag !== 32 && ke.push(l), l;
}
const at = w3;
function w3(e, t = null, n = null, r = 0, s = null, i = !1) {
  if ((!e || e === q0) && (e = fn), sc(e)) {
    const a = Qn(e, t, !0);
    return n && Q1(a, n), Hr > 0 && !i && ke && (a.shapeFlag & 6 ? ke[ke.indexOf(e)] = a : ke.push(a)), a.patchFlag |= -2, a;
  }
  if (N3(e) && (e = e.__vccOpts), t) {
    t = C3(t);
    let { class: a, style: l } = t;
    a && !Ft(a) && (t.class = ne(a)), Pt(l) && (O0(l) && !nt(l) && (l = re({}, l)), t.style = gt(l));
  }
  const o = Ft(e) ? 1 : Uu(e) ? 128 : v3(e) ? 64 : Pt(e) ? 4 : st(e) ? 2 : 0;
  return b(e, t, n, r, s, o, i, !0);
}
function C3(e) {
  return e ? O0(e) || ri in e ? re({}, e) : e : null;
}
function Qn(e, t, n = !1) {
  const { props: r, ref: s, patchFlag: i, children: o } = e, a = t ? _3(r || {}, t) : r;
  return {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: a,
    key: a && ic(a),
    ref: t && t.ref ? n && s ? nt(s) ? s.concat(ws(t)) : [s, ws(t)] : ws(t) : s,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: o,
    target: e.target,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    patchFlag: t && e.type !== zt ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: e.transition,
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && Qn(e.ssContent),
    ssFallback: e.ssFallback && Qn(e.ssFallback),
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx
  };
}
function Rs(e = " ", t = 0) {
  return at(ni, null, e, t);
}
function oc(e, t) {
  const n = at(bs, null, e);
  return n.staticCount = t, n;
}
function mt(e = "", t = !1) {
  return t ? (R(), wt(fn, null, e)) : at(fn, null, e);
}
function Me(e) {
  return e == null || typeof e == "boolean" ? at(fn) : nt(e) ? at(
    zt,
    null,
    e.slice()
  ) : typeof e == "object" ? an(e) : at(ni, null, String(e));
}
function an(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Qn(e);
}
function Q1(e, t) {
  let n = 0;
  const { shapeFlag: r } = e;
  if (t == null)
    t = null;
  else if (nt(t))
    n = 16;
  else if (typeof t == "object")
    if (r & 65) {
      const s = t.default;
      s && (s._c && (s._d = !1), Q1(e, s()), s._c && (s._d = !0));
      return;
    } else {
      n = 32;
      const s = t._;
      !s && !(ri in t) ? t._ctx = Yt : s === 3 && Yt && (Yt.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else
    st(t) ? (t = { default: t, _ctx: Yt }, n = 32) : (t = String(t), r & 64 ? (n = 16, t = [Rs(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function _3(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    for (const s in r)
      if (s === "class")
        t.class !== r.class && (t.class = ne([t.class, r.class]));
      else if (s === "style")
        t.style = gt([t.style, r.style]);
      else if (qs(s)) {
        const i = t[s], o = r[s];
        o && i !== o && !(nt(i) && i.includes(o)) && (t[s] = i ? [].concat(i, o) : o);
      } else
        s !== "" && (t[s] = r[s]);
  }
  return t;
}
function Oe(e, t, n, r = null) {
  Ee(e, t, 7, [
    n,
    r
  ]);
}
const k3 = ec();
let E3 = 0;
function T3(e, t, n) {
  const r = e.type, s = (t ? t.appContext : e.appContext) || k3, i = {
    uid: E3++,
    vnode: e,
    type: r,
    parent: t,
    appContext: s,
    root: null,
    next: null,
    subTree: null,
    effect: null,
    update: null,
    scope: new v0(!0),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(s.provides),
    accessCache: null,
    renderCache: [],
    components: null,
    directives: null,
    propsOptions: Q0(r, s),
    emitsOptions: U0(r, s),
    emit: null,
    emitted: null,
    propsDefaults: Et,
    inheritAttrs: r.inheritAttrs,
    ctx: Et,
    data: Et,
    props: Et,
    attrs: Et,
    slots: Et,
    refs: Et,
    setupState: Et,
    setupContext: null,
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = Pu.bind(null, i), e.ce && e.ce(i), i;
}
let Vt = null;
const Xn = (e) => {
  Vt = e, e.scope.on();
}, Tn = () => {
  Vt && Vt.scope.off(), Vt = null;
};
function ac(e) {
  return e.vnode.shapeFlag & 4;
}
let Gr = !1;
function A3(e, t = !1) {
  Gr = t;
  const { props: n, children: r } = e.vnode, s = ac(e);
  h3(e, n, s, t), p3(e, r);
  const i = s ? S3(e, t) : void 0;
  return Gr = !1, i;
}
function S3(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = N0(new Proxy(e.ctx, s3));
  const { setup: r } = n;
  if (r) {
    const s = e.setupContext = r.length > 1 ? I3(e) : null;
    Xn(e), ir();
    const i = un(r, e, 0, [e.props, s]);
    if (or(), Tn(), m0(i)) {
      if (i.then(Tn, Tn), t)
        return i.then((o) => {
          Ga(e, o, t);
        }).catch((o) => {
          Xs(o, e, 0);
        });
      e.asyncDep = i;
    } else
      Ga(e, i, t);
  } else
    lc(e, t);
}
function Ga(e, t, n) {
  st(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Pt(t) && (e.setupState = P0(t)), lc(e, n);
}
let $a;
function lc(e, t, n) {
  const r = e.type;
  if (!e.render) {
    if (!t && $a && !r.render) {
      const s = r.template || Y1(e).template;
      if (s) {
        const { isCustomElement: i, compilerOptions: o } = e.appContext.config, { delimiters: a, compilerOptions: l } = r, c = re(re({
          isCustomElement: i,
          delimiters: a
        }, o), l);
        r.render = $a(s, c);
      }
    }
    e.render = r.render || Be;
  }
  Xn(e), ir(), i3(e), or(), Tn();
}
function R3(e) {
  return new Proxy(e.attrs, {
    get(t, n) {
      return pe(e, "get", "$attrs"), t[n];
    }
  });
}
function I3(e) {
  const t = (r) => {
    e.exposed = r || {};
  };
  let n;
  return {
    get attrs() {
      return n || (n = R3(e));
    },
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function si(e) {
  if (e.exposed)
    return e.exposeProxy || (e.exposeProxy = new Proxy(P0(N0(e.exposed)), {
      get(t, n) {
        if (n in t)
          return t[n];
        if (n in Sr)
          return Sr[n](e);
      },
      has(t, n) {
        return n in t || n in Sr;
      }
    }));
}
function O3(e, t = !0) {
  return st(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function N3(e) {
  return st(e) && "__vccOpts" in e;
}
const cc = (e, t) => Tu(e, t, Gr), P3 = Symbol(""), M3 = () => vs(P3), F3 = "3.2.45", z3 = "http://www.w3.org/2000/svg", Cn = typeof document < "u" ? document : null, ja = Cn && /* @__PURE__ */ Cn.createElement("template"), D3 = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, r) => {
    const s = t ? Cn.createElementNS(z3, e) : Cn.createElement(e, n ? { is: n } : void 0);
    return e === "select" && r && r.multiple != null && s.setAttribute("multiple", r.multiple), s;
  },
  createText: (e) => Cn.createTextNode(e),
  createComment: (e) => Cn.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Cn.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  insertStaticContent(e, t, n, r, s, i) {
    const o = n ? n.previousSibling : t.lastChild;
    if (s && (s === i || s.nextSibling))
      for (; t.insertBefore(s.cloneNode(!0), n), !(s === i || !(s = s.nextSibling)); )
        ;
    else {
      ja.innerHTML = r ? `<svg>${e}</svg>` : e;
      const a = ja.content;
      if (r) {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      t.insertBefore(a, n);
    }
    return [
      o ? o.nextSibling : t.firstChild,
      n ? n.previousSibling : t.lastChild
    ];
  }
};
function B3(e, t, n) {
  const r = e._vtc;
  r && (t = (t ? [t, ...r] : [...r]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
function U3(e, t, n) {
  const r = e.style, s = Ft(n);
  if (n && !s) {
    for (const i in n)
      u1(r, i, n[i]);
    if (t && !Ft(t))
      for (const i in t)
        n[i] == null && u1(r, i, "");
  } else {
    const i = r.display;
    s ? t !== n && (r.cssText = n) : t && e.removeAttribute("style"), "_vod" in e && (r.display = i);
  }
}
const Va = /\s*!important$/;
function u1(e, t, n) {
  if (nt(n))
    n.forEach((r) => u1(e, t, r));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const r = H3(e, t);
    Va.test(n) ? e.setProperty(sr(r), n.replace(Va, ""), "important") : e[r] = n;
  }
}
const qa = ["Webkit", "Moz", "ms"], Di = {};
function H3(e, t) {
  const n = Di[t];
  if (n)
    return n;
  let r = He(t);
  if (r !== "filter" && r in e)
    return Di[t] = r;
  r = Ys(r);
  for (let s = 0; s < qa.length; s++) {
    const i = qa[s] + r;
    if (i in e)
      return Di[t] = i;
  }
  return t;
}
const Za = "http://www.w3.org/1999/xlink";
function G3(e, t, n, r, s) {
  if (r && t.startsWith("xlink:"))
    n == null ? e.removeAttributeNS(Za, t.slice(6, t.length)) : e.setAttributeNS(Za, t, n);
  else {
    const i = Uh(t);
    n == null || i && !p0(n) ? e.removeAttribute(t) : e.setAttribute(t, i ? "" : n);
  }
}
function $3(e, t, n, r, s, i, o) {
  if (t === "innerHTML" || t === "textContent") {
    r && o(r, s, i), e[t] = n ?? "";
    return;
  }
  if (t === "value" && e.tagName !== "PROGRESS" && !e.tagName.includes("-")) {
    e._value = n;
    const l = n ?? "";
    (e.value !== l || e.tagName === "OPTION") && (e.value = l), n == null && e.removeAttribute(t);
    return;
  }
  let a = !1;
  if (n === "" || n == null) {
    const l = typeof e[t];
    l === "boolean" ? n = p0(n) : n == null && l === "string" ? (n = "", a = !0) : l === "number" && (n = 0, a = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  a && e.removeAttribute(t);
}
function j3(e, t, n, r) {
  e.addEventListener(t, n, r);
}
function V3(e, t, n, r) {
  e.removeEventListener(t, n, r);
}
function q3(e, t, n, r, s = null) {
  const i = e._vei || (e._vei = {}), o = i[t];
  if (r && o)
    o.value = r;
  else {
    const [a, l] = Z3(t);
    if (r) {
      const c = i[t] = K3(r, s);
      j3(e, a, c, l);
    } else
      o && (V3(e, a, o, l), i[t] = void 0);
  }
}
const Wa = /(?:Once|Passive|Capture)$/;
function Z3(e) {
  let t;
  if (Wa.test(e)) {
    t = {};
    let n;
    for (; n = e.match(Wa); )
      e = e.slice(0, e.length - n[0].length), t[n[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : sr(e.slice(2)), t];
}
let Bi = 0;
const W3 = /* @__PURE__ */ Promise.resolve(), Y3 = () => Bi || (W3.then(() => Bi = 0), Bi = Date.now());
function K3(e, t) {
  const n = (r) => {
    if (!r._vts)
      r._vts = Date.now();
    else if (r._vts <= n.attached)
      return;
    Ee(Q3(r, n.value), t, 5, [r]);
  };
  return n.value = e, n.attached = Y3(), n;
}
function Q3(e, t) {
  if (nt(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map((r) => (s) => !s._stopped && r && r(s));
  } else
    return t;
}
const Ya = /^on[a-z]/, X3 = (e, t, n, r, s = !1, i, o, a, l) => {
  t === "class" ? B3(e, r, s) : t === "style" ? U3(e, n, r) : qs(t) ? N1(t) || q3(e, t, n, r, o) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : J3(e, t, r, s)) ? $3(e, t, r, i, o, a, l) : (t === "true-value" ? e._trueValue = r : t === "false-value" && (e._falseValue = r), G3(e, t, r, s));
};
function J3(e, t, n, r) {
  return r ? !!(t === "innerHTML" || t === "textContent" || t in e && Ya.test(t) && st(n)) : t === "spellcheck" || t === "draggable" || t === "translate" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA" || Ya.test(t) && Ft(n) ? !1 : t in e;
}
const t4 = ["ctrl", "shift", "alt", "meta"], e4 = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => t4.some((n) => e[`${n}Key`] && !t.includes(n))
}, ii = (e, t) => (n, ...r) => {
  for (let s = 0; s < t.length; s++) {
    const i = e4[t[s]];
    if (i && i(n, t))
      return;
  }
  return e(n, ...r);
}, n4 = {
  beforeMount(e, { value: t }, { transition: n }) {
    e._vod = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : yr(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: r }) {
    !t != !n && (r ? t ? (r.beforeEnter(e), yr(e, !0), r.enter(e)) : r.leave(e, () => {
      yr(e, !1);
    }) : yr(e, t));
  },
  beforeUnmount(e, { value: t }) {
    yr(e, t);
  }
};
function yr(e, t) {
  e.style.display = t ? e._vod : "none";
}
const r4 = /* @__PURE__ */ re({ patchProp: X3 }, D3);
let Ka;
function s4() {
  return Ka || (Ka = x3(r4));
}
const i4 = (...e) => {
  const t = s4().createApp(...e), { mount: n } = t;
  return t.mount = (r) => {
    const s = o4(r);
    if (!s)
      return;
    const i = t._component;
    !st(i) && !i.render && !i.template && (i.template = s.innerHTML), s.innerHTML = "";
    const o = n(s, !1, s instanceof SVGElement);
    return s instanceof Element && (s.removeAttribute("v-cloak"), s.setAttribute("data-v-app", "")), o;
  }, t;
};
function o4(e) {
  return Ft(e) ? document.querySelector(e) : e;
}
function a4() {
  return hc().__VUE_DEVTOOLS_GLOBAL_HOOK__;
}
function hc() {
  return typeof navigator < "u" && typeof window < "u" ? window : typeof global < "u" ? global : {};
}
const l4 = typeof Proxy == "function", c4 = "devtools-plugin:setup", h4 = "plugin:settings:set";
let vr, d1;
function u4() {
  var e;
  return vr !== void 0 || (typeof window < "u" && window.performance ? (vr = !0, d1 = window.performance) : typeof global < "u" && (!((e = global.perf_hooks) === null || e === void 0) && e.performance) ? (vr = !0, d1 = global.perf_hooks.performance) : vr = !1), vr;
}
function d4() {
  return u4() ? d1.now() : Date.now();
}
class p4 {
  constructor(t, n) {
    this.target = null, this.targetQueue = [], this.onQueue = [], this.plugin = t, this.hook = n;
    const r = {};
    if (t.settings)
      for (const o in t.settings) {
        const a = t.settings[o];
        r[o] = a.defaultValue;
      }
    const s = `__vue-devtools-plugin-settings__${t.id}`;
    let i = Object.assign({}, r);
    try {
      const o = localStorage.getItem(s), a = JSON.parse(o);
      Object.assign(i, a);
    } catch {
    }
    this.fallbacks = {
      getSettings() {
        return i;
      },
      setSettings(o) {
        try {
          localStorage.setItem(s, JSON.stringify(o));
        } catch {
        }
        i = o;
      },
      now() {
        return d4();
      }
    }, n && n.on(h4, (o, a) => {
      o === this.plugin.id && this.fallbacks.setSettings(a);
    }), this.proxiedOn = new Proxy({}, {
      get: (o, a) => this.target ? this.target.on[a] : (...l) => {
        this.onQueue.push({
          method: a,
          args: l
        });
      }
    }), this.proxiedTarget = new Proxy({}, {
      get: (o, a) => this.target ? this.target[a] : a === "on" ? this.proxiedOn : Object.keys(this.fallbacks).includes(a) ? (...l) => (this.targetQueue.push({
        method: a,
        args: l,
        resolve: () => {
        }
      }), this.fallbacks[a](...l)) : (...l) => new Promise((c) => {
        this.targetQueue.push({
          method: a,
          args: l,
          resolve: c
        });
      })
    });
  }
  async setRealTarget(t) {
    this.target = t;
    for (const n of this.onQueue)
      this.target.on[n.method](...n.args);
    for (const n of this.targetQueue)
      n.resolve(await this.target[n.method](...n.args));
  }
}
function f4(e, t) {
  const n = e, r = hc(), s = a4(), i = l4 && n.enableEarlyProxy;
  if (s && (r.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !i))
    s.emit(c4, e, t);
  else {
    const o = i ? new p4(n, s) : null;
    (r.__VUE_DEVTOOLS_PLUGINS__ = r.__VUE_DEVTOOLS_PLUGINS__ || []).push({
      pluginDescriptor: n,
      setupFn: t,
      proxy: o
    }), o && t(o.proxiedTarget);
  }
}
/*!
 * vuex v4.1.0
 * (c) 2022 Evan You
 * @license MIT
 */
var g4 = "store";
function ar(e, t) {
  Object.keys(e).forEach(function(n) {
    return t(e[n], n);
  });
}
function uc(e) {
  return e !== null && typeof e == "object";
}
function m4(e) {
  return e && typeof e.then == "function";
}
function x4(e, t) {
  return function() {
    return e(t);
  };
}
function dc(e, t, n) {
  return t.indexOf(e) < 0 && (n && n.prepend ? t.unshift(e) : t.push(e)), function() {
    var r = t.indexOf(e);
    r > -1 && t.splice(r, 1);
  };
}
function pc(e, t) {
  e._actions = /* @__PURE__ */ Object.create(null), e._mutations = /* @__PURE__ */ Object.create(null), e._wrappedGetters = /* @__PURE__ */ Object.create(null), e._modulesNamespaceMap = /* @__PURE__ */ Object.create(null);
  var n = e.state;
  oi(e, n, [], e._modules.root, !0), X1(e, n, t);
}
function X1(e, t, n) {
  var r = e._state, s = e._scope;
  e.getters = {}, e._makeLocalGettersCache = /* @__PURE__ */ Object.create(null);
  var i = e._wrappedGetters, o = {}, a = {}, l = Wh(!0);
  l.run(function() {
    ar(i, function(c, u) {
      o[u] = x4(c, e), a[u] = cc(function() {
        return o[u]();
      }), Object.defineProperty(e.getters, u, {
        get: function() {
          return a[u].value;
        },
        enumerable: !0
      });
    });
  }), e._state = Qs({
    data: t
  }), e._scope = l, e.strict && w4(e), r && n && e._withCommit(function() {
    r.data = null;
  }), s && s.stop();
}
function oi(e, t, n, r, s) {
  var i = !n.length, o = e._modules.getNamespace(n);
  if (r.namespaced && (e._modulesNamespaceMap[o], e._modulesNamespaceMap[o] = r), !i && !s) {
    var a = J1(t, n.slice(0, -1)), l = n[n.length - 1];
    e._withCommit(function() {
      a[l] = r.state;
    });
  }
  var c = r.context = L4(e, o, n);
  r.forEachMutation(function(u, d) {
    var f = o + d;
    y4(e, f, u, c);
  }), r.forEachAction(function(u, d) {
    var f = u.root ? d : o + d, m = u.handler || u;
    v4(e, f, m, c);
  }), r.forEachGetter(function(u, d) {
    var f = o + d;
    b4(e, f, u, c);
  }), r.forEachChild(function(u, d) {
    oi(e, t, n.concat(d), u, s);
  });
}
function L4(e, t, n) {
  var r = t === "", s = {
    dispatch: r ? e.dispatch : function(i, o, a) {
      var l = Is(i, o, a), c = l.payload, u = l.options, d = l.type;
      return (!u || !u.root) && (d = t + d), e.dispatch(d, c);
    },
    commit: r ? e.commit : function(i, o, a) {
      var l = Is(i, o, a), c = l.payload, u = l.options, d = l.type;
      (!u || !u.root) && (d = t + d), e.commit(d, c, u);
    }
  };
  return Object.defineProperties(s, {
    getters: {
      get: r ? function() {
        return e.getters;
      } : function() {
        return fc(e, t);
      }
    },
    state: {
      get: function() {
        return J1(e.state, n);
      }
    }
  }), s;
}
function fc(e, t) {
  if (!e._makeLocalGettersCache[t]) {
    var n = {}, r = t.length;
    Object.keys(e.getters).forEach(function(s) {
      if (s.slice(0, r) === t) {
        var i = s.slice(r);
        Object.defineProperty(n, i, {
          get: function() {
            return e.getters[s];
          },
          enumerable: !0
        });
      }
    }), e._makeLocalGettersCache[t] = n;
  }
  return e._makeLocalGettersCache[t];
}
function y4(e, t, n, r) {
  var s = e._mutations[t] || (e._mutations[t] = []);
  s.push(function(i) {
    n.call(e, r.state, i);
  });
}
function v4(e, t, n, r) {
  var s = e._actions[t] || (e._actions[t] = []);
  s.push(function(i) {
    var o = n.call(e, {
      dispatch: r.dispatch,
      commit: r.commit,
      getters: r.getters,
      state: r.state,
      rootGetters: e.getters,
      rootState: e.state
    }, i);
    return m4(o) || (o = Promise.resolve(o)), e._devtoolHook ? o.catch(function(a) {
      throw e._devtoolHook.emit("vuex:error", a), a;
    }) : o;
  });
}
function b4(e, t, n, r) {
  e._wrappedGetters[t] || (e._wrappedGetters[t] = function(s) {
    return n(
      r.state,
      r.getters,
      s.state,
      s.getters
    );
  });
}
function w4(e) {
  Tr(function() {
    return e._state.data;
  }, function() {
  }, { deep: !0, flush: "sync" });
}
function J1(e, t) {
  return t.reduce(function(n, r) {
    return n[r];
  }, e);
}
function Is(e, t, n) {
  return uc(e) && e.type && (n = t, t = e, e = e.type), { type: e, payload: t, options: n };
}
var C4 = "vuex bindings", Qa = "vuex:mutations", Ui = "vuex:actions", Un = "vuex", _4 = 0;
function k4(e, t) {
  f4(
    {
      id: "org.vuejs.vuex",
      app: e,
      label: "Vuex",
      homepage: "https://next.vuex.vuejs.org/",
      logo: "https://vuejs.org/images/icons/favicon-96x96.png",
      packageName: "vuex",
      componentStateTypes: [C4]
    },
    function(n) {
      n.addTimelineLayer({
        id: Qa,
        label: "Vuex Mutations",
        color: Xa
      }), n.addTimelineLayer({
        id: Ui,
        label: "Vuex Actions",
        color: Xa
      }), n.addInspector({
        id: Un,
        label: "Vuex",
        icon: "storage",
        treeFilterPlaceholder: "Filter stores..."
      }), n.on.getInspectorTree(function(r) {
        if (r.app === e && r.inspectorId === Un)
          if (r.filter) {
            var s = [];
            Lc(s, t._modules.root, r.filter, ""), r.rootNodes = s;
          } else
            r.rootNodes = [
              xc(t._modules.root, "")
            ];
      }), n.on.getInspectorState(function(r) {
        if (r.app === e && r.inspectorId === Un) {
          var s = r.nodeId;
          fc(t, s), r.state = A4(
            R4(t._modules, s),
            s === "root" ? t.getters : t._makeLocalGettersCache,
            s
          );
        }
      }), n.on.editInspectorState(function(r) {
        if (r.app === e && r.inspectorId === Un) {
          var s = r.nodeId, i = r.path;
          s !== "root" && (i = s.split("/").filter(Boolean).concat(i)), t._withCommit(function() {
            r.set(t._state.data, i, r.state.value);
          });
        }
      }), t.subscribe(function(r, s) {
        var i = {};
        r.payload && (i.payload = r.payload), i.state = s, n.notifyComponentUpdate(), n.sendInspectorTree(Un), n.sendInspectorState(Un), n.addTimelineEvent({
          layerId: Qa,
          event: {
            time: Date.now(),
            title: r.type,
            data: i
          }
        });
      }), t.subscribeAction({
        before: function(r, s) {
          var i = {};
          r.payload && (i.payload = r.payload), r._id = _4++, r._time = Date.now(), i.state = s, n.addTimelineEvent({
            layerId: Ui,
            event: {
              time: r._time,
              title: r.type,
              groupId: r._id,
              subtitle: "start",
              data: i
            }
          });
        },
        after: function(r, s) {
          var i = {}, o = Date.now() - r._time;
          i.duration = {
            _custom: {
              type: "duration",
              display: o + "ms",
              tooltip: "Action duration",
              value: o
            }
          }, r.payload && (i.payload = r.payload), i.state = s, n.addTimelineEvent({
            layerId: Ui,
            event: {
              time: Date.now(),
              title: r.type,
              groupId: r._id,
              subtitle: "end",
              data: i
            }
          });
        }
      });
    }
  );
}
var Xa = 8702998, E4 = 6710886, T4 = 16777215, gc = {
  label: "namespaced",
  textColor: T4,
  backgroundColor: E4
};
function mc(e) {
  return e && e !== "root" ? e.split("/").slice(-2, -1)[0] : "Root";
}
function xc(e, t) {
  return {
    id: t || "root",
    label: mc(t),
    tags: e.namespaced ? [gc] : [],
    children: Object.keys(e._children).map(
      function(n) {
        return xc(
          e._children[n],
          t + n + "/"
        );
      }
    )
  };
}
function Lc(e, t, n, r) {
  r.includes(n) && e.push({
    id: r || "root",
    label: r.endsWith("/") ? r.slice(0, r.length - 1) : r || "Root",
    tags: t.namespaced ? [gc] : []
  }), Object.keys(t._children).forEach(function(s) {
    Lc(e, t._children[s], n, r + s + "/");
  });
}
function A4(e, t, n) {
  t = n === "root" ? t : t[n];
  var r = Object.keys(t), s = {
    state: Object.keys(e.state).map(function(o) {
      return {
        key: o,
        editable: !0,
        value: e.state[o]
      };
    })
  };
  if (r.length) {
    var i = S4(t);
    s.getters = Object.keys(i).map(function(o) {
      return {
        key: o.endsWith("/") ? mc(o) : o,
        editable: !1,
        value: p1(function() {
          return i[o];
        })
      };
    });
  }
  return s;
}
function S4(e) {
  var t = {};
  return Object.keys(e).forEach(function(n) {
    var r = n.split("/");
    if (r.length > 1) {
      var s = t, i = r.pop();
      r.forEach(function(o) {
        s[o] || (s[o] = {
          _custom: {
            value: {},
            display: o,
            tooltip: "Module",
            abstract: !0
          }
        }), s = s[o]._custom.value;
      }), s[i] = p1(function() {
        return e[n];
      });
    } else
      t[n] = p1(function() {
        return e[n];
      });
  }), t;
}
function R4(e, t) {
  var n = t.split("/").filter(function(r) {
    return r;
  });
  return n.reduce(
    function(r, s, i) {
      var o = r[s];
      if (!o)
        throw new Error('Missing module "' + s + '" for path "' + t + '".');
      return i === n.length - 1 ? o : o._children;
    },
    t === "root" ? e : e.root._children
  );
}
function p1(e) {
  try {
    return e();
  } catch (t) {
    return t;
  }
}
var Te = function(e, t) {
  this.runtime = t, this._children = /* @__PURE__ */ Object.create(null), this._rawModule = e;
  var n = e.state;
  this.state = (typeof n == "function" ? n() : n) || {};
}, yc = { namespaced: { configurable: !0 } };
yc.namespaced.get = function() {
  return !!this._rawModule.namespaced;
};
Te.prototype.addChild = function(e, t) {
  this._children[e] = t;
};
Te.prototype.removeChild = function(e) {
  delete this._children[e];
};
Te.prototype.getChild = function(e) {
  return this._children[e];
};
Te.prototype.hasChild = function(e) {
  return e in this._children;
};
Te.prototype.update = function(e) {
  this._rawModule.namespaced = e.namespaced, e.actions && (this._rawModule.actions = e.actions), e.mutations && (this._rawModule.mutations = e.mutations), e.getters && (this._rawModule.getters = e.getters);
};
Te.prototype.forEachChild = function(e) {
  ar(this._children, e);
};
Te.prototype.forEachGetter = function(e) {
  this._rawModule.getters && ar(this._rawModule.getters, e);
};
Te.prototype.forEachAction = function(e) {
  this._rawModule.actions && ar(this._rawModule.actions, e);
};
Te.prototype.forEachMutation = function(e) {
  this._rawModule.mutations && ar(this._rawModule.mutations, e);
};
Object.defineProperties(Te.prototype, yc);
var In = function(e) {
  this.register([], e, !1);
};
In.prototype.get = function(e) {
  return e.reduce(function(t, n) {
    return t.getChild(n);
  }, this.root);
};
In.prototype.getNamespace = function(e) {
  var t = this.root;
  return e.reduce(function(n, r) {
    return t = t.getChild(r), n + (t.namespaced ? r + "/" : "");
  }, "");
};
In.prototype.update = function(e) {
  vc([], this.root, e);
};
In.prototype.register = function(e, t, n) {
  var r = this;
  n === void 0 && (n = !0);
  var s = new Te(t, n);
  if (e.length === 0)
    this.root = s;
  else {
    var i = this.get(e.slice(0, -1));
    i.addChild(e[e.length - 1], s);
  }
  t.modules && ar(t.modules, function(o, a) {
    r.register(e.concat(a), o, n);
  });
};
In.prototype.unregister = function(e) {
  var t = this.get(e.slice(0, -1)), n = e[e.length - 1], r = t.getChild(n);
  !r || !r.runtime || t.removeChild(n);
};
In.prototype.isRegistered = function(e) {
  var t = this.get(e.slice(0, -1)), n = e[e.length - 1];
  return t ? t.hasChild(n) : !1;
};
function vc(e, t, n) {
  if (t.update(n), n.modules)
    for (var r in n.modules) {
      if (!t.getChild(r))
        return;
      vc(
        e.concat(r),
        t.getChild(r),
        n.modules[r]
      );
    }
}
function I4(e) {
  return new le(e);
}
var le = function(e) {
  var t = this;
  e === void 0 && (e = {});
  var n = e.plugins;
  n === void 0 && (n = []);
  var r = e.strict;
  r === void 0 && (r = !1);
  var s = e.devtools;
  this._committing = !1, this._actions = /* @__PURE__ */ Object.create(null), this._actionSubscribers = [], this._mutations = /* @__PURE__ */ Object.create(null), this._wrappedGetters = /* @__PURE__ */ Object.create(null), this._modules = new In(e), this._modulesNamespaceMap = /* @__PURE__ */ Object.create(null), this._subscribers = [], this._makeLocalGettersCache = /* @__PURE__ */ Object.create(null), this._scope = null, this._devtools = s;
  var i = this, o = this, a = o.dispatch, l = o.commit;
  this.dispatch = function(u, d) {
    return a.call(i, u, d);
  }, this.commit = function(u, d, f) {
    return l.call(i, u, d, f);
  }, this.strict = r;
  var c = this._modules.root.state;
  oi(this, c, [], this._modules.root), X1(this, c), n.forEach(function(u) {
    return u(t);
  });
}, to = { state: { configurable: !0 } };
le.prototype.install = function(e, t) {
  e.provide(t || g4, this), e.config.globalProperties.$store = this;
  var n = this._devtools !== void 0 ? this._devtools : !1;
  n && k4(e, this);
};
to.state.get = function() {
  return this._state.data;
};
to.state.set = function(e) {
};
le.prototype.commit = function(e, t, n) {
  var r = this, s = Is(e, t, n), i = s.type, o = s.payload, a = { type: i, payload: o }, l = this._mutations[i];
  !l || (this._withCommit(function() {
    l.forEach(function(c) {
      c(o);
    });
  }), this._subscribers.slice().forEach(function(c) {
    return c(a, r.state);
  }));
};
le.prototype.dispatch = function(e, t) {
  var n = this, r = Is(e, t), s = r.type, i = r.payload, o = { type: s, payload: i }, a = this._actions[s];
  if (a) {
    try {
      this._actionSubscribers.slice().filter(function(c) {
        return c.before;
      }).forEach(function(c) {
        return c.before(o, n.state);
      });
    } catch {
    }
    var l = a.length > 1 ? Promise.all(a.map(function(c) {
      return c(i);
    })) : a[0](i);
    return new Promise(function(c, u) {
      l.then(function(d) {
        try {
          n._actionSubscribers.filter(function(f) {
            return f.after;
          }).forEach(function(f) {
            return f.after(o, n.state);
          });
        } catch {
        }
        c(d);
      }, function(d) {
        try {
          n._actionSubscribers.filter(function(f) {
            return f.error;
          }).forEach(function(f) {
            return f.error(o, n.state, d);
          });
        } catch {
        }
        u(d);
      });
    });
  }
};
le.prototype.subscribe = function(e, t) {
  return dc(e, this._subscribers, t);
};
le.prototype.subscribeAction = function(e, t) {
  var n = typeof e == "function" ? { before: e } : e;
  return dc(n, this._actionSubscribers, t);
};
le.prototype.watch = function(e, t, n) {
  var r = this;
  return Tr(function() {
    return e(r.state, r.getters);
  }, t, Object.assign({}, n));
};
le.prototype.replaceState = function(e) {
  var t = this;
  this._withCommit(function() {
    t._state.data = e;
  });
};
le.prototype.registerModule = function(e, t, n) {
  n === void 0 && (n = {}), typeof e == "string" && (e = [e]), this._modules.register(e, t), oi(this, this.state, e, this._modules.get(e), n.preserveState), X1(this, this.state);
};
le.prototype.unregisterModule = function(e) {
  var t = this;
  typeof e == "string" && (e = [e]), this._modules.unregister(e), this._withCommit(function() {
    var n = J1(t.state, e.slice(0, -1));
    delete n[e[e.length - 1]];
  }), pc(this);
};
le.prototype.hasModule = function(e) {
  return typeof e == "string" && (e = [e]), this._modules.isRegistered(e);
};
le.prototype.hotUpdate = function(e) {
  this._modules.update(e), pc(this, !0);
};
le.prototype._withCommit = function(e) {
  var t = this._committing;
  this._committing = !0, e(), this._committing = t;
};
Object.defineProperties(le.prototype, to);
var eo = so(function(e, t) {
  var n = {};
  return ro(t).forEach(function(r) {
    var s = r.key, i = r.val;
    n[s] = function() {
      var o = this.$store.state, a = this.$store.getters;
      if (e) {
        var l = io(this.$store, "mapState", e);
        if (!l)
          return;
        o = l.context.state, a = l.context.getters;
      }
      return typeof i == "function" ? i.call(this, o, a) : o[i];
    }, n[s].vuex = !0;
  }), n;
}), no = so(function(e, t) {
  var n = {};
  return ro(t).forEach(function(r) {
    var s = r.key, i = r.val;
    n[s] = function() {
      for (var o = [], a = arguments.length; a--; )
        o[a] = arguments[a];
      var l = this.$store.commit;
      if (e) {
        var c = io(this.$store, "mapMutations", e);
        if (!c)
          return;
        l = c.context.commit;
      }
      return typeof i == "function" ? i.apply(this, [l].concat(o)) : l.apply(this.$store, [i].concat(o));
    };
  }), n;
}), ge = so(function(e, t) {
  var n = {};
  return ro(t).forEach(function(r) {
    var s = r.key, i = r.val;
    i = e + i, n[s] = function() {
      if (!(e && !io(this.$store, "mapGetters", e)))
        return this.$store.getters[i];
    }, n[s].vuex = !0;
  }), n;
});
function ro(e) {
  return O4(e) ? Array.isArray(e) ? e.map(function(t) {
    return { key: t, val: t };
  }) : Object.keys(e).map(function(t) {
    return { key: t, val: e[t] };
  }) : [];
}
function O4(e) {
  return Array.isArray(e) || uc(e);
}
function so(e) {
  return function(t, n) {
    return typeof t != "string" ? (n = t, t = "") : t.charAt(t.length - 1) !== "/" && (t += "/"), e(t, n);
  };
}
function io(e, t, n) {
  var r = e._modulesNamespaceMap[n];
  return r;
}
var N4 = typeof ss == "object" && ss && ss.Object === Object && ss, bc = N4, P4 = bc, M4 = typeof self == "object" && self && self.Object === Object && self, F4 = P4 || M4 || Function("return this")(), On = F4, z4 = On, D4 = function() {
  return z4.Date.now();
}, B4 = D4;
String.prototype.seed = String.prototype.seed || Math.round(Math.random() * Math.pow(2, 32));
String.prototype.hashCode = function() {
  const e = this.toString();
  let t, n;
  const r = e.length & 3, s = e.length - r;
  let i = String.prototype.seed;
  const o = 3432918353, a = 461845907;
  let l = 0;
  for (; l < s; )
    n = e.charCodeAt(l) & 255 | (e.charCodeAt(++l) & 255) << 8 | (e.charCodeAt(++l) & 255) << 16 | (e.charCodeAt(++l) & 255) << 24, ++l, n = (n & 65535) * o + (((n >>> 16) * o & 65535) << 16) & 4294967295, n = n << 15 | n >>> 17, n = (n & 65535) * a + (((n >>> 16) * a & 65535) << 16) & 4294967295, i ^= n, i = i << 13 | i >>> 19, t = (i & 65535) * 5 + (((i >>> 16) * 5 & 65535) << 16) & 4294967295, i = (t & 65535) + 27492 + (((t >>> 16) + 58964 & 65535) << 16);
  switch (n = 0, r) {
    case 3:
      n ^= (e.charCodeAt(l + 2) & 255) << 16;
    case 2:
      n ^= (e.charCodeAt(l + 1) & 255) << 8;
    case 1:
      n ^= e.charCodeAt(l) & 255, n = (n & 65535) * o + (((n >>> 16) * o & 65535) << 16) & 4294967295, n = n << 15 | n >>> 17, n = (n & 65535) * a + (((n >>> 16) * a & 65535) << 16) & 4294967295, i ^= n;
  }
  return i ^= e.length, i ^= i >>> 16, i = (i & 65535) * 2246822507 + (((i >>> 16) * 2246822507 & 65535) << 16) & 4294967295, i ^= i >>> 13, i = (i & 65535) * 3266489909 + (((i >>> 16) * 3266489909 & 65535) << 16) & 4294967295, i ^= i >>> 16, i >>> 0;
};
/*! https://mths.be/codepointat v0.2.0 by @mathias */
String.prototype.codePointAt || function() {
  var e = function() {
    let n;
    try {
      const r = {}, s = Object.defineProperty;
      n = s(r, r, r) && s;
    } catch {
    }
    return n;
  }();
  const t = function(n) {
    if (this == null)
      throw TypeError();
    const r = String(this), s = r.length;
    let i = n ? Number(n) : 0;
    if (i !== i && (i = 0), i < 0 || i >= s)
      return;
    const o = r.charCodeAt(i);
    let a;
    return o >= 55296 && o <= 56319 && s > i + 1 && (a = r.charCodeAt(i + 1), a >= 56320 && a <= 57343) ? (o - 55296) * 1024 + a - 56320 + 65536 : o;
  };
  e ? e(String.prototype, "codePointAt", {
    value: t,
    configurable: !0,
    writable: !0
  }) : String.prototype.codePointAt = t;
}();
/*! https://mths.be/fromcodepoint v0.2.1 by @mathias */
String.fromCodePoint || function() {
  const e = function() {
    let s;
    try {
      const i = {}, o = Object.defineProperty;
      s = o(i, i, i) && o;
    } catch {
    }
    return s;
  }(), t = String.fromCharCode, n = Math.floor, r = function(s) {
    const i = [];
    let o, a, l = -1;
    const c = arguments.length;
    if (!c)
      return "";
    let u = "";
    for (; ++l < c; ) {
      let d = Number(arguments[l]);
      if (!isFinite(d) || d < 0 || d > 1114111 || n(d) !== d)
        throw RangeError("Invalid code point: " + d);
      d <= 65535 ? i.push(d) : (d -= 65536, o = (d >> 10) + 55296, a = d % 1024 + 56320, i.push(o, a)), (l + 1 === c || i.length > 16384) && (u += t.apply(null, i), i.length = 0);
    }
    return u;
  };
  e ? e(String, "fromCodePoint", {
    value: r,
    configurable: !0,
    writable: !0
  }) : String.fromCodePoint = r;
}();
class A {
  constructor() {
    this.source = null, this.type = null, this.channel = null, this.start = null, this.stop = null, this.tokenIndex = null, this.line = null, this.column = null, this._text = null;
  }
  getTokenSource() {
    return this.source[0];
  }
  getInputStream() {
    return this.source[1];
  }
  get text() {
    return this._text;
  }
  set text(t) {
    this._text = t;
  }
}
A.INVALID_TYPE = 0;
A.EPSILON = -2;
A.MIN_USER_TOKEN_TYPE = 1;
A.EOF = -1;
A.DEFAULT_CHANNEL = 0;
A.HIDDEN_CHANNEL = 1;
function Jn(e, t) {
  if (!Array.isArray(e) || !Array.isArray(t))
    return !1;
  if (e === t)
    return !0;
  if (e.length !== t.length)
    return !1;
  for (let n = 0; n < e.length; n++)
    if (e[n] !== t[n] && (!e[n].equals || !e[n].equals(t[n])))
      return !1;
  return !0;
}
class fe {
  constructor() {
    this.count = 0, this.hash = 0;
  }
  update() {
    for (let t = 0; t < arguments.length; t++) {
      const n = arguments[t];
      if (n != null)
        if (Array.isArray(n))
          this.update.apply(this, n);
        else {
          let r = 0;
          switch (typeof n) {
            case "undefined":
            case "function":
              continue;
            case "number":
            case "boolean":
              r = n;
              break;
            case "string":
              r = n.hashCode();
              break;
            default:
              n.updateHashCode ? n.updateHashCode(this) : console.log("No updateHashCode for " + n.toString());
              continue;
          }
          r = r * 3432918353, r = r << 15 | r >>> 32 - 15, r = r * 461845907, this.count = this.count + 1;
          let s = this.hash ^ r;
          s = s << 13 | s >>> 32 - 13, s = s * 5 + 3864292196, this.hash = s;
        }
    }
  }
  finish() {
    let t = this.hash ^ this.count * 4;
    return t = t ^ t >>> 16, t = t * 2246822507, t = t ^ t >>> 13, t = t * 3266489909, t = t ^ t >>> 16, t;
  }
  static hashStuff() {
    const t = new fe();
    return t.update.apply(t, arguments), t.finish();
  }
}
function wc(e) {
  return e ? e.hashCode() : -1;
}
function Cc(e, t) {
  return e ? e.equals(t) : e === t;
}
function U4(e) {
  return e === null ? "null" : e;
}
function ln(e) {
  return Array.isArray(e) ? "[" + e.map(U4).join(", ") + "]" : "null";
}
const ds = "h-";
class de {
  constructor(t, n) {
    this.data = {}, this.hashFunction = t || wc, this.equalsFunction = n || Cc;
  }
  add(t) {
    const n = ds + this.hashFunction(t);
    if (n in this.data) {
      const r = this.data[n];
      for (let s = 0; s < r.length; s++)
        if (this.equalsFunction(t, r[s]))
          return r[s];
      return r.push(t), t;
    } else
      return this.data[n] = [t], t;
  }
  has(t) {
    return this.get(t) != null;
  }
  get(t) {
    const n = ds + this.hashFunction(t);
    if (n in this.data) {
      const r = this.data[n];
      for (let s = 0; s < r.length; s++)
        if (this.equalsFunction(t, r[s]))
          return r[s];
    }
    return null;
  }
  values() {
    return Object.keys(this.data).filter((t) => t.startsWith(ds)).flatMap((t) => this.data[t], this);
  }
  toString() {
    return ln(this.values());
  }
  get length() {
    return Object.keys(this.data).filter((t) => t.startsWith(ds)).map((t) => this.data[t].length, this).reduce((t, n) => t + n, 0);
  }
}
class ft {
  hashCode() {
    const t = new fe();
    return this.updateHashCode(t), t.finish();
  }
  evaluate(t, n) {
  }
  evalPrecedence(t, n) {
    return this;
  }
  static andContext(t, n) {
    if (t === null || t === ft.NONE)
      return n;
    if (n === null || n === ft.NONE)
      return t;
    const r = new Ir(t, n);
    return r.opnds.length === 1 ? r.opnds[0] : r;
  }
  static orContext(t, n) {
    if (t === null)
      return n;
    if (n === null)
      return t;
    if (t === ft.NONE || n === ft.NONE)
      return ft.NONE;
    const r = new Or(t, n);
    return r.opnds.length === 1 ? r.opnds[0] : r;
  }
}
class Ir extends ft {
  constructor(t, n) {
    super();
    const r = new de();
    t instanceof Ir ? t.opnds.map(function(i) {
      r.add(i);
    }) : r.add(t), n instanceof Ir ? n.opnds.map(function(i) {
      r.add(i);
    }) : r.add(n);
    const s = _c(r);
    if (s.length > 0) {
      let i = null;
      s.map(function(o) {
        (i === null || o.precedence < i.precedence) && (i = o);
      }), r.add(i);
    }
    this.opnds = Array.from(r.values());
  }
  equals(t) {
    return this === t ? !0 : t instanceof Ir ? Jn(this.opnds, t.opnds) : !1;
  }
  updateHashCode(t) {
    t.update(this.opnds, "AND");
  }
  evaluate(t, n) {
    for (let r = 0; r < this.opnds.length; r++)
      if (!this.opnds[r].evaluate(t, n))
        return !1;
    return !0;
  }
  evalPrecedence(t, n) {
    let r = !1;
    const s = [];
    for (let o = 0; o < this.opnds.length; o++) {
      const a = this.opnds[o], l = a.evalPrecedence(t, n);
      if (r |= l !== a, l === null)
        return null;
      l !== ft.NONE && s.push(l);
    }
    if (!r)
      return this;
    if (s.length === 0)
      return ft.NONE;
    let i = null;
    return s.map(function(o) {
      i = i === null ? o : ft.andContext(i, o);
    }), i;
  }
  toString() {
    const t = this.opnds.map((n) => n.toString());
    return (t.length > 3 ? t.slice(3) : t).join("&&");
  }
}
class Or extends ft {
  constructor(t, n) {
    super();
    const r = new de();
    t instanceof Or ? t.opnds.map(function(i) {
      r.add(i);
    }) : r.add(t), n instanceof Or ? n.opnds.map(function(i) {
      r.add(i);
    }) : r.add(n);
    const s = _c(r);
    if (s.length > 0) {
      const i = s.sort(function(a, l) {
        return a.compareTo(l);
      }), o = i[i.length - 1];
      r.add(o);
    }
    this.opnds = Array.from(r.values());
  }
  equals(t) {
    return this === t ? !0 : t instanceof Or ? Jn(this.opnds, t.opnds) : !1;
  }
  updateHashCode(t) {
    t.update(this.opnds, "OR");
  }
  evaluate(t, n) {
    for (let r = 0; r < this.opnds.length; r++)
      if (this.opnds[r].evaluate(t, n))
        return !0;
    return !1;
  }
  evalPrecedence(t, n) {
    let r = !1;
    for (let s = 0; s < this.opnds.length; s++) {
      const i = this.opnds[s], o = i.evalPrecedence(t, n);
      if (r |= o !== i, o === ft.NONE)
        return ft.NONE;
    }
    return r ? null : this;
  }
  toString() {
    const t = this.opnds.map((n) => n.toString());
    return (t.length > 3 ? t.slice(3) : t).join("||");
  }
}
function _c(e) {
  const t = [];
  return e.values().map(function(n) {
    n instanceof ft.PrecedencePredicate && t.push(n);
  }), t;
}
function Ja(e, t) {
  if (e === null) {
    const n = { state: null, alt: null, context: null, semanticContext: null };
    return t && (n.reachesIntoOuterContext = 0), n;
  } else {
    const n = {};
    return n.state = e.state || null, n.alt = e.alt === void 0 ? null : e.alt, n.context = e.context || null, n.semanticContext = e.semanticContext || null, t && (n.reachesIntoOuterContext = e.reachesIntoOuterContext || 0, n.precedenceFilterSuppressed = e.precedenceFilterSuppressed || !1), n;
  }
}
class Mt {
  constructor(t, n) {
    this.checkContext(t, n), t = Ja(t), n = Ja(n, !0), this.state = t.state !== null ? t.state : n.state, this.alt = t.alt !== null ? t.alt : n.alt, this.context = t.context !== null ? t.context : n.context, this.semanticContext = t.semanticContext !== null ? t.semanticContext : n.semanticContext !== null ? n.semanticContext : ft.NONE, this.reachesIntoOuterContext = n.reachesIntoOuterContext, this.precedenceFilterSuppressed = n.precedenceFilterSuppressed;
  }
  checkContext(t, n) {
    (t.context === null || t.context === void 0) && (n === null || n.context === null || n.context === void 0) && (this.context = null);
  }
  hashCode() {
    const t = new fe();
    return this.updateHashCode(t), t.finish();
  }
  updateHashCode(t) {
    t.update(this.state.stateNumber, this.alt, this.context, this.semanticContext);
  }
  equals(t) {
    return this === t ? !0 : t instanceof Mt ? this.state.stateNumber === t.state.stateNumber && this.alt === t.alt && (this.context === null ? t.context === null : this.context.equals(t.context)) && this.semanticContext.equals(t.semanticContext) && this.precedenceFilterSuppressed === t.precedenceFilterSuppressed : !1;
  }
  hashCodeForConfigSet() {
    const t = new fe();
    return t.update(this.state.stateNumber, this.alt, this.semanticContext), t.finish();
  }
  equalsForConfigSet(t) {
    return this === t ? !0 : t instanceof Mt ? this.state.stateNumber === t.state.stateNumber && this.alt === t.alt && this.semanticContext.equals(t.semanticContext) : !1;
  }
  toString() {
    return "(" + this.state + "," + this.alt + (this.context !== null ? ",[" + this.context.toString() + "]" : "") + (this.semanticContext !== ft.NONE ? "," + this.semanticContext.toString() : "") + (this.reachesIntoOuterContext > 0 ? ",up=" + this.reachesIntoOuterContext : "") + ")";
  }
}
class pt {
  constructor(t, n) {
    this.start = t, this.stop = n;
  }
  clone() {
    return new pt(this.start, this.stop);
  }
  contains(t) {
    return t >= this.start && t < this.stop;
  }
  toString() {
    return this.start === this.stop - 1 ? this.start.toString() : this.start.toString() + ".." + (this.stop - 1).toString();
  }
  get length() {
    return this.stop - this.start;
  }
}
pt.INVALID_INTERVAL = new pt(-1, -2);
class ye {
  constructor() {
    this.intervals = null, this.readOnly = !1;
  }
  first(t) {
    return this.intervals === null || this.intervals.length === 0 ? A.INVALID_TYPE : this.intervals[0].start;
  }
  addOne(t) {
    this.addInterval(new pt(t, t + 1));
  }
  addRange(t, n) {
    this.addInterval(new pt(t, n + 1));
  }
  addInterval(t) {
    if (this.intervals === null)
      this.intervals = [], this.intervals.push(t.clone());
    else {
      for (let n = 0; n < this.intervals.length; n++) {
        const r = this.intervals[n];
        if (t.stop < r.start) {
          this.intervals.splice(n, 0, t);
          return;
        } else if (t.stop === r.start) {
          this.intervals[n] = new pt(t.start, r.stop);
          return;
        } else if (t.start <= r.stop) {
          this.intervals[n] = new pt(Math.min(r.start, t.start), Math.max(r.stop, t.stop)), this.reduce(n);
          return;
        }
      }
      this.intervals.push(t.clone());
    }
  }
  addSet(t) {
    return t.intervals !== null && t.intervals.forEach((n) => this.addInterval(n), this), this;
  }
  reduce(t) {
    if (t < this.intervals.length - 1) {
      const n = this.intervals[t], r = this.intervals[t + 1];
      n.stop >= r.stop ? (this.intervals.splice(t + 1, 1), this.reduce(t)) : n.stop >= r.start && (this.intervals[t] = new pt(n.start, r.stop), this.intervals.splice(t + 1, 1));
    }
  }
  complement(t, n) {
    const r = new ye();
    return r.addInterval(new pt(t, n + 1)), this.intervals !== null && this.intervals.forEach((s) => r.removeRange(s)), r;
  }
  contains(t) {
    if (this.intervals === null)
      return !1;
    for (let n = 0; n < this.intervals.length; n++)
      if (this.intervals[n].contains(t))
        return !0;
    return !1;
  }
  removeRange(t) {
    if (t.start === t.stop - 1)
      this.removeOne(t.start);
    else if (this.intervals !== null) {
      let n = 0;
      for (let r = 0; r < this.intervals.length; r++) {
        const s = this.intervals[n];
        if (t.stop <= s.start)
          return;
        if (t.start > s.start && t.stop < s.stop) {
          this.intervals[n] = new pt(s.start, t.start);
          const i = new pt(t.stop, s.stop);
          this.intervals.splice(n, 0, i);
          return;
        } else
          t.start <= s.start && t.stop >= s.stop ? (this.intervals.splice(n, 1), n = n - 1) : t.start < s.stop ? this.intervals[n] = new pt(s.start, t.start) : t.stop < s.stop && (this.intervals[n] = new pt(t.stop, s.stop));
        n += 1;
      }
    }
  }
  removeOne(t) {
    if (this.intervals !== null)
      for (let n = 0; n < this.intervals.length; n++) {
        const r = this.intervals[n];
        if (t < r.start)
          return;
        if (t === r.start && t === r.stop - 1) {
          this.intervals.splice(n, 1);
          return;
        } else if (t === r.start) {
          this.intervals[n] = new pt(r.start + 1, r.stop);
          return;
        } else if (t === r.stop - 1) {
          this.intervals[n] = new pt(r.start, r.stop - 1);
          return;
        } else if (t < r.stop - 1) {
          const s = new pt(r.start, t);
          r.start = t + 1, this.intervals.splice(n, 0, s);
          return;
        }
      }
  }
  toString(t, n, r) {
    return t = t || null, n = n || null, r = r || !1, this.intervals === null ? "{}" : t !== null || n !== null ? this.toTokenString(t, n) : r ? this.toCharString() : this.toIndexString();
  }
  toCharString() {
    const t = [];
    for (let n = 0; n < this.intervals.length; n++) {
      const r = this.intervals[n];
      r.stop === r.start + 1 ? r.start === A.EOF ? t.push("<EOF>") : t.push("'" + String.fromCharCode(r.start) + "'") : t.push("'" + String.fromCharCode(r.start) + "'..'" + String.fromCharCode(r.stop - 1) + "'");
    }
    return t.length > 1 ? "{" + t.join(", ") + "}" : t[0];
  }
  toIndexString() {
    const t = [];
    for (let n = 0; n < this.intervals.length; n++) {
      const r = this.intervals[n];
      r.stop === r.start + 1 ? r.start === A.EOF ? t.push("<EOF>") : t.push(r.start.toString()) : t.push(r.start.toString() + ".." + (r.stop - 1).toString());
    }
    return t.length > 1 ? "{" + t.join(", ") + "}" : t[0];
  }
  toTokenString(t, n) {
    const r = [];
    for (let s = 0; s < this.intervals.length; s++) {
      const i = this.intervals[s];
      for (let o = i.start; o < i.stop; o++)
        r.push(this.elementName(t, n, o));
    }
    return r.length > 1 ? "{" + r.join(", ") + "}" : r[0];
  }
  elementName(t, n, r) {
    return r === A.EOF ? "<EOF>" : r === A.EPSILON ? "<EPSILON>" : t[r] || n[r];
  }
  get length() {
    return this.intervals.map((t) => t.length).reduce((t, n) => t + n);
  }
}
class $ {
  constructor() {
    this.atn = null, this.stateNumber = $.INVALID_STATE_NUMBER, this.stateType = null, this.ruleIndex = 0, this.epsilonOnlyTransitions = !1, this.transitions = [], this.nextTokenWithinRule = null;
  }
  toString() {
    return this.stateNumber;
  }
  equals(t) {
    return t instanceof $ ? this.stateNumber === t.stateNumber : !1;
  }
  isNonGreedyExitState() {
    return !1;
  }
  addTransition(t, n) {
    n === void 0 && (n = -1), this.transitions.length === 0 ? this.epsilonOnlyTransitions = t.isEpsilon : this.epsilonOnlyTransitions !== t.isEpsilon && (this.epsilonOnlyTransitions = !1), n === -1 ? this.transitions.push(t) : this.transitions.splice(n, 1, t);
  }
}
$.INVALID_TYPE = 0;
$.BASIC = 1;
$.RULE_START = 2;
$.BLOCK_START = 3;
$.PLUS_BLOCK_START = 4;
$.STAR_BLOCK_START = 5;
$.TOKEN_START = 6;
$.RULE_STOP = 7;
$.BLOCK_END = 8;
$.STAR_LOOP_BACK = 9;
$.STAR_LOOP_ENTRY = 10;
$.PLUS_LOOP_BACK = 11;
$.LOOP_END = 12;
$.serializationNames = [
  "INVALID",
  "BASIC",
  "RULE_START",
  "BLOCK_START",
  "PLUS_BLOCK_START",
  "STAR_BLOCK_START",
  "TOKEN_START",
  "RULE_STOP",
  "BLOCK_END",
  "STAR_LOOP_BACK",
  "STAR_LOOP_ENTRY",
  "PLUS_LOOP_BACK",
  "LOOP_END"
];
$.INVALID_STATE_NUMBER = -1;
class Jt extends $ {
  constructor() {
    return super(), this.stateType = $.RULE_STOP, this;
  }
}
class D {
  constructor(t) {
    if (t == null)
      throw "target cannot be null.";
    this.target = t, this.isEpsilon = !1, this.label = null;
  }
}
D.EPSILON = 1;
D.RANGE = 2;
D.RULE = 3;
D.PREDICATE = 4;
D.ATOM = 5;
D.ACTION = 6;
D.SET = 7;
D.NOT_SET = 8;
D.WILDCARD = 9;
D.PRECEDENCE = 10;
D.serializationNames = [
  "INVALID",
  "EPSILON",
  "RANGE",
  "RULE",
  "PREDICATE",
  "ATOM",
  "ACTION",
  "SET",
  "NOT_SET",
  "WILDCARD",
  "PRECEDENCE"
];
D.serializationTypes = {
  EpsilonTransition: D.EPSILON,
  RangeTransition: D.RANGE,
  RuleTransition: D.RULE,
  PredicateTransition: D.PREDICATE,
  AtomTransition: D.ATOM,
  ActionTransition: D.ACTION,
  SetTransition: D.SET,
  NotSetTransition: D.NOT_SET,
  WildcardTransition: D.WILDCARD,
  PrecedencePredicateTransition: D.PRECEDENCE
};
class Os extends D {
  constructor(t, n, r, s) {
    super(t), this.ruleIndex = n, this.precedence = r, this.followState = s, this.serializationType = D.RULE, this.isEpsilon = !0;
  }
  matches(t, n, r) {
    return !1;
  }
}
class oo extends D {
  constructor(t, n) {
    super(t), this.serializationType = D.SET, n != null ? this.label = n : (this.label = new ye(), this.label.addOne(A.INVALID_TYPE));
  }
  matches(t, n, r) {
    return this.label.contains(t);
  }
  toString() {
    return this.label.toString();
  }
}
class ao extends oo {
  constructor(t, n) {
    super(t, n), this.serializationType = D.NOT_SET;
  }
  matches(t, n, r) {
    return t >= n && t <= r && !super.matches(t, n, r);
  }
  toString() {
    return "~" + super.toString();
  }
}
class kc extends D {
  constructor(t) {
    super(t), this.serializationType = D.WILDCARD;
  }
  matches(t, n, r) {
    return t >= n && t <= r;
  }
  toString() {
    return ".";
  }
}
class lo extends D {
  constructor(t) {
    super(t);
  }
}
class H4 {
}
class G4 extends H4 {
}
class Ec extends G4 {
}
class Ns extends Ec {
  getRuleContext() {
    throw new Error("missing interface implementation");
  }
}
class Xe extends Ec {
}
class ai extends Xe {
}
function $4(e, t) {
  return e = e.replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r"), t && (e = e.replace(/ /g, "·")), e;
}
const Pe = {
  toStringTree: function(e, t, n) {
    t = t || null, n = n || null, n !== null && (t = n.ruleNames);
    let r = Pe.getNodeText(e, t);
    r = $4(r, !1);
    const s = e.getChildCount();
    if (s === 0)
      return r;
    let i = "(" + r + " ";
    s > 0 && (r = Pe.toStringTree(e.getChild(0), t), i = i.concat(r));
    for (let o = 1; o < s; o++)
      r = Pe.toStringTree(e.getChild(o), t), i = i.concat(" " + r);
    return i = i.concat(")"), i;
  },
  getNodeText: function(e, t, n) {
    if (t = t || null, n = n || null, n !== null && (t = n.ruleNames), t !== null)
      if (e instanceof Ns) {
        const s = e.getRuleContext().getAltNumber();
        return s != 0 ? t[e.ruleIndex] + ":" + s : t[e.ruleIndex];
      } else {
        if (e instanceof ai)
          return e.toString();
        if (e instanceof Xe && e.symbol !== null)
          return e.symbol.text;
      }
    const r = e.getPayload();
    return r instanceof A ? r.text : e.getPayload().toString();
  },
  getChildren: function(e) {
    const t = [];
    for (let n = 0; n < e.getChildCount(); n++)
      t.push(e.getChild(n));
    return t;
  },
  getAncestors: function(e) {
    let t = [];
    for (e = e.getParent(); e !== null; )
      t = [e].concat(t), e = e.getParent();
    return t;
  },
  findAllTokenNodes: function(e, t) {
    return Pe.findAllNodes(e, t, !0);
  },
  findAllRuleNodes: function(e, t) {
    return Pe.findAllNodes(e, t, !1);
  },
  findAllNodes: function(e, t, n) {
    const r = [];
    return Pe._findAllNodes(e, t, n, r), r;
  },
  _findAllNodes: function(e, t, n, r) {
    n && e instanceof Xe ? e.symbol.type === t && r.push(e) : !n && e instanceof Ns && e.ruleIndex === t && r.push(e);
    for (let s = 0; s < e.getChildCount(); s++)
      Pe._findAllNodes(e.getChild(s), t, n, r);
  },
  descendants: function(e) {
    let t = [e];
    for (let n = 0; n < e.getChildCount(); n++)
      t = t.concat(Pe.descendants(e.getChild(n)));
    return t;
  }
};
class tr extends Ns {
  constructor(t, n) {
    super(), this.parentCtx = t || null, this.invokingState = n || -1;
  }
  depth() {
    let t = 0, n = this;
    for (; n !== null; )
      n = n.parentCtx, t += 1;
    return t;
  }
  isEmpty() {
    return this.invokingState === -1;
  }
  getSourceInterval() {
    return pt.INVALID_INTERVAL;
  }
  getRuleContext() {
    return this;
  }
  getPayload() {
    return this;
  }
  getText() {
    return this.getChildCount() === 0 ? "" : this.children.map(function(t) {
      return t.getText();
    }).join("");
  }
  getAltNumber() {
    return 0;
  }
  setAltNumber(t) {
  }
  getChild(t) {
    return null;
  }
  getChildCount() {
    return 0;
  }
  accept(t) {
    return t.visitChildren(this);
  }
  toStringTree(t, n) {
    return Pe.toStringTree(this, t, n);
  }
  toString(t, n) {
    t = t || null, n = n || null;
    let r = this, s = "[";
    for (; r !== null && r !== n; ) {
      if (t === null)
        r.isEmpty() || (s += r.invokingState);
      else {
        const i = r.ruleIndex, o = i >= 0 && i < t.length ? t[i] : "" + i;
        s += o;
      }
      r.parentCtx !== null && (t !== null || !r.parentCtx.isEmpty()) && (s += " "), r = r.parentCtx;
    }
    return s += "]", s;
  }
}
class it {
  constructor(t) {
    this.cachedHashCode = t;
  }
  isEmpty() {
    return this === it.EMPTY;
  }
  hasEmptyPath() {
    return this.getReturnState(this.length - 1) === it.EMPTY_RETURN_STATE;
  }
  hashCode() {
    return this.cachedHashCode;
  }
  updateHashCode(t) {
    t.update(this.cachedHashCode);
  }
}
it.EMPTY = null;
it.EMPTY_RETURN_STATE = 2147483647;
it.globalNodeCount = 1;
it.id = it.globalNodeCount;
class Ge extends it {
  constructor(t, n) {
    const r = new fe();
    r.update(t, n);
    const s = r.finish();
    return super(s), this.parents = t, this.returnStates = n, this;
  }
  isEmpty() {
    return this.returnStates[0] === it.EMPTY_RETURN_STATE;
  }
  getParent(t) {
    return this.parents[t];
  }
  getReturnState(t) {
    return this.returnStates[t];
  }
  equals(t) {
    return this === t ? !0 : t instanceof Ge ? this.hashCode() !== t.hashCode() ? !1 : Jn(this.returnStates, t.returnStates) && Jn(this.parents, t.parents) : !1;
  }
  toString() {
    if (this.isEmpty())
      return "[]";
    {
      let t = "[";
      for (let n = 0; n < this.returnStates.length; n++) {
        if (n > 0 && (t = t + ", "), this.returnStates[n] === it.EMPTY_RETURN_STATE) {
          t = t + "$";
          continue;
        }
        t = t + this.returnStates[n], this.parents[n] !== null ? t = t + " " + this.parents[n] : t = t + "null";
      }
      return t + "]";
    }
  }
  get length() {
    return this.returnStates.length;
  }
}
class ee extends it {
  constructor(t, n) {
    let r = 0;
    const s = new fe();
    t !== null ? s.update(t, n) : s.update(1), r = s.finish(), super(r), this.parentCtx = t, this.returnState = n;
  }
  getParent(t) {
    return this.parentCtx;
  }
  getReturnState(t) {
    return this.returnState;
  }
  equals(t) {
    return this === t ? !0 : t instanceof ee ? this.hashCode() !== t.hashCode() || this.returnState !== t.returnState ? !1 : this.parentCtx == null ? t.parentCtx == null : this.parentCtx.equals(t.parentCtx) : !1;
  }
  toString() {
    const t = this.parentCtx === null ? "" : this.parentCtx.toString();
    return t.length === 0 ? this.returnState === it.EMPTY_RETURN_STATE ? "$" : "" + this.returnState : "" + this.returnState + " " + t;
  }
  get length() {
    return 1;
  }
  static create(t, n) {
    return n === it.EMPTY_RETURN_STATE && t === null ? it.EMPTY : new ee(t, n);
  }
}
class f1 extends ee {
  constructor() {
    super(null, it.EMPTY_RETURN_STATE);
  }
  isEmpty() {
    return !0;
  }
  getParent(t) {
    return null;
  }
  getReturnState(t) {
    return this.returnState;
  }
  equals(t) {
    return this === t;
  }
  toString() {
    return "$";
  }
}
it.EMPTY = new f1();
const br = "h-";
class Zr {
  constructor(t, n) {
    this.data = {}, this.hashFunction = t || wc, this.equalsFunction = n || Cc;
  }
  set(t, n) {
    const r = br + this.hashFunction(t);
    if (r in this.data) {
      const s = this.data[r];
      for (let i = 0; i < s.length; i++) {
        const o = s[i];
        if (this.equalsFunction(t, o.key)) {
          const a = o.value;
          return o.value = n, a;
        }
      }
      return s.push({ key: t, value: n }), n;
    } else
      return this.data[r] = [{ key: t, value: n }], n;
  }
  containsKey(t) {
    const n = br + this.hashFunction(t);
    if (n in this.data) {
      const r = this.data[n];
      for (let s = 0; s < r.length; s++) {
        const i = r[s];
        if (this.equalsFunction(t, i.key))
          return !0;
      }
    }
    return !1;
  }
  get(t) {
    const n = br + this.hashFunction(t);
    if (n in this.data) {
      const r = this.data[n];
      for (let s = 0; s < r.length; s++) {
        const i = r[s];
        if (this.equalsFunction(t, i.key))
          return i.value;
      }
    }
    return null;
  }
  entries() {
    return Object.keys(this.data).filter((t) => t.startsWith(br)).flatMap((t) => this.data[t], this);
  }
  getKeys() {
    return this.entries().map((t) => t.key);
  }
  getValues() {
    return this.entries().map((t) => t.value);
  }
  toString() {
    return "[" + this.entries().map((t) => "{" + t.key + ":" + t.value + "}").join(", ") + "]";
  }
  get length() {
    return Object.keys(this.data).filter((t) => t.startsWith(br)).map((t) => this.data[t].length, this).reduce((t, n) => t + n, 0);
  }
}
function co(e, t) {
  if (t == null && (t = tr.EMPTY), t.parentCtx === null || t === tr.EMPTY)
    return it.EMPTY;
  const n = co(e, t.parentCtx), r = e.states[t.invokingState].transitions[0];
  return ee.create(n, r.followState.stateNumber);
}
function Tc(e, t, n) {
  if (e.isEmpty())
    return e;
  let r = n.get(e) || null;
  if (r !== null)
    return r;
  if (r = t.get(e), r !== null)
    return n.set(e, r), r;
  let s = !1, i = [];
  for (let a = 0; a < i.length; a++) {
    const l = Tc(e.getParent(a), t, n);
    if (s || l !== e.getParent(a)) {
      if (!s) {
        i = [];
        for (let c = 0; c < e.length; c++)
          i[c] = e.getParent(c);
        s = !0;
      }
      i[a] = l;
    }
  }
  if (!s)
    return t.add(e), n.set(e, e), e;
  let o = null;
  return i.length === 0 ? o = it.EMPTY : i.length === 1 ? o = ee.create(i[0], e.getReturnState(0)) : o = new Ge(i, e.returnStates), t.add(o), n.set(o, o), n.set(e, o), o;
}
function ho(e, t, n, r) {
  if (e === t)
    return e;
  if (e instanceof ee && t instanceof ee)
    return q4(e, t, n, r);
  if (n) {
    if (e instanceof f1)
      return e;
    if (t instanceof f1)
      return t;
  }
  return e instanceof ee && (e = new Ge([e.getParent()], [e.returnState])), t instanceof ee && (t = new Ge([t.getParent()], [t.returnState])), j4(e, t, n, r);
}
function j4(e, t, n, r) {
  if (r !== null) {
    let u = r.get(e, t);
    if (u !== null || (u = r.get(t, e), u !== null))
      return u;
  }
  let s = 0, i = 0, o = 0, a = [], l = [];
  for (; s < e.returnStates.length && i < t.returnStates.length; ) {
    const u = e.parents[s], d = t.parents[i];
    if (e.returnStates[s] === t.returnStates[i]) {
      const f = e.returnStates[s];
      f === it.EMPTY_RETURN_STATE && u === null && d === null || u !== null && d !== null && u === d ? (l[o] = u, a[o] = f) : (l[o] = ho(u, d, n, r), a[o] = f), s += 1, i += 1;
    } else
      e.returnStates[s] < t.returnStates[i] ? (l[o] = u, a[o] = e.returnStates[s], s += 1) : (l[o] = d, a[o] = t.returnStates[i], i += 1);
    o += 1;
  }
  if (s < e.returnStates.length)
    for (let u = s; u < e.returnStates.length; u++)
      l[o] = e.parents[u], a[o] = e.returnStates[u], o += 1;
  else
    for (let u = i; u < t.returnStates.length; u++)
      l[o] = t.parents[u], a[o] = t.returnStates[u], o += 1;
  if (o < l.length) {
    if (o === 1) {
      const u = ee.create(
        l[0],
        a[0]
      );
      return r !== null && r.set(e, t, u), u;
    }
    l = l.slice(0, o), a = a.slice(0, o);
  }
  const c = new Ge(l, a);
  return c === e ? (r !== null && r.set(e, t, e), e) : c === t ? (r !== null && r.set(e, t, t), t) : (V4(l), r !== null && r.set(e, t, c), c);
}
function V4(e) {
  const t = new Zr();
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    t.containsKey(r) || t.set(r, r);
  }
  for (let n = 0; n < e.length; n++)
    e[n] = t.get(e[n]);
}
function q4(e, t, n, r) {
  if (r !== null) {
    let i = r.get(e, t);
    if (i !== null || (i = r.get(t, e), i !== null))
      return i;
  }
  const s = Z4(e, t, n);
  if (s !== null)
    return r !== null && r.set(e, t, s), s;
  if (e.returnState === t.returnState) {
    const i = ho(e.parentCtx, t.parentCtx, n, r);
    if (i === e.parentCtx)
      return e;
    if (i === t.parentCtx)
      return t;
    const o = ee.create(i, e.returnState);
    return r !== null && r.set(e, t, o), o;
  } else {
    let i = null;
    if ((e === t || e.parentCtx !== null && e.parentCtx === t.parentCtx) && (i = e.parentCtx), i !== null) {
      const c = [e.returnState, t.returnState];
      e.returnState > t.returnState && (c[0] = t.returnState, c[1] = e.returnState);
      const u = [i, i], d = new Ge(u, c);
      return r !== null && r.set(e, t, d), d;
    }
    const o = [e.returnState, t.returnState];
    let a = [e.parentCtx, t.parentCtx];
    e.returnState > t.returnState && (o[0] = t.returnState, o[1] = e.returnState, a = [t.parentCtx, e.parentCtx]);
    const l = new Ge(a, o);
    return r !== null && r.set(e, t, l), l;
  }
}
function Z4(e, t, n) {
  if (n) {
    if (e === it.EMPTY || t === it.EMPTY)
      return it.EMPTY;
  } else {
    if (e === it.EMPTY && t === it.EMPTY)
      return it.EMPTY;
    if (e === it.EMPTY) {
      const r = [
        t.returnState,
        it.EMPTY_RETURN_STATE
      ], s = [t.parentCtx, null];
      return new Ge(s, r);
    } else if (t === it.EMPTY) {
      const r = [e.returnState, it.EMPTY_RETURN_STATE], s = [e.parentCtx, null];
      return new Ge(s, r);
    }
  }
  return null;
}
class Ue {
  constructor() {
    this.data = [];
  }
  add(t) {
    this.data[t] = !0;
  }
  or(t) {
    Object.keys(t.data).map((n) => this.add(n), this);
  }
  remove(t) {
    delete this.data[t];
  }
  has(t) {
    return this.data[t] === !0;
  }
  values() {
    return Object.keys(this.data);
  }
  minValue() {
    return Math.min.apply(null, this.values());
  }
  hashCode() {
    return fe.hashStuff(this.values());
  }
  equals(t) {
    return t instanceof Ue && Jn(this.data, t.data);
  }
  toString() {
    return "{" + this.values().join(", ") + "}";
  }
  get length() {
    return this.values().length;
  }
}
class er {
  constructor(t) {
    this.atn = t;
  }
  getDecisionLookahead(t) {
    if (t === null)
      return null;
    const n = t.transitions.length, r = [];
    for (let s = 0; s < n; s++) {
      r[s] = new ye();
      const i = new de(), o = !1;
      this._LOOK(
        t.transition(s).target,
        null,
        it.EMPTY,
        r[s],
        i,
        new Ue(),
        o,
        !1
      ), (r[s].length === 0 || r[s].contains(er.HIT_PRED)) && (r[s] = null);
    }
    return r;
  }
  LOOK(t, n, r) {
    const s = new ye(), i = !0;
    r = r || null;
    const o = r !== null ? co(t.atn, r) : null;
    return this._LOOK(t, n, o, s, new de(), new Ue(), i, !0), s;
  }
  _LOOK(t, n, r, s, i, o, a, l) {
    const c = new Mt({ state: t, alt: 0, context: r }, null);
    if (!i.has(c)) {
      if (i.add(c), t === n) {
        if (r === null) {
          s.addOne(A.EPSILON);
          return;
        } else if (r.isEmpty() && l) {
          s.addOne(A.EOF);
          return;
        }
      }
      if (t instanceof Jt) {
        if (r === null) {
          s.addOne(A.EPSILON);
          return;
        } else if (r.isEmpty() && l) {
          s.addOne(A.EOF);
          return;
        }
        if (r !== it.EMPTY) {
          const u = o.has(t.ruleIndex);
          try {
            o.remove(t.ruleIndex);
            for (let d = 0; d < r.length; d++) {
              const f = this.atn.states[r.getReturnState(d)];
              this._LOOK(f, n, r.getParent(d), s, i, o, a, l);
            }
          } finally {
            u && o.add(t.ruleIndex);
          }
          return;
        }
      }
      for (let u = 0; u < t.transitions.length; u++) {
        const d = t.transitions[u];
        if (d.constructor === Os) {
          if (o.has(d.target.ruleIndex))
            continue;
          const f = ee.create(r, d.followState.stateNumber);
          try {
            o.add(d.target.ruleIndex), this._LOOK(d.target, n, f, s, i, o, a, l);
          } finally {
            o.remove(d.target.ruleIndex);
          }
        } else if (d instanceof lo)
          a ? this._LOOK(d.target, n, r, s, i, o, a, l) : s.addOne(er.HIT_PRED);
        else if (d.isEpsilon)
          this._LOOK(d.target, n, r, s, i, o, a, l);
        else if (d.constructor === kc)
          s.addRange(A.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType);
        else {
          let f = d.label;
          f !== null && (d instanceof ao && (f = f.complement(A.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType)), s.addSet(f));
        }
      }
    }
  }
}
er.HIT_PRED = A.INVALID_TYPE;
class St {
  constructor(t, n) {
    this.grammarType = t, this.maxTokenType = n, this.states = [], this.decisionToState = [], this.ruleToStartState = [], this.ruleToStopState = null, this.modeNameToStartState = {}, this.ruleToTokenType = null, this.lexerActions = null, this.modeToStartState = [];
  }
  nextTokensInContext(t, n) {
    return new er(this).LOOK(t, null, n);
  }
  nextTokensNoContext(t) {
    return t.nextTokenWithinRule !== null || (t.nextTokenWithinRule = this.nextTokensInContext(t, null), t.nextTokenWithinRule.readOnly = !0), t.nextTokenWithinRule;
  }
  nextTokens(t, n) {
    return n === void 0 ? this.nextTokensNoContext(t) : this.nextTokensInContext(t, n);
  }
  addState(t) {
    t !== null && (t.atn = this, t.stateNumber = this.states.length), this.states.push(t);
  }
  removeState(t) {
    this.states[t.stateNumber] = null;
  }
  defineDecisionState(t) {
    return this.decisionToState.push(t), t.decision = this.decisionToState.length - 1, t.decision;
  }
  getDecisionState(t) {
    return this.decisionToState.length === 0 ? null : this.decisionToState[t];
  }
  getExpectedTokens(t, n) {
    if (t < 0 || t >= this.states.length)
      throw "Invalid state number.";
    const r = this.states[t];
    let s = this.nextTokens(r);
    if (!s.contains(A.EPSILON))
      return s;
    const i = new ye();
    for (i.addSet(s), i.removeOne(A.EPSILON); n !== null && n.invokingState >= 0 && s.contains(A.EPSILON); ) {
      const o = this.states[n.invokingState].transitions[0];
      s = this.nextTokens(o.followState), i.addSet(s), i.removeOne(A.EPSILON), n = n.parentCtx;
    }
    return s.contains(A.EPSILON) && i.addOne(A.EOF), i;
  }
}
St.INVALID_ALT_NUMBER = 0;
const ps = {
  LEXER: 0,
  PARSER: 1
};
class tl extends $ {
  constructor() {
    super(), this.stateType = $.BASIC;
  }
}
class lr extends $ {
  constructor() {
    return super(), this.decision = -1, this.nonGreedy = !1, this;
  }
}
class Yn extends lr {
  constructor() {
    return super(), this.endState = null, this;
  }
}
class Hi extends $ {
  constructor() {
    return super(), this.stateType = $.BLOCK_END, this.startState = null, this;
  }
}
class Hn extends $ {
  constructor() {
    return super(), this.stateType = $.LOOP_END, this.loopBackState = null, this;
  }
}
class el extends $ {
  constructor() {
    return super(), this.stateType = $.RULE_START, this.stopState = null, this.isPrecedenceRule = !1, this;
  }
}
class W4 extends lr {
  constructor() {
    return super(), this.stateType = $.TOKEN_START, this;
  }
}
class nl extends lr {
  constructor() {
    return super(), this.stateType = $.PLUS_LOOP_BACK, this;
  }
}
class Gi extends $ {
  constructor() {
    return super(), this.stateType = $.STAR_LOOP_BACK, this;
  }
}
class bn extends lr {
  constructor() {
    return super(), this.stateType = $.STAR_LOOP_ENTRY, this.loopBackState = null, this.isPrecedenceDecision = null, this;
  }
}
class $i extends Yn {
  constructor() {
    return super(), this.stateType = $.PLUS_BLOCK_START, this.loopBackState = null, this;
  }
}
class ji extends Yn {
  constructor() {
    return super(), this.stateType = $.STAR_BLOCK_START, this;
  }
}
class rl extends Yn {
  constructor() {
    return super(), this.stateType = $.BLOCK_START, this;
  }
}
class Cs extends D {
  constructor(t, n) {
    super(t), this.label_ = n, this.label = this.makeLabel(), this.serializationType = D.ATOM;
  }
  makeLabel() {
    const t = new ye();
    return t.addOne(this.label_), t;
  }
  matches(t, n, r) {
    return this.label_ === t;
  }
  toString() {
    return this.label_;
  }
}
class sl extends D {
  constructor(t, n, r) {
    super(t), this.serializationType = D.RANGE, this.start = n, this.stop = r, this.label = this.makeLabel();
  }
  makeLabel() {
    const t = new ye();
    return t.addRange(this.start, this.stop), t;
  }
  matches(t, n, r) {
    return t >= this.start && t <= this.stop;
  }
  toString() {
    return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
  }
}
class Ac extends D {
  constructor(t, n, r, s) {
    super(t), this.serializationType = D.ACTION, this.ruleIndex = n, this.actionIndex = r === void 0 ? -1 : r, this.isCtxDependent = s === void 0 ? !1 : s, this.isEpsilon = !0;
  }
  matches(t, n, r) {
    return !1;
  }
  toString() {
    return "action_" + this.ruleIndex + ":" + this.actionIndex;
  }
}
class wr extends D {
  constructor(t, n) {
    super(t), this.serializationType = D.EPSILON, this.isEpsilon = !0, this.outermostPrecedenceReturn = n;
  }
  matches(t, n, r) {
    return !1;
  }
  toString() {
    return "epsilon";
  }
}
class li extends ft {
  constructor(t, n, r) {
    super(), this.ruleIndex = t === void 0 ? -1 : t, this.predIndex = n === void 0 ? -1 : n, this.isCtxDependent = r === void 0 ? !1 : r;
  }
  evaluate(t, n) {
    const r = this.isCtxDependent ? n : null;
    return t.sempred(r, this.ruleIndex, this.predIndex);
  }
  updateHashCode(t) {
    t.update(this.ruleIndex, this.predIndex, this.isCtxDependent);
  }
  equals(t) {
    return this === t ? !0 : t instanceof li ? this.ruleIndex === t.ruleIndex && this.predIndex === t.predIndex && this.isCtxDependent === t.isCtxDependent : !1;
  }
  toString() {
    return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
  }
}
ft.NONE = new li();
class Sc extends lo {
  constructor(t, n, r, s) {
    super(t), this.serializationType = D.PREDICATE, this.ruleIndex = n, this.predIndex = r, this.isCtxDependent = s, this.isEpsilon = !0;
  }
  matches(t, n, r) {
    return !1;
  }
  getPredicate() {
    return new li(this.ruleIndex, this.predIndex, this.isCtxDependent);
  }
  toString() {
    return "pred_" + this.ruleIndex + ":" + this.predIndex;
  }
}
class ci extends ft {
  constructor(t) {
    super(), this.precedence = t === void 0 ? 0 : t;
  }
  evaluate(t, n) {
    return t.precpred(n, this.precedence);
  }
  evalPrecedence(t, n) {
    return t.precpred(n, this.precedence) ? ft.NONE : null;
  }
  compareTo(t) {
    return this.precedence - t.precedence;
  }
  updateHashCode(t) {
    t.update(this.precedence);
  }
  equals(t) {
    return this === t ? !0 : t instanceof ci ? this.precedence === t.precedence : !1;
  }
  toString() {
    return "{" + this.precedence + ">=prec}?";
  }
}
ft.PrecedencePredicate = ci;
class Y4 extends lo {
  constructor(t, n) {
    super(t), this.serializationType = D.PRECEDENCE, this.precedence = n, this.isEpsilon = !0;
  }
  matches(t, n, r) {
    return !1;
  }
  getPredicate() {
    return new ci(this.precedence);
  }
  toString() {
    return this.precedence + " >= _p";
  }
}
class $r {
  constructor(t) {
    t === void 0 && (t = null), this.readOnly = !1, this.verifyATN = t === null ? !0 : t.verifyATN, this.generateRuleBypassTransitions = t === null ? !1 : t.generateRuleBypassTransitions;
  }
}
$r.defaultOptions = new $r();
$r.defaultOptions.readOnly = !0;
const Zt = {
  CHANNEL: 0,
  CUSTOM: 1,
  MODE: 2,
  MORE: 3,
  POP_MODE: 4,
  PUSH_MODE: 5,
  SKIP: 6,
  TYPE: 7
};
class nn {
  constructor(t) {
    this.actionType = t, this.isPositionDependent = !1;
  }
  hashCode() {
    const t = new fe();
    return this.updateHashCode(t), t.finish();
  }
  updateHashCode(t) {
    t.update(this.actionType);
  }
  equals(t) {
    return this === t;
  }
}
class g1 extends nn {
  constructor() {
    super(Zt.SKIP);
  }
  execute(t) {
    t.skip();
  }
  toString() {
    return "skip";
  }
}
g1.INSTANCE = new g1();
class uo extends nn {
  constructor(t) {
    super(Zt.CHANNEL), this.channel = t;
  }
  execute(t) {
    t._channel = this.channel;
  }
  updateHashCode(t) {
    t.update(this.actionType, this.channel);
  }
  equals(t) {
    return this === t ? !0 : t instanceof uo ? this.channel === t.channel : !1;
  }
  toString() {
    return "channel(" + this.channel + ")";
  }
}
class po extends nn {
  constructor(t, n) {
    super(Zt.CUSTOM), this.ruleIndex = t, this.actionIndex = n, this.isPositionDependent = !0;
  }
  execute(t) {
    t.action(null, this.ruleIndex, this.actionIndex);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.ruleIndex, this.actionIndex);
  }
  equals(t) {
    return this === t ? !0 : t instanceof po ? this.ruleIndex === t.ruleIndex && this.actionIndex === t.actionIndex : !1;
  }
}
class m1 extends nn {
  constructor() {
    super(Zt.MORE);
  }
  execute(t) {
    t.more();
  }
  toString() {
    return "more";
  }
}
m1.INSTANCE = new m1();
class fo extends nn {
  constructor(t) {
    super(Zt.TYPE), this.type = t;
  }
  execute(t) {
    t.type = this.type;
  }
  updateHashCode(t) {
    t.update(this.actionType, this.type);
  }
  equals(t) {
    return this === t ? !0 : t instanceof fo ? this.type === t.type : !1;
  }
  toString() {
    return "type(" + this.type + ")";
  }
}
class go extends nn {
  constructor(t) {
    super(Zt.PUSH_MODE), this.mode = t;
  }
  execute(t) {
    t.pushMode(this.mode);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.mode);
  }
  equals(t) {
    return this === t ? !0 : t instanceof go ? this.mode === t.mode : !1;
  }
  toString() {
    return "pushMode(" + this.mode + ")";
  }
}
class x1 extends nn {
  constructor() {
    super(Zt.POP_MODE);
  }
  execute(t) {
    t.popMode();
  }
  toString() {
    return "popMode";
  }
}
x1.INSTANCE = new x1();
class mo extends nn {
  constructor(t) {
    super(Zt.MODE), this.mode = t;
  }
  execute(t) {
    t.mode(this.mode);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.mode);
  }
  equals(t) {
    return this === t ? !0 : t instanceof mo ? this.mode === t.mode : !1;
  }
  toString() {
    return "mode(" + this.mode + ")";
  }
}
const Vi = 4;
function fs(e, t) {
  const n = [];
  return n[e - 1] = t, n.map(function(r) {
    return t;
  });
}
class Rc {
  constructor(t) {
    t == null && (t = $r.defaultOptions), this.deserializationOptions = t, this.stateFactories = null, this.actionFactories = null;
  }
  deserialize(t) {
    const n = this.reset(t);
    this.checkVersion(n), n && this.skipUUID();
    const r = this.readATN();
    this.readStates(r, n), this.readRules(r, n), this.readModes(r);
    const s = [];
    return this.readSets(r, s, this.readInt.bind(this)), n && this.readSets(r, s, this.readInt32.bind(this)), this.readEdges(r, s), this.readDecisions(r), this.readLexerActions(r, n), this.markPrecedenceDecisions(r), this.verifyATN(r), this.deserializationOptions.generateRuleBypassTransitions && r.grammarType === ps.PARSER && (this.generateRuleBypassTransitions(r), this.verifyATN(r)), r;
  }
  reset(t) {
    if ((t.charCodeAt ? t.charCodeAt(0) : t[0]) === Vi - 1) {
      const n = function(s) {
        const i = s.charCodeAt(0);
        return i > 1 ? i - 2 : i + 65534;
      }, r = t.split("").map(n);
      return r[0] = t.charCodeAt(0), this.data = r, this.pos = 0, !0;
    } else
      return this.data = t, this.pos = 0, !1;
  }
  skipUUID() {
    let t = 0;
    for (; t++ < 8; )
      this.readInt();
  }
  checkVersion(t) {
    const n = this.readInt();
    if (!t && n !== Vi)
      throw "Could not deserialize ATN with version " + n + " (expected " + Vi + ").";
  }
  readATN() {
    const t = this.readInt(), n = this.readInt();
    return new St(t, n);
  }
  readStates(t, n) {
    let r, s, i;
    const o = [], a = [], l = this.readInt();
    for (let d = 0; d < l; d++) {
      const f = this.readInt();
      if (f === $.INVALID_TYPE) {
        t.addState(null);
        continue;
      }
      let m = this.readInt();
      n && m === 65535 && (m = -1);
      const I = this.stateFactory(f, m);
      if (f === $.LOOP_END) {
        const M = this.readInt();
        o.push([I, M]);
      } else if (I instanceof Yn) {
        const M = this.readInt();
        a.push([I, M]);
      }
      t.addState(I);
    }
    for (r = 0; r < o.length; r++)
      s = o[r], s[0].loopBackState = t.states[s[1]];
    for (r = 0; r < a.length; r++)
      s = a[r], s[0].endState = t.states[s[1]];
    let c = this.readInt();
    for (r = 0; r < c; r++)
      i = this.readInt(), t.states[i].nonGreedy = !0;
    let u = this.readInt();
    for (r = 0; r < u; r++)
      i = this.readInt(), t.states[i].isPrecedenceRule = !0;
  }
  readRules(t, n) {
    let r;
    const s = this.readInt();
    for (t.grammarType === ps.LEXER && (t.ruleToTokenType = fs(s, 0)), t.ruleToStartState = fs(s, 0), r = 0; r < s; r++) {
      const i = this.readInt();
      if (t.ruleToStartState[r] = t.states[i], t.grammarType === ps.LEXER) {
        let o = this.readInt();
        n && o === 65535 && (o = A.EOF), t.ruleToTokenType[r] = o;
      }
    }
    for (t.ruleToStopState = fs(s, 0), r = 0; r < t.states.length; r++) {
      const i = t.states[r];
      i instanceof Jt && (t.ruleToStopState[i.ruleIndex] = i, t.ruleToStartState[i.ruleIndex].stopState = i);
    }
  }
  readModes(t) {
    const n = this.readInt();
    for (let r = 0; r < n; r++) {
      let s = this.readInt();
      t.modeToStartState.push(t.states[s]);
    }
  }
  readSets(t, n, r) {
    const s = this.readInt();
    for (let i = 0; i < s; i++) {
      const o = new ye();
      n.push(o);
      const a = this.readInt();
      this.readInt() !== 0 && o.addOne(-1);
      for (let l = 0; l < a; l++) {
        const c = r(), u = r();
        o.addRange(c, u);
      }
    }
  }
  readEdges(t, n) {
    let r, s, i, o, a;
    const l = this.readInt();
    for (r = 0; r < l; r++) {
      const c = this.readInt(), u = this.readInt(), d = this.readInt(), f = this.readInt(), m = this.readInt(), I = this.readInt();
      o = this.edgeFactory(t, d, c, u, f, m, I, n), t.states[c].addTransition(o);
    }
    for (r = 0; r < t.states.length; r++)
      for (i = t.states[r], s = 0; s < i.transitions.length; s++) {
        const c = i.transitions[s];
        if (!(c instanceof Os))
          continue;
        let u = -1;
        t.ruleToStartState[c.target.ruleIndex].isPrecedenceRule && c.precedence === 0 && (u = c.target.ruleIndex), o = new wr(c.followState, u), t.ruleToStopState[c.target.ruleIndex].addTransition(o);
      }
    for (r = 0; r < t.states.length; r++) {
      if (i = t.states[r], i instanceof Yn) {
        if (i.endState === null || i.endState.startState !== null)
          throw "IllegalState";
        i.endState.startState = i;
      }
      if (i instanceof nl)
        for (s = 0; s < i.transitions.length; s++)
          a = i.transitions[s].target, a instanceof $i && (a.loopBackState = i);
      else if (i instanceof Gi)
        for (s = 0; s < i.transitions.length; s++)
          a = i.transitions[s].target, a instanceof bn && (a.loopBackState = i);
    }
  }
  readDecisions(t) {
    const n = this.readInt();
    for (let r = 0; r < n; r++) {
      const s = this.readInt(), i = t.states[s];
      t.decisionToState.push(i), i.decision = r;
    }
  }
  readLexerActions(t, n) {
    if (t.grammarType === ps.LEXER) {
      const r = this.readInt();
      t.lexerActions = fs(r, null);
      for (let s = 0; s < r; s++) {
        const i = this.readInt();
        let o = this.readInt();
        n && o === 65535 && (o = -1);
        let a = this.readInt();
        n && a === 65535 && (a = -1), t.lexerActions[s] = this.lexerActionFactory(i, o, a);
      }
    }
  }
  generateRuleBypassTransitions(t) {
    let n;
    const r = t.ruleToStartState.length;
    for (n = 0; n < r; n++)
      t.ruleToTokenType[n] = t.maxTokenType + n + 1;
    for (n = 0; n < r; n++)
      this.generateRuleBypassTransition(t, n);
  }
  generateRuleBypassTransition(t, n) {
    let r, s;
    const i = new rl();
    i.ruleIndex = n, t.addState(i);
    const o = new Hi();
    o.ruleIndex = n, t.addState(o), i.endState = o, t.defineDecisionState(i), o.startState = i;
    let a = null, l = null;
    if (t.ruleToStartState[n].isPrecedenceRule) {
      for (l = null, r = 0; r < t.states.length; r++)
        if (s = t.states[r], this.stateIsEndStateFor(s, n)) {
          l = s, a = s.loopBackState.transitions[0];
          break;
        }
      if (a === null)
        throw "Couldn't identify final state of the precedence rule prefix section.";
    } else
      l = t.ruleToStopState[n];
    for (r = 0; r < t.states.length; r++) {
      s = t.states[r];
      for (let f = 0; f < s.transitions.length; f++) {
        const m = s.transitions[f];
        m !== a && m.target === l && (m.target = o);
      }
    }
    const c = t.ruleToStartState[n], u = c.transitions.length;
    for (; u > 0; )
      i.addTransition(c.transitions[u - 1]), c.transitions = c.transitions.slice(-1);
    t.ruleToStartState[n].addTransition(new wr(i)), o.addTransition(new wr(l));
    const d = new tl();
    t.addState(d), d.addTransition(new Cs(o, t.ruleToTokenType[n])), i.addTransition(new wr(d));
  }
  stateIsEndStateFor(t, n) {
    if (t.ruleIndex !== n || !(t instanceof bn))
      return null;
    const r = t.transitions[t.transitions.length - 1].target;
    return r instanceof Hn && r.epsilonOnlyTransitions && r.transitions[0].target instanceof Jt ? t : null;
  }
  markPrecedenceDecisions(t) {
    for (let n = 0; n < t.states.length; n++) {
      const r = t.states[n];
      if (r instanceof bn && t.ruleToStartState[r.ruleIndex].isPrecedenceRule) {
        const s = r.transitions[r.transitions.length - 1].target;
        s instanceof Hn && s.epsilonOnlyTransitions && s.transitions[0].target instanceof Jt && (r.isPrecedenceDecision = !0);
      }
    }
  }
  verifyATN(t) {
    if (this.deserializationOptions.verifyATN)
      for (let n = 0; n < t.states.length; n++) {
        const r = t.states[n];
        if (r !== null)
          if (this.checkCondition(r.epsilonOnlyTransitions || r.transitions.length <= 1), r instanceof $i)
            this.checkCondition(r.loopBackState !== null);
          else if (r instanceof bn)
            if (this.checkCondition(r.loopBackState !== null), this.checkCondition(r.transitions.length === 2), r.transitions[0].target instanceof ji)
              this.checkCondition(r.transitions[1].target instanceof Hn), this.checkCondition(!r.nonGreedy);
            else if (r.transitions[0].target instanceof Hn)
              this.checkCondition(r.transitions[1].target instanceof ji), this.checkCondition(r.nonGreedy);
            else
              throw "IllegalState";
          else
            r instanceof Gi ? (this.checkCondition(r.transitions.length === 1), this.checkCondition(r.transitions[0].target instanceof bn)) : r instanceof Hn ? this.checkCondition(r.loopBackState !== null) : r instanceof el ? this.checkCondition(r.stopState !== null) : r instanceof Yn ? this.checkCondition(r.endState !== null) : r instanceof Hi ? this.checkCondition(r.startState !== null) : r instanceof lr ? this.checkCondition(r.transitions.length <= 1 || r.decision >= 0) : this.checkCondition(r.transitions.length <= 1 || r instanceof Jt);
      }
  }
  checkCondition(t, n) {
    if (!t)
      throw n == null && (n = "IllegalState"), n;
  }
  readInt() {
    return this.data[this.pos++];
  }
  readInt32() {
    const t = this.readInt(), n = this.readInt();
    return t | n << 16;
  }
  edgeFactory(t, n, r, s, i, o, a, l) {
    const c = t.states[s];
    switch (n) {
      case D.EPSILON:
        return new wr(c);
      case D.RANGE:
        return a !== 0 ? new sl(c, A.EOF, o) : new sl(c, i, o);
      case D.RULE:
        return new Os(t.states[i], o, a, c);
      case D.PREDICATE:
        return new Sc(c, i, o, a !== 0);
      case D.PRECEDENCE:
        return new Y4(c, i);
      case D.ATOM:
        return a !== 0 ? new Cs(c, A.EOF) : new Cs(c, i);
      case D.ACTION:
        return new Ac(c, i, o, a !== 0);
      case D.SET:
        return new oo(c, l[i]);
      case D.NOT_SET:
        return new ao(c, l[i]);
      case D.WILDCARD:
        return new kc(c);
      default:
        throw "The specified transition type: " + n + " is not valid.";
    }
  }
  stateFactory(t, n) {
    if (this.stateFactories === null) {
      const r = [];
      r[$.INVALID_TYPE] = null, r[$.BASIC] = () => new tl(), r[$.RULE_START] = () => new el(), r[$.BLOCK_START] = () => new rl(), r[$.PLUS_BLOCK_START] = () => new $i(), r[$.STAR_BLOCK_START] = () => new ji(), r[$.TOKEN_START] = () => new W4(), r[$.RULE_STOP] = () => new Jt(), r[$.BLOCK_END] = () => new Hi(), r[$.STAR_LOOP_BACK] = () => new Gi(), r[$.STAR_LOOP_ENTRY] = () => new bn(), r[$.PLUS_LOOP_BACK] = () => new nl(), r[$.LOOP_END] = () => new Hn(), this.stateFactories = r;
    }
    if (t > this.stateFactories.length || this.stateFactories[t] === null)
      throw "The specified state type " + t + " is not valid.";
    {
      const r = this.stateFactories[t]();
      if (r !== null)
        return r.ruleIndex = n, r;
    }
  }
  lexerActionFactory(t, n, r) {
    if (this.actionFactories === null) {
      const s = [];
      s[Zt.CHANNEL] = (i, o) => new uo(i), s[Zt.CUSTOM] = (i, o) => new po(i, o), s[Zt.MODE] = (i, o) => new mo(i), s[Zt.MORE] = (i, o) => m1.INSTANCE, s[Zt.POP_MODE] = (i, o) => x1.INSTANCE, s[Zt.PUSH_MODE] = (i, o) => new go(i), s[Zt.SKIP] = (i, o) => g1.INSTANCE, s[Zt.TYPE] = (i, o) => new fo(i), this.actionFactories = s;
    }
    if (t > this.actionFactories.length || this.actionFactories[t] === null)
      throw "The specified lexer action type " + t + " is not valid.";
    return this.actionFactories[t](n, r);
  }
}
class hi {
  syntaxError(t, n, r, s, i, o) {
  }
  reportAmbiguity(t, n, r, s, i, o, a) {
  }
  reportAttemptingFullContext(t, n, r, s, i, o) {
  }
  reportContextSensitivity(t, n, r, s, i, o) {
  }
}
class L1 extends hi {
  constructor() {
    super();
  }
  syntaxError(t, n, r, s, i, o) {
    console.error("line " + r + ":" + s + " " + i);
  }
}
L1.INSTANCE = new L1();
class K4 extends hi {
  constructor(t) {
    if (super(), t === null)
      throw "delegates";
    return this.delegates = t, this;
  }
  syntaxError(t, n, r, s, i, o) {
    this.delegates.map((a) => a.syntaxError(t, n, r, s, i, o));
  }
  reportAmbiguity(t, n, r, s, i, o, a) {
    this.delegates.map((l) => l.reportAmbiguity(t, n, r, s, i, o, a));
  }
  reportAttemptingFullContext(t, n, r, s, i, o) {
    this.delegates.map((a) => a.reportAttemptingFullContext(t, n, r, s, i, o));
  }
  reportContextSensitivity(t, n, r, s, i, o) {
    this.delegates.map((a) => a.reportContextSensitivity(t, n, r, s, i, o));
  }
}
class ui {
  constructor() {
    this._listeners = [L1.INSTANCE], this._interp = null, this._stateNumber = -1;
  }
  checkVersion(t) {
    const n = "4.11.0";
    n !== t && console.log("ANTLR runtime and generated code versions disagree: " + n + "!=" + t);
  }
  addErrorListener(t) {
    this._listeners.push(t);
  }
  removeErrorListeners() {
    this._listeners = [];
  }
  getLiteralNames() {
    return Object.getPrototypeOf(this).constructor.literalNames || [];
  }
  getSymbolicNames() {
    return Object.getPrototypeOf(this).constructor.symbolicNames || [];
  }
  getTokenNames() {
    if (!this.tokenNames) {
      const t = this.getLiteralNames(), n = this.getSymbolicNames(), r = t.length > n.length ? t.length : n.length;
      this.tokenNames = [];
      for (let s = 0; s < r; s++)
        this.tokenNames[s] = t[s] || n[s] || "<INVALID";
    }
    return this.tokenNames;
  }
  getTokenTypeMap() {
    const t = this.getTokenNames();
    if (t === null)
      throw "The current recognizer does not provide a list of token names.";
    let n = this.tokenTypeMapCache[t];
    return n === void 0 && (n = t.reduce(function(r, s, i) {
      r[s] = i;
    }), n.EOF = A.EOF, this.tokenTypeMapCache[t] = n), n;
  }
  getRuleIndexMap() {
    const t = this.ruleNames;
    if (t === null)
      throw "The current recognizer does not provide a list of rule names.";
    let n = this.ruleIndexMapCache[t];
    return n === void 0 && (n = t.reduce(function(r, s, i) {
      r[s] = i;
    }), this.ruleIndexMapCache[t] = n), n;
  }
  getTokenType(t) {
    const n = this.getTokenTypeMap()[t];
    return n !== void 0 ? n : A.INVALID_TYPE;
  }
  getErrorHeader(t) {
    const n = t.getOffendingToken().line, r = t.getOffendingToken().column;
    return "line " + n + ":" + r;
  }
  getTokenErrorDisplay(t) {
    if (t === null)
      return "<no token>";
    let n = t.text;
    return n === null && (t.type === A.EOF ? n = "<EOF>" : n = "<" + t.type + ">"), n = n.replace(`
`, "\\n").replace("\r", "\\r").replace("	", "\\t"), "'" + n + "'";
  }
  getErrorListenerDispatch() {
    return new K4(this._listeners);
  }
  sempred(t, n, r) {
    return !0;
  }
  precpred(t, n) {
    return !0;
  }
  get state() {
    return this._stateNumber;
  }
  set state(t) {
    this._stateNumber = t;
  }
}
ui.tokenTypeMapCache = {};
ui.ruleIndexMapCache = {};
class Rn extends A {
  constructor(t, n, r, s, i) {
    super(), this.source = t !== void 0 ? t : Rn.EMPTY_SOURCE, this.type = n !== void 0 ? n : null, this.channel = r !== void 0 ? r : A.DEFAULT_CHANNEL, this.start = s !== void 0 ? s : -1, this.stop = i !== void 0 ? i : -1, this.tokenIndex = -1, this.source[0] !== null ? (this.line = t[0].line, this.column = t[0].column) : this.column = -1;
  }
  clone() {
    const t = new Rn(this.source, this.type, this.channel, this.start, this.stop);
    return t.tokenIndex = this.tokenIndex, t.line = this.line, t.column = this.column, t.text = this.text, t;
  }
  toString() {
    let t = this.text;
    return t !== null ? t = t.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") : t = "<no text>", "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" + t + "',<" + this.type + ">" + (this.channel > 0 ? ",channel=" + this.channel : "") + "," + this.line + ":" + this.column + "]";
  }
  get text() {
    if (this._text !== null)
      return this._text;
    const t = this.getInputStream();
    if (t === null)
      return null;
    const n = t.size;
    return this.start < n && this.stop < n ? t.getText(this.start, this.stop) : "<EOF>";
  }
  set text(t) {
    this._text = t;
  }
}
Rn.EMPTY_SOURCE = [null, null];
class Q4 {
}
class y1 extends Q4 {
  constructor(t) {
    super(), this.copyText = t === void 0 ? !1 : t;
  }
  create(t, n, r, s, i, o, a, l) {
    const c = new Rn(t, n, s, i, o);
    return c.line = a, c.column = l, r !== null ? c.text = r : this.copyText && t[1] !== null && (c.text = t[1].getText(i, o)), c;
  }
  createThin(t, n) {
    const r = new Rn(null, t);
    return r.text = n, r;
  }
}
y1.DEFAULT = new y1();
class mn extends Error {
  constructor(t) {
    super(t.message), Error.captureStackTrace && Error.captureStackTrace(this, mn), this.message = t.message, this.recognizer = t.recognizer, this.input = t.input, this.ctx = t.ctx, this.offendingToken = null, this.offendingState = -1, this.recognizer !== null && (this.offendingState = this.recognizer.state);
  }
  getExpectedTokens() {
    return this.recognizer !== null ? this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx) : null;
  }
  toString() {
    return this.message;
  }
}
class xo extends mn {
  constructor(t, n, r, s) {
    super({ message: "", recognizer: t, input: n, ctx: null }), this.startIndex = r, this.deadEndConfigs = s;
  }
  toString() {
    let t = "";
    return this.startIndex >= 0 && this.startIndex < this.input.size && (t = this.input.getText(new pt(this.startIndex, this.startIndex))), "LexerNoViableAltException" + t;
  }
}
class Nt extends ui {
  constructor(t) {
    super(), this._input = t, this._factory = y1.DEFAULT, this._tokenFactorySourcePair = [this, t], this._interp = null, this._token = null, this._tokenStartCharIndex = -1, this._tokenStartLine = -1, this._tokenStartColumn = -1, this._hitEOF = !1, this._channel = A.DEFAULT_CHANNEL, this._type = A.INVALID_TYPE, this._modeStack = [], this._mode = Nt.DEFAULT_MODE, this._text = null;
  }
  reset() {
    this._input !== null && this._input.seek(0), this._token = null, this._type = A.INVALID_TYPE, this._channel = A.DEFAULT_CHANNEL, this._tokenStartCharIndex = -1, this._tokenStartColumn = -1, this._tokenStartLine = -1, this._text = null, this._hitEOF = !1, this._mode = Nt.DEFAULT_MODE, this._modeStack = [], this._interp.reset();
  }
  nextToken() {
    if (this._input === null)
      throw "nextToken requires a non-null input stream.";
    const t = this._input.mark();
    try {
      for (; ; ) {
        if (this._hitEOF)
          return this.emitEOF(), this._token;
        this._token = null, this._channel = A.DEFAULT_CHANNEL, this._tokenStartCharIndex = this._input.index, this._tokenStartColumn = this._interp.column, this._tokenStartLine = this._interp.line, this._text = null;
        let n = !1;
        for (; ; ) {
          this._type = A.INVALID_TYPE;
          let r = Nt.SKIP;
          try {
            r = this._interp.match(this._input, this._mode);
          } catch (s) {
            if (s instanceof mn)
              this.notifyListeners(s), this.recover(s);
            else
              throw console.log(s.stack), s;
          }
          if (this._input.LA(1) === A.EOF && (this._hitEOF = !0), this._type === A.INVALID_TYPE && (this._type = r), this._type === Nt.SKIP) {
            n = !0;
            break;
          }
          if (this._type !== Nt.MORE)
            break;
        }
        if (!n)
          return this._token === null && this.emit(), this._token;
      }
    } finally {
      this._input.release(t);
    }
  }
  skip() {
    this._type = Nt.SKIP;
  }
  more() {
    this._type = Nt.MORE;
  }
  mode(t) {
    this._mode = t;
  }
  pushMode(t) {
    this._interp.debug && console.log("pushMode " + t), this._modeStack.push(this._mode), this.mode(t);
  }
  popMode() {
    if (this._modeStack.length === 0)
      throw "Empty Stack";
    return this._interp.debug && console.log("popMode back to " + this._modeStack.slice(0, -1)), this.mode(this._modeStack.pop()), this._mode;
  }
  emitToken(t) {
    this._token = t;
  }
  emit() {
    const t = this._factory.create(
      this._tokenFactorySourcePair,
      this._type,
      this._text,
      this._channel,
      this._tokenStartCharIndex,
      this.getCharIndex() - 1,
      this._tokenStartLine,
      this._tokenStartColumn
    );
    return this.emitToken(t), t;
  }
  emitEOF() {
    const t = this.column, n = this.line, r = this._factory.create(
      this._tokenFactorySourcePair,
      A.EOF,
      null,
      A.DEFAULT_CHANNEL,
      this._input.index,
      this._input.index - 1,
      n,
      t
    );
    return this.emitToken(r), r;
  }
  getCharIndex() {
    return this._input.index;
  }
  getAllTokens() {
    const t = [];
    let n = this.nextToken();
    for (; n.type !== A.EOF; )
      t.push(n), n = this.nextToken();
    return t;
  }
  notifyListeners(t) {
    const n = this._tokenStartCharIndex, r = this._input.index, s = this._input.getText(n, r), i = "token recognition error at: '" + this.getErrorDisplay(s) + "'";
    this.getErrorListenerDispatch().syntaxError(
      this,
      null,
      this._tokenStartLine,
      this._tokenStartColumn,
      i,
      t
    );
  }
  getErrorDisplay(t) {
    const n = [];
    for (let r = 0; r < t.length; r++)
      n.push(t[r]);
    return n.join("");
  }
  getErrorDisplayForChar(t) {
    return t.charCodeAt(0) === A.EOF ? "<EOF>" : t === `
` ? "\\n" : t === "	" ? "\\t" : t === "\r" ? "\\r" : t;
  }
  getCharErrorDisplay(t) {
    return "'" + this.getErrorDisplayForChar(t) + "'";
  }
  recover(t) {
    this._input.LA(1) !== A.EOF && (t instanceof xo ? this._interp.consume(this._input) : this._input.consume());
  }
  get inputStream() {
    return this._input;
  }
  set inputStream(t) {
    this._input = null, this._tokenFactorySourcePair = [this, this._input], this.reset(), this._input = t, this._tokenFactorySourcePair = [this, this._input];
  }
  get sourceName() {
    return this._input.sourceName;
  }
  get type() {
    return this._type;
  }
  set type(t) {
    this._type = t;
  }
  get line() {
    return this._interp.line;
  }
  set line(t) {
    this._interp.line = t;
  }
  get column() {
    return this._interp.column;
  }
  set column(t) {
    this._interp.column = t;
  }
  get text() {
    return this._text !== null ? this._text : this._interp.getText(this._input);
  }
  set text(t) {
    this._text = t;
  }
}
Nt.DEFAULT_MODE = 0;
Nt.MORE = -2;
Nt.SKIP = -3;
Nt.DEFAULT_TOKEN_CHANNEL = A.DEFAULT_CHANNEL;
Nt.HIDDEN = A.HIDDEN_CHANNEL;
Nt.MIN_CHAR_VALUE = 0;
Nt.MAX_CHAR_VALUE = 1114111;
function X4(e) {
  return e.hashCodeForConfigSet();
}
function J4(e, t) {
  return e === t ? !0 : e === null || t === null ? !1 : e.equalsForConfigSet(t);
}
class Xt {
  constructor(t) {
    this.configLookup = new de(X4, J4), this.fullCtx = t === void 0 ? !0 : t, this.readOnly = !1, this.configs = [], this.uniqueAlt = 0, this.conflictingAlts = null, this.hasSemanticContext = !1, this.dipsIntoOuterContext = !1, this.cachedHashCode = -1;
  }
  add(t, n) {
    if (n === void 0 && (n = null), this.readOnly)
      throw "This set is readonly";
    t.semanticContext !== ft.NONE && (this.hasSemanticContext = !0), t.reachesIntoOuterContext > 0 && (this.dipsIntoOuterContext = !0);
    const r = this.configLookup.add(t);
    if (r === t)
      return this.cachedHashCode = -1, this.configs.push(t), !0;
    const s = !this.fullCtx, i = ho(r.context, t.context, s, n);
    return r.reachesIntoOuterContext = Math.max(r.reachesIntoOuterContext, t.reachesIntoOuterContext), t.precedenceFilterSuppressed && (r.precedenceFilterSuppressed = !0), r.context = i, !0;
  }
  getStates() {
    const t = new de();
    for (let n = 0; n < this.configs.length; n++)
      t.add(this.configs[n].state);
    return t;
  }
  getPredicates() {
    const t = [];
    for (let n = 0; n < this.configs.length; n++) {
      const r = this.configs[n].semanticContext;
      r !== ft.NONE && t.push(r.semanticContext);
    }
    return t;
  }
  optimizeConfigs(t) {
    if (this.readOnly)
      throw "This set is readonly";
    if (this.configLookup.length !== 0)
      for (let n = 0; n < this.configs.length; n++) {
        const r = this.configs[n];
        r.context = t.getCachedContext(r.context);
      }
  }
  addAll(t) {
    for (let n = 0; n < t.length; n++)
      this.add(t[n]);
    return !1;
  }
  equals(t) {
    return this === t || t instanceof Xt && Jn(this.configs, t.configs) && this.fullCtx === t.fullCtx && this.uniqueAlt === t.uniqueAlt && this.conflictingAlts === t.conflictingAlts && this.hasSemanticContext === t.hasSemanticContext && this.dipsIntoOuterContext === t.dipsIntoOuterContext;
  }
  hashCode() {
    const t = new fe();
    return t.update(this.configs), t.finish();
  }
  updateHashCode(t) {
    this.readOnly ? (this.cachedHashCode === -1 && (this.cachedHashCode = this.hashCode()), t.update(this.cachedHashCode)) : t.update(this.hashCode());
  }
  isEmpty() {
    return this.configs.length === 0;
  }
  contains(t) {
    if (this.configLookup === null)
      throw "This method is not implemented for readonly sets.";
    return this.configLookup.contains(t);
  }
  containsFast(t) {
    if (this.configLookup === null)
      throw "This method is not implemented for readonly sets.";
    return this.configLookup.containsFast(t);
  }
  clear() {
    if (this.readOnly)
      throw "This set is readonly";
    this.configs = [], this.cachedHashCode = -1, this.configLookup = new de();
  }
  setReadonly(t) {
    this.readOnly = t, t && (this.configLookup = null);
  }
  toString() {
    return ln(this.configs) + (this.hasSemanticContext ? ",hasSemanticContext=" + this.hasSemanticContext : "") + (this.uniqueAlt !== St.INVALID_ALT_NUMBER ? ",uniqueAlt=" + this.uniqueAlt : "") + (this.conflictingAlts !== null ? ",conflictingAlts=" + this.conflictingAlts : "") + (this.dipsIntoOuterContext ? ",dipsIntoOuterContext" : "");
  }
  get items() {
    return this.configs;
  }
  get length() {
    return this.configs.length;
  }
}
class Ye {
  constructor(t, n) {
    return t === null && (t = -1), n === null && (n = new Xt()), this.stateNumber = t, this.configs = n, this.edges = null, this.isAcceptState = !1, this.prediction = 0, this.lexerActionExecutor = null, this.requiresFullContext = !1, this.predicates = null, this;
  }
  getAltSet() {
    const t = new de();
    if (this.configs !== null)
      for (let n = 0; n < this.configs.length; n++) {
        const r = this.configs[n];
        t.add(r.alt);
      }
    return t.length === 0 ? null : t;
  }
  equals(t) {
    return this === t || t instanceof Ye && this.configs.equals(t.configs);
  }
  toString() {
    let t = "" + this.stateNumber + ":" + this.configs;
    return this.isAcceptState && (t = t + "=>", this.predicates !== null ? t = t + this.predicates : t = t + this.prediction), t;
  }
  hashCode() {
    const t = new fe();
    return t.update(this.configs), t.finish();
  }
}
class ze {
  constructor(t, n) {
    return this.atn = t, this.sharedContextCache = n, this;
  }
  getCachedContext(t) {
    if (this.sharedContextCache === null)
      return t;
    const n = new Zr();
    return Tc(t, this.sharedContextCache, n);
  }
}
ze.ERROR = new Ye(2147483647, new Xt());
class il extends Xt {
  constructor() {
    super(), this.configLookup = new de();
  }
}
class ae extends Mt {
  constructor(t, n) {
    super(t, n);
    const r = t.lexerActionExecutor || null;
    return this.lexerActionExecutor = r || (n !== null ? n.lexerActionExecutor : null), this.passedThroughNonGreedyDecision = n !== null ? this.checkNonGreedyDecision(n, this.state) : !1, this.hashCodeForConfigSet = ae.prototype.hashCode, this.equalsForConfigSet = ae.prototype.equals, this;
  }
  updateHashCode(t) {
    t.update(this.state.stateNumber, this.alt, this.context, this.semanticContext, this.passedThroughNonGreedyDecision, this.lexerActionExecutor);
  }
  equals(t) {
    return this === t || t instanceof ae && this.passedThroughNonGreedyDecision === t.passedThroughNonGreedyDecision && (this.lexerActionExecutor ? this.lexerActionExecutor.equals(t.lexerActionExecutor) : !t.lexerActionExecutor) && super.equals(t);
  }
  checkNonGreedyDecision(t, n) {
    return t.passedThroughNonGreedyDecision || n instanceof lr && n.nonGreedy;
  }
}
class Nr extends nn {
  constructor(t, n) {
    super(n.actionType), this.offset = t, this.action = n, this.isPositionDependent = !0;
  }
  execute(t) {
    this.action.execute(t);
  }
  updateHashCode(t) {
    t.update(this.actionType, this.offset, this.action);
  }
  equals(t) {
    return this === t ? !0 : t instanceof Nr ? this.offset === t.offset && this.action === t.action : !1;
  }
}
class $n {
  constructor(t) {
    return this.lexerActions = t === null ? [] : t, this.cachedHashCode = fe.hashStuff(t), this;
  }
  fixOffsetBeforeMatch(t) {
    let n = null;
    for (let r = 0; r < this.lexerActions.length; r++)
      this.lexerActions[r].isPositionDependent && !(this.lexerActions[r] instanceof Nr) && (n === null && (n = this.lexerActions.concat([])), n[r] = new Nr(
        t,
        this.lexerActions[r]
      ));
    return n === null ? this : new $n(n);
  }
  execute(t, n, r) {
    let s = !1;
    const i = n.index;
    try {
      for (let o = 0; o < this.lexerActions.length; o++) {
        let a = this.lexerActions[o];
        if (a instanceof Nr) {
          const l = a.offset;
          n.seek(r + l), a = a.action, s = r + l !== i;
        } else
          a.isPositionDependent && (n.seek(i), s = !1);
        a.execute(t);
      }
    } finally {
      s && n.seek(i);
    }
  }
  hashCode() {
    return this.cachedHashCode;
  }
  updateHashCode(t) {
    t.update(this.cachedHashCode);
  }
  equals(t) {
    if (this === t)
      return !0;
    if (t instanceof $n) {
      if (this.cachedHashCode != t.cachedHashCode || this.lexerActions.length != t.lexerActions.length)
        return !1;
      {
        const n = this.lexerActions.length;
        for (let r = 0; r < n; ++r)
          if (!this.lexerActions[r].equals(t.lexerActions[r]))
            return !1;
        return !0;
      }
    } else
      return !1;
  }
  static append(t, n) {
    if (t === null)
      return new $n([n]);
    const r = t.lexerActions.concat([n]);
    return new $n(r);
  }
}
function ol(e) {
  e.index = -1, e.line = 0, e.column = -1, e.dfaState = null;
}
class t5 {
  constructor() {
    ol(this);
  }
  reset() {
    ol(this);
  }
}
class Ot extends ze {
  constructor(t, n, r, s) {
    super(n, s), this.decisionToDFA = r, this.recog = t, this.startIndex = -1, this.line = 1, this.column = 0, this.mode = Nt.DEFAULT_MODE, this.prevAccept = new t5();
  }
  copyState(t) {
    this.column = t.column, this.line = t.line, this.mode = t.mode, this.startIndex = t.startIndex;
  }
  match(t, n) {
    this.mode = n;
    const r = t.mark();
    try {
      this.startIndex = t.index, this.prevAccept.reset();
      const s = this.decisionToDFA[n];
      return s.s0 === null ? this.matchATN(t) : this.execATN(t, s.s0);
    } finally {
      t.release(r);
    }
  }
  reset() {
    this.prevAccept.reset(), this.startIndex = -1, this.line = 1, this.column = 0, this.mode = Nt.DEFAULT_MODE;
  }
  matchATN(t) {
    const n = this.atn.modeToStartState[this.mode];
    Ot.debug && console.log("matchATN mode " + this.mode + " start: " + n);
    const r = this.mode, s = this.computeStartState(t, n), i = s.hasSemanticContext;
    s.hasSemanticContext = !1;
    const o = this.addDFAState(s);
    i || (this.decisionToDFA[this.mode].s0 = o);
    const a = this.execATN(t, o);
    return Ot.debug && console.log("DFA after matchATN: " + this.decisionToDFA[r].toLexerString()), a;
  }
  execATN(t, n) {
    Ot.debug && console.log("start state closure=" + n.configs), n.isAcceptState && this.captureSimState(this.prevAccept, t, n);
    let r = t.LA(1), s = n;
    for (; ; ) {
      Ot.debug && console.log("execATN loop starting closure: " + s.configs);
      let i = this.getExistingTargetState(s, r);
      if (i === null && (i = this.computeTargetState(t, s, r)), i === ze.ERROR || (r !== A.EOF && this.consume(t), i.isAcceptState && (this.captureSimState(this.prevAccept, t, i), r === A.EOF)))
        break;
      r = t.LA(1), s = i;
    }
    return this.failOrAccept(this.prevAccept, t, s.configs, r);
  }
  getExistingTargetState(t, n) {
    if (t.edges === null || n < Ot.MIN_DFA_EDGE || n > Ot.MAX_DFA_EDGE)
      return null;
    let r = t.edges[n - Ot.MIN_DFA_EDGE];
    return r === void 0 && (r = null), Ot.debug && r !== null && console.log("reuse state " + t.stateNumber + " edge to " + r.stateNumber), r;
  }
  computeTargetState(t, n, r) {
    const s = new il();
    return this.getReachableConfigSet(t, n.configs, s, r), s.items.length === 0 ? (s.hasSemanticContext || this.addDFAEdge(n, r, ze.ERROR), ze.ERROR) : this.addDFAEdge(n, r, null, s);
  }
  failOrAccept(t, n, r, s) {
    if (this.prevAccept.dfaState !== null) {
      const i = t.dfaState.lexerActionExecutor;
      return this.accept(
        n,
        i,
        this.startIndex,
        t.index,
        t.line,
        t.column
      ), t.dfaState.prediction;
    } else {
      if (s === A.EOF && n.index === this.startIndex)
        return A.EOF;
      throw new xo(this.recog, n, this.startIndex, r);
    }
  }
  getReachableConfigSet(t, n, r, s) {
    let i = St.INVALID_ALT_NUMBER;
    for (let o = 0; o < n.items.length; o++) {
      const a = n.items[o], l = a.alt === i;
      if (!(l && a.passedThroughNonGreedyDecision)) {
        Ot.debug && console.log(`testing %s at %s
`, this.getTokenName(s), a.toString(this.recog, !0));
        for (let c = 0; c < a.state.transitions.length; c++) {
          const u = a.state.transitions[c], d = this.getReachableTarget(u, s);
          if (d !== null) {
            let f = a.lexerActionExecutor;
            f !== null && (f = f.fixOffsetBeforeMatch(t.index - this.startIndex));
            const m = s === A.EOF, I = new ae({ state: d, lexerActionExecutor: f }, a);
            this.closure(
              t,
              I,
              r,
              l,
              !0,
              m
            ) && (i = a.alt);
          }
        }
      }
    }
  }
  accept(t, n, r, s, i, o) {
    Ot.debug && console.log(`ACTION %s
`, n), t.seek(s), this.line = i, this.column = o, n !== null && this.recog !== null && n.execute(this.recog, t, r);
  }
  getReachableTarget(t, n) {
    return t.matches(n, 0, Nt.MAX_CHAR_VALUE) ? t.target : null;
  }
  computeStartState(t, n) {
    const r = it.EMPTY, s = new il();
    for (let i = 0; i < n.transitions.length; i++) {
      const o = n.transitions[i].target, a = new ae({ state: o, alt: i + 1, context: r }, null);
      this.closure(t, a, s, !1, !1, !1);
    }
    return s;
  }
  closure(t, n, r, s, i, o) {
    let a = null;
    if (Ot.debug && console.log("closure(" + n.toString(this.recog, !0) + ")"), n.state instanceof Jt) {
      if (Ot.debug && (this.recog !== null ? console.log(`closure at %s rule stop %s
`, this.recog.ruleNames[n.state.ruleIndex], n) : console.log(`closure at rule stop %s
`, n)), n.context === null || n.context.hasEmptyPath()) {
        if (n.context === null || n.context.isEmpty())
          return r.add(n), !0;
        r.add(new ae({ state: n.state, context: it.EMPTY }, n)), s = !0;
      }
      if (n.context !== null && !n.context.isEmpty()) {
        for (let l = 0; l < n.context.length; l++)
          if (n.context.getReturnState(l) !== it.EMPTY_RETURN_STATE) {
            const c = n.context.getParent(l), u = this.atn.states[n.context.getReturnState(l)];
            a = new ae({ state: u, context: c }, n), s = this.closure(
              t,
              a,
              r,
              s,
              i,
              o
            );
          }
      }
      return s;
    }
    n.state.epsilonOnlyTransitions || (!s || !n.passedThroughNonGreedyDecision) && r.add(n);
    for (let l = 0; l < n.state.transitions.length; l++) {
      const c = n.state.transitions[l];
      a = this.getEpsilonTarget(t, n, c, r, i, o), a !== null && (s = this.closure(
        t,
        a,
        r,
        s,
        i,
        o
      ));
    }
    return s;
  }
  getEpsilonTarget(t, n, r, s, i, o) {
    let a = null;
    if (r.serializationType === D.RULE) {
      const l = ee.create(n.context, r.followState.stateNumber);
      a = new ae({ state: r.target, context: l }, n);
    } else {
      if (r.serializationType === D.PRECEDENCE)
        throw "Precedence predicates are not supported in lexers.";
      if (r.serializationType === D.PREDICATE)
        Ot.debug && console.log("EVAL rule " + r.ruleIndex + ":" + r.predIndex), s.hasSemanticContext = !0, this.evaluatePredicate(t, r.ruleIndex, r.predIndex, i) && (a = new ae({ state: r.target }, n));
      else if (r.serializationType === D.ACTION)
        if (n.context === null || n.context.hasEmptyPath()) {
          const l = $n.append(
            n.lexerActionExecutor,
            this.atn.lexerActions[r.actionIndex]
          );
          a = new ae({ state: r.target, lexerActionExecutor: l }, n);
        } else
          a = new ae({ state: r.target }, n);
      else
        r.serializationType === D.EPSILON ? a = new ae({ state: r.target }, n) : (r.serializationType === D.ATOM || r.serializationType === D.RANGE || r.serializationType === D.SET) && o && r.matches(A.EOF, 0, Nt.MAX_CHAR_VALUE) && (a = new ae({ state: r.target }, n));
    }
    return a;
  }
  evaluatePredicate(t, n, r, s) {
    if (this.recog === null)
      return !0;
    if (!s)
      return this.recog.sempred(null, n, r);
    const i = this.column, o = this.line, a = t.index, l = t.mark();
    try {
      return this.consume(t), this.recog.sempred(null, n, r);
    } finally {
      this.column = i, this.line = o, t.seek(a), t.release(l);
    }
  }
  captureSimState(t, n, r) {
    t.index = n.index, t.line = this.line, t.column = this.column, t.dfaState = r;
  }
  addDFAEdge(t, n, r, s) {
    if (r === void 0 && (r = null), s === void 0 && (s = null), r === null && s !== null) {
      const i = s.hasSemanticContext;
      if (s.hasSemanticContext = !1, r = this.addDFAState(s), i)
        return r;
    }
    return n < Ot.MIN_DFA_EDGE || n > Ot.MAX_DFA_EDGE || (Ot.debug && console.log("EDGE " + t + " -> " + r + " upon " + n), t.edges === null && (t.edges = []), t.edges[n - Ot.MIN_DFA_EDGE] = r), r;
  }
  addDFAState(t) {
    const n = new Ye(null, t);
    let r = null;
    for (let a = 0; a < t.items.length; a++) {
      const l = t.items[a];
      if (l.state instanceof Jt) {
        r = l;
        break;
      }
    }
    r !== null && (n.isAcceptState = !0, n.lexerActionExecutor = r.lexerActionExecutor, n.prediction = this.atn.ruleToTokenType[r.state.ruleIndex]);
    const s = this.decisionToDFA[this.mode], i = s.states.get(n);
    if (i !== null)
      return i;
    const o = n;
    return o.stateNumber = s.states.length, t.setReadonly(!0), o.configs = t, s.states.add(o), o;
  }
  getDFA(t) {
    return this.decisionToDFA[t];
  }
  getText(t) {
    return t.getText(this.startIndex, t.index - 1);
  }
  consume(t) {
    t.LA(1) === `
`.charCodeAt(0) ? (this.line += 1, this.column = 0) : this.column += 1, t.consume();
  }
  getTokenName(t) {
    return t === -1 ? "EOF" : "'" + String.fromCharCode(t) + "'";
  }
}
Ot.debug = !1;
Ot.dfa_debug = !1;
Ot.MIN_DFA_EDGE = 0;
Ot.MAX_DFA_EDGE = 127;
class Ic {
  constructor(t, n) {
    this.alt = n, this.pred = t;
  }
  toString() {
    return "(" + this.pred + ", " + this.alt + ")";
  }
}
class e5 {
  constructor() {
    this.data = {};
  }
  get(t) {
    return this.data["k-" + t] || null;
  }
  set(t, n) {
    this.data["k-" + t] = n;
  }
  values() {
    return Object.keys(this.data).filter((t) => t.startsWith("k-")).map((t) => this.data[t], this);
  }
}
const bt = {
  SLL: 0,
  LL: 1,
  LL_EXACT_AMBIG_DETECTION: 2,
  hasSLLConflictTerminatingPrediction: function(e, t) {
    if (bt.allConfigsInRuleStopStates(t))
      return !0;
    if (e === bt.SLL && t.hasSemanticContext) {
      const r = new Xt();
      for (let s = 0; s < t.items.length; s++) {
        let i = t.items[s];
        i = new Mt({ semanticContext: ft.NONE }, i), r.add(i);
      }
      t = r;
    }
    const n = bt.getConflictingAltSubsets(t);
    return bt.hasConflictingAltSet(n) && !bt.hasStateAssociatedWithOneAlt(t);
  },
  hasConfigInRuleStopState: function(e) {
    for (let t = 0; t < e.items.length; t++)
      if (e.items[t].state instanceof Jt)
        return !0;
    return !1;
  },
  allConfigsInRuleStopStates: function(e) {
    for (let t = 0; t < e.items.length; t++)
      if (!(e.items[t].state instanceof Jt))
        return !1;
    return !0;
  },
  resolvesToJustOneViableAlt: function(e) {
    return bt.getSingleViableAlt(e);
  },
  allSubsetsConflict: function(e) {
    return !bt.hasNonConflictingAltSet(e);
  },
  hasNonConflictingAltSet: function(e) {
    for (let t = 0; t < e.length; t++)
      if (e[t].length === 1)
        return !0;
    return !1;
  },
  hasConflictingAltSet: function(e) {
    for (let t = 0; t < e.length; t++)
      if (e[t].length > 1)
        return !0;
    return !1;
  },
  allSubsetsEqual: function(e) {
    let t = null;
    for (let n = 0; n < e.length; n++) {
      const r = e[n];
      if (t === null)
        t = r;
      else if (r !== t)
        return !1;
    }
    return !0;
  },
  getUniqueAlt: function(e) {
    const t = bt.getAlts(e);
    return t.length === 1 ? t.minValue() : St.INVALID_ALT_NUMBER;
  },
  getAlts: function(e) {
    const t = new Ue();
    return e.map(function(n) {
      t.or(n);
    }), t;
  },
  getConflictingAltSubsets: function(e) {
    const t = new Zr();
    return t.hashFunction = function(n) {
      fe.hashStuff(n.state.stateNumber, n.context);
    }, t.equalsFunction = function(n, r) {
      return n.state.stateNumber === r.state.stateNumber && n.context.equals(r.context);
    }, e.items.map(function(n) {
      let r = t.get(n);
      r === null && (r = new Ue(), t.set(n, r)), r.add(n.alt);
    }), t.getValues();
  },
  getStateToAltMap: function(e) {
    const t = new e5();
    return e.items.map(function(n) {
      let r = t.get(n.state);
      r === null && (r = new Ue(), t.set(n.state, r)), r.add(n.alt);
    }), t;
  },
  hasStateAssociatedWithOneAlt: function(e) {
    const t = bt.getStateToAltMap(e).values();
    for (let n = 0; n < t.length; n++)
      if (t[n].length === 1)
        return !0;
    return !1;
  },
  getSingleViableAlt: function(e) {
    let t = null;
    for (let n = 0; n < e.length; n++) {
      const r = e[n].minValue();
      if (t === null)
        t = r;
      else if (t !== r)
        return St.INVALID_ALT_NUMBER;
    }
    return t;
  }
};
class Lo extends mn {
  constructor(t, n, r, s, i, o) {
    o = o || t._ctx, s = s || t.getCurrentToken(), r = r || t.getCurrentToken(), n = n || t.getInputStream(), super({ message: "", recognizer: t, input: n, ctx: o }), this.deadEndConfigs = i, this.startToken = r, this.offendingToken = s;
  }
}
class n5 {
  constructor(t) {
    this.defaultMapCtor = t || Zr, this.cacheMap = new this.defaultMapCtor();
  }
  get(t, n) {
    const r = this.cacheMap.get(t) || null;
    return r === null ? null : r.get(n) || null;
  }
  set(t, n, r) {
    let s = this.cacheMap.get(t) || null;
    s === null && (s = new this.defaultMapCtor(), this.cacheMap.set(t, s)), s.set(n, r);
  }
}
class r5 extends ze {
  constructor(t, n, r, s) {
    super(n, s), this.parser = t, this.decisionToDFA = r, this.predictionMode = bt.LL, this._input = null, this._startIndex = 0, this._outerContext = null, this._dfa = null, this.mergeCache = null, this.debug = !1, this.debug_closure = !1, this.debug_add = !1, this.debug_list_atn_decisions = !1, this.dfa_debug = !1, this.retry_debug = !1;
  }
  reset() {
  }
  adaptivePredict(t, n, r) {
    (this.debug || this.debug_list_atn_decisions) && console.log("adaptivePredict decision " + n + " exec LA(1)==" + this.getLookaheadName(t) + " line " + t.LT(1).line + ":" + t.LT(1).column), this._input = t, this._startIndex = t.index, this._outerContext = r;
    const s = this.decisionToDFA[n];
    this._dfa = s;
    const i = t.mark(), o = t.index;
    try {
      let a;
      if (s.precedenceDfa ? a = s.getPrecedenceStartState(this.parser.getPrecedence()) : a = s.s0, a === null) {
        r === null && (r = tr.EMPTY), (this.debug || this.debug_list_atn_decisions) && console.log("predictATN decision " + s.decision + " exec LA(1)==" + this.getLookaheadName(t) + ", outerContext=" + r.toString(this.parser.ruleNames));
        const c = !1;
        let u = this.computeStartState(s.atnStartState, tr.EMPTY, c);
        s.precedenceDfa ? (s.s0.configs = u, u = this.applyPrecedenceFilter(u), a = this.addDFAState(s, new Ye(null, u)), s.setPrecedenceStartState(this.parser.getPrecedence(), a)) : (a = this.addDFAState(s, new Ye(null, u)), s.s0 = a);
      }
      const l = this.execATN(s, a, t, o, r);
      return this.debug && console.log("DFA after predictATN: " + s.toString(this.parser.literalNames, this.parser.symbolicNames)), l;
    } finally {
      this._dfa = null, this.mergeCache = null, t.seek(o), t.release(i);
    }
  }
  execATN(t, n, r, s, i) {
    (this.debug || this.debug_list_atn_decisions) && console.log("execATN decision " + t.decision + " exec LA(1)==" + this.getLookaheadName(r) + " line " + r.LT(1).line + ":" + r.LT(1).column);
    let o, a = n;
    this.debug && console.log("s0 = " + n);
    let l = r.LA(1);
    for (; ; ) {
      let c = this.getExistingTargetState(a, l);
      if (c === null && (c = this.computeTargetState(t, a, l)), c === ze.ERROR) {
        const u = this.noViableAlt(r, i, a.configs, s);
        if (r.seek(s), o = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(a.configs, i), o !== St.INVALID_ALT_NUMBER)
          return o;
        throw u;
      }
      if (c.requiresFullContext && this.predictionMode !== bt.SLL) {
        let u = null;
        if (c.predicates !== null) {
          this.debug && console.log("DFA state has preds in DFA sim LL failover");
          const m = r.index;
          if (m !== s && r.seek(s), u = this.evalSemanticContext(c.predicates, i, !0), u.length === 1)
            return this.debug && console.log("Full LL avoided"), u.minValue();
          m !== s && r.seek(m);
        }
        this.dfa_debug && console.log("ctx sensitive state " + i + " in " + c);
        const d = !0, f = this.computeStartState(t.atnStartState, i, d);
        return this.reportAttemptingFullContext(t, u, c.configs, s, r.index), o = this.execATNWithFullContext(t, c, f, r, s, i), o;
      }
      if (c.isAcceptState) {
        if (c.predicates === null)
          return c.prediction;
        const u = r.index;
        r.seek(s);
        const d = this.evalSemanticContext(c.predicates, i, !0);
        if (d.length === 0)
          throw this.noViableAlt(r, i, c.configs, s);
        return d.length === 1 || this.reportAmbiguity(t, c, s, u, !1, d, c.configs), d.minValue();
      }
      a = c, l !== A.EOF && (r.consume(), l = r.LA(1));
    }
  }
  getExistingTargetState(t, n) {
    const r = t.edges;
    return r === null ? null : r[n + 1] || null;
  }
  computeTargetState(t, n, r) {
    const s = this.computeReachSet(n.configs, r, !1);
    if (s === null)
      return this.addDFAEdge(t, n, r, ze.ERROR), ze.ERROR;
    let i = new Ye(null, s);
    const o = this.getUniqueAlt(s);
    if (this.debug) {
      const a = bt.getConflictingAltSubsets(s);
      console.log("SLL altSubSets=" + ln(a) + ", configs=" + s + ", predict=" + o + ", allSubsetsConflict=" + bt.allSubsetsConflict(a) + ", conflictingAlts=" + this.getConflictingAlts(s));
    }
    return o !== St.INVALID_ALT_NUMBER ? (i.isAcceptState = !0, i.configs.uniqueAlt = o, i.prediction = o) : bt.hasSLLConflictTerminatingPrediction(this.predictionMode, s) && (i.configs.conflictingAlts = this.getConflictingAlts(s), i.requiresFullContext = !0, i.isAcceptState = !0, i.prediction = i.configs.conflictingAlts.minValue()), i.isAcceptState && i.configs.hasSemanticContext && (this.predicateDFAState(i, this.atn.getDecisionState(t.decision)), i.predicates !== null && (i.prediction = St.INVALID_ALT_NUMBER)), i = this.addDFAEdge(t, n, r, i), i;
  }
  predicateDFAState(t, n) {
    const r = n.transitions.length, s = this.getConflictingAltsOrUniqueAlt(t.configs), i = this.getPredsForAmbigAlts(s, t.configs, r);
    i !== null ? (t.predicates = this.getPredicatePredictions(s, i), t.prediction = St.INVALID_ALT_NUMBER) : t.prediction = s.minValue();
  }
  execATNWithFullContext(t, n, r, s, i, o) {
    (this.debug || this.debug_list_atn_decisions) && console.log("execATNWithFullContext " + r);
    const a = !0;
    let l = !1, c, u = r;
    s.seek(i);
    let d = s.LA(1), f = -1;
    for (; ; ) {
      if (c = this.computeReachSet(u, d, a), c === null) {
        const I = this.noViableAlt(s, o, u, i);
        s.seek(i);
        const M = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(u, o);
        if (M !== St.INVALID_ALT_NUMBER)
          return M;
        throw I;
      }
      const m = bt.getConflictingAltSubsets(c);
      if (this.debug && console.log("LL altSubSets=" + m + ", predict=" + bt.getUniqueAlt(m) + ", resolvesToJustOneViableAlt=" + bt.resolvesToJustOneViableAlt(m)), c.uniqueAlt = this.getUniqueAlt(c), c.uniqueAlt !== St.INVALID_ALT_NUMBER) {
        f = c.uniqueAlt;
        break;
      } else if (this.predictionMode !== bt.LL_EXACT_AMBIG_DETECTION) {
        if (f = bt.resolvesToJustOneViableAlt(m), f !== St.INVALID_ALT_NUMBER)
          break;
      } else if (bt.allSubsetsConflict(m) && bt.allSubsetsEqual(m)) {
        l = !0, f = bt.getSingleViableAlt(m);
        break;
      }
      u = c, d !== A.EOF && (s.consume(), d = s.LA(1));
    }
    return c.uniqueAlt !== St.INVALID_ALT_NUMBER ? (this.reportContextSensitivity(t, f, c, i, s.index), f) : (this.reportAmbiguity(t, n, i, s.index, l, null, c), f);
  }
  computeReachSet(t, n, r) {
    this.debug && console.log("in computeReachSet, starting closure: " + t), this.mergeCache === null && (this.mergeCache = new n5());
    const s = new Xt(r);
    let i = null;
    for (let a = 0; a < t.items.length; a++) {
      const l = t.items[a];
      if (this.debug && console.log("testing " + this.getTokenName(n) + " at " + l), l.state instanceof Jt) {
        (r || n === A.EOF) && (i === null && (i = []), i.push(l), this.debug_add && console.log("added " + l + " to skippedStopStates"));
        continue;
      }
      for (let c = 0; c < l.state.transitions.length; c++) {
        const u = l.state.transitions[c], d = this.getReachableTarget(u, n);
        if (d !== null) {
          const f = new Mt({ state: d }, l);
          s.add(f, this.mergeCache), this.debug_add && console.log("added " + f + " to intermediate");
        }
      }
    }
    let o = null;
    if (i === null && n !== A.EOF && (s.items.length === 1 || this.getUniqueAlt(s) !== St.INVALID_ALT_NUMBER) && (o = s), o === null) {
      o = new Xt(r);
      const a = new de(), l = n === A.EOF;
      for (let c = 0; c < s.items.length; c++)
        this.closure(s.items[c], o, a, !1, r, l);
    }
    if (n === A.EOF && (o = this.removeAllConfigsNotInRuleStopState(o, o === s)), i !== null && (!r || !bt.hasConfigInRuleStopState(o)))
      for (let a = 0; a < i.length; a++)
        o.add(i[a], this.mergeCache);
    return o.items.length === 0 ? null : o;
  }
  removeAllConfigsNotInRuleStopState(t, n) {
    if (bt.allConfigsInRuleStopStates(t))
      return t;
    const r = new Xt(t.fullCtx);
    for (let s = 0; s < t.items.length; s++) {
      const i = t.items[s];
      if (i.state instanceof Jt) {
        r.add(i, this.mergeCache);
        continue;
      }
      if (n && i.state.epsilonOnlyTransitions && this.atn.nextTokens(i.state).contains(A.EPSILON)) {
        const o = this.atn.ruleToStopState[i.state.ruleIndex];
        r.add(new Mt({ state: o }, i), this.mergeCache);
      }
    }
    return r;
  }
  computeStartState(t, n, r) {
    const s = co(this.atn, n), i = new Xt(r);
    for (let o = 0; o < t.transitions.length; o++) {
      const a = t.transitions[o].target, l = new Mt({ state: a, alt: o + 1, context: s }, null), c = new de();
      this.closure(l, i, c, !0, r, !1);
    }
    return i;
  }
  applyPrecedenceFilter(t) {
    let n;
    const r = [], s = new Xt(t.fullCtx);
    for (let i = 0; i < t.items.length; i++) {
      if (n = t.items[i], n.alt !== 1)
        continue;
      const o = n.semanticContext.evalPrecedence(this.parser, this._outerContext);
      o !== null && (r[n.state.stateNumber] = n.context, o !== n.semanticContext ? s.add(new Mt({ semanticContext: o }, n), this.mergeCache) : s.add(n, this.mergeCache));
    }
    for (let i = 0; i < t.items.length; i++)
      if (n = t.items[i], n.alt !== 1) {
        if (!n.precedenceFilterSuppressed) {
          const o = r[n.state.stateNumber] || null;
          if (o !== null && o.equals(n.context))
            continue;
        }
        s.add(n, this.mergeCache);
      }
    return s;
  }
  getReachableTarget(t, n) {
    return t.matches(n, 0, this.atn.maxTokenType) ? t.target : null;
  }
  getPredsForAmbigAlts(t, n, r) {
    let s = [];
    for (let o = 0; o < n.items.length; o++) {
      const a = n.items[o];
      t.has(a.alt) && (s[a.alt] = ft.orContext(s[a.alt] || null, a.semanticContext));
    }
    let i = 0;
    for (let o = 1; o < r + 1; o++) {
      const a = s[o] || null;
      a === null ? s[o] = ft.NONE : a !== ft.NONE && (i += 1);
    }
    return i === 0 && (s = null), this.debug && console.log("getPredsForAmbigAlts result " + ln(s)), s;
  }
  getPredicatePredictions(t, n) {
    const r = [];
    let s = !1;
    for (let i = 1; i < n.length; i++) {
      const o = n[i];
      t !== null && t.has(i) && r.push(new Ic(o, i)), o !== ft.NONE && (s = !0);
    }
    return s ? r : null;
  }
  getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(t, n) {
    const r = this.splitAccordingToSemanticValidity(t, n), s = r[0], i = r[1];
    let o = this.getAltThatFinishedDecisionEntryRule(s);
    return o !== St.INVALID_ALT_NUMBER || i.items.length > 0 && (o = this.getAltThatFinishedDecisionEntryRule(i), o !== St.INVALID_ALT_NUMBER) ? o : St.INVALID_ALT_NUMBER;
  }
  getAltThatFinishedDecisionEntryRule(t) {
    const n = [];
    for (let r = 0; r < t.items.length; r++) {
      const s = t.items[r];
      (s.reachesIntoOuterContext > 0 || s.state instanceof Jt && s.context.hasEmptyPath()) && n.indexOf(s.alt) < 0 && n.push(s.alt);
    }
    return n.length === 0 ? St.INVALID_ALT_NUMBER : Math.min.apply(null, n);
  }
  splitAccordingToSemanticValidity(t, n) {
    const r = new Xt(t.fullCtx), s = new Xt(t.fullCtx);
    for (let i = 0; i < t.items.length; i++) {
      const o = t.items[i];
      o.semanticContext !== ft.NONE ? o.semanticContext.evaluate(this.parser, n) ? r.add(o) : s.add(o) : r.add(o);
    }
    return [r, s];
  }
  evalSemanticContext(t, n, r) {
    const s = new Ue();
    for (let i = 0; i < t.length; i++) {
      const o = t[i];
      if (o.pred === ft.NONE) {
        if (s.add(o.alt), !r)
          break;
        continue;
      }
      const a = o.pred.evaluate(this.parser, n);
      if ((this.debug || this.dfa_debug) && console.log("eval pred " + o + "=" + a), a && ((this.debug || this.dfa_debug) && console.log("PREDICT " + o.alt), s.add(o.alt), !r))
        break;
    }
    return s;
  }
  closure(t, n, r, s, i, o) {
    this.closureCheckingStopState(
      t,
      n,
      r,
      s,
      i,
      0,
      o
    );
  }
  closureCheckingStopState(t, n, r, s, i, o, a) {
    if ((this.debug || this.debug_closure) && (console.log("closure(" + t.toString(this.parser, !0) + ")"), t.reachesIntoOuterContext > 50))
      throw "problem";
    if (t.state instanceof Jt)
      if (t.context.isEmpty())
        if (i) {
          n.add(t, this.mergeCache);
          return;
        } else
          this.debug && console.log("FALLING off rule " + this.getRuleName(t.state.ruleIndex));
      else {
        for (let l = 0; l < t.context.length; l++) {
          if (t.context.getReturnState(l) === it.EMPTY_RETURN_STATE) {
            if (i) {
              n.add(new Mt({ state: t.state, context: it.EMPTY }, t), this.mergeCache);
              continue;
            } else
              this.debug && console.log("FALLING off rule " + this.getRuleName(t.state.ruleIndex)), this.closure_(
                t,
                n,
                r,
                s,
                i,
                o,
                a
              );
            continue;
          }
          const c = this.atn.states[t.context.getReturnState(l)], u = t.context.getParent(l), d = { state: c, alt: t.alt, context: u, semanticContext: t.semanticContext }, f = new Mt(d, null);
          f.reachesIntoOuterContext = t.reachesIntoOuterContext, this.closureCheckingStopState(f, n, r, s, i, o - 1, a);
        }
        return;
      }
    this.closure_(t, n, r, s, i, o, a);
  }
  closure_(t, n, r, s, i, o, a) {
    const l = t.state;
    l.epsilonOnlyTransitions || n.add(t, this.mergeCache);
    for (let c = 0; c < l.transitions.length; c++) {
      if (c === 0 && this.canDropLoopEntryEdgeInLeftRecursiveRule(t))
        continue;
      const u = l.transitions[c], d = s && !(u instanceof Ac), f = this.getEpsilonTarget(t, u, d, o === 0, i, a);
      if (f !== null) {
        let m = o;
        if (t.state instanceof Jt) {
          if (this._dfa !== null && this._dfa.precedenceDfa && u.outermostPrecedenceReturn === this._dfa.atnStartState.ruleIndex && (f.precedenceFilterSuppressed = !0), f.reachesIntoOuterContext += 1, r.add(f) !== f)
            continue;
          n.dipsIntoOuterContext = !0, m -= 1, this.debug && console.log("dips into outer ctx: " + f);
        } else {
          if (!u.isEpsilon && r.add(f) !== f)
            continue;
          u instanceof Os && m >= 0 && (m += 1);
        }
        this.closureCheckingStopState(f, n, r, d, i, m, a);
      }
    }
  }
  canDropLoopEntryEdgeInLeftRecursiveRule(t) {
    const n = t.state;
    if (n.stateType !== $.STAR_LOOP_ENTRY || n.stateType !== $.STAR_LOOP_ENTRY || !n.isPrecedenceDecision || t.context.isEmpty() || t.context.hasEmptyPath())
      return !1;
    const r = t.context.length;
    for (let o = 0; o < r; o++)
      if (this.atn.states[t.context.getReturnState(o)].ruleIndex !== n.ruleIndex)
        return !1;
    const s = n.transitions[0].target.endState.stateNumber, i = this.atn.states[s];
    for (let o = 0; o < r; o++) {
      const a = t.context.getReturnState(o), l = this.atn.states[a];
      if (l.transitions.length !== 1 || !l.transitions[0].isEpsilon)
        return !1;
      const c = l.transitions[0].target;
      if (!(l.stateType === $.BLOCK_END && c === n) && l !== i && c !== i && !(c.stateType === $.BLOCK_END && c.transitions.length === 1 && c.transitions[0].isEpsilon && c.transitions[0].target === n))
        return !1;
    }
    return !0;
  }
  getRuleName(t) {
    return this.parser !== null && t >= 0 ? this.parser.ruleNames[t] : "<rule " + t + ">";
  }
  getEpsilonTarget(t, n, r, s, i, o) {
    switch (n.serializationType) {
      case D.RULE:
        return this.ruleTransition(t, n);
      case D.PRECEDENCE:
        return this.precedenceTransition(t, n, r, s, i);
      case D.PREDICATE:
        return this.predTransition(t, n, r, s, i);
      case D.ACTION:
        return this.actionTransition(t, n);
      case D.EPSILON:
        return new Mt({ state: n.target }, t);
      case D.ATOM:
      case D.RANGE:
      case D.SET:
        return o && n.matches(A.EOF, 0, 1) ? new Mt({ state: n.target }, t) : null;
      default:
        return null;
    }
  }
  actionTransition(t, n) {
    if (this.debug) {
      const r = n.actionIndex === -1 ? 65535 : n.actionIndex;
      console.log("ACTION edge " + n.ruleIndex + ":" + r);
    }
    return new Mt({ state: n.target }, t);
  }
  precedenceTransition(t, n, r, s, i) {
    this.debug && (console.log("PRED (collectPredicates=" + r + ") " + n.precedence + ">=_p, ctx dependent=true"), this.parser !== null && console.log("context surrounding pred is " + ln(this.parser.getRuleInvocationStack())));
    let o = null;
    if (r && s)
      if (i) {
        const a = this._input.index;
        this._input.seek(this._startIndex);
        const l = n.getPredicate().evaluate(this.parser, this._outerContext);
        this._input.seek(a), l && (o = new Mt({ state: n.target }, t));
      } else {
        const a = ft.andContext(t.semanticContext, n.getPredicate());
        o = new Mt({ state: n.target, semanticContext: a }, t);
      }
    else
      o = new Mt({ state: n.target }, t);
    return this.debug && console.log("config from pred transition=" + o), o;
  }
  predTransition(t, n, r, s, i) {
    this.debug && (console.log("PRED (collectPredicates=" + r + ") " + n.ruleIndex + ":" + n.predIndex + ", ctx dependent=" + n.isCtxDependent), this.parser !== null && console.log("context surrounding pred is " + ln(this.parser.getRuleInvocationStack())));
    let o = null;
    if (r && (n.isCtxDependent && s || !n.isCtxDependent))
      if (i) {
        const a = this._input.index;
        this._input.seek(this._startIndex);
        const l = n.getPredicate().evaluate(this.parser, this._outerContext);
        this._input.seek(a), l && (o = new Mt({ state: n.target }, t));
      } else {
        const a = ft.andContext(t.semanticContext, n.getPredicate());
        o = new Mt({ state: n.target, semanticContext: a }, t);
      }
    else
      o = new Mt({ state: n.target }, t);
    return this.debug && console.log("config from pred transition=" + o), o;
  }
  ruleTransition(t, n) {
    this.debug && console.log("CALL rule " + this.getRuleName(n.target.ruleIndex) + ", ctx=" + t.context);
    const r = n.followState, s = ee.create(t.context, r.stateNumber);
    return new Mt({ state: n.target, context: s }, t);
  }
  getConflictingAlts(t) {
    const n = bt.getConflictingAltSubsets(t);
    return bt.getAlts(n);
  }
  getConflictingAltsOrUniqueAlt(t) {
    let n = null;
    return t.uniqueAlt !== St.INVALID_ALT_NUMBER ? (n = new Ue(), n.add(t.uniqueAlt)) : n = t.conflictingAlts, n;
  }
  getTokenName(t) {
    if (t === A.EOF)
      return "EOF";
    if (this.parser !== null && this.parser.literalNames !== null)
      if (t >= this.parser.literalNames.length && t >= this.parser.symbolicNames.length)
        console.log("" + t + " ttype out of range: " + this.parser.literalNames), console.log("" + this.parser.getInputStream().getTokens());
      else
        return (this.parser.literalNames[t] || this.parser.symbolicNames[t]) + "<" + t + ">";
    return "" + t;
  }
  getLookaheadName(t) {
    return this.getTokenName(t.LA(1));
  }
  dumpDeadEndConfigs(t) {
    console.log("dead end configs: ");
    const n = t.getDeadEndConfigs();
    for (let r = 0; r < n.length; r++) {
      const s = n[r];
      let i = "no edges";
      if (s.state.transitions.length > 0) {
        const o = s.state.transitions[0];
        o instanceof Cs ? i = "Atom " + this.getTokenName(o.label) : o instanceof oo && (i = (o instanceof ao ? "~" : "") + "Set " + o.set);
      }
      console.error(s.toString(this.parser, !0) + ":" + i);
    }
  }
  noViableAlt(t, n, r, s) {
    return new Lo(this.parser, t, t.get(s), t.LT(1), r, n);
  }
  getUniqueAlt(t) {
    let n = St.INVALID_ALT_NUMBER;
    for (let r = 0; r < t.items.length; r++) {
      const s = t.items[r];
      if (n === St.INVALID_ALT_NUMBER)
        n = s.alt;
      else if (s.alt !== n)
        return St.INVALID_ALT_NUMBER;
    }
    return n;
  }
  addDFAEdge(t, n, r, s) {
    if (this.debug && console.log("EDGE " + n + " -> " + s + " upon " + this.getTokenName(r)), s === null)
      return null;
    if (s = this.addDFAState(t, s), n === null || r < -1 || r > this.atn.maxTokenType)
      return s;
    if (n.edges === null && (n.edges = []), n.edges[r + 1] = s, this.debug) {
      const i = this.parser === null ? null : this.parser.literalNames, o = this.parser === null ? null : this.parser.symbolicNames;
      console.log(`DFA=
` + t.toString(i, o));
    }
    return s;
  }
  addDFAState(t, n) {
    if (n === ze.ERROR)
      return n;
    const r = t.states.get(n);
    return r !== null ? r : (n.stateNumber = t.states.length, n.configs.readOnly || (n.configs.optimizeConfigs(this), n.configs.setReadonly(!0)), t.states.add(n), this.debug && console.log("adding new DFA state: " + n), n);
  }
  reportAttemptingFullContext(t, n, r, s, i) {
    if (this.debug || this.retry_debug) {
      const o = new pt(s, i + 1);
      console.log("reportAttemptingFullContext decision=" + t.decision + ":" + r + ", input=" + this.parser.getTokenStream().getText(o));
    }
    this.parser !== null && this.parser.getErrorListenerDispatch().reportAttemptingFullContext(this.parser, t, s, i, n, r);
  }
  reportContextSensitivity(t, n, r, s, i) {
    if (this.debug || this.retry_debug) {
      const o = new pt(s, i + 1);
      console.log("reportContextSensitivity decision=" + t.decision + ":" + r + ", input=" + this.parser.getTokenStream().getText(o));
    }
    this.parser !== null && this.parser.getErrorListenerDispatch().reportContextSensitivity(this.parser, t, s, i, n, r);
  }
  reportAmbiguity(t, n, r, s, i, o, a) {
    if (this.debug || this.retry_debug) {
      const l = new pt(r, s + 1);
      console.log("reportAmbiguity " + o + ":" + a + ", input=" + this.parser.getTokenStream().getText(l));
    }
    this.parser !== null && this.parser.getErrorListenerDispatch().reportAmbiguity(this.parser, t, r, s, i, o, a);
  }
}
const s5 = { ATN: St, ATNDeserializer: Rc, LexerATNSimulator: Ot, ParserATNSimulator: r5, PredictionMode: bt };
class yo {
  constructor(t, n, r) {
    this.dfa = t, this.literalNames = n || [], this.symbolicNames = r || [];
  }
  toString() {
    if (this.dfa.s0 === null)
      return null;
    let t = "";
    const n = this.dfa.sortedStates();
    for (let r = 0; r < n.length; r++) {
      const s = n[r];
      if (s.edges !== null) {
        const i = s.edges.length;
        for (let o = 0; o < i; o++) {
          const a = s.edges[o] || null;
          a !== null && a.stateNumber !== 2147483647 && (t = t.concat(this.getStateString(s)), t = t.concat("-"), t = t.concat(this.getEdgeLabel(o)), t = t.concat("->"), t = t.concat(this.getStateString(a)), t = t.concat(`
`));
        }
      }
    }
    return t.length === 0 ? null : t;
  }
  getEdgeLabel(t) {
    return t === 0 ? "EOF" : this.literalNames !== null || this.symbolicNames !== null ? this.literalNames[t - 1] || this.symbolicNames[t - 1] : String.fromCharCode(t - 1);
  }
  getStateString(t) {
    const n = (t.isAcceptState ? ":" : "") + "s" + t.stateNumber + (t.requiresFullContext ? "^" : "");
    return t.isAcceptState ? t.predicates !== null ? n + "=>" + ln(t.predicates) : n + "=>" + t.prediction.toString() : n;
  }
}
class Oc extends yo {
  constructor(t) {
    super(t, null);
  }
  getEdgeLabel(t) {
    return "'" + String.fromCharCode(t) + "'";
  }
}
class i5 {
  constructor(t, n) {
    if (n === void 0 && (n = 0), this.atnStartState = t, this.decision = n, this._states = new de(), this.s0 = null, this.precedenceDfa = !1, t instanceof bn && t.isPrecedenceDecision) {
      this.precedenceDfa = !0;
      const r = new Ye(null, new Xt());
      r.edges = [], r.isAcceptState = !1, r.requiresFullContext = !1, this.s0 = r;
    }
  }
  getPrecedenceStartState(t) {
    if (!this.precedenceDfa)
      throw "Only precedence DFAs may contain a precedence start state.";
    return t < 0 || t >= this.s0.edges.length ? null : this.s0.edges[t] || null;
  }
  setPrecedenceStartState(t, n) {
    if (!this.precedenceDfa)
      throw "Only precedence DFAs may contain a precedence start state.";
    t < 0 || (this.s0.edges[t] = n);
  }
  setPrecedenceDfa(t) {
    if (this.precedenceDfa !== t) {
      if (this._states = new de(), t) {
        const n = new Ye(null, new Xt());
        n.edges = [], n.isAcceptState = !1, n.requiresFullContext = !1, this.s0 = n;
      } else
        this.s0 = null;
      this.precedenceDfa = t;
    }
  }
  sortedStates() {
    return this._states.values().sort(function(t, n) {
      return t.stateNumber - n.stateNumber;
    });
  }
  toString(t, n) {
    return t = t || null, n = n || null, this.s0 === null ? "" : new yo(this, t, n).toString();
  }
  toLexerString() {
    return this.s0 === null ? "" : new Oc(this).toString();
  }
  get states() {
    return this._states;
  }
}
const o5 = { DFA: i5, DFASerializer: yo, LexerDFASerializer: Oc, PredPrediction: Ic };
class Nc {
  visitTerminal(t) {
  }
  visitErrorNode(t) {
  }
  enterEveryRule(t) {
  }
  exitEveryRule(t) {
  }
}
class a5 {
  visit(t) {
    return Array.isArray(t) ? t.map(function(n) {
      return n.accept(this);
    }, this) : t.accept(this);
  }
  visitChildren(t) {
    return t.children ? this.visit(t.children) : null;
  }
  visitTerminal(t) {
  }
  visitErrorNode(t) {
  }
}
class v1 {
  walk(t, n) {
    if (n instanceof ai || n.isErrorNode !== void 0 && n.isErrorNode())
      t.visitErrorNode(n);
    else if (n instanceof Xe)
      t.visitTerminal(n);
    else {
      this.enterRule(t, n);
      for (let r = 0; r < n.getChildCount(); r++) {
        const s = n.getChild(r);
        this.walk(t, s);
      }
      this.exitRule(t, n);
    }
  }
  enterRule(t, n) {
    const r = n.getRuleContext();
    t.enterEveryRule(r), r.enterRule(t);
  }
  exitRule(t, n) {
    const r = n.getRuleContext();
    r.exitRule(t), t.exitEveryRule(r);
  }
}
v1.DEFAULT = new v1();
const l5 = { Trees: Pe, RuleNode: Ns, ErrorNode: ai, TerminalNode: Xe, ParseTreeListener: Nc, ParseTreeVisitor: a5, ParseTreeWalker: v1 };
class Pr extends mn {
  constructor(t) {
    super({ message: "", recognizer: t, input: t.getInputStream(), ctx: t._ctx }), this.offendingToken = t.getCurrentToken();
  }
}
class Pc extends mn {
  constructor(t, n, r) {
    super({
      message: c5(n, r || null),
      recognizer: t,
      input: t.getInputStream(),
      ctx: t._ctx
    });
    const s = t._interp.atn.states[t.state].transitions[0];
    s instanceof Sc ? (this.ruleIndex = s.ruleIndex, this.predicateIndex = s.predIndex) : (this.ruleIndex = 0, this.predicateIndex = 0), this.predicate = n, this.offendingToken = t.getCurrentToken();
  }
}
function c5(e, t) {
  return t !== null ? t : "failed predicate: {" + e + "}?";
}
class h5 extends hi {
  constructor(t) {
    super(), t = t || !0, this.exactOnly = t;
  }
  reportAmbiguity(t, n, r, s, i, o, a) {
    if (this.exactOnly && !i)
      return;
    const l = "reportAmbiguity d=" + this.getDecisionDescription(t, n) + ": ambigAlts=" + this.getConflictingAlts(o, a) + ", input='" + t.getTokenStream().getText(new pt(r, s)) + "'";
    t.notifyErrorListeners(l);
  }
  reportAttemptingFullContext(t, n, r, s, i, o) {
    const a = "reportAttemptingFullContext d=" + this.getDecisionDescription(t, n) + ", input='" + t.getTokenStream().getText(new pt(r, s)) + "'";
    t.notifyErrorListeners(a);
  }
  reportContextSensitivity(t, n, r, s, i, o) {
    const a = "reportContextSensitivity d=" + this.getDecisionDescription(t, n) + ", input='" + t.getTokenStream().getText(new pt(r, s)) + "'";
    t.notifyErrorListeners(a);
  }
  getDecisionDescription(t, n) {
    const r = n.decision, s = n.atnStartState.ruleIndex, i = t.ruleNames;
    if (s < 0 || s >= i.length)
      return "" + r;
    const o = i[s] || null;
    return o === null || o.length === 0 ? "" + r : `${r} (${o})`;
  }
  getConflictingAlts(t, n) {
    if (t !== null)
      return t;
    const r = new Ue();
    for (let s = 0; s < n.items.length; s++)
      r.add(n.items[s].alt);
    return `{${r.values().join(", ")}}`;
  }
}
class vo extends Error {
  constructor() {
    super(), Error.captureStackTrace(this, vo);
  }
}
class u5 {
  reset(t) {
  }
  recoverInline(t) {
  }
  recover(t, n) {
  }
  sync(t) {
  }
  inErrorRecoveryMode(t) {
  }
  reportError(t) {
  }
}
class bo extends u5 {
  constructor() {
    super(), this.errorRecoveryMode = !1, this.lastErrorIndex = -1, this.lastErrorStates = null, this.nextTokensContext = null, this.nextTokenState = 0;
  }
  reset(t) {
    this.endErrorCondition(t);
  }
  beginErrorCondition(t) {
    this.errorRecoveryMode = !0;
  }
  inErrorRecoveryMode(t) {
    return this.errorRecoveryMode;
  }
  endErrorCondition(t) {
    this.errorRecoveryMode = !1, this.lastErrorStates = null, this.lastErrorIndex = -1;
  }
  reportMatch(t) {
    this.endErrorCondition(t);
  }
  reportError(t, n) {
    this.inErrorRecoveryMode(t) || (this.beginErrorCondition(t), n instanceof Lo ? this.reportNoViableAlternative(t, n) : n instanceof Pr ? this.reportInputMismatch(t, n) : n instanceof Pc ? this.reportFailedPredicate(t, n) : (console.log("unknown recognition error type: " + n.constructor.name), console.log(n.stack), t.notifyErrorListeners(n.getOffendingToken(), n.getMessage(), n)));
  }
  recover(t, n) {
    this.lastErrorIndex === t.getInputStream().index && this.lastErrorStates !== null && this.lastErrorStates.indexOf(t.state) >= 0 && t.consume(), this.lastErrorIndex = t._input.index, this.lastErrorStates === null && (this.lastErrorStates = []), this.lastErrorStates.push(t.state);
    const r = this.getErrorRecoverySet(t);
    this.consumeUntil(t, r);
  }
  sync(t) {
    if (this.inErrorRecoveryMode(t))
      return;
    const n = t._interp.atn.states[t.state], r = t.getTokenStream().LA(1), s = t.atn.nextTokens(n);
    if (s.contains(r)) {
      this.nextTokensContext = null, this.nextTokenState = $.INVALID_STATE_NUMBER;
      return;
    } else if (s.contains(A.EPSILON)) {
      this.nextTokensContext === null && (this.nextTokensContext = t._ctx, this.nextTokensState = t._stateNumber);
      return;
    }
    switch (n.stateType) {
      case $.BLOCK_START:
      case $.STAR_BLOCK_START:
      case $.PLUS_BLOCK_START:
      case $.STAR_LOOP_ENTRY:
        if (this.singleTokenDeletion(t) !== null)
          return;
        throw new Pr(t);
      case $.PLUS_LOOP_BACK:
      case $.STAR_LOOP_BACK:
        {
          this.reportUnwantedToken(t);
          const i = new ye();
          i.addSet(t.getExpectedTokens());
          const o = i.addSet(this.getErrorRecoverySet(t));
          this.consumeUntil(t, o);
        }
        break;
    }
  }
  reportNoViableAlternative(t, n) {
    const r = t.getTokenStream();
    let s;
    r !== null ? n.startToken.type === A.EOF ? s = "<EOF>" : s = r.getText(new pt(n.startToken.tokenIndex, n.offendingToken.tokenIndex)) : s = "<unknown input>";
    const i = "no viable alternative at input " + this.escapeWSAndQuote(s);
    t.notifyErrorListeners(i, n.offendingToken, n);
  }
  reportInputMismatch(t, n) {
    const r = "mismatched input " + this.getTokenErrorDisplay(n.offendingToken) + " expecting " + n.getExpectedTokens().toString(t.literalNames, t.symbolicNames);
    t.notifyErrorListeners(r, n.offendingToken, n);
  }
  reportFailedPredicate(t, n) {
    const r = "rule " + t.ruleNames[t._ctx.ruleIndex] + " " + n.message;
    t.notifyErrorListeners(r, n.offendingToken, n);
  }
  reportUnwantedToken(t) {
    if (this.inErrorRecoveryMode(t))
      return;
    this.beginErrorCondition(t);
    const n = t.getCurrentToken(), r = this.getTokenErrorDisplay(n), s = this.getExpectedTokens(t), i = "extraneous input " + r + " expecting " + s.toString(t.literalNames, t.symbolicNames);
    t.notifyErrorListeners(i, n, null);
  }
  reportMissingToken(t) {
    if (this.inErrorRecoveryMode(t))
      return;
    this.beginErrorCondition(t);
    const n = t.getCurrentToken(), r = "missing " + this.getExpectedTokens(t).toString(t.literalNames, t.symbolicNames) + " at " + this.getTokenErrorDisplay(n);
    t.notifyErrorListeners(r, n, null);
  }
  recoverInline(t) {
    const n = this.singleTokenDeletion(t);
    if (n !== null)
      return t.consume(), n;
    if (this.singleTokenInsertion(t))
      return this.getMissingSymbol(t);
    throw new Pr(t);
  }
  singleTokenInsertion(t) {
    const n = t.getTokenStream().LA(1), r = t._interp.atn, s = r.states[t.state].transitions[0].target;
    return r.nextTokens(s, t._ctx).contains(n) ? (this.reportMissingToken(t), !0) : !1;
  }
  singleTokenDeletion(t) {
    const n = t.getTokenStream().LA(2);
    if (this.getExpectedTokens(t).contains(n)) {
      this.reportUnwantedToken(t), t.consume();
      const r = t.getCurrentToken();
      return this.reportMatch(t), r;
    } else
      return null;
  }
  getMissingSymbol(t) {
    const n = t.getCurrentToken(), r = this.getExpectedTokens(t).first();
    let s;
    r === A.EOF ? s = "<missing EOF>" : s = "<missing " + t.literalNames[r] + ">";
    let i = n;
    const o = t.getTokenStream().LT(-1);
    return i.type === A.EOF && o !== null && (i = o), t.getTokenFactory().create(
      i.source,
      r,
      s,
      A.DEFAULT_CHANNEL,
      -1,
      -1,
      i.line,
      i.column
    );
  }
  getExpectedTokens(t) {
    return t.getExpectedTokens();
  }
  getTokenErrorDisplay(t) {
    if (t === null)
      return "<no token>";
    let n = t.text;
    return n === null && (t.type === A.EOF ? n = "<EOF>" : n = "<" + t.type + ">"), this.escapeWSAndQuote(n);
  }
  escapeWSAndQuote(t) {
    return t = t.replace(/\n/g, "\\n"), t = t.replace(/\r/g, "\\r"), t = t.replace(/\t/g, "\\t"), "'" + t + "'";
  }
  getErrorRecoverySet(t) {
    const n = t._interp.atn;
    let r = t._ctx;
    const s = new ye();
    for (; r !== null && r.invokingState >= 0; ) {
      const i = n.states[r.invokingState].transitions[0], o = n.nextTokens(i.followState);
      s.addSet(o), r = r.parentCtx;
    }
    return s.removeOne(A.EPSILON), s;
  }
  consumeUntil(t, n) {
    let r = t.getTokenStream().LA(1);
    for (; r !== A.EOF && !n.contains(r); )
      t.consume(), r = t.getTokenStream().LA(1);
  }
}
class d5 extends bo {
  constructor() {
    super();
  }
  recover(t, n) {
    let r = t._ctx;
    for (; r !== null; )
      r.exception = n, r = r.parentCtx;
    throw new vo(n);
  }
  recoverInline(t) {
    this.recover(t, new Pr(t));
  }
  sync(t) {
  }
}
const p5 = {
  RecognitionException: mn,
  NoViableAltException: Lo,
  LexerNoViableAltException: xo,
  InputMismatchException: Pr,
  FailedPredicateException: Pc,
  DiagnosticErrorListener: h5,
  BailErrorStrategy: d5,
  DefaultErrorStrategy: bo,
  ErrorListener: hi
};
class _n {
  constructor(t, n) {
    if (this.name = "<empty>", this.strdata = t, this.decodeToUnicodeCodePoints = n || !1, this._index = 0, this.data = [], this.decodeToUnicodeCodePoints)
      for (let r = 0; r < this.strdata.length; ) {
        const s = this.strdata.codePointAt(r);
        this.data.push(s), r += s <= 65535 ? 1 : 2;
      }
    else {
      this.data = new Array(this.strdata.length);
      for (let r = 0; r < this.strdata.length; r++) {
        const s = this.strdata.charCodeAt(r);
        this.data[r] = s;
      }
    }
    this._size = this.data.length;
  }
  reset() {
    this._index = 0;
  }
  consume() {
    if (this._index >= this._size)
      throw "cannot consume EOF";
    this._index += 1;
  }
  LA(t) {
    if (t === 0)
      return 0;
    t < 0 && (t += 1);
    const n = this._index + t - 1;
    return n < 0 || n >= this._size ? A.EOF : this.data[n];
  }
  LT(t) {
    return this.LA(t);
  }
  mark() {
    return -1;
  }
  release(t) {
  }
  seek(t) {
    if (t <= this._index) {
      this._index = t;
      return;
    }
    this._index = Math.min(t, this._size);
  }
  getText(t, n) {
    if (n >= this._size && (n = this._size - 1), t >= this._size)
      return "";
    if (this.decodeToUnicodeCodePoints) {
      let r = "";
      for (let s = t; s <= n; s++)
        r += String.fromCodePoint(this.data[s]);
      return r;
    } else
      return this.strdata.slice(t, n + 1);
  }
  toString() {
    return this.strdata;
  }
  get index() {
    return this._index;
  }
  get size() {
    return this._size;
  }
}
const b1 = {}, f5 = {
  fromString: function(e) {
    return new _n(e, !0);
  },
  fromBlob: function(e, t, n, r) {
    const s = new window.FileReader();
    s.onload = function(i) {
      const o = new _n(i.target.result, !0);
      n(o);
    }, s.onerror = r, s.readAsText(e, t);
  },
  fromBuffer: function(e, t) {
    return new _n(e.toString(t), !0);
  },
  fromPath: function(e, t, n) {
    b1.readFile(e, t, function(r, s) {
      let i = null;
      s !== null && (i = new _n(s, !0)), n(r, i);
    });
  },
  fromPathSync: function(e, t) {
    const n = b1.readFileSync(e, t);
    return new _n(n, !0);
  }
};
class g5 extends _n {
  constructor(t, n) {
    const r = b1.readFileSync(t, "utf8");
    super(r, n), this.fileName = t;
  }
}
class m5 {
}
class x5 extends m5 {
  constructor(t) {
    super(), this.tokenSource = t, this.tokens = [], this.index = -1, this.fetchedEOF = !1;
  }
  mark() {
    return 0;
  }
  release(t) {
  }
  reset() {
    this.seek(0);
  }
  seek(t) {
    this.lazyInit(), this.index = this.adjustSeekIndex(t);
  }
  get(t) {
    return this.lazyInit(), this.tokens[t];
  }
  consume() {
    let t = !1;
    if (this.index >= 0 ? this.fetchedEOF ? t = this.index < this.tokens.length - 1 : t = this.index < this.tokens.length : t = !1, !t && this.LA(1) === A.EOF)
      throw "cannot consume EOF";
    this.sync(this.index + 1) && (this.index = this.adjustSeekIndex(this.index + 1));
  }
  sync(t) {
    const n = t - this.tokens.length + 1;
    return n > 0 ? this.fetch(n) >= n : !0;
  }
  fetch(t) {
    if (this.fetchedEOF)
      return 0;
    for (let n = 0; n < t; n++) {
      const r = this.tokenSource.nextToken();
      if (r.tokenIndex = this.tokens.length, this.tokens.push(r), r.type === A.EOF)
        return this.fetchedEOF = !0, n + 1;
    }
    return t;
  }
  getTokens(t, n, r) {
    if (r === void 0 && (r = null), t < 0 || n < 0)
      return null;
    this.lazyInit();
    const s = [];
    n >= this.tokens.length && (n = this.tokens.length - 1);
    for (let i = t; i < n; i++) {
      const o = this.tokens[i];
      if (o.type === A.EOF)
        break;
      (r === null || r.contains(o.type)) && s.push(o);
    }
    return s;
  }
  LA(t) {
    return this.LT(t).type;
  }
  LB(t) {
    return this.index - t < 0 ? null : this.tokens[this.index - t];
  }
  LT(t) {
    if (this.lazyInit(), t === 0)
      return null;
    if (t < 0)
      return this.LB(-t);
    const n = this.index + t - 1;
    return this.sync(n), n >= this.tokens.length ? this.tokens[this.tokens.length - 1] : this.tokens[n];
  }
  adjustSeekIndex(t) {
    return t;
  }
  lazyInit() {
    this.index === -1 && this.setup();
  }
  setup() {
    this.sync(0), this.index = this.adjustSeekIndex(0);
  }
  setTokenSource(t) {
    this.tokenSource = t, this.tokens = [], this.index = -1, this.fetchedEOF = !1;
  }
  nextTokenOnChannel(t, n) {
    if (this.sync(t), t >= this.tokens.length)
      return -1;
    let r = this.tokens[t];
    for (; r.channel !== this.channel; ) {
      if (r.type === A.EOF)
        return -1;
      t += 1, this.sync(t), r = this.tokens[t];
    }
    return t;
  }
  previousTokenOnChannel(t, n) {
    for (; t >= 0 && this.tokens[t].channel !== n; )
      t -= 1;
    return t;
  }
  getHiddenTokensToRight(t, n) {
    if (n === void 0 && (n = -1), this.lazyInit(), t < 0 || t >= this.tokens.length)
      throw "" + t + " not in 0.." + this.tokens.length - 1;
    const r = this.nextTokenOnChannel(t + 1, Nt.DEFAULT_TOKEN_CHANNEL), s = t + 1, i = r === -1 ? this.tokens.length - 1 : r;
    return this.filterForChannel(s, i, n);
  }
  getHiddenTokensToLeft(t, n) {
    if (n === void 0 && (n = -1), this.lazyInit(), t < 0 || t >= this.tokens.length)
      throw "" + t + " not in 0.." + this.tokens.length - 1;
    const r = this.previousTokenOnChannel(t - 1, Nt.DEFAULT_TOKEN_CHANNEL);
    if (r === t - 1)
      return null;
    const s = r + 1, i = t - 1;
    return this.filterForChannel(s, i, n);
  }
  filterForChannel(t, n, r) {
    const s = [];
    for (let i = t; i < n + 1; i++) {
      const o = this.tokens[i];
      r === -1 ? o.channel !== Nt.DEFAULT_TOKEN_CHANNEL && s.push(o) : o.channel === r && s.push(o);
    }
    return s.length === 0 ? null : s;
  }
  getSourceName() {
    return this.tokenSource.getSourceName();
  }
  getText(t) {
    this.lazyInit(), this.fill(), t == null && (t = new pt(0, this.tokens.length - 1));
    let n = t.start;
    n instanceof A && (n = n.tokenIndex);
    let r = t.stop;
    if (r instanceof A && (r = r.tokenIndex), n === null || r === null || n < 0 || r < 0)
      return "";
    r >= this.tokens.length && (r = this.tokens.length - 1);
    let s = "";
    for (let i = n; i < r + 1; i++) {
      const o = this.tokens[i];
      if (o.type === A.EOF)
        break;
      s = s + o.text;
    }
    return s;
  }
  fill() {
    for (this.lazyInit(); this.fetch(1e3) === 1e3; )
      ;
  }
}
class L5 extends x5 {
  constructor(t, n) {
    super(t), this.channel = n === void 0 ? A.DEFAULT_CHANNEL : n;
  }
  adjustSeekIndex(t) {
    return this.nextTokenOnChannel(t, this.channel);
  }
  LB(t) {
    if (t === 0 || this.index - t < 0)
      return null;
    let n = this.index, r = 1;
    for (; r <= t; )
      n = this.previousTokenOnChannel(n - 1, this.channel), r += 1;
    return n < 0 ? null : this.tokens[n];
  }
  LT(t) {
    if (this.lazyInit(), t === 0)
      return null;
    if (t < 0)
      return this.LB(-t);
    let n = this.index, r = 1;
    for (; r < t; )
      this.sync(n + 1) && (n = this.nextTokenOnChannel(n + 1, this.channel)), r += 1;
    return this.tokens[n];
  }
  getNumberOfOnChannelTokens() {
    let t = 0;
    this.fill();
    for (let n = 0; n < this.tokens.length; n++) {
      const r = this.tokens[n];
      if (r.channel === this.channel && (t += 1), r.type === A.EOF)
        break;
    }
    return t;
  }
}
class y5 extends Nc {
  constructor(t) {
    super(), this.parser = t;
  }
  enterEveryRule(t) {
    console.log("enter   " + this.parser.ruleNames[t.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
  }
  visitTerminal(t) {
    console.log("consume " + t.symbol + " rule " + this.parser.ruleNames[this.parser._ctx.ruleIndex]);
  }
  exitEveryRule(t) {
    console.log("exit    " + this.parser.ruleNames[t.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
  }
}
class Mc extends ui {
  constructor(t) {
    super(), this._input = null, this._errHandler = new bo(), this._precedenceStack = [], this._precedenceStack.push(0), this._ctx = null, this.buildParseTrees = !0, this._tracer = null, this._parseListeners = null, this._syntaxErrors = 0, this.setInputStream(t);
  }
  reset() {
    this._input !== null && this._input.seek(0), this._errHandler.reset(this), this._ctx = null, this._syntaxErrors = 0, this.setTrace(!1), this._precedenceStack = [], this._precedenceStack.push(0), this._interp !== null && this._interp.reset();
  }
  match(t) {
    let n = this.getCurrentToken();
    return n.type === t ? (this._errHandler.reportMatch(this), this.consume()) : (n = this._errHandler.recoverInline(this), this.buildParseTrees && n.tokenIndex === -1 && this._ctx.addErrorNode(n)), n;
  }
  matchWildcard() {
    let t = this.getCurrentToken();
    return t.type > 0 ? (this._errHandler.reportMatch(this), this.consume()) : (t = this._errHandler.recoverInline(this), this._buildParseTrees && t.tokenIndex === -1 && this._ctx.addErrorNode(t)), t;
  }
  getParseListeners() {
    return this._parseListeners || [];
  }
  addParseListener(t) {
    if (t === null)
      throw "listener";
    this._parseListeners === null && (this._parseListeners = []), this._parseListeners.push(t);
  }
  removeParseListener(t) {
    if (this._parseListeners !== null) {
      const n = this._parseListeners.indexOf(t);
      n >= 0 && this._parseListeners.splice(n, 1), this._parseListeners.length === 0 && (this._parseListeners = null);
    }
  }
  removeParseListeners() {
    this._parseListeners = null;
  }
  triggerEnterRuleEvent() {
    if (this._parseListeners !== null) {
      const t = this._ctx;
      this._parseListeners.forEach(function(n) {
        n.enterEveryRule(t), t.enterRule(n);
      });
    }
  }
  triggerExitRuleEvent() {
    if (this._parseListeners !== null) {
      const t = this._ctx;
      this._parseListeners.slice(0).reverse().forEach(function(n) {
        t.exitRule(n), n.exitEveryRule(t);
      });
    }
  }
  getTokenFactory() {
    return this._input.tokenSource._factory;
  }
  setTokenFactory(t) {
    this._input.tokenSource._factory = t;
  }
  getATNWithBypassAlts() {
    const t = this.getSerializedATN();
    if (t === null)
      throw "The current parser does not support an ATN with bypass alternatives.";
    let n = this.bypassAltsAtnCache[t];
    if (n === null) {
      const r = new $r();
      r.generateRuleBypassTransitions = !0, n = new Rc(r).deserialize(t), this.bypassAltsAtnCache[t] = n;
    }
    return n;
  }
  getInputStream() {
    return this.getTokenStream();
  }
  setInputStream(t) {
    this.setTokenStream(t);
  }
  getTokenStream() {
    return this._input;
  }
  setTokenStream(t) {
    this._input = null, this.reset(), this._input = t;
  }
  getCurrentToken() {
    return this._input.LT(1);
  }
  notifyErrorListeners(t, n, r) {
    n = n || null, r = r || null, n === null && (n = this.getCurrentToken()), this._syntaxErrors += 1;
    const s = n.line, i = n.column;
    this.getErrorListenerDispatch().syntaxError(this, n, s, i, t, r);
  }
  consume() {
    const t = this.getCurrentToken();
    t.type !== A.EOF && this.getInputStream().consume();
    const n = this._parseListeners !== null && this._parseListeners.length > 0;
    if (this.buildParseTrees || n) {
      let r;
      this._errHandler.inErrorRecoveryMode(this) ? r = this._ctx.addErrorNode(t) : r = this._ctx.addTokenNode(t), r.invokingState = this.state, n && this._parseListeners.forEach(function(s) {
        r instanceof ai || r.isErrorNode !== void 0 && r.isErrorNode() ? s.visitErrorNode(r) : r instanceof Xe && s.visitTerminal(r);
      });
    }
    return t;
  }
  addContextToParseTree() {
    this._ctx.parentCtx !== null && this._ctx.parentCtx.addChild(this._ctx);
  }
  enterRule(t, n, r) {
    this.state = n, this._ctx = t, this._ctx.start = this._input.LT(1), this.buildParseTrees && this.addContextToParseTree(), this.triggerEnterRuleEvent();
  }
  exitRule() {
    this._ctx.stop = this._input.LT(-1), this.triggerExitRuleEvent(), this.state = this._ctx.invokingState, this._ctx = this._ctx.parentCtx;
  }
  enterOuterAlt(t, n) {
    t.setAltNumber(n), this.buildParseTrees && this._ctx !== t && this._ctx.parentCtx !== null && (this._ctx.parentCtx.removeLastChild(), this._ctx.parentCtx.addChild(t)), this._ctx = t;
  }
  getPrecedence() {
    return this._precedenceStack.length === 0 ? -1 : this._precedenceStack[this._precedenceStack.length - 1];
  }
  enterRecursionRule(t, n, r, s) {
    this.state = n, this._precedenceStack.push(s), this._ctx = t, this._ctx.start = this._input.LT(1), this.triggerEnterRuleEvent();
  }
  pushNewRecursionContext(t, n, r) {
    const s = this._ctx;
    s.parentCtx = t, s.invokingState = n, s.stop = this._input.LT(-1), this._ctx = t, this._ctx.start = s.start, this.buildParseTrees && this._ctx.addChild(s), this.triggerEnterRuleEvent();
  }
  unrollRecursionContexts(t) {
    this._precedenceStack.pop(), this._ctx.stop = this._input.LT(-1);
    const n = this._ctx, r = this.getParseListeners();
    if (r !== null && r.length > 0)
      for (; this._ctx !== t; )
        this.triggerExitRuleEvent(), this._ctx = this._ctx.parentCtx;
    else
      this._ctx = t;
    n.parentCtx = t, this.buildParseTrees && t !== null && t.addChild(n);
  }
  getInvokingContext(t) {
    let n = this._ctx;
    for (; n !== null; ) {
      if (n.ruleIndex === t)
        return n;
      n = n.parentCtx;
    }
    return null;
  }
  precpred(t, n) {
    return n >= this._precedenceStack[this._precedenceStack.length - 1];
  }
  inContext(t) {
    return !1;
  }
  isExpectedToken(t) {
    const n = this._interp.atn;
    let r = this._ctx;
    const s = n.states[this.state];
    let i = n.nextTokens(s);
    if (i.contains(t))
      return !0;
    if (!i.contains(A.EPSILON))
      return !1;
    for (; r !== null && r.invokingState >= 0 && i.contains(A.EPSILON); ) {
      const o = n.states[r.invokingState].transitions[0];
      if (i = n.nextTokens(o.followState), i.contains(t))
        return !0;
      r = r.parentCtx;
    }
    return !!(i.contains(A.EPSILON) && t === A.EOF);
  }
  getExpectedTokens() {
    return this._interp.atn.getExpectedTokens(this.state, this._ctx);
  }
  getExpectedTokensWithinCurrentRule() {
    const t = this._interp.atn, n = t.states[this.state];
    return t.nextTokens(n);
  }
  getRuleIndex(t) {
    const n = this.getRuleIndexMap()[t];
    return n !== null ? n : -1;
  }
  getRuleInvocationStack(t) {
    t = t || null, t === null && (t = this._ctx);
    const n = [];
    for (; t !== null; ) {
      const r = t.ruleIndex;
      r < 0 ? n.push("n/a") : n.push(this.ruleNames[r]), t = t.parentCtx;
    }
    return n;
  }
  getDFAStrings() {
    return this._interp.decisionToDFA.toString();
  }
  dumpDFA() {
    let t = !1;
    for (let n = 0; n < this._interp.decisionToDFA.length; n++) {
      const r = this._interp.decisionToDFA[n];
      r.states.length > 0 && (t && console.log(), this.printer.println("Decision " + r.decision + ":"), this.printer.print(r.toString(this.literalNames, this.symbolicNames)), t = !0);
    }
  }
  getSourceName() {
    return this._input.sourceName;
  }
  setTrace(t) {
    t ? (this._tracer !== null && this.removeParseListener(this._tracer), this._tracer = new y5(this), this.addParseListener(this._tracer)) : (this.removeParseListener(this._tracer), this._tracer = null);
  }
}
Mc.bypassAltsAtnCache = {};
class v5 {
  constructor() {
    this.cache = new Zr();
  }
  add(t) {
    if (t === it.EMPTY)
      return it.EMPTY;
    const n = this.cache.get(t) || null;
    return n !== null ? n : (this.cache.set(t, t), t);
  }
  get(t) {
    return this.cache.get(t) || null;
  }
  get length() {
    return this.cache.length;
  }
}
class Fc extends Xe {
  constructor(t) {
    super(), this.parentCtx = null, this.symbol = t;
  }
  getChild(t) {
    return null;
  }
  getSymbol() {
    return this.symbol;
  }
  getParent() {
    return this.parentCtx;
  }
  getPayload() {
    return this.symbol;
  }
  getSourceInterval() {
    if (this.symbol === null)
      return pt.INVALID_INTERVAL;
    const t = this.symbol.tokenIndex;
    return new pt(t, t);
  }
  getChildCount() {
    return 0;
  }
  accept(t) {
    return t.visitTerminal(this);
  }
  getText() {
    return this.symbol.text;
  }
  toString() {
    return this.symbol.type === A.EOF ? "<EOF>" : this.symbol.text;
  }
}
class al extends Fc {
  constructor(t) {
    super(t);
  }
  isErrorNode() {
    return !0;
  }
  accept(t) {
    return t.visitErrorNode(this);
  }
}
class zc extends tr {
  constructor(t, n) {
    t = t || null, n = n || null, super(t, n), this.ruleIndex = -1, this.children = null, this.start = null, this.stop = null, this.exception = null;
  }
  copyFrom(t) {
    this.parentCtx = t.parentCtx, this.invokingState = t.invokingState, this.children = null, this.start = t.start, this.stop = t.stop, t.children && (this.children = [], t.children.map(function(n) {
      n instanceof al && (this.children.push(n), n.parentCtx = this);
    }, this));
  }
  enterRule(t) {
  }
  exitRule(t) {
  }
  addChild(t) {
    return this.children === null && (this.children = []), this.children.push(t), t;
  }
  removeLastChild() {
    this.children !== null && this.children.pop();
  }
  addTokenNode(t) {
    const n = new Fc(t);
    return this.addChild(n), n.parentCtx = this, n;
  }
  addErrorNode(t) {
    const n = new al(t);
    return this.addChild(n), n.parentCtx = this, n;
  }
  getChild(t, n) {
    if (n = n || null, this.children === null || t < 0 || t >= this.children.length)
      return null;
    if (n === null)
      return this.children[t];
    for (let r = 0; r < this.children.length; r++) {
      const s = this.children[r];
      if (s instanceof n) {
        if (t === 0)
          return s;
        t -= 1;
      }
    }
    return null;
  }
  getToken(t, n) {
    if (this.children === null || n < 0 || n >= this.children.length)
      return null;
    for (let r = 0; r < this.children.length; r++) {
      const s = this.children[r];
      if (s instanceof Xe && s.symbol.type === t) {
        if (n === 0)
          return s;
        n -= 1;
      }
    }
    return null;
  }
  getTokens(t) {
    if (this.children === null)
      return [];
    {
      const n = [];
      for (let r = 0; r < this.children.length; r++) {
        const s = this.children[r];
        s instanceof Xe && s.symbol.type === t && n.push(s);
      }
      return n;
    }
  }
  getTypedRuleContext(t, n) {
    return this.getChild(n, t);
  }
  getTypedRuleContexts(t) {
    if (this.children === null)
      return [];
    {
      const n = [];
      for (let r = 0; r < this.children.length; r++) {
        const s = this.children[r];
        s instanceof t && n.push(s);
      }
      return n;
    }
  }
  getChildCount() {
    return this.children === null ? 0 : this.children.length;
  }
  getSourceInterval() {
    return this.start === null || this.stop === null ? pt.INVALID_INTERVAL : new pt(this.start.tokenIndex, this.stop.tokenIndex);
  }
}
tr.EMPTY = new zc();
const b5 = { arrayToString: ln }, L = {
  atn: s5,
  dfa: o5,
  tree: l5,
  error: p5,
  Token: A,
  CommonToken: Rn,
  CharStreams: f5,
  InputStream: _n,
  FileStream: g5,
  CommonTokenStream: L5,
  Lexer: Nt,
  Parser: Mc,
  PredictionContextCache: v5,
  ParserRuleContext: zc,
  Interval: pt,
  IntervalSet: ye,
  LL1Analyzer: er,
  Utils: b5
}, w5 = [
  4,
  0,
  65,
  511,
  6,
  -1,
  6,
  -1,
  6,
  -1,
  2,
  0,
  7,
  0,
  2,
  1,
  7,
  1,
  2,
  2,
  7,
  2,
  2,
  3,
  7,
  3,
  2,
  4,
  7,
  4,
  2,
  5,
  7,
  5,
  2,
  6,
  7,
  6,
  2,
  7,
  7,
  7,
  2,
  8,
  7,
  8,
  2,
  9,
  7,
  9,
  2,
  10,
  7,
  10,
  2,
  11,
  7,
  11,
  2,
  12,
  7,
  12,
  2,
  13,
  7,
  13,
  2,
  14,
  7,
  14,
  2,
  15,
  7,
  15,
  2,
  16,
  7,
  16,
  2,
  17,
  7,
  17,
  2,
  18,
  7,
  18,
  2,
  19,
  7,
  19,
  2,
  20,
  7,
  20,
  2,
  21,
  7,
  21,
  2,
  22,
  7,
  22,
  2,
  23,
  7,
  23,
  2,
  24,
  7,
  24,
  2,
  25,
  7,
  25,
  2,
  26,
  7,
  26,
  2,
  27,
  7,
  27,
  2,
  28,
  7,
  28,
  2,
  29,
  7,
  29,
  2,
  30,
  7,
  30,
  2,
  31,
  7,
  31,
  2,
  32,
  7,
  32,
  2,
  33,
  7,
  33,
  2,
  34,
  7,
  34,
  2,
  35,
  7,
  35,
  2,
  36,
  7,
  36,
  2,
  37,
  7,
  37,
  2,
  38,
  7,
  38,
  2,
  39,
  7,
  39,
  2,
  40,
  7,
  40,
  2,
  41,
  7,
  41,
  2,
  42,
  7,
  42,
  2,
  43,
  7,
  43,
  2,
  44,
  7,
  44,
  2,
  45,
  7,
  45,
  2,
  46,
  7,
  46,
  2,
  47,
  7,
  47,
  2,
  48,
  7,
  48,
  2,
  49,
  7,
  49,
  2,
  50,
  7,
  50,
  2,
  51,
  7,
  51,
  2,
  52,
  7,
  52,
  2,
  53,
  7,
  53,
  2,
  54,
  7,
  54,
  2,
  55,
  7,
  55,
  2,
  56,
  7,
  56,
  2,
  57,
  7,
  57,
  2,
  58,
  7,
  58,
  2,
  59,
  7,
  59,
  2,
  60,
  7,
  60,
  2,
  61,
  7,
  61,
  2,
  62,
  7,
  62,
  2,
  63,
  7,
  63,
  2,
  64,
  7,
  64,
  2,
  65,
  7,
  65,
  1,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  2,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  4,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  5,
  1,
  6,
  1,
  6,
  1,
  6,
  1,
  6,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  8,
  1,
  8,
  1,
  8,
  1,
  9,
  1,
  9,
  1,
  9,
  1,
  10,
  1,
  10,
  1,
  11,
  1,
  11,
  4,
  11,
  201,
  8,
  11,
  11,
  11,
  12,
  11,
  202,
  1,
  12,
  1,
  12,
  1,
  12,
  1,
  13,
  1,
  13,
  1,
  13,
  1,
  14,
  1,
  14,
  1,
  14,
  1,
  15,
  1,
  15,
  1,
  15,
  1,
  16,
  1,
  16,
  1,
  17,
  1,
  17,
  1,
  18,
  1,
  18,
  1,
  18,
  1,
  19,
  1,
  19,
  1,
  19,
  1,
  20,
  1,
  20,
  1,
  21,
  1,
  21,
  1,
  22,
  1,
  22,
  1,
  23,
  1,
  23,
  1,
  24,
  1,
  24,
  1,
  25,
  1,
  25,
  1,
  26,
  1,
  26,
  1,
  27,
  1,
  27,
  1,
  28,
  1,
  28,
  1,
  29,
  1,
  29,
  1,
  30,
  1,
  30,
  1,
  31,
  1,
  31,
  1,
  32,
  1,
  32,
  1,
  33,
  1,
  33,
  1,
  34,
  1,
  34,
  1,
  34,
  1,
  34,
  1,
  34,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  35,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  1,
  36,
  3,
  36,
  273,
  8,
  36,
  1,
  37,
  1,
  37,
  1,
  37,
  1,
  38,
  1,
  38,
  1,
  38,
  1,
  38,
  1,
  38,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  39,
  3,
  39,
  309,
  8,
  39,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  40,
  1,
  41,
  1,
  41,
  1,
  41,
  1,
  41,
  1,
  42,
  1,
  42,
  1,
  42,
  1,
  42,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  45,
  1,
  45,
  1,
  45,
  1,
  46,
  1,
  46,
  1,
  46,
  1,
  46,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  49,
  1,
  49,
  1,
  49,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  3,
  50,
  376,
  8,
  50,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  1,
  51,
  3,
  51,
  404,
  8,
  51,
  1,
  52,
  1,
  52,
  5,
  52,
  408,
  8,
  52,
  10,
  52,
  12,
  52,
  411,
  9,
  52,
  1,
  53,
  1,
  53,
  1,
  54,
  1,
  54,
  5,
  54,
  417,
  8,
  54,
  10,
  54,
  12,
  54,
  420,
  9,
  54,
  1,
  55,
  4,
  55,
  423,
  8,
  55,
  11,
  55,
  12,
  55,
  424,
  1,
  56,
  4,
  56,
  428,
  8,
  56,
  11,
  56,
  12,
  56,
  429,
  1,
  56,
  1,
  56,
  5,
  56,
  434,
  8,
  56,
  10,
  56,
  12,
  56,
  437,
  9,
  56,
  1,
  56,
  1,
  56,
  4,
  56,
  441,
  8,
  56,
  11,
  56,
  12,
  56,
  442,
  3,
  56,
  445,
  8,
  56,
  1,
  57,
  1,
  57,
  1,
  57,
  1,
  57,
  5,
  57,
  451,
  8,
  57,
  10,
  57,
  12,
  57,
  454,
  9,
  57,
  1,
  57,
  3,
  57,
  457,
  8,
  57,
  1,
  58,
  1,
  58,
  1,
  58,
  1,
  58,
  1,
  59,
  1,
  59,
  1,
  59,
  1,
  59,
  5,
  59,
  467,
  8,
  59,
  10,
  59,
  12,
  59,
  470,
  9,
  59,
  1,
  59,
  1,
  59,
  1,
  59,
  1,
  59,
  1,
  60,
  1,
  60,
  1,
  61,
  1,
  61,
  5,
  61,
  480,
  8,
  61,
  10,
  61,
  12,
  61,
  483,
  9,
  61,
  1,
  61,
  1,
  61,
  1,
  61,
  1,
  61,
  5,
  61,
  489,
  8,
  61,
  10,
  61,
  12,
  61,
  492,
  9,
  61,
  1,
  62,
  4,
  62,
  495,
  8,
  62,
  11,
  62,
  12,
  62,
  496,
  1,
  63,
  1,
  63,
  1,
  63,
  1,
  63,
  1,
  64,
  4,
  64,
  504,
  8,
  64,
  11,
  64,
  12,
  64,
  505,
  1,
  65,
  1,
  65,
  1,
  65,
  1,
  65,
  1,
  468,
  0,
  66,
  3,
  1,
  5,
  2,
  7,
  3,
  9,
  4,
  11,
  5,
  13,
  6,
  15,
  7,
  17,
  8,
  19,
  9,
  21,
  10,
  23,
  0,
  25,
  11,
  27,
  12,
  29,
  13,
  31,
  14,
  33,
  15,
  35,
  16,
  37,
  17,
  39,
  18,
  41,
  19,
  43,
  20,
  45,
  21,
  47,
  22,
  49,
  23,
  51,
  24,
  53,
  25,
  55,
  26,
  57,
  27,
  59,
  28,
  61,
  29,
  63,
  30,
  65,
  31,
  67,
  32,
  69,
  33,
  71,
  34,
  73,
  35,
  75,
  36,
  77,
  37,
  79,
  38,
  81,
  39,
  83,
  40,
  85,
  41,
  87,
  42,
  89,
  43,
  91,
  44,
  93,
  45,
  95,
  46,
  97,
  47,
  99,
  48,
  101,
  49,
  103,
  50,
  105,
  51,
  107,
  52,
  109,
  53,
  111,
  54,
  113,
  55,
  115,
  56,
  117,
  57,
  119,
  58,
  121,
  59,
  123,
  60,
  125,
  61,
  127,
  62,
  129,
  63,
  131,
  64,
  133,
  65,
  3,
  0,
  1,
  2,
  7,
  2,
  0,
  9,
  9,
  32,
  32,
  3,
  0,
  48,
  57,
  65,
  70,
  97,
  102,
  4,
  0,
  48,
  57,
  65,
  90,
  95,
  95,
  97,
  122,
  3,
  0,
  65,
  90,
  95,
  95,
  97,
  122,
  1,
  0,
  48,
  57,
  3,
  0,
  10,
  10,
  13,
  13,
  34,
  34,
  2,
  0,
  10,
  10,
  13,
  13,
  532,
  0,
  3,
  1,
  0,
  0,
  0,
  0,
  5,
  1,
  0,
  0,
  0,
  0,
  7,
  1,
  0,
  0,
  0,
  0,
  9,
  1,
  0,
  0,
  0,
  0,
  11,
  1,
  0,
  0,
  0,
  0,
  13,
  1,
  0,
  0,
  0,
  0,
  15,
  1,
  0,
  0,
  0,
  0,
  17,
  1,
  0,
  0,
  0,
  0,
  19,
  1,
  0,
  0,
  0,
  0,
  21,
  1,
  0,
  0,
  0,
  0,
  25,
  1,
  0,
  0,
  0,
  0,
  27,
  1,
  0,
  0,
  0,
  0,
  29,
  1,
  0,
  0,
  0,
  0,
  31,
  1,
  0,
  0,
  0,
  0,
  33,
  1,
  0,
  0,
  0,
  0,
  35,
  1,
  0,
  0,
  0,
  0,
  37,
  1,
  0,
  0,
  0,
  0,
  39,
  1,
  0,
  0,
  0,
  0,
  41,
  1,
  0,
  0,
  0,
  0,
  43,
  1,
  0,
  0,
  0,
  0,
  45,
  1,
  0,
  0,
  0,
  0,
  47,
  1,
  0,
  0,
  0,
  0,
  49,
  1,
  0,
  0,
  0,
  0,
  51,
  1,
  0,
  0,
  0,
  0,
  53,
  1,
  0,
  0,
  0,
  0,
  55,
  1,
  0,
  0,
  0,
  0,
  57,
  1,
  0,
  0,
  0,
  0,
  59,
  1,
  0,
  0,
  0,
  0,
  61,
  1,
  0,
  0,
  0,
  0,
  63,
  1,
  0,
  0,
  0,
  0,
  65,
  1,
  0,
  0,
  0,
  0,
  67,
  1,
  0,
  0,
  0,
  0,
  69,
  1,
  0,
  0,
  0,
  0,
  71,
  1,
  0,
  0,
  0,
  0,
  73,
  1,
  0,
  0,
  0,
  0,
  75,
  1,
  0,
  0,
  0,
  0,
  77,
  1,
  0,
  0,
  0,
  0,
  79,
  1,
  0,
  0,
  0,
  0,
  81,
  1,
  0,
  0,
  0,
  0,
  83,
  1,
  0,
  0,
  0,
  0,
  85,
  1,
  0,
  0,
  0,
  0,
  87,
  1,
  0,
  0,
  0,
  0,
  89,
  1,
  0,
  0,
  0,
  0,
  91,
  1,
  0,
  0,
  0,
  0,
  93,
  1,
  0,
  0,
  0,
  0,
  95,
  1,
  0,
  0,
  0,
  0,
  97,
  1,
  0,
  0,
  0,
  0,
  99,
  1,
  0,
  0,
  0,
  0,
  101,
  1,
  0,
  0,
  0,
  0,
  103,
  1,
  0,
  0,
  0,
  0,
  105,
  1,
  0,
  0,
  0,
  0,
  107,
  1,
  0,
  0,
  0,
  0,
  109,
  1,
  0,
  0,
  0,
  0,
  111,
  1,
  0,
  0,
  0,
  0,
  113,
  1,
  0,
  0,
  0,
  0,
  115,
  1,
  0,
  0,
  0,
  0,
  117,
  1,
  0,
  0,
  0,
  0,
  119,
  1,
  0,
  0,
  0,
  0,
  121,
  1,
  0,
  0,
  0,
  0,
  123,
  1,
  0,
  0,
  0,
  0,
  125,
  1,
  0,
  0,
  0,
  1,
  127,
  1,
  0,
  0,
  0,
  1,
  129,
  1,
  0,
  0,
  0,
  2,
  131,
  1,
  0,
  0,
  0,
  2,
  133,
  1,
  0,
  0,
  0,
  3,
  135,
  1,
  0,
  0,
  0,
  5,
  139,
  1,
  0,
  0,
  0,
  7,
  147,
  1,
  0,
  0,
  0,
  9,
  158,
  1,
  0,
  0,
  0,
  11,
  167,
  1,
  0,
  0,
  0,
  13,
  175,
  1,
  0,
  0,
  0,
  15,
  183,
  1,
  0,
  0,
  0,
  17,
  187,
  1,
  0,
  0,
  0,
  19,
  190,
  1,
  0,
  0,
  0,
  21,
  193,
  1,
  0,
  0,
  0,
  23,
  196,
  1,
  0,
  0,
  0,
  25,
  198,
  1,
  0,
  0,
  0,
  27,
  204,
  1,
  0,
  0,
  0,
  29,
  207,
  1,
  0,
  0,
  0,
  31,
  210,
  1,
  0,
  0,
  0,
  33,
  213,
  1,
  0,
  0,
  0,
  35,
  216,
  1,
  0,
  0,
  0,
  37,
  218,
  1,
  0,
  0,
  0,
  39,
  220,
  1,
  0,
  0,
  0,
  41,
  223,
  1,
  0,
  0,
  0,
  43,
  226,
  1,
  0,
  0,
  0,
  45,
  228,
  1,
  0,
  0,
  0,
  47,
  230,
  1,
  0,
  0,
  0,
  49,
  232,
  1,
  0,
  0,
  0,
  51,
  234,
  1,
  0,
  0,
  0,
  53,
  236,
  1,
  0,
  0,
  0,
  55,
  238,
  1,
  0,
  0,
  0,
  57,
  240,
  1,
  0,
  0,
  0,
  59,
  242,
  1,
  0,
  0,
  0,
  61,
  244,
  1,
  0,
  0,
  0,
  63,
  246,
  1,
  0,
  0,
  0,
  65,
  248,
  1,
  0,
  0,
  0,
  67,
  250,
  1,
  0,
  0,
  0,
  69,
  252,
  1,
  0,
  0,
  0,
  71,
  254,
  1,
  0,
  0,
  0,
  73,
  259,
  1,
  0,
  0,
  0,
  75,
  272,
  1,
  0,
  0,
  0,
  77,
  274,
  1,
  0,
  0,
  0,
  79,
  277,
  1,
  0,
  0,
  0,
  81,
  308,
  1,
  0,
  0,
  0,
  83,
  310,
  1,
  0,
  0,
  0,
  85,
  317,
  1,
  0,
  0,
  0,
  87,
  321,
  1,
  0,
  0,
  0,
  89,
  325,
  1,
  0,
  0,
  0,
  91,
  331,
  1,
  0,
  0,
  0,
  93,
  335,
  1,
  0,
  0,
  0,
  95,
  338,
  1,
  0,
  0,
  0,
  97,
  342,
  1,
  0,
  0,
  0,
  99,
  348,
  1,
  0,
  0,
  0,
  101,
  356,
  1,
  0,
  0,
  0,
  103,
  375,
  1,
  0,
  0,
  0,
  105,
  403,
  1,
  0,
  0,
  0,
  107,
  405,
  1,
  0,
  0,
  0,
  109,
  412,
  1,
  0,
  0,
  0,
  111,
  414,
  1,
  0,
  0,
  0,
  113,
  422,
  1,
  0,
  0,
  0,
  115,
  444,
  1,
  0,
  0,
  0,
  117,
  446,
  1,
  0,
  0,
  0,
  119,
  458,
  1,
  0,
  0,
  0,
  121,
  462,
  1,
  0,
  0,
  0,
  123,
  475,
  1,
  0,
  0,
  0,
  125,
  477,
  1,
  0,
  0,
  0,
  127,
  494,
  1,
  0,
  0,
  0,
  129,
  498,
  1,
  0,
  0,
  0,
  131,
  503,
  1,
  0,
  0,
  0,
  133,
  507,
  1,
  0,
  0,
  0,
  135,
  136,
  7,
  0,
  0,
  0,
  136,
  137,
  1,
  0,
  0,
  0,
  137,
  138,
  6,
  0,
  0,
  0,
  138,
  4,
  1,
  0,
  0,
  0,
  139,
  140,
  5,
  99,
  0,
  0,
  140,
  141,
  5,
  111,
  0,
  0,
  141,
  142,
  5,
  110,
  0,
  0,
  142,
  143,
  5,
  115,
  0,
  0,
  143,
  144,
  5,
  116,
  0,
  0,
  144,
  145,
  1,
  0,
  0,
  0,
  145,
  146,
  6,
  1,
  1,
  0,
  146,
  6,
  1,
  0,
  0,
  0,
  147,
  148,
  5,
  114,
  0,
  0,
  148,
  149,
  5,
  101,
  0,
  0,
  149,
  150,
  5,
  97,
  0,
  0,
  150,
  151,
  5,
  100,
  0,
  0,
  151,
  152,
  5,
  111,
  0,
  0,
  152,
  153,
  5,
  110,
  0,
  0,
  153,
  154,
  5,
  108,
  0,
  0,
  154,
  155,
  5,
  121,
  0,
  0,
  155,
  156,
  1,
  0,
  0,
  0,
  156,
  157,
  6,
  2,
  1,
  0,
  157,
  8,
  1,
  0,
  0,
  0,
  158,
  159,
  5,
  115,
  0,
  0,
  159,
  160,
  5,
  116,
  0,
  0,
  160,
  161,
  5,
  97,
  0,
  0,
  161,
  162,
  5,
  116,
  0,
  0,
  162,
  163,
  5,
  105,
  0,
  0,
  163,
  164,
  5,
  99,
  0,
  0,
  164,
  165,
  1,
  0,
  0,
  0,
  165,
  166,
  6,
  3,
  1,
  0,
  166,
  10,
  1,
  0,
  0,
  0,
  167,
  168,
  5,
  97,
  0,
  0,
  168,
  169,
  5,
  119,
  0,
  0,
  169,
  170,
  5,
  97,
  0,
  0,
  170,
  171,
  5,
  105,
  0,
  0,
  171,
  172,
  5,
  116,
  0,
  0,
  172,
  173,
  1,
  0,
  0,
  0,
  173,
  174,
  6,
  4,
  1,
  0,
  174,
  12,
  1,
  0,
  0,
  0,
  175,
  176,
  5,
  116,
  0,
  0,
  176,
  177,
  5,
  105,
  0,
  0,
  177,
  178,
  5,
  116,
  0,
  0,
  178,
  179,
  5,
  108,
  0,
  0,
  179,
  180,
  5,
  101,
  0,
  0,
  180,
  181,
  1,
  0,
  0,
  0,
  181,
  182,
  6,
  5,
  2,
  0,
  182,
  14,
  1,
  0,
  0,
  0,
  183,
  184,
  5,
  58,
  0,
  0,
  184,
  185,
  1,
  0,
  0,
  0,
  185,
  186,
  6,
  6,
  3,
  0,
  186,
  16,
  1,
  0,
  0,
  0,
  187,
  188,
  5,
  60,
  0,
  0,
  188,
  189,
  5,
  60,
  0,
  0,
  189,
  18,
  1,
  0,
  0,
  0,
  190,
  191,
  5,
  62,
  0,
  0,
  191,
  192,
  5,
  62,
  0,
  0,
  192,
  20,
  1,
  0,
  0,
  0,
  193,
  194,
  5,
  45,
  0,
  0,
  194,
  195,
  5,
  62,
  0,
  0,
  195,
  22,
  1,
  0,
  0,
  0,
  196,
  197,
  7,
  1,
  0,
  0,
  197,
  24,
  1,
  0,
  0,
  0,
  198,
  200,
  5,
  35,
  0,
  0,
  199,
  201,
  3,
  23,
  10,
  0,
  200,
  199,
  1,
  0,
  0,
  0,
  201,
  202,
  1,
  0,
  0,
  0,
  202,
  200,
  1,
  0,
  0,
  0,
  202,
  203,
  1,
  0,
  0,
  0,
  203,
  26,
  1,
  0,
  0,
  0,
  204,
  205,
  5,
  124,
  0,
  0,
  205,
  206,
  5,
  124,
  0,
  0,
  206,
  28,
  1,
  0,
  0,
  0,
  207,
  208,
  5,
  38,
  0,
  0,
  208,
  209,
  5,
  38,
  0,
  0,
  209,
  30,
  1,
  0,
  0,
  0,
  210,
  211,
  5,
  61,
  0,
  0,
  211,
  212,
  5,
  61,
  0,
  0,
  212,
  32,
  1,
  0,
  0,
  0,
  213,
  214,
  5,
  33,
  0,
  0,
  214,
  215,
  5,
  61,
  0,
  0,
  215,
  34,
  1,
  0,
  0,
  0,
  216,
  217,
  5,
  62,
  0,
  0,
  217,
  36,
  1,
  0,
  0,
  0,
  218,
  219,
  5,
  60,
  0,
  0,
  219,
  38,
  1,
  0,
  0,
  0,
  220,
  221,
  5,
  62,
  0,
  0,
  221,
  222,
  5,
  61,
  0,
  0,
  222,
  40,
  1,
  0,
  0,
  0,
  223,
  224,
  5,
  60,
  0,
  0,
  224,
  225,
  5,
  61,
  0,
  0,
  225,
  42,
  1,
  0,
  0,
  0,
  226,
  227,
  5,
  43,
  0,
  0,
  227,
  44,
  1,
  0,
  0,
  0,
  228,
  229,
  5,
  45,
  0,
  0,
  229,
  46,
  1,
  0,
  0,
  0,
  230,
  231,
  5,
  42,
  0,
  0,
  231,
  48,
  1,
  0,
  0,
  0,
  232,
  233,
  5,
  47,
  0,
  0,
  233,
  50,
  1,
  0,
  0,
  0,
  234,
  235,
  5,
  37,
  0,
  0,
  235,
  52,
  1,
  0,
  0,
  0,
  236,
  237,
  5,
  94,
  0,
  0,
  237,
  54,
  1,
  0,
  0,
  0,
  238,
  239,
  5,
  33,
  0,
  0,
  239,
  56,
  1,
  0,
  0,
  0,
  240,
  241,
  5,
  59,
  0,
  0,
  241,
  58,
  1,
  0,
  0,
  0,
  242,
  243,
  5,
  44,
  0,
  0,
  243,
  60,
  1,
  0,
  0,
  0,
  244,
  245,
  5,
  61,
  0,
  0,
  245,
  62,
  1,
  0,
  0,
  0,
  246,
  247,
  5,
  40,
  0,
  0,
  247,
  64,
  1,
  0,
  0,
  0,
  248,
  249,
  5,
  41,
  0,
  0,
  249,
  66,
  1,
  0,
  0,
  0,
  250,
  251,
  5,
  123,
  0,
  0,
  251,
  68,
  1,
  0,
  0,
  0,
  252,
  253,
  5,
  125,
  0,
  0,
  253,
  70,
  1,
  0,
  0,
  0,
  254,
  255,
  5,
  116,
  0,
  0,
  255,
  256,
  5,
  114,
  0,
  0,
  256,
  257,
  5,
  117,
  0,
  0,
  257,
  258,
  5,
  101,
  0,
  0,
  258,
  72,
  1,
  0,
  0,
  0,
  259,
  260,
  5,
  102,
  0,
  0,
  260,
  261,
  5,
  97,
  0,
  0,
  261,
  262,
  5,
  108,
  0,
  0,
  262,
  263,
  5,
  115,
  0,
  0,
  263,
  264,
  5,
  101,
  0,
  0,
  264,
  74,
  1,
  0,
  0,
  0,
  265,
  266,
  5,
  110,
  0,
  0,
  266,
  267,
  5,
  105,
  0,
  0,
  267,
  273,
  5,
  108,
  0,
  0,
  268,
  269,
  5,
  110,
  0,
  0,
  269,
  270,
  5,
  117,
  0,
  0,
  270,
  271,
  5,
  108,
  0,
  0,
  271,
  273,
  5,
  108,
  0,
  0,
  272,
  265,
  1,
  0,
  0,
  0,
  272,
  268,
  1,
  0,
  0,
  0,
  273,
  76,
  1,
  0,
  0,
  0,
  274,
  275,
  5,
  105,
  0,
  0,
  275,
  276,
  5,
  102,
  0,
  0,
  276,
  78,
  1,
  0,
  0,
  0,
  277,
  278,
  5,
  101,
  0,
  0,
  278,
  279,
  5,
  108,
  0,
  0,
  279,
  280,
  5,
  115,
  0,
  0,
  280,
  281,
  5,
  101,
  0,
  0,
  281,
  80,
  1,
  0,
  0,
  0,
  282,
  283,
  5,
  119,
  0,
  0,
  283,
  284,
  5,
  104,
  0,
  0,
  284,
  285,
  5,
  105,
  0,
  0,
  285,
  286,
  5,
  108,
  0,
  0,
  286,
  309,
  5,
  101,
  0,
  0,
  287,
  288,
  5,
  102,
  0,
  0,
  288,
  289,
  5,
  111,
  0,
  0,
  289,
  309,
  5,
  114,
  0,
  0,
  290,
  291,
  5,
  102,
  0,
  0,
  291,
  292,
  5,
  111,
  0,
  0,
  292,
  293,
  5,
  114,
  0,
  0,
  293,
  294,
  5,
  101,
  0,
  0,
  294,
  295,
  5,
  97,
  0,
  0,
  295,
  296,
  5,
  99,
  0,
  0,
  296,
  309,
  5,
  104,
  0,
  0,
  297,
  298,
  5,
  102,
  0,
  0,
  298,
  299,
  5,
  111,
  0,
  0,
  299,
  300,
  5,
  114,
  0,
  0,
  300,
  301,
  5,
  69,
  0,
  0,
  301,
  302,
  5,
  97,
  0,
  0,
  302,
  303,
  5,
  99,
  0,
  0,
  303,
  309,
  5,
  104,
  0,
  0,
  304,
  305,
  5,
  108,
  0,
  0,
  305,
  306,
  5,
  111,
  0,
  0,
  306,
  307,
  5,
  111,
  0,
  0,
  307,
  309,
  5,
  112,
  0,
  0,
  308,
  282,
  1,
  0,
  0,
  0,
  308,
  287,
  1,
  0,
  0,
  0,
  308,
  290,
  1,
  0,
  0,
  0,
  308,
  297,
  1,
  0,
  0,
  0,
  308,
  304,
  1,
  0,
  0,
  0,
  309,
  82,
  1,
  0,
  0,
  0,
  310,
  311,
  5,
  114,
  0,
  0,
  311,
  312,
  5,
  101,
  0,
  0,
  312,
  313,
  5,
  116,
  0,
  0,
  313,
  314,
  5,
  117,
  0,
  0,
  314,
  315,
  5,
  114,
  0,
  0,
  315,
  316,
  5,
  110,
  0,
  0,
  316,
  84,
  1,
  0,
  0,
  0,
  317,
  318,
  5,
  110,
  0,
  0,
  318,
  319,
  5,
  101,
  0,
  0,
  319,
  320,
  5,
  119,
  0,
  0,
  320,
  86,
  1,
  0,
  0,
  0,
  321,
  322,
  5,
  112,
  0,
  0,
  322,
  323,
  5,
  97,
  0,
  0,
  323,
  324,
  5,
  114,
  0,
  0,
  324,
  88,
  1,
  0,
  0,
  0,
  325,
  326,
  5,
  103,
  0,
  0,
  326,
  327,
  5,
  114,
  0,
  0,
  327,
  328,
  5,
  111,
  0,
  0,
  328,
  329,
  5,
  117,
  0,
  0,
  329,
  330,
  5,
  112,
  0,
  0,
  330,
  90,
  1,
  0,
  0,
  0,
  331,
  332,
  5,
  111,
  0,
  0,
  332,
  333,
  5,
  112,
  0,
  0,
  333,
  334,
  5,
  116,
  0,
  0,
  334,
  92,
  1,
  0,
  0,
  0,
  335,
  336,
  5,
  97,
  0,
  0,
  336,
  337,
  5,
  115,
  0,
  0,
  337,
  94,
  1,
  0,
  0,
  0,
  338,
  339,
  5,
  116,
  0,
  0,
  339,
  340,
  5,
  114,
  0,
  0,
  340,
  341,
  5,
  121,
  0,
  0,
  341,
  96,
  1,
  0,
  0,
  0,
  342,
  343,
  5,
  99,
  0,
  0,
  343,
  344,
  5,
  97,
  0,
  0,
  344,
  345,
  5,
  116,
  0,
  0,
  345,
  346,
  5,
  99,
  0,
  0,
  346,
  347,
  5,
  104,
  0,
  0,
  347,
  98,
  1,
  0,
  0,
  0,
  348,
  349,
  5,
  102,
  0,
  0,
  349,
  350,
  5,
  105,
  0,
  0,
  350,
  351,
  5,
  110,
  0,
  0,
  351,
  352,
  5,
  97,
  0,
  0,
  352,
  353,
  5,
  108,
  0,
  0,
  353,
  354,
  5,
  108,
  0,
  0,
  354,
  355,
  5,
  121,
  0,
  0,
  355,
  100,
  1,
  0,
  0,
  0,
  356,
  357,
  5,
  105,
  0,
  0,
  357,
  358,
  5,
  110,
  0,
  0,
  358,
  102,
  1,
  0,
  0,
  0,
  359,
  360,
  5,
  64,
  0,
  0,
  360,
  361,
  5,
  83,
  0,
  0,
  361,
  362,
  5,
  116,
  0,
  0,
  362,
  363,
  5,
  97,
  0,
  0,
  363,
  364,
  5,
  114,
  0,
  0,
  364,
  365,
  5,
  116,
  0,
  0,
  365,
  366,
  5,
  101,
  0,
  0,
  366,
  376,
  5,
  114,
  0,
  0,
  367,
  368,
  5,
  64,
  0,
  0,
  368,
  369,
  5,
  115,
  0,
  0,
  369,
  370,
  5,
  116,
  0,
  0,
  370,
  371,
  5,
  97,
  0,
  0,
  371,
  372,
  5,
  114,
  0,
  0,
  372,
  373,
  5,
  116,
  0,
  0,
  373,
  374,
  5,
  101,
  0,
  0,
  374,
  376,
  5,
  114,
  0,
  0,
  375,
  359,
  1,
  0,
  0,
  0,
  375,
  367,
  1,
  0,
  0,
  0,
  376,
  104,
  1,
  0,
  0,
  0,
  377,
  378,
  5,
  64,
  0,
  0,
  378,
  379,
  5,
  82,
  0,
  0,
  379,
  380,
  5,
  101,
  0,
  0,
  380,
  381,
  5,
  116,
  0,
  0,
  381,
  382,
  5,
  117,
  0,
  0,
  382,
  383,
  5,
  114,
  0,
  0,
  383,
  404,
  5,
  110,
  0,
  0,
  384,
  385,
  5,
  64,
  0,
  0,
  385,
  386,
  5,
  114,
  0,
  0,
  386,
  387,
  5,
  101,
  0,
  0,
  387,
  388,
  5,
  116,
  0,
  0,
  388,
  389,
  5,
  117,
  0,
  0,
  389,
  390,
  5,
  114,
  0,
  0,
  390,
  404,
  5,
  110,
  0,
  0,
  391,
  392,
  5,
  64,
  0,
  0,
  392,
  393,
  5,
  82,
  0,
  0,
  393,
  394,
  5,
  101,
  0,
  0,
  394,
  395,
  5,
  112,
  0,
  0,
  395,
  396,
  5,
  108,
  0,
  0,
  396,
  404,
  5,
  121,
  0,
  0,
  397,
  398,
  5,
  64,
  0,
  0,
  398,
  399,
  5,
  114,
  0,
  0,
  399,
  400,
  5,
  101,
  0,
  0,
  400,
  401,
  5,
  112,
  0,
  0,
  401,
  402,
  5,
  108,
  0,
  0,
  402,
  404,
  5,
  121,
  0,
  0,
  403,
  377,
  1,
  0,
  0,
  0,
  403,
  384,
  1,
  0,
  0,
  0,
  403,
  391,
  1,
  0,
  0,
  0,
  403,
  397,
  1,
  0,
  0,
  0,
  404,
  106,
  1,
  0,
  0,
  0,
  405,
  409,
  5,
  64,
  0,
  0,
  406,
  408,
  7,
  2,
  0,
  0,
  407,
  406,
  1,
  0,
  0,
  0,
  408,
  411,
  1,
  0,
  0,
  0,
  409,
  407,
  1,
  0,
  0,
  0,
  409,
  410,
  1,
  0,
  0,
  0,
  410,
  108,
  1,
  0,
  0,
  0,
  411,
  409,
  1,
  0,
  0,
  0,
  412,
  413,
  5,
  46,
  0,
  0,
  413,
  110,
  1,
  0,
  0,
  0,
  414,
  418,
  7,
  3,
  0,
  0,
  415,
  417,
  7,
  2,
  0,
  0,
  416,
  415,
  1,
  0,
  0,
  0,
  417,
  420,
  1,
  0,
  0,
  0,
  418,
  416,
  1,
  0,
  0,
  0,
  418,
  419,
  1,
  0,
  0,
  0,
  419,
  112,
  1,
  0,
  0,
  0,
  420,
  418,
  1,
  0,
  0,
  0,
  421,
  423,
  7,
  4,
  0,
  0,
  422,
  421,
  1,
  0,
  0,
  0,
  423,
  424,
  1,
  0,
  0,
  0,
  424,
  422,
  1,
  0,
  0,
  0,
  424,
  425,
  1,
  0,
  0,
  0,
  425,
  114,
  1,
  0,
  0,
  0,
  426,
  428,
  7,
  4,
  0,
  0,
  427,
  426,
  1,
  0,
  0,
  0,
  428,
  429,
  1,
  0,
  0,
  0,
  429,
  427,
  1,
  0,
  0,
  0,
  429,
  430,
  1,
  0,
  0,
  0,
  430,
  431,
  1,
  0,
  0,
  0,
  431,
  435,
  5,
  46,
  0,
  0,
  432,
  434,
  7,
  4,
  0,
  0,
  433,
  432,
  1,
  0,
  0,
  0,
  434,
  437,
  1,
  0,
  0,
  0,
  435,
  433,
  1,
  0,
  0,
  0,
  435,
  436,
  1,
  0,
  0,
  0,
  436,
  445,
  1,
  0,
  0,
  0,
  437,
  435,
  1,
  0,
  0,
  0,
  438,
  440,
  5,
  46,
  0,
  0,
  439,
  441,
  7,
  4,
  0,
  0,
  440,
  439,
  1,
  0,
  0,
  0,
  441,
  442,
  1,
  0,
  0,
  0,
  442,
  440,
  1,
  0,
  0,
  0,
  442,
  443,
  1,
  0,
  0,
  0,
  443,
  445,
  1,
  0,
  0,
  0,
  444,
  427,
  1,
  0,
  0,
  0,
  444,
  438,
  1,
  0,
  0,
  0,
  445,
  116,
  1,
  0,
  0,
  0,
  446,
  452,
  5,
  34,
  0,
  0,
  447,
  451,
  8,
  5,
  0,
  0,
  448,
  449,
  5,
  34,
  0,
  0,
  449,
  451,
  5,
  34,
  0,
  0,
  450,
  447,
  1,
  0,
  0,
  0,
  450,
  448,
  1,
  0,
  0,
  0,
  451,
  454,
  1,
  0,
  0,
  0,
  452,
  450,
  1,
  0,
  0,
  0,
  452,
  453,
  1,
  0,
  0,
  0,
  453,
  456,
  1,
  0,
  0,
  0,
  454,
  452,
  1,
  0,
  0,
  0,
  455,
  457,
  7,
  5,
  0,
  0,
  456,
  455,
  1,
  0,
  0,
  0,
  456,
  457,
  1,
  0,
  0,
  0,
  457,
  118,
  1,
  0,
  0,
  0,
  458,
  459,
  7,
  6,
  0,
  0,
  459,
  460,
  1,
  0,
  0,
  0,
  460,
  461,
  6,
  58,
  0,
  0,
  461,
  120,
  1,
  0,
  0,
  0,
  462,
  463,
  5,
  47,
  0,
  0,
  463,
  464,
  5,
  47,
  0,
  0,
  464,
  468,
  1,
  0,
  0,
  0,
  465,
  467,
  9,
  0,
  0,
  0,
  466,
  465,
  1,
  0,
  0,
  0,
  467,
  470,
  1,
  0,
  0,
  0,
  468,
  469,
  1,
  0,
  0,
  0,
  468,
  466,
  1,
  0,
  0,
  0,
  469,
  471,
  1,
  0,
  0,
  0,
  470,
  468,
  1,
  0,
  0,
  0,
  471,
  472,
  5,
  10,
  0,
  0,
  472,
  473,
  1,
  0,
  0,
  0,
  473,
  474,
  6,
  59,
  4,
  0,
  474,
  122,
  1,
  0,
  0,
  0,
  475,
  476,
  9,
  0,
  0,
  0,
  476,
  124,
  1,
  0,
  0,
  0,
  477,
  481,
  4,
  61,
  0,
  0,
  478,
  480,
  3,
  3,
  0,
  0,
  479,
  478,
  1,
  0,
  0,
  0,
  480,
  483,
  1,
  0,
  0,
  0,
  481,
  479,
  1,
  0,
  0,
  0,
  481,
  482,
  1,
  0,
  0,
  0,
  482,
  484,
  1,
  0,
  0,
  0,
  483,
  481,
  1,
  0,
  0,
  0,
  484,
  485,
  5,
  61,
  0,
  0,
  485,
  486,
  5,
  61,
  0,
  0,
  486,
  490,
  1,
  0,
  0,
  0,
  487,
  489,
  8,
  6,
  0,
  0,
  488,
  487,
  1,
  0,
  0,
  0,
  489,
  492,
  1,
  0,
  0,
  0,
  490,
  488,
  1,
  0,
  0,
  0,
  490,
  491,
  1,
  0,
  0,
  0,
  491,
  126,
  1,
  0,
  0,
  0,
  492,
  490,
  1,
  0,
  0,
  0,
  493,
  495,
  8,
  6,
  0,
  0,
  494,
  493,
  1,
  0,
  0,
  0,
  495,
  496,
  1,
  0,
  0,
  0,
  496,
  494,
  1,
  0,
  0,
  0,
  496,
  497,
  1,
  0,
  0,
  0,
  497,
  128,
  1,
  0,
  0,
  0,
  498,
  499,
  7,
  6,
  0,
  0,
  499,
  500,
  1,
  0,
  0,
  0,
  500,
  501,
  6,
  63,
  5,
  0,
  501,
  130,
  1,
  0,
  0,
  0,
  502,
  504,
  8,
  6,
  0,
  0,
  503,
  502,
  1,
  0,
  0,
  0,
  504,
  505,
  1,
  0,
  0,
  0,
  505,
  503,
  1,
  0,
  0,
  0,
  505,
  506,
  1,
  0,
  0,
  0,
  506,
  132,
  1,
  0,
  0,
  0,
  507,
  508,
  7,
  6,
  0,
  0,
  508,
  509,
  1,
  0,
  0,
  0,
  509,
  510,
  6,
  65,
  5,
  0,
  510,
  134,
  1,
  0,
  0,
  0,
  23,
  0,
  1,
  2,
  202,
  272,
  308,
  375,
  403,
  409,
  418,
  424,
  429,
  435,
  442,
  444,
  450,
  452,
  456,
  468,
  481,
  490,
  496,
  505,
  6,
  0,
  1,
  0,
  0,
  3,
  0,
  5,
  2,
  0,
  5,
  1,
  0,
  0,
  2,
  0,
  4,
  0,
  0
], w1 = new L.atn.ATNDeserializer().deserialize(w5), C5 = w1.decisionToState.map((e, t) => new L.dfa.DFA(e, t));
class O extends L.Lexer {
  constructor(t) {
    super(t), this._interp = new L.atn.LexerATNSimulator(
      this,
      w1,
      C5,
      new L.PredictionContextCache()
    );
  }
  get atn() {
    return w1;
  }
}
B(O, "grammarFileName", "sequenceLexer.g4"), B(O, "channelNames", ["DEFAULT_TOKEN_CHANNEL", "HIDDEN", "COMMENT_CHANNEL", "MODIFIER_CHANNEL"]), B(O, "modeNames", ["DEFAULT_MODE", "EVENT", "TITLE_MODE"]), B(O, "literalNames", [
  null,
  null,
  "'const'",
  "'readonly'",
  "'static'",
  "'await'",
  "'title'",
  "':'",
  "'<<'",
  "'>>'",
  "'->'",
  null,
  "'||'",
  "'&&'",
  "'=='",
  "'!='",
  "'>'",
  "'<'",
  "'>='",
  "'<='",
  "'+'",
  "'-'",
  "'*'",
  "'/'",
  "'%'",
  "'^'",
  "'!'",
  "';'",
  "','",
  "'='",
  "'('",
  "')'",
  "'{'",
  "'}'",
  "'true'",
  "'false'",
  null,
  "'if'",
  "'else'",
  null,
  "'return'",
  "'new'",
  "'par'",
  "'group'",
  "'opt'",
  "'as'",
  "'try'",
  "'catch'",
  "'finally'",
  "'in'",
  null,
  null,
  null,
  "'.'"
]), B(O, "symbolicNames", [
  null,
  "WS",
  "CONSTANT",
  "READONLY",
  "STATIC",
  "AWAIT",
  "TITLE",
  "COL",
  "SOPEN",
  "SCLOSE",
  "ARROW",
  "COLOR",
  "OR",
  "AND",
  "EQ",
  "NEQ",
  "GT",
  "LT",
  "GTEQ",
  "LTEQ",
  "PLUS",
  "MINUS",
  "MULT",
  "DIV",
  "MOD",
  "POW",
  "NOT",
  "SCOL",
  "COMMA",
  "ASSIGN",
  "OPAR",
  "CPAR",
  "OBRACE",
  "CBRACE",
  "TRUE",
  "FALSE",
  "NIL",
  "IF",
  "ELSE",
  "WHILE",
  "RETURN",
  "NEW",
  "PAR",
  "GROUP",
  "OPT",
  "AS",
  "TRY",
  "CATCH",
  "FINALLY",
  "IN",
  "STARTER_LXR",
  "ANNOTATION_RET",
  "ANNOTATION",
  "DOT",
  "ID",
  "INT",
  "FLOAT",
  "STRING",
  "CR",
  "COMMENT",
  "OTHER",
  "DIVIDER",
  "EVENT_PAYLOAD_LXR",
  "EVENT_END",
  "TITLE_CONTENT",
  "TITLE_END"
]), B(O, "ruleNames", [
  "WS",
  "CONSTANT",
  "READONLY",
  "STATIC",
  "AWAIT",
  "TITLE",
  "COL",
  "SOPEN",
  "SCLOSE",
  "ARROW",
  "HEX",
  "COLOR",
  "OR",
  "AND",
  "EQ",
  "NEQ",
  "GT",
  "LT",
  "GTEQ",
  "LTEQ",
  "PLUS",
  "MINUS",
  "MULT",
  "DIV",
  "MOD",
  "POW",
  "NOT",
  "SCOL",
  "COMMA",
  "ASSIGN",
  "OPAR",
  "CPAR",
  "OBRACE",
  "CBRACE",
  "TRUE",
  "FALSE",
  "NIL",
  "IF",
  "ELSE",
  "WHILE",
  "RETURN",
  "NEW",
  "PAR",
  "GROUP",
  "OPT",
  "AS",
  "TRY",
  "CATCH",
  "FINALLY",
  "IN",
  "STARTER_LXR",
  "ANNOTATION_RET",
  "ANNOTATION",
  "DOT",
  "ID",
  "INT",
  "FLOAT",
  "STRING",
  "CR",
  "COMMENT",
  "OTHER",
  "DIVIDER",
  "EVENT_PAYLOAD_LXR",
  "EVENT_END",
  "TITLE_CONTENT",
  "TITLE_END"
]);
O.EOF = L.Token.EOF;
O.WS = 1;
O.CONSTANT = 2;
O.READONLY = 3;
O.STATIC = 4;
O.AWAIT = 5;
O.TITLE = 6;
O.COL = 7;
O.SOPEN = 8;
O.SCLOSE = 9;
O.ARROW = 10;
O.COLOR = 11;
O.OR = 12;
O.AND = 13;
O.EQ = 14;
O.NEQ = 15;
O.GT = 16;
O.LT = 17;
O.GTEQ = 18;
O.LTEQ = 19;
O.PLUS = 20;
O.MINUS = 21;
O.MULT = 22;
O.DIV = 23;
O.MOD = 24;
O.POW = 25;
O.NOT = 26;
O.SCOL = 27;
O.COMMA = 28;
O.ASSIGN = 29;
O.OPAR = 30;
O.CPAR = 31;
O.OBRACE = 32;
O.CBRACE = 33;
O.TRUE = 34;
O.FALSE = 35;
O.NIL = 36;
O.IF = 37;
O.ELSE = 38;
O.WHILE = 39;
O.RETURN = 40;
O.NEW = 41;
O.PAR = 42;
O.GROUP = 43;
O.OPT = 44;
O.AS = 45;
O.TRY = 46;
O.CATCH = 47;
O.FINALLY = 48;
O.IN = 49;
O.STARTER_LXR = 50;
O.ANNOTATION_RET = 51;
O.ANNOTATION = 52;
O.DOT = 53;
O.ID = 54;
O.INT = 55;
O.FLOAT = 56;
O.STRING = 57;
O.CR = 58;
O.COMMENT = 59;
O.OTHER = 60;
O.DIVIDER = 61;
O.EVENT_PAYLOAD_LXR = 62;
O.EVENT_END = 63;
O.TITLE_CONTENT = 64;
O.TITLE_END = 65;
O.COMMENT_CHANNEL = 2;
O.MODIFIER_CHANNEL = 3;
O.EVENT = 1;
O.TITLE_MODE = 2;
O.prototype.sempred = function(e, t, n) {
  switch (t) {
    case 61:
      return this.DIVIDER_sempred(e, n);
    default:
      throw "No registered predicate for:" + t;
  }
};
O.prototype.DIVIDER_sempred = function(e, t) {
  switch (t) {
    case 0:
      return this.column === 0;
    default:
      throw "No predicate with index:" + t;
  }
};
class y extends L.tree.ParseTreeListener {
  enterProg(t) {
  }
  exitProg(t) {
  }
  enterTitle(t) {
  }
  exitTitle(t) {
  }
  enterHead(t) {
  }
  exitHead(t) {
  }
  enterGroup(t) {
  }
  exitGroup(t) {
  }
  enterStarterExp(t) {
  }
  exitStarterExp(t) {
  }
  enterStarter(t) {
  }
  exitStarter(t) {
  }
  enterParticipant(t) {
  }
  exitParticipant(t) {
  }
  enterStereotype(t) {
  }
  exitStereotype(t) {
  }
  enterLabel(t) {
  }
  exitLabel(t) {
  }
  enterParticipantType(t) {
  }
  exitParticipantType(t) {
  }
  enterName(t) {
  }
  exitName(t) {
  }
  enterWidth(t) {
  }
  exitWidth(t) {
  }
  enterBlock(t) {
  }
  exitBlock(t) {
  }
  enterRet(t) {
  }
  exitRet(t) {
  }
  enterDivider(t) {
  }
  exitDivider(t) {
  }
  enterDividerNote(t) {
  }
  exitDividerNote(t) {
  }
  enterStat(t) {
  }
  exitStat(t) {
  }
  enterPar(t) {
  }
  exitPar(t) {
  }
  enterOpt(t) {
  }
  exitOpt(t) {
  }
  enterCreation(t) {
  }
  exitCreation(t) {
  }
  enterCreationBody(t) {
  }
  exitCreationBody(t) {
  }
  enterMessage(t) {
  }
  exitMessage(t) {
  }
  enterMessageBody(t) {
  }
  exitMessageBody(t) {
  }
  enterFunc(t) {
  }
  exitFunc(t) {
  }
  enterFrom(t) {
  }
  exitFrom(t) {
  }
  enterTo(t) {
  }
  exitTo(t) {
  }
  enterSignature(t) {
  }
  exitSignature(t) {
  }
  enterInvocation(t) {
  }
  exitInvocation(t) {
  }
  enterAssignment(t) {
  }
  exitAssignment(t) {
  }
  enterAsyncMessage(t) {
  }
  exitAsyncMessage(t) {
  }
  enterContent(t) {
  }
  exitContent(t) {
  }
  enterConstruct(t) {
  }
  exitConstruct(t) {
  }
  enterType(t) {
  }
  exitType(t) {
  }
  enterAssignee(t) {
  }
  exitAssignee(t) {
  }
  enterMethodName(t) {
  }
  exitMethodName(t) {
  }
  enterParameters(t) {
  }
  exitParameters(t) {
  }
  enterParameter(t) {
  }
  exitParameter(t) {
  }
  enterDeclaration(t) {
  }
  exitDeclaration(t) {
  }
  enterTcf(t) {
  }
  exitTcf(t) {
  }
  enterTryBlock(t) {
  }
  exitTryBlock(t) {
  }
  enterCatchBlock(t) {
  }
  exitCatchBlock(t) {
  }
  enterFinallyBlock(t) {
  }
  exitFinallyBlock(t) {
  }
  enterAlt(t) {
  }
  exitAlt(t) {
  }
  enterIfBlock(t) {
  }
  exitIfBlock(t) {
  }
  enterElseIfBlock(t) {
  }
  exitElseIfBlock(t) {
  }
  enterElseBlock(t) {
  }
  exitElseBlock(t) {
  }
  enterBraceBlock(t) {
  }
  exitBraceBlock(t) {
  }
  enterLoop(t) {
  }
  exitLoop(t) {
  }
  enterAssignmentExpr(t) {
  }
  exitAssignmentExpr(t) {
  }
  enterFuncExpr(t) {
  }
  exitFuncExpr(t) {
  }
  enterAtomExpr(t) {
  }
  exitAtomExpr(t) {
  }
  enterOrExpr(t) {
  }
  exitOrExpr(t) {
  }
  enterAdditiveExpr(t) {
  }
  exitAdditiveExpr(t) {
  }
  enterRelationalExpr(t) {
  }
  exitRelationalExpr(t) {
  }
  enterPlusExpr(t) {
  }
  exitPlusExpr(t) {
  }
  enterNotExpr(t) {
  }
  exitNotExpr(t) {
  }
  enterUnaryMinusExpr(t) {
  }
  exitUnaryMinusExpr(t) {
  }
  enterCreationExpr(t) {
  }
  exitCreationExpr(t) {
  }
  enterParenthesizedExpr(t) {
  }
  exitParenthesizedExpr(t) {
  }
  enterMultiplicationExpr(t) {
  }
  exitMultiplicationExpr(t) {
  }
  enterEqualityExpr(t) {
  }
  exitEqualityExpr(t) {
  }
  enterAndExpr(t) {
  }
  exitAndExpr(t) {
  }
  enterNumberAtom(t) {
  }
  exitNumberAtom(t) {
  }
  enterBooleanAtom(t) {
  }
  exitBooleanAtom(t) {
  }
  enterIdAtom(t) {
  }
  exitIdAtom(t) {
  }
  enterStringAtom(t) {
  }
  exitStringAtom(t) {
  }
  enterNilAtom(t) {
  }
  exitNilAtom(t) {
  }
  enterParExpr(t) {
  }
  exitParExpr(t) {
  }
  enterCondition(t) {
  }
  exitCondition(t) {
  }
  enterInExpr(t) {
  }
  exitInExpr(t) {
  }
}
const _5 = [
  4,
  1,
  65,
  550,
  2,
  0,
  7,
  0,
  2,
  1,
  7,
  1,
  2,
  2,
  7,
  2,
  2,
  3,
  7,
  3,
  2,
  4,
  7,
  4,
  2,
  5,
  7,
  5,
  2,
  6,
  7,
  6,
  2,
  7,
  7,
  7,
  2,
  8,
  7,
  8,
  2,
  9,
  7,
  9,
  2,
  10,
  7,
  10,
  2,
  11,
  7,
  11,
  2,
  12,
  7,
  12,
  2,
  13,
  7,
  13,
  2,
  14,
  7,
  14,
  2,
  15,
  7,
  15,
  2,
  16,
  7,
  16,
  2,
  17,
  7,
  17,
  2,
  18,
  7,
  18,
  2,
  19,
  7,
  19,
  2,
  20,
  7,
  20,
  2,
  21,
  7,
  21,
  2,
  22,
  7,
  22,
  2,
  23,
  7,
  23,
  2,
  24,
  7,
  24,
  2,
  25,
  7,
  25,
  2,
  26,
  7,
  26,
  2,
  27,
  7,
  27,
  2,
  28,
  7,
  28,
  2,
  29,
  7,
  29,
  2,
  30,
  7,
  30,
  2,
  31,
  7,
  31,
  2,
  32,
  7,
  32,
  2,
  33,
  7,
  33,
  2,
  34,
  7,
  34,
  2,
  35,
  7,
  35,
  2,
  36,
  7,
  36,
  2,
  37,
  7,
  37,
  2,
  38,
  7,
  38,
  2,
  39,
  7,
  39,
  2,
  40,
  7,
  40,
  2,
  41,
  7,
  41,
  2,
  42,
  7,
  42,
  2,
  43,
  7,
  43,
  2,
  44,
  7,
  44,
  2,
  45,
  7,
  45,
  2,
  46,
  7,
  46,
  2,
  47,
  7,
  47,
  2,
  48,
  7,
  48,
  2,
  49,
  7,
  49,
  2,
  50,
  7,
  50,
  2,
  51,
  7,
  51,
  2,
  52,
  7,
  52,
  1,
  0,
  3,
  0,
  108,
  8,
  0,
  1,
  0,
  1,
  0,
  3,
  0,
  112,
  8,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  3,
  0,
  118,
  8,
  0,
  1,
  0,
  3,
  0,
  121,
  8,
  0,
  1,
  0,
  1,
  0,
  1,
  0,
  3,
  0,
  126,
  8,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  3,
  1,
  131,
  8,
  1,
  1,
  2,
  1,
  2,
  4,
  2,
  135,
  8,
  2,
  11,
  2,
  12,
  2,
  136,
  1,
  2,
  1,
  2,
  5,
  2,
  141,
  8,
  2,
  10,
  2,
  12,
  2,
  144,
  9,
  2,
  1,
  2,
  3,
  2,
  147,
  8,
  2,
  1,
  3,
  1,
  3,
  3,
  3,
  151,
  8,
  3,
  1,
  3,
  1,
  3,
  5,
  3,
  155,
  8,
  3,
  10,
  3,
  12,
  3,
  158,
  9,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  3,
  3,
  163,
  8,
  3,
  1,
  3,
  1,
  3,
  1,
  3,
  3,
  3,
  168,
  8,
  3,
  3,
  3,
  170,
  8,
  3,
  1,
  4,
  1,
  4,
  1,
  4,
  3,
  4,
  175,
  8,
  4,
  1,
  4,
  3,
  4,
  178,
  8,
  4,
  1,
  4,
  3,
  4,
  181,
  8,
  4,
  1,
  5,
  1,
  5,
  1,
  6,
  3,
  6,
  186,
  8,
  6,
  1,
  6,
  3,
  6,
  189,
  8,
  6,
  1,
  6,
  1,
  6,
  3,
  6,
  193,
  8,
  6,
  1,
  6,
  3,
  6,
  196,
  8,
  6,
  1,
  6,
  3,
  6,
  199,
  8,
  6,
  1,
  6,
  1,
  6,
  3,
  6,
  203,
  8,
  6,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  1,
  7,
  3,
  7,
  212,
  8,
  7,
  1,
  7,
  1,
  7,
  3,
  7,
  216,
  8,
  7,
  3,
  7,
  218,
  8,
  7,
  1,
  8,
  1,
  8,
  1,
  8,
  3,
  8,
  223,
  8,
  8,
  1,
  9,
  1,
  9,
  1,
  10,
  1,
  10,
  1,
  11,
  1,
  11,
  1,
  12,
  4,
  12,
  232,
  8,
  12,
  11,
  12,
  12,
  12,
  233,
  1,
  13,
  1,
  13,
  3,
  13,
  238,
  8,
  13,
  1,
  13,
  3,
  13,
  241,
  8,
  13,
  1,
  13,
  1,
  13,
  1,
  13,
  3,
  13,
  246,
  8,
  13,
  3,
  13,
  248,
  8,
  13,
  1,
  14,
  1,
  14,
  1,
  15,
  1,
  15,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  3,
  16,
  262,
  8,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  1,
  16,
  3,
  16,
  269,
  8,
  16,
  1,
  17,
  1,
  17,
  1,
  17,
  3,
  17,
  274,
  8,
  17,
  1,
  18,
  1,
  18,
  1,
  18,
  3,
  18,
  279,
  8,
  18,
  1,
  19,
  1,
  19,
  1,
  19,
  3,
  19,
  284,
  8,
  19,
  1,
  20,
  3,
  20,
  287,
  8,
  20,
  1,
  20,
  1,
  20,
  1,
  20,
  1,
  20,
  3,
  20,
  293,
  8,
  20,
  1,
  20,
  3,
  20,
  296,
  8,
  20,
  1,
  20,
  3,
  20,
  299,
  8,
  20,
  1,
  20,
  3,
  20,
  302,
  8,
  20,
  1,
  21,
  1,
  21,
  1,
  21,
  3,
  21,
  307,
  8,
  21,
  1,
  22,
  3,
  22,
  310,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  315,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  320,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  327,
  8,
  22,
  1,
  22,
  1,
  22,
  1,
  22,
  3,
  22,
  332,
  8,
  22,
  1,
  23,
  1,
  23,
  1,
  23,
  5,
  23,
  337,
  8,
  23,
  10,
  23,
  12,
  23,
  340,
  9,
  23,
  1,
  24,
  1,
  24,
  1,
  25,
  1,
  25,
  1,
  26,
  1,
  26,
  3,
  26,
  348,
  8,
  26,
  1,
  27,
  1,
  27,
  3,
  27,
  352,
  8,
  27,
  1,
  27,
  1,
  27,
  1,
  28,
  3,
  28,
  357,
  8,
  28,
  1,
  28,
  1,
  28,
  1,
  28,
  1,
  29,
  1,
  29,
  1,
  29,
  3,
  29,
  365,
  8,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  1,
  29,
  3,
  29,
  374,
  8,
  29,
  3,
  29,
  376,
  8,
  29,
  1,
  30,
  1,
  30,
  1,
  31,
  1,
  31,
  1,
  32,
  1,
  32,
  1,
  33,
  1,
  33,
  1,
  33,
  1,
  33,
  5,
  33,
  388,
  8,
  33,
  10,
  33,
  12,
  33,
  391,
  9,
  33,
  1,
  33,
  3,
  33,
  394,
  8,
  33,
  1,
  34,
  1,
  34,
  1,
  35,
  1,
  35,
  1,
  35,
  5,
  35,
  401,
  8,
  35,
  10,
  35,
  12,
  35,
  404,
  9,
  35,
  1,
  35,
  3,
  35,
  407,
  8,
  35,
  1,
  36,
  1,
  36,
  3,
  36,
  411,
  8,
  36,
  1,
  37,
  1,
  37,
  1,
  37,
  1,
  38,
  1,
  38,
  5,
  38,
  418,
  8,
  38,
  10,
  38,
  12,
  38,
  421,
  9,
  38,
  1,
  38,
  3,
  38,
  424,
  8,
  38,
  1,
  39,
  1,
  39,
  1,
  39,
  1,
  40,
  1,
  40,
  3,
  40,
  431,
  8,
  40,
  1,
  40,
  1,
  40,
  1,
  41,
  1,
  41,
  1,
  41,
  1,
  42,
  1,
  42,
  5,
  42,
  440,
  8,
  42,
  10,
  42,
  12,
  42,
  443,
  9,
  42,
  1,
  42,
  3,
  42,
  446,
  8,
  42,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  43,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  44,
  1,
  45,
  1,
  45,
  1,
  45,
  1,
  46,
  1,
  46,
  3,
  46,
  462,
  8,
  46,
  1,
  46,
  1,
  46,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  1,
  47,
  3,
  47,
  473,
  8,
  47,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  3,
  48,
  484,
  8,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  3,
  48,
  495,
  8,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  1,
  48,
  5,
  48,
  518,
  8,
  48,
  10,
  48,
  12,
  48,
  521,
  9,
  48,
  1,
  49,
  1,
  49,
  1,
  49,
  1,
  49,
  1,
  49,
  3,
  49,
  528,
  8,
  49,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  1,
  50,
  3,
  50,
  539,
  8,
  50,
  1,
  51,
  1,
  51,
  1,
  51,
  3,
  51,
  544,
  8,
  51,
  1,
  52,
  1,
  52,
  1,
  52,
  1,
  52,
  1,
  52,
  0,
  1,
  96,
  53,
  0,
  2,
  4,
  6,
  8,
  10,
  12,
  14,
  16,
  18,
  20,
  22,
  24,
  26,
  28,
  30,
  32,
  34,
  36,
  38,
  40,
  42,
  44,
  46,
  48,
  50,
  52,
  54,
  56,
  58,
  60,
  62,
  64,
  66,
  68,
  70,
  72,
  74,
  76,
  78,
  80,
  82,
  84,
  86,
  88,
  90,
  92,
  94,
  96,
  98,
  100,
  102,
  104,
  0,
  10,
  2,
  0,
  54,
  54,
  57,
  57,
  2,
  0,
  8,
  8,
  17,
  17,
  2,
  0,
  9,
  9,
  16,
  16,
  2,
  0,
  10,
  10,
  21,
  21,
  1,
  0,
  22,
  24,
  1,
  0,
  20,
  21,
  1,
  0,
  16,
  19,
  1,
  0,
  14,
  15,
  1,
  0,
  55,
  56,
  1,
  0,
  34,
  35,
  606,
  0,
  125,
  1,
  0,
  0,
  0,
  2,
  127,
  1,
  0,
  0,
  0,
  4,
  146,
  1,
  0,
  0,
  0,
  6,
  169,
  1,
  0,
  0,
  0,
  8,
  180,
  1,
  0,
  0,
  0,
  10,
  182,
  1,
  0,
  0,
  0,
  12,
  202,
  1,
  0,
  0,
  0,
  14,
  217,
  1,
  0,
  0,
  0,
  16,
  222,
  1,
  0,
  0,
  0,
  18,
  224,
  1,
  0,
  0,
  0,
  20,
  226,
  1,
  0,
  0,
  0,
  22,
  228,
  1,
  0,
  0,
  0,
  24,
  231,
  1,
  0,
  0,
  0,
  26,
  247,
  1,
  0,
  0,
  0,
  28,
  249,
  1,
  0,
  0,
  0,
  30,
  251,
  1,
  0,
  0,
  0,
  32,
  268,
  1,
  0,
  0,
  0,
  34,
  273,
  1,
  0,
  0,
  0,
  36,
  278,
  1,
  0,
  0,
  0,
  38,
  280,
  1,
  0,
  0,
  0,
  40,
  301,
  1,
  0,
  0,
  0,
  42,
  303,
  1,
  0,
  0,
  0,
  44,
  331,
  1,
  0,
  0,
  0,
  46,
  333,
  1,
  0,
  0,
  0,
  48,
  341,
  1,
  0,
  0,
  0,
  50,
  343,
  1,
  0,
  0,
  0,
  52,
  345,
  1,
  0,
  0,
  0,
  54,
  349,
  1,
  0,
  0,
  0,
  56,
  356,
  1,
  0,
  0,
  0,
  58,
  375,
  1,
  0,
  0,
  0,
  60,
  377,
  1,
  0,
  0,
  0,
  62,
  379,
  1,
  0,
  0,
  0,
  64,
  381,
  1,
  0,
  0,
  0,
  66,
  393,
  1,
  0,
  0,
  0,
  68,
  395,
  1,
  0,
  0,
  0,
  70,
  397,
  1,
  0,
  0,
  0,
  72,
  410,
  1,
  0,
  0,
  0,
  74,
  412,
  1,
  0,
  0,
  0,
  76,
  415,
  1,
  0,
  0,
  0,
  78,
  425,
  1,
  0,
  0,
  0,
  80,
  428,
  1,
  0,
  0,
  0,
  82,
  434,
  1,
  0,
  0,
  0,
  84,
  437,
  1,
  0,
  0,
  0,
  86,
  447,
  1,
  0,
  0,
  0,
  88,
  451,
  1,
  0,
  0,
  0,
  90,
  456,
  1,
  0,
  0,
  0,
  92,
  459,
  1,
  0,
  0,
  0,
  94,
  472,
  1,
  0,
  0,
  0,
  96,
  494,
  1,
  0,
  0,
  0,
  98,
  527,
  1,
  0,
  0,
  0,
  100,
  538,
  1,
  0,
  0,
  0,
  102,
  543,
  1,
  0,
  0,
  0,
  104,
  545,
  1,
  0,
  0,
  0,
  106,
  108,
  3,
  2,
  1,
  0,
  107,
  106,
  1,
  0,
  0,
  0,
  107,
  108,
  1,
  0,
  0,
  0,
  108,
  109,
  1,
  0,
  0,
  0,
  109,
  126,
  5,
  0,
  0,
  1,
  110,
  112,
  3,
  2,
  1,
  0,
  111,
  110,
  1,
  0,
  0,
  0,
  111,
  112,
  1,
  0,
  0,
  0,
  112,
  113,
  1,
  0,
  0,
  0,
  113,
  114,
  3,
  4,
  2,
  0,
  114,
  115,
  5,
  0,
  0,
  1,
  115,
  126,
  1,
  0,
  0,
  0,
  116,
  118,
  3,
  2,
  1,
  0,
  117,
  116,
  1,
  0,
  0,
  0,
  117,
  118,
  1,
  0,
  0,
  0,
  118,
  120,
  1,
  0,
  0,
  0,
  119,
  121,
  3,
  4,
  2,
  0,
  120,
  119,
  1,
  0,
  0,
  0,
  120,
  121,
  1,
  0,
  0,
  0,
  121,
  122,
  1,
  0,
  0,
  0,
  122,
  123,
  3,
  24,
  12,
  0,
  123,
  124,
  5,
  0,
  0,
  1,
  124,
  126,
  1,
  0,
  0,
  0,
  125,
  107,
  1,
  0,
  0,
  0,
  125,
  111,
  1,
  0,
  0,
  0,
  125,
  117,
  1,
  0,
  0,
  0,
  126,
  1,
  1,
  0,
  0,
  0,
  127,
  128,
  5,
  6,
  0,
  0,
  128,
  130,
  5,
  64,
  0,
  0,
  129,
  131,
  5,
  65,
  0,
  0,
  130,
  129,
  1,
  0,
  0,
  0,
  130,
  131,
  1,
  0,
  0,
  0,
  131,
  3,
  1,
  0,
  0,
  0,
  132,
  135,
  3,
  6,
  3,
  0,
  133,
  135,
  3,
  12,
  6,
  0,
  134,
  132,
  1,
  0,
  0,
  0,
  134,
  133,
  1,
  0,
  0,
  0,
  135,
  136,
  1,
  0,
  0,
  0,
  136,
  134,
  1,
  0,
  0,
  0,
  136,
  137,
  1,
  0,
  0,
  0,
  137,
  147,
  1,
  0,
  0,
  0,
  138,
  141,
  3,
  6,
  3,
  0,
  139,
  141,
  3,
  12,
  6,
  0,
  140,
  138,
  1,
  0,
  0,
  0,
  140,
  139,
  1,
  0,
  0,
  0,
  141,
  144,
  1,
  0,
  0,
  0,
  142,
  140,
  1,
  0,
  0,
  0,
  142,
  143,
  1,
  0,
  0,
  0,
  143,
  145,
  1,
  0,
  0,
  0,
  144,
  142,
  1,
  0,
  0,
  0,
  145,
  147,
  3,
  8,
  4,
  0,
  146,
  134,
  1,
  0,
  0,
  0,
  146,
  142,
  1,
  0,
  0,
  0,
  147,
  5,
  1,
  0,
  0,
  0,
  148,
  150,
  5,
  43,
  0,
  0,
  149,
  151,
  3,
  20,
  10,
  0,
  150,
  149,
  1,
  0,
  0,
  0,
  150,
  151,
  1,
  0,
  0,
  0,
  151,
  152,
  1,
  0,
  0,
  0,
  152,
  156,
  5,
  32,
  0,
  0,
  153,
  155,
  3,
  12,
  6,
  0,
  154,
  153,
  1,
  0,
  0,
  0,
  155,
  158,
  1,
  0,
  0,
  0,
  156,
  154,
  1,
  0,
  0,
  0,
  156,
  157,
  1,
  0,
  0,
  0,
  157,
  159,
  1,
  0,
  0,
  0,
  158,
  156,
  1,
  0,
  0,
  0,
  159,
  170,
  5,
  33,
  0,
  0,
  160,
  162,
  5,
  43,
  0,
  0,
  161,
  163,
  3,
  20,
  10,
  0,
  162,
  161,
  1,
  0,
  0,
  0,
  162,
  163,
  1,
  0,
  0,
  0,
  163,
  164,
  1,
  0,
  0,
  0,
  164,
  170,
  5,
  32,
  0,
  0,
  165,
  167,
  5,
  43,
  0,
  0,
  166,
  168,
  3,
  20,
  10,
  0,
  167,
  166,
  1,
  0,
  0,
  0,
  167,
  168,
  1,
  0,
  0,
  0,
  168,
  170,
  1,
  0,
  0,
  0,
  169,
  148,
  1,
  0,
  0,
  0,
  169,
  160,
  1,
  0,
  0,
  0,
  169,
  165,
  1,
  0,
  0,
  0,
  170,
  7,
  1,
  0,
  0,
  0,
  171,
  177,
  5,
  50,
  0,
  0,
  172,
  174,
  5,
  30,
  0,
  0,
  173,
  175,
  3,
  10,
  5,
  0,
  174,
  173,
  1,
  0,
  0,
  0,
  174,
  175,
  1,
  0,
  0,
  0,
  175,
  176,
  1,
  0,
  0,
  0,
  176,
  178,
  5,
  31,
  0,
  0,
  177,
  172,
  1,
  0,
  0,
  0,
  177,
  178,
  1,
  0,
  0,
  0,
  178,
  181,
  1,
  0,
  0,
  0,
  179,
  181,
  5,
  52,
  0,
  0,
  180,
  171,
  1,
  0,
  0,
  0,
  180,
  179,
  1,
  0,
  0,
  0,
  181,
  9,
  1,
  0,
  0,
  0,
  182,
  183,
  7,
  0,
  0,
  0,
  183,
  11,
  1,
  0,
  0,
  0,
  184,
  186,
  3,
  18,
  9,
  0,
  185,
  184,
  1,
  0,
  0,
  0,
  185,
  186,
  1,
  0,
  0,
  0,
  186,
  188,
  1,
  0,
  0,
  0,
  187,
  189,
  3,
  14,
  7,
  0,
  188,
  187,
  1,
  0,
  0,
  0,
  188,
  189,
  1,
  0,
  0,
  0,
  189,
  190,
  1,
  0,
  0,
  0,
  190,
  192,
  3,
  20,
  10,
  0,
  191,
  193,
  3,
  22,
  11,
  0,
  192,
  191,
  1,
  0,
  0,
  0,
  192,
  193,
  1,
  0,
  0,
  0,
  193,
  195,
  1,
  0,
  0,
  0,
  194,
  196,
  3,
  16,
  8,
  0,
  195,
  194,
  1,
  0,
  0,
  0,
  195,
  196,
  1,
  0,
  0,
  0,
  196,
  198,
  1,
  0,
  0,
  0,
  197,
  199,
  5,
  11,
  0,
  0,
  198,
  197,
  1,
  0,
  0,
  0,
  198,
  199,
  1,
  0,
  0,
  0,
  199,
  203,
  1,
  0,
  0,
  0,
  200,
  203,
  3,
  14,
  7,
  0,
  201,
  203,
  3,
  18,
  9,
  0,
  202,
  185,
  1,
  0,
  0,
  0,
  202,
  200,
  1,
  0,
  0,
  0,
  202,
  201,
  1,
  0,
  0,
  0,
  203,
  13,
  1,
  0,
  0,
  0,
  204,
  205,
  5,
  8,
  0,
  0,
  205,
  206,
  3,
  20,
  10,
  0,
  206,
  207,
  5,
  9,
  0,
  0,
  207,
  218,
  1,
  0,
  0,
  0,
  208,
  209,
  5,
  8,
  0,
  0,
  209,
  211,
  3,
  20,
  10,
  0,
  210,
  212,
  5,
  16,
  0,
  0,
  211,
  210,
  1,
  0,
  0,
  0,
  211,
  212,
  1,
  0,
  0,
  0,
  212,
  218,
  1,
  0,
  0,
  0,
  213,
  215,
  7,
  1,
  0,
  0,
  214,
  216,
  7,
  2,
  0,
  0,
  215,
  214,
  1,
  0,
  0,
  0,
  215,
  216,
  1,
  0,
  0,
  0,
  216,
  218,
  1,
  0,
  0,
  0,
  217,
  204,
  1,
  0,
  0,
  0,
  217,
  208,
  1,
  0,
  0,
  0,
  217,
  213,
  1,
  0,
  0,
  0,
  218,
  15,
  1,
  0,
  0,
  0,
  219,
  220,
  5,
  45,
  0,
  0,
  220,
  223,
  3,
  20,
  10,
  0,
  221,
  223,
  5,
  45,
  0,
  0,
  222,
  219,
  1,
  0,
  0,
  0,
  222,
  221,
  1,
  0,
  0,
  0,
  223,
  17,
  1,
  0,
  0,
  0,
  224,
  225,
  5,
  52,
  0,
  0,
  225,
  19,
  1,
  0,
  0,
  0,
  226,
  227,
  7,
  0,
  0,
  0,
  227,
  21,
  1,
  0,
  0,
  0,
  228,
  229,
  5,
  55,
  0,
  0,
  229,
  23,
  1,
  0,
  0,
  0,
  230,
  232,
  3,
  32,
  16,
  0,
  231,
  230,
  1,
  0,
  0,
  0,
  232,
  233,
  1,
  0,
  0,
  0,
  233,
  231,
  1,
  0,
  0,
  0,
  233,
  234,
  1,
  0,
  0,
  0,
  234,
  25,
  1,
  0,
  0,
  0,
  235,
  237,
  5,
  40,
  0,
  0,
  236,
  238,
  3,
  96,
  48,
  0,
  237,
  236,
  1,
  0,
  0,
  0,
  237,
  238,
  1,
  0,
  0,
  0,
  238,
  240,
  1,
  0,
  0,
  0,
  239,
  241,
  5,
  27,
  0,
  0,
  240,
  239,
  1,
  0,
  0,
  0,
  240,
  241,
  1,
  0,
  0,
  0,
  241,
  248,
  1,
  0,
  0,
  0,
  242,
  243,
  5,
  51,
  0,
  0,
  243,
  245,
  3,
  58,
  29,
  0,
  244,
  246,
  5,
  63,
  0,
  0,
  245,
  244,
  1,
  0,
  0,
  0,
  245,
  246,
  1,
  0,
  0,
  0,
  246,
  248,
  1,
  0,
  0,
  0,
  247,
  235,
  1,
  0,
  0,
  0,
  247,
  242,
  1,
  0,
  0,
  0,
  248,
  27,
  1,
  0,
  0,
  0,
  249,
  250,
  3,
  30,
  15,
  0,
  250,
  29,
  1,
  0,
  0,
  0,
  251,
  252,
  5,
  61,
  0,
  0,
  252,
  31,
  1,
  0,
  0,
  0,
  253,
  269,
  3,
  84,
  42,
  0,
  254,
  269,
  3,
  34,
  17,
  0,
  255,
  269,
  3,
  36,
  18,
  0,
  256,
  269,
  3,
  94,
  47,
  0,
  257,
  269,
  3,
  38,
  19,
  0,
  258,
  269,
  3,
  42,
  21,
  0,
  259,
  261,
  3,
  58,
  29,
  0,
  260,
  262,
  5,
  63,
  0,
  0,
  261,
  260,
  1,
  0,
  0,
  0,
  261,
  262,
  1,
  0,
  0,
  0,
  262,
  269,
  1,
  0,
  0,
  0,
  263,
  269,
  3,
  26,
  13,
  0,
  264,
  269,
  3,
  28,
  14,
  0,
  265,
  269,
  3,
  76,
  38,
  0,
  266,
  267,
  5,
  60,
  0,
  0,
  267,
  269,
  6,
  16,
  -1,
  0,
  268,
  253,
  1,
  0,
  0,
  0,
  268,
  254,
  1,
  0,
  0,
  0,
  268,
  255,
  1,
  0,
  0,
  0,
  268,
  256,
  1,
  0,
  0,
  0,
  268,
  257,
  1,
  0,
  0,
  0,
  268,
  258,
  1,
  0,
  0,
  0,
  268,
  259,
  1,
  0,
  0,
  0,
  268,
  263,
  1,
  0,
  0,
  0,
  268,
  264,
  1,
  0,
  0,
  0,
  268,
  265,
  1,
  0,
  0,
  0,
  268,
  266,
  1,
  0,
  0,
  0,
  269,
  33,
  1,
  0,
  0,
  0,
  270,
  271,
  5,
  42,
  0,
  0,
  271,
  274,
  3,
  92,
  46,
  0,
  272,
  274,
  5,
  42,
  0,
  0,
  273,
  270,
  1,
  0,
  0,
  0,
  273,
  272,
  1,
  0,
  0,
  0,
  274,
  35,
  1,
  0,
  0,
  0,
  275,
  276,
  5,
  44,
  0,
  0,
  276,
  279,
  3,
  92,
  46,
  0,
  277,
  279,
  5,
  44,
  0,
  0,
  278,
  275,
  1,
  0,
  0,
  0,
  278,
  277,
  1,
  0,
  0,
  0,
  279,
  37,
  1,
  0,
  0,
  0,
  280,
  283,
  3,
  40,
  20,
  0,
  281,
  284,
  5,
  27,
  0,
  0,
  282,
  284,
  3,
  92,
  46,
  0,
  283,
  281,
  1,
  0,
  0,
  0,
  283,
  282,
  1,
  0,
  0,
  0,
  283,
  284,
  1,
  0,
  0,
  0,
  284,
  39,
  1,
  0,
  0,
  0,
  285,
  287,
  3,
  56,
  28,
  0,
  286,
  285,
  1,
  0,
  0,
  0,
  286,
  287,
  1,
  0,
  0,
  0,
  287,
  288,
  1,
  0,
  0,
  0,
  288,
  289,
  5,
  41,
  0,
  0,
  289,
  295,
  3,
  62,
  31,
  0,
  290,
  292,
  5,
  30,
  0,
  0,
  291,
  293,
  3,
  70,
  35,
  0,
  292,
  291,
  1,
  0,
  0,
  0,
  292,
  293,
  1,
  0,
  0,
  0,
  293,
  294,
  1,
  0,
  0,
  0,
  294,
  296,
  5,
  31,
  0,
  0,
  295,
  290,
  1,
  0,
  0,
  0,
  295,
  296,
  1,
  0,
  0,
  0,
  296,
  302,
  1,
  0,
  0,
  0,
  297,
  299,
  3,
  56,
  28,
  0,
  298,
  297,
  1,
  0,
  0,
  0,
  298,
  299,
  1,
  0,
  0,
  0,
  299,
  300,
  1,
  0,
  0,
  0,
  300,
  302,
  5,
  41,
  0,
  0,
  301,
  286,
  1,
  0,
  0,
  0,
  301,
  298,
  1,
  0,
  0,
  0,
  302,
  41,
  1,
  0,
  0,
  0,
  303,
  306,
  3,
  44,
  22,
  0,
  304,
  307,
  5,
  27,
  0,
  0,
  305,
  307,
  3,
  92,
  46,
  0,
  306,
  304,
  1,
  0,
  0,
  0,
  306,
  305,
  1,
  0,
  0,
  0,
  306,
  307,
  1,
  0,
  0,
  0,
  307,
  43,
  1,
  0,
  0,
  0,
  308,
  310,
  3,
  56,
  28,
  0,
  309,
  308,
  1,
  0,
  0,
  0,
  309,
  310,
  1,
  0,
  0,
  0,
  310,
  319,
  1,
  0,
  0,
  0,
  311,
  312,
  3,
  48,
  24,
  0,
  312,
  313,
  5,
  10,
  0,
  0,
  313,
  315,
  1,
  0,
  0,
  0,
  314,
  311,
  1,
  0,
  0,
  0,
  314,
  315,
  1,
  0,
  0,
  0,
  315,
  316,
  1,
  0,
  0,
  0,
  316,
  317,
  3,
  50,
  25,
  0,
  317,
  318,
  5,
  53,
  0,
  0,
  318,
  320,
  1,
  0,
  0,
  0,
  319,
  314,
  1,
  0,
  0,
  0,
  319,
  320,
  1,
  0,
  0,
  0,
  320,
  321,
  1,
  0,
  0,
  0,
  321,
  332,
  3,
  46,
  23,
  0,
  322,
  332,
  3,
  56,
  28,
  0,
  323,
  324,
  3,
  48,
  24,
  0,
  324,
  325,
  5,
  10,
  0,
  0,
  325,
  327,
  1,
  0,
  0,
  0,
  326,
  323,
  1,
  0,
  0,
  0,
  326,
  327,
  1,
  0,
  0,
  0,
  327,
  328,
  1,
  0,
  0,
  0,
  328,
  329,
  3,
  50,
  25,
  0,
  329,
  330,
  5,
  53,
  0,
  0,
  330,
  332,
  1,
  0,
  0,
  0,
  331,
  309,
  1,
  0,
  0,
  0,
  331,
  322,
  1,
  0,
  0,
  0,
  331,
  326,
  1,
  0,
  0,
  0,
  332,
  45,
  1,
  0,
  0,
  0,
  333,
  338,
  3,
  52,
  26,
  0,
  334,
  335,
  5,
  53,
  0,
  0,
  335,
  337,
  3,
  52,
  26,
  0,
  336,
  334,
  1,
  0,
  0,
  0,
  337,
  340,
  1,
  0,
  0,
  0,
  338,
  336,
  1,
  0,
  0,
  0,
  338,
  339,
  1,
  0,
  0,
  0,
  339,
  47,
  1,
  0,
  0,
  0,
  340,
  338,
  1,
  0,
  0,
  0,
  341,
  342,
  7,
  0,
  0,
  0,
  342,
  49,
  1,
  0,
  0,
  0,
  343,
  344,
  7,
  0,
  0,
  0,
  344,
  51,
  1,
  0,
  0,
  0,
  345,
  347,
  3,
  68,
  34,
  0,
  346,
  348,
  3,
  54,
  27,
  0,
  347,
  346,
  1,
  0,
  0,
  0,
  347,
  348,
  1,
  0,
  0,
  0,
  348,
  53,
  1,
  0,
  0,
  0,
  349,
  351,
  5,
  30,
  0,
  0,
  350,
  352,
  3,
  70,
  35,
  0,
  351,
  350,
  1,
  0,
  0,
  0,
  351,
  352,
  1,
  0,
  0,
  0,
  352,
  353,
  1,
  0,
  0,
  0,
  353,
  354,
  5,
  31,
  0,
  0,
  354,
  55,
  1,
  0,
  0,
  0,
  355,
  357,
  3,
  64,
  32,
  0,
  356,
  355,
  1,
  0,
  0,
  0,
  356,
  357,
  1,
  0,
  0,
  0,
  357,
  358,
  1,
  0,
  0,
  0,
  358,
  359,
  3,
  66,
  33,
  0,
  359,
  360,
  5,
  29,
  0,
  0,
  360,
  57,
  1,
  0,
  0,
  0,
  361,
  362,
  3,
  48,
  24,
  0,
  362,
  363,
  5,
  10,
  0,
  0,
  363,
  365,
  1,
  0,
  0,
  0,
  364,
  361,
  1,
  0,
  0,
  0,
  364,
  365,
  1,
  0,
  0,
  0,
  365,
  366,
  1,
  0,
  0,
  0,
  366,
  367,
  3,
  50,
  25,
  0,
  367,
  368,
  5,
  7,
  0,
  0,
  368,
  369,
  3,
  60,
  30,
  0,
  369,
  376,
  1,
  0,
  0,
  0,
  370,
  371,
  3,
  48,
  24,
  0,
  371,
  373,
  7,
  3,
  0,
  0,
  372,
  374,
  3,
  50,
  25,
  0,
  373,
  372,
  1,
  0,
  0,
  0,
  373,
  374,
  1,
  0,
  0,
  0,
  374,
  376,
  1,
  0,
  0,
  0,
  375,
  364,
  1,
  0,
  0,
  0,
  375,
  370,
  1,
  0,
  0,
  0,
  376,
  59,
  1,
  0,
  0,
  0,
  377,
  378,
  5,
  62,
  0,
  0,
  378,
  61,
  1,
  0,
  0,
  0,
  379,
  380,
  7,
  0,
  0,
  0,
  380,
  63,
  1,
  0,
  0,
  0,
  381,
  382,
  7,
  0,
  0,
  0,
  382,
  65,
  1,
  0,
  0,
  0,
  383,
  394,
  3,
  98,
  49,
  0,
  384,
  389,
  5,
  54,
  0,
  0,
  385,
  386,
  5,
  28,
  0,
  0,
  386,
  388,
  5,
  54,
  0,
  0,
  387,
  385,
  1,
  0,
  0,
  0,
  388,
  391,
  1,
  0,
  0,
  0,
  389,
  387,
  1,
  0,
  0,
  0,
  389,
  390,
  1,
  0,
  0,
  0,
  390,
  394,
  1,
  0,
  0,
  0,
  391,
  389,
  1,
  0,
  0,
  0,
  392,
  394,
  5,
  57,
  0,
  0,
  393,
  383,
  1,
  0,
  0,
  0,
  393,
  384,
  1,
  0,
  0,
  0,
  393,
  392,
  1,
  0,
  0,
  0,
  394,
  67,
  1,
  0,
  0,
  0,
  395,
  396,
  7,
  0,
  0,
  0,
  396,
  69,
  1,
  0,
  0,
  0,
  397,
  402,
  3,
  72,
  36,
  0,
  398,
  399,
  5,
  28,
  0,
  0,
  399,
  401,
  3,
  72,
  36,
  0,
  400,
  398,
  1,
  0,
  0,
  0,
  401,
  404,
  1,
  0,
  0,
  0,
  402,
  400,
  1,
  0,
  0,
  0,
  402,
  403,
  1,
  0,
  0,
  0,
  403,
  406,
  1,
  0,
  0,
  0,
  404,
  402,
  1,
  0,
  0,
  0,
  405,
  407,
  5,
  28,
  0,
  0,
  406,
  405,
  1,
  0,
  0,
  0,
  406,
  407,
  1,
  0,
  0,
  0,
  407,
  71,
  1,
  0,
  0,
  0,
  408,
  411,
  3,
  74,
  37,
  0,
  409,
  411,
  3,
  96,
  48,
  0,
  410,
  408,
  1,
  0,
  0,
  0,
  410,
  409,
  1,
  0,
  0,
  0,
  411,
  73,
  1,
  0,
  0,
  0,
  412,
  413,
  3,
  64,
  32,
  0,
  413,
  414,
  5,
  54,
  0,
  0,
  414,
  75,
  1,
  0,
  0,
  0,
  415,
  419,
  3,
  78,
  39,
  0,
  416,
  418,
  3,
  80,
  40,
  0,
  417,
  416,
  1,
  0,
  0,
  0,
  418,
  421,
  1,
  0,
  0,
  0,
  419,
  417,
  1,
  0,
  0,
  0,
  419,
  420,
  1,
  0,
  0,
  0,
  420,
  423,
  1,
  0,
  0,
  0,
  421,
  419,
  1,
  0,
  0,
  0,
  422,
  424,
  3,
  82,
  41,
  0,
  423,
  422,
  1,
  0,
  0,
  0,
  423,
  424,
  1,
  0,
  0,
  0,
  424,
  77,
  1,
  0,
  0,
  0,
  425,
  426,
  5,
  46,
  0,
  0,
  426,
  427,
  3,
  92,
  46,
  0,
  427,
  79,
  1,
  0,
  0,
  0,
  428,
  430,
  5,
  47,
  0,
  0,
  429,
  431,
  3,
  54,
  27,
  0,
  430,
  429,
  1,
  0,
  0,
  0,
  430,
  431,
  1,
  0,
  0,
  0,
  431,
  432,
  1,
  0,
  0,
  0,
  432,
  433,
  3,
  92,
  46,
  0,
  433,
  81,
  1,
  0,
  0,
  0,
  434,
  435,
  5,
  48,
  0,
  0,
  435,
  436,
  3,
  92,
  46,
  0,
  436,
  83,
  1,
  0,
  0,
  0,
  437,
  441,
  3,
  86,
  43,
  0,
  438,
  440,
  3,
  88,
  44,
  0,
  439,
  438,
  1,
  0,
  0,
  0,
  440,
  443,
  1,
  0,
  0,
  0,
  441,
  439,
  1,
  0,
  0,
  0,
  441,
  442,
  1,
  0,
  0,
  0,
  442,
  445,
  1,
  0,
  0,
  0,
  443,
  441,
  1,
  0,
  0,
  0,
  444,
  446,
  3,
  90,
  45,
  0,
  445,
  444,
  1,
  0,
  0,
  0,
  445,
  446,
  1,
  0,
  0,
  0,
  446,
  85,
  1,
  0,
  0,
  0,
  447,
  448,
  5,
  37,
  0,
  0,
  448,
  449,
  3,
  100,
  50,
  0,
  449,
  450,
  3,
  92,
  46,
  0,
  450,
  87,
  1,
  0,
  0,
  0,
  451,
  452,
  5,
  38,
  0,
  0,
  452,
  453,
  5,
  37,
  0,
  0,
  453,
  454,
  3,
  100,
  50,
  0,
  454,
  455,
  3,
  92,
  46,
  0,
  455,
  89,
  1,
  0,
  0,
  0,
  456,
  457,
  5,
  38,
  0,
  0,
  457,
  458,
  3,
  92,
  46,
  0,
  458,
  91,
  1,
  0,
  0,
  0,
  459,
  461,
  5,
  32,
  0,
  0,
  460,
  462,
  3,
  24,
  12,
  0,
  461,
  460,
  1,
  0,
  0,
  0,
  461,
  462,
  1,
  0,
  0,
  0,
  462,
  463,
  1,
  0,
  0,
  0,
  463,
  464,
  5,
  33,
  0,
  0,
  464,
  93,
  1,
  0,
  0,
  0,
  465,
  466,
  5,
  39,
  0,
  0,
  466,
  467,
  3,
  100,
  50,
  0,
  467,
  468,
  3,
  92,
  46,
  0,
  468,
  473,
  1,
  0,
  0,
  0,
  469,
  470,
  5,
  39,
  0,
  0,
  470,
  473,
  3,
  100,
  50,
  0,
  471,
  473,
  5,
  39,
  0,
  0,
  472,
  465,
  1,
  0,
  0,
  0,
  472,
  469,
  1,
  0,
  0,
  0,
  472,
  471,
  1,
  0,
  0,
  0,
  473,
  95,
  1,
  0,
  0,
  0,
  474,
  475,
  6,
  48,
  -1,
  0,
  475,
  495,
  3,
  98,
  49,
  0,
  476,
  477,
  5,
  21,
  0,
  0,
  477,
  495,
  3,
  96,
  48,
  13,
  478,
  479,
  5,
  26,
  0,
  0,
  479,
  495,
  3,
  96,
  48,
  12,
  480,
  481,
  3,
  50,
  25,
  0,
  481,
  482,
  5,
  53,
  0,
  0,
  482,
  484,
  1,
  0,
  0,
  0,
  483,
  480,
  1,
  0,
  0,
  0,
  483,
  484,
  1,
  0,
  0,
  0,
  484,
  485,
  1,
  0,
  0,
  0,
  485,
  495,
  3,
  46,
  23,
  0,
  486,
  495,
  3,
  38,
  19,
  0,
  487,
  488,
  5,
  30,
  0,
  0,
  488,
  489,
  3,
  96,
  48,
  0,
  489,
  490,
  5,
  31,
  0,
  0,
  490,
  495,
  1,
  0,
  0,
  0,
  491,
  492,
  3,
  56,
  28,
  0,
  492,
  493,
  3,
  96,
  48,
  1,
  493,
  495,
  1,
  0,
  0,
  0,
  494,
  474,
  1,
  0,
  0,
  0,
  494,
  476,
  1,
  0,
  0,
  0,
  494,
  478,
  1,
  0,
  0,
  0,
  494,
  483,
  1,
  0,
  0,
  0,
  494,
  486,
  1,
  0,
  0,
  0,
  494,
  487,
  1,
  0,
  0,
  0,
  494,
  491,
  1,
  0,
  0,
  0,
  495,
  519,
  1,
  0,
  0,
  0,
  496,
  497,
  10,
  11,
  0,
  0,
  497,
  498,
  7,
  4,
  0,
  0,
  498,
  518,
  3,
  96,
  48,
  12,
  499,
  500,
  10,
  10,
  0,
  0,
  500,
  501,
  7,
  5,
  0,
  0,
  501,
  518,
  3,
  96,
  48,
  11,
  502,
  503,
  10,
  9,
  0,
  0,
  503,
  504,
  7,
  6,
  0,
  0,
  504,
  518,
  3,
  96,
  48,
  10,
  505,
  506,
  10,
  8,
  0,
  0,
  506,
  507,
  7,
  7,
  0,
  0,
  507,
  518,
  3,
  96,
  48,
  9,
  508,
  509,
  10,
  7,
  0,
  0,
  509,
  510,
  5,
  13,
  0,
  0,
  510,
  518,
  3,
  96,
  48,
  8,
  511,
  512,
  10,
  6,
  0,
  0,
  512,
  513,
  5,
  12,
  0,
  0,
  513,
  518,
  3,
  96,
  48,
  7,
  514,
  515,
  10,
  5,
  0,
  0,
  515,
  516,
  5,
  20,
  0,
  0,
  516,
  518,
  3,
  96,
  48,
  6,
  517,
  496,
  1,
  0,
  0,
  0,
  517,
  499,
  1,
  0,
  0,
  0,
  517,
  502,
  1,
  0,
  0,
  0,
  517,
  505,
  1,
  0,
  0,
  0,
  517,
  508,
  1,
  0,
  0,
  0,
  517,
  511,
  1,
  0,
  0,
  0,
  517,
  514,
  1,
  0,
  0,
  0,
  518,
  521,
  1,
  0,
  0,
  0,
  519,
  517,
  1,
  0,
  0,
  0,
  519,
  520,
  1,
  0,
  0,
  0,
  520,
  97,
  1,
  0,
  0,
  0,
  521,
  519,
  1,
  0,
  0,
  0,
  522,
  528,
  7,
  8,
  0,
  0,
  523,
  528,
  7,
  9,
  0,
  0,
  524,
  528,
  5,
  54,
  0,
  0,
  525,
  528,
  5,
  57,
  0,
  0,
  526,
  528,
  5,
  36,
  0,
  0,
  527,
  522,
  1,
  0,
  0,
  0,
  527,
  523,
  1,
  0,
  0,
  0,
  527,
  524,
  1,
  0,
  0,
  0,
  527,
  525,
  1,
  0,
  0,
  0,
  527,
  526,
  1,
  0,
  0,
  0,
  528,
  99,
  1,
  0,
  0,
  0,
  529,
  530,
  5,
  30,
  0,
  0,
  530,
  531,
  3,
  102,
  51,
  0,
  531,
  532,
  5,
  31,
  0,
  0,
  532,
  539,
  1,
  0,
  0,
  0,
  533,
  534,
  5,
  30,
  0,
  0,
  534,
  539,
  3,
  102,
  51,
  0,
  535,
  536,
  5,
  30,
  0,
  0,
  536,
  539,
  5,
  31,
  0,
  0,
  537,
  539,
  5,
  30,
  0,
  0,
  538,
  529,
  1,
  0,
  0,
  0,
  538,
  533,
  1,
  0,
  0,
  0,
  538,
  535,
  1,
  0,
  0,
  0,
  538,
  537,
  1,
  0,
  0,
  0,
  539,
  101,
  1,
  0,
  0,
  0,
  540,
  544,
  3,
  98,
  49,
  0,
  541,
  544,
  3,
  96,
  48,
  0,
  542,
  544,
  3,
  104,
  52,
  0,
  543,
  540,
  1,
  0,
  0,
  0,
  543,
  541,
  1,
  0,
  0,
  0,
  543,
  542,
  1,
  0,
  0,
  0,
  544,
  103,
  1,
  0,
  0,
  0,
  545,
  546,
  5,
  54,
  0,
  0,
  546,
  547,
  5,
  49,
  0,
  0,
  547,
  548,
  5,
  54,
  0,
  0,
  548,
  105,
  1,
  0,
  0,
  0,
  76,
  107,
  111,
  117,
  120,
  125,
  130,
  134,
  136,
  140,
  142,
  146,
  150,
  156,
  162,
  167,
  169,
  174,
  177,
  180,
  185,
  188,
  192,
  195,
  198,
  202,
  211,
  215,
  217,
  222,
  233,
  237,
  240,
  245,
  247,
  261,
  268,
  273,
  278,
  283,
  286,
  292,
  295,
  298,
  301,
  306,
  309,
  314,
  319,
  326,
  331,
  338,
  347,
  351,
  356,
  364,
  373,
  375,
  389,
  393,
  402,
  406,
  410,
  419,
  423,
  430,
  441,
  445,
  461,
  472,
  483,
  494,
  517,
  519,
  527,
  538,
  543
], C1 = new L.atn.ATNDeserializer().deserialize(_5), k5 = C1.decisionToState.map((e, t) => new L.dfa.DFA(e, t)), E5 = new L.PredictionContextCache(), x = class extends L.Parser {
  constructor(e) {
    super(e), this._interp = new L.atn.ParserATNSimulator(this, C1, k5, E5), this.ruleNames = x.ruleNames, this.literalNames = x.literalNames, this.symbolicNames = x.symbolicNames;
  }
  get atn() {
    return C1;
  }
  sempred(e, t, n) {
    switch (t) {
      case 48:
        return this.expr_sempred(e, n);
      default:
        throw "No predicate with index:" + t;
    }
  }
  expr_sempred(e, t) {
    switch (t) {
      case 0:
        return this.precpred(this._ctx, 11);
      case 1:
        return this.precpred(this._ctx, 10);
      case 2:
        return this.precpred(this._ctx, 9);
      case 3:
        return this.precpred(this._ctx, 8);
      case 4:
        return this.precpred(this._ctx, 7);
      case 5:
        return this.precpred(this._ctx, 6);
      case 6:
        return this.precpred(this._ctx, 5);
      default:
        throw "No predicate with index:" + t;
    }
  }
  prog() {
    let e = new Dc(this, this._ctx, this.state);
    this.enterRule(e, 0, x.RULE_prog);
    var t = 0;
    try {
      this.state = 125, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 4, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 107, this._errHandler.sync(this), t = this._input.LA(1), t === 6 && (this.state = 106, this.title()), this.state = 109, this.match(x.EOF);
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 111, this._errHandler.sync(this), t = this._input.LA(1), t === 6 && (this.state = 110, this.title()), this.state = 113, this.head(), this.state = 114, this.match(x.EOF);
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 117, this._errHandler.sync(this), t = this._input.LA(1), t === 6 && (this.state = 116, this.title()), this.state = 120, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 3, this._ctx);
          n === 1 && (this.state = 119, this.head()), this.state = 122, this.block(), this.state = 123, this.match(x.EOF);
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  title() {
    let e = new wo(this, this._ctx, this.state);
    this.enterRule(e, 2, x.RULE_title);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 127, this.match(x.TITLE), this.state = 128, this.match(x.TITLE_CONTENT), this.state = 130, this._errHandler.sync(this), t = this._input.LA(1), t === 65 && (this.state = 129, this.match(x.TITLE_END));
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  head() {
    let e = new Co(this, this._ctx, this.state);
    this.enterRule(e, 4, x.RULE_head);
    try {
      this.state = 146, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 10, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 134, this._errHandler.sync(this);
          var n = 1;
          do {
            switch (n) {
              case 1:
                switch (this.state = 134, this._errHandler.sync(this), this._input.LA(1)) {
                  case 43:
                    this.state = 132, this.group();
                    break;
                  case 8:
                  case 17:
                  case 52:
                  case 54:
                  case 57:
                    this.state = 133, this.participant();
                    break;
                  default:
                    throw new L.error.NoViableAltException(this);
                }
                break;
              default:
                throw new L.error.NoViableAltException(this);
            }
            this.state = 136, this._errHandler.sync(this), n = this._interp.adaptivePredict(this._input, 7, this._ctx);
          } while (n != 2 && n != L.atn.ATN.INVALID_ALT_NUMBER);
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 142, this._errHandler.sync(this);
          for (var n = this._interp.adaptivePredict(this._input, 9, this._ctx); n != 2 && n != L.atn.ATN.INVALID_ALT_NUMBER; ) {
            if (n === 1)
              switch (this.state = 140, this._errHandler.sync(this), this._input.LA(1)) {
                case 43:
                  this.state = 138, this.group();
                  break;
                case 8:
                case 17:
                case 52:
                case 54:
                case 57:
                  this.state = 139, this.participant();
                  break;
                default:
                  throw new L.error.NoViableAltException(this);
              }
            this.state = 144, this._errHandler.sync(this), n = this._interp.adaptivePredict(this._input, 9, this._ctx);
          }
          this.state = 145, this.starterExp();
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  group() {
    let e = new Ps(this, this._ctx, this.state);
    this.enterRule(e, 6, x.RULE_group);
    var t = 0;
    try {
      this.state = 169, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 15, this._ctx);
      switch (n) {
        case 1:
          for (this.enterOuterAlt(e, 1), this.state = 148, this.match(x.GROUP), this.state = 150, this._errHandler.sync(this), t = this._input.LA(1), (t === 54 || t === 57) && (this.state = 149, this.name()), this.state = 152, this.match(x.OBRACE), this.state = 156, this._errHandler.sync(this), t = this._input.LA(1); t === 8 || t === 17 || !(t - 52 & -32) && 1 << t - 52 & 37; )
            this.state = 153, this.participant(), this.state = 158, this._errHandler.sync(this), t = this._input.LA(1);
          this.state = 159, this.match(x.CBRACE);
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 160, this.match(x.GROUP), this.state = 162, this._errHandler.sync(this), t = this._input.LA(1), (t === 54 || t === 57) && (this.state = 161, this.name()), this.state = 164, this.match(x.OBRACE);
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 165, this.match(x.GROUP), this.state = 167, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 14, this._ctx);
          n === 1 && (this.state = 166, this.name());
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  starterExp() {
    let e = new _o(this, this._ctx, this.state);
    this.enterRule(e, 8, x.RULE_starterExp);
    var t = 0;
    try {
      switch (this.state = 180, this._errHandler.sync(this), this._input.LA(1)) {
        case 50:
          this.enterOuterAlt(e, 1), this.state = 171, this.match(x.STARTER_LXR), this.state = 177, this._errHandler.sync(this), t = this._input.LA(1), t === 30 && (this.state = 172, this.match(x.OPAR), this.state = 174, this._errHandler.sync(this), t = this._input.LA(1), (t === 54 || t === 57) && (this.state = 173, this.starter()), this.state = 176, this.match(x.CPAR));
          break;
        case 52:
          this.enterOuterAlt(e, 2), this.state = 179, this.match(x.ANNOTATION);
          break;
        default:
          throw new L.error.NoViableAltException(this);
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  starter() {
    let e = new ko(this, this._ctx, this.state);
    this.enterRule(e, 10, x.RULE_starter);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 182, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  participant() {
    let e = new nr(this, this._ctx, this.state);
    this.enterRule(e, 12, x.RULE_participant);
    var t = 0;
    try {
      this.state = 202, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 24, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 185, this._errHandler.sync(this), t = this._input.LA(1), t === 52 && (this.state = 184, this.participantType()), this.state = 188, this._errHandler.sync(this), t = this._input.LA(1), (t === 8 || t === 17) && (this.state = 187, this.stereotype()), this.state = 190, this.name(), this.state = 192, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 21, this._ctx);
          n === 1 && (this.state = 191, this.width()), this.state = 195, this._errHandler.sync(this), t = this._input.LA(1), t === 45 && (this.state = 194, this.label()), this.state = 198, this._errHandler.sync(this), t = this._input.LA(1), t === 11 && (this.state = 197, this.match(x.COLOR));
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 200, this.stereotype();
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 201, this.participantType();
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  stereotype() {
    let e = new Eo(this, this._ctx, this.state);
    this.enterRule(e, 14, x.RULE_stereotype);
    var t = 0;
    try {
      this.state = 217, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 27, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 204, this.match(x.SOPEN), this.state = 205, this.name(), this.state = 206, this.match(x.SCLOSE);
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 208, this.match(x.SOPEN), this.state = 209, this.name(), this.state = 211, this._errHandler.sync(this), t = this._input.LA(1), t === 16 && (this.state = 210, this.match(x.GT));
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 213, t = this._input.LA(1), t === 8 || t === 17 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this), this.state = 215, this._errHandler.sync(this), t = this._input.LA(1), (t === 9 || t === 16) && (this.state = 214, t = this._input.LA(1), t === 9 || t === 16 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this));
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  label() {
    let e = new To(this, this._ctx, this.state);
    this.enterRule(e, 16, x.RULE_label);
    try {
      this.state = 222, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 28, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 219, this.match(x.AS), this.state = 220, this.name();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 221, this.match(x.AS);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  participantType() {
    let e = new Ao(this, this._ctx, this.state);
    this.enterRule(e, 18, x.RULE_participantType);
    try {
      this.enterOuterAlt(e, 1), this.state = 224, this.match(x.ANNOTATION);
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  name() {
    let e = new cr(this, this._ctx, this.state);
    this.enterRule(e, 20, x.RULE_name);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 226, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  width() {
    let e = new So(this, this._ctx, this.state);
    this.enterRule(e, 22, x.RULE_width);
    try {
      this.enterOuterAlt(e, 1), this.state = 228, this.match(x.INT);
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  block() {
    let e = new di(this, this._ctx, this.state);
    this.enterRule(e, 24, x.RULE_block);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 231, this._errHandler.sync(this), t = this._input.LA(1);
      do
        this.state = 230, this.stat(), this.state = 233, this._errHandler.sync(this), t = this._input.LA(1);
      while (!(t - 34 & -32) && 1 << t - 34 & 217191919);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  ret() {
    let e = new Ro(this, this._ctx, this.state);
    this.enterRule(e, 26, x.RULE_ret);
    var t = 0;
    try {
      switch (this.state = 247, this._errHandler.sync(this), this._input.LA(1)) {
        case 40:
          this.enterOuterAlt(e, 1), this.state = 235, this.match(x.RETURN), this.state = 237, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 30, this._ctx);
          n === 1 && (this.state = 236, this.expr(0)), this.state = 240, this._errHandler.sync(this), t = this._input.LA(1), t === 27 && (this.state = 239, this.match(x.SCOL));
          break;
        case 51:
          this.enterOuterAlt(e, 2), this.state = 242, this.match(x.ANNOTATION_RET), this.state = 243, this.asyncMessage(), this.state = 245, this._errHandler.sync(this), t = this._input.LA(1), t === 63 && (this.state = 244, this.match(x.EVENT_END));
          break;
        default:
          throw new L.error.NoViableAltException(this);
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  divider() {
    let e = new Io(this, this._ctx, this.state);
    this.enterRule(e, 28, x.RULE_divider);
    try {
      this.enterOuterAlt(e, 1), this.state = 249, this.dividerNote();
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  dividerNote() {
    let e = new Oo(this, this._ctx, this.state);
    this.enterRule(e, 30, x.RULE_dividerNote);
    try {
      this.enterOuterAlt(e, 1), this.state = 251, this.match(x.DIVIDER);
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  stat() {
    let e = new Ms(this, this._ctx, this.state);
    this.enterRule(e, 32, x.RULE_stat);
    var t = 0;
    try {
      this.state = 268, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 35, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 253, this.alt();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 254, this.par();
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 255, this.opt();
          break;
        case 4:
          this.enterOuterAlt(e, 4), this.state = 256, this.loop();
          break;
        case 5:
          this.enterOuterAlt(e, 5), this.state = 257, this.creation();
          break;
        case 6:
          this.enterOuterAlt(e, 6), this.state = 258, this.message();
          break;
        case 7:
          this.enterOuterAlt(e, 7), this.state = 259, this.asyncMessage(), this.state = 261, this._errHandler.sync(this), t = this._input.LA(1), t === 63 && (this.state = 260, this.match(x.EVENT_END));
          break;
        case 8:
          this.enterOuterAlt(e, 8), this.state = 263, this.ret();
          break;
        case 9:
          this.enterOuterAlt(e, 9), this.state = 264, this.divider();
          break;
        case 10:
          this.enterOuterAlt(e, 10), this.state = 265, this.tcf();
          break;
        case 11:
          this.enterOuterAlt(e, 11), this.state = 266, e._OTHER = this.match(x.OTHER), console.log("unknown char: " + (e._OTHER === null ? null : e._OTHER.text));
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  par() {
    let e = new No(this, this._ctx, this.state);
    this.enterRule(e, 34, x.RULE_par);
    try {
      this.state = 273, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 36, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 270, this.match(x.PAR), this.state = 271, this.braceBlock();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 272, this.match(x.PAR);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  opt() {
    let e = new Po(this, this._ctx, this.state);
    this.enterRule(e, 36, x.RULE_opt);
    try {
      this.state = 278, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 37, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 275, this.match(x.OPT), this.state = 276, this.braceBlock();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 277, this.match(x.OPT);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  creation() {
    let e = new pi(this, this._ctx, this.state);
    this.enterRule(e, 38, x.RULE_creation);
    try {
      this.enterOuterAlt(e, 1), this.state = 280, this.creationBody(), this.state = 283, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 38, this._ctx);
      t === 1 ? (this.state = 281, this.match(x.SCOL)) : t === 2 && (this.state = 282, this.braceBlock());
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  creationBody() {
    let e = new Mo(this, this._ctx, this.state);
    this.enterRule(e, 40, x.RULE_creationBody);
    var t = 0;
    try {
      this.state = 301, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 43, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 286, this._errHandler.sync(this), t = this._input.LA(1), !(t - 34 & -32) && 1 << t - 34 & 15728647 && (this.state = 285, this.assignment()), this.state = 288, this.match(x.NEW), this.state = 289, this.construct(), this.state = 295, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 41, this._ctx);
          n === 1 && (this.state = 290, this.match(x.OPAR), this.state = 292, this._errHandler.sync(this), t = this._input.LA(1), (!(t & -32) && 1 << t & 1142947840 || !(t - 34 & -32) && 1 << t - 34 & 15728775) && (this.state = 291, this.parameters()), this.state = 294, this.match(x.CPAR));
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 298, this._errHandler.sync(this), t = this._input.LA(1), !(t - 34 & -32) && 1 << t - 34 & 15728647 && (this.state = 297, this.assignment()), this.state = 300, this.match(x.NEW);
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  message() {
    let e = new Fo(this, this._ctx, this.state);
    this.enterRule(e, 42, x.RULE_message);
    try {
      switch (this.enterOuterAlt(e, 1), this.state = 303, this.messageBody(), this.state = 306, this._errHandler.sync(this), this._input.LA(1)) {
        case 27:
          this.state = 304, this.match(x.SCOL);
          break;
        case 32:
          this.state = 305, this.braceBlock();
          break;
        case -1:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 39:
        case 40:
        case 41:
        case 42:
        case 44:
        case 46:
        case 51:
        case 54:
        case 55:
        case 56:
        case 57:
        case 60:
        case 61:
          break;
        default:
          break;
      }
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  messageBody() {
    let e = new zo(this, this._ctx, this.state);
    this.enterRule(e, 44, x.RULE_messageBody);
    try {
      this.state = 331, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 49, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 309, this._errHandler.sync(this);
          var t = this._interp.adaptivePredict(this._input, 45, this._ctx);
          t === 1 && (this.state = 308, this.assignment()), this.state = 319, this._errHandler.sync(this);
          var t = this._interp.adaptivePredict(this._input, 47, this._ctx);
          if (t === 1) {
            this.state = 314, this._errHandler.sync(this);
            var t = this._interp.adaptivePredict(this._input, 46, this._ctx);
            t === 1 && (this.state = 311, this.from(), this.state = 312, this.match(x.ARROW)), this.state = 316, this.to(), this.state = 317, this.match(x.DOT);
          }
          this.state = 321, this.func();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 322, this.assignment();
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 326, this._errHandler.sync(this);
          var t = this._interp.adaptivePredict(this._input, 48, this._ctx);
          t === 1 && (this.state = 323, this.from(), this.state = 324, this.match(x.ARROW)), this.state = 328, this.to(), this.state = 329, this.match(x.DOT);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  func() {
    let e = new fi(this, this._ctx, this.state);
    this.enterRule(e, 46, x.RULE_func);
    try {
      this.enterOuterAlt(e, 1), this.state = 333, this.signature(), this.state = 338, this._errHandler.sync(this);
      for (var t = this._interp.adaptivePredict(this._input, 50, this._ctx); t != 2 && t != L.atn.ATN.INVALID_ALT_NUMBER; )
        t === 1 && (this.state = 334, this.match(x.DOT), this.state = 335, this.signature()), this.state = 340, this._errHandler.sync(this), t = this._interp.adaptivePredict(this._input, 50, this._ctx);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  from() {
    let e = new gi(this, this._ctx, this.state);
    this.enterRule(e, 48, x.RULE_from);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 341, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  to() {
    let e = new Wr(this, this._ctx, this.state);
    this.enterRule(e, 50, x.RULE_to);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 343, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  signature() {
    let e = new Fs(this, this._ctx, this.state);
    this.enterRule(e, 52, x.RULE_signature);
    try {
      this.enterOuterAlt(e, 1), this.state = 345, this.methodName(), this.state = 347, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 51, this._ctx);
      t === 1 && (this.state = 346, this.invocation());
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  invocation() {
    let e = new mi(this, this._ctx, this.state);
    this.enterRule(e, 54, x.RULE_invocation);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 349, this.match(x.OPAR), this.state = 351, this._errHandler.sync(this), t = this._input.LA(1), (!(t & -32) && 1 << t & 1142947840 || !(t - 34 & -32) && 1 << t - 34 & 15728775) && (this.state = 350, this.parameters()), this.state = 353, this.match(x.CPAR);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  assignment() {
    let e = new Yr(this, this._ctx, this.state);
    this.enterRule(e, 56, x.RULE_assignment);
    try {
      this.enterOuterAlt(e, 1), this.state = 356, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 53, this._ctx);
      t === 1 && (this.state = 355, this.type()), this.state = 358, this.assignee(), this.state = 359, this.match(x.ASSIGN);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  asyncMessage() {
    let e = new xi(this, this._ctx, this.state);
    this.enterRule(e, 58, x.RULE_asyncMessage);
    var t = 0;
    try {
      this.state = 375, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 56, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 364, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 54, this._ctx);
          n === 1 && (this.state = 361, this.from(), this.state = 362, this.match(x.ARROW)), this.state = 366, this.to(), this.state = 367, this.match(x.COL), this.state = 368, this.content();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 370, this.from(), this.state = 371, t = this._input.LA(1), t === 10 || t === 21 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this), this.state = 373, this._errHandler.sync(this);
          var n = this._interp.adaptivePredict(this._input, 55, this._ctx);
          n === 1 && (this.state = 372, this.to());
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  content() {
    let e = new Do(this, this._ctx, this.state);
    this.enterRule(e, 60, x.RULE_content);
    try {
      this.enterOuterAlt(e, 1), this.state = 377, this.match(x.EVENT_PAYLOAD_LXR);
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  construct() {
    let e = new Bo(this, this._ctx, this.state);
    this.enterRule(e, 62, x.RULE_construct);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 379, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  type() {
    let e = new Li(this, this._ctx, this.state);
    this.enterRule(e, 64, x.RULE_type);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 381, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  assignee() {
    let e = new Uo(this, this._ctx, this.state);
    this.enterRule(e, 66, x.RULE_assignee);
    var t = 0;
    try {
      this.state = 393, this._errHandler.sync(this);
      var n = this._interp.adaptivePredict(this._input, 58, this._ctx);
      switch (n) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 383, this.atom();
          break;
        case 2:
          for (this.enterOuterAlt(e, 2), this.state = 384, this.match(x.ID), this.state = 389, this._errHandler.sync(this), t = this._input.LA(1); t === 28; )
            this.state = 385, this.match(x.COMMA), this.state = 386, this.match(x.ID), this.state = 391, this._errHandler.sync(this), t = this._input.LA(1);
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 392, this.match(x.STRING);
          break;
      }
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  methodName() {
    let e = new Ho(this, this._ctx, this.state);
    this.enterRule(e, 68, x.RULE_methodName);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 395, t = this._input.LA(1), t === 54 || t === 57 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  parameters() {
    let e = new yi(this, this._ctx, this.state);
    this.enterRule(e, 70, x.RULE_parameters);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 397, this.parameter(), this.state = 402, this._errHandler.sync(this);
      for (var n = this._interp.adaptivePredict(this._input, 59, this._ctx); n != 2 && n != L.atn.ATN.INVALID_ALT_NUMBER; )
        n === 1 && (this.state = 398, this.match(x.COMMA), this.state = 399, this.parameter()), this.state = 404, this._errHandler.sync(this), n = this._interp.adaptivePredict(this._input, 59, this._ctx);
      this.state = 406, this._errHandler.sync(this), t = this._input.LA(1), t === 28 && (this.state = 405, this.match(x.COMMA));
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  parameter() {
    let e = new zs(this, this._ctx, this.state);
    this.enterRule(e, 72, x.RULE_parameter);
    try {
      this.state = 410, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 61, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 408, this.declaration();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 409, this.expr(0);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  declaration() {
    let e = new Go(this, this._ctx, this.state);
    this.enterRule(e, 74, x.RULE_declaration);
    try {
      this.enterOuterAlt(e, 1), this.state = 412, this.type(), this.state = 413, this.match(x.ID);
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  tcf() {
    let e = new $o(this, this._ctx, this.state);
    this.enterRule(e, 76, x.RULE_tcf);
    var t = 0;
    try {
      for (this.enterOuterAlt(e, 1), this.state = 415, this.tryBlock(), this.state = 419, this._errHandler.sync(this), t = this._input.LA(1); t === 47; )
        this.state = 416, this.catchBlock(), this.state = 421, this._errHandler.sync(this), t = this._input.LA(1);
      this.state = 423, this._errHandler.sync(this), t = this._input.LA(1), t === 48 && (this.state = 422, this.finallyBlock());
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  tryBlock() {
    let e = new jo(this, this._ctx, this.state);
    this.enterRule(e, 78, x.RULE_tryBlock);
    try {
      this.enterOuterAlt(e, 1), this.state = 425, this.match(x.TRY), this.state = 426, this.braceBlock();
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  catchBlock() {
    let e = new Ds(this, this._ctx, this.state);
    this.enterRule(e, 80, x.RULE_catchBlock);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 428, this.match(x.CATCH), this.state = 430, this._errHandler.sync(this), t = this._input.LA(1), t === 30 && (this.state = 429, this.invocation()), this.state = 432, this.braceBlock();
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  finallyBlock() {
    let e = new Vo(this, this._ctx, this.state);
    this.enterRule(e, 82, x.RULE_finallyBlock);
    try {
      this.enterOuterAlt(e, 1), this.state = 434, this.match(x.FINALLY), this.state = 435, this.braceBlock();
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  alt() {
    let e = new qo(this, this._ctx, this.state);
    this.enterRule(e, 84, x.RULE_alt);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 437, this.ifBlock(), this.state = 441, this._errHandler.sync(this);
      for (var n = this._interp.adaptivePredict(this._input, 65, this._ctx); n != 2 && n != L.atn.ATN.INVALID_ALT_NUMBER; )
        n === 1 && (this.state = 438, this.elseIfBlock()), this.state = 443, this._errHandler.sync(this), n = this._interp.adaptivePredict(this._input, 65, this._ctx);
      this.state = 445, this._errHandler.sync(this), t = this._input.LA(1), t === 38 && (this.state = 444, this.elseBlock());
    } catch (r) {
      if (r instanceof L.error.RecognitionException)
        e.exception = r, this._errHandler.reportError(this, r), this._errHandler.recover(this, r);
      else
        throw r;
    } finally {
      this.exitRule();
    }
    return e;
  }
  ifBlock() {
    let e = new Zo(this, this._ctx, this.state);
    this.enterRule(e, 86, x.RULE_ifBlock);
    try {
      this.enterOuterAlt(e, 1), this.state = 447, this.match(x.IF), this.state = 448, this.parExpr(), this.state = 449, this.braceBlock();
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  elseIfBlock() {
    let e = new Bs(this, this._ctx, this.state);
    this.enterRule(e, 88, x.RULE_elseIfBlock);
    try {
      this.enterOuterAlt(e, 1), this.state = 451, this.match(x.ELSE), this.state = 452, this.match(x.IF), this.state = 453, this.parExpr(), this.state = 454, this.braceBlock();
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  elseBlock() {
    let e = new Wo(this, this._ctx, this.state);
    this.enterRule(e, 90, x.RULE_elseBlock);
    try {
      this.enterOuterAlt(e, 1), this.state = 456, this.match(x.ELSE), this.state = 457, this.braceBlock();
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
  braceBlock() {
    let e = new me(this, this._ctx, this.state);
    this.enterRule(e, 92, x.RULE_braceBlock);
    var t = 0;
    try {
      this.enterOuterAlt(e, 1), this.state = 459, this.match(x.OBRACE), this.state = 461, this._errHandler.sync(this), t = this._input.LA(1), !(t - 34 & -32) && 1 << t - 34 & 217191919 && (this.state = 460, this.block()), this.state = 463, this.match(x.CBRACE);
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  loop() {
    let e = new Yo(this, this._ctx, this.state);
    this.enterRule(e, 94, x.RULE_loop);
    try {
      this.state = 472, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 68, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 465, this.match(x.WHILE), this.state = 466, this.parExpr(), this.state = 467, this.braceBlock();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 469, this.match(x.WHILE), this.state = 470, this.parExpr();
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 471, this.match(x.WHILE);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  expr(e) {
    e === void 0 && (e = 0);
    const t = this._ctx, n = this.state;
    let r = new X(this, this._ctx, n), s = r;
    const i = 96;
    this.enterRecursionRule(r, 96, x.RULE_expr, e);
    var o = 0;
    try {
      this.enterOuterAlt(r, 1), this.state = 494, this._errHandler.sync(this);
      var a = this._interp.adaptivePredict(this._input, 70, this._ctx);
      switch (a) {
        case 1:
          r = new Hc(this, r), this._ctx = r, s = r, this.state = 475, this.atom();
          break;
        case 2:
          r = new Zc(this, r), this._ctx = r, s = r, this.state = 476, this.match(x.MINUS), this.state = 477, this.expr(13);
          break;
        case 3:
          r = new qc(this, r), this._ctx = r, s = r, this.state = 478, this.match(x.NOT), this.state = 479, this.expr(12);
          break;
        case 4:
          r = new Uc(this, r), this._ctx = r, s = r, this.state = 483, this._errHandler.sync(this);
          var a = this._interp.adaptivePredict(this._input, 69, this._ctx);
          a === 1 && (this.state = 480, this.to(), this.state = 481, this.match(x.DOT)), this.state = 485, this.func();
          break;
        case 5:
          r = new Wc(this, r), this._ctx = r, s = r, this.state = 486, this.creation();
          break;
        case 6:
          r = new Yc(this, r), this._ctx = r, s = r, this.state = 487, this.match(x.OPAR), this.state = 488, this.expr(0), this.state = 489, this.match(x.CPAR);
          break;
        case 7:
          r = new Bc(this, r), this._ctx = r, s = r, this.state = 491, this.assignment(), this.state = 492, this.expr(1);
          break;
      }
      this._ctx.stop = this._input.LT(-1), this.state = 519, this._errHandler.sync(this);
      for (var l = this._interp.adaptivePredict(this._input, 72, this._ctx); l != 2 && l != L.atn.ATN.INVALID_ALT_NUMBER; ) {
        if (l === 1) {
          this._parseListeners !== null && this.triggerExitRuleEvent(), s = r, this.state = 517, this._errHandler.sync(this);
          var a = this._interp.adaptivePredict(this._input, 71, this._ctx);
          switch (a) {
            case 1:
              if (r = new Kc(
                this,
                new X(this, t, n)
              ), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 496, !this.precpred(this._ctx, 11))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 11)"
                );
              this.state = 497, r.op = this._input.LT(1), o = this._input.LA(1), !(o & -32) && 1 << o & 29360128 ? (this._errHandler.reportMatch(this), this.consume()) : r.op = this._errHandler.recoverInline(this), this.state = 498, this.expr(12);
              break;
            case 2:
              if (r = new $c(
                this,
                new X(this, t, n)
              ), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 499, !this.precpred(this._ctx, 10))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 10)"
                );
              this.state = 500, r.op = this._input.LT(1), o = this._input.LA(1), o === 20 || o === 21 ? (this._errHandler.reportMatch(this), this.consume()) : r.op = this._errHandler.recoverInline(this), this.state = 501, this.expr(11);
              break;
            case 3:
              if (r = new jc(
                this,
                new X(this, t, n)
              ), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 502, !this.precpred(this._ctx, 9))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 9)"
                );
              this.state = 503, r.op = this._input.LT(1), o = this._input.LA(1), !(o & -32) && 1 << o & 983040 ? (this._errHandler.reportMatch(this), this.consume()) : r.op = this._errHandler.recoverInline(this), this.state = 504, this.expr(10);
              break;
            case 4:
              if (r = new Qc(
                this,
                new X(this, t, n)
              ), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 505, !this.precpred(this._ctx, 8))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 8)"
                );
              this.state = 506, r.op = this._input.LT(1), o = this._input.LA(1), o === 14 || o === 15 ? (this._errHandler.reportMatch(this), this.consume()) : r.op = this._errHandler.recoverInline(this), this.state = 507, this.expr(9);
              break;
            case 5:
              if (r = new Xc(this, new X(this, t, n)), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 508, !this.precpred(this._ctx, 7))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 7)"
                );
              this.state = 509, this.match(x.AND), this.state = 510, this.expr(8);
              break;
            case 6:
              if (r = new Gc(this, new X(this, t, n)), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 511, !this.precpred(this._ctx, 6))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 6)"
                );
              this.state = 512, this.match(x.OR), this.state = 513, this.expr(7);
              break;
            case 7:
              if (r = new Vc(this, new X(this, t, n)), this.pushNewRecursionContext(r, i, x.RULE_expr), this.state = 514, !this.precpred(this._ctx, 5))
                throw new L.error.FailedPredicateException(
                  this,
                  "this.precpred(this._ctx, 5)"
                );
              this.state = 515, this.match(x.PLUS), this.state = 516, this.expr(6);
              break;
          }
        }
        this.state = 521, this._errHandler.sync(this), l = this._interp.adaptivePredict(this._input, 72, this._ctx);
      }
    } catch (c) {
      if (c instanceof L.error.RecognitionException)
        r.exception = c, this._errHandler.reportError(this, c), this._errHandler.recover(this, c);
      else
        throw c;
    } finally {
      this.unrollRecursionContexts(t);
    }
    return r;
  }
  atom() {
    let e = new Ve(this, this._ctx, this.state);
    this.enterRule(e, 98, x.RULE_atom);
    var t = 0;
    try {
      switch (this.state = 527, this._errHandler.sync(this), this._input.LA(1)) {
        case 55:
        case 56:
          e = new r2(this, e), this.enterOuterAlt(e, 1), this.state = 522, t = this._input.LA(1), t === 55 || t === 56 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
          break;
        case 34:
        case 35:
          e = new Jc(this, e), this.enterOuterAlt(e, 2), this.state = 523, t = this._input.LA(1), t === 34 || t === 35 ? (this._errHandler.reportMatch(this), this.consume()) : this._errHandler.recoverInline(this);
          break;
        case 54:
          e = new t2(this, e), this.enterOuterAlt(e, 3), this.state = 524, this.match(x.ID);
          break;
        case 57:
          e = new e2(this, e), this.enterOuterAlt(e, 4), this.state = 525, this.match(x.STRING);
          break;
        case 36:
          e = new n2(this, e), this.enterOuterAlt(e, 5), this.state = 526, this.match(x.NIL);
          break;
        default:
          throw new L.error.NoViableAltException(this);
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  parExpr() {
    let e = new Kr(this, this._ctx, this.state);
    this.enterRule(e, 100, x.RULE_parExpr);
    try {
      this.state = 538, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 74, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 529, this.match(x.OPAR), this.state = 530, this.condition(), this.state = 531, this.match(x.CPAR);
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 533, this.match(x.OPAR), this.state = 534, this.condition();
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 535, this.match(x.OPAR), this.state = 536, this.match(x.CPAR);
          break;
        case 4:
          this.enterOuterAlt(e, 4), this.state = 537, this.match(x.OPAR);
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  condition() {
    let e = new Ko(this, this._ctx, this.state);
    this.enterRule(e, 102, x.RULE_condition);
    try {
      this.state = 543, this._errHandler.sync(this);
      var t = this._interp.adaptivePredict(this._input, 75, this._ctx);
      switch (t) {
        case 1:
          this.enterOuterAlt(e, 1), this.state = 540, this.atom();
          break;
        case 2:
          this.enterOuterAlt(e, 2), this.state = 541, this.expr(0);
          break;
        case 3:
          this.enterOuterAlt(e, 3), this.state = 542, this.inExpr();
          break;
      }
    } catch (n) {
      if (n instanceof L.error.RecognitionException)
        e.exception = n, this._errHandler.reportError(this, n), this._errHandler.recover(this, n);
      else
        throw n;
    } finally {
      this.exitRule();
    }
    return e;
  }
  inExpr() {
    let e = new Qo(this, this._ctx, this.state);
    this.enterRule(e, 104, x.RULE_inExpr);
    try {
      this.enterOuterAlt(e, 1), this.state = 545, this.match(x.ID), this.state = 546, this.match(x.IN), this.state = 547, this.match(x.ID);
    } catch (t) {
      if (t instanceof L.error.RecognitionException)
        e.exception = t, this._errHandler.reportError(this, t), this._errHandler.recover(this, t);
      else
        throw t;
    } finally {
      this.exitRule();
    }
    return e;
  }
};
let h = x;
B(h, "grammarFileName", "java-escape"), B(h, "literalNames", [
  null,
  null,
  "'const'",
  "'readonly'",
  "'static'",
  "'await'",
  "'title'",
  "':'",
  "'<<'",
  "'>>'",
  "'->'",
  null,
  "'||'",
  "'&&'",
  "'=='",
  "'!='",
  "'>'",
  "'<'",
  "'>='",
  "'<='",
  "'+'",
  "'-'",
  "'*'",
  "'/'",
  "'%'",
  "'^'",
  "'!'",
  "';'",
  "','",
  "'='",
  "'('",
  "')'",
  "'{'",
  "'}'",
  "'true'",
  "'false'",
  null,
  "'if'",
  "'else'",
  null,
  "'return'",
  "'new'",
  "'par'",
  "'group'",
  "'opt'",
  "'as'",
  "'try'",
  "'catch'",
  "'finally'",
  "'in'",
  null,
  null,
  null,
  "'.'"
]), B(h, "symbolicNames", [
  null,
  "WS",
  "CONSTANT",
  "READONLY",
  "STATIC",
  "AWAIT",
  "TITLE",
  "COL",
  "SOPEN",
  "SCLOSE",
  "ARROW",
  "COLOR",
  "OR",
  "AND",
  "EQ",
  "NEQ",
  "GT",
  "LT",
  "GTEQ",
  "LTEQ",
  "PLUS",
  "MINUS",
  "MULT",
  "DIV",
  "MOD",
  "POW",
  "NOT",
  "SCOL",
  "COMMA",
  "ASSIGN",
  "OPAR",
  "CPAR",
  "OBRACE",
  "CBRACE",
  "TRUE",
  "FALSE",
  "NIL",
  "IF",
  "ELSE",
  "WHILE",
  "RETURN",
  "NEW",
  "PAR",
  "GROUP",
  "OPT",
  "AS",
  "TRY",
  "CATCH",
  "FINALLY",
  "IN",
  "STARTER_LXR",
  "ANNOTATION_RET",
  "ANNOTATION",
  "DOT",
  "ID",
  "INT",
  "FLOAT",
  "STRING",
  "CR",
  "COMMENT",
  "OTHER",
  "DIVIDER",
  "EVENT_PAYLOAD_LXR",
  "EVENT_END",
  "TITLE_CONTENT",
  "TITLE_END"
]), B(h, "ruleNames", [
  "prog",
  "title",
  "head",
  "group",
  "starterExp",
  "starter",
  "participant",
  "stereotype",
  "label",
  "participantType",
  "name",
  "width",
  "block",
  "ret",
  "divider",
  "dividerNote",
  "stat",
  "par",
  "opt",
  "creation",
  "creationBody",
  "message",
  "messageBody",
  "func",
  "from",
  "to",
  "signature",
  "invocation",
  "assignment",
  "asyncMessage",
  "content",
  "construct",
  "type",
  "assignee",
  "methodName",
  "parameters",
  "parameter",
  "declaration",
  "tcf",
  "tryBlock",
  "catchBlock",
  "finallyBlock",
  "alt",
  "ifBlock",
  "elseIfBlock",
  "elseBlock",
  "braceBlock",
  "loop",
  "expr",
  "atom",
  "parExpr",
  "condition",
  "inExpr"
]);
h.EOF = L.Token.EOF;
h.WS = 1;
h.CONSTANT = 2;
h.READONLY = 3;
h.STATIC = 4;
h.AWAIT = 5;
h.TITLE = 6;
h.COL = 7;
h.SOPEN = 8;
h.SCLOSE = 9;
h.ARROW = 10;
h.COLOR = 11;
h.OR = 12;
h.AND = 13;
h.EQ = 14;
h.NEQ = 15;
h.GT = 16;
h.LT = 17;
h.GTEQ = 18;
h.LTEQ = 19;
h.PLUS = 20;
h.MINUS = 21;
h.MULT = 22;
h.DIV = 23;
h.MOD = 24;
h.POW = 25;
h.NOT = 26;
h.SCOL = 27;
h.COMMA = 28;
h.ASSIGN = 29;
h.OPAR = 30;
h.CPAR = 31;
h.OBRACE = 32;
h.CBRACE = 33;
h.TRUE = 34;
h.FALSE = 35;
h.NIL = 36;
h.IF = 37;
h.ELSE = 38;
h.WHILE = 39;
h.RETURN = 40;
h.NEW = 41;
h.PAR = 42;
h.GROUP = 43;
h.OPT = 44;
h.AS = 45;
h.TRY = 46;
h.CATCH = 47;
h.FINALLY = 48;
h.IN = 49;
h.STARTER_LXR = 50;
h.ANNOTATION_RET = 51;
h.ANNOTATION = 52;
h.DOT = 53;
h.ID = 54;
h.INT = 55;
h.FLOAT = 56;
h.STRING = 57;
h.CR = 58;
h.COMMENT = 59;
h.OTHER = 60;
h.DIVIDER = 61;
h.EVENT_PAYLOAD_LXR = 62;
h.EVENT_END = 63;
h.TITLE_CONTENT = 64;
h.TITLE_END = 65;
h.RULE_prog = 0;
h.RULE_title = 1;
h.RULE_head = 2;
h.RULE_group = 3;
h.RULE_starterExp = 4;
h.RULE_starter = 5;
h.RULE_participant = 6;
h.RULE_stereotype = 7;
h.RULE_label = 8;
h.RULE_participantType = 9;
h.RULE_name = 10;
h.RULE_width = 11;
h.RULE_block = 12;
h.RULE_ret = 13;
h.RULE_divider = 14;
h.RULE_dividerNote = 15;
h.RULE_stat = 16;
h.RULE_par = 17;
h.RULE_opt = 18;
h.RULE_creation = 19;
h.RULE_creationBody = 20;
h.RULE_message = 21;
h.RULE_messageBody = 22;
h.RULE_func = 23;
h.RULE_from = 24;
h.RULE_to = 25;
h.RULE_signature = 26;
h.RULE_invocation = 27;
h.RULE_assignment = 28;
h.RULE_asyncMessage = 29;
h.RULE_content = 30;
h.RULE_construct = 31;
h.RULE_type = 32;
h.RULE_assignee = 33;
h.RULE_methodName = 34;
h.RULE_parameters = 35;
h.RULE_parameter = 36;
h.RULE_declaration = 37;
h.RULE_tcf = 38;
h.RULE_tryBlock = 39;
h.RULE_catchBlock = 40;
h.RULE_finallyBlock = 41;
h.RULE_alt = 42;
h.RULE_ifBlock = 43;
h.RULE_elseIfBlock = 44;
h.RULE_elseBlock = 45;
h.RULE_braceBlock = 46;
h.RULE_loop = 47;
h.RULE_expr = 48;
h.RULE_atom = 49;
h.RULE_parExpr = 50;
h.RULE_condition = 51;
h.RULE_inExpr = 52;
class Dc extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_prog;
  }
  EOF() {
    return this.getToken(h.EOF, 0);
  }
  title() {
    return this.getTypedRuleContext(wo, 0);
  }
  head() {
    return this.getTypedRuleContext(Co, 0);
  }
  block() {
    return this.getTypedRuleContext(di, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterProg(this);
  }
  exitRule(t) {
    t instanceof y && t.exitProg(this);
  }
}
class wo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_title;
  }
  TITLE() {
    return this.getToken(h.TITLE, 0);
  }
  TITLE_CONTENT() {
    return this.getToken(h.TITLE_CONTENT, 0);
  }
  TITLE_END() {
    return this.getToken(h.TITLE_END, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterTitle(this);
  }
  exitRule(t) {
    t instanceof y && t.exitTitle(this);
  }
}
class Co extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "group", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(Ps) : this.getTypedRuleContext(Ps, s);
    }), B(this, "participant", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(nr) : this.getTypedRuleContext(nr, s);
    }), this.parser = t, this.ruleIndex = h.RULE_head;
  }
  starterExp() {
    return this.getTypedRuleContext(_o, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterHead(this);
  }
  exitRule(t) {
    t instanceof y && t.exitHead(this);
  }
}
class Ps extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "participant", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(nr) : this.getTypedRuleContext(nr, s);
    }), this.parser = t, this.ruleIndex = h.RULE_group;
  }
  GROUP() {
    return this.getToken(h.GROUP, 0);
  }
  OBRACE() {
    return this.getToken(h.OBRACE, 0);
  }
  CBRACE() {
    return this.getToken(h.CBRACE, 0);
  }
  name() {
    return this.getTypedRuleContext(cr, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterGroup(this);
  }
  exitRule(t) {
    t instanceof y && t.exitGroup(this);
  }
}
class _o extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_starterExp;
  }
  STARTER_LXR() {
    return this.getToken(h.STARTER_LXR, 0);
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  starter() {
    return this.getTypedRuleContext(ko, 0);
  }
  ANNOTATION() {
    return this.getToken(h.ANNOTATION, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterStarterExp(this);
  }
  exitRule(t) {
    t instanceof y && t.exitStarterExp(this);
  }
}
class ko extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_starter;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterStarter(this);
  }
  exitRule(t) {
    t instanceof y && t.exitStarter(this);
  }
}
class nr extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_participant;
  }
  name() {
    return this.getTypedRuleContext(cr, 0);
  }
  participantType() {
    return this.getTypedRuleContext(Ao, 0);
  }
  stereotype() {
    return this.getTypedRuleContext(Eo, 0);
  }
  width() {
    return this.getTypedRuleContext(So, 0);
  }
  label() {
    return this.getTypedRuleContext(To, 0);
  }
  COLOR() {
    return this.getToken(h.COLOR, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterParticipant(this);
  }
  exitRule(t) {
    t instanceof y && t.exitParticipant(this);
  }
}
class Eo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_stereotype;
  }
  SOPEN() {
    return this.getToken(h.SOPEN, 0);
  }
  name() {
    return this.getTypedRuleContext(cr, 0);
  }
  SCLOSE() {
    return this.getToken(h.SCLOSE, 0);
  }
  GT() {
    return this.getToken(h.GT, 0);
  }
  LT() {
    return this.getToken(h.LT, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterStereotype(this);
  }
  exitRule(t) {
    t instanceof y && t.exitStereotype(this);
  }
}
class To extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_label;
  }
  AS() {
    return this.getToken(h.AS, 0);
  }
  name() {
    return this.getTypedRuleContext(cr, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterLabel(this);
  }
  exitRule(t) {
    t instanceof y && t.exitLabel(this);
  }
}
class Ao extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_participantType;
  }
  ANNOTATION() {
    return this.getToken(h.ANNOTATION, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterParticipantType(this);
  }
  exitRule(t) {
    t instanceof y && t.exitParticipantType(this);
  }
}
class cr extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_name;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterName(this);
  }
  exitRule(t) {
    t instanceof y && t.exitName(this);
  }
}
class So extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_width;
  }
  INT() {
    return this.getToken(h.INT, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterWidth(this);
  }
  exitRule(t) {
    t instanceof y && t.exitWidth(this);
  }
}
class di extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "stat", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(Ms) : this.getTypedRuleContext(Ms, s);
    }), this.parser = t, this.ruleIndex = h.RULE_block;
  }
  enterRule(t) {
    t instanceof y && t.enterBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitBlock(this);
  }
}
class Ro extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_ret;
  }
  RETURN() {
    return this.getToken(h.RETURN, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  SCOL() {
    return this.getToken(h.SCOL, 0);
  }
  ANNOTATION_RET() {
    return this.getToken(h.ANNOTATION_RET, 0);
  }
  asyncMessage() {
    return this.getTypedRuleContext(xi, 0);
  }
  EVENT_END() {
    return this.getToken(h.EVENT_END, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterRet(this);
  }
  exitRule(t) {
    t instanceof y && t.exitRet(this);
  }
}
class Io extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_divider;
  }
  dividerNote() {
    return this.getTypedRuleContext(Oo, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterDivider(this);
  }
  exitRule(t) {
    t instanceof y && t.exitDivider(this);
  }
}
class Oo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_dividerNote;
  }
  DIVIDER() {
    return this.getToken(h.DIVIDER, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterDividerNote(this);
  }
  exitRule(t) {
    t instanceof y && t.exitDividerNote(this);
  }
}
class Ms extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_stat, this._OTHER = null;
  }
  alt() {
    return this.getTypedRuleContext(qo, 0);
  }
  par() {
    return this.getTypedRuleContext(No, 0);
  }
  opt() {
    return this.getTypedRuleContext(Po, 0);
  }
  loop() {
    return this.getTypedRuleContext(Yo, 0);
  }
  creation() {
    return this.getTypedRuleContext(pi, 0);
  }
  message() {
    return this.getTypedRuleContext(Fo, 0);
  }
  asyncMessage() {
    return this.getTypedRuleContext(xi, 0);
  }
  EVENT_END() {
    return this.getToken(h.EVENT_END, 0);
  }
  ret() {
    return this.getTypedRuleContext(Ro, 0);
  }
  divider() {
    return this.getTypedRuleContext(Io, 0);
  }
  tcf() {
    return this.getTypedRuleContext($o, 0);
  }
  OTHER() {
    return this.getToken(h.OTHER, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterStat(this);
  }
  exitRule(t) {
    t instanceof y && t.exitStat(this);
  }
}
class No extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_par;
  }
  PAR() {
    return this.getToken(h.PAR, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterPar(this);
  }
  exitRule(t) {
    t instanceof y && t.exitPar(this);
  }
}
class Po extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_opt;
  }
  OPT() {
    return this.getToken(h.OPT, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterOpt(this);
  }
  exitRule(t) {
    t instanceof y && t.exitOpt(this);
  }
}
class pi extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_creation;
  }
  creationBody() {
    return this.getTypedRuleContext(Mo, 0);
  }
  SCOL() {
    return this.getToken(h.SCOL, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterCreation(this);
  }
  exitRule(t) {
    t instanceof y && t.exitCreation(this);
  }
}
class Mo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_creationBody;
  }
  NEW() {
    return this.getToken(h.NEW, 0);
  }
  construct() {
    return this.getTypedRuleContext(Bo, 0);
  }
  assignment() {
    return this.getTypedRuleContext(Yr, 0);
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  parameters() {
    return this.getTypedRuleContext(yi, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterCreationBody(this);
  }
  exitRule(t) {
    t instanceof y && t.exitCreationBody(this);
  }
}
class Fo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_message;
  }
  messageBody() {
    return this.getTypedRuleContext(zo, 0);
  }
  SCOL() {
    return this.getToken(h.SCOL, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterMessage(this);
  }
  exitRule(t) {
    t instanceof y && t.exitMessage(this);
  }
}
class zo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_messageBody;
  }
  func() {
    return this.getTypedRuleContext(fi, 0);
  }
  assignment() {
    return this.getTypedRuleContext(Yr, 0);
  }
  to() {
    return this.getTypedRuleContext(Wr, 0);
  }
  DOT() {
    return this.getToken(h.DOT, 0);
  }
  from() {
    return this.getTypedRuleContext(gi, 0);
  }
  ARROW() {
    return this.getToken(h.ARROW, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterMessageBody(this);
  }
  exitRule(t) {
    t instanceof y && t.exitMessageBody(this);
  }
}
class fi extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "signature", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(Fs) : this.getTypedRuleContext(Fs, s);
    }), B(this, "DOT", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTokens(h.DOT) : this.getToken(h.DOT, s);
    }), this.parser = t, this.ruleIndex = h.RULE_func;
  }
  enterRule(t) {
    t instanceof y && t.enterFunc(this);
  }
  exitRule(t) {
    t instanceof y && t.exitFunc(this);
  }
}
class gi extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_from;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterFrom(this);
  }
  exitRule(t) {
    t instanceof y && t.exitFrom(this);
  }
}
class Wr extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_to;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterTo(this);
  }
  exitRule(t) {
    t instanceof y && t.exitTo(this);
  }
}
class Fs extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_signature;
  }
  methodName() {
    return this.getTypedRuleContext(Ho, 0);
  }
  invocation() {
    return this.getTypedRuleContext(mi, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterSignature(this);
  }
  exitRule(t) {
    t instanceof y && t.exitSignature(this);
  }
}
class mi extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_invocation;
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  parameters() {
    return this.getTypedRuleContext(yi, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterInvocation(this);
  }
  exitRule(t) {
    t instanceof y && t.exitInvocation(this);
  }
}
class Yr extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_assignment;
  }
  assignee() {
    return this.getTypedRuleContext(Uo, 0);
  }
  ASSIGN() {
    return this.getToken(h.ASSIGN, 0);
  }
  type() {
    return this.getTypedRuleContext(Li, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAssignment(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAssignment(this);
  }
}
class xi extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_asyncMessage;
  }
  to() {
    return this.getTypedRuleContext(Wr, 0);
  }
  COL() {
    return this.getToken(h.COL, 0);
  }
  content() {
    return this.getTypedRuleContext(Do, 0);
  }
  from() {
    return this.getTypedRuleContext(gi, 0);
  }
  ARROW() {
    return this.getToken(h.ARROW, 0);
  }
  MINUS() {
    return this.getToken(h.MINUS, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAsyncMessage(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAsyncMessage(this);
  }
}
class Do extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_content;
  }
  EVENT_PAYLOAD_LXR() {
    return this.getToken(h.EVENT_PAYLOAD_LXR, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterContent(this);
  }
  exitRule(t) {
    t instanceof y && t.exitContent(this);
  }
}
class Bo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_construct;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterConstruct(this);
  }
  exitRule(t) {
    t instanceof y && t.exitConstruct(this);
  }
}
class Li extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_type;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterType(this);
  }
  exitRule(t) {
    t instanceof y && t.exitType(this);
  }
}
class Uo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "ID", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTokens(h.ID) : this.getToken(h.ID, s);
    }), B(this, "COMMA", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTokens(h.COMMA) : this.getToken(h.COMMA, s);
    }), this.parser = t, this.ruleIndex = h.RULE_assignee;
  }
  atom() {
    return this.getTypedRuleContext(Ve, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAssignee(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAssignee(this);
  }
}
class Ho extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_methodName;
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterMethodName(this);
  }
  exitRule(t) {
    t instanceof y && t.exitMethodName(this);
  }
}
class yi extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "parameter", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(zs) : this.getTypedRuleContext(zs, s);
    }), B(this, "COMMA", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTokens(h.COMMA) : this.getToken(h.COMMA, s);
    }), this.parser = t, this.ruleIndex = h.RULE_parameters;
  }
  enterRule(t) {
    t instanceof y && t.enterParameters(this);
  }
  exitRule(t) {
    t instanceof y && t.exitParameters(this);
  }
}
class zs extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_parameter;
  }
  declaration() {
    return this.getTypedRuleContext(Go, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterParameter(this);
  }
  exitRule(t) {
    t instanceof y && t.exitParameter(this);
  }
}
class Go extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_declaration;
  }
  type() {
    return this.getTypedRuleContext(Li, 0);
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterDeclaration(this);
  }
  exitRule(t) {
    t instanceof y && t.exitDeclaration(this);
  }
}
class $o extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "catchBlock", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(Ds) : this.getTypedRuleContext(Ds, s);
    }), this.parser = t, this.ruleIndex = h.RULE_tcf;
  }
  tryBlock() {
    return this.getTypedRuleContext(jo, 0);
  }
  finallyBlock() {
    return this.getTypedRuleContext(Vo, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterTcf(this);
  }
  exitRule(t) {
    t instanceof y && t.exitTcf(this);
  }
}
class jo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_tryBlock;
  }
  TRY() {
    return this.getToken(h.TRY, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterTryBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitTryBlock(this);
  }
}
class Ds extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_catchBlock;
  }
  CATCH() {
    return this.getToken(h.CATCH, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  invocation() {
    return this.getTypedRuleContext(mi, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterCatchBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitCatchBlock(this);
  }
}
class Vo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_finallyBlock;
  }
  FINALLY() {
    return this.getToken(h.FINALLY, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterFinallyBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitFinallyBlock(this);
  }
}
class qo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "elseIfBlock", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTypedRuleContexts(Bs) : this.getTypedRuleContext(Bs, s);
    }), this.parser = t, this.ruleIndex = h.RULE_alt;
  }
  ifBlock() {
    return this.getTypedRuleContext(Zo, 0);
  }
  elseBlock() {
    return this.getTypedRuleContext(Wo, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAlt(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAlt(this);
  }
}
class Zo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_ifBlock;
  }
  IF() {
    return this.getToken(h.IF, 0);
  }
  parExpr() {
    return this.getTypedRuleContext(Kr, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterIfBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitIfBlock(this);
  }
}
class Bs extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_elseIfBlock;
  }
  ELSE() {
    return this.getToken(h.ELSE, 0);
  }
  IF() {
    return this.getToken(h.IF, 0);
  }
  parExpr() {
    return this.getTypedRuleContext(Kr, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterElseIfBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitElseIfBlock(this);
  }
}
class Wo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_elseBlock;
  }
  ELSE() {
    return this.getToken(h.ELSE, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterElseBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitElseBlock(this);
  }
}
class me extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_braceBlock;
  }
  OBRACE() {
    return this.getToken(h.OBRACE, 0);
  }
  CBRACE() {
    return this.getToken(h.CBRACE, 0);
  }
  block() {
    return this.getTypedRuleContext(di, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterBraceBlock(this);
  }
  exitRule(t) {
    t instanceof y && t.exitBraceBlock(this);
  }
}
class Yo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_loop;
  }
  WHILE() {
    return this.getToken(h.WHILE, 0);
  }
  parExpr() {
    return this.getTypedRuleContext(Kr, 0);
  }
  braceBlock() {
    return this.getTypedRuleContext(me, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterLoop(this);
  }
  exitRule(t) {
    t instanceof y && t.exitLoop(this);
  }
}
class X extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_expr;
  }
  copyFrom(t) {
    super.copyFrom(t);
  }
}
class Bc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  assignment() {
    return this.getTypedRuleContext(Yr, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAssignmentExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAssignmentExpr(this);
  }
}
h.AssignmentExprContext = Bc;
class Uc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  func() {
    return this.getTypedRuleContext(fi, 0);
  }
  to() {
    return this.getTypedRuleContext(Wr, 0);
  }
  DOT() {
    return this.getToken(h.DOT, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterFuncExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitFuncExpr(this);
  }
}
h.FuncExprContext = Uc;
class Hc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  atom() {
    return this.getTypedRuleContext(Ve, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAtomExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAtomExpr(this);
  }
}
h.AtomExprContext = Hc;
class Gc extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), super.copyFrom(n);
  }
  OR() {
    return this.getToken(h.OR, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterOrExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitOrExpr(this);
  }
}
h.OrExprContext = Gc;
class $c extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), this.op = null, super.copyFrom(n);
  }
  PLUS() {
    return this.getToken(h.PLUS, 0);
  }
  MINUS() {
    return this.getToken(h.MINUS, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAdditiveExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAdditiveExpr(this);
  }
}
h.AdditiveExprContext = $c;
class jc extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), this.op = null, super.copyFrom(n);
  }
  LTEQ() {
    return this.getToken(h.LTEQ, 0);
  }
  GTEQ() {
    return this.getToken(h.GTEQ, 0);
  }
  LT() {
    return this.getToken(h.LT, 0);
  }
  GT() {
    return this.getToken(h.GT, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterRelationalExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitRelationalExpr(this);
  }
}
h.RelationalExprContext = jc;
class Vc extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), super.copyFrom(n);
  }
  PLUS() {
    return this.getToken(h.PLUS, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterPlusExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitPlusExpr(this);
  }
}
h.PlusExprContext = Vc;
class qc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  NOT() {
    return this.getToken(h.NOT, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterNotExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitNotExpr(this);
  }
}
h.NotExprContext = qc;
class Zc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  MINUS() {
    return this.getToken(h.MINUS, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterUnaryMinusExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitUnaryMinusExpr(this);
  }
}
h.UnaryMinusExprContext = Zc;
class Wc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  creation() {
    return this.getTypedRuleContext(pi, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterCreationExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitCreationExpr(this);
  }
}
h.CreationExprContext = Wc;
class Yc extends X {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterParenthesizedExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitParenthesizedExpr(this);
  }
}
h.ParenthesizedExprContext = Yc;
class Kc extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), this.op = null, super.copyFrom(n);
  }
  MULT() {
    return this.getToken(h.MULT, 0);
  }
  DIV() {
    return this.getToken(h.DIV, 0);
  }
  MOD() {
    return this.getToken(h.MOD, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterMultiplicationExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitMultiplicationExpr(this);
  }
}
h.MultiplicationExprContext = Kc;
class Qc extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), this.op = null, super.copyFrom(n);
  }
  EQ() {
    return this.getToken(h.EQ, 0);
  }
  NEQ() {
    return this.getToken(h.NEQ, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterEqualityExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitEqualityExpr(this);
  }
}
h.EqualityExprContext = Qc;
class Xc extends X {
  constructor(t, n) {
    super(t), B(this, "expr", function(r) {
      return r === void 0 && (r = null), r === null ? this.getTypedRuleContexts(X) : this.getTypedRuleContext(X, r);
    }), super.copyFrom(n);
  }
  AND() {
    return this.getToken(h.AND, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterAndExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitAndExpr(this);
  }
}
h.AndExprContext = Xc;
class Ve extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_atom;
  }
  copyFrom(t) {
    super.copyFrom(t);
  }
}
class Jc extends Ve {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  TRUE() {
    return this.getToken(h.TRUE, 0);
  }
  FALSE() {
    return this.getToken(h.FALSE, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterBooleanAtom(this);
  }
  exitRule(t) {
    t instanceof y && t.exitBooleanAtom(this);
  }
}
h.BooleanAtomContext = Jc;
class t2 extends Ve {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  ID() {
    return this.getToken(h.ID, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterIdAtom(this);
  }
  exitRule(t) {
    t instanceof y && t.exitIdAtom(this);
  }
}
h.IdAtomContext = t2;
class e2 extends Ve {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  STRING() {
    return this.getToken(h.STRING, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterStringAtom(this);
  }
  exitRule(t) {
    t instanceof y && t.exitStringAtom(this);
  }
}
h.StringAtomContext = e2;
class n2 extends Ve {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  NIL() {
    return this.getToken(h.NIL, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterNilAtom(this);
  }
  exitRule(t) {
    t instanceof y && t.exitNilAtom(this);
  }
}
h.NilAtomContext = n2;
class r2 extends Ve {
  constructor(t, n) {
    super(t), super.copyFrom(n);
  }
  INT() {
    return this.getToken(h.INT, 0);
  }
  FLOAT() {
    return this.getToken(h.FLOAT, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterNumberAtom(this);
  }
  exitRule(t) {
    t instanceof y && t.exitNumberAtom(this);
  }
}
h.NumberAtomContext = r2;
class Kr extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_parExpr;
  }
  OPAR() {
    return this.getToken(h.OPAR, 0);
  }
  condition() {
    return this.getTypedRuleContext(Ko, 0);
  }
  CPAR() {
    return this.getToken(h.CPAR, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterParExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitParExpr(this);
  }
}
class Ko extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), this.parser = t, this.ruleIndex = h.RULE_condition;
  }
  atom() {
    return this.getTypedRuleContext(Ve, 0);
  }
  expr() {
    return this.getTypedRuleContext(X, 0);
  }
  inExpr() {
    return this.getTypedRuleContext(Qo, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterCondition(this);
  }
  exitRule(t) {
    t instanceof y && t.exitCondition(this);
  }
}
class Qo extends L.ParserRuleContext {
  constructor(t, n, r) {
    n === void 0 && (n = null), r == null && (r = -1), super(n, r), B(this, "ID", function(s) {
      return s === void 0 && (s = null), s === null ? this.getTokens(h.ID) : this.getToken(h.ID, s);
    }), this.parser = t, this.ruleIndex = h.RULE_inExpr;
  }
  IN() {
    return this.getToken(h.IN, 0);
  }
  enterRule(t) {
    t instanceof y && t.enterInExpr(this);
  }
  exitRule(t) {
    t instanceof y && t.exitInExpr(this);
  }
}
h.ProgContext = Dc;
h.TitleContext = wo;
h.HeadContext = Co;
h.GroupContext = Ps;
h.StarterExpContext = _o;
h.StarterContext = ko;
h.ParticipantContext = nr;
h.StereotypeContext = Eo;
h.LabelContext = To;
h.ParticipantTypeContext = Ao;
h.NameContext = cr;
h.WidthContext = So;
h.BlockContext = di;
h.RetContext = Ro;
h.DividerContext = Io;
h.DividerNoteContext = Oo;
h.StatContext = Ms;
h.ParContext = No;
h.OptContext = Po;
h.CreationContext = pi;
h.CreationBodyContext = Mo;
h.MessageContext = Fo;
h.MessageBodyContext = zo;
h.FuncContext = fi;
h.FromContext = gi;
h.ToContext = Wr;
h.SignatureContext = Fs;
h.InvocationContext = mi;
h.AssignmentContext = Yr;
h.AsyncMessageContext = xi;
h.ContentContext = Do;
h.ConstructContext = Bo;
h.TypeContext = Li;
h.AssigneeContext = Uo;
h.MethodNameContext = Ho;
h.ParametersContext = yi;
h.ParameterContext = zs;
h.DeclarationContext = Go;
h.TcfContext = $o;
h.TryBlockContext = jo;
h.CatchBlockContext = Ds;
h.FinallyBlockContext = Vo;
h.AltContext = qo;
h.IfBlockContext = Zo;
h.ElseIfBlockContext = Bs;
h.ElseBlockContext = Wo;
h.BraceBlockContext = me;
h.LoopContext = Yo;
h.ExprContext = X;
h.AtomContext = Ve;
h.ParExprContext = Kr;
h.ConditionContext = Ko;
h.InExprContext = Qo;
function T5() {
  this.__data__ = [], this.size = 0;
}
var A5 = T5;
function S5(e, t) {
  return e === t || e !== e && t !== t;
}
var vi = S5, R5 = vi;
function I5(e, t) {
  for (var n = e.length; n--; )
    if (R5(e[n][0], t))
      return n;
  return -1;
}
var bi = I5, O5 = bi, N5 = Array.prototype, P5 = N5.splice;
function M5(e) {
  var t = this.__data__, n = O5(t, e);
  if (n < 0)
    return !1;
  var r = t.length - 1;
  return n == r ? t.pop() : P5.call(t, n, 1), --this.size, !0;
}
var F5 = M5, z5 = bi;
function D5(e) {
  var t = this.__data__, n = z5(t, e);
  return n < 0 ? void 0 : t[n][1];
}
var B5 = D5, U5 = bi;
function H5(e) {
  return U5(this.__data__, e) > -1;
}
var G5 = H5, $5 = bi;
function j5(e, t) {
  var n = this.__data__, r = $5(n, e);
  return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
}
var V5 = j5, q5 = A5, Z5 = F5, W5 = B5, Y5 = G5, K5 = V5;
function hr(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
hr.prototype.clear = q5;
hr.prototype.delete = Z5;
hr.prototype.get = W5;
hr.prototype.has = Y5;
hr.prototype.set = K5;
var wi = hr, Q5 = wi;
function X5() {
  this.__data__ = new Q5(), this.size = 0;
}
var J5 = X5;
function td(e) {
  var t = this.__data__, n = t.delete(e);
  return this.size = t.size, n;
}
var ed = td;
function nd(e) {
  return this.__data__.get(e);
}
var rd = nd;
function sd(e) {
  return this.__data__.has(e);
}
var id = sd, od = On, ad = od.Symbol, s2 = ad, ll = s2, i2 = Object.prototype, ld = i2.hasOwnProperty, cd = i2.toString, Cr = ll ? ll.toStringTag : void 0;
function hd(e) {
  var t = ld.call(e, Cr), n = e[Cr];
  try {
    e[Cr] = void 0;
    var r = !0;
  } catch {
  }
  var s = cd.call(e);
  return r && (t ? e[Cr] = n : delete e[Cr]), s;
}
var ud = hd, dd = Object.prototype, pd = dd.toString;
function fd(e) {
  return pd.call(e);
}
var gd = fd, cl = s2, md = ud, xd = gd, Ld = "[object Null]", yd = "[object Undefined]", hl = cl ? cl.toStringTag : void 0;
function vd(e) {
  return e == null ? e === void 0 ? yd : Ld : hl && hl in Object(e) ? md(e) : xd(e);
}
var Ci = vd;
function bd(e) {
  var t = typeof e;
  return e != null && (t == "object" || t == "function");
}
var Nn = bd, wd = Ci, Cd = Nn, _d = "[object AsyncFunction]", kd = "[object Function]", Ed = "[object GeneratorFunction]", Td = "[object Proxy]";
function Ad(e) {
  if (!Cd(e))
    return !1;
  var t = wd(e);
  return t == kd || t == Ed || t == _d || t == Td;
}
var Xo = Ad, Sd = On, Rd = Sd["__core-js_shared__"], Id = Rd, qi = Id, ul = function() {
  var e = /[^.]+$/.exec(qi && qi.keys && qi.keys.IE_PROTO || "");
  return e ? "Symbol(src)_1." + e : "";
}();
function Od(e) {
  return !!ul && ul in e;
}
var Nd = Od, Pd = Function.prototype, Md = Pd.toString;
function Fd(e) {
  if (e != null) {
    try {
      return Md.call(e);
    } catch {
    }
    try {
      return e + "";
    } catch {
    }
  }
  return "";
}
var zd = Fd, Dd = Xo, Bd = Nd, Ud = Nn, Hd = zd, Gd = /[\\^$.*+?()[\]{}|]/g, $d = /^\[object .+?Constructor\]$/, jd = Function.prototype, Vd = Object.prototype, qd = jd.toString, Zd = Vd.hasOwnProperty, Wd = RegExp(
  "^" + qd.call(Zd).replace(Gd, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function Yd(e) {
  if (!Ud(e) || Bd(e))
    return !1;
  var t = Dd(e) ? Wd : $d;
  return t.test(Hd(e));
}
var Kd = Yd;
function Qd(e, t) {
  return e == null ? void 0 : e[t];
}
var Xd = Qd, Jd = Kd, t9 = Xd;
function e9(e, t) {
  var n = t9(e, t);
  return Jd(n) ? n : void 0;
}
var Jo = e9, n9 = Jo, r9 = On, s9 = n9(r9, "Map"), o2 = s9, i9 = Jo, o9 = i9(Object, "create"), _i = o9, dl = _i;
function a9() {
  this.__data__ = dl ? dl(null) : {}, this.size = 0;
}
var l9 = a9;
function c9(e) {
  var t = this.has(e) && delete this.__data__[e];
  return this.size -= t ? 1 : 0, t;
}
var h9 = c9, u9 = _i, d9 = "__lodash_hash_undefined__", p9 = Object.prototype, f9 = p9.hasOwnProperty;
function g9(e) {
  var t = this.__data__;
  if (u9) {
    var n = t[e];
    return n === d9 ? void 0 : n;
  }
  return f9.call(t, e) ? t[e] : void 0;
}
var m9 = g9, x9 = _i, L9 = Object.prototype, y9 = L9.hasOwnProperty;
function v9(e) {
  var t = this.__data__;
  return x9 ? t[e] !== void 0 : y9.call(t, e);
}
var b9 = v9, w9 = _i, C9 = "__lodash_hash_undefined__";
function _9(e, t) {
  var n = this.__data__;
  return this.size += this.has(e) ? 0 : 1, n[e] = w9 && t === void 0 ? C9 : t, this;
}
var k9 = _9, E9 = l9, T9 = h9, A9 = m9, S9 = b9, R9 = k9;
function ur(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
ur.prototype.clear = E9;
ur.prototype.delete = T9;
ur.prototype.get = A9;
ur.prototype.has = S9;
ur.prototype.set = R9;
var I9 = ur, pl = I9, O9 = wi, N9 = o2;
function P9() {
  this.size = 0, this.__data__ = {
    hash: new pl(),
    map: new (N9 || O9)(),
    string: new pl()
  };
}
var M9 = P9;
function F9(e) {
  var t = typeof e;
  return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
var z9 = F9, D9 = z9;
function B9(e, t) {
  var n = e.__data__;
  return D9(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
}
var ki = B9, U9 = ki;
function H9(e) {
  var t = U9(this, e).delete(e);
  return this.size -= t ? 1 : 0, t;
}
var G9 = H9, $9 = ki;
function j9(e) {
  return $9(this, e).get(e);
}
var V9 = j9, q9 = ki;
function Z9(e) {
  return q9(this, e).has(e);
}
var W9 = Z9, Y9 = ki;
function K9(e, t) {
  var n = Y9(this, e), r = n.size;
  return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
}
var Q9 = K9, X9 = M9, J9 = G9, t6 = V9, e6 = W9, n6 = Q9;
function dr(e) {
  var t = -1, n = e == null ? 0 : e.length;
  for (this.clear(); ++t < n; ) {
    var r = e[t];
    this.set(r[0], r[1]);
  }
}
dr.prototype.clear = X9;
dr.prototype.delete = J9;
dr.prototype.get = t6;
dr.prototype.has = e6;
dr.prototype.set = n6;
var r6 = dr, s6 = wi, i6 = o2, o6 = r6, a6 = 200;
function l6(e, t) {
  var n = this.__data__;
  if (n instanceof s6) {
    var r = n.__data__;
    if (!i6 || r.length < a6 - 1)
      return r.push([e, t]), this.size = ++n.size, this;
    n = this.__data__ = new o6(r);
  }
  return n.set(e, t), this.size = n.size, this;
}
var c6 = l6, h6 = wi, u6 = J5, d6 = ed, p6 = rd, f6 = id, g6 = c6;
function pr(e) {
  var t = this.__data__ = new h6(e);
  this.size = t.size;
}
pr.prototype.clear = u6;
pr.prototype.delete = d6;
pr.prototype.get = p6;
pr.prototype.has = f6;
pr.prototype.set = g6;
var m6 = pr, x6 = Jo, L6 = function() {
  try {
    var e = x6(Object, "defineProperty");
    return e({}, "", {}), e;
  } catch {
  }
}(), a2 = L6, fl = a2;
function y6(e, t, n) {
  t == "__proto__" && fl ? fl(e, t, {
    configurable: !0,
    enumerable: !0,
    value: n,
    writable: !0
  }) : e[t] = n;
}
var ta = y6, v6 = ta, b6 = vi;
function w6(e, t, n) {
  (n !== void 0 && !b6(e[t], n) || n === void 0 && !(t in e)) && v6(e, t, n);
}
var l2 = w6;
function C6(e) {
  return function(t, n, r) {
    for (var s = -1, i = Object(t), o = r(t), a = o.length; a--; ) {
      var l = o[e ? a : ++s];
      if (n(i[l], l, i) === !1)
        break;
    }
    return t;
  };
}
var _6 = C6, k6 = _6, E6 = k6(), T6 = E6, _1 = { exports: {} };
(function(e, t) {
  var n = On, r = t && !t.nodeType && t, s = r && !0 && e && !e.nodeType && e, i = s && s.exports === r, o = i ? n.Buffer : void 0, a = o ? o.allocUnsafe : void 0;
  function l(c, u) {
    if (u)
      return c.slice();
    var d = c.length, f = a ? a(d) : new c.constructor(d);
    return c.copy(f), f;
  }
  e.exports = l;
})(_1, _1.exports);
var A6 = On, S6 = A6.Uint8Array, R6 = S6, gl = R6;
function I6(e) {
  var t = new e.constructor(e.byteLength);
  return new gl(t).set(new gl(e)), t;
}
var O6 = I6, N6 = O6;
function P6(e, t) {
  var n = t ? N6(e.buffer) : e.buffer;
  return new e.constructor(n, e.byteOffset, e.length);
}
var M6 = P6;
function F6(e, t) {
  var n = -1, r = e.length;
  for (t || (t = Array(r)); ++n < r; )
    t[n] = e[n];
  return t;
}
var z6 = F6, D6 = Nn, ml = Object.create, B6 = function() {
  function e() {
  }
  return function(t) {
    if (!D6(t))
      return {};
    if (ml)
      return ml(t);
    e.prototype = t;
    var n = new e();
    return e.prototype = void 0, n;
  };
}(), U6 = B6;
function H6(e, t) {
  return function(n) {
    return e(t(n));
  };
}
var G6 = H6, $6 = G6, j6 = $6(Object.getPrototypeOf, Object), c2 = j6, V6 = Object.prototype;
function q6(e) {
  var t = e && e.constructor, n = typeof t == "function" && t.prototype || V6;
  return e === n;
}
var h2 = q6, Z6 = U6, W6 = c2, Y6 = h2;
function K6(e) {
  return typeof e.constructor == "function" && !Y6(e) ? Z6(W6(e)) : {};
}
var Q6 = K6;
function X6(e) {
  return e != null && typeof e == "object";
}
var Qr = X6, J6 = Ci, tp = Qr, ep = "[object Arguments]";
function np(e) {
  return tp(e) && J6(e) == ep;
}
var rp = np, xl = rp, sp = Qr, u2 = Object.prototype, ip = u2.hasOwnProperty, op = u2.propertyIsEnumerable, ap = xl(function() {
  return arguments;
}()) ? xl : function(e) {
  return sp(e) && ip.call(e, "callee") && !op.call(e, "callee");
}, d2 = ap, lp = Array.isArray, p2 = lp, cp = 9007199254740991;
function hp(e) {
  return typeof e == "number" && e > -1 && e % 1 == 0 && e <= cp;
}
var f2 = hp, up = Xo, dp = f2;
function pp(e) {
  return e != null && dp(e.length) && !up(e);
}
var ea = pp, fp = ea, gp = Qr;
function mp(e) {
  return gp(e) && fp(e);
}
var xp = mp, Us = { exports: {} };
function Lp() {
  return !1;
}
var yp = Lp;
(function(e, t) {
  var n = On, r = yp, s = t && !t.nodeType && t, i = s && !0 && e && !e.nodeType && e, o = i && i.exports === s, a = o ? n.Buffer : void 0, l = a ? a.isBuffer : void 0, c = l || r;
  e.exports = c;
})(Us, Us.exports);
var vp = Ci, bp = c2, wp = Qr, Cp = "[object Object]", _p = Function.prototype, kp = Object.prototype, g2 = _p.toString, Ep = kp.hasOwnProperty, Tp = g2.call(Object);
function Ap(e) {
  if (!wp(e) || vp(e) != Cp)
    return !1;
  var t = bp(e);
  if (t === null)
    return !0;
  var n = Ep.call(t, "constructor") && t.constructor;
  return typeof n == "function" && n instanceof n && g2.call(n) == Tp;
}
var Sp = Ap, Rp = Ci, Ip = f2, Op = Qr, Np = "[object Arguments]", Pp = "[object Array]", Mp = "[object Boolean]", Fp = "[object Date]", zp = "[object Error]", Dp = "[object Function]", Bp = "[object Map]", Up = "[object Number]", Hp = "[object Object]", Gp = "[object RegExp]", $p = "[object Set]", jp = "[object String]", Vp = "[object WeakMap]", qp = "[object ArrayBuffer]", Zp = "[object DataView]", Wp = "[object Float32Array]", Yp = "[object Float64Array]", Kp = "[object Int8Array]", Qp = "[object Int16Array]", Xp = "[object Int32Array]", Jp = "[object Uint8Array]", t8 = "[object Uint8ClampedArray]", e8 = "[object Uint16Array]", n8 = "[object Uint32Array]", kt = {};
kt[Wp] = kt[Yp] = kt[Kp] = kt[Qp] = kt[Xp] = kt[Jp] = kt[t8] = kt[e8] = kt[n8] = !0;
kt[Np] = kt[Pp] = kt[qp] = kt[Mp] = kt[Zp] = kt[Fp] = kt[zp] = kt[Dp] = kt[Bp] = kt[Up] = kt[Hp] = kt[Gp] = kt[$p] = kt[jp] = kt[Vp] = !1;
function r8(e) {
  return Op(e) && Ip(e.length) && !!kt[Rp(e)];
}
var s8 = r8;
function i8(e) {
  return function(t) {
    return e(t);
  };
}
var o8 = i8, k1 = { exports: {} };
(function(e, t) {
  var n = bc, r = t && !t.nodeType && t, s = r && !0 && e && !e.nodeType && e, i = s && s.exports === r, o = i && n.process, a = function() {
    try {
      var l = s && s.require && s.require("util").types;
      return l || o && o.binding && o.binding("util");
    } catch {
    }
  }();
  e.exports = a;
})(k1, k1.exports);
var a8 = s8, l8 = o8, Ll = k1.exports, yl = Ll && Ll.isTypedArray, c8 = yl ? l8(yl) : a8, m2 = c8;
function h8(e, t) {
  if (!(t === "constructor" && typeof e[t] == "function") && t != "__proto__")
    return e[t];
}
var x2 = h8, u8 = ta, d8 = vi, p8 = Object.prototype, f8 = p8.hasOwnProperty;
function g8(e, t, n) {
  var r = e[t];
  (!(f8.call(e, t) && d8(r, n)) || n === void 0 && !(t in e)) && u8(e, t, n);
}
var m8 = g8, x8 = m8, L8 = ta;
function y8(e, t, n, r) {
  var s = !n;
  n || (n = {});
  for (var i = -1, o = t.length; ++i < o; ) {
    var a = t[i], l = r ? r(n[a], e[a], a, n, e) : void 0;
    l === void 0 && (l = e[a]), s ? L8(n, a, l) : x8(n, a, l);
  }
  return n;
}
var v8 = y8;
function b8(e, t) {
  for (var n = -1, r = Array(e); ++n < e; )
    r[n] = t(n);
  return r;
}
var w8 = b8, C8 = 9007199254740991, _8 = /^(?:0|[1-9]\d*)$/;
function k8(e, t) {
  var n = typeof e;
  return t = t ?? C8, !!t && (n == "number" || n != "symbol" && _8.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
var L2 = k8, E8 = w8, T8 = d2, A8 = p2, S8 = Us.exports, R8 = L2, I8 = m2, O8 = Object.prototype, N8 = O8.hasOwnProperty;
function P8(e, t) {
  var n = A8(e), r = !n && T8(e), s = !n && !r && S8(e), i = !n && !r && !s && I8(e), o = n || r || s || i, a = o ? E8(e.length, String) : [], l = a.length;
  for (var c in e)
    (t || N8.call(e, c)) && !(o && (c == "length" || s && (c == "offset" || c == "parent") || i && (c == "buffer" || c == "byteLength" || c == "byteOffset") || R8(c, l))) && a.push(c);
  return a;
}
var M8 = P8;
function F8(e) {
  var t = [];
  if (e != null)
    for (var n in Object(e))
      t.push(n);
  return t;
}
var z8 = F8, D8 = Nn, B8 = h2, U8 = z8, H8 = Object.prototype, G8 = H8.hasOwnProperty;
function $8(e) {
  if (!D8(e))
    return U8(e);
  var t = B8(e), n = [];
  for (var r in e)
    r == "constructor" && (t || !G8.call(e, r)) || n.push(r);
  return n;
}
var j8 = $8, V8 = M8, q8 = j8, Z8 = ea;
function W8(e) {
  return Z8(e) ? V8(e, !0) : q8(e);
}
var y2 = W8, Y8 = v8, K8 = y2;
function Q8(e) {
  return Y8(e, K8(e));
}
var X8 = Q8, vl = l2, J8 = _1.exports, t7 = M6, e7 = z6, n7 = Q6, bl = d2, wl = p2, r7 = xp, s7 = Us.exports, i7 = Xo, o7 = Nn, a7 = Sp, l7 = m2, Cl = x2, c7 = X8;
function h7(e, t, n, r, s, i, o) {
  var a = Cl(e, n), l = Cl(t, n), c = o.get(l);
  if (c) {
    vl(e, n, c);
    return;
  }
  var u = i ? i(a, l, n + "", e, t, o) : void 0, d = u === void 0;
  if (d) {
    var f = wl(l), m = !f && s7(l), I = !f && !m && l7(l);
    u = l, f || m || I ? wl(a) ? u = a : r7(a) ? u = e7(a) : m ? (d = !1, u = J8(l, !0)) : I ? (d = !1, u = t7(l, !0)) : u = [] : a7(l) || bl(l) ? (u = a, bl(a) ? u = c7(a) : (!o7(a) || i7(a)) && (u = n7(l))) : d = !1;
  }
  d && (o.set(l, u), s(u, l, r, i, o), o.delete(l)), vl(e, n, u);
}
var u7 = h7, d7 = m6, p7 = l2, f7 = T6, g7 = u7, m7 = Nn, x7 = y2, L7 = x2;
function v2(e, t, n, r, s) {
  e !== t && f7(t, function(i, o) {
    if (s || (s = new d7()), m7(i))
      g7(e, t, o, n, v2, r, s);
    else {
      var a = r ? r(L7(e, o), i, o + "", e, t, s) : void 0;
      a === void 0 && (a = i), p7(e, o, a);
    }
  }, x7);
}
var y7 = v2;
function v7(e) {
  return e;
}
var b2 = v7;
function b7(e, t, n) {
  switch (n.length) {
    case 0:
      return e.call(t);
    case 1:
      return e.call(t, n[0]);
    case 2:
      return e.call(t, n[0], n[1]);
    case 3:
      return e.call(t, n[0], n[1], n[2]);
  }
  return e.apply(t, n);
}
var w7 = b7, C7 = w7, _l = Math.max;
function _7(e, t, n) {
  return t = _l(t === void 0 ? e.length - 1 : t, 0), function() {
    for (var r = arguments, s = -1, i = _l(r.length - t, 0), o = Array(i); ++s < i; )
      o[s] = r[t + s];
    s = -1;
    for (var a = Array(t + 1); ++s < t; )
      a[s] = r[s];
    return a[t] = n(o), C7(e, this, a);
  };
}
var k7 = _7;
function E7(e) {
  return function() {
    return e;
  };
}
var T7 = E7, A7 = T7, kl = a2, S7 = b2, R7 = kl ? function(e, t) {
  return kl(e, "toString", {
    configurable: !0,
    enumerable: !1,
    value: A7(t),
    writable: !0
  });
} : S7, I7 = R7, O7 = 800, N7 = 16, P7 = Date.now;
function M7(e) {
  var t = 0, n = 0;
  return function() {
    var r = P7(), s = N7 - (r - n);
    if (n = r, s > 0) {
      if (++t >= O7)
        return arguments[0];
    } else
      t = 0;
    return e.apply(void 0, arguments);
  };
}
var F7 = M7, z7 = I7, D7 = F7, B7 = D7(z7), U7 = B7, H7 = b2, G7 = k7, $7 = U7;
function j7(e, t) {
  return $7(G7(e, t, H7), e + "");
}
var V7 = j7, q7 = vi, Z7 = ea, W7 = L2, Y7 = Nn;
function K7(e, t, n) {
  if (!Y7(n))
    return !1;
  var r = typeof t;
  return (r == "number" ? Z7(n) && W7(t, n.length) : r == "string" && t in n) ? q7(n[t], e) : !1;
}
var Q7 = K7, X7 = V7, J7 = Q7;
function tf(e) {
  return X7(function(t, n) {
    var r = -1, s = n.length, i = s > 1 ? n[s - 1] : void 0, o = s > 2 ? n[2] : void 0;
    for (i = e.length > 3 && typeof i == "function" ? (s--, i) : void 0, o && J7(n[0], n[1], o) && (i = s < 3 ? void 0 : i, s = 1), t = Object(t); ++r < s; ) {
      var a = n[r];
      a && e(t, a, r, i);
    }
    return t;
  });
}
var ef = tf, nf = y7, rf = ef, sf = rf(function(e, t, n, r) {
  nf(e, t, n, r);
}), of = sf;
class af {
  constructor(t, n, r, s, i, o, a, l, c, u) {
    B(this, "name"), B(this, "stereotype"), B(this, "width"), B(this, "groupId"), B(this, "explicit"), B(this, "isStarter"), B(this, "label"), B(this, "type"), B(this, "color"), B(this, "comment"), this.name = t, this.stereotype = r, this.width = s, this.groupId = i, this.explicit = a, this.isStarter = n, this.label = o, this.type = l, this.color = c, this.comment = u;
  }
  Type() {
    var t;
    switch ((t = this.type) == null ? void 0 : t.toLowerCase()) {
      case "@actor":
        return 1;
      case "@boundary":
        return 2;
      case "@collection":
        return 3;
      case "@control":
        return 4;
      case "@database":
        return 5;
      case "@entity":
        return 6;
      case "@queue":
        return 7;
      case "@ec2":
        return 8;
      case "@ecs":
        return 9;
      case "@iam":
        return 10;
      case "@lambda":
        return 11;
      case "@rds":
        return 12;
      case "@s3":
        return 13;
    }
    return 14;
  }
}
class lf {
  constructor() {
    B(this, "participants", /* @__PURE__ */ new Map());
  }
  Add(t, n, r, s, i, o, a, l, c, u) {
    const d = new af(
      t,
      n,
      r,
      s,
      i,
      o,
      a,
      l,
      c,
      u
    );
    this.participants.set(
      t,
      of({}, this.Get(t), d, (f, m) => f || m)
    );
  }
  ImplicitArray() {
    return this.Array().filter((t) => !t.explicit && !t.isStarter);
  }
  Array() {
    return Array.from(this.participants.entries()).map((t) => t[1]);
  }
  Names() {
    return Array.from(this.participants.keys());
  }
  First() {
    return this.participants.values().next().value;
  }
  Get(t) {
    return this.participants.get(t);
  }
  Size() {
    return this.participants.size;
  }
  Starter() {
    const t = this.First();
    return t.isStarter ? t : void 0;
  }
}
const cf = h, hf = cf.ProgContext;
let Ke, Pn = !1, na;
const ce = new y();
let uf = function(e) {
  var t, n, r, s, i, o, a;
  if (Pn)
    return;
  const l = (t = e == null ? void 0 : e.participantType()) == null ? void 0 : t.getFormattedText().replace("@", ""), c = ((n = e == null ? void 0 : e.name()) == null ? void 0 : n.getFormattedText()) || "Missing `Participant`", u = (s = (r = e.stereotype()) == null ? void 0 : r.name()) == null ? void 0 : s.getFormattedText(), d = e.width && e.width() && Number.parseInt(e.width().getText()) || void 0, f = e.label && ((o = (i = e.label()) == null ? void 0 : i.name()) == null ? void 0 : o.getFormattedText()), m = !0, I = (a = e.COLOR()) == null ? void 0 : a.getText(), M = e.getComment();
  Ke.Add(
    c,
    !1,
    u,
    d,
    na,
    f,
    m,
    l,
    I,
    M
  );
};
ce.enterParticipant = uf;
let w2 = function(e) {
  if (Pn)
    return;
  let t = e.getFormattedText();
  Ke.Add(t);
};
ce.enterFrom = w2;
ce.enterTo = w2;
ce.enterStarter = function(e) {
  let t = e.getFormattedText();
  Ke.Add(t, !0);
};
ce.enterCreation = function(e) {
  if (Pn)
    return;
  const t = e.Owner();
  Ke.Add(t);
};
ce.enterParameters = function() {
  Pn = !0;
};
ce.exitParameters = function() {
  Pn = !1;
};
ce.enterCondition = function() {
  Pn = !0;
};
ce.exitCondition = function() {
  Pn = !1;
};
ce.enterGroup = function(e) {
  var t;
  na = (t = e.name()) == null ? void 0 : t.getFormattedText();
};
ce.exitGroup = function() {
  na = void 0;
};
ce.enterRet = function(e) {
  e.asyncMessage() || (Ke.Add(e.From()), Ke.Add(e.ReturnTo()));
};
const df = L.tree.ParseTreeWalker.DEFAULT;
ce.getParticipants = function(e, t) {
  return Ke = new lf(), t && e instanceof hf && Ke.Add(e.Starter(), !0), df.walk(this, e), Ke;
};
const pf = L.tree.ParseTreeWalker.DEFAULT;
var be = new y(), Kt = 0, ve = 0;
be.enterTcf = function() {
  Kt++;
};
be.enterOpt = function() {
  Kt++;
};
be.enterPar = function() {
  Kt++;
};
be.enterAlt = function() {
  Kt++;
};
be.enterLoop = function() {
  Kt++;
};
be.exitTcf = function() {
  ve = Math.max(ve, Kt), Kt--;
};
be.exitOpt = function() {
  ve = Math.max(ve, Kt), Kt--;
};
be.exitPar = function() {
  ve = Math.max(ve, Kt), Kt--;
};
be.exitAlt = function() {
  ve = Math.max(ve, Kt), Kt--;
};
be.exitLoop = function() {
  ve = Math.max(ve, Kt), Kt--;
};
be.depth = function(e) {
  return function(t) {
    return Kt = 0, ve = 0, t.children.map(function(n) {
      pf.walk(e, n);
    }), ve;
  };
};
const ff = h, gf = ff.TitleContext;
gf.prototype.content = function() {
  return this.children.length < 2 ? "Untiled" : this.children[1].getText().trim();
};
const C2 = h, E1 = C2.CreationContext;
E1.prototype.Body = E1.prototype.creationBody;
E1.prototype.isCurrent = function(e) {
  return _2.bind(this)(e);
};
const T1 = C2.MessageContext;
T1.prototype.Body = T1.prototype.messageBody;
T1.prototype.isCurrent = function(e) {
  return _2.bind(this)(e);
};
function _2(e) {
  try {
    if (e == null)
      return !1;
    const t = this.start.start, n = this.Body().stop.stop + 1;
    return e >= t && e <= n;
  } catch {
    return !1;
  }
}
const ra = h, Ei = ra.CreationContext, sa = ra.MessageContext, k2 = ra.AsyncMessageContext;
Ei.prototype.Assignee = function() {
  var e, t, n;
  return (n = (t = (e = this.creationBody()) == null ? void 0 : e.assignment()) == null ? void 0 : t.assignee()) == null ? void 0 : n.getFormattedText();
};
Ei.prototype.Constructor = function() {
  var e, t;
  return (t = (e = this.creationBody()) == null ? void 0 : e.construct()) == null ? void 0 : t.getFormattedText();
};
Ei.prototype.Owner = function() {
  if (!this.Constructor())
    return "Missing Constructor";
  const e = this.Assignee(), t = this.Constructor();
  return e ? `${e}:${t}` : t;
};
sa.prototype.To = function() {
  var e, t;
  return (t = (e = this.messageBody()) == null ? void 0 : e.to()) == null ? void 0 : t.getFormattedText();
};
sa.prototype.Owner = function() {
  return this.To() || E2(this.parentCtx);
};
function E2(e) {
  for (; e; ) {
    if (e instanceof Ei || e instanceof sa)
      return e.Owner();
    e = e.parentCtx;
  }
}
k2.prototype.To = function() {
  var e;
  return (e = this.to()) == null ? void 0 : e.getFormattedText();
};
k2.prototype.Owner = function() {
  return this.To() || E2(this.parentCtx);
};
const mf = h.ProgContext;
mf.prototype.Starter = function() {
  var e, t, n, r, s, i, o, a, l, c, u, d;
  const f = (n = (t = (e = this.head()) == null ? void 0 : e.starterExp()) == null ? void 0 : t.starter()) == null ? void 0 : n.getFormattedText();
  let m, I, M;
  const tt = (r = this.block()) == null ? void 0 : r.stat();
  if (tt && tt[0]) {
    const G = (o = (i = (s = tt[0].message()) == null ? void 0 : s.messageBody()) == null ? void 0 : i.from()) == null ? void 0 : o.getFormattedText(), J = (l = (a = tt[0].asyncMessage()) == null ? void 0 : a.from()) == null ? void 0 : l.getFormattedText();
    m = G || J;
  } else {
    const G = (c = this.head()) == null ? void 0 : c.children;
    if (G && G[0]) {
      const J = G[0];
      if (J instanceof h.ParticipantContext && (I = (u = J.name()) == null ? void 0 : u.getFormattedText()), J instanceof h.GroupContext) {
        const q = J.participant();
        q && q[0] && (M = (d = q[0].name()) == null ? void 0 : d.getFormattedText());
      }
    }
  }
  return f || m || I || M || "_STARTER_";
};
const Ti = h, xf = Ti.RetContext, El = Ti.ProgContext, Tl = Ti.MessageContext, Lf = Ti.CreationContext;
xf.prototype.ReturnTo = function() {
  var e, t;
  const n = this.parentCtx.parentCtx.parentCtx;
  if (n instanceof El)
    return n.Starter();
  {
    let r = n;
    for (; r && !(r instanceof Tl) && !(r instanceof Lf); ) {
      if (r instanceof El)
        return r.Starter();
      r = r.parentCtx;
    }
    return r instanceof Tl && ((t = (e = r.messageBody()) == null ? void 0 : e.from()) == null ? void 0 : t.getFormattedText()) || r.ClosestAncestorStat().Origin();
  }
};
const yf = h.StatContext, vf = h.ProgContext, bf = h.MessageContext, wf = h.CreationContext;
yf.prototype.Origin = function() {
  let e = this.parentCtx;
  for (; e; ) {
    if (e instanceof vf)
      return e.Starter();
    if (e instanceof bf || e instanceof wf) {
      const t = e.Owner();
      if (t)
        return t;
    }
    e = e.parentCtx;
  }
};
const Cf = h, _f = Cf.DividerContext;
_f.prototype.Note = function() {
  var e;
  let t = (e = this.dividerNote()) == null ? void 0 : e.getFormattedText().trim();
  if (!t.startsWith("=="))
    throw new Error("Divider note must start with ==");
  return t == null ? void 0 : t.replace(/^=+|=+$/g, "");
};
const ia = h, kf = ia.MessageContext, Ef = ia.AsyncMessageContext, Tf = ia.CreationContext;
kf.prototype.SignatureText = function() {
  var e, t, n;
  return (n = (t = (e = this.messageBody()) == null ? void 0 : e.func()) == null ? void 0 : t.signature()) == null ? void 0 : n.map((r) => r == null ? void 0 : r.getFormattedText()).join(".");
};
Ef.prototype.SignatureText = function() {
  var e;
  return (e = this.content()) == null ? void 0 : e.getFormattedText();
};
Tf.prototype.SignatureText = function() {
  var e;
  const t = this.creationBody().parameters();
  return "«" + (((e = t == null ? void 0 : t.parameter()) == null ? void 0 : e.length) > 0 ? t.getFormattedText() : "create") + "»";
};
const Af = h, Sf = Af.MessageContext;
class Rf {
  constructor(t, n) {
    if (B(this, "assignee"), B(this, "type"), n && !t)
      throw new Error("assignee must be defined if type is defined");
    this.assignee = t || "", this.type = n || "";
  }
  getText() {
    return [this.assignee, this.type].filter(Boolean).join(":");
  }
}
Sf.prototype.Assignment = function() {
  var e, t;
  let n = this.messageBody().assignment();
  const r = (e = n == null ? void 0 : n.assignee()) == null ? void 0 : e.getFormattedText(), s = (t = n == null ? void 0 : n.type()) == null ? void 0 : t.getFormattedText();
  if (r)
    return new Rf(r, s);
};
const Xr = h, If = Xr.CreationContext, Of = Xr.StatContext, T2 = Xr.MessageContext, Nf = Xr.AsyncMessageContext, Pf = Xr.RetContext;
If.prototype.From = function() {
  if (this.parentCtx instanceof Of)
    return this.ClosestAncestorStat().Origin();
};
T2.prototype.ProvidedFrom = function() {
  var e, t;
  return (t = (e = this.messageBody()) == null ? void 0 : e.from()) == null ? void 0 : t.getFormattedText();
};
T2.prototype.From = function() {
  return this.ProvidedFrom() || this.ClosestAncestorStat().Origin();
};
Nf.prototype.From = function() {
  return this.from() ? this.from().getFormattedText() : this.ClosestAncestorStat().Origin();
};
Pf.prototype.From = function() {
  return this.ClosestAncestorStat().Origin();
};
L.ParserRuleContext.prototype.Key = function() {
  return `${this.start.start}:${this.stop.stop}`;
};
const A2 = h, Al = A2.StatContext;
L.ParserRuleContext.prototype.ClosestAncestorStat = function() {
  let e = this;
  for (; !(e instanceof Al); )
    e = e.parentCtx;
  if (e instanceof Al)
    return e;
};
L.ParserRuleContext.prototype.ClosestAncestorBlock = function() {
  var e;
  const t = (e = this.ClosestAncestorStat()) == null ? void 0 : e.parentCtx;
  if (t instanceof A2.BlockContext)
    return t;
  console.warn("Cannot find closest ancestor block for context:", this);
};
function Mf(e, t) {
  switch (e) {
    case 0:
      return function() {
        return t.apply(this, arguments);
      };
    case 1:
      return function(n) {
        return t.apply(this, arguments);
      };
    case 2:
      return function(n, r) {
        return t.apply(this, arguments);
      };
    case 3:
      return function(n, r, s) {
        return t.apply(this, arguments);
      };
    case 4:
      return function(n, r, s, i) {
        return t.apply(this, arguments);
      };
    case 5:
      return function(n, r, s, i, o) {
        return t.apply(this, arguments);
      };
    case 6:
      return function(n, r, s, i, o, a) {
        return t.apply(this, arguments);
      };
    case 7:
      return function(n, r, s, i, o, a, l) {
        return t.apply(this, arguments);
      };
    case 8:
      return function(n, r, s, i, o, a, l, c) {
        return t.apply(this, arguments);
      };
    case 9:
      return function(n, r, s, i, o, a, l, c, u) {
        return t.apply(this, arguments);
      };
    case 10:
      return function(n, r, s, i, o, a, l, c, u, d) {
        return t.apply(this, arguments);
      };
    default:
      throw new Error("First argument to _arity must be a non-negative integer no greater than ten");
  }
}
var S2 = Mf;
function Ff(e, t) {
  return function() {
    return t.call(this, e.apply(this, arguments));
  };
}
var zf = Ff;
function Df(e) {
  return e != null && typeof e == "object" && e["@@functional/placeholder"] === !0;
}
var oa = Df, Bf = oa;
function Uf(e) {
  return function t(n) {
    return arguments.length === 0 || Bf(n) ? t : e.apply(this, arguments);
  };
}
var Ai = Uf, Zi = Ai, _r = oa;
function Hf(e) {
  return function t(n, r) {
    switch (arguments.length) {
      case 0:
        return t;
      case 1:
        return _r(n) ? t : Zi(function(s) {
          return e(n, s);
        });
      default:
        return _r(n) && _r(r) ? t : _r(n) ? Zi(function(s) {
          return e(s, r);
        }) : _r(r) ? Zi(function(s) {
          return e(n, s);
        }) : e(n, r);
    }
  };
}
var R2 = Hf, gs = Ai, Gn = R2, jt = oa;
function Gf(e) {
  return function t(n, r, s) {
    switch (arguments.length) {
      case 0:
        return t;
      case 1:
        return jt(n) ? t : Gn(function(i, o) {
          return e(n, i, o);
        });
      case 2:
        return jt(n) && jt(r) ? t : jt(n) ? Gn(function(i, o) {
          return e(i, r, o);
        }) : jt(r) ? Gn(function(i, o) {
          return e(n, i, o);
        }) : gs(function(i) {
          return e(n, r, i);
        });
      default:
        return jt(n) && jt(r) && jt(s) ? t : jt(n) && jt(r) ? Gn(function(i, o) {
          return e(i, o, s);
        }) : jt(n) && jt(s) ? Gn(function(i, o) {
          return e(i, r, o);
        }) : jt(r) && jt(s) ? Gn(function(i, o) {
          return e(n, i, o);
        }) : jt(n) ? gs(function(i) {
          return e(i, r, s);
        }) : jt(r) ? gs(function(i) {
          return e(n, i, s);
        }) : jt(s) ? gs(function(i) {
          return e(n, r, i);
        }) : e(n, r, s);
    }
  };
}
var aa = Gf, I2 = Array.isArray || function(e) {
  return e != null && e.length >= 0 && Object.prototype.toString.call(e) === "[object Array]";
};
function $f(e) {
  return Object.prototype.toString.call(e) === "[object String]";
}
var jf = $f, Vf = Ai, qf = I2, Zf = jf, Wf = /* @__PURE__ */ Vf(function(e) {
  return qf(e) ? !0 : !e || typeof e != "object" || Zf(e) ? !1 : e.length === 0 ? !0 : e.length > 0 ? e.hasOwnProperty(0) && e.hasOwnProperty(e.length - 1) : !1;
}), Yf = Wf, Kf = /* @__PURE__ */ function() {
  function e(t) {
    this.f = t;
  }
  return e.prototype["@@transducer/init"] = function() {
    throw new Error("init not implemented on XWrap");
  }, e.prototype["@@transducer/result"] = function(t) {
    return t;
  }, e.prototype["@@transducer/step"] = function(t, n) {
    return this.f(t, n);
  }, e;
}();
function Qf(e) {
  return new Kf(e);
}
var Xf = Qf, Jf = S2, tg = R2, eg = /* @__PURE__ */ tg(function(e, t) {
  return Jf(e.length, function() {
    return e.apply(t, arguments);
  });
}), ng = eg, rg = Yf, sg = Xf, ig = ng;
function og(e, t, n) {
  for (var r = 0, s = n.length; r < s; ) {
    if (t = e["@@transducer/step"](t, n[r]), t && t["@@transducer/reduced"]) {
      t = t["@@transducer/value"];
      break;
    }
    r += 1;
  }
  return e["@@transducer/result"](t);
}
function Sl(e, t, n) {
  for (var r = n.next(); !r.done; ) {
    if (t = e["@@transducer/step"](t, r.value), t && t["@@transducer/reduced"]) {
      t = t["@@transducer/value"];
      break;
    }
    r = n.next();
  }
  return e["@@transducer/result"](t);
}
function Rl(e, t, n, r) {
  return e["@@transducer/result"](n[r](ig(e["@@transducer/step"], e), t));
}
var Il = typeof Symbol < "u" ? Symbol.iterator : "@@iterator";
function ag(e, t, n) {
  if (typeof e == "function" && (e = sg(e)), rg(n))
    return og(e, t, n);
  if (typeof n["fantasy-land/reduce"] == "function")
    return Rl(e, t, n, "fantasy-land/reduce");
  if (n[Il] != null)
    return Sl(e, t, n[Il]());
  if (typeof n.next == "function")
    return Sl(e, t, n);
  if (typeof n.reduce == "function")
    return Rl(e, t, n, "reduce");
  throw new TypeError("reduce: list must be array or iterable");
}
var lg = ag, cg = aa, hg = lg, ug = /* @__PURE__ */ cg(hg), dg = ug, pg = I2;
function fg(e, t) {
  return function() {
    var n = arguments.length;
    if (n === 0)
      return t();
    var r = arguments[n - 1];
    return pg(r) || typeof r[e] != "function" ? t.apply(this, arguments) : r[e].apply(r, Array.prototype.slice.call(arguments, 0, n - 1));
  };
}
var O2 = fg, gg = O2, mg = aa, xg = /* @__PURE__ */ mg(
  /* @__PURE__ */ gg("slice", function(e, t, n) {
    return Array.prototype.slice.call(n, e, t);
  })
), Lg = xg, yg = O2, vg = Ai, bg = Lg, wg = /* @__PURE__ */ vg(
  /* @__PURE__ */ yg(
    "tail",
    /* @__PURE__ */ bg(1, 1 / 0)
  )
), Cg = wg, _g = S2, kg = zf, Eg = dg, Tg = Cg;
function Ag() {
  if (arguments.length === 0)
    throw new Error("pipe requires at least one argument");
  return _g(arguments[0].length, Eg(kg, arguments[0], Tg(arguments)));
}
var Sg = Ag;
const Rg = Sg;
var Ig = aa, Og = /* @__PURE__ */ Ig(function(e, t, n) {
  return n.replace(e, t);
}), Ng = Og;
const Jr = Ng, Pg = Jr(/[\n\r]/g, " "), Mg = Jr(/\s+/g, " "), Fg = Jr(/\s*([,;.()])\s*/g, "$1"), zg = Jr(/\s+$/g, ""), Dg = Jr(/^"(.*)"$/, "$1"), Bg = Rg(
  Pg,
  Mg,
  Fg,
  zg,
  Dg
);
class Ug extends L.error.ErrorListener {
  syntaxError(t, n, r, s, i) {
  }
}
function Hg(e) {
  const t = new L.InputStream(e), n = new O(t), r = new L.CommonTokenStream(n), s = new h(r);
  return s.addErrorListener(new Ug()), s._syntaxErrors ? null : s.prog();
}
L.ParserRuleContext.prototype.getFormattedText = function() {
  const e = this.parser.getTokenStream().getText(this.getSourceInterval());
  return Bg(e);
};
L.ParserRuleContext.prototype.getComment = function() {
  let e = this.start.tokenIndex, t = O.channelNames.indexOf("COMMENT_CHANNEL");
  this.constructor.name === "BraceBlockContext" && (e = this.stop.tokenIndex);
  let n = this.parser.getTokenStream().getHiddenTokensToLeft(e, t);
  return n && n.map((r) => r.text.substring(2)).join("");
};
L.ParserRuleContext.prototype.returnedValue = function() {
  return this.braceBlock().block().ret().value();
};
const Gg = h.ProgContext, $g = Hg, N2 = h.GroupContext, P2 = h.ParticipantContext, M2 = function(e) {
  const t = be;
  return t.depth(t)(e);
}, Si = function(e, t) {
  return ce.getParticipants(e, t);
};
function Hs(e, t) {
  let n = document.querySelector(".textarea-hidden-div");
  if (!n) {
    const r = document.createElement("div");
    r.className = "textarea-hidden-div ", r.style.fontSize = "13px", r.style.fontFamily = "Helvetica, Verdana, serif", r.style.display = "inline", r.style.whiteSpace = "nowrap", r.style.visibility = "hidden", r.style.position = "absolute", r.style.top = "0", r.style.left = "0", r.style.overflow = "hidden", r.style.width = "0px", r.style.paddingLeft = "20px", r.style.paddingRight = "20px", r.style.margin = "0px", r.style.border = "0px", document.body.appendChild(r), n = r;
  }
  return n.textContent = e, n.scrollWidth;
}
const jg = 100, Ol = 20, Nl = 10, Vg = 100;
var rr = /* @__PURE__ */ ((e) => (e[e.MessageContent = 0] = "MessageContent", e[e.ParticipantName = 1] = "ParticipantName", e))(rr || {});
const qg = h;
class la extends y {
  constructor() {
    super(...arguments), B(this, "explicitParticipants", []), B(this, "starter", ""), B(this, "implicitParticipants", []), B(this, "isBlind", !1);
  }
  enterCondition() {
    this.isBlind = !0;
  }
  exitCondition() {
    this.isBlind = !1;
  }
  enterParameters() {
    this.isBlind = !0;
  }
  exitParameters() {
    this.isBlind = !1;
  }
  enterStarter(t) {
    this.starter = t.getFormattedText();
  }
  enterParticipant(t) {
    var n, r, s;
    const i = ((n = t == null ? void 0 : t.name()) == null ? void 0 : n.getFormattedText()) || "Missing `Participant` name", o = (s = (r = t.label()) == null ? void 0 : r.name()) == null ? void 0 : s.getFormattedText(), a = { name: i, label: o, left: "" };
    this.explicitParticipants.push(a);
  }
  enterFrom(t) {
    if (this.isBlind)
      return;
    const n = t == null ? void 0 : t.getFormattedText();
    if (t.ClosestAncestorBlock().parentCtx instanceof qg.ProgContext && t.ClosestAncestorStat() === t.ClosestAncestorBlock().children[0]) {
      this.starter = n;
      return;
    }
    this.enterTo(t);
  }
  enterTo(t) {
    if (this.isBlind)
      return;
    const n = t == null ? void 0 : t.getFormattedText();
    if (n === this.starter || this.explicitParticipants.some((s) => s.name === n))
      return;
    const r = { name: n, left: "" };
    this.implicitParticipants.push(r);
  }
  enterCreation(t) {
    if (this.isBlind)
      return;
    const n = t == null ? void 0 : t.Owner();
    if (n === this.starter || this.explicitParticipants.some((s) => s.name === n))
      return;
    const r = { name: n, left: "" };
    this.implicitParticipants.push(r);
  }
  result() {
    let t = [...this.explicitParticipants, ...this.implicitParticipants];
    return this._isStarterExplicitlyPositioned() || t.unshift(this._getStarter()), t = this._dedup(t), la._assignLeft(t), t;
  }
  _isStarterExplicitlyPositioned() {
    return this.starter && this.explicitParticipants.find((t) => t.name === this.starter);
  }
  _getStarter() {
    return { name: this.starter || "_STARTER_", left: "" };
  }
  _dedup(t) {
    return t.filter((n, r) => t.findIndex((s) => s.name === n.name) === r);
  }
  static _assignLeft(t) {
    t.reduce(
      (n, r) => (r.left = n.name || "", r),
      { name: "", left: "" }
    );
  }
}
function Zg(e) {
  const t = new la();
  return L.tree.ParseTreeWalker.DEFAULT.walk(t, e), t.result();
}
function Ri(e, t) {
  return { position: e, velocity: t };
}
function Pl(e, t) {
  return Ri(e.position + t.position, e.velocity + t.velocity);
}
const Ml = Math.sqrt(Number.EPSILON);
function Wg(e, t) {
  let n = e.position - t.position;
  return n < -Ml || Math.abs(n) <= Ml && e.velocity < t.velocity;
}
function Yg() {
  return {
    delta: 1 / 0,
    dualLessThan: function(e, t) {
      let n = Wg(e, t);
      return n && ([e, t] = [t, e]), e.velocity < t.velocity && (this.delta = Math.min(this.delta, (e.position - t.position) / (t.velocity - e.velocity))), n;
    }
  };
}
function Kg(e, t) {
  let n = Array();
  for (let r = 0; r < e; r++) {
    n.push([]);
    for (let s = 0; s < r; s++)
      t[s][r] > 0 && n[r].push({ i: s, length: Ri(t[s][r], 0) });
  }
  return n;
}
function Qg(e, t) {
  let n = Yg(), r = Ri(0, 0), s = [];
  for (let i = 0; i < e.length; i++) {
    let o = null;
    i > 0 && (r = Pl(r, t[i - 1]));
    for (let a of e[i]) {
      let l = Pl(s[a.i].maximum, a.length);
      n.dualLessThan(r, l) && (o = a.i, r = l);
    }
    s.push({ argument: o, maximum: r });
  }
  return [n.delta, s];
}
function Xg(e, t, n) {
  let r = e.length - 1;
  for (; r > 0; ) {
    let s = e[r].argument;
    s !== null ? r = s : (r--, n[r].velocity = 0);
  }
}
function Jg(e, t) {
  for (let n = 0; n < e.length; n++)
    e[n].position += e[n].velocity * t;
}
function tm(e) {
  let t = [];
  for (let n of e)
    t.push(n.maximum.position);
  return t;
}
function em(e) {
  const t = e.length;
  let n = Kg(t, e), r = [];
  for (let s = 1; s < t; s++)
    r.push(Ri(0, 1));
  for (; ; ) {
    let [s, i] = Qg(n, r);
    if (s == 1 / 0)
      return tm(i);
    i[t - 1].maximum.velocity > 0 ? Xg(i, n, r) : Jg(r, s);
  }
}
var Mr = /* @__PURE__ */ ((e) => (e[e.SyncMessage = 0] = "SyncMessage", e[e.AsyncMessage = 1] = "AsyncMessage", e[e.CreationMessage = 2] = "CreationMessage", e))(Mr || {});
class nm extends y {
  constructor() {
    super(...arguments), B(this, "isBlind", !1), B(this, "ownableMessages", []), B(this, "enterMessage", (t) => this._addOwnedMessage(Mr.SyncMessage)(t)), B(this, "enterAsyncMessage", (t) => this._addOwnedMessage(Mr.AsyncMessage)(t)), B(this, "enterCreation", (t) => this._addOwnedMessage(Mr.CreationMessage)(t)), B(this, "_addOwnedMessage", (t) => (n) => {
      if (this.isBlind)
        return;
      let r = n.From();
      const s = n == null ? void 0 : n.Owner(), i = n == null ? void 0 : n.SignatureText();
      this.ownableMessages.push({ from: r, signature: i, type: t, to: s });
    });
  }
  enterParameters() {
    this.isBlind = !0;
  }
  exitParameters() {
    this.isBlind = !1;
  }
  result() {
    return this.ownableMessages;
  }
}
function rm(e) {
  const t = L.tree.ParseTreeWalker.DEFAULT, n = new nm();
  return t.walk(n, e), n.result();
}
class jn {
  constructor(t, n) {
    B(this, "m", []), B(this, "widthProvider"), B(this, "participantModels"), B(this, "ownableMessages"), this.participantModels = Zg(t), this.ownableMessages = rm(t), this.widthProvider = n, this.walkThrough();
  }
  getPosition(t) {
    const n = this.participantModels.findIndex((r) => r.name === t);
    if (n === -1)
      throw Error(`Participant ${t} not found`);
    return this.getParticipantGap(this.participantModels[0]) + em(this.m)[n] + Nl;
  }
  walkThrough() {
    this.withParticipantGaps(this.participantModels), this.withMessageGaps(this.ownableMessages, this.participantModels);
  }
  withMessageGaps(t, n) {
    t.forEach((r) => {
      const s = n.findIndex((l) => l.name === r.from), i = n.findIndex((l) => l.name === r.to);
      if (s === -1 || i === -1) {
        console.warn(`Participant ${r.from} or ${r.to} not found`);
        return;
      }
      let o = Math.min(s, i), a = Math.max(s, i);
      try {
        let l = this.getMessageWidth(r);
        this.m[o][a] = Math.max(
          l + Nl,
          this.m[o][a]
        );
      } catch {
        console.warn(`Could not set message gap between ${r.from} and ${r.to}`);
      }
    });
  }
  getMessageWidth(t) {
    const n = jn.half(this.widthProvider, t.to);
    let r = this.widthProvider(t.signature, rr.MessageContent);
    return t.type === Mr.CreationMessage && (r += n), r;
  }
  withParticipantGaps(t) {
    this.m = t.map((n, r) => t.map((s, i) => i - r === 1 ? this.getParticipantGap(s) : 0));
  }
  getParticipantGap(t) {
    let n = this.labelOrName(t.left);
    const r = jn.half(this.widthProvider, n), s = jn.half(this.widthProvider, t.label || t.name), i = t.left && t.left !== "_STARTER_", o = t.name && t.name !== "_STARTER_";
    return (i && r || 0) + (o && s || 0);
  }
  labelOrName(t) {
    const n = this.participantModels.findIndex((r) => r.name === t);
    return n === -1 ? "" : this.participantModels[n].label || this.participantModels[n].name;
  }
  static half(t, n) {
    if (n === "_STARTER_")
      return Ol / 2;
    const r = this.halfWithMargin(t, n);
    return Math.max(r, jg / 2);
  }
  static halfWithMargin(t, n) {
    return this._getParticipantWidth(t, n) / 2 + Ol / 2;
  }
  static _getParticipantWidth(t, n) {
    return Math.max(
      t(n || "", rr.ParticipantName),
      Vg
    );
  }
  getWidth() {
    const t = this.participantModels[this.participantModels.length - 1].name, n = this.getPosition(t) + jn.halfWithMargin(this.widthProvider, t);
    return Math.max(n, 200);
  }
}
let F2 = 0;
setTimeout(function() {
  F2 || console.warn("[vue-sequence] Store is a function and is not initiated in 1 second.");
}, 1e3);
const sm = () => (F2 = B4(), {
  state: {
    warning: void 0,
    code: "",
    theme: "naked",
    scale: 1,
    selected: [],
    cursor: null,
    showTips: !1,
    onElementClick: (e) => {
      console.log("Element clicked", e);
    }
  },
  getters: {
    rootContext: (e) => $g(e.code),
    title: (e, t) => {
      var n, r;
      return (r = (n = t.rootContext) == null ? void 0 : n.title()) == null ? void 0 : r.content();
    },
    participants: (e, t) => Si(t.rootContext, !0),
    coordinates: (e, t) => new jn(t.rootContext, Hs),
    centerOf: (e, t) => (n) => {
      if (!n)
        return console.error("[vue-sequence] centerOf: entity is undefined"), 0;
      try {
        return t.coordinates.getPosition(n) || 0;
      } catch (r) {
        return console.error(r), 0;
      }
    },
    GroupContext: () => N2,
    ParticipantContext: () => P2,
    cursor: (e) => e.cursor,
    distance: (e, t) => (n, r) => t.centerOf(n) - t.centerOf(r),
    distance2: (e, t) => (n, r) => !n || !r ? 0 : t.centerOf(r) - t.centerOf(n),
    onElementClick: (e) => e.onElementClick
  },
  mutations: {
    code: function(e, t) {
      e.code = t;
    },
    setScale: function(e, t) {
      e.scale = t;
    },
    onSelect: function(e, t) {
      e.selected.includes(t) ? e.selected = e.selected.filter((n) => n !== t) : e.selected.push(t);
    },
    cursor: function(e, t) {
      e.cursor = t;
    }
  },
  actions: {
    updateCode: function({ commit: e, getters: t }, n) {
      if (typeof n == "string")
        throw Error(
          "You are using a old version of vue-sequence. New version requires {code, cursor}."
        );
      e("code", n.code);
    }
  },
  strict: !1
}), xt = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [r, s] of t)
    n[r] = s;
  return n;
}, im = {
  name: "Privacy"
}, om = (e) => ($e("data-v-70836592"), e = e(), je(), e), am = /* @__PURE__ */ om(() => /* @__PURE__ */ b("div", {
  class: "tooltip bottom whitespace-normal",
  "data-tooltip": "We (the vendor) do not have access to your data. The diagram is generated in this browser."
}, [
  /* @__PURE__ */ b("svg", {
    class: "fill-current h-6 w-6 m-auto",
    xmlns: "http://www.w3.org/2000/svg",
    "xml:space": "preserve",
    viewBox: "0 0 214.27 214.27"
  }, [
    /* @__PURE__ */ b("path", { d: "M196.926 55.171c-.11-5.785-.215-11.25-.215-16.537a7.5 7.5 0 0 0-7.5-7.5c-32.075 0-56.496-9.218-76.852-29.01a7.498 7.498 0 0 0-10.457 0c-20.354 19.792-44.771 29.01-76.844 29.01a7.5 7.5 0 0 0-7.5 7.5c0 5.288-.104 10.755-.215 16.541-1.028 53.836-2.436 127.567 87.331 158.682a7.495 7.495 0 0 0 4.912 0c89.774-31.116 88.368-104.849 87.34-158.686zm-89.795 143.641c-76.987-27.967-75.823-89.232-74.79-143.351.062-3.248.122-6.396.164-9.482 30.04-1.268 54.062-10.371 74.626-28.285 20.566 17.914 44.592 27.018 74.634 28.285.042 3.085.102 6.231.164 9.477 1.032 54.121 2.195 115.388-74.798 143.356z" }),
    /* @__PURE__ */ b("path", { d: "m132.958 81.082-36.199 36.197-15.447-15.447a7.501 7.501 0 0 0-10.606 10.607l20.75 20.75a7.477 7.477 0 0 0 5.303 2.196 7.477 7.477 0 0 0 5.303-2.196l41.501-41.5a7.498 7.498 0 0 0 .001-10.606 7.5 7.5 0 0 0-10.606-.001z" })
  ])
], -1)), lm = [
  am
];
function cm(e, t, n, r, s, i) {
  return R(), W("div", null, lm);
}
const hm = /* @__PURE__ */ xt(im, [["render", cm], ["__scopeId", "data-v-70836592"]]), um = {
  name: "DiagramTitle",
  props: ["context"],
  computed: {
    title: function() {
      var e;
      return (e = this.context) == null ? void 0 : e.content();
    }
  }
}, dm = { class: "title text-skin-title text-base font-semibold" };
function pm(e, t, n, r, s, i) {
  return R(), W("div", dm, Ht(i.title), 1);
}
const fm = /* @__PURE__ */ xt(um, [["render", pm]]);
var ca = { exports: {} }, gm = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50]
}, z2 = { exports: {} }, mm = function(e) {
  return !e || typeof e == "string" ? !1 : e instanceof Array || Array.isArray(e) || e.length >= 0 && (e.splice instanceof Function || Object.getOwnPropertyDescriptor(e, e.length - 1) && e.constructor.name !== "String");
}, xm = mm, Lm = Array.prototype.concat, ym = Array.prototype.slice, Fl = z2.exports = function(e) {
  for (var t = [], n = 0, r = e.length; n < r; n++) {
    var s = e[n];
    xm(s) ? t = Lm.call(t, ym.call(s)) : t.push(s);
  }
  return t;
};
Fl.wrap = function(e) {
  return function() {
    return e(Fl(arguments));
  };
};
var _s = gm, ts = z2.exports, D2 = {};
for (var Wi in _s)
  _s.hasOwnProperty(Wi) && (D2[_s[Wi]] = Wi);
var ue = ca.exports = {
  to: {},
  get: {}
};
ue.get = function(e) {
  var t = e.substring(0, 3).toLowerCase(), n, r;
  switch (t) {
    case "hsl":
      n = ue.get.hsl(e), r = "hsl";
      break;
    case "hwb":
      n = ue.get.hwb(e), r = "hwb";
      break;
    default:
      n = ue.get.rgb(e), r = "rgb";
      break;
  }
  return n ? { model: r, value: n } : null;
};
ue.get.rgb = function(e) {
  if (!e)
    return null;
  var t = /^#([a-f0-9]{3,4})$/i, n = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i, r = /^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/, s = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/, i = /(\D+)/, o = [0, 0, 0, 1], a, l, c;
  if (a = e.match(n)) {
    for (c = a[2], a = a[1], l = 0; l < 3; l++) {
      var u = l * 2;
      o[l] = parseInt(a.slice(u, u + 2), 16);
    }
    c && (o[3] = parseInt(c, 16) / 255);
  } else if (a = e.match(t)) {
    for (a = a[1], c = a[3], l = 0; l < 3; l++)
      o[l] = parseInt(a[l] + a[l], 16);
    c && (o[3] = parseInt(c + c, 16) / 255);
  } else if (a = e.match(r)) {
    for (l = 0; l < 3; l++)
      o[l] = parseInt(a[l + 1], 0);
    a[4] && (o[3] = parseFloat(a[4]));
  } else if (a = e.match(s)) {
    for (l = 0; l < 3; l++)
      o[l] = Math.round(parseFloat(a[l + 1]) * 2.55);
    a[4] && (o[3] = parseFloat(a[4]));
  } else
    return (a = e.match(i)) ? a[1] === "transparent" ? [0, 0, 0, 0] : (o = _s[a[1]], o ? (o[3] = 1, o) : null) : null;
  for (l = 0; l < 3; l++)
    o[l] = dn(o[l], 0, 255);
  return o[3] = dn(o[3], 0, 1), o;
};
ue.get.hsl = function(e) {
  if (!e)
    return null;
  var t = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/, n = e.match(t);
  if (n) {
    var r = parseFloat(n[4]), s = (parseFloat(n[1]) + 360) % 360, i = dn(parseFloat(n[2]), 0, 100), o = dn(parseFloat(n[3]), 0, 100), a = dn(isNaN(r) ? 1 : r, 0, 1);
    return [s, i, o, a];
  }
  return null;
};
ue.get.hwb = function(e) {
  if (!e)
    return null;
  var t = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/, n = e.match(t);
  if (n) {
    var r = parseFloat(n[4]), s = (parseFloat(n[1]) % 360 + 360) % 360, i = dn(parseFloat(n[2]), 0, 100), o = dn(parseFloat(n[3]), 0, 100), a = dn(isNaN(r) ? 1 : r, 0, 1);
    return [s, i, o, a];
  }
  return null;
};
ue.to.hex = function() {
  var e = ts(arguments);
  return "#" + ms(e[0]) + ms(e[1]) + ms(e[2]) + (e[3] < 1 ? ms(Math.round(e[3] * 255)) : "");
};
ue.to.rgb = function() {
  var e = ts(arguments);
  return e.length < 4 || e[3] === 1 ? "rgb(" + Math.round(e[0]) + ", " + Math.round(e[1]) + ", " + Math.round(e[2]) + ")" : "rgba(" + Math.round(e[0]) + ", " + Math.round(e[1]) + ", " + Math.round(e[2]) + ", " + e[3] + ")";
};
ue.to.rgb.percent = function() {
  var e = ts(arguments), t = Math.round(e[0] / 255 * 100), n = Math.round(e[1] / 255 * 100), r = Math.round(e[2] / 255 * 100);
  return e.length < 4 || e[3] === 1 ? "rgb(" + t + "%, " + n + "%, " + r + "%)" : "rgba(" + t + "%, " + n + "%, " + r + "%, " + e[3] + ")";
};
ue.to.hsl = function() {
  var e = ts(arguments);
  return e.length < 4 || e[3] === 1 ? "hsl(" + e[0] + ", " + e[1] + "%, " + e[2] + "%)" : "hsla(" + e[0] + ", " + e[1] + "%, " + e[2] + "%, " + e[3] + ")";
};
ue.to.hwb = function() {
  var e = ts(arguments), t = "";
  return e.length >= 4 && e[3] !== 1 && (t = ", " + e[3]), "hwb(" + e[0] + ", " + e[1] + "%, " + e[2] + "%" + t + ")";
};
ue.to.keyword = function(e) {
  return D2[e.slice(0, 3)];
};
function dn(e, t, n) {
  return Math.min(Math.max(t, e), n);
}
function ms(e) {
  var t = e.toString(16).toUpperCase();
  return t.length < 2 ? "0" + t : t;
}
function vm(e) {
  const t = ca.exports.get.rgb(e);
  let [n, r, s] = t;
  return (n * 299 + r * 587 + s * 114) / 1e3;
}
function bm(e) {
  const t = ca.exports.get.rgb(e);
  let [n, r, s] = t;
  return `rgb(${n}, ${r}, ${s})`;
}
const wm = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_544_54)">
    <path d="M15.5489 4.19771C15.5489 5.18773 15.1485 6.13721 14.4358 6.83726C13.7231 7.53731 12.7565 7.93058 11.7486 7.93058C10.7407 7.93058 9.77403 7.53731 9.06133 6.83726C8.34863 6.13721 7.94824 5.18773 7.94824 4.19771C7.94824 3.20768 8.34863 2.25822 9.06133 1.55818C9.77403 0.858126 10.7407 0.464844 11.7486 0.464844C12.7565 0.464844 13.7231 0.858126 14.4358 1.55818C15.1485 2.25822 15.5489 3.20768 15.5489 4.19771Z" stroke="black"/>
    <path d="M6.54883 11.2152L17.2025 11.2073M11.7471 8.06641V19.5806V8.06641ZM11.7471 19.4385L6.79789 23.5738L11.7471 19.4385ZM11.7551 19.4385L17.1864 23.3055L11.7551 19.4385Z" stroke="black"/>
  </g>
  <defs>
    <clipPath id="clip0_544_54">
      <rect width="24" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>
`, Cm = `<svg width="101" height="78" viewBox="0 0 101 78" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M96.3563 39.4479C96.3563 48.4904 92.6755 57.1625 86.1237 63.5566C79.5718 69.9506 70.6856 73.5427 61.4199 73.5427C52.1541 73.5427 43.2679 69.9506 36.7161 63.5566C30.1642 57.1625 26.4834 48.4904 26.4834 39.4479C26.4834 30.147 30.1642 21.2271 36.7161 14.6504C43.2679 8.07366 52.1541 4.37891 61.4199 4.37891C70.6856 4.37891 79.5718 8.07366 86.1237 14.6504C92.6755 21.2271 96.3563 30.147 96.3563 39.4479V39.4479Z" stroke="black" stroke-width="7.56826"/>
	<path d="M27.3611 39.4482H3.93945" stroke="black" stroke-width="8"/>
	<path d="M4.91504 4.37891V74.5168" stroke="black" stroke-width="8"/>
</svg>
`, _m = `<svg width="77" height="86" viewBox="0 0 77 86" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g clip-path="url(#clip0_544_57)">
		<path d="M74.0149 46.8888C74.0149 51.5755 73.0918 56.2163 71.2983 60.5463C69.5048 64.8762 66.876 68.8105 63.562 72.1245C60.248 75.4385 56.3137 78.0673 51.9838 79.8608C47.6538 81.6543 43.013 82.5774 38.3263 82.5774C33.6396 82.5774 28.9988 81.6543 24.6689 79.8608C20.3389 78.0673 16.4046 75.4385 13.0907 72.1245C9.77666 68.8105 7.14785 64.8762 5.35433 60.5463C3.56081 56.2163 2.6377 51.5755 2.6377 46.8888C2.6377 42.2021 3.56081 37.5613 5.35433 33.2314C7.14785 28.9014 9.77666 24.9671 13.0907 21.6532C16.4046 18.3392 20.3389 15.7104 24.6689 13.9168C28.9988 12.1233 33.6396 11.2002 38.3263 11.2002C43.013 11.2002 47.6538 12.1233 51.9838 13.9168C56.3137 15.7104 60.248 18.3392 63.562 21.6532C66.876 24.9671 69.5048 28.9014 71.2983 33.2314C73.0918 37.5613 74.0149 42.2021 74.0149 46.8888V46.8888Z" stroke="black" stroke-width="4.98203"/>
		<path d="M47.5352 2.30371L37.5352 11.5001L47.5352 20.6966" stroke="black" stroke-width="6"/>
	</g>
	<defs>
		<clipPath id="clip0_544_57">
			<rect width="77" height="86" fill="white"/>
		</clipPath>
	</defs>
</svg>
`, km = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.258 0.001L12.514 0.005L12.769 0.01L13.022 0.018L13.273 0.028L13.522 0.04L13.769 0.055L14.015 0.071L14.257 0.09L14.498 0.11L14.737 0.133L14.973 0.157L15.206 0.184L15.437 0.212L15.666 0.243L15.891 0.275L16.114 0.309L16.334 0.345L16.551 0.383L16.765 0.423L16.976 0.464L17.184 0.507L17.389 0.552L17.59 0.598L17.788 0.646L17.982 0.696L18.173 0.747L18.36 0.8L18.543 0.854L18.723 0.91L18.898 0.967L19.07 1.026L19.238 1.086L19.401 1.147L19.561 1.21L19.716 1.274L19.866 1.34L19.94 1.373L20.013 1.406L20.084 1.44L20.154 1.474L20.223 1.509L20.291 1.544L20.358 1.579L20.424 1.614L20.488 1.65L20.552 1.686L20.614 1.722L20.674 1.758L20.734 1.795L20.792 1.832L20.85 1.869L20.905 1.907L20.96 1.945L21.013 1.983L21.065 2.021L21.116 2.06L21.166 2.099L21.214 2.138L21.261 2.177L21.306 2.217L21.35 2.257L21.393 2.297L21.434 2.337L21.474 2.378L21.513 2.419L21.55 2.46L21.586 2.501L21.62 2.542L21.653 2.584L21.685 2.626L21.715 2.668L21.744 2.71L21.771 2.752L21.797 2.795L21.821 2.838L21.844 2.881L21.865 2.924L21.885 2.967L21.903 3.011L21.92 3.054L21.935 3.098L21.948 3.142L21.96 3.186L21.971 3.231L21.98 3.275L21.987 3.32L21.993 3.365L21.997 3.41L21.999 3.455L22 3.5V20.5L21.999 20.545L21.997 20.59L21.993 20.635L21.987 20.68L21.98 20.725L21.971 20.769L21.96 20.814L21.948 20.858L21.935 20.902L21.92 20.946L21.903 20.989L21.885 21.033L21.865 21.076L21.844 21.119L21.821 21.162L21.797 21.205L21.771 21.248L21.744 21.29L21.715 21.332L21.685 21.374L21.653 21.416L21.62 21.458L21.586 21.499L21.55 21.54L21.513 21.581L21.474 21.622L21.434 21.663L21.393 21.703L21.35 21.743L21.306 21.783L21.261 21.823L21.214 21.862L21.166 21.901L21.116 21.94L21.065 21.979L21.013 22.017L20.96 22.055L20.905 22.093L20.85 22.131L20.792 22.168L20.734 22.205L20.674 22.242L20.614 22.278L20.552 22.314L20.488 22.35L20.424 22.386L20.358 22.421L20.291 22.456L20.223 22.491L20.154 22.526L20.084 22.56L20.013 22.594L19.94 22.627L19.866 22.66L19.716 22.726L19.561 22.79L19.401 22.853L19.238 22.914L19.07 22.974L18.898 23.033L18.723 23.09L18.543 23.146L18.36 23.2L18.173 23.253L17.982 23.304L17.788 23.354L17.59 23.402L17.389 23.448L17.184 23.493L16.976 23.536L16.765 23.577L16.551 23.617L16.334 23.655L16.114 23.691L15.891 23.725L15.666 23.757L15.437 23.788L15.206 23.816L14.973 23.843L14.737 23.867L14.498 23.89L14.257 23.91L14.015 23.929L13.769 23.945L13.522 23.96L13.273 23.972L13.022 23.982L12.769 23.99L12.514 23.995L12.258 23.999L12 24L11.742 23.999L11.486 23.995L11.231 23.99L10.978 23.982L10.727 23.972L10.478 23.96L10.231 23.945L9.986 23.929L9.743 23.91L9.502 23.89L9.264 23.867L9.028 23.843L8.794 23.816L8.563 23.788L8.335 23.757L8.109 23.725L7.886 23.691L7.666 23.655L7.449 23.617L7.235 23.577L7.024 23.536L6.816 23.493L6.612 23.448L6.411 23.402L6.213 23.354L6.018 23.304L5.828 23.253L5.641 23.2L5.457 23.146L5.278 23.09L5.102 23.033L4.93 22.974L4.763 22.914L4.599 22.853L4.44 22.79L4.285 22.726L4.134 22.66L4.06 22.627L3.988 22.594L3.916 22.56L3.846 22.526L3.777 22.491L3.709 22.456L3.642 22.421L3.576 22.386L3.512 22.35L3.449 22.314L3.387 22.278L3.326 22.242L3.266 22.205L3.208 22.168L3.151 22.131L3.095 22.093L3.04 22.055L2.987 22.017L2.935 21.979L2.884 21.94L2.835 21.901L2.786 21.862L2.74 21.823L2.694 21.783L2.65 21.743L2.607 21.703L2.566 21.663L2.526 21.622L2.487 21.581L2.45 21.54L2.414 21.499L2.38 21.458L2.347 21.416L2.315 21.374L2.285 21.332L2.256 21.29L2.229 21.248L2.203 21.205L2.179 21.162L2.156 21.119L2.135 21.076L2.115 21.033L2.097 20.989L2.08 20.946L2.065 20.902L2.052 20.858L2.04 20.814L2.029 20.769L2.02 20.725L2.013 20.68L2.007 20.635L2.003 20.59L2.001 20.545L2 20.5V3.5L2.001 3.455L2.003 3.41L2.007 3.365L2.013 3.32L2.02 3.275L2.029 3.231L2.04 3.186L2.052 3.142L2.065 3.098L2.08 3.054L2.097 3.011L2.115 2.967L2.135 2.924L2.156 2.881L2.179 2.838L2.203 2.795L2.229 2.752L2.256 2.71L2.285 2.668L2.315 2.626L2.347 2.584L2.38 2.542L2.414 2.501L2.45 2.46L2.487 2.419L2.526 2.378L2.566 2.337L2.607 2.297L2.65 2.257L2.694 2.217L2.74 2.177L2.786 2.138L2.835 2.099L2.884 2.06L2.935 2.021L2.987 1.983L3.04 1.945L3.095 1.907L3.151 1.869L3.208 1.832L3.266 1.795L3.326 1.758L3.387 1.722L3.449 1.686L3.512 1.65L3.576 1.614L3.642 1.579L3.709 1.544L3.777 1.509L3.846 1.474L3.916 1.44L3.988 1.406L4.06 1.373L4.134 1.34L4.285 1.274L4.44 1.21L4.599 1.147L4.763 1.086L4.93 1.026L5.102 0.967L5.278 0.91L5.457 0.854L5.641 0.8L5.828 0.747L6.018 0.696L6.213 0.646L6.411 0.598L6.612 0.552L6.816 0.507L7.024 0.464L7.235 0.423L7.449 0.383L7.666 0.345L7.886 0.309L8.109 0.275L8.335 0.243L8.563 0.212L8.794 0.184L9.028 0.157L9.264 0.133L9.502 0.11L9.743 0.09L9.986 0.071L10.231 0.055L10.478 0.04L10.727 0.028L10.978 0.018L11.231 0.01L11.486 0.005L11.742 0.001L12 0L12.258 0.001V0.001ZM3 20.5V20.51L3.001 20.531L3.004 20.552L3.008 20.574L3.013 20.595L3.019 20.617L3.026 20.639L3.035 20.662L3.045 20.684L3.056 20.707L3.068 20.73L3.081 20.753L3.096 20.776L3.112 20.8L3.129 20.823L3.147 20.847L3.166 20.871L3.187 20.895L3.209 20.92L3.232 20.944L3.256 20.969L3.308 21.018L3.364 21.068L3.425 21.119L3.491 21.17L3.561 21.221L3.636 21.272L3.715 21.324L3.799 21.376L3.887 21.428L3.979 21.48L4.076 21.532L4.178 21.583L4.283 21.635L4.393 21.687L4.507 21.738L4.626 21.789L4.749 21.84L4.876 21.89L5.007 21.94L5.142 21.99L5.281 22.038L5.425 22.087L5.572 22.134L5.724 22.181L5.879 22.228L6.039 22.273L6.202 22.318L6.369 22.361L6.54 22.404L6.716 22.445L6.894 22.486L7.077 22.525L7.264 22.564L7.454 22.601L7.648 22.636L7.845 22.671L8.047 22.704L8.251 22.735L8.46 22.765L8.672 22.794L8.888 22.821L9.107 22.846L9.329 22.87L9.555 22.891L9.785 22.911L10.018 22.929L10.254 22.945L10.494 22.96L10.737 22.972L10.983 22.982L11.232 22.99L11.485 22.995L11.741 22.999L12 23L12.26 22.999L12.517 22.995L12.771 22.99L13.021 22.982L13.268 22.971L13.512 22.959L13.753 22.945L13.99 22.929L14.223 22.911L14.454 22.89L14.68 22.869L14.904 22.845L15.124 22.819L15.34 22.792L15.552 22.764L15.762 22.733L15.967 22.702L16.169 22.668L16.367 22.634L16.561 22.598L16.752 22.561L16.939 22.522L17.122 22.482L17.301 22.442L17.476 22.4L17.648 22.357L17.816 22.313L17.979 22.268L18.139 22.222L18.294 22.176L18.446 22.129L18.594 22.081L18.737 22.032L18.876 21.983L19.012 21.933L19.143 21.883L19.269 21.833L19.392 21.782L19.51 21.73L19.624 21.679L19.734 21.627L19.84 21.575L19.941 21.523L20.037 21.471L20.129 21.419L20.217 21.366L20.3 21.315L20.379 21.263L20.453 21.211L20.523 21.16L20.588 21.109L20.648 21.058L20.704 21.008L20.755 20.958L20.778 20.934L20.801 20.909L20.822 20.885L20.842 20.861L20.861 20.837L20.879 20.813L20.896 20.789L20.911 20.766L20.925 20.742L20.938 20.719L20.95 20.696L20.96 20.673L20.97 20.651L20.978 20.629L20.984 20.607L20.99 20.585L20.994 20.563L20.998 20.542L20.999 20.521L21 20.5V16.373L20.923 16.428L20.843 16.481L20.76 16.535L20.675 16.588L20.588 16.64L20.498 16.692L20.405 16.743L20.31 16.793L20.213 16.843L20.113 16.892L20.011 16.941L19.906 16.989L19.8 17.036L19.691 17.083L19.58 17.129L19.466 17.174L19.351 17.219L19.233 17.263L19.113 17.306L18.991 17.348L18.867 17.39L18.741 17.431L18.613 17.471L18.483 17.511L18.351 17.549L18.217 17.587L18.082 17.624L17.944 17.661L17.805 17.696L17.663 17.731L17.52 17.765L17.376 17.798L17.229 17.83L17.081 17.861L16.931 17.891L16.78 17.921L16.627 17.95L16.473 17.977L16.317 18.004L16.159 18.03L16 18.055L15.839 18.079L15.677 18.102L15.514 18.124L15.349 18.145L15.183 18.165L15.016 18.184L14.847 18.202L14.678 18.219L14.507 18.235L14.334 18.25L14.161 18.264L13.986 18.277L13.811 18.289L13.634 18.3L13.456 18.31L13.277 18.318L13.098 18.326L12.917 18.332L12.735 18.337L12.553 18.341L12.369 18.344L12.185 18.346H11.815L11.631 18.344L11.447 18.341L11.265 18.337L11.083 18.332L10.902 18.326L10.723 18.318L10.544 18.31L10.366 18.3L10.19 18.289L10.014 18.277L9.839 18.264L9.666 18.25L9.494 18.235L9.323 18.219L9.153 18.202L8.984 18.184L8.817 18.165L8.651 18.145L8.486 18.124L8.323 18.102L8.161 18.079L8 18.055L7.841 18.03L7.684 18.004L7.528 17.977L7.373 17.95L7.22 17.921L7.069 17.891L6.919 17.861L6.771 17.83L6.625 17.798L6.48 17.765L6.337 17.731L6.196 17.696L6.056 17.661L5.919 17.624L5.783 17.587L5.649 17.549L5.517 17.511L5.387 17.471L5.259 17.431L5.133 17.39L5.009 17.348L4.887 17.306L4.767 17.262L4.65 17.219L4.534 17.174L4.421 17.129L4.309 17.083L4.2 17.036L4.094 16.989L3.989 16.941L3.887 16.892L3.787 16.843L3.69 16.793L3.595 16.743L3.502 16.691L3.412 16.64L3.325 16.588L3.24 16.535L3.157 16.481L3.077 16.427L3 16.373V20.5V20.5ZM3 14.846V14.857L3.001 14.878L3.004 14.899L3.008 14.92L3.013 14.942L3.019 14.964L3.026 14.986L3.035 15.008L3.045 15.03L3.056 15.053L3.068 15.076L3.081 15.099L3.096 15.123L3.112 15.146L3.129 15.17L3.147 15.194L3.166 15.218L3.187 15.242L3.209 15.266L3.232 15.291L3.256 15.315L3.308 15.365L3.364 15.415L3.425 15.465L3.491 15.516L3.561 15.567L3.636 15.619L3.715 15.67L3.799 15.722L3.887 15.774L3.979 15.826L4.076 15.878L4.178 15.93L4.283 15.982L4.393 16.033L4.507 16.084L4.626 16.136L4.749 16.186L4.876 16.237L5.007 16.287L5.142 16.336L5.281 16.385L5.425 16.433L5.572 16.481L5.724 16.528L5.879 16.574L6.039 16.619L6.202 16.664L6.369 16.708L6.54 16.75L6.716 16.792L6.894 16.832L7.077 16.872L7.264 16.91L7.454 16.947L7.648 16.983L7.845 17.017L8.047 17.05L8.251 17.082L8.46 17.112L8.672 17.14L8.888 17.167L9.107 17.192L9.329 17.216L9.555 17.238L9.785 17.258L10.018 17.276L10.254 17.292L10.494 17.306L10.737 17.318L10.983 17.328L11.232 17.336L11.485 17.342L11.741 17.345L12 17.346L12.26 17.345L12.517 17.342L12.771 17.336L13.021 17.328L13.268 17.318L13.512 17.306L13.753 17.291L13.99 17.275L14.223 17.257L14.454 17.237L14.68 17.215L14.904 17.191L15.124 17.166L15.34 17.139L15.552 17.11L15.762 17.08L15.967 17.048L16.169 17.015L16.367 16.98L16.561 16.944L16.752 16.907L16.939 16.868L17.122 16.829L17.301 16.788L17.476 16.746L17.648 16.703L17.816 16.659L17.979 16.614L18.139 16.569L18.294 16.522L18.446 16.475L18.594 16.427L18.737 16.379L18.876 16.329L19.012 16.28L19.143 16.23L19.269 16.179L19.392 16.128L19.51 16.077L19.624 16.025L19.734 15.973L19.84 15.921L19.941 15.869L20.037 15.817L20.129 15.765L20.217 15.713L20.3 15.661L20.379 15.609L20.453 15.558L20.523 15.506L20.588 15.455L20.648 15.405L20.704 15.354L20.755 15.305L20.778 15.28L20.801 15.256L20.822 15.231L20.842 15.207L20.861 15.183L20.879 15.159L20.896 15.135L20.911 15.112L20.925 15.089L20.938 15.065L20.95 15.043L20.96 15.02L20.97 14.997L20.978 14.975L20.984 14.953L20.99 14.931L20.994 14.91L20.998 14.888L20.999 14.867L21 14.846V10.707L20.923 10.761L20.843 10.815L20.76 10.869L20.675 10.921L20.588 10.974L20.498 11.025L20.405 11.076L20.31 11.127L20.213 11.177L20.113 11.226L20.011 11.275L19.906 11.323L19.8 11.37L19.691 11.417L19.58 11.463L19.466 11.508L19.351 11.552L19.233 11.596L19.113 11.64L18.991 11.682L18.867 11.724L18.741 11.765L18.613 11.805L18.483 11.844L18.351 11.883L18.217 11.921L18.082 11.958L17.944 11.994L17.805 12.03L17.663 12.065L17.52 12.098L17.376 12.131L17.229 12.164L17.081 12.195L16.931 12.225L16.78 12.255L16.627 12.283L16.473 12.311L16.317 12.338L16.159 12.364L16 12.389L15.839 12.413L15.677 12.436L15.514 12.458L15.349 12.479L15.183 12.499L15.016 12.518L14.847 12.536L14.678 12.553L14.507 12.569L14.334 12.584L14.161 12.598L13.986 12.611L13.811 12.623L13.634 12.634L13.456 12.643L13.277 12.652L13.098 12.659L12.917 12.666L12.735 12.671L12.553 12.675L12.369 12.678L12.185 12.68H11.815L11.631 12.678L11.447 12.675L11.265 12.671L11.083 12.666L10.902 12.659L10.723 12.652L10.544 12.643L10.366 12.634L10.19 12.623L10.014 12.611L9.839 12.598L9.666 12.584L9.494 12.569L9.323 12.553L9.153 12.536L8.984 12.518L8.817 12.499L8.651 12.479L8.486 12.458L8.323 12.436L8.161 12.413L8 12.389L7.841 12.364L7.684 12.338L7.528 12.311L7.373 12.283L7.22 12.255L7.069 12.225L6.919 12.195L6.771 12.164L6.625 12.131L6.48 12.098L6.337 12.065L6.196 12.03L6.056 11.994L5.919 11.958L5.783 11.921L5.649 11.883L5.517 11.844L5.387 11.805L5.259 11.765L5.133 11.724L5.009 11.682L4.887 11.639L4.767 11.596L4.65 11.552L4.534 11.508L4.421 11.462L4.309 11.416L4.2 11.37L4.094 11.323L3.989 11.275L3.887 11.226L3.787 11.177L3.69 11.127L3.595 11.076L3.502 11.025L3.412 10.974L3.325 10.921L3.24 10.869L3.157 10.815L3.077 10.761L3 10.707V14.846V14.846ZM3 9.18V9.191L3.001 9.211L3.004 9.233L3.008 9.254L3.013 9.276L3.019 9.297L3.026 9.319L3.035 9.342L3.045 9.364L3.056 9.387L3.068 9.41L3.081 9.433L3.096 9.456L3.112 9.48L3.129 9.504L3.147 9.527L3.166 9.551L3.187 9.576L3.209 9.6L3.232 9.624L3.256 9.649L3.308 9.699L3.364 9.749L3.425 9.799L3.491 9.85L3.561 9.901L3.636 9.953L3.715 10.004L3.799 10.056L3.887 10.108L3.979 10.16L4.076 10.212L4.178 10.264L4.283 10.315L4.393 10.367L4.507 10.418L4.626 10.469L4.749 10.52L4.876 10.57L5.007 10.62L5.142 10.67L5.281 10.719L5.425 10.767L5.572 10.815L5.724 10.862L5.879 10.908L6.039 10.953L6.202 10.998L6.369 11.041L6.54 11.084L6.716 11.126L6.894 11.166L7.077 11.206L7.264 11.244L7.454 11.281L7.648 11.317L7.845 11.351L8.047 11.384L8.251 11.416L8.46 11.446L8.672 11.474L8.888 11.501L9.107 11.526L9.329 11.55L9.555 11.571L9.785 11.591L10.018 11.609L10.254 11.626L10.494 11.64L10.737 11.652L10.983 11.662L11.232 11.67L11.485 11.676L11.741 11.679L12 11.68L12.26 11.679L12.517 11.676L12.771 11.67L13.021 11.662L13.268 11.652L13.512 11.639L13.753 11.625L13.99 11.609L14.223 11.591L14.454 11.571L14.68 11.549L14.904 11.525L15.124 11.5L15.34 11.473L15.552 11.444L15.762 11.414L15.967 11.382L16.169 11.349L16.367 11.314L16.561 11.278L16.752 11.241L16.939 11.202L17.122 11.163L17.301 11.122L17.476 11.08L17.648 11.037L17.816 10.993L17.979 10.948L18.139 10.903L18.294 10.856L18.446 10.809L18.594 10.761L18.737 10.712L18.876 10.663L19.012 10.614L19.143 10.563L19.269 10.513L19.392 10.462L19.51 10.41L19.624 10.359L19.734 10.307L19.84 10.255L19.941 10.203L20.037 10.151L20.129 10.099L20.217 10.047L20.3 9.995L20.379 9.943L20.453 9.891L20.523 9.84L20.588 9.789L20.648 9.738L20.704 9.688L20.755 9.639L20.778 9.614L20.801 9.589L20.822 9.565L20.842 9.541L20.861 9.517L20.879 9.493L20.896 9.469L20.911 9.446L20.925 9.422L20.938 9.399L20.95 9.376L20.96 9.354L20.97 9.331L20.978 9.309L20.984 9.287L20.99 9.265L20.994 9.243L20.998 9.222L20.999 9.201L21 9.18V5.027L20.923 5.081L20.843 5.135L20.76 5.188L20.675 5.241L20.588 5.294L20.498 5.345L20.405 5.396L20.31 5.447L20.213 5.497L20.113 5.546L20.011 5.594L19.906 5.642L19.8 5.69L19.691 5.736L19.58 5.782L19.466 5.828L19.351 5.872L19.233 5.916L19.113 5.959L18.991 6.002L18.867 6.044L18.741 6.085L18.613 6.125L18.483 6.164L18.351 6.203L18.217 6.241L18.082 6.278L17.944 6.314L17.805 6.35L17.663 6.384L17.52 6.418L17.376 6.451L17.229 6.483L17.081 6.515L16.931 6.545L16.78 6.575L16.627 6.603L16.473 6.631L16.317 6.658L16.159 6.684L16 6.708L15.839 6.732L15.677 6.755L15.514 6.778L15.349 6.799L15.183 6.819L15.016 6.838L14.847 6.856L14.678 6.873L14.507 6.889L14.334 6.904L14.161 6.918L13.986 6.931L13.811 6.943L13.634 6.953L13.456 6.963L13.277 6.972L13.098 6.979L12.917 6.985L12.735 6.991L12.553 6.995L12.369 6.998L12.185 6.999L12 7L11.815 6.999L11.631 6.998L11.447 6.995L11.265 6.991L11.083 6.985L10.902 6.979L10.723 6.972L10.544 6.963L10.366 6.953L10.19 6.943L10.014 6.931L9.839 6.918L9.666 6.904L9.494 6.889L9.323 6.873L9.153 6.856L8.984 6.838L8.817 6.819L8.651 6.799L8.486 6.778L8.323 6.755L8.161 6.732L8 6.708L7.841 6.684L7.684 6.658L7.528 6.631L7.373 6.603L7.22 6.575L7.069 6.545L6.919 6.515L6.771 6.483L6.625 6.451L6.48 6.418L6.337 6.384L6.196 6.35L6.056 6.314L5.919 6.278L5.783 6.241L5.649 6.203L5.517 6.164L5.387 6.125L5.259 6.084L5.133 6.043L5.009 6.002L4.887 5.959L4.767 5.916L4.65 5.872L4.534 5.828L4.421 5.782L4.309 5.736L4.2 5.69L4.094 5.642L3.989 5.594L3.887 5.546L3.787 5.496L3.69 5.447L3.595 5.396L3.502 5.345L3.412 5.293L3.325 5.241L3.24 5.188L3.157 5.135L3.077 5.081L3 5.027V9.18V9.18ZM11.74 1.001L11.483 1.005L11.229 1.01L10.979 1.018L10.732 1.029L10.488 1.041L10.247 1.055L10.01 1.071L9.777 1.089L9.546 1.11L9.32 1.132L9.096 1.155L8.876 1.181L8.66 1.208L8.448 1.236L8.238 1.267L8.033 1.299L7.831 1.332L7.633 1.366L7.439 1.402L7.248 1.44L7.061 1.478L6.878 1.518L6.699 1.559L6.524 1.601L6.352 1.644L6.184 1.687L6.021 1.732L5.861 1.778L5.706 1.824L5.554 1.872L5.406 1.92L5.263 1.968L5.124 2.017L4.988 2.067L4.857 2.117L4.731 2.168L4.608 2.219L4.49 2.27L4.376 2.322L4.266 2.374L4.16 2.426L4.059 2.478L3.963 2.53L3.871 2.582L3.783 2.634L3.7 2.686L3.621 2.738L3.547 2.789L3.477 2.841L3.412 2.892L3.352 2.942L3.296 2.992L3.245 3.042L3.222 3.067L3.199 3.091L3.178 3.115L3.158 3.14L3.139 3.164L3.121 3.188L3.104 3.211L3.089 3.235L3.075 3.258L3.062 3.281L3.05 3.304L3.04 3.327L3.03 3.349L3.022 3.371L3.016 3.394L3.01 3.415L3.006 3.437L3.002 3.458L3.001 3.479L3 3.5L3.001 3.521L3.002 3.542L3.006 3.563L3.01 3.585L3.016 3.606L3.022 3.629L3.03 3.651L3.04 3.673L3.05 3.696L3.062 3.719L3.075 3.742L3.089 3.765L3.104 3.789L3.121 3.812L3.139 3.836L3.158 3.86L3.178 3.885L3.199 3.909L3.222 3.933L3.245 3.958L3.296 4.008L3.352 4.058L3.412 4.108L3.477 4.159L3.547 4.211L3.621 4.262L3.7 4.314L3.783 4.366L3.871 4.418L3.963 4.47L4.059 4.522L4.16 4.574L4.266 4.626L4.376 4.678L4.49 4.73L4.608 4.781L4.731 4.832L4.857 4.883L4.988 4.933L5.124 4.983L5.263 5.032L5.406 5.08L5.554 5.128L5.706 5.176L5.861 5.222L6.021 5.268L6.184 5.313L6.352 5.356L6.524 5.399L6.699 5.441L6.878 5.482L7.061 5.522L7.248 5.56L7.439 5.598L7.633 5.634L7.831 5.668L8.033 5.701L8.238 5.733L8.448 5.764L8.66 5.792L8.876 5.819L9.096 5.845L9.32 5.868L9.546 5.89L9.777 5.911L10.01 5.929L10.247 5.945L10.488 5.959L10.732 5.971L10.979 5.982L11.229 5.99L11.483 5.995L11.74 5.999L12 6L12.26 5.999L12.517 5.995L12.771 5.99L13.021 5.982L13.268 5.971L13.512 5.959L13.753 5.945L13.99 5.929L14.223 5.911L14.454 5.89L14.68 5.868L14.904 5.845L15.124 5.819L15.34 5.792L15.552 5.764L15.762 5.733L15.967 5.701L16.169 5.668L16.367 5.634L16.561 5.598L16.752 5.56L16.939 5.522L17.122 5.482L17.301 5.441L17.476 5.399L17.648 5.356L17.816 5.313L17.979 5.268L18.139 5.222L18.294 5.176L18.446 5.128L18.594 5.08L18.737 5.032L18.876 4.983L19.012 4.933L19.143 4.883L19.269 4.832L19.392 4.781L19.51 4.73L19.624 4.678L19.734 4.626L19.84 4.574L19.941 4.522L20.037 4.47L20.129 4.418L20.217 4.366L20.3 4.314L20.379 4.262L20.453 4.211L20.523 4.159L20.588 4.108L20.648 4.058L20.704 4.008L20.755 3.958L20.778 3.933L20.801 3.909L20.822 3.885L20.842 3.86L20.861 3.836L20.879 3.812L20.896 3.789L20.911 3.765L20.925 3.742L20.938 3.719L20.95 3.696L20.96 3.673L20.97 3.651L20.978 3.629L20.984 3.606L20.99 3.585L20.994 3.563L20.998 3.542L20.999 3.521L21 3.5L20.999 3.479L20.998 3.458L20.994 3.437L20.99 3.415L20.984 3.394L20.978 3.371L20.97 3.349L20.96 3.327L20.95 3.304L20.938 3.281L20.925 3.258L20.911 3.235L20.896 3.211L20.879 3.188L20.861 3.164L20.842 3.14L20.822 3.115L20.801 3.091L20.778 3.067L20.755 3.042L20.704 2.992L20.648 2.942L20.588 2.892L20.523 2.841L20.453 2.789L20.379 2.738L20.3 2.686L20.217 2.634L20.129 2.582L20.037 2.53L19.941 2.478L19.84 2.426L19.734 2.374L19.624 2.322L19.51 2.27L19.392 2.219L19.269 2.168L19.143 2.117L19.012 2.067L18.876 2.017L18.737 1.968L18.594 1.92L18.446 1.872L18.294 1.824L18.139 1.778L17.979 1.732L17.816 1.687L17.648 1.644L17.476 1.601L17.301 1.559L17.122 1.518L16.939 1.478L16.752 1.44L16.561 1.402L16.367 1.366L16.169 1.332L15.967 1.299L15.762 1.267L15.552 1.236L15.34 1.208L15.124 1.181L14.904 1.155L14.68 1.132L14.454 1.11L14.223 1.089L13.99 1.071L13.753 1.055L13.512 1.041L13.268 1.029L13.021 1.018L12.771 1.01L12.517 1.005L12.26 1.001L12 1L11.74 1.001V1.001Z" fill="black"/>
</svg>
`, Em = `<svg width="77" height="80" viewBox="0 0 77 80" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g clip-path="url(#clip0_544_61)">
		<path d="M74.0149 38.8888C74.0149 43.5755 73.0918 48.2163 71.2983 52.5463C69.5048 56.8762 66.876 60.8105 63.562 64.1245C60.248 67.4385 56.3137 70.0673 51.9838 71.8608C47.6538 73.6543 43.013 74.5774 38.3263 74.5774C33.6396 74.5774 28.9988 73.6543 24.6689 71.8608C20.3389 70.0673 16.4046 67.4385 13.0907 64.1245C9.77666 60.8105 7.14785 56.8762 5.35433 52.5463C3.56081 48.2163 2.6377 43.5755 2.6377 38.8888C2.6377 34.2021 3.56081 29.5613 5.35433 25.2314C7.14785 20.9014 9.77666 16.9671 13.0907 13.6532C16.4046 10.3392 20.3389 7.71035 24.6689 5.91683C28.9988 4.12331 33.6396 3.2002 38.3263 3.2002C43.013 3.2002 47.6538 4.12331 51.9838 5.91683C56.3137 7.71035 60.248 10.3392 63.562 13.6532C66.876 16.9671 69.5048 20.9014 71.2983 25.2314C73.0918 29.5613 74.0149 34.2021 74.0149 38.8888V38.8888Z" stroke="black" stroke-width="4.98203"/>
		<path d="M2.69922 75.4727L75.6992 75.5154" stroke="black" stroke-width="8"/>
	</g>
	<defs>
		<clipPath id="clip0_544_61">
			<rect width="77" height="80" fill="white"/>
		</clipPath>
	</defs>
</svg>
`, Tm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-CloudWatch_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#B0084D" offset="0%"></stop>
            <stop stop-color="#FF4F8B" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-CloudWatch_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Management-Governance" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M18.9074368,18.522369 L16.9527886,16.7879726 C16.8210145,16.9276688 16.6782593,17.0526083 16.5285161,17.1726289 L18.5220975,18.9453925 C18.6388972,19.048689 18.8235806,19.0408188 18.9303974,18.9227657 C19.0352176,18.8086477 19.0252348,18.627633 18.9074368,18.522369 M14.0248095,17.0831053 C15.6769763,17.0831053 17.0196739,15.7589433 17.0196739,14.1317785 C17.0196739,12.5046136 15.6769763,11.1804516 14.0248095,11.1804516 C12.3736409,11.1804516 11.0299451,12.5046136 11.0299451,14.1317785 C11.0299451,15.7589433 12.3736409,17.0831053 14.0248095,17.0831053 M19.6721255,19.5818954 C19.417562,19.8593201 19.0651663,20 18.7137689,20 C18.4062961,20 18.0988234,19.8937522 17.8542428,19.6763378 L15.6510209,17.7186243 C15.1528751,17.9380063 14.6048149,18.0668809 14.0248095,18.0668809 C11.8225858,18.0668809 10.0316569,16.3019875 10.0316569,14.1317785 C10.0316569,11.9625532 11.8225858,10.196676 14.0248095,10.196676 C16.2270331,10.196676 18.017962,11.9625532 18.017962,14.1317785 C18.017962,14.8017297 17.8312821,15.4234758 17.5307974,15.9763577 L19.5762898,17.7924075 C20.1013894,18.2606847 20.1443158,19.0634456 19.6721255,19.5818954 M6.53764845,14.1317785 L9.03336879,14.1317785 L9.03336879,15.1155541 L6.53764845,15.1155541 C5.3127489,15.1155541 4,13.9596177 4,12.2389942 C4,10.8459679 4.75171097,9.77660381 6.03251465,9.30832662 C6.03151636,9.27389447 6.03151636,9.23847855 6.03151636,9.2040464 C6.03151636,7.60934613 7.12963331,5.95463555 8.58713399,5.3555162 C10.2832255,4.65506796 12.0871322,5.00234075 13.4008794,6.28518415 C13.7492819,6.62458674 14.0437769,7.02498342 14.2813695,7.4814553 C14.6028183,7.28273263 14.9731832,7.17451731 15.3585224,7.17451731 C16.2619732,7.17451731 17.2722408,7.81593901 17.5048419,9.21388416 C18.7596901,9.54246521 19.9726102,10.4829547 19.9726102,12.2606372 C19.9726102,12.6334882 19.9206992,12.9876474 19.815879,13.3113096 L18.8645104,13.0142094 C18.9373854,12.7859734 18.9743221,12.5331431 18.9743221,12.2606372 C18.9743221,10.6147806 17.5637409,10.2035624 16.95778,10.1032173 C16.8250077,10.0805905 16.7072097,10.0077911 16.6313398,9.89859199 C16.5544716,9.79037667 16.524523,9.65559941 16.5504785,9.52574103 C16.4736103,8.54196541 15.8596631,8.15829292 15.3585224,8.15829292 C15.0270908,8.15829292 14.7146266,8.31963213 14.5009929,8.60099195 C14.3911812,8.74560697 14.2154825,8.81545504 14.0268061,8.7928282 C13.8461159,8.76626625 13.6933778,8.6432943 13.6314839,8.47310112 C13.4128588,7.87594932 13.0993964,7.37422376 12.6990828,6.98366484 C12.2099216,6.50751744 10.8652275,5.4804557 8.97247321,6.26354109 C7.88234257,6.71115899 7.0298045,8.00285638 7.0298045,9.2040464 C7.0298045,9.33882366 7.03679251,9.47163337 7.05376341,9.60050798 C7.07273089,9.74118789 7.02880621,9.8818678 6.93396884,9.98811557 C6.86009551,10.0707527 6.7602667,10.1258442 6.65245158,10.1465034 C6.02353005,10.3088264 4.99828814,10.7957953 4.99828814,12.2389942 C4.99828814,13.3545957 5.80989639,14.1317785 6.53764845,14.1317785" id="Amazon-CloudWatch_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Am = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-CloudFront_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-CloudFront_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Networking-Content-Delivery" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M16,15.4980737 C16,15.2219556 15.775,14.9978597 15.5,14.9978597 C15.225,14.9978597 15,15.2219556 15,15.4980737 C15,15.7741919 15.225,15.9982877 15.5,15.9982877 C15.775,15.9982877 16,15.7741919 16,15.4980737 M17,15.4980737 C17,16.3254277 16.327,16.9987158 15.5,16.9987158 C14.673,16.9987158 14,16.3254277 14,15.4980737 C14,14.6707197 14.673,13.9974316 15.5,13.9974316 C16.327,13.9974316 17,14.6707197 17,15.4980737 M9,11.4963614 C9,11.2202433 8.775,10.9961474 8.5,10.9961474 C8.225,10.9961474 8,11.2202433 8,11.4963614 C8,11.7724796 8.225,11.9965755 8.5,11.9965755 C8.775,11.9965755 9,11.7724796 9,11.4963614 M10,11.4963614 C10,12.3237155 9.327,12.9970035 8.5,12.9970035 C7.673,12.9970035 7,12.3237155 7,11.4963614 C7,10.6690074 7.673,9.99571934 8.5,9.99571934 C9.327,9.99571934 10,10.6690074 10,11.4963614 M12,7.49464918 C12,7.77076733 12.225,7.99486321 12.5,7.99486321 C12.775,7.99486321 13,7.77076733 13,7.49464918 C13,7.21853103 12.775,6.99443515 12.5,6.99443515 C12.225,6.99443515 12,7.21853103 12,7.49464918 M11,7.49464918 C11,6.66729517 11.673,5.99400708 12.5,5.99400708 C13.327,5.99400708 14,6.66729517 14,7.49464918 C14,8.32200319 13.327,8.99529128 12.5,8.99529128 C11.673,8.99529128 11,8.32200319 11,7.49464918 M19,11.9965755 C19,9.73960976 17.903,7.63971125 16.101,6.33215177 C15.917,6.27312651 15.407,6.42319072 14.566,6.78434525 C14.415,6.84837265 14.287,6.90239576 14.197,6.93540989 L13.857,5.99400708 C13.935,5.96699552 14.044,5.91897498 14.173,5.86395143 C14.394,5.76991119 14.611,5.67987267 14.823,5.59983842 C13.939,5.20867105 12.979,4.99357901 12,4.99357901 C11.313,4.99357901 10.642,5.09162097 10.002,5.28470358 C9.956,5.29770915 9.915,5.32071899 9.87,5.33472499 C10.22,5.46578106 10.637,5.6348534 11.132,5.85694844 L10.724,6.76933883 C9.518,6.22810725 8.828,6.02702121 8.507,5.9519891 C6.692,7.00443943 5.429,8.82721936 5.104,10.9291187 C5.426,10.8871007 5.751,10.86209 6.097,10.8530862 L6.122,11.8535143 C5.725,11.8635185 5.363,11.9055365 5.001,11.9645618 C5.001,11.9745661 5,11.9855708 5,11.9965755 C5,14.29756 6.125,16.4174671 7.976,17.7180236 C7.775,17.0167235 7.604,16.1773644 7.604,15.3310022 C7.604,15.1749354 7.599,15.0098648 7.594,14.8427933 C7.578,14.3655891 7.562,13.8723781 7.65,13.4231859 L8.631,13.6162685 C8.564,13.9534128 8.579,14.388599 8.593,14.8097792 C8.599,14.9888558 8.604,15.1639307 8.604,15.3310022 C8.604,16.2293866 8.853,17.3548682 9.277,18.4433339 C10.504,18.9595548 11.859,19.1086186 13.154,18.8935266 C13.266,18.6874384 13.402,18.4783489 13.546,18.2662582 C13.76,17.9501229 13.981,17.6239833 14.067,17.3278566 L15.028,17.6069761 C14.938,17.9191096 14.774,18.2012303 14.601,18.4743472 C15.199,18.2352449 15.768,17.934116 16.279,17.5369461 C18.009,16.1983734 19,14.1785091 19,11.9965755 M20,11.9965755 C20,14.4906426 18.867,16.7986302 16.892,18.3272843 C16.193,18.8695163 15.416,19.2876952 14.582,19.5688155 C13.76,19.8539375 12.89,20 12,20 C10.686,20 9.381,19.6718596 8.225,19.0525946 C5.619,17.6569975 4,14.9538408 4,11.9965755 C4,11.8315048 4.004,11.6674346 4.018,11.5063657 C4.212,8.17393984 6.502,5.28270273 9.715,4.32629349 C11.729,3.71903366 14.052,3.96513896 15.91,5.01658886 C18.433,6.43019372 20,9.10433794 20,11.9965755 M11.075,8.93526559 L10.419,8.18194326 C9.903,8.63013503 9.765,8.86023349 9.534,9.24039615 C9.467,9.35144367 9.389,9.48149932 9.285,9.64056738 L10.123,10.1858007 C10.233,10.0157279 10.317,9.87766883 10.39,9.75861789 C10.594,9.42147363 10.678,9.28241413 11.075,8.93526559 M10.649,11.3663058 L10.325,12.3117103 C11.438,12.6948743 12.411,13.3071362 13.387,14.2375343 L14.076,13.5132244 C12.993,12.4797822 11.904,11.7974903 10.649,11.3663058 M13.285,9.07432509 L14.121,8.52509009 C15.083,9.99271806 15.624,11.6044077 15.73,13.3161401 L14.732,13.3781666 C14.638,11.8425096 14.15,10.3938897 13.285,9.07432509" id="Amazon-CloudFront_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Sm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Cognito_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#BD0816" offset="0%"></stop>
            <stop stop-color="#FF5252" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Cognito_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Security-Identity-Compliance" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M15.188,16.891 L13.938,15.891 L14.563,15.11 L15.387,15.769 L17.084,13.223 L17.917,13.778 L15.917,16.778 C15.838,16.894 15.715,16.973 15.578,16.995 C15.551,16.998 15.526,17 15.5,17 C15.388,17 15.278,16.962 15.188,16.891 L15.188,16.891 Z M6,12 L8,12 L8,11 L6,11 L6,12 Z M6.001,10 L9.001,10 L9.001,9 L6.001,9 L6.001,10 Z M18.001,7 L18.001,6.5 C18.001,6.224 17.777,6 17.501,6 L10.501,6 C10.224,6 10.001,6.224 10.001,6.5 L10.001,7 L5,7 L5,5.6 C5,5.281 5.198,5 5.422,5 L18.578,5 C18.803,5 19.001,5.281 19.001,5.6 L19.001,7 L18.001,7 Z M15.625,12 C17.487,12 19.001,13.571 19.001,15.5 C19.001,17.43 17.487,19 15.625,19 C13.764,19 12.25,17.43 12.25,15.5 C12.25,13.571 13.764,12 15.625,12 L15.625,12 Z M20,12 L20,5.6 C20,4.718 19.362,4 18.578,4 L5.422,4 C4.638,4 4,4.718 4,5.6 L4,14.4 C4,15.283 4.638,16 5.422,16 L11.299,16 C11.545,18.244 13.379,20 15.625,20 C18.038,20 20,17.982 20,15.5 C20,13.019 18.038,11 15.625,11 C13.379,11 11.545,12.757 11.299,15 L5.422,15 C5.198,15 5,14.72 5,14.4 L5,8 L10.001,8 L10.001,12 L11.001,12 L11.001,8 L11.001,7 L17,7 L17,8 L17,10 L18.001,10 L18.001,8 L19.001,8 L19.001,12 L20,12 Z" id="Amazon-Cognito_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Rm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-DynamoDB_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#2E27AD" offset="0%"></stop>
            <stop stop-color="#527FFF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-DynamoDB_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Database" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M14.3871979,13.0634319 L15.4218955,9.61738691 C15.468467,9.46474602 15.4391067,9.29896386 15.3439388,9.17058378 C15.2487709,9.04220369 15.0979197,8.96739955 14.9379567,8.96739955 L14.2383715,8.96739955 L15.2507958,6.94566591 L17.7798316,6.94566591 L16.9881159,9.313116 C16.9374946,9.46676775 16.9628052,9.63659338 17.0589856,9.76800607 C17.153141,9.90042962 17.3060171,9.97826636 17.4690174,9.97826636 L18.095708,9.97826636 L14.3871979,13.0634319 Z M19.9697053,9.29997473 C19.8968108,9.10083397 19.7074875,8.96739955 19.4938659,8.96739955 L18.1706274,8.96739955 L18.9623432,6.59994946 C19.0129644,6.4462977 18.9876538,6.27647207 18.8914735,6.14404852 C18.7963056,6.01263584 18.644442,5.93479909 18.4814417,5.93479909 L14.9379567,5.93479909 C14.7455961,5.93479909 14.5714591,6.04296184 14.485403,6.21379833 L12.9667666,9.24639879 C12.88881,9.40308314 12.8958969,9.58908264 12.9880275,9.73768006 C13.0811706,9.88728835 13.2441709,9.97826636 13.4193203,9.97826636 L14.2576076,9.97826636 L12.9343691,14.3816022 C12.8705863,14.595906 12.9536051,14.8253728 13.1409036,14.9486985 C13.2259472,15.0042962 13.3221275,15.0326005 13.4193203,15.0326005 C13.5347366,15.0326005 13.6491406,14.9931766 13.743296,14.9153399 L19.8178417,9.86100581 C19.980842,9.72453879 20.0425999,9.50113723 19.9697053,9.29997473 L19.9697053,9.29997473 Z M14.8346894,17.6285064 C14.8346894,18.0904726 13.2775809,18.9891332 10.4235568,18.9891332 C7.56953281,18.9891332 6.01242428,18.0904726 6.01242428,17.6285064 L6.01242428,16.562042 C7.04914673,17.1786707 8.74293255,17.495072 10.4235568,17.495072 C12.1041811,17.495072 13.797967,17.1786707 14.8346894,16.562042 L14.8346894,17.6285064 Z M14.8346894,15.1235785 C14.8346894,15.5855446 13.2775809,16.4842052 10.4235568,16.4842052 C7.56953281,16.4842052 6.01242428,15.5855446 6.01242428,15.1235785 C6.01242428,15.0275461 6.08633125,14.9133182 6.21187186,14.7950468 C7.21214704,15.316654 8.74698225,15.6239575 10.4235568,15.6239575 C10.4438053,15.6239575 11.9948393,15.5916098 11.9948393,15.5916098 L11.9948393,14.580743 C11.9745908,14.580743 10.4235568,14.6130907 10.4235568,14.6130907 C8.77128043,14.6130907 7.24656947,14.2886025 6.44574187,13.7680061 C6.17542458,13.5900935 6.0134367,13.3980288 6.01242428,13.252464 L6.01242428,12.1859995 C7.04914673,12.8026283 8.74293255,13.1200404 10.4235568,13.1200404 C10.6898244,13.1200404 11.8348763,13.0391711 12.1922621,13.0138994 L12.213523,12.5054334 L12.1203799,12.0050543 C11.7761557,12.0293151 10.6786878,12.1091736 10.4235568,12.1091736 C7.56953281,12.1091736 6.01242428,11.2095021 6.01242428,10.747536 C6.01242428,10.6474602 6.09139337,10.5281779 6.22503337,10.405863 C7.01877401,10.7566338 8.57183285,11.1508719 12.3178027,11.1963609 L12.3299518,10.1854941 C9.27951741,10.1491029 7.3437622,9.88223402 6.44574187,9.39095274 C6.17542458,9.21304018 6.0134367,9.02097549 6.01242428,8.87541066 L6.01242428,7.80995704 C7.04914673,8.4265858 8.74293255,8.74298711 10.4235568,8.74298711 C10.5015135,8.74298711 12.480803,8.70659591 12.5587596,8.70356331 L12.5152254,7.69370735 C12.4079084,7.69775082 10.5187247,7.73212029 10.4235568,7.73212029 C7.56953281,7.73212029 6.01242428,6.83345969 6.01242428,6.37149356 C6.01242428,5.90952742 7.56953281,5.01086682 10.4235568,5.01086682 C11.7447705,5.01086682 13.0001766,5.21809452 13.8668118,5.5809957 L14.25862,4.64796563 C13.2573324,4.23047763 11.8956217,4 10.4235568,4 C7.72949585,4 5.00101242,4.81374779 5,6.36947182 L5,8.88147587 C5,8.88147587 5.09213061,9.46070255 5.40092001,9.80742987 C5.08808091,10.1551681 5,10.4938084 5,10.7465251 L5,13.2625727 C5.00101242,13.510235 5.09213061,13.8438211 5.39788274,14.1875158 C5.08808091,14.5342431 5,14.8718726 5,15.1235785 L5,17.6335608 C5.00506212,19.1872631 7.7315207,20 10.4235568,20 C13.1186303,20 15.8471137,19.1862522 15.8471137,17.6305282 L15.8471137,15.1235785 L14.8346894,15.1235785 Z" id="Amazon-DynamoDB_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Im = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Elastic-Block-Store_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Elastic-Block-Store_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Storage" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M19,16.5 L20,16.5 L20,20 L16.5,20 L16.5,19 L18.293,19 L16.646,17.354 L17.354,16.646 L19,18.293 L19,16.5 Z M6.707,19 L8.5,19 L8.5,20 L5,20 L5,16.5 L6,16.5 L6,18.293 L7.646,16.646 L8.354,17.354 L6.707,19 Z M20,4 L20,7.5 L19,7.5 L19,5.707 L17.354,7.354 L16.646,6.646 L18.293,5 L16.5,5 L16.5,4 L20,4 Z M5,4 L8.5,4 L8.5,5 L6.707,5 L8.354,6.646 L7.646,7.354 L6,5.707 L6,7.5 L5,7.5 L5,4 Z M12.561,15.5 C11.004,15.5 10.17,15.156 10.092,14.996 L10.082,10.053 C10.875,10.342 11.952,10.391 12.561,10.391 C13.161,10.391 14.216,10.337 15.002,10.051 L15.011,14.946 C14.896,15.14 13.955,15.5 12.561,15.5 L12.561,15.5 Z M14.943,8.994 C14.708,9.151 13.956,9.391 12.561,9.391 C11.031,9.391 10.271,9.108 10.119,9.009 C10.322,8.809 11.216,8.5 12.561,8.5 C13.78,8.5 14.684,8.796 14.943,8.994 L14.943,8.994 Z M12.561,7.5 C11.272,7.5 9.092,7.814 9.092,8.992 L9.092,14.996 C9.092,16.392 11.747,16.5 12.561,16.5 C13.838,16.5 16,16.183 16,14.996 L16,8.992 C16,7.812 13.75,7.5 12.561,7.5 L12.561,7.5 Z" id="Amazon-Elastic-Block-Store_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Om = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-EC2_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-EC2_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M15,9 L14,9 L13,9 L12,9 L11,9 L10,9 L10,10 L10,11 L10,12 L10,13 L10,14 L11,14 L12,14 L13,14 L14,14 L15,14 L15,13 L15,12 L15,11 L15,10 L15,9 Z M16,9 L17,9 L17,10 L16,10 L16,11 L17,11 L17,12 L16,12 L16,13 L17,13 L17,14 L16,14 L16,14.308 C16,14.689 15.689,15 15.308,15 L15,15 L15,16 L14,16 L14,15 L13,15 L13,16 L12,16 L12,15 L11,15 L11,16 L10,16 L10,15 L9.692,15 C9.311,15 9,14.689 9,14.308 L9,14 L8,14 L8,13 L9,13 L9,12 L8,12 L8,11 L9,11 L9,10 L8,10 L8,9 L9,9 L9,8.692 C9,8.311 9.311,8 9.692,8 L10,8 L10,7 L11,7 L11,8 L12,8 L12,7 L13,7 L13,8 L14,8 L14,7 L15,7 L15,8 L15.308,8 C15.689,8 16,8.311 16,8.692 L16,9 Z M12,19 L5,19 L5,13 L7,13 L7,12 L4.8,12 C4.358,12 4,12.342 4,12.762 L4,19.219 C4,19.65 4.351,20 4.781,20 L12.2,20 C12.642,20 13,19.658 13,19.238 L13,17 L12,17 L12,19 Z M20,4.781 L20,12.219 C20,12.65 19.649,13 19.219,13 L18,13 L18,12 L19,12 L19,5 L12,5 L12,6 L11,6 L11,4.781 C11,4.35 11.351,4 11.781,4 L19.219,4 C19.649,4 20,4.35 20,4.781 L20,4.781 Z" id="Amazon-EC2_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Nm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Elastic-Container-Service_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Elastic-Container-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <g id="Icon-Service/16/Amazon-Elastic-Container-Service" transform="translate(4.000000, 4.000000)" fill="#FFFFFF">
            <path d="M14.9951095,10.0569914 L13.036578,8.5362249 L13.036578,5.70726144 C13.036578,5.5354178 12.9471428,5.37549395 12.7994239,5.28510221 L9.99577946,3.56765916 L9.99577946,1.38435098 L14.9951095,4.31065939 L14.9951095,10.0569914 Z M15.7538018,3.60043858 L9.7495813,0.0850938804 C9.59482816,-0.00529785955 9.4008843,-0.0072844912 9.24412139,0.0811206171 C9.08836337,0.169525725 8.99088899,0.333422836 8.99088899,0.512219684 L8.99088899,3.84380096 C8.99088899,4.01564459 9.08132914,4.17556844 9.22804314,4.26596018 L12.0316875,5.98340324 L12.0316875,8.77760065 C12.0316875,8.92957797 12.1030348,9.07360876 12.2246265,9.16797377 L15.1870436,11.4704798 C15.2774838,11.5410053 15.3860119,11.5767646 15.4975548,11.5767646 C15.5719167,11.5767646 15.6472834,11.5598783 15.7166209,11.5261055 C15.889462,11.4436603 16,11.26983 16,11.0801067 L16,4.02756438 C16,3.85174748 15.9065452,3.68884369 15.7538018,3.60043858 L15.7538018,3.60043858 Z M8.53466872,14.959005 L2.00489047,11.6701363 L2.00489047,4.30966608 L6.9871374,1.37143787 L6.9871374,3.55573937 L4.24780599,5.27020248 C4.10310176,5.36158753 4.0146714,5.51952475 4.0146714,5.69037507 L4.0146714,10.2566479 C4.0146714,10.4453779 4.12219468,10.6172216 4.29403095,10.7016534 L8.25631406,12.6425925 C8.39699873,12.7121246 8.56481544,12.710138 8.70650499,12.6396126 L11.816641,11.0751401 L13.9058083,12.8154295 L8.53466872,14.959005 Z M12.2085483,10.1036773 C12.0558049,9.97553953 11.8357339,9.95169995 11.6568634,10.0410984 L8.47538018,11.6413302 L5.01956187,9.94872 L5.01956187,5.96254361 L7.75788839,4.2480805 C7.90359751,4.15669544 7.99202787,3.99875822 7.99202787,3.8279079 L7.99202787,0.497319947 C7.99202787,0.318523099 7.89455349,0.153632672 7.73779058,0.0652275639 C7.57901789,-0.0241708602 7.38507403,-0.0211909127 7.23233068,0.0711874588 L1.24519327,3.60043858 C1.09345481,3.689837 1,3.85174748 1,4.02756438 L1,11.974091 C1,12.1608343 1.1055135,12.3316847 1.2743351,12.4161165 L8.28244121,15.9463609 C8.35278355,15.9821203 8.431165,16 8.51055135,16 C8.57385945,16 8.63716755,15.9880802 8.69846587,15.9642406 L15.0564079,13.4283053 C15.2192001,13.3627465 15.3367723,13.2177224 15.3649092,13.0448854 C15.3920413,12.8730418 15.3267234,12.6992115 15.1920681,12.5869668 L12.2085483,10.1036773 Z" id="Amazon-Elastic-Container-Service_Icon_16_Squid"></path>
        </g>
    </g>
</svg>`, zl = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Elastic-File-System_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Elastic-File-System_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Storage" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M19,18.293 L17.354,16.647 L16.646,17.354 L18.293,19 L17,19 L17,20 L19.5,20 C19.776,20 20,19.776 20,19.5 L20,17 L19,17 L19,18.293 Z M6.646,16.647 L5,18.293 L5,17 L4,17 L4,19.5 C4,19.776 4.224,20 4.5,20 L7,20 L7,19 L5.707,19 L7.354,17.354 L6.646,16.647 Z M19.5,4 L17,4 L17,5 L18.293,5 L16.646,6.647 L17.354,7.354 L19,5.707 L19,7 L20,7 L20,4.5 C20,4.224 19.776,4 19.5,4 L19.5,4 Z M5,5.707 L6.646,7.354 L7.354,6.647 L5.707,5 L7,5 L7,4 L4.5,4 C4.224,4 4,4.224 4,4.5 L4,7 L5,7 L5,5.707 Z M15,12.117 C15,12.088 14.976,12.062 14.962,12.048 C14.923,12.012 14.872,11.989 14.854,11.999 L11.487,12 C11.211,12 10.987,11.776 10.987,11.5 L10.987,11.493 L10.451,11.498 C10.449,11.506 10.448,11.513 10.447,11.52 C10.447,11.795 10.225,12 9.948,12 L9.25,12 C9.103,11.989 9.002,12.031 8.979,12.054 L8.998,16 L15,16 L15,12.117 Z M15.644,11.317 C15.874,11.532 16,11.815 16,12.117 L16,16.5 C16,16.776 15.776,17 15.5,17 L8.5,17 C8.224,17 8,16.776 8,16.5 L8,12 C8,11.742 8.105,11.501 8.297,11.323 C8.584,11.055 8.992,10.981 9.284,11.001 L9.555,11.001 C9.649,10.751 9.827,10.5 10.156,10.5 L11.323,10.5 C11.637,10.557 11.803,10.779 11.89,11 L14.82,11 C15.096,10.974 15.41,11.099 15.644,11.317 L15.644,11.317 Z M16.131,10.972 C15.91,10.926 15.747,10.737 15.734,10.512 C15.687,9.71 15.266,9.425 14.918,9.425 C14.691,9.425 14.477,9.539 14.328,9.737 C14.218,9.884 14.035,9.959 13.854,9.932 C13.671,9.904 13.519,9.779 13.457,9.606 C13.292,9.144 13.055,8.757 12.752,8.458 C12.384,8.091 11.368,7.305 9.944,7.903 C9.141,8.241 8.486,9.251 8.486,10.155 C8.486,10.259 8.495,10.363 8.507,10.463 C8.538,10.713 8.377,10.948 8.131,11.009 C7.567,11.149 6.896,11.535 6.896,12.581 C6.896,12.582 6.9,12.709 6.9,12.709 C6.921,13.076 7.082,13.432 7.354,13.704 L6.646,14.411 C6.201,13.965 5.937,13.378 5.901,12.758 L5.896,12.581 C5.896,11.444 6.482,10.567 7.486,10.168 L7.486,10.155 C7.486,8.841 8.377,7.477 9.559,6.981 C10.936,6.404 12.393,6.692 13.456,7.748 C13.712,8.001 13.932,8.296 14.113,8.629 C14.996,8.154 16.402,8.511 16.688,10.083 C17.951,10.46 18.641,11.342 18.641,12.595 C18.641,13.72 18.123,14.543 17.184,14.914 L16.816,13.983 C17.379,13.762 17.641,13.32 17.641,12.595 C17.641,12.272 17.641,11.29 16.131,10.972 L16.131,10.972 Z" id="Amazon-Elastic-File-System_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Pm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-ElastiCache_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#2E27AD" offset="0%"></stop>
            <stop stop-color="#527FFF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-ElastiCache_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Database" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M10,13 L15,13 L15,11 L10,11 L10,13 Z M10,16 L15,16 L15,14 L10,14 L10,16 Z M10,19 L15,19 L15,17 L10,17 L10,19 Z M16,10.5 L16,19.5 C16,19.777 15.776,20 15.5,20 L9.5,20 C9.224,20 9,19.777 9,19.5 L9,10.5 C9,10.224 9.224,10 9.5,10 L15.5,10 C15.776,10 16,10.224 16,10.5 L16,10.5 Z M17,12 L18,12 L18,6.5 C18,6.224 17.776,6 17.5,6 L15.5,6 C15.224,6 15,6.224 15,6.5 L15,9 L16,9 L16,7 L17,7 L17,12 Z M14,9 L14,6.5 C14,6.224 13.776,6 13.5,6 L11.5,6 C11.224,6 11,6.224 11,6.5 L11,9 L12,9 L12,7 L13,7 L13,9 L14,9 Z M9,9 L10,9 L10,6.5 C10,6.224 9.776,6 9.5,6 L7.5,6 C7.224,6 7,6.224 7,6.5 L7,12 L8,12 L8,7 L9,7 L9,9 Z M20,4.5 L20,14.5 C20,14.777 19.776,15 19.5,15 L17,15 L17,14 L19,14 L19,5 L6,5 L6,14 L8,14 L8,15 L5.5,15 C5.224,15 5,14.777 5,14.5 L5,4.5 C5,4.224 5.224,4 5.5,4 L19.5,4 C19.776,4 20,4.224 20,4.5 L20,4.5 Z" id="Amazon-ElastiCache_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Mm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Elastic-Beanstalk_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Elastic-Beanstalk_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M14.9985007,13.6428238 C14.9985007,13.373991 14.7736132,13.1558078 14.4987506,13.1558078 C14.2238881,13.1558078 13.9990005,13.373991 13.9990005,13.6428238 C13.9990005,13.9116567 14.2238881,14.1298398 14.4987506,14.1298398 C14.7736132,14.1298398 14.9985007,13.9116567 14.9985007,13.6428238 M11.0004998,9.7466957 C11.0004998,10.0155285 11.2253873,10.2337117 11.5002499,10.2337117 C11.7751124,10.2337117 12,10.0155285 12,9.7466957 C12,9.47786286 11.7751124,9.25967968 11.5002499,9.25967968 C11.2253873,9.25967968 11.0004998,9.47786286 11.0004998,9.7466957 M8.001999,12.6687918 C8.001999,12.9376246 8.22688656,13.1558078 8.50174913,13.1558078 C8.77661169,13.1558078 9.00149925,12.9376246 9.00149925,12.6687918 C9.00149925,12.399959 8.77661169,12.1817758 8.50174913,12.1817758 C8.22688656,12.1817758 8.001999,12.399959 8.001999,12.6687918 M15.998001,13.6428238 C15.998001,14.2769187 15.5792104,14.8126363 14.9985007,15.0142609 L14.9985007,16.5649199 C14.9985007,16.8337528 14.7746127,17.0519359 14.4987506,17.0519359 L12,17.0519359 L12,19 L11.0004998,19 L11.0004998,16.0779039 L8.50174913,16.0779039 C8.22588706,16.0779039 8.001999,15.8597207 8.001999,15.5908879 L8.001999,14.0402289 C7.42128936,13.8386043 7.00249875,13.3028866 7.00249875,12.6687918 C7.00249875,11.8632673 7.67516242,11.2077437 8.50174913,11.2077437 C9.32833583,11.2077437 10.0009995,11.8632673 10.0009995,12.6687918 C10.0009995,13.3028866 9.5822089,13.8386043 9.00149925,14.0402289 L9.00149925,15.1038719 L11.0004998,15.1038719 L11.0004998,11.1181328 C10.4197901,10.9165082 10.0009995,10.3807906 10.0009995,9.7466957 C10.0009995,8.94117121 10.6736632,8.28564765 11.5002499,8.28564765 C12.3268366,8.28564765 12.9995002,8.94117121 12.9995002,9.7466957 C12.9995002,10.3807906 12.5807096,10.9165082 12,11.1181328 L12,16.0779039 L13.9990005,16.0779039 L13.9990005,15.0142609 C13.4182909,14.8126363 12.9995002,14.2769187 12.9995002,13.6428238 C12.9995002,12.8372993 13.6721639,12.1817758 14.4987506,12.1817758 C15.3253373,12.1817758 15.998001,12.8372993 15.998001,13.6428238 M20,12.0590477 C20,13.8054872 18.8965517,14.9392605 17.0504748,15.0892614 L16.9665167,14.1191255 C17.894053,14.043151 19.0004998,13.6243172 19.0004998,12.0590477 C19.0004998,10.9369628 18.3148426,10.2337117 16.9635182,9.96974904 C16.7406297,9.92591759 16.5767116,9.74182554 16.5627186,9.52072027 C16.4987506,8.45805132 15.888056,8.08207496 15.3843078,8.08207496 C15.0474763,8.08207496 14.7306347,8.23889412 14.5167416,8.51357115 C14.4067966,8.65480579 14.2218891,8.7249361 14.0449775,8.7005853 C13.864068,8.6733124 13.7131434,8.55350646 13.6501749,8.38694698 C13.4312844,7.80739793 13.1174413,7.32232997 12.7186407,6.94635361 C12.2278861,6.48174033 10.8795602,5.48530556 8.97751124,6.24505055 C7.88805597,6.67752077 7.03448276,7.9281779 7.03448276,9.09312021 C7.03448276,9.22169244 7.04247876,9.3512387 7.05847076,9.47786286 C7.08945527,9.7223449 6.92853573,9.9502684 6.68265867,10.0106584 C6.05397301,10.1616333 4.99950025,10.6272207 4.99950025,12.037619 L5.00449775,12.1652172 C5.06246877,13.1850288 5.93203398,14.011982 7.02848576,14.1181515 L6.93053473,15.0873133 C5.34732634,14.9353643 4.09095452,13.7139282 4.007996,12.2470359 L4,12.037619 C4,10.6827405 4.75262369,9.64150024 6.03598201,9.18467922 C6.03498251,9.15448423 6.03498251,9.1233152 6.03498251,9.09312021 C6.03498251,7.53466896 7.13743128,5.92361998 8.59970015,5.34309689 C10.2988506,4.66614462 12.0989505,5.00315971 13.4132934,6.24602458 C13.7631184,6.57524741 14.0589705,6.96583425 14.2978511,7.40999286 C14.6216892,7.21323839 14.9945027,7.10804293 15.3843078,7.10804293 C16.2858571,7.10804293 17.2903548,7.73337149 17.5192404,9.09701634 C19.1224388,9.52072027 20,10.5619605 20,12.0590477" id="AWS-Elastic-Beanstalk_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Fm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Glacier_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Glacier_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Storage" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <polygon id="Amazon-Glacier_Icon_16_Squid" fill="#FFFFFF" points="18.3212076 12 20 13.6022806 19.2789148 14.2914755 17.3889984 12.4867195 13.3827429 12.4867195 15.3858707 15.7973856 17.9683144 16.4573773 17.7051744 17.3977194 15.4103488 16.8107356 14.7963555 19 13.8100904 18.7488527 14.5026178 16.2831317 12.50051 12.973439 10.4984021 16.2831317 11.1909295 18.7488527 10.2046644 19 9.58965119 16.8107356 7.29482559 17.3977194 7.03270551 16.4573773 9.61514925 15.7973856 11.618277 12.4867195 7.61202149 12.4867195 5.7210852 14.2914755 5 13.6022806 6.67981233 12 5 10.3977194 5.7210852 9.70852454 7.61202149 11.5132805 11.618277 11.5132805 9.61514925 8.20261438 7.03270551 7.54262272 7.29482559 6.60228063 9.58965119 7.18926436 10.2046644 5 11.1909295 5.25114727 10.4984021 7.71686831 12.50051 11.026561 14.5026178 7.71686831 13.8100904 5.25114727 14.7963555 5 15.4103488 7.18926436 17.7051744 6.60228063 17.9683144 7.54262272 15.3858707 8.20261438 13.3827429 11.5132805 17.3889984 11.5132805 19.2789148 9.70852454 20 10.3977194"></polygon>
    </g>
</svg>`, zm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Identity-and-Access-Management_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#BD0816" offset="0%"></stop>
            <stop stop-color="#FF5252" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Identity-and-Access-Management_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Security-Identity-Compliance" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M5,18 L19,18 L19,7 L5,7 L5,18 Z M20,6.5 L20,18.5 C20,18.776 19.776,19 19.5,19 L4.5,19 C4.224,19 4,18.776 4,18.5 L4,6.5 C4,6.224 4.224,6 4.5,6 L19.5,6 C19.776,6 20,6.224 20,6.5 L20,6.5 Z M7,14.998 L10.998,15 L11,12.002 L7.002,12 L7,14.998 Z M8,11 L10,11.001 L10,9.854 C10,9.264 9.645,8.939 9,8.939 L8.999,8.939 C8.67,8.939 8.407,9.027 8.239,9.193 C8.042,9.388 8.001,9.659 8.001,9.852 L8,11 Z M6.146,15.852 C6.053,15.758 6,15.63 6,15.498 L6.002,11.5 C6.002,11.224 6.226,11 6.502,11 L7,11 L7.001,9.852 C7.001,9.301 7.187,8.827 7.537,8.481 C7.896,8.127 8.401,7.939 8.999,7.939 L9,7.939 C10.196,7.939 11,8.708 11,9.854 L11,11.002 L11.5,11.002 C11.633,11.002 11.76,11.055 11.854,11.148 C11.947,11.242 12,11.37 12,11.502 L11.998,15.5 C11.998,15.776 11.774,16 11.498,16 L6.5,15.998 C6.367,15.998 6.24,15.945 6.146,15.852 L6.146,15.852 Z M14,14 L16,14 L16,13 L14,13 L14,14 Z M14,11 L18,11 L18,10 L14,10 L14,11 Z" id="AWS-Identity-and-Access-Management_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Dm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Kinesis_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Kinesis_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Analytics" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M6.7337492,17.8414023 L7.72616432,17.8414023 C7.72616432,16.9338898 7.72616432,14.8073456 19,14.8073456 L19,13.8056761 C8.21939463,13.8056761 6.7337492,15.7449082 6.7337492,17.8414023 M8.03778266,20 L9.03019777,20 C9.03019777,18.9632721 9.03019777,16.5342237 19,16.5342237 L19,15.5325543 C9.3408237,15.5325543 8.03778266,17.7903172 8.03778266,20 M5.99241511,9.38931553 L5,9.38931553 C5,10.8287145 5.99340753,11.9105175 9.81718296,12.4994992 C5.99340753,13.0894825 5,14.1712855 5,15.6096828 L5.99241511,15.6096828 C5.99241511,14.3956594 7.47111363,13.0003339 19,13.0003339 L19,11.9986644 C7.47111363,11.9986644 5.99241511,10.6043406 5.99241511,9.38931553 M7.72616432,7.15859766 L6.7337492,7.15859766 C6.7337492,9.25409015 8.21939463,11.1943239 19,11.1943239 L19,10.1926544 C7.72616432,10.1926544 7.72616432,8.06611018 7.72616432,7.15859766 M19,8.46577629 L19,9.46744574 C9.3408237,9.46744574 8.03778266,7.20868114 8.03778266,5 L9.03019777,5 C9.03019777,6.03672788 9.03019777,8.46577629 19,8.46577629" id="Amazon-Kinesis_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Bm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Lambda_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Lambda_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M8.35471698,19 L5.33377354,19 L8.87677893,11.806 L10.3893141,14.832 L8.35471698,19 Z M9.3369363,10.435 C9.25026989,10.262 9.06971487,10.153 8.87265196,10.153 L8.87058847,10.153 C8.67352556,10.153 8.49297054,10.264 8.40733588,10.437 L4.05028527,19.285 C3.97393629,19.439 3.98528546,19.622 4.07917407,19.767 C4.17409443,19.912 4.33814156,20 4.51560135,20 L8.68074777,20 C8.8809059,20 9.06249267,19.889 9.14812734,19.714 L11.4282793,15.043 C11.4943109,14.907 11.4932791,14.748 11.4262158,14.611 L9.3369363,10.435 Z M18.968257,19 L15.7987426,19 L10.1747116,7.289 C10.0901087,7.113 9.90749017,7 9.70733203,7 L7.61598901,7 L7.6180525,5 L11.7883576,5 L17.386595,16.71 C17.471198,16.887 17.6548482,17 17.8550063,17 L18.968257,17 L18.968257,19 Z M19.4841285,16 L18.1841324,16 L12.5869267,4.29 C12.5023238,4.113 12.3186735,4 12.1174836,4 L7.10321275,4 C6.81845169,4 6.58734126,4.224 6.58734126,4.5 L6.58424603,7.5 C6.58424603,7.632 6.63892841,7.759 6.73591225,7.854 C6.83186434,7.947 6.9628957,8 7.10011752,8 L9.37820602,8 L15.002237,19.711 C15.0868399,19.887 15.2694584,20 15.4696166,20 L19.4841285,20 C19.7688896,20 20,19.776 20,19.5 L20,16.5 C20,16.224 19.7688896,16 19.4841285,16 L19.4841285,16 Z" id="AWS-Lambda_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Um = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Lightsail_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#C8511B" offset="0%"></stop>
            <stop stop-color="#FF9900" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Lightsail_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Compute" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M20,12.5 C20,16.636 16.636,20 12.5,20 C9.458,20 6.738,18.185 5.571,15.376 L6.495,14.992 C7.506,17.427 9.863,19 12.5,19 C16.084,19 19,16.084 19,12.5 C19,8.916 16.084,6 12.5,6 C9.826,6 7.386,7.677 6.429,10.173 L5.495,9.815 C6.6,6.935 9.415,5 12.5,5 C16.636,5 20,8.364 20,12.5 L20,12.5 Z M7,13 L10,13 L10,12 L7,12 L7,13 Z M4,13 L6,13 L6,12 L4,12 L4,13 Z M14.193,9.163 C14.792,10.014 15.392,11.192 15.392,12.501 C15.392,13.794 14.737,15.02 14.188,15.82 C13.856,14.343 13.213,13.192 12.331,12.501 C13.217,11.807 13.862,10.65 14.193,9.163 L14.193,9.163 Z M13.382,17.081 C13.402,17.277 13.537,17.443 13.725,17.504 C13.775,17.521 13.827,17.528 13.879,17.528 C14.018,17.528 14.153,17.47 14.25,17.363 C14.753,16.806 16.392,14.81 16.392,12.501 C16.392,10.33 15.051,8.521 14.251,7.636 C14.118,7.49 13.913,7.434 13.725,7.496 C13.537,7.557 13.403,7.723 13.383,7.919 C13.163,10 12.334,11.541 11.165,12.042 C10.981,12.12 10.862,12.301 10.862,12.501 C10.862,12.701 10.981,12.882 11.165,12.96 C12.334,13.462 13.162,15.002 13.382,17.081 L13.382,17.081 Z" id="Amazon-Lightsail-Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Hm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-RDS_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#2E27AD" offset="0%"></stop>
            <stop stop-color="#527FFF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-RDS_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Database" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M5.707,5 L7.853,7.146 L7.146,7.854 L5,5.707 L5,7.5 L4,7.5 L4,4.5 C4,4.224 4.224,4 4.5,4 L7.5,4 L7.5,5 L5.707,5 Z M7.853,16.854 L5.707,19 L7.5,19 L7.5,20 L4.5,20 C4.224,20 4,19.776 4,19.5 L4,16.5 L5,16.5 L5,18.293 L7.146,16.146 L7.853,16.854 Z M5,12 C5,12.75 5.966,13.542 7.519,14.069 L7.199,15.016 C5.166,14.328 4,13.228 4,12 C4,10.772 5.166,9.672 7.199,8.984 L7.519,9.931 C5.966,10.458 5,11.25 5,12 L5,12 Z M19,16.5 L20,16.5 L20,19.5 C20,19.776 19.776,20 19.5,20 L16.5,20 L16.5,19 L18.293,19 L16.146,16.854 L16.853,16.146 L19,18.293 L19,16.5 Z M20,4.5 L20,7.5 L19,7.5 L19,5.707 L16.853,7.854 L16.146,7.146 L18.293,5 L16.5,5 L16.5,4 L19.5,4 C19.776,4 20,4.224 20,4.5 L20,4.5 Z M20,12 C20,13.228 18.834,14.328 16.801,15.016 L16.48,14.069 C18.034,13.542 19,12.75 19,12 C19,11.25 18.034,10.458 16.48,9.931 L16.801,8.984 C18.834,9.672 20,10.772 20,12 L20,12 Z M12,15.402 C10.81,15.402 10.087,15.104 10,15.032 L10,10.651 C10.564,10.886 11.294,11 12,11 C12.708,11 13.439,10.886 14.004,10.65 L14.02,14.952 C13.913,15.104 13.19,15.402 12,15.402 L12,15.402 Z M12,9 C13.174,9 13.858,9.336 13.987,9.5 C13.858,9.664 13.174,10 12,10 C10.771,10 10.08,9.632 10,9.531 L10,9.521 C10.08,9.368 10.771,9 12,9 L12,9 Z M12,8 C10.555,8 9,8.469 9,9.5 L9,15.032 C9,15.979 10.507,16.402 12,16.402 C13.493,16.402 15,15.979 15,15.032 L15,9.5 C15,8.469 13.445,8 12,8 L12,8 Z" id="Amazon-RDS_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Gm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Redshift_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Redshift_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Analytics" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M14.4737051,10.7348035 C14.4737051,10.6013584 14.5788847,10.4925493 14.7078785,10.4925493 C14.8368724,10.4925493 14.9430443,10.6013584 14.9430443,10.7348035 C14.9430443,11.0016937 14.4737051,11.0016937 14.4737051,10.7348035 M13.2562016,13.756822 C13.2562016,13.6233768 13.3623735,13.5145678 13.4913673,13.5145678 C13.6203612,13.5145678 13.7245485,13.6233768 13.7245485,13.756822 C13.7245485,14.0247387 13.2562016,14.0247387 13.2562016,13.756822 M10.3349871,13.25281 C10.3349871,13.1193649 10.441159,13.0105559 10.5691605,13.0105559 C10.6981544,13.0105559 10.8043263,13.1193649 10.8043263,13.25281 C10.8043263,13.5207268 10.3349871,13.5207268 10.3349871,13.25281 M9.11847589,16.0233358 C9.11847589,15.8898907 9.22365549,15.7810816 9.35264934,15.7810816 C9.48164318,15.7810816 9.58583052,15.8898907 9.58583052,16.0233358 C9.58583052,16.290226 9.11847589,16.290226 9.11847589,16.0233358 M14.7078785,9.46604849 C14.0321492,9.46604849 13.4814447,10.0347299 13.4814447,10.7348035 C13.4814447,11.0899728 13.6253225,11.4092146 13.8525501,11.6401772 L13.5270887,12.4952524 C13.5141893,12.4952524 13.5032745,12.4880669 13.4913673,12.4880669 C13.0359198,12.4880669 12.6529073,12.7580366 12.4405636,13.1409215 L11.7420123,12.9766813 C11.6159952,12.4131324 11.1506251,11.984055 10.5691605,11.984055 C9.89343124,11.984055 9.34272673,12.5527365 9.34272673,13.25281 C9.34272673,13.5145678 9.43897599,13.7455304 9.57094662,13.9477511 L9.22762453,14.7802433 C8.6124231,14.8490188 8.12621552,15.3694548 8.12621552,16.0233358 C8.12621552,16.7234094 8.67592776,17.2920908 9.35264934,17.2920908 C10.0293709,17.2920908 10.5780909,16.7234094 10.5780909,16.0233358 C10.5780909,15.654822 10.4203215,15.3294212 10.1762254,15.097432 L10.4262751,14.4917965 C10.4748958,14.4989821 10.5185553,14.5215651 10.5691605,14.5215651 C10.9779718,14.5215651 11.3222862,14.3008674 11.5455448,13.9836786 L12.3453066,14.1715283 C12.5129986,14.6663017 12.9575313,15.025577 13.4913673,15.025577 C14.1670966,15.025577 14.7168089,14.455869 14.7168089,13.756822 C14.7168089,13.4478452 14.5967454,13.1737695 14.4181385,12.9530718 L14.7862671,11.9871345 C15.4242905,11.942995 15.9353046,11.4061351 15.9353046,10.7348035 C15.9353046,10.0347299 15.3846001,9.46604849 14.7078785,9.46604849 M12,18.9734992 C9.35562612,18.9734992 7.99226037,18.1461395 7.99226037,17.7930232 L7.99226037,8.59044328 C8.95276841,9.14885973 10.4808494,9.43730646 12,9.43730646 C13.5191506,9.43730646 15.0472316,9.14885973 16.0077396,8.59044328 L16.0077396,17.7930232 C16.0077396,18.1461395 14.6443739,18.9734992 12,18.9734992 M12,5.99236968 C14.4866045,5.99236968 16.0077396,6.77558981 16.0077396,7.20261416 C16.0077396,7.628612 14.4866045,8.41080563 12,8.41080563 C9.51339551,8.41080563 7.99226037,7.628612 7.99226037,7.20261416 C7.99226037,6.77558981 9.51339551,5.99236968 12,5.99236968 M17,7.20261416 C17,4.26579528 7,4.26579528 7,7.20261416 C7,7.20466716 7.00099226,7.20672016 7.00099226,7.20877316 L7,7.20877316 L7,17.7930232 C7,19.2424424 9.51538004,20 12,20 C14.48462,20 17,19.2424424 17,17.7930232 L17,7.20877316 L16.9990077,7.20877316 C16.9990077,7.20672016 17,7.20466716 17,7.20261416" id="Amazon-Redshift_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, $m = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Icon-Architecture/16/Arch_Amazon-Simple-Storage-Service_16</title>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#1B660F" offset="0%"></stop>
            <stop stop-color="#6CAE3E" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Simple-Storage-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Rectangle" fill="url(#linearGradient-1)">
            <rect x="0" y="0" width="24" height="24"></rect>
        </g>
        <g id="Icon-Service/16/Amazon-Simple-Storage-Service_16" transform="translate(4.000000, 4.000000)" fill="#FFFFFF">
            <path d="M13.9082,9.0508 L13.9492,8.8068 C14.2152,8.9598 14.4192,9.0888 14.5642,9.1918 C14.3942,9.1638 14.1662,9.1138 13.9082,9.0508 L13.9082,9.0508 Z M12.0492,14.0928 C11.9992,14.3958 10.9792,14.9998 7.4782,14.9998 C4.0442,14.9998 3.0432,14.3968 2.9932,14.0898 L1.2592,3.9648 C2.6962,4.6678 5.1522,4.9998 7.5002,4.9998 C9.8502,4.9998 12.3112,4.6658 13.7482,3.9618 L12.9402,8.7748 C11.3852,8.2668 9.5682,7.3978 8.6442,6.9548 L8.4742,6.8728 C8.4092,6.3838 8.0072,5.9998 7.5002,5.9998 C6.9482,5.9998 6.5002,6.4488 6.5002,6.9998 C6.5002,7.5508 6.9482,7.9998 7.5002,7.9998 C7.7212,7.9998 7.9142,7.9138 8.0792,7.7928 L8.2132,7.8568 C9.1842,8.3228 11.1192,9.2468 12.7732,9.7698 L12.0492,14.0928 Z M7.5002,0.9998 C11.7612,0.9998 13.9712,2.0368 14.0002,2.4898 L14.0002,2.5188 C13.9462,2.9768 11.7352,3.9998 7.5002,3.9998 C3.2702,3.9998 1.0592,2.9798 1.0002,2.5208 L1.0002,2.4888 C1.0302,2.0348 3.2422,0.9998 7.5002,0.9998 L7.5002,0.9998 Z M15.0002,2.4998 C15.0002,0.7818 11.1122,-0.0002 7.5002,-0.0002 C3.8872,-0.0002 0.0002,0.7818 0.0002,2.4998 L0.0472,2.8158 L2.0072,14.2548 C2.1972,15.4248 3.9362,15.9998 7.4782,15.9998 C12.2072,15.9998 12.9142,14.9908 13.0352,14.2568 L13.7422,10.0428 C14.3202,10.1828 14.7312,10.2388 15.0232,10.2388 C15.4852,10.2388 15.6612,10.1038 15.7832,9.9598 C15.9292,9.7858 15.9852,9.5668 15.9422,9.3428 C15.8492,8.8678 15.3302,8.4158 14.1252,7.7598 L14.9542,2.8138 L15.0002,2.4998 Z" id="Amazon-Simple-Storage-Service-Icon_16_Squid"></path>
        </g>
    </g>
</svg>`, jm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Simple-Notification-Service_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#B0084D" offset="0%"></stop>
            <stop stop-color="#FF4F8B" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Simple-Notification-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Application-Integration" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M6.4951189,11.5607705 C6.4951189,11.9743992 6.15969962,12.3097195 5.74818523,12.3097195 C5.33667084,12.3097195 5.00125156,11.9743992 5.00125156,11.5607705 C5.00125156,11.1471419 5.33667084,10.8118215 5.74818523,10.8118215 C6.15969962,10.8118215 6.4951189,11.1471419 6.4951189,11.5607705 L6.4951189,11.5607705 Z M12.4395494,18.9960469 C9.28861076,18.9960469 6.52015019,16.6006149 5.7261577,13.3116647 C5.73316646,13.3116647 5.74017522,13.3136726 5.74818523,13.3136726 C6.71239049,13.3136726 7.49637046,12.5275773 7.49637046,11.5607705 C7.49637046,10.6441614 6.78948686,9.89822426 5.89436796,9.82292778 C6.84155194,6.99579595 9.47083855,5.00395307 12.4395494,5.00395307 C13.7481852,5.00395307 14.8715895,5.23486227 15.7787234,5.68965301 L16.2272841,4.79111502 C15.1789737,4.26604756 13.9043805,4 12.4395494,4 C8.82202753,4 5.62302879,6.56610403 4.74593242,10.1291335 C4.29637046,10.4463826 4,10.9684382 4,11.5607705 C4,12.0958775 4.24530663,12.5697434 4.62377972,12.8910083 C5.29461827,16.9570183 8.61677096,20 12.4395494,20 C13.58398,20 14.9296621,19.6395808 16.2282854,18.9850035 L15.7777222,18.0874694 C14.6162703,18.673778 13.4307885,18.9960469 12.4395494,18.9960469 L12.4395494,18.9960469 Z M8.75994994,9.96046935 L12.2392991,9.96046935 L11.0217772,12.8056723 C10.9947434,12.8689214 10.9807259,12.9361862 10.9807259,13.0034511 L10.9807259,14.7061555 L10.0455569,15.1910648 L10.0455569,13.0034511 C10.0455569,12.9341783 10.0305382,12.8659095 10.0035044,12.8016565 L8.75994994,9.96046935 Z M9.28460576,16.4450022 C9.36370463,16.4931919 9.45481852,16.5172868 9.54493116,16.5172868 C9.62403004,16.5172868 9.70212766,16.4992157 9.77421777,16.4620694 L11.7116395,15.4581163 C11.8778473,15.3717764 11.9819775,15.2001004 11.9819775,15.0123612 L11.9819775,13.1068583 L13.4588235,9.65727552 C13.5249061,9.5016628 13.5098874,9.32295915 13.4177722,9.18240572 C13.3246558,9.04185229 13.1674593,8.95651628 12.9992491,8.95651628 L7.99299124,8.95651628 C7.82377972,8.95651628 7.66658323,9.04285625 7.57346683,9.18441363 C7.48135169,9.32597101 7.46733417,9.50567861 7.53441802,9.66028738 L9.04430538,13.1088662 L9.04430538,16.0153103 C9.04430538,16.1910021 9.13541927,16.3536425 9.28460576,16.4450022 L9.28460576,16.4450022 Z M18.2518148,14.823618 C18.6633292,14.823618 18.9987484,15.1589383 18.9987484,15.572567 C18.9987484,15.9861956 18.6633292,16.3225199 18.2518148,16.3225199 C17.8403004,16.3225199 17.5048811,15.9861956 17.5048811,15.572567 C17.5048811,15.1589383 17.8403004,14.823618 18.2518148,14.823618 L18.2518148,14.823618 Z M18.2518148,6.75384326 C18.6633292,6.75384326 18.9987484,7.09016753 18.9987484,7.50279224 C18.9987484,7.91642091 18.6633292,8.25274518 18.2518148,8.25274518 C17.8403004,8.25274518 17.5048811,7.91642091 17.5048811,7.50279224 C17.5048811,7.09016753 17.8403004,6.75384326 18.2518148,6.75384326 L18.2518148,6.75384326 Z M18.2518148,10.8118215 C18.6633292,10.8118215 18.9987484,11.1471419 18.9987484,11.5607705 C18.9987484,11.9743992 18.6633292,12.3097195 18.2518148,12.3097195 C17.8403004,12.3097195 17.5048811,11.9743992 17.5048811,11.5607705 C17.5048811,11.1471419 17.8403004,10.8118215 18.2518148,10.8118215 L18.2518148,10.8118215 Z M16.0030038,12.0627471 L16.5857322,12.0627471 C16.8030038,12.7835854 17.4628285,13.3136726 18.2518148,13.3136726 C19.21602,13.3136726 20,12.5275773 20,11.5607705 C20,10.5939637 19.21602,9.80786848 18.2518148,9.80786848 C17.4628285,9.80786848 16.8030038,10.3379557 16.5857322,11.058794 L16.0030038,11.058794 L16.0030038,8.00476878 L16.5857322,8.00476878 C16.8030038,8.72661103 17.4628285,9.25669825 18.2518148,9.25669825 C19.21602,9.25669825 20,8.46959905 20,7.50279224 C20,6.5369894 19.21602,5.74989019 18.2518148,5.74989019 C17.4628285,5.74989019 16.8030038,6.27997741 16.5857322,7.00081571 L15.502378,7.00081571 C15.2260325,7.00081571 15.0017522,7.2257012 15.0017522,7.50279224 L15.0017522,11.058794 L14.0005006,11.058794 L14.0005006,12.0627471 L15.0017522,12.0627471 L15.0017522,15.572567 C15.0017522,15.849658 15.2260325,16.0745435 15.502378,16.0745435 L16.5857322,16.0745435 C16.8030038,16.7953818 17.4628285,17.326473 18.2518148,17.326473 C19.21602,17.326473 20,16.5393738 20,15.572567 C20,14.6057602 19.21602,13.8196649 18.2518148,13.8196649 C17.4628285,13.8196649 16.8030038,14.3497521 16.5857322,15.0705904 L16.0030038,15.0705904 L16.0030038,12.0627471 Z" id="AWS-Simple-Notification-Service_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Vm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-Simple-Queue-Service_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#B0084D" offset="0%"></stop>
            <stop stop-color="#FF4F8B" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-Simple-Queue-Service_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Application-Integration" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M8.00538392,12.9850432 L9.00704291,12.9850432 L9.00704291,11.9942745 L8.00538392,11.9942745 L8.00538392,12.9850432 Z M15.0169969,12.986034 L16.0186559,12.986034 L16.0186559,11.9952653 L15.0169969,11.9952653 L15.0169969,12.986034 Z M12.7903089,11.2234565 C12.2824678,11.3522564 11.741572,11.3522564 11.2337309,11.2234565 C11.4350643,12.005173 11.4350643,12.8780402 11.2337309,13.6597567 C11.4881523,13.5953567 11.7485836,13.5626614 12.0120199,13.5626614 C12.2754562,13.5626614 12.5358876,13.5953567 12.7903089,13.6597567 C12.5889755,12.8780402 12.5889755,12.005173 12.7903089,11.2234565 L12.7903089,11.2234565 Z M14.3699252,10.3149216 C13.4053276,11.2690318 13.4053276,13.6141813 14.3699252,14.5682916 C14.4670861,14.6653869 14.5161674,14.7922053 14.5161674,14.9190237 C14.5161674,15.0458421 14.4670861,15.1726605 14.3699252,15.2687651 C14.2717626,15.3658604 14.1435503,15.4144081 14.0153379,15.4144081 C13.8871256,15.4144081 13.7589132,15.3658604 13.6617523,15.2687651 C12.7282061,14.3463594 11.2958337,14.3463594 10.3632892,15.2687651 C10.166964,15.4629557 9.85043979,15.4629557 9.65511629,15.2687651 C9.5569537,15.1726605 9.50787241,15.0458421 9.50787241,14.9190237 C9.50787241,14.7922053 9.5569537,14.6653869 9.65511629,14.5682916 C10.6187122,13.6141813 10.6187122,11.2690318 9.65511629,10.3149216 C9.5569537,10.218817 9.50787241,10.0919986 9.50787241,9.96518021 C9.50787241,9.83836181 9.5569537,9.71154342 9.65511629,9.61444809 C9.85043979,9.42124819 10.166964,9.42124819 10.3632892,9.61444809 C11.2958337,10.5378445 12.7282061,10.5378445 13.6617523,9.61444809 C13.8570758,9.42124819 14.1736,9.42124819 14.3699252,9.61444809 C14.4670861,9.71154342 14.5161674,9.83836181 14.5161674,9.96518021 C14.5161674,10.0919986 14.4670861,10.218817 14.3699252,10.3149216 L14.3699252,10.3149216 Z M18.8162895,12.0794806 C18.6980937,11.9635607 18.5418349,11.8991607 18.3755595,11.8991607 C18.2082825,11.8991607 18.051022,11.9635607 17.9328262,12.0794806 C17.6894231,12.3212282 17.6894231,12.7125818 17.9328262,12.9533386 C18.1692178,13.1851785 18.5788963,13.18716 18.8162895,12.9533386 C19.0596926,12.7125818 19.0596926,12.3212282 18.8162895,12.0794806 L18.8162895,12.0794806 Z M19.5244624,13.6538121 C19.2169531,13.9569873 18.8092779,14.1244272 18.3755595,14.1244272 C17.9398379,14.1244272 17.5321626,13.9569873 17.2246533,13.6538121 C16.5906032,13.0266555 16.5906032,12.0061637 17.2246533,11.3790071 C17.8376686,10.7726567 18.9094438,10.7716659 19.5244624,11.3790071 C20.1585125,12.0061637 20.1585125,13.0266555 19.5244624,13.6538121 L19.5244624,13.6538121 Z M6.0661721,12.0854252 C5.94797634,11.9695053 5.79171753,11.9051053 5.62544214,11.9051053 C5.45816509,11.9051053 5.30190628,11.9695053 5.18371052,12.0854252 C4.93930573,12.326182 4.93930573,12.7185264 5.18371052,12.9592832 C5.42010204,13.1911231 5.82978057,13.1931046 6.0661721,12.9592832 C6.31057689,12.7185264 6.31057689,12.326182 6.0661721,12.0854252 L6.0661721,12.0854252 Z M6.77534667,13.6597567 C6.46783736,13.9629319 6.06016214,14.1303718 5.62544214,14.1303718 C5.18972047,14.1303718 4.78204526,13.9629319 4.47553761,13.6597567 C3.84148746,13.0326001 3.84148746,12.0121083 4.47553761,11.3849518 C5.08955457,10.7776105 6.15932638,10.7776105 6.77534667,11.3849518 C7.40839515,12.0121083 7.40839515,13.0326001 6.77534667,13.6597567 L6.77534667,13.6597567 Z M15.8844336,16.4081491 C13.7248568,18.5432556 10.2130403,18.5422649 8.05546687,16.4081491 C7.47650797,15.8354848 7.10889911,15.3371281 6.86148934,14.7922053 L5.94797634,15.196439 C6.24647072,15.8562909 6.67818575,16.4467891 7.34729396,17.1086225 C8.6214042,18.3698711 10.2951764,19 11.9699502,19 C13.6437224,19 15.3184963,18.3698711 16.5926065,17.1086225 C17.1044543,16.6033305 17.6753999,15.9821185 18.0400038,15.2013928 L17.1294957,14.7862607 C16.8330047,15.423325 16.356215,15.9424878 15.8844336,16.4081491 L15.8844336,16.4081491 Z M6.8795192,10.1722509 L5.97001283,9.75711878 C6.26750556,9.12104527 6.70523054,8.52856559 7.34929727,7.89051055 C9.8965161,5.36999497 14.0433844,5.36999497 16.5906032,7.88951978 C17.0563746,8.35121799 17.6393402,8.97936535 18.0139606,9.7501834 L17.1124675,10.1791862 C16.8670611,9.67587575 16.4994522,9.20129754 15.8824303,8.58999325 C13.7238551,6.45686824 10.214042,6.45884977 8.05747018,8.58999325 C7.49153285,9.15076834 7.12893229,9.63822654 6.8795192,10.1722509 L6.8795192,10.1722509 Z" id="AWS-Simple-Queue-Service_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, qm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_AWS-SageMaker_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#055F4E" offset="0%"></stop>
            <stop stop-color="#56C0A7" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_AWS-SageMaker_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Machine-Learning" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M19.000533,13.6672874 L17.3104344,12.3579393 L16.6857676,13.1152694 L18.5747601,14.5766646 L17.2604611,15.2080958 C17.0895522,15.2894458 16.9816098,15.4579566 16.9816098,15.6419626 L16.9816098,17.2989853 L14.0161914,18.9482603 L12.96875,18.2858386 L12.96875,15.6574578 L14.9986674,15.6574578 L14.9986674,14.6890051 L12.96875,14.6890051 L12.96875,12.7366043 L11.969283,12.7366043 L11.969283,18.2906809 L10.9788113,18.9453549 L9.91038113,18.350725 L11.3546109,16.9532476 L10.6479877,16.2685515 L9.01285981,17.8519718 L8.01839019,17.2989853 L8.01839019,15.6419626 C8.01839019,15.4579566 7.91044776,15.2894458 7.73953891,15.2080958 L5.99946695,14.3732895 L5.99946695,11.0941084 L7.43370203,10.3726111 L9.00186567,11.1047614 L9.00186567,12.477059 L7.72554638,13.3021807 L8.27925107,14.1079334 L9.77845149,13.1394807 C9.9173774,13.0494146 10.0013326,12.8983359 10.0013326,12.7366043 L10.0013326,11.0592442 L11.2776519,10.2341224 L10.7239472,9.42836971 L9.46162047,10.2438069 L7.9244403,9.52715189 L7.9244403,7.24644565 L9.00186567,6.80386274 L9.00186567,8.827929 L10.0013326,8.827929 L10.0013326,6.39323877 L10.958822,6.00004695 L11.969283,6.31188874 L11.969283,9.83124606 C11.969283,9.97941933 12.0392457,10.1188765 12.1591818,10.2108795 L14.6898321,12.147785 L15.3085021,11.3885181 L12.96875,9.59688049 L12.96875,6.30704647 L13.9132463,6.0010154 L16.9976013,7.24838255 L16.9976013,7.95535307 L14.9986674,7.95535307 L14.9986674,8.92380582 L16.9976013,8.92380582 L16.9976013,9.83124606 C16.9976013,10.0152521 17.1055437,10.1827944 17.2734542,10.2641444 L19.000533,11.0989507 L19.000533,13.6672874 Z M19.7241471,10.3668004 L17.9970682,9.53199415 L17.9970682,6.92588779 C17.9970682,6.73026033 17.8761327,6.55400193 17.6892324,6.47943106 L14.1251333,5.03740491 C14.013193,4.99188763 13.8892591,4.98898227 13.7743204,5.02578348 L12.4660181,5.44899733 L11.0857543,5.02287812 C10.9728145,4.98801382 10.8498801,4.99285608 10.7389392,5.03837336 L7.22981077,6.48039952 C7.04490938,6.55593883 6.92497335,6.73122878 6.92497335,6.92588779 L6.92497335,9.53683642 L5.26985608,10.3697058 C5.10394456,10.4529927 5,10.6195666 5,10.7996988 L5,14.6735098 C5,14.8575159 5.10794243,15.0260266 5.27885128,15.1073767 L7.01892324,15.9431514 L7.01892324,17.5788681 C7.01892324,17.7522212 7.1138726,17.9129843 7.26978945,17.9991766 L10.7519323,19.9360821 C10.8288913,19.978694 10.9148454,20 11.0007996,20 C11.0997468,20 11.1966951,19.9719149 11.2816498,19.9157446 L12.4750133,19.129361 L13.7263459,19.9215553 C13.8093017,19.9738518 13.9032516,20 13.9992004,20 C14.0851546,20 14.1711087,19.978694 14.2480677,19.9360821 L17.7302106,17.9991766 C17.8861274,17.9129843 17.9810768,17.7522212 17.9810768,17.5788681 L17.9810768,15.9431514 L19.7221482,15.1073767 C19.893057,15.0260266 20,14.8575159 20,14.6735098 L20,10.7996988 C20,10.6166612 19.893057,10.4481505 19.7241471,10.3668004 L19.7241471,10.3668004 Z" id="AWS-SageMaker_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Zm = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 64 (93537) - https://sketch.com -->
    <title>Icon-Architecture/16/Arch_Amazon-Virtual-Private-Cloud_16</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <linearGradient x1="0%" y1="100%" x2="100%" y2="0%" id="linearGradient-1">
            <stop stop-color="#4D27A8" offset="0%"></stop>
            <stop stop-color="#A166FF" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Icon-Architecture/16/Arch_Amazon-Virtual-Private-Cloud_16" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/16/Networking-Content-Delivery" fill="url(#linearGradient-1)">
            <rect id="Rectangle" x="0" y="0" width="24" height="24"></rect>
        </g>
        <path d="M16.997,11.8210743 L15.074,10.8030743 L15.074,18.4610743 C16.958,18.0830743 16.996,15.6320743 16.997,15.5190743 L16.997,11.8210743 Z M12.851,17.8750743 C13.178,18.2020743 13.581,18.4000743 14.074,18.4770743 L14.074,10.7820743 L11.981,11.8290743 L11.981,15.5200743 C11.981,15.5370743 11.988,17.0100743 12.851,17.8750743 L12.851,17.8750743 Z M17.997,11.5200743 L17.997,15.5200743 C17.997,16.9020743 17.28,19.5140743 14.567,19.5140743 C13.573,19.5140743 12.756,19.1990743 12.138,18.5760743 C10.980946,17.4110743 10.98,15.5930743 10.980946,15.5160743 L10.980946,11.5200743 C10.980946,11.3300743 11.089,11.1570743 11.258,11.0720743 L14.351,9.52607432 C14.495,9.45307432 14.667,9.45607432 14.808,9.53107432 L17.73,11.0780743 C17.894,11.1640743 17.997,11.3350743 17.997,11.5200743 L17.997,11.5200743 Z M19.69,9.73507432 L18.753,10.0810743 C18.547,9.52407432 18.199,9.29607432 17.555,9.29607432 C17.29,9.29607432 17.071,9.09007432 17.056,8.82607432 C16.986,7.66307432 16.389,7.10607432 15.862,7.07907432 C15.189,7.04807432 14.968,7.33607432 14.894,7.43107432 C14.783,7.57707432 14.6,7.64907432 14.422,7.62407432 C14.241,7.59607432 14.089,7.47307432 14.026,7.30107432 C13.811,6.71307432 13.509,6.24207432 13.076,5.82007432 C12.144,4.91807432 10.407,4.73107432 8.851,5.36907432 C7.789,5.80407432 7.102,6.92707432 7.102,8.23007432 C7.102,8.37407432 7.121,8.59807432 7.138,8.73707432 C7.168,8.98707432 7.007,9.22007432 6.762,9.28107432 C5.576,9.57507432 5,10.2550743 5,11.3570743 C5,11.4070743 4.999,11.4580743 5.004,11.5080743 C5.061,12.5170743 5.613,13.5770743 6.995,13.5770743 L8.997,13.5770743 L8.997,14.5770743 L6.995,14.5770743 C5.309,14.5770743 4.107,13.3730743 4.007,11.5810743 C4.001,11.5170743 4,11.4370743 4,11.3570743 C4,9.93307432 4.745,8.90807432 6.109,8.43307432 C6.105,8.36007432 6.102,8.28907432 6.102,8.23007432 C6.102,6.51907432 7.033,5.03307432 8.473,4.44307432 C10.386,3.66207432 12.564,3.93307432 13.772,5.10207432 C14.145,5.46607432 14.447,5.86907432 14.686,6.32307432 C14.986,6.16107432 15.382,6.05107432 15.913,6.08007432 C16.968,6.13407432 17.786,7.03507432 18.004,8.32807432 C18.824,8.44907432 19.39,8.92107432 19.69,9.73507432 L19.69,9.73507432 Z" id="Amazon-Virtual-Private-Cloud_Icon_16_Squid" fill="#FFFFFF"></path>
    </g>
</svg>`, Wm = '<svg id="bdb56329-4717-4410-aa13-4505ecaa4e46" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="ba2610c3-a45a-4e7e-a0c0-285cfd7e005d" x1="13.25" y1="13.02" x2="8.62" y2="4.25" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1988d9" /><stop offset="0.9" stop-color="#54aef0" /></linearGradient><linearGradient id="bd8f618b-4f2f-4cb7-aff0-2fd2d211326d" x1="11.26" y1="10.47" x2="14.46" y2="15.99" gradientUnits="userSpaceOnUse"><stop offset="0.1" stop-color="#54aef0" /><stop offset="0.29" stop-color="#4fabee" /><stop offset="0.51" stop-color="#41a2e9" /><stop offset="0.74" stop-color="#2a93e0" /><stop offset="0.88" stop-color="#1988d9" /></linearGradient></defs><title>Icon-identity-221</title><polygon points="1.01 10.19 8.93 15.33 16.99 10.17 18 11.35 8.93 17.19 0 11.35 1.01 10.19" fill="#50e6ff" /><polygon points="1.61 9.53 8.93 0.81 16.4 9.54 8.93 14.26 1.61 9.53" fill="#fff" /><polygon points="8.93 0.81 8.93 14.26 1.61 9.53 8.93 0.81" fill="#50e6ff" /><polygon points="8.93 0.81 8.93 14.26 16.4 9.54 8.93 0.81" fill="url(#ba2610c3-a45a-4e7e-a0c0-285cfd7e005d)" /><polygon points="8.93 7.76 16.4 9.54 8.93 14.26 8.93 7.76" fill="#53b1e0" /><polygon points="8.93 14.26 1.61 9.53 8.93 7.76 8.93 14.26" fill="#9cebff" /><polygon points="8.93 17.19 18 11.35 16.99 10.17 8.93 15.33 8.93 17.19" fill="url(#bd8f618b-4f2f-4cb7-aff0-2fd2d211326d)" /></svg>', Ym = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="fdd5d44a-d038-42da-afe7-cecaad9f8ff9" x1="6.49" y1="17.38" x2="6.49" y2="0.44" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#949494" /><stop offset="0.53" stop-color="#a2a2a2" /><stop offset="1" stop-color="#b3b3b3" /></linearGradient><linearGradient id="bf4a560d-147b-4f76-9d70-f90bc5f8ddd6" x1="10.06" y1="13.89" x2="16.48" y2="13.89" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#005ba1" /><stop offset="0.07" stop-color="#0060a9" /><stop offset="0.36" stop-color="#0071c8" /><stop offset="0.52" stop-color="#0078d4" /><stop offset="0.64" stop-color="#0074cd" /><stop offset="0.82" stop-color="#006abb" /><stop offset="1" stop-color="#005ba1" /></linearGradient></defs><g id="a55981fb-ccb2-4f5b-acf6-743ff717cb3a"><g><path d="M11,9.57a6.72,6.72,0,0,0-2.23.32,6.64,6.64,0,0,0,2.23.33,6.56,6.56,0,0,0,2.23-.33A6.63,6.63,0,0,0,11,9.57Z" fill="#198ab3" /><g><path d="M11.47,16.81a.57.57,0,0,1-.58.57H2.09a.56.56,0,0,1-.57-.57V1A.57.57,0,0,1,2.09.44h8.8a.58.58,0,0,1,.58.57Z" fill="url(#fdd5d44a-d038-42da-afe7-cecaad9f8ff9)" /><path d="M3,6.38A1.08,1.08,0,0,1,4.06,5.3H9a1.08,1.08,0,0,1,1.08,1.08h0A1.08,1.08,0,0,1,9,7.47H4.06A1.08,1.08,0,0,1,3,6.38Z" fill="#003067" /><path d="M3,3.17A1.08,1.08,0,0,1,4.06,2.09H9a1.08,1.08,0,0,1,1.08,1.08h0A1.08,1.08,0,0,1,9,4.25H4.06A1.08,1.08,0,0,1,3,3.17Z" fill="#003067" /><circle cx="4.11" cy="3.17" r="0.73" fill="#50e6ff" /><circle cx="4.11" cy="6.38" r="0.73" fill="#50e6ff" /></g><path d="M13.27,11.38c-1.77,0-3.21-.53-3.21-1.17V16.4c0,.63,1.42,1.15,3.17,1.16h0c1.78,0,3.21-.52,3.21-1.16V10.21C16.48,10.85,15.05,11.38,13.27,11.38Z" fill="url(#bf4a560d-147b-4f76-9d70-f90bc5f8ddd6)" /><path d="M16.48,10.21c0,.64-1.43,1.17-3.21,1.17s-3.21-.53-3.21-1.17,1.44-1.16,3.21-1.16,3.21.52,3.21,1.16" fill="#e6e6e6" /><path d="M15.73,10.12c0,.41-1.1.74-2.46.74s-2.46-.33-2.46-.74,1.1-.74,2.46-.74,2.46.33,2.46.74" fill="#50e6ff" /><path d="M13.68,8.66l2.13-2.13a.11.11,0,0,0-.08-.19H14.49c0-2.57-1.37-5.13-3.84-5.13a6.68,6.68,0,0,1,2,5.13H11.47a.11.11,0,0,0-.08.19l2.13,2.13A.12.12,0,0,0,13.68,8.66Z" fill="#50e6ff" /></g></g></svg>', Km = '<svg id="b300f0d1-2ad8-4418-a1c5-23d0b9d21841" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="b8cad6fd-ec7f-45e9-be2a-125e8b87bd03" x1="10.79" y1="2.17" x2="10.79" y2="16.56" gradientUnits="userSpaceOnUse"><stop offset="0.18" stop-color="#5ea0ef" /><stop offset="1" stop-color="#0078d4" /></linearGradient></defs><title>Icon-web-43</title><rect x="3.7" y="5.49" width="1.18" height="5.26" rx="0.52" transform="translate(-3.83 12.41) rotate(-90)" fill="#b3b3b3" /><rect x="2.04" y="7.88" width="1.18" height="5.26" rx="0.52" transform="translate(-7.88 13.14) rotate(-90)" fill="#a3a3a3" /><rect x="3.7" y="10.26" width="1.18" height="5.26" rx="0.52" transform="translate(-8.6 17.19) rotate(-90)" fill="#7a7a7a" /><path d="M18,11a3.28,3.28,0,0,0-2.81-3.18,4.13,4.13,0,0,0-4.21-4,4.23,4.23,0,0,0-4,2.8,3.89,3.89,0,0,0-3.38,3.8,4,4,0,0,0,4.06,3.86l.36,0h6.58l.17,0A3.32,3.32,0,0,0,18,11Z" fill="url(#b8cad6fd-ec7f-45e9-be2a-125e8b87bd03)" /></svg>', Qm = '<svg id="f9ed9690-6753-43a7-8b32-d66ac7b8a99a" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="f710a364-083f-494c-9d96-89b92ee2d5a8" x1="0.5" y1="9.77" x2="9" y2="9.77" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#005ba1" /><stop offset="0.07" stop-color="#0060a9" /><stop offset="0.36" stop-color="#0071c8" /><stop offset="0.52" stop-color="#0078d4" /><stop offset="0.64" stop-color="#0074cd" /><stop offset="0.81" stop-color="#006abb" /><stop offset="0.99" stop-color="#005ba1" /></linearGradient></defs><title>Icon-databases-126</title><g><path d="M13.25,10.48V6.57a.14.14,0,0,0-.24-.1l-4,4L4.85,14.63V17.5H16.93a.56.56,0,0,0,.57-.57V6.57a.14.14,0,0,0-.24-.1Z" fill="#005ba1" /><path d="M4.75,3.58C2.4,3.58.5,2.89.5,2V7.67h0v9.26a.56.56,0,0,0,.57.57H9V2C9,2.89,7.1,3.58,4.75,3.58Z" fill="url(#f710a364-083f-494c-9d96-89b92ee2d5a8)" /><rect x="12.91" y="12.97" width="2.27" height="2.27" rx="0.28" fill="#fff" /><rect x="8.97" y="12.97" width="2.27" height="2.27" rx="0.28" fill="#fff" /><rect x="5.03" y="12.97" width="2.27" height="2.27" rx="0.28" fill="#fff" /><path d="M9,2c0,.85-1.9,1.54-4.25,1.54S.5,2.89.5,2,2.4.5,4.75.5,9,1.19,9,2" fill="#eaeaea" /><path d="M8,1.91c0,.55-1.46,1-3.26,1s-3.26-.43-3.26-1S3,.94,4.75.94,8,1.37,8,1.91" fill="#50e6ff" /><path d="M4.75,2.14a8.07,8.07,0,0,0-2.58.37,7.64,7.64,0,0,0,2.58.38,7.64,7.64,0,0,0,2.58-.38A8.07,8.07,0,0,0,4.75,2.14Z" fill="#198ab3" /></g></svg>', Xm = '<svg id="f4337506-5d95-4e80-b7ca-68498c6e008e" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="ba420277-700e-42cc-9de9-5388a5c16e54" x1="9" y1="16.97" x2="9" y2="1.03" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0078d4" /><stop offset="0.16" stop-color="#1380da" /><stop offset="0.53" stop-color="#3c91e5" /><stop offset="0.82" stop-color="#559cec" /><stop offset="1" stop-color="#5ea0ef" /></linearGradient></defs><title>Icon-devops-261</title><path id="a91f0ca4-8fb7-4019-9c09-0a52e2c05754" d="M17,4v9.74l-4,3.28-6.2-2.26V17L3.29,12.41l10.23.8V4.44Zm-3.41.49L7.85,1V3.29L2.58,4.84,1,6.87v4.61l2.26,1V6.57Z" fill="url(#ba420277-700e-42cc-9de9-5388a5c16e54)" /></svg>', Jm = '<svg id="a2c88306-fa03-4e5b-b192-401f0b77808b" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="b403aca7-f387-4434-96b4-ae157edc835f" x1="-175.993" y1="-343.723" x2="-175.993" y2="-359.232" gradientTransform="translate(212.573 370.548) scale(1.156 1.029)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fea11b" /><stop offset="0.284" stop-color="#fea51a" /><stop offset="0.547" stop-color="#feb018" /><stop offset="0.8" stop-color="#ffc314" /><stop offset="1" stop-color="#ffd70f" /></linearGradient></defs><title>Icon-compute-29</title><g><path d="M2.37,7.475H3.2a.267.267,0,0,1,.267.267v6.148a.533.533,0,0,1-.533.533H2.1a0,0,0,0,1,0,0V7.741a.267.267,0,0,1,.267-.267Z" transform="translate(12.507 16.705) rotate(134.919)" fill="#50e6ff" /><path d="M2.325,3.6h.833a.267.267,0,0,1,.267.267v6.583a0,0,0,0,1,0,0H2.591a.533.533,0,0,1-.533-.533V3.865A.267.267,0,0,1,2.325,3.6Z" transform="translate(5.759 0.114) rotate(44.919)" fill="#1490df" /></g><g><path d="M14.53,7.475h.833a.533.533,0,0,1,.533.533v6.148a.267.267,0,0,1-.267.267H14.8a.267.267,0,0,1-.267-.267V7.475a0,0,0,0,1,0,0Z" transform="translate(12.223 -7.555) rotate(45.081)" fill="#50e6ff" /><path d="M15.108,3.6h.833a0,0,0,0,1,0,0v6.583a.267.267,0,0,1-.267.267h-.833a.267.267,0,0,1-.267-.267V4.131a.533.533,0,0,1,.533-.533Z" transform="translate(31.022 1.222) rotate(135.081)" fill="#1490df" /></g><path d="M8.459,9.9H4.87a.193.193,0,0,1-.2-.181.166.166,0,0,1,.018-.075L8.991,1.13a.206.206,0,0,1,.186-.106h4.245a.193.193,0,0,1,.2.181.165.165,0,0,1-.035.1L8.534,7.966h4.928a.193.193,0,0,1,.2.181.176.176,0,0,1-.052.122L5.421,16.788c-.077.046-.624.5-.356-.189h0Z" fill="url(#b403aca7-f387-4434-96b4-ae157edc835f)" /></svg>', tx = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="f67d1585-6164-4ad0-b2dd-f9cc59b2969f" x1="9.908" y1="15.943" x2="7.516" y2="2.383" gradientUnits="userSpaceOnUse"><stop offset="0.15" stop-color="#0078d4" /><stop offset="0.8" stop-color="#5ea0ef" /><stop offset="1" stop-color="#83b9f9" /></linearGradient></defs><g id="a4fd1868-54fe-4ca6-8ff6-3b01866dc27b"><path d="M14.49,7.15A5.147,5.147,0,0,0,9.24,2.164,5.272,5.272,0,0,0,4.216,5.653,4.869,4.869,0,0,0,0,10.4a4.946,4.946,0,0,0,5.068,4.814H13.82A4.292,4.292,0,0,0,18,11.127,4.105,4.105,0,0,0,14.49,7.15Z" fill="url(#f67d1585-6164-4ad0-b2dd-f9cc59b2969f)" /><path d="M12.9,11.4V8H12v4.13h2.46V11.4ZM5.76,9.73a1.825,1.825,0,0,1-.51-.31.441.441,0,0,1-.12-.32.342.342,0,0,1,.15-.3.683.683,0,0,1,.42-.12,1.62,1.62,0,0,1,1,.29V8.11a2.58,2.58,0,0,0-1-.16,1.641,1.641,0,0,0-1.09.34,1.08,1.08,0,0,0-.42.89c0,.51.32.91,1,1.21a2.907,2.907,0,0,1,.62.36.419.419,0,0,1,.15.32.381.381,0,0,1-.16.31.806.806,0,0,1-.45.11,1.66,1.66,0,0,1-1.09-.42V12a2.173,2.173,0,0,0,1.07.24,1.877,1.877,0,0,0,1.18-.33A1.08,1.08,0,0,0,6.84,11a1.048,1.048,0,0,0-.25-.7A2.425,2.425,0,0,0,5.76,9.73ZM11,11.32A2.191,2.191,0,0,0,11,9a1.808,1.808,0,0,0-.7-.75,2,2,0,0,0-1-.26,2.112,2.112,0,0,0-1.08.27A1.856,1.856,0,0,0,7.49,9a2.465,2.465,0,0,0-.26,1.14,2.256,2.256,0,0,0,.24,1,1.766,1.766,0,0,0,.69.74,2.056,2.056,0,0,0,1,.3l.86,1h1.21L10,12.08A1.79,1.79,0,0,0,11,11.32Zm-1-.25a.941.941,0,0,1-.76.35.916.916,0,0,1-.76-.36,1.523,1.523,0,0,1-.29-1,1.529,1.529,0,0,1,.29-1,1,1,0,0,1,.78-.37.869.869,0,0,1,.75.37,1.619,1.619,0,0,1,.27,1A1.459,1.459,0,0,1,10,11.07Z" fill="#f2f2f2" /></g>​
</svg>`, ex = '<svg id="b089cfca-0de1-451c-a1ca-6680ea50cb4f" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><radialGradient id="b25d0836-964a-4c84-8c20-855f66e8345e" cx="-105.006" cy="-10.409" r="5.954" gradientTransform="translate(117.739 19.644) scale(1.036 1.027)" gradientUnits="userSpaceOnUse"><stop offset="0.183" stop-color="#5ea0ef" /><stop offset="1" stop-color="#0078d4" /></radialGradient><clipPath id="b36c7f5d-2ef1-4760-8a25-eeb9661f4e47"><path d="M14.969,7.53A6.137,6.137,0,1,1,7.574,2.987,6.137,6.137,0,0,1,14.969,7.53Z" fill="none" /></clipPath></defs><title>Icon-databases-121</title><path d="M2.954,5.266a.175.175,0,0,1-.176-.176h0A2.012,2.012,0,0,0,.769,3.081a.176.176,0,0,1-.176-.175h0a.176.176,0,0,1,.176-.176A2.012,2.012,0,0,0,2.778.72.175.175,0,0,1,2.954.544h0A.175.175,0,0,1,3.13.72h0A2.012,2.012,0,0,0,5.139,2.729a.175.175,0,0,1,.176.176h0a.175.175,0,0,1-.176.176h0A2.011,2.011,0,0,0,3.13,5.09.177.177,0,0,1,2.954,5.266Z" fill="#50e6ff" /><path d="M15.611,17.456a.141.141,0,0,1-.141-.141h0a1.609,1.609,0,0,0-1.607-1.607.141.141,0,0,1-.141-.14h0a.141.141,0,0,1,.141-.141h0a1.608,1.608,0,0,0,1.607-1.607.141.141,0,0,1,.141-.141h0a.141.141,0,0,1,.141.141h0a1.608,1.608,0,0,0,1.607,1.607.141.141,0,1,1,0,.282h0a1.609,1.609,0,0,0-1.607,1.607A.141.141,0,0,1,15.611,17.456Z" fill="#50e6ff" /><g><path d="M14.969,7.53A6.137,6.137,0,1,1,7.574,2.987,6.137,6.137,0,0,1,14.969,7.53Z" fill="url(#b25d0836-964a-4c84-8c20-855f66e8345e)" /><g clip-path="url(#b36c7f5d-2ef1-4760-8a25-eeb9661f4e47)"><path d="M5.709,13.115A1.638,1.638,0,1,0,5.714,9.84,1.307,1.307,0,0,0,5.721,9.7,1.651,1.651,0,0,0,4.06,8.064H2.832a6.251,6.251,0,0,0,1.595,5.051Z" fill="#f2f2f2" /><path d="M15.045,7.815c0-.015,0-.03-.007-.044a5.978,5.978,0,0,0-1.406-2.88,1.825,1.825,0,0,0-.289-.09,1.806,1.806,0,0,0-2.3,1.663,2,2,0,0,0-.2-.013,1.737,1.737,0,0,0-.581,3.374,1.451,1.451,0,0,0,.541.1h2.03A13.453,13.453,0,0,0,15.045,7.815Z" fill="#f2f2f2" /></g></g><path d="M17.191,3.832c-.629-1.047-2.1-1.455-4.155-1.149a14.606,14.606,0,0,0-2.082.452,6.456,6.456,0,0,1,1.528.767c.241-.053.483-.116.715-.151A7.49,7.49,0,0,1,14.3,3.662a2.188,2.188,0,0,1,1.959.725h0c.383.638.06,1.729-.886,3a16.723,16.723,0,0,1-4.749,4.051A16.758,16.758,0,0,1,4.8,13.7c-1.564.234-2.682,0-3.065-.636s-.06-1.73.886-2.995c.117-.157.146-.234.279-.392a6.252,6.252,0,0,1,.026-1.63A11.552,11.552,0,0,0,1.756,9.419C.517,11.076.181,12.566.809,13.613a3.165,3.165,0,0,0,2.9,1.249,8.434,8.434,0,0,0,1.251-.1,17.855,17.855,0,0,0,6.219-2.4,17.808,17.808,0,0,0,5.061-4.332C17.483,6.369,17.819,4.88,17.191,3.832Z" fill="#50e6ff" /></svg>', nx = '<svg id="b5b638e5-1de7-4378-8f50-7c3738e5874c" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="e20ae4ca-8128-4625-bcc6-863bc1bc51d9" x1="5.05" y1="10.55" x2="5.05" y2="13.48" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#76bc2d" /><stop offset="1" stop-color="#5e9624" /></linearGradient><linearGradient id="b6fa89de-29eb-462e-97de-5bdbdaeb090e" x1="12.84" y1="10.57" x2="12.84" y2="13.5" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#76bc2d" /><stop offset="1" stop-color="#5e9624" /></linearGradient></defs><title>Icon-integration-204</title><g><path d="M3.19,15.6a2.49,2.49,0,0,1-1.53-.38,1.7,1.7,0,0,1-.45-1.36V10.33c0-.58-.23-.89-.71-.89V8.56c.48,0,.71-.31.71-.92V4.17a1.79,1.79,0,0,1,.45-1.39A2.29,2.29,0,0,1,3.19,2.4v.89c-.51,0-.79.27-.79.85v3.4c0,.78-.23,1.26-.74,1.46a1.42,1.42,0,0,1,.74,1.46v3.37a1.25,1.25,0,0,0,.17.68.74.74,0,0,0,.58.2l0,.89Z" fill="#949494" /><path d="M14.81,2.4a2.49,2.49,0,0,1,1.53.38,1.7,1.7,0,0,1,.45,1.36V7.67c0,.58.23.89.71.89v.88c-.48,0-.71.31-.71.92v3.43a1.8,1.8,0,0,1-.45,1.4,2.28,2.28,0,0,1-1.53.41v-.89c.51,0,.79-.27.79-.85v-3.4c0-.78.23-1.26.74-1.46a1.42,1.42,0,0,1-.74-1.46V4.17a1.25,1.25,0,0,0-.17-.68.74.74,0,0,0-.58-.2Z" fill="#949494" /><path d="M9.41,8.35V7.08h-.9V8.35a.18.18,0,0,1-.18.18H5a.36.36,0,0,0-.36.36v1.65h.9V9.63a.18.18,0,0,1,.17-.18h6.54a.18.18,0,0,1,.18.18v.93h.89V8.89a.36.36,0,0,0-.35-.36H9.59A.18.18,0,0,1,9.41,8.35Z" fill="#005ba1" /><path d="M10.61,3.21H7.25a.38.38,0,0,0-.38.37V6.94a.37.37,0,0,0,.38.37h3.36A.37.37,0,0,0,11,6.94V3.58A.38.38,0,0,0,10.61,3.21Zm-.32,3.17a.25.25,0,0,1-.25.24H7.81a.25.25,0,0,1-.25-.24V4.15a.25.25,0,0,1,.25-.25H10a.25.25,0,0,1,.25.25Z" fill="#0078d4" /><rect x="3.58" y="10.55" width="2.94" height="2.94" rx="0.27" fill="url(#e20ae4ca-8128-4625-bcc6-863bc1bc51d9)" /><rect x="11.38" y="10.57" width="2.94" height="2.94" rx="0.27" fill="url(#b6fa89de-29eb-462e-97de-5bdbdaeb090e)" /></g></svg>', rx = '<svg id="fd454f1c-5506-44b8-874e-8814b8b2f70b" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="f34d9569-2bd0-4002-8f16-3d01d8106cb5" x1="8.88" y1="12.21" x2="8.88" y2="0.21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0078d4" /><stop offset="0.82" stop-color="#5ea0ef" /></linearGradient><linearGradient id="bdb45a0b-eb58-4970-a60a-fb2ce314f866" x1="8.88" y1="16.84" x2="8.88" y2="12.21" gradientUnits="userSpaceOnUse"><stop offset="0.15" stop-color="#ccc" /><stop offset="1" stop-color="#707070" /></linearGradient></defs><title>Icon-compute-21</title><rect x="-0.12" y="0.21" width="18" height="12" rx="0.6" fill="url(#f34d9569-2bd0-4002-8f16-3d01d8106cb5)" /><polygon points="11.88 4.46 11.88 7.95 8.88 9.71 8.88 6.21 11.88 4.46" fill="#50e6ff" /><polygon points="11.88 4.46 8.88 6.22 5.88 4.46 8.88 2.71 11.88 4.46" fill="#c3f1ff" /><polygon points="8.88 6.22 8.88 9.71 5.88 7.95 5.88 4.46 8.88 6.22" fill="#9cebff" /><polygon points="5.88 7.95 8.88 6.21 8.88 9.71 5.88 7.95" fill="#c3f1ff" /><polygon points="11.88 7.95 8.88 6.21 8.88 9.71 11.88 7.95" fill="#9cebff" /><path d="M12.49,15.84c-1.78-.28-1.85-1.56-1.85-3.63H7.11c0,2.07-.06,3.35-1.84,3.63a1,1,0,0,0-.89,1h9A1,1,0,0,0,12.49,15.84Z" fill="url(#bdb45a0b-eb58-4970-a60a-fb2ce314f866)" /></svg>', sx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#669df6;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#aecbfa;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_BigTable_Color</title><g data-name="Product Icons"><g ><path class="cls-1" d="M16.22,6.45,12,3.94a2.86,2.86,0,0,1-1.25-1.71s.16-.32.38-.2,3.5,2.06,5.25,3.1c.63.37.24,2,.24,2A.77.77,0,0,0,16.22,6.45Z"/><path class="cls-2" d="M17.49,12.69a.35.35,0,0,1-.16.33l-1,.68V5.75c0-.27.17-.56-.06-.7l.92.68a.73.73,0,0,1,.35.65Z"/><path class="cls-1" d="M12,13.6a.36.36,0,0,1-.2-.06L8.34,11.48v.9L12,14.56l.29-.57s-.22-.39-.29-.39Z"/><path class="cls-1" d="M12.2,15.4a.36.36,0,0,1-.4,0L8.34,13.34V14a.42.42,0,0,0,.19.35l3.28,2a.37.37,0,0,0,.38,0,2,2,0,0,0,.2-.52l-.19-.39Z"/><path class="cls-2" d="M12,12.73l3.66-2.18v-.43a.39.39,0,0,0-.19-.34l-3.28-2a.37.37,0,0,0-.38,0l-3.28,2a.41.41,0,0,0-.19.34v.43L12,12.73Z"/><path class="cls-1" d="M12,11.83,8.53,9.78a.41.41,0,0,0-.19.34v.43L12,12.73l.28-.56L12,11.83Z"/><path class="cls-3" d="M12,13.6v1l3.66-2.18v-.9L12.2,13.54a.65.65,0,0,1-.2.06Z"/><path class="cls-3" d="M12.2,15.4a.36.36,0,0,1-.2.06c0,.28,0,.9,0,.9a.5.5,0,0,0,.21-.05l3.28-2a.39.39,0,0,0,.19-.35v-.66L12.2,15.4Z"/><path class="cls-3" d="M15.47,9.78,12,11.83v.9l3.66-2.18v-.43a.39.39,0,0,0-.19-.34Z"/><path class="cls-1" d="M7.78,17.53,11.93,20a2.72,2.72,0,0,1,1.28,1.8.18.18,0,0,1-.28.18L7.48,18.75c-.53-.32-.07-1.88-.07-1.88A.77.77,0,0,0,7.78,17.53Z"/><path class="cls-2" d="M6.51,17.73V11.17a.41.41,0,0,1,.19-.33l1-.59v7.91c0,.27,0,.69.21.83l-1.06-.66A.75.75,0,0,1,6.51,17.73Z"/><path class="cls-1" d="M10.16,5.46a.75.75,0,0,0-.74,0L5.22,8a2.63,2.63,0,0,1-2.08.26.23.23,0,0,1,0-.4c.18-.09,6.32-3.74,6.32-3.74.23-.14.74,1.39.74,1.39Z"/><path class="cls-2" d="M10.15,4.08l5.32,3.15a.37.37,0,0,1,.2.31V8.72L9,4.76a.75.75,0,0,0-.74,0l1.18-.69a.71.71,0,0,1,.73,0Z"/><path class="cls-1" d="M13.82,18.49a.73.73,0,0,0,.74,0L18.76,16a2.63,2.63,0,0,1,2.1-.25.21.21,0,0,1,0,.38l-6.33,3.75c-.22.14-.74-1.4-.74-1.4Z"/><path class="cls-2" d="M8.51,16.75a.56.56,0,0,1-.17-.33V15.26L15,19.19a.69.69,0,0,0,.73,0l-1.18.7a.7.7,0,0,1-.74,0Z"/><path class="cls-1" d="M6.26,9.81a.76.76,0,0,0-.37.65v5a2.75,2.75,0,0,1-.87,2,.18.18,0,0,1-.3-.13V9.77c0-.28,1.54,0,1.54,0Z"/><path class="cls-2" d="M9.77,6.52a.34.34,0,0,1,.36,0l1,.59L5.05,10.67a.77.77,0,0,0-.37.66V9.94a.72.72,0,0,1,.38-.64Z"/><path class="cls-1" d="M18.17,13.44v-5a2.81,2.81,0,0,1,.84-2s.33-.11.31.21,0,7.37,0,7.37c-.31.37-1.61,0-1.61,0A.81.81,0,0,0,18.17,13.44Z"/><path class="cls-2" d="M19,14.61l-4.74,2.85a.35.35,0,0,1-.37,0l-1-.57L19,13.22a.77.77,0,0,0,.37-.66V14C19.35,14.23,19,14.61,19,14.61Z"/></g></g></svg>', ix = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_BigQuery_Color</title><g data-name="Product Icons"><g ><path class="cls-1" d="M6.73,10.83v2.63A4.91,4.91,0,0,0,8.44,15.2V10.83Z"/><path class="cls-2" d="M9.89,8.41v7.53A7.62,7.62,0,0,0,11,16,8,8,0,0,0,12,16V8.41Z"/><path class="cls-1" d="M13.64,11.86v3.29a5,5,0,0,0,1.7-1.82V11.86Z"/><path class="cls-3" d="M17.74,16.32l-1.42,1.42a.42.42,0,0,0,0,.6l3.54,3.54a.42.42,0,0,0,.59,0l1.43-1.43a.42.42,0,0,0,0-.59l-3.54-3.54a.42.42,0,0,0-.6,0"/><path class="cls-2" d="M11,2a9,9,0,1,0,9,9,9,9,0,0,0-9-9m0,15.69A6.68,6.68,0,1,1,17.69,11,6.68,6.68,0,0,1,11,17.69"/></g></g></svg>', ox = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#669df6;}.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-3{fill:#aecbfa;}.cls-4{fill:#4285f4;}</style></defs><title>Icon_24px_CDN_Color</title><g data-name="Product Icons"><rect class="cls-1" x="2" y="2" width="20" height="20"/><g ><polygon id="Fill-1" class="cls-2" points="12 2 12 4.41 15.13 7.63 15.13 5.21 12 2"/><polygon id="Fill-1-Copy-2" class="cls-2" points="19.5 12 16.38 15.13 18.88 15.13 22 12 19.5 12"/><polygon id="Fill-1-Copy-3" class="cls-2" points="4.5 12 7.63 15.13 5.13 15.13 2 12 4.5 12"/><polygon id="Fill-1-Copy" class="cls-2" points="12 22 12 19.59 15.13 16.38 15.13 18.79 12 22"/><polygon id="Fill-2" class="cls-3" points="12 2 8.88 5.21 8.88 7.63 12 4.41 12 2"/><polygon id="Fill-2-Copy-2" class="cls-3" points="18.88 8.88 16.38 8.88 19.5 12 22 12 18.88 8.88"/><polygon id="Fill-2-Copy-3" class="cls-3" points="5.13 8.88 7.63 8.88 4.5 12 2 12 5.13 8.88"/><polygon id="Fill-2-Copy" class="cls-3" points="12 22 8.88 18.79 8.88 16.38 12 19.59 12 22"/><polygon id="Fill-9" class="cls-3" points="15.13 15.13 8.88 15.13 8.88 8.88 15.13 8.88 15.13 15.13"/><polygon id="Fill-10" class="cls-2" points="15.13 8.88 15.13 15.13 8.88 15.13 15.13 8.88"/><polygon class="cls-4" points="15.13 8.88 15.13 15.13 12 12 15.13 8.88"/></g></g></svg>', ax = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#4285f4;}.cls-2{fill:#669df6;}.cls-3{fill:#aecbfa;}.cls-4{fill:#fff;}</style></defs><title>Icon_24px_DNS_Color</title><g data-name="Product Icons"><g data-name="colored-32/dns"><g ><polygon id="Fill-1" class="cls-1" points="13 18 11 18 11 8 13 8 13 18"/><polygon id="Fill-2" class="cls-2" points="2 21 22 21 22 19 2 19 2 21"/><polygon id="Fill-3" class="cls-3" points="10 22 14 22 14 18 10 18 10 22"/></g></g><rect class="cls-3" x="2" y="2" width="20" height="6"/><rect class="cls-2" x="12" y="2" width="10" height="6"/><rect class="cls-4" x="4" y="4" width="2" height="2"/><rect class="cls-3" x="2" y="10" width="20" height="6"/><rect class="cls-2" x="12" y="10" width="10" height="6"/><rect class="cls-4" x="4" y="12" width="2" height="2"/></g></svg>', lx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#4285f4;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#aecbfa;}.cls-3{fill:#669df6;}</style></defs><title>Icon_24px_Interconnect_Color</title><g data-name="Product Icons"><g ><polygon id="Fill-3" class="cls-1" points="2 13 6 13 6 11 2 11 2 13"/><polygon id="Fill-6" class="cls-2" points="15 17 5 17 5 7 15 7 15 17"/><polygon id="Fill-1" class="cls-1" points="17.33 13 22 13 22 11 17.33 11 17.33 13"/><polygon class="cls-3" points="8 3 8 5 17 5 17 19 8 19 8 21 19 21 19 19 19 5 19 3 8 3"/><polygon id="Fill-7" class="cls-3" points="15 17 10 17 10 7 15 7 15 17"/></g></g></svg>', cx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}.cls-4{fill:#aecbfa;}</style></defs><title>Icon_24px_LoadBalancing_Color</title><g data-name="Product Icons"><g data-name="colored-32/load-balancing"><rect class="cls-1" width="24" height="24"/><g ><rect class="cls-2" x="18" y="12" width="2" height="4"/><rect class="cls-2" x="11" y="12" width="2" height="4"/><rect class="cls-2" x="4" y="12" width="2" height="4"/><polygon id="Fill-2" class="cls-3" points="13 11 11 11 11 7 13 7 13 11"/><rect class="cls-2" x="4" y="11" width="16" height="2"/><rect class="cls-4" x="6" y="2" width="12" height="5"/><rect class="cls-2" x="12" y="2" width="6" height="5"/><rect class="cls-4" x="16" y="16" width="6" height="6"/><rect class="cls-4" x="2" y="16" width="6" height="6"/><rect class="cls-2" x="5" y="16" width="3" height="6"/><rect class="cls-4" x="9" y="16" width="6" height="6"/><rect class="cls-2" x="12" y="16" width="3" height="6"/><rect class="cls-2" x="19" y="16" width="3" height="6"/></g></g></g></svg>', hx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_SQL_Color</title><g data-name="Product Icons"><g ><polygon class="cls-1" points="4.67 10.44 4.67 13.45 12 17.35 12 14.34 4.67 10.44"/><polygon class="cls-1" points="4.67 15.09 4.67 18.1 12 22 12 18.99 4.67 15.09"/><polygon class="cls-2" points="12 17.35 19.33 13.45 19.33 10.44 12 14.34 12 17.35"/><polygon class="cls-2" points="12 22 19.33 18.1 19.33 15.09 12 18.99 12 22"/><polygon class="cls-3" points="19.33 8.91 19.33 5.9 12 2 12 5.01 19.33 8.91"/><polygon class="cls-2" points="12 2 4.67 5.9 4.67 8.91 12 5.01 12 2"/><polygon class="cls-1" points="4.67 5.87 4.67 8.89 12 12.79 12 9.77 4.67 5.87"/><polygon class="cls-2" points="12 12.79 19.33 8.89 19.33 5.87 12 9.77 12 12.79"/></g></g></svg>', ux = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}.cls-4{fill:#fff;}</style></defs><title>Icon_24px_CloudStorage_Color</title><g data-name="Product Icons"><rect class="cls-1" x="2" y="4" width="20" height="7"/><rect class="cls-2" x="20" y="4" width="2" height="7"/><polygon class="cls-3" points="22 4 20 4 20 11 22 4"/><rect class="cls-2" x="2" y="4" width="2" height="7"/><rect class="cls-4" x="6" y="7" width="6" height="1"/><rect class="cls-4" x="15" y="6" width="3" height="3" rx="1.5"/><rect class="cls-1" x="2" y="13" width="20" height="7"/><rect class="cls-2" x="20" y="13" width="2" height="7"/><polygon class="cls-3" points="22 13 20 13 20 20 22 13"/><rect class="cls-2" x="2" y="13" width="2" height="7"/><rect class="cls-4" x="6" y="16" width="6" height="1"/><rect class="cls-4" x="15" y="15" width="3" height="3" rx="1.5"/></g></svg>', dx = `<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M14.7110701,8.84507935 C14.7717439,8.84507935 14.8231931,8.88719721 14.8413458,8.94564457 L14.8483412,8.99213893 L14.8483412,9.80096662 C14.8483412,9.86590813 14.8090267,9.92106136 14.7544697,9.94052499 L14.7110701,9.9480262 L14.1619856,9.9480262 L14.1619856,11.3971513 C14.1619856,11.4393574 14.1689102,11.4810733 14.1822916,11.5204472 L14.2071478,11.5775199 L17.9097614,18.3983638 C18.0128912,18.5897093 18.0276241,18.8190863 17.9539599,19.0212979 L17.9097614,19.1198381 L16.5667009,21.6392628 C16.4635711,21.8306084 16.2854576,21.9589644 16.0851783,21.9917325 L15.983436,22 L8.01656405,22 C7.8103044,22 7.61750853,21.8989791 7.49086453,21.7295356 L7.43329911,21.6392628 L6.09023859,19.1198381 C5.98710877,18.9284926 5.97237594,18.6991157 6.0460401,18.496904 L6.09023859,18.3983638 L9.78310593,11.5775199 C9.80278146,11.5409511 9.8205962,11.5011143 9.83028652,11.4598613 L9.83794574,11.3971513 L9.83794574,9.9480262 L9.28886131,9.9480262 C9.22824239,9.9480262 9.17676023,9.90586128 9.15859212,9.84743274 L9.1515902,9.80096662 L9.1515902,8.99213893 C9.1515902,8.9271386 9.19094857,8.87202066 9.24548803,8.85257351 L9.28886131,8.84507935 L14.7110701,8.84507935 Z M13.1324523,9.9480262 L10.867479,9.9480262 L10.867479,11.6220054 C10.867479,11.7170243 10.8499898,11.810761 10.8163145,11.8979731 L10.7772919,11.9828161 L7.23720733,18.5909383 C7.18910754,18.6801741 7.17948758,18.7860688 7.2083826,18.8820057 L7.23727597,18.9516755 L8.15266835,20.6500666 C8.20076815,20.7393612 8.28154945,20.8012203 8.37354086,20.8223922 L8.44430082,20.8304352 L9.572,20.83 L8.57527805,18.9792271 C8.52717825,18.8899325 8.51755829,18.7840732 8.54641817,18.6881527 L8.57527805,18.6184899 L9.44379234,17.006864 L15.913,17.006 L15.399,16.047 L13.0053393,16.0472267 L12.6160384,15.3248701 L15.012,15.324 L14.292,13.979 L11.8745205,13.9792234 L11.4852196,13.2568668 L13.904,13.256 L13.2227081,11.9828161 C13.1783867,11.9005363 13.1497785,11.8099843 13.1382445,11.7164027 L13.1324523,11.6220054 L13.1324523,9.9480262 Z M16.347,17.815 L13.9560996,17.8156917 L14.3454004,18.5509896 L16.741,18.55 L16.347,17.815 Z M10.630604,5.77278412 C11.0025401,5.77278412 11.3040561,6.09587402 11.3040561,6.49433196 C11.3040561,6.89278989 11.0025401,7.21580626 10.630604,7.21580626 C10.258668,7.21580626 9.95715197,6.89278989 9.95715197,6.49433196 C9.95715197,6.09587402 10.258668,5.77278412 10.630604,5.77278412 Z M13.1716089,4.22465851 C13.7295473,4.22465851 14.1818556,4.7091463 14.1818556,5.30686996 C14.1818556,5.9045201 13.7295473,6.38908141 13.1716089,6.38908141 C12.6136705,6.38908141 12.1614308,5.9045201 12.1614308,5.30686996 C12.1614308,4.7091463 12.6136705,4.22465851 13.1716089,4.22465851 Z M11.6407615,2 C12.0126976,2 12.3142822,2.3230899 12.3142822,2.72154783 C12.3142822,3.12000576 12.0126976,3.44302213 11.6407615,3.44302213 C11.2688941,3.44302213 10.9673095,3.12000576 10.9673095,2.72154783 C10.9673095,2.3230899 11.2688941,2 11.6407615,2 Z" fill="#4285F4"></path>
    </g>
</svg>`, px = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#aecbfa;}.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-3{fill:#4285f4;}.cls-4{fill:#669df6;}</style></defs><title>Icon_24px_DataProc_Color</title><g data-name="Product Icons"><rect class="cls-1" x="2" y="2" width="20" height="20"/><g ><polygon class="cls-2" points="17.85 14.2 7.67 20.08 6.69 18.4 16.88 12.51 17.85 14.2"/><polygon class="cls-2" points="7.63 18.16 7.63 6.4 9.5 6.4 9.5 16.75 7.63 18.16"/><polygon class="cls-2" points="9.56 9.69 9.3 7.33 19.49 13.2 18.52 14.88 9.56 9.69"/><path class="cls-3" d="M14.39,10.26,9.3,7.33l.26,2.36,1.51.86a4,4,0,0,0,3.32-.29Z"/><path class="cls-2" d="M8.13,8.29h0a3.78,3.78,0,1,1,3.27,1.89A3.8,3.8,0,0,1,8.13,8.29ZM13,5.49a1.84,1.84,0,0,0-1.59-.92A1.83,1.83,0,0,0,9.57,6.4a1.84,1.84,0,1,0,3.67,0A1.8,1.8,0,0,0,13,5.49Z"/><path class="cls-3" d="M7.63,12.94v5.22L9.5,16.75V15.12a3.29,3.29,0,0,0-1.87-2.18Z"/><path class="cls-3" d="M13.33,16.81l4.52-2.61-2.21-1L14.39,14a4.23,4.23,0,0,0-1.06,2.86Z"/><path class="cls-2" d="M2.51,18.7h0a3.77,3.77,0,0,1,1.38-5.16,3.72,3.72,0,0,1,2.86-.38A3.78,3.78,0,1,1,2.51,18.7Zm4.85-2.81A1.79,1.79,0,0,0,6.25,15a1.83,1.83,0,0,0-2.06,2.69h0a1.83,1.83,0,1,0,3.17-1.84Z"/><path class="cls-2" d="M14.33,18.36h0a3.79,3.79,0,0,1,0-3.77,3.79,3.79,0,0,1,5.16-1.39,3.78,3.78,0,0,1,1.38,5.16,3.78,3.78,0,0,1-6.54,0Zm4.86-2.81a2,2,0,0,0-.67-.67,1.85,1.85,0,0,0-2.51.68,1.86,1.86,0,0,0,0,1.83,1.83,1.83,0,0,0,2.07.85,1.82,1.82,0,0,0,1.11-.85,1.88,1.88,0,0,0,0-1.84Z"/><path class="cls-4" d="M9.49,16.15s-2.34,2-2.8,2.25l2.86-1.65a4.07,4.07,0,0,0-.06-.6Z"/><path class="cls-4" d="M10.15,10S9.56,6.72,9.56,6.4V9.69a3.47,3.47,0,0,0,.59.27Z"/><path class="cls-4" d="M15.3,13.47s2.76,1.15,3.22,1.41l-2.86-1.64a1.69,1.69,0,0,0-.36.23Z"/></g></g></svg>', fx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#669df6;}.cls-1,.cls-2{fill-rule:evenodd;}.cls-2{fill:#4285f4;}</style></defs><title>Icon_24px_IAM_Color</title><g data-name="Product Icons"><g ><path class="cls-1" d="M12,2,3.79,5.42v5.63c0,5.06,3.5,9.8,8.21,11,4.71-1.15,8.21-5.89,8.21-10.95V5.42Zm0,3.79a2.63,2.63,0,1,1-1.86.77A2.63,2.63,0,0,1,12,5.79Zm4.11,11.15A8.64,8.64,0,0,1,12,19.87a8.64,8.64,0,0,1-4.11-2.93V14.69c0-1.67,2.74-2.52,4.11-2.52s4.11.85,4.11,2.52v2.25Z"/><path class="cls-2" d="M12,2V5.79a2.63,2.63,0,1,1,0,5.26v1.12c1.37,0,4.11.85,4.11,2.52v2.25A8.64,8.64,0,0,1,12,19.87V22c4.71-1.15,8.21-5.89,8.21-10.95V5.42Z"/></g></g></svg>', gx = `<svg version="1.1" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" overflow="visible" xml:space="preserve">
<g >
	<g transform="translate(4.000000, 1.000000)">
		<path fill="#85A4E6" d="M8,0l-9,4v6c0,5.6,3.8,10.7,9,12c5.2-1.3,9-6.4,9-12V4L8,0z M8,11h7c-0.5,4.1-3.3,7.8-7,8.9V11l-7,0V5.3
			l7-3.1V11z"/>
		<path fill="#5C85DE" d="M8,0v22c5.2-1.3,9-6.4,9-12V4L8,0z M15,11c-0.5,4.1-3.3,7.8-7,8.9V11L15,11z"/>
		<path fill-rule="evenodd" fill="#3367D6" d="M17,11h-2c0,0,0,0.3-0.1,0.6L17,11z"/>
		<polygon fill-rule="evenodd" fill="#3367D6" points="-1,11 1,11 1,10.4 		"/>
	</g>
</g>
</svg>
`, mx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:#aecbfa;}.cls-2{fill:#669df6;}.cls-3{fill:#4285f4;}</style></defs><title>Icon_24px_VirtualPrivateCloud_Color</title><g data-name="Product Icons"><rect class="cls-1" x="16" y="2" width="6" height="6"/><rect class="cls-2" x="19" y="2" width="3" height="6"/><rect class="cls-1" x="16" y="16" width="6" height="6"/><rect class="cls-2" x="19" y="16" width="3" height="6"/><rect class="cls-1" x="2" y="2" width="6" height="6"/><rect class="cls-2" x="5" y="2" width="3" height="6"/><rect class="cls-1" x="2" y="16" width="6" height="6"/><rect class="cls-2" x="5" y="16" width="3" height="6"/><rect class="cls-2" x="8" y="4" width="8" height="2"/><rect class="cls-2" x="8" y="18" width="8" height="2"/><rect class="cls-2" x="18" y="8" width="2" height="8"/><rect class="cls-2" x="4" y="8" width="2" height="8"/><rect class="cls-3" x="4" y="8" width="2" height="2"/><rect class="cls-3" x="18" y="8" width="2" height="2"/><rect class="cls-3" x="8" y="4" width="2" height="2"/><rect class="cls-3" x="8" y="18" width="2" height="2"/></g></svg>', xx = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{filter:url(#luminosity-noclip);}.cls-2{fill:#669df6;}.cls-3{mask:url(#mask);}.cls-4{fill:#4285f4;}.cls-5{fill:#aecbfa;}</style><filter id="luminosity-noclip" x="4.64" y="4.19" width="14.73" height="12.76" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-color="#fff" result="bg"/><feBlend in="SourceGraphic" in2="bg"/></filter><mask id="mask" x="4.64" y="4.19" width="14.73" height="12.76" maskUnits="userSpaceOnUse"><circle class="cls-1" cx="12" cy="12.23" r="3.58"/></mask></defs><title>Icon_24px_Pub-Sub_Color</title><g data-name="Product Icons"><circle class="cls-2" cx="18.97" cy="8.21" r="1.72"/><circle class="cls-2" cx="5.03" cy="8.21" r="1.72"/><circle class="cls-2" cx="12" cy="20.28" r="1.72"/><g class="cls-3"><rect class="cls-4" x="14.69" y="10.22" width="1.59" height="8.04" transform="matrix(0.5, -0.87, 0.87, 0.5, -4.59, 20.53)"/><rect class="cls-4" x="4.49" y="13.45" width="8.04" height="1.59" transform="translate(-5.98 6.17) rotate(-30)"/><rect class="cls-4" x="11.2" y="4.19" width="1.59" height="8.04"/></g><circle class="cls-5" cx="12" cy="12.23" r="2.78"/><circle class="cls-5" cx="5.03" cy="16.25" r="2.19"/><circle class="cls-5" cx="18.97" cy="16.25" r="2.19"/><circle class="cls-5" cx="12" cy="4.19" r="2.19"/></g></svg>', Lx = '<svg id="Artwork" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><circle cx="11.45" cy="11.51" r="2.89" style="fill:#669df6"/><path d="M18.05,6.81a8.12,8.12,0,0,0-4.94-3.23l-.27,1.3A6.79,6.79,0,1,1,6.65,6.74l-1-.94a8.1,8.1,0,1,0,13,2.12A1.31,1.31,0,0,1,18.05,6.81Z" style="fill:#aecbfa"/><path d="M14.46,20.42a2,2,0,1,1,0-3.93" style="fill:#669df6"/><path d="M14.46,16.49a2,2,0,1,1,0,3.93" style="fill:#4285f4"/><path d="M19.38,8.1a1.34,1.34,0,0,1,0-2.67v-1h0a2.38,2.38,0,0,0,0,4.75Z" style="fill:#669df6"/><path d="M19.38,5.43a1.34,1.34,0,0,1,0,2.67v1h0a2.38,2.38,0,0,0,0-4.75Z" style="fill:#4285f4"/><path d="M4.22,12.78a2,2,0,1,1,0-3.93" style="fill:#669df6"/><path d="M4.22,8.85a2,2,0,0,1,0,3.93" style="fill:#4285f4"/></svg>', yx = '<svg id="Artwork" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><polygon points="11.19 11.35 15.75 3.51 6.75 3.51 2.25 11.35 11.19 11.35" style="fill:#aecbfa"/><polygon points="2.25 12.65 6.74 20.49 15.73 20.49 11.25 12.65 2.25 12.65" style="fill:#4285f4"/><path d="M21.75,12l-4.5-7.87L12.74,12l4.51,7.87Z" style="fill:#669df6"/></svg>', vx = '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><defs><style>.cls-1{fill:none;}.cls-2{fill:#669df6;}.cls-3{fill:#aecbfa;}.cls-4{fill:#4285f4;}</style></defs><title>Icon_24px_VisionAPI_Color</title><g data-name="Product Icons"><g data-name="colored-32/vision"><rect class="cls-1" width="24" height="24"/><g ><polygon class="cls-2" points="6 12 12 16.99 12 20 2 12 6 12"/><polygon id="Shape-2" data-name="Shape" class="cls-2" points="12 16.99 18 12 22 12 12 20 12 16.99"/><polygon id="Shape-3" data-name="Shape" class="cls-3" points="2 12 12 4 12 7.01 6 12 2 12"/><polygon id="Shape-4" data-name="Shape" class="cls-3" points="12 7.01 18 12 22 12 12 4 12 7.01"/><circle id="Oval" class="cls-4" cx="12" cy="12" r="2"/></g></g></g></svg>', B2 = {
  actor: wm,
  boundary: Cm,
  control: _m,
  database: km,
  entity: Em,
  cloudwatch: Tm,
  cloudfront: Am,
  cognito: Sm,
  dynamodb: Rm,
  ebs: Im,
  ec2: Om,
  ecs: Nm,
  efs: zl,
  elasticache: Pm,
  elasticbeantalk: Mm,
  elasticfilesystem: zl,
  glacier: Fm,
  iam: zm,
  kinesis: Dm,
  lambda: Bm,
  lightsail: Um,
  rds: Hm,
  redshift: Gm,
  s3: $m,
  sns: jm,
  sqs: Vm,
  sagemaker: qm,
  vpc: Zm,
  azureactivedirectory: Wm,
  azurebackup: Ym,
  azurecdn: Km,
  azuredatafactory: Qm,
  azuredevops: Xm,
  azurefunction: Jm,
  azuresql: tx,
  cosmosdb: ex,
  logicapps: nx,
  virtualmachine: rx,
  bigtable: sx,
  bigquery: ix,
  cloudcdn: ox,
  clouddns: ax,
  cloudinterconnect: lx,
  cloudloadbalancing: cx,
  cloudsql: hx,
  cloudstorage: ux,
  datalab: dx,
  dataproc: px,
  googleiam: fx,
  googlesecurity: gx,
  googlevpc: mx,
  pubsub: xx,
  securityscanner: Lx,
  stackdriver: yx,
  visionapi: vx
}, bx = {
  name: "Participant",
  props: {
    entity: {
      type: Object,
      required: !0
    }
  },
  data() {
    return {
      color: void 0
    };
  },
  mounted() {
    this.updateFontColor();
  },
  updated() {
    this.updateFontColor();
  },
  computed: {
    selected() {
      return this.$store.state.selected.includes(this.entity.name);
    },
    stereotype() {
      return this.entity.stereotype;
    },
    comment() {
      return this.entity.comment;
    },
    icon() {
      var e;
      return B2[(e = this.entity.type) == null ? void 0 : e.toLowerCase()];
    },
    backgroundColor() {
      try {
        return this.entity.color ? this.entity.color && bm(this.entity.color) : void 0;
      } catch {
        return;
      }
    }
  },
  methods: {
    onSelect() {
      this.$store.commit("onSelect", this.entity.name);
    },
    updateFontColor() {
      if (!this.backgroundColor)
        return;
      let e = window.getComputedStyle(this.$refs.participant).getPropertyValue("background-color");
      if (!e)
        return;
      let t = vm(e);
      this.color = t > 128 ? "#000" : "#fff";
    }
  }
}, wx = ["innerHTML", "alt"], Cx = { class: "h-5 group flex flex-col justify-center" }, _x = {
  key: 0,
  class: "absolute hidden rounded-lg transform -translate-y-8 bg-gray-400 px-2 py-1 text-center text-sm text-white group-hover:flex"
}, kx = {
  key: 1,
  class: "interface leading-4"
}, Ex = { class: "name leading-4" };
function Tx(e, t, n, r, s, i) {
  return R(), W("div", {
    class: ne(["participant bg-skin-participant border-skin-participant text-skin-participant rounded text-base leading-4 relative flex flex-col justify-center z-10 h-10", { selected: i.selected, "border-transparent": !!i.icon }]),
    ref: "participant",
    style: gt({ backgroundColor: i.backgroundColor, color: s.color }),
    onClick: t[0] || (t[0] = (...o) => i.onSelect && i.onSelect(...o))
  }, [
    i.icon ? (R(), W("div", {
      key: 0,
      innerHTML: i.icon,
      class: "absolute left-1/2 transform -translate-x-1/2 -translate-y-full h-8 [&>svg]:w-full [&>svg]:h-full",
      alt: `icon for ${n.entity.name}`
    }, null, 8, wx)) : mt("", !0),
    b("div", Cx, [
      i.comment ? (R(), W("span", _x, Ht(i.comment), 1)) : mt("", !0),
      i.stereotype ? (R(), W("label", kx, "«" + Ht(i.stereotype) + "»", 1)) : mt("", !0),
      b("label", Ex, Ht(n.entity.label || n.entity.name), 1)
    ])
  ], 6);
}
const U2 = /* @__PURE__ */ xt(bx, [["render", Tx]]), kr = qr.child({ name: "LifeLine" }), Ax = {
  name: "life-line",
  components: { Participant: U2 },
  props: ["entity", "context", "groupLeft", "inGroup"],
  data: () => ({
    translateX: 0,
    top: 0
  }),
  computed: {
    ...ge(["centerOf"]),
    ...eo(["scale"]),
    left() {
      return this.centerOf(this.entity.name) - 8 - (this.groupLeft || 0);
    }
  },
  mounted() {
    kr.debug(`LifeLine mounted for ${this.entity.name}`), this.$nextTick(() => {
      this.setTop(), kr.debug(`nextTick after updated for ${this.entity.name}`);
    });
  },
  updated() {
    kr.debug(`updated for ${this.entity.name}`), this.$nextTick(() => {
      this.setTop(), kr.debug(`nextTick after updated for ${this.entity.name}`);
    });
  },
  methods: {
    onSelect() {
      this.$store.commit("onSelect", this.entity.name);
    },
    setTop() {
      const e = this.entity.name.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g, "\\$1"), t = this.$root.$refs.diagram.$el.querySelector(`[data-to="${e}"]`);
      if (t && t.attributes["data-type"].value === "creation") {
        kr.debug(`First message to ${this.entity.name} is creation`);
        const n = this.$el.getBoundingClientRect().y, r = t.getBoundingClientRect().y;
        this.top = (r - n) / this.scale;
      } else
        this.top = 0;
    }
  }
}, Sx = (e) => ($e("data-v-4798b9e7"), e = e(), je(), e), Rx = ["id"], Ix = /* @__PURE__ */ Sx(() => /* @__PURE__ */ b("div", { class: "line bg-skin-lifeline w0 mx-auto flex-grow w-px" }, null, -1));
function Ox(e, t, n, r, s, i) {
  const o = ot("participant");
  return R(), W("div", {
    id: n.entity.name,
    class: "lifeline absolute flex flex-col mx-2 transform -translate-x-1/2 h-full",
    style: gt({ paddingTop: e.top + "px", left: i.left + "px" })
  }, [
    at(o, { entity: n.entity }, null, 8, ["entity"]),
    Ix
  ], 12, Rx);
}
const H2 = /* @__PURE__ */ xt(Ax, [["render", Ox], ["__scopeId", "data-v-4798b9e7"]]), Nx = {
  name: "lifeline-group",
  props: ["context"],
  computed: {
    ...ge(["centerOf"]),
    name() {
      var e, t;
      return (t = (e = this.context) == null ? void 0 : e.name()) == null ? void 0 : t.getFormattedText();
    },
    offset() {
      return 0;
    },
    left() {
      const e = this.entities[0].name, t = Math.max(Hs(e, rr.ParticipantName), "100");
      return this.centerOf(e) - t / 2 - 8;
    },
    right() {
      const e = Math.max(
        Hs(this.entities.slice(-1).name, rr.ParticipantName),
        "100"
      ), t = this.entities.slice(0).pop().name;
      return this.centerOf(t) + e / 2 + 20;
    },
    entities() {
      return Si(this.context).Array();
    }
  },
  components: {
    LifeLine: H2
  }
}, Px = { class: "flex flex-col shadow shadow-slate-500/50 flex-grow" }, Mx = { class: "lifeline-group relative flex-grow" };
function Fx(e, t, n, r, s, i) {
  const o = ot("life-line");
  return i.entities.length > 0 ? (R(), W("div", {
    key: 0,
    class: "container absolute flex flex-col h-full",
    style: gt({ left: `${i.left}px`, width: `${i.right - i.left}px` })
  }, [
    b("div", Px, [
      b("div", Mx, [
        (R(!0), W(zt, null, Sn(i.entities, (a) => (R(), wt(o, {
          inGroup: "true",
          key: a.name,
          ref_for: !0,
          ref: a.name,
          entity: a,
          "group-left": i.left
        }, null, 8, ["entity", "group-left"]))), 128))
      ])
    ])
  ], 4)) : mt("", !0);
}
const zx = /* @__PURE__ */ xt(Nx, [["render", Fx]]), Dl = qr.child({ name: "LifeLineLayer" }), Dx = {
  name: "life-line-layer",
  props: ["context"],
  computed: {
    ...ge(["participants", "GroupContext", "ParticipantContext", "centerOf"]),
    invisibleStarter() {
      return this.starterParticipant.name === "_STARTER_";
    },
    starterParticipant() {
      return this.participants.Starter();
    },
    starterOnTheLeft() {
      return !this.starterParticipant.explicit;
    },
    implicitParticipants() {
      return this.participants.ImplicitArray();
    },
    explicitGroupAndParticipants() {
      var e;
      return (e = this.context) == null ? void 0 : e.children.filter((t) => {
        const n = t instanceof N2, r = t instanceof P2;
        return n || r;
      });
    }
  },
  methods: {
    ...no(["increaseGeneration"]),
    getParticipantEntity(e) {
      return Si(e).First();
    }
  },
  updated() {
    Dl.debug("LifeLineLayer updated");
  },
  mounted() {
    Dl.debug("LifeLineLayer mounted");
  },
  components: {
    LifeLine: H2,
    LifeLineGroup: zx
  }
}, Bx = {
  class: "life-line-layer lifeline-layer absolute h-full flex flex-col pt-8",
  style: { "min-width": "200px" }
}, Ux = { class: "container relative grow" };
function Hx(e, t, n, r, s, i) {
  const o = ot("life-line"), a = ot("life-line-group");
  return R(), W("div", Bx, [
    b("div", Ux, [
      i.starterOnTheLeft ? (R(), wt(o, {
        key: 0,
        entity: i.starterParticipant,
        class: ne(["starter", { invisible: i.invisibleStarter }])
      }, null, 8, ["entity", "class"])) : mt("", !0),
      (R(!0), W(zt, null, Sn(i.explicitGroupAndParticipants, (l, c) => (R(), W(zt, null, [
        l instanceof e.GroupContext ? (R(), wt(a, {
          key: c,
          context: l
        }, null, 8, ["context"])) : mt("", !0),
        l instanceof e.ParticipantContext ? (R(), wt(o, {
          key: c,
          entity: i.getParticipantEntity(l)
        }, null, 8, ["entity"])) : mt("", !0)
      ], 64))), 256)),
      (R(!0), W(zt, null, Sn(i.implicitParticipants, (l) => (R(), wt(o, {
        key: l.name,
        entity: l
      }, null, 8, ["entity"]))), 128))
    ])
  ]);
}
const Gx = /* @__PURE__ */ xt(Dx, [["render", Hx]]), Bl = qr.child({ name: "MessageLayer" }), $x = {
  name: "message-layer",
  props: ["context"],
  data() {
    return {
      left: 0,
      right: 0,
      totalWidth: 0
    };
  },
  computed: {
    ...ge(["participants", "centerOf"]),
    paddingLeft() {
      if (this.participants.Array().length >= 1) {
        const e = this.participants.Array().slice(0)[0].name;
        return this.centerOf(e);
      }
      return 0;
    }
  },
  methods: {
    ...no(["onMessageLayerMountedOrUpdated"]),
    participantNames() {
      return this.participants.Names();
    }
  },
  updated() {
    Bl.debug("MessageLayer updated");
  },
  mounted() {
    Bl.debug("MessageLayer mounted");
  }
}, jx = { class: "message-layer pt-24 pb-10" };
function Vx(e, t, n, r, s, i) {
  const o = ot("block");
  return R(), W("div", jx, [
    at(o, {
      context: n.context,
      style: gt({ "padding-left": i.paddingLeft + "px" })
    }, null, 8, ["context", "style"])
  ]);
}
const qx = /* @__PURE__ */ xt($x, [["render", Vx]]), A1 = 30, G2 = 100, es = {
  computed: {
    ...ge(["coordinates", "distance2"]),
    localParticipants: function() {
      return [
        this.from,
        ...Si(this.context).ImplicitArray().map((e) => e.name)
      ];
    },
    leftParticipant: function() {
      return this.coordinates.participantModels.map((e) => e.name).find((e) => this.localParticipants.includes(e));
    },
    rightParticipant: function() {
      return this.coordinates.participantModels.map((e) => e.name).reverse().find((e) => this.localParticipants.includes(e));
    },
    depth: function() {
      return M2(this.context);
    },
    offsetX: function() {
      let e = 10 * (this.depth + 1);
      return this.distance2(this.leftParticipant, this.from) + e + A1;
    },
    fragmentStyle: function() {
      return {
        transform: "translateX(" + (this.offsetX + 1) * -1 + "px)",
        width: this.distance2(this.leftParticipant, this.rightParticipant) + 20 * this.depth + A1 + G2 + "px"
      };
    }
  }
}, Zx = {
  name: "seq-diagram",
  components: {
    LifeLineLayer: Gx,
    MessageLayer: qx
  },
  computed: {
    ...ge(["rootContext", "coordinates"]),
    width() {
      return this.coordinates.getWidth() + 10 * (this.depth + 1) + G2;
    },
    depth: function() {
      return M2(this.rootContext);
    },
    paddingLeft: function() {
      return 10 * (this.depth + 1) + A1;
    }
  }
};
function Wx(e, t, n, r, s, i) {
  const o = ot("life-line-layer"), a = ot("message-layer");
  return R(), W("div", {
    class: "zenuml sequence-diagram relative box-border text-left overflow-visible",
    style: gt({ width: `${i.width}px`, paddingLeft: `${i.paddingLeft}px` }),
    ref: "diagram"
  }, [
    at(o, {
      context: e.rootContext.head()
    }, null, 8, ["context"]),
    at(a, {
      context: e.rootContext.block()
    }, null, 8, ["context"])
  ], 4);
}
const $2 = /* @__PURE__ */ xt(Zx, [["render", Wx]]), Yx = {
  name: "IconList",
  props: ["types"],
  computed: {},
  methods: {
    icon(e) {
      return B2[e == null ? void 0 : e.toLowerCase()];
    }
  }
}, Kx = {
  role: "list",
  class: "mt-3 grid grid-cols-4 gap-5 sm:gap-6 sm:grid-cols-6 lg:grid-cols-8"
}, Qx = { class: "h-12 flex items-center justify-center bg-gray-50 text-white text-sm font-medium rounded-t-md" }, Xx = ["innerHTML", "alt"], Jx = { class: "flex items-center justify-center border-t border-r border-b border-gray-200 bg-white rounded-b-md" }, tL = { class: "px-2 py-2 text-xs" }, eL = { class: "text-gray-900 font-medium hover:text-gray-600" };
function nL(e, t, n, r, s, i) {
  return R(), W("ul", Kx, [
    (R(!0), W(zt, null, Sn(n.types, (o) => (R(), W("li", {
      key: o,
      class: "col-span-1 flex flex-col shadow-sm rounded-md"
    }, [
      b("div", Qx, [
        i.icon ? (R(), W("i", {
          key: 0,
          innerHTML: i.icon(o),
          class: "object-contain h-8 w-8 m-auto [&>svg]:w-full [&>svg]:h-full",
          alt: `icon for ${o}`
        }, null, 8, Xx)) : mt("", !0)
      ]),
      b("div", Jx, [
        b("div", tL, [
          b("span", eL, "@" + Ht(o), 1)
        ])
      ])
    ]))), 128))
  ]);
}
const rL = /* @__PURE__ */ xt(Yx, [["render", nL]]), sL = {
  name: "TipsDialog",
  components: { IconList: rL },
  computed: {
    standardTypes() {
      return ["Actor", "Boundary", "Control", "Database", "Entity"];
    },
    awsServices() {
      return [
        "CloudWatch",
        "CloudFront",
        "Cognito",
        "DynamoDB",
        "EBS",
        "EC2",
        "ECS",
        "EFS",
        "ElastiCache",
        "ElasticBeantalk",
        "ElasticFileSystem",
        "Glacier",
        "IAM",
        "Kinesis",
        "Lambda",
        "LightSail",
        "RDS",
        "Redshift",
        "S3",
        "SNS",
        "SQS",
        "Sagemaker",
        "VPC"
      ];
    },
    azureServices() {
      return [
        "AzureActiveDirectory",
        "AzureBackup",
        "AzureCDN",
        "AzureDataFactory",
        "AzureDevOps",
        "AzureFunction",
        "AzureSQL",
        "CosmosDB",
        "LogicApps",
        "VirtualMachine"
      ];
    },
    googleServices() {
      return [
        "BigTable",
        "BigQuery",
        "CloudCDN",
        "CloudDNS",
        "CloudInterconnect",
        "CloudLoadBalancing",
        "CloudSQL",
        "CloudStorage",
        "DataLab",
        "DataProc",
        "GoogleIAM",
        "GoogleSecurity",
        "GoogleVPC",
        "PubSub",
        "SecurityScanner",
        "StackDriver",
        "VisionAPI"
      ];
    }
  },
  methods: {
    closeTipsDialog() {
      var e;
      this.$store.state.showTips = !1;
      try {
        (e = this.$gtag) == null || e.event("close", {
          event_category: "help",
          event_label: "tips dialog"
        });
      } catch (t) {
        console.error(t);
      }
    }
  }
}, iL = { class: "flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block" }, oL = /* @__PURE__ */ b("div", {
  class: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity",
  "aria-hidden": "true"
}, null, -1), aL = /* @__PURE__ */ b("span", {
  class: "hidden sm:inline-block sm:align-middle sm:h-screen",
  "aria-hidden": "true"
}, "​", -1), lL = { class: "z-40 inline-block align-bottom bg-white rounded-lg px-4 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-2" }, cL = {
  class: "bg-white px-4 py-5 border-b border-gray-200 sm:px-6",
  slot: "header"
}, hL = /* @__PURE__ */ b("h3", { class: "text-xl leading-6 font-medium text-gray-900 inline-block" }, "ZenUML Tips", -1), uL = /* @__PURE__ */ b("span", { class: "sr-only" }, "Close menu", -1), dL = /* @__PURE__ */ b("svg", {
  class: "h-6 w-6",
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  "aria-hidden": "true"
}, [
  /* @__PURE__ */ b("path", {
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-width": "2",
    d: "M6 18L18 6M6 6l12 12"
  })
], -1), pL = [
  uL,
  dL
], fL = { slot: "body" }, gL = { class: "relative bg-white pb-32 mt-4 overflow-hidden" }, mL = { class: "relative" }, xL = { class: "lg:mx-auto lg:max-w-11/12 lg:px-8" }, LL = /* @__PURE__ */ oc(`<div class="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1"><div><div class="px-4 max-w-full mx-auto sm:px-6 lg:max-w-none lg:mx-0"><h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900"> Declare Participants </h2><pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>// Define a Starter (optional)
@Starter(A)

// Show icons
@EC2 A

// Use &#39;group&#39; keyword
group GroupName {  B  C }

// Use stereotype
&lt;&lt;servlet&gt;&gt; ServiceX</code></pre></div><div class="px-4 max-w-7xl mx-auto sm:px-6 lg:max-w-none lg:mx-0"><h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Divider</h2><pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>A.method()
==divider name==
B.method()
</code></pre></div></div><div class="px-4 w-full mx-auto lg:max-w-none lg:mx-0"><h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Fragments</h2><pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>// Alt (AKA if/else)
if(condition1) {}
else if (condition2) {}
else {}

// \`loop\`, \`for\`, \`forEach\`, \`while\`
// are treated the same
forEach(records) {}

// Opt
opt {}

// Par
par {}

// Try Catch Finally
try {} catch() {} finally {}
</code></pre></div><div class="px-4 w-full mx-auto lg:max-w-none lg:mx-0"><h2 class="mt-4 mb-4 text-lg leading-6 font-medium text-gray-900">Messages</h2><pre class="text-xs w-full bg-gray-50 text-gray-600 p-2 rounded-lg"><code>//Creation
new ParticipantName()

//Sync Message
A.method
A-&gt;B.method

//Async Message
A-&gt;B: async message

//Reply Message, three styles
x = A.method
A.method() {
  return x
}
A.method() {
  @return A-&gt;B: message
}</code></pre></div></div>`, 1), yL = { class: "px-4 max-w-7xl mx-auto sm:px-6 lg:max-w-none lg:mx-0" }, vL = /* @__PURE__ */ b("h2", { class: "mt-8 mb-4 text-lg leading-6 font-medium text-gray-900" }, " Builtin Icons ", -1), bL = /* @__PURE__ */ b("p", { class: "text-sm text-gray-500" }, [
  /* @__PURE__ */ Rs(" Use "),
  /* @__PURE__ */ b("span", { class: "rounded inline-block bg-gray-50 text-gray-600" }, [
    /* @__PURE__ */ b("code", { class: "text-xs" }, "@Actor TheParticipant")
  ]),
  /* @__PURE__ */ Rs(" to define the type of the participant. ")
], -1), wL = /* @__PURE__ */ b("hr", { class: "mt-4" }, null, -1), CL = /* @__PURE__ */ b("hr", { class: "mt-4" }, null, -1), _L = /* @__PURE__ */ b("hr", { class: "mt-4" }, null, -1);
function kL(e, t, n, r, s, i) {
  const o = ot("IconList");
  return R(), W("div", iL, [
    oL,
    aL,
    b("div", lL, [
      b("div", null, [
        b("div", cL, [
          hL,
          b("button", {
            type: "button",
            onClick: t[0] || (t[0] = (a) => i.closeTipsDialog()),
            class: "float-right bg-white rounded-md inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          }, pL)
        ]),
        b("div", fL, [
          b("div", gL, [
            b("div", mL, [
              b("div", xL, [
                LL,
                b("div", yL, [
                  vL,
                  bL,
                  at(o, { types: i.standardTypes }, null, 8, ["types"]),
                  wL,
                  at(o, { types: i.awsServices }, null, 8, ["types"]),
                  CL,
                  at(o, { types: i.azureServices }, null, 8, ["types"]),
                  _L,
                  at(o, { types: i.googleServices }, null, 8, ["types"])
                ])
              ])
            ])
          ])
        ])
      ])
    ])
  ]);
}
const EL = /* @__PURE__ */ xt(sL, [["render", kL]]), TL = {
  name: "point",
  props: ["fill", "rtl"]
}, j2 = (e) => ($e("data-v-ca07199a"), e = e(), je(), e), AL = {
  key: 0,
  class: "arrow stroke-2",
  height: "10",
  width: "10"
}, SL = /* @__PURE__ */ j2(() => /* @__PURE__ */ b("polyline", {
  class: "right head fill-current stroke-current",
  points: "0,0 10,5 0,10"
}, null, -1)), RL = [
  SL
], IL = {
  key: 1,
  class: "arrow stroke-2",
  height: "10",
  width: "10"
}, OL = /* @__PURE__ */ j2(() => /* @__PURE__ */ b("polyline", {
  class: "left head fill-current stroke-current",
  points: "10,0 0,5 10,10"
}, null, -1)), NL = [
  OL
];
function PL(e, t, n, r, s, i) {
  return R(), W("div", {
    class: ne(["point text-skin-message-arrow", { fill: n.fill, "no-fill": !n.fill, "right-to-left": n.rtl }])
  }, [
    n.rtl ? mt("", !0) : (R(), W("svg", AL, RL)),
    n.rtl ? (R(), W("svg", IL, NL)) : mt("", !0)
  ], 2);
}
const ML = /* @__PURE__ */ xt(TL, [["render", PL], ["__scopeId", "data-v-ca07199a"]]), FL = {
  name: "message",
  props: ["content", "rtl", "type", "color"],
  computed: {
    isAsync: function() {
      return this.type === "async";
    },
    borderStyle() {
      switch (this.type) {
        case "sync":
        case "async":
          return "solid";
        case "creation":
        case "return":
          return "dashed";
      }
      return "";
    },
    fill() {
      switch (this.type) {
        case "sync":
        case "async":
          return !0;
        case "creation":
        case "return":
          return !1;
      }
      return !1;
    }
  },
  components: {
    Point: ML
  }
};
function zL(e, t, n, r, s, i) {
  const o = ot("point");
  return R(), W("div", {
    class: ne(["message border-skin-message-arrow border-b-2 flex items-end", {
      "flex-row-reverse": n.rtl,
      return: n.type === "return",
      "right-to-left": n.rtl,
      "text-left": i.isAsync,
      "text-center": !i.isAsync
    }]),
    style: gt({ "border-bottom-style": i.borderStyle })
  }, [
    b("div", {
      class: "name flex-grow text-sm truncate hover:whitespace-normal hover:text-skin-message-hover hover:bg-skin-message-hover",
      style: gt([{ color: n.color }, { "padding-left": "5px", float: "left" }])
    }, Ht(n.content), 5),
    at(o, {
      class: "flex-shrink-0 transform translate-y-1/2 -my-px",
      fill: i.fill,
      rtl: n.rtl
    }, null, 8, ["fill", "rtl"])
  ], 6);
}
const ns = /* @__PURE__ */ xt(FL, [["render", zL]]), DL = {
  name: "WidthProvider",
  components: { Message: ns },
  data: function() {
    return {
      text: "abcd"
    };
  },
  methods: {
    width: function(e, t) {
      return console.log(e, t), this.text = e, this.$el.clientWidth;
    }
  },
  mounted() {
    this.$store.state.widthProvider = this;
  }
}, BL = { class: "invisible" };
function UL(e, t, n, r, s, i) {
  const o = ot("message");
  return R(), W("div", BL, [
    at(o, {
      content: e.text,
      rtl: "false",
      type: "sync"
    }, null, 8, ["content"])
  ]);
}
const HL = /* @__PURE__ */ xt(DL, [["render", UL]]);
function GL(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), r = n.createElement("base"), s = n.createElement("a");
  return n.head.appendChild(r), n.body.appendChild(s), t && (r.href = t), s.href = e, s.href;
}
const $L = (() => {
  let e = 0;
  const t = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
  return () => (e += 1, `u${t()}${e}`);
})();
function gn(e) {
  const t = [];
  for (let n = 0, r = e.length; n < r; n++)
    t.push(e[n]);
  return t;
}
function Gs(e, t) {
  const n = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return n ? parseFloat(n.replace("px", "")) : 0;
}
function jL(e) {
  const t = Gs(e, "border-left-width"), n = Gs(e, "border-right-width");
  return e.clientWidth + t + n;
}
function VL(e) {
  const t = Gs(e, "border-top-width"), n = Gs(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function V2(e, t = {}) {
  const n = t.width || jL(e), r = t.height || VL(e);
  return { width: n, height: r };
}
function qL() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const he = 16384;
function ZL(e) {
  (e.width > he || e.height > he) && (e.width > he && e.height > he ? e.width > e.height ? (e.height *= he / e.width, e.width = he) : (e.width *= he / e.height, e.height = he) : e.width > he ? (e.height *= he / e.width, e.width = he) : (e.width *= he / e.height, e.height = he));
}
function WL(e, t = {}) {
  return e.toBlob ? new Promise((n) => {
    e.toBlob(n, t.type ? t.type : "image/png", t.quality ? t.quality : 1);
  }) : new Promise((n) => {
    const r = window.atob(e.toDataURL(t.type ? t.type : void 0, t.quality ? t.quality : void 0).split(",")[1]), s = r.length, i = new Uint8Array(s);
    for (let o = 0; o < s; o += 1)
      i[o] = r.charCodeAt(o);
    n(new Blob([i], {
      type: t.type ? t.type : "image/png"
    }));
  });
}
function $s(e) {
  return new Promise((t, n) => {
    const r = new Image();
    r.decode = () => t(r), r.onload = () => t(r), r.onerror = n, r.crossOrigin = "anonymous", r.decoding = "async", r.src = e;
  });
}
async function YL(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function KL(e, t, n) {
  const r = "http://www.w3.org/2000/svg", s = document.createElementNS(r, "svg"), i = document.createElementNS(r, "foreignObject");
  return s.setAttribute("width", `${t}`), s.setAttribute("height", `${n}`), s.setAttribute("viewBox", `0 0 ${t} ${n}`), i.setAttribute("width", "100%"), i.setAttribute("height", "100%"), i.setAttribute("x", "0"), i.setAttribute("y", "0"), i.setAttribute("externalResourcesRequired", "true"), s.appendChild(i), i.appendChild(e), YL(s);
}
function QL(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function XL(e) {
  return gn(e).map((t) => {
    const n = e.getPropertyValue(t), r = e.getPropertyPriority(t);
    return `${t}: ${n}${r ? " !important" : ""};`;
  }).join(" ");
}
function JL(e, t, n) {
  const r = `.${e}:${t}`, s = n.cssText ? QL(n) : XL(n);
  return document.createTextNode(`${r}{${s}}`);
}
function Ul(e, t, n) {
  const r = window.getComputedStyle(e, n), s = r.getPropertyValue("content");
  if (s === "" || s === "none")
    return;
  const i = $L();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const o = document.createElement("style");
  o.appendChild(JL(i, n, r)), t.appendChild(o);
}
function ty(e, t) {
  Ul(e, t, ":before"), Ul(e, t, ":after");
}
const Hl = "application/font-woff", Gl = "image/jpeg", ey = {
  woff: Hl,
  woff2: Hl,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: Gl,
  jpeg: Gl,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function ny(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function ha(e) {
  const t = ny(e).toLowerCase();
  return ey[t] || "";
}
function ry(e) {
  return e.split(/,/)[1];
}
function S1(e) {
  return e.search(/^(data:)/) !== -1;
}
function q2(e, t) {
  return `data:${t};base64,${e}`;
}
async function Z2(e, t, n) {
  const r = await fetch(e, t);
  if (r.status === 404)
    throw new Error(`Resource "${r.url}" not found`);
  const s = await r.blob();
  return new Promise((i, o) => {
    const a = new FileReader();
    a.onerror = o, a.onloadend = () => {
      try {
        i(n({ res: r, result: a.result }));
      } catch (l) {
        o(l);
      }
    }, a.readAsDataURL(s);
  });
}
const Yi = {};
function sy(e, t, n) {
  let r = e.replace(/\?.*/, "");
  return n && (r = e), /ttf|otf|eot|woff2?/i.test(r) && (r = r.replace(/.*\//, "")), t ? `[${t}]${r}` : r;
}
async function ua(e, t, n) {
  const r = sy(e, t, n.includeQueryParams);
  if (Yi[r] != null)
    return Yi[r];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let s;
  try {
    const i = await Z2(e, n.fetchRequestInit, ({ res: o, result: a }) => (t || (t = o.headers.get("Content-Type") || ""), ry(a)));
    s = q2(i, t);
  } catch (i) {
    s = n.imagePlaceholder || "";
    let o = `Failed to fetch resource: ${e}`;
    i && (o = typeof i == "string" ? i : i.message), o && console.warn(o);
  }
  return Yi[r] = s, s;
}
async function iy(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : $s(t);
}
async function oy(e, t) {
  if (e.currentSrc) {
    const i = document.createElement("canvas"), o = i.getContext("2d");
    i.width = e.clientWidth, i.height = e.clientHeight, o == null || o.drawImage(e, 0, 0, i.width, i.height);
    const a = i.toDataURL();
    return $s(a);
  }
  const n = e.poster, r = ha(n), s = await ua(n, r, t);
  return $s(s);
}
async function ay(e) {
  var t;
  try {
    if (!((t = e == null ? void 0 : e.contentDocument) === null || t === void 0) && t.body)
      return await Ii(e.contentDocument.body, {}, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function ly(e, t) {
  return e instanceof HTMLCanvasElement ? iy(e) : e instanceof HTMLVideoElement ? oy(e, t) : e instanceof HTMLIFrameElement ? ay(e) : e.cloneNode(!1);
}
const cy = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT";
async function hy(e, t, n) {
  var r;
  const s = cy(e) && e.assignedNodes ? gn(e.assignedNodes()) : gn(((r = e.shadowRoot) !== null && r !== void 0 ? r : e).childNodes);
  return s.length === 0 || e instanceof HTMLVideoElement || await s.reduce((i, o) => i.then(() => Ii(o, n)).then((a) => {
    a && t.appendChild(a);
  }), Promise.resolve()), t;
}
function uy(e, t) {
  const n = t.style;
  if (!n)
    return;
  const r = window.getComputedStyle(e);
  r.cssText ? (n.cssText = r.cssText, n.transformOrigin = r.transformOrigin) : gn(r).forEach((s) => {
    let i = r.getPropertyValue(s);
    s === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), n.setProperty(s, i, r.getPropertyPriority(s));
  });
}
function dy(e, t) {
  e instanceof HTMLTextAreaElement && (t.innerHTML = e.value), e instanceof HTMLInputElement && t.setAttribute("value", e.value);
}
function py(e, t) {
  if (e instanceof HTMLSelectElement) {
    const n = t, r = Array.from(n.children).find((s) => e.value === s.getAttribute("value"));
    r && r.setAttribute("selected", "");
  }
}
function fy(e, t) {
  return t instanceof Element && (uy(e, t), ty(e, t), dy(e, t), py(e, t)), t;
}
async function gy(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const r = {};
  for (let i = 0; i < n.length; i++) {
    const o = n[i].getAttribute("xlink:href");
    if (o) {
      const a = e.querySelector(o), l = document.querySelector(o);
      !a && l && !r[o] && (r[o] = await Ii(l, t, !0));
    }
  }
  const s = Object.values(r);
  if (s.length) {
    const i = "http://www.w3.org/1999/xhtml", o = document.createElementNS(i, "svg");
    o.setAttribute("xmlns", i), o.style.position = "absolute", o.style.width = "0", o.style.height = "0", o.style.overflow = "hidden", o.style.display = "none";
    const a = document.createElementNS(i, "defs");
    o.appendChild(a);
    for (let l = 0; l < s.length; l++)
      a.appendChild(s[l]);
    e.appendChild(o);
  }
  return e;
}
async function Ii(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((r) => ly(r, t)).then((r) => hy(e, r, t)).then((r) => fy(e, r)).then((r) => gy(r, t));
}
const W2 = /url\((['"]?)([^'"]+?)\1\)/g, my = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, xy = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function Ly(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function yy(e) {
  const t = [];
  return e.replace(W2, (n, r, s) => (t.push(s), n)), t.filter((n) => !S1(n));
}
async function vy(e, t, n, r, s) {
  try {
    const i = n ? GL(t, n) : t, o = ha(t);
    let a;
    if (s) {
      const l = await s(i);
      a = q2(l, o);
    } else
      a = await ua(i, o, r);
    return e.replace(Ly(t), `$1${a}$3`);
  } catch {
  }
  return e;
}
function by(e, { preferredFontFormat: t }) {
  return t ? e.replace(xy, (n) => {
    for (; ; ) {
      const [r, , s] = my.exec(n) || [];
      if (!s)
        return "";
      if (s === t)
        return `src: ${r};`;
    }
  }) : e;
}
function Y2(e) {
  return e.search(W2) !== -1;
}
async function K2(e, t, n) {
  if (!Y2(e))
    return e;
  const r = by(e, n);
  return yy(r).reduce((s, i) => s.then((o) => vy(o, i, t, n)), Promise.resolve(r));
}
async function wy(e, t) {
  var n;
  const r = (n = e.style) === null || n === void 0 ? void 0 : n.getPropertyValue("background");
  if (r) {
    const s = await K2(r, null, t);
    e.style.setProperty("background", s, e.style.getPropertyPriority("background"));
  }
}
async function Cy(e, t) {
  if (!(e instanceof HTMLImageElement && !S1(e.src)) && !(e instanceof SVGImageElement && !S1(e.href.baseVal)))
    return;
  const n = e instanceof HTMLImageElement ? e.src : e.href.baseVal, r = await ua(n, ha(n), t);
  await new Promise((s, i) => {
    e.onload = s, e.onerror = i;
    const o = e;
    o.decode && (o.decode = s), e instanceof HTMLImageElement ? (e.srcset = "", e.src = r) : e.href.baseVal = r;
  });
}
async function _y(e, t) {
  const n = gn(e.childNodes).map((r) => Q2(r, t));
  await Promise.all(n).then(() => e);
}
async function Q2(e, t) {
  e instanceof Element && (await wy(e, t), await Cy(e, t), await _y(e, t));
}
function ky(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const r = t.style;
  return r != null && Object.keys(r).forEach((s) => {
    n[s] = r[s];
  }), e;
}
const $l = {};
async function jl(e) {
  let t = $l[e];
  if (t != null)
    return t;
  const n = await (await fetch(e)).text();
  return t = { url: e, cssText: n }, $l[e] = t, t;
}
async function Vl(e, t) {
  let n = e.cssText;
  const r = /url\(["']?([^"')]+)["']?\)/g, s = (n.match(/url\([^)]+\)/g) || []).map(async (i) => {
    let o = i.replace(r, "$1");
    return o.startsWith("https://") || (o = new URL(o, e.url).href), Z2(o, t.fetchRequestInit, ({ result: a }) => (n = n.replace(i, `url(${a})`), [i, a]));
  });
  return Promise.all(s).then(() => n);
}
function ql(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let r = e.replace(n, "");
  const s = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const l = s.exec(r);
    if (l === null)
      break;
    t.push(l[0]);
  }
  r = r.replace(s, "");
  const i = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, o = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", a = new RegExp(o, "gi");
  for (; ; ) {
    let l = i.exec(r);
    if (l === null) {
      if (l = a.exec(r), l === null)
        break;
      i.lastIndex = a.lastIndex;
    } else
      a.lastIndex = i.lastIndex;
    t.push(l[0]);
  }
  return t;
}
async function Ey(e, t) {
  const n = [], r = [];
  return e.forEach((s) => {
    if ("cssRules" in s)
      try {
        gn(s.cssRules || []).forEach((i, o) => {
          if (i.type === CSSRule.IMPORT_RULE) {
            let a = o + 1;
            const l = i.href, c = jl(l).then((u) => Vl(u, t)).then((u) => ql(u).forEach((d) => {
              try {
                s.insertRule(d, d.startsWith("@import") ? a += 1 : s.cssRules.length);
              } catch (f) {
                console.error("Error inserting rule from remote css", {
                  rule: d,
                  error: f
                });
              }
            })).catch((u) => {
              console.error("Error loading remote css", u.toString());
            });
            r.push(c);
          }
        });
      } catch (i) {
        const o = e.find((a) => a.href == null) || document.styleSheets[0];
        s.href != null && r.push(jl(s.href).then((a) => Vl(a, t)).then((a) => ql(a).forEach((l) => {
          o.insertRule(l, s.cssRules.length);
        })).catch((a) => {
          console.error("Error loading remote stylesheet", a.toString());
        })), console.error("Error inlining remote css file", i.toString());
      }
  }), Promise.all(r).then(() => (e.forEach((s) => {
    if ("cssRules" in s)
      try {
        gn(s.cssRules || []).forEach((i) => {
          n.push(i);
        });
      } catch (i) {
        console.error(`Error while reading CSS rules from ${s.href}`, i.toString());
      }
  }), n));
}
function Ty(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => Y2(t.style.getPropertyValue("src")));
}
async function Ay(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = gn(e.ownerDocument.styleSheets), r = await Ey(n, t);
  return Ty(r);
}
async function Sy(e, t) {
  const n = await Ay(e, t);
  return (await Promise.all(n.map((r) => {
    const s = r.parentStyleSheet ? r.parentStyleSheet.href : null;
    return K2(r.cssText, s, t);
  }))).join(`
`);
}
async function Ry(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await Sy(e, t);
  if (n) {
    const r = document.createElement("style"), s = document.createTextNode(n);
    r.appendChild(s), e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r);
  }
}
async function X2(e, t = {}) {
  const { width: n, height: r } = V2(e, t), s = await Ii(e, t, !0);
  return await Ry(s, t), await Q2(s, t), ky(s, t), await KL(s, n, r);
}
async function da(e, t = {}) {
  const { width: n, height: r } = V2(e, t), s = await X2(e, t), i = await $s(s), o = document.createElement("canvas"), a = o.getContext("2d"), l = t.pixelRatio || qL(), c = t.canvasWidth || n, u = t.canvasHeight || r;
  return o.width = c * l, o.height = u * l, t.skipAutoScale || ZL(o), o.style.width = `${c}`, o.style.height = `${u}`, t.backgroundColor && (a.fillStyle = t.backgroundColor, a.fillRect(0, 0, o.width, o.height)), a.drawImage(i, 0, 0, o.width, o.height), o;
}
async function Iy(e, t = {}) {
  return (await da(e, t)).toDataURL();
}
async function Oy(e, t = {}) {
  return (await da(e, t)).toDataURL("image/jpeg", t.quality || 1);
}
async function Ny(e, t = {}) {
  const n = await da(e, t);
  return await WL(n);
}
const Py = "process.env.VUE_APP_GIT_HASH", My = "process.env.VUE_APP_GIT_BRANCH", Fy = {
  name: "Debug",
  data() {
    return {
      commitHash: Py,
      gitBranch: My
    };
  },
  computed: {
    debug() {
      return !!localStorage.zenumlDebug;
    }
  }
}, zy = { class: "flex flex-nowrap m-2 text-sm" }, Dy = { class: "ml-4 text-xs inline-flex items-center font-bold leading-sm px-3 py-1 bg-green-200 text-green-700 rounded-sm" }, By = /* @__PURE__ */ oc('<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>', 1), Uy = { class: "inline-block px-2" };
function Hy(e, t, n, r, s, i) {
  return n3((R(), W("div", null, [
    b("div", zy, [
      b("div", Dy, [
        By,
        b("span", Uy, Ht(s.gitBranch) + ":" + Ht(s.commitHash), 1)
      ])
    ])
  ], 512)), [
    [n4, i.debug]
  ]);
}
const Gy = /* @__PURE__ */ xt(Fy, [["render", Hy]]), $y = {
  name: "DiagramFrame",
  computed: {
    ...eo(["showTips", "scale", "theme"]),
    ...ge(["rootContext"]),
    title() {
      var e;
      return this.rootContext || console.error("`rootContext` is empty. Please make sure `store` is properly configured."), (e = this.rootContext) == null ? void 0 : e.title();
    }
  },
  mounted() {
    this.$el.__vue__ = this;
  },
  methods: {
    ...no(["setScale"]),
    showTipsDialog() {
      var e;
      this.$store.state.showTips = !0;
      try {
        (e = this.$gtag) == null || e.event("view", {
          event_category: "help",
          event_label: "tips dialog"
        });
      } catch (t) {
        console.error(t);
      }
    },
    toPng() {
      return Iy(this.$refs.export, {
        backgroundColor: "white",
        filter: (e) => {
          var t;
          return !((t = e == null ? void 0 : e.classList) != null && t.contains("hide-export"));
        }
      });
    },
    toSvg() {
      return X2(this.$refs.export, {
        backgroundColor: "white",
        filter: (e) => {
          var t;
          return !((t = e == null ? void 0 : e.classList) != null && t.contains("hide-export"));
        }
      });
    },
    toBlob() {
      return Ny(this.$refs.export, {
        backgroundColor: "white",
        filter: (e) => {
          var t;
          return !((t = e == null ? void 0 : e.classList) != null && t.contains("hide-export"));
        }
      });
    },
    toJpeg() {
      return Oy(this.$refs.export, {
        backgroundColor: "white",
        filter: (e) => {
          var t;
          return !((t = e == null ? void 0 : e.classList) != null && t.contains("hide-export"));
        }
      });
    },
    zoomIn() {
      this.setScale(this.scale + 0.1);
    },
    zoomOut() {
      this.setScale(this.scale - 0.1);
    },
    setTheme(e) {
      this.theme = e;
    },
    setStyle(e) {
      const t = "zenuml-style";
      let n = document.getElementById(t);
      n || (n = document.createElement("style"), n.id = t, document.head.append(n)), n.textContent = e;
    },
    setRemoteCss(e) {
      const t = new URL(e).hostname;
      if (t === "https://github.com" || t === "https://githubusercontent.com") {
        fetch(e.replace("github.com", "raw.githubusercontent.com").replace("blob/", "")).then((s) => s.text()).then((s) => {
          this.setStyle(s);
        });
        return;
      }
      const n = "zenuml-remote-css";
      let r = document.getElementById(n);
      r || (r = document.createElement("link"), r.id = n, r.rel = "stylesheet", document.head.append(r)), r.href = e;
    }
  },
  components: {
    Debug: Gy,
    WidthProvider: HL,
    TipsDialog: EL,
    DiagramTitle: fm,
    SeqDiagram: $2,
    Privacy: hm
  }
}, jy = { ref: "content" }, Vy = { class: "header text-skin-title bg-skin-title border-skin-frame border-b p-1 flex justify-between rounded-t" }, qy = { class: "left hide-export" }, Zy = { class: "right flex-grow flex justify-between" }, Wy = {
  key: 0,
  class: "fixed z-40 inset-0 overflow-y-auto",
  "aria-labelledby": "modal-title",
  role: "dialog",
  "aria-modal": "true"
}, Yy = { class: "footer p-1 flex justify-between" }, Ky = {
  class: "filter grayscale",
  style: { width: "1em", height: "1em", "vertical-align": "middle", fill: "currentColor", overflow: "hidden" },
  viewBox: "0 0 1024 1024",
  xmlns: "http://www.w3.org/2000/svg"
}, Qy = /* @__PURE__ */ b("path", {
  d: "M514 912c-219.9 0-398.8-178.9-398.8-398.9 0-219.9 178.9-398.8 398.8-398.8s398.9 178.9 398.9 398.8c-0.1 220-179 398.9-398.9 398.9z m0-701.5c-166.9 0-302.7 135.8-302.7 302.7S347.1 815.9 514 815.9s302.7-135.8 302.7-302.7S680.9 210.5 514 210.5z",
  fill: "#BDD2EF"
}, null, -1), Xy = /* @__PURE__ */ b("path", {
  d: "M431.1 502.4c-0.1 0.3 0.3 0.4 0.4 0.2 6.9-11.7 56.5-89.1 23.4 167.3-17.4 134.7 122.9 153.6 142.3-7.9 0.1-1-1.3-1.4-1.7-0.4-11.9 37.2-49.6 104.9-4.7-155.2 18.6-107.2-127.6-146-159.7-4z",
  fill: "#2867CE"
}, null, -1), Jy = /* @__PURE__ */ b("path", {
  d: "M541.3 328m-68 0a68 68 0 1 0 136 0 68 68 0 1 0-136 0Z",
  fill: "#2867CE"
}, null, -1), tv = [
  Qy,
  Xy,
  Jy
], ev = /* @__PURE__ */ b("a", {
  target: "_blank",
  href: "https://zenuml.com",
  class: "brand text-skin-link absolute bottom-1 right-1 text-xs"
}, "ZenUML.com", -1);
function nv(e, t, n, r, s, i) {
  const o = ot("debug"), a = ot("diagram-title"), l = ot("privacy"), c = ot("TipsDialog"), u = ot("seq-diagram"), d = ot("width-provider");
  return R(), W("div", {
    ref: "export",
    class: ne(["zenuml p-1 bg-skin-canvas", e.theme]),
    style: { display: "inline-block" }
  }, [
    at(o),
    b("div", {
      class: "frame text-skin-frame bg-skin-frame border-skin-frame relative m-1 origin-top-left whitespace-nowrap border rounded",
      style: gt({ transform: `scale(${e.scale})` })
    }, [
      b("div", jy, [
        b("div", Vy, [
          b("div", qy, [
            r3(e.$slots, "default")
          ]),
          b("div", Zy, [
            at(a, { context: i.title }, null, 8, ["context"]),
            at(l, { class: "hide-export flex items-center" })
          ])
        ]),
        b("div", null, [
          e.showTips ? (R(), W("div", Wy, [
            at(c)
          ])) : mt("", !0)
        ]),
        at(u, { ref: "diagram" }, null, 512)
      ], 512),
      b("div", Yy, [
        b("button", {
          class: "bottom-1 left-1 hide-export",
          onClick: t[0] || (t[0] = (f) => i.showTipsDialog())
        }, [
          (R(), W("svg", Ky, tv))
        ]),
        b("div", {
          class: "zoom-controls bg-skin-base text-skin-control flex justify-between w-28 hide-export",
          style: gt({ transform: `scale(${1 / e.scale})` })
        }, [
          b("button", {
            class: "zoom-in px-1",
            onClick: t[1] || (t[1] = (f) => i.zoomIn())
          }, "+"),
          b("label", null, Ht(Number(e.scale * 100).toFixed(0)) + " %", 1),
          b("button", {
            class: "zoom-out px-1",
            onClick: t[2] || (t[2] = (f) => i.zoomOut())
          }, "-")
        ], 4),
        at(d),
        ev
      ])
    ], 4)
  ], 2);
}
const rv = /* @__PURE__ */ xt($y, [["render", nv]]);
function J2() {
  return {
    baseUrl: null,
    breaks: !1,
    extensions: null,
    gfm: !0,
    headerIds: !0,
    headerPrefix: "",
    highlight: null,
    langPrefix: "language-",
    mangle: !0,
    pedantic: !1,
    renderer: null,
    sanitize: !1,
    sanitizer: null,
    silent: !1,
    smartLists: !1,
    smartypants: !1,
    tokenizer: null,
    walkTokens: null,
    xhtml: !1
  };
}
let fr = J2();
function sv(e) {
  fr = e;
}
const iv = /[&<>"']/, ov = /[&<>"']/g, av = /[<>"']|&(?!#?\w+;)/, lv = /[<>"']|&(?!#?\w+;)/g, cv = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Zl = (e) => cv[e];
function Ut(e, t) {
  if (t) {
    if (iv.test(e))
      return e.replace(ov, Zl);
  } else if (av.test(e))
    return e.replace(lv, Zl);
  return e;
}
const hv = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function th(e) {
  return e.replace(hv, (t, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const uv = /(^|[^\[])\^/g;
function Ct(e, t) {
  e = e.source || e, t = t || "";
  const n = {
    replace: (r, s) => (s = s.source || s, s = s.replace(uv, "$1"), e = e.replace(r, s), n),
    getRegex: () => new RegExp(e, t)
  };
  return n;
}
const dv = /[^\w:]/g, pv = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
function Wl(e, t, n) {
  if (e) {
    let r;
    try {
      r = decodeURIComponent(th(n)).replace(dv, "").toLowerCase();
    } catch {
      return null;
    }
    if (r.indexOf("javascript:") === 0 || r.indexOf("vbscript:") === 0 || r.indexOf("data:") === 0)
      return null;
  }
  t && !pv.test(n) && (n = xv(t, n));
  try {
    n = encodeURI(n).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return n;
}
const xs = {}, fv = /^[^:]+:\/*[^/]*$/, gv = /^([^:]+:)[\s\S]*$/, mv = /^([^:]+:\/*[^/]*)[\s\S]*$/;
function xv(e, t) {
  xs[" " + e] || (fv.test(e) ? xs[" " + e] = e + "/" : xs[" " + e] = ks(e, "/", !0)), e = xs[" " + e];
  const n = e.indexOf(":") === -1;
  return t.substring(0, 2) === "//" ? n ? t : e.replace(gv, "$1") + t : t.charAt(0) === "/" ? n ? t : e.replace(mv, "$1") + t : e + t;
}
const js = { exec: function() {
} };
function Ae(e) {
  let t = 1, n, r;
  for (; t < arguments.length; t++) {
    n = arguments[t];
    for (r in n)
      Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
  }
  return e;
}
function Yl(e, t) {
  const n = e.replace(/\|/g, (i, o, a) => {
    let l = !1, c = o;
    for (; --c >= 0 && a[c] === "\\"; )
      l = !l;
    return l ? "|" : " |";
  }), r = n.split(/ \|/);
  let s = 0;
  if (r[0].trim() || r.shift(), r[r.length - 1].trim() || r.pop(), r.length > t)
    r.splice(t);
  else
    for (; r.length < t; )
      r.push("");
  for (; s < r.length; s++)
    r[s] = r[s].trim().replace(/\\\|/g, "|");
  return r;
}
function ks(e, t, n) {
  const r = e.length;
  if (r === 0)
    return "";
  let s = 0;
  for (; s < r; ) {
    const i = e.charAt(r - s - 1);
    if (i === t && !n)
      s++;
    else if (i !== t && n)
      s++;
    else
      break;
  }
  return e.substr(0, r - s);
}
function Lv(e, t) {
  if (e.indexOf(t[1]) === -1)
    return -1;
  const n = e.length;
  let r = 0, s = 0;
  for (; s < n; s++)
    if (e[s] === "\\")
      s++;
    else if (e[s] === t[0])
      r++;
    else if (e[s] === t[1] && (r--, r < 0))
      return s;
  return -1;
}
function eh(e) {
  e && e.sanitize && !e.silent && console.warn("marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options");
}
function Kl(e, t) {
  if (t < 1)
    return "";
  let n = "";
  for (; t > 1; )
    t & 1 && (n += e), t >>= 1, e += e;
  return n + e;
}
function Ql(e, t, n, r) {
  const s = t.href, i = t.title ? Ut(t.title) : null, o = e[1].replace(/\\([\[\]])/g, "$1");
  if (e[0].charAt(0) !== "!") {
    r.state.inLink = !0;
    const a = {
      type: "link",
      raw: n,
      href: s,
      title: i,
      text: o,
      tokens: r.inlineTokens(o, [])
    };
    return r.state.inLink = !1, a;
  } else
    return {
      type: "image",
      raw: n,
      href: s,
      title: i,
      text: Ut(o)
    };
}
function yv(e, t) {
  const n = e.match(/^(\s+)(?:```)/);
  if (n === null)
    return t;
  const r = n[1];
  return t.split(`
`).map((s) => {
    const i = s.match(/^\s+/);
    if (i === null)
      return s;
    const [o] = i;
    return o.length >= r.length ? s.slice(r.length) : s;
  }).join(`
`);
}
class pa {
  constructor(t) {
    this.options = t || fr;
  }
  space(t) {
    const n = this.rules.block.newline.exec(t);
    if (n && n[0].length > 0)
      return {
        type: "space",
        raw: n[0]
      };
  }
  code(t) {
    const n = this.rules.block.code.exec(t);
    if (n) {
      const r = n[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: n[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? r : ks(r, `
`)
      };
    }
  }
  fences(t) {
    const n = this.rules.block.fences.exec(t);
    if (n) {
      const r = n[0], s = yv(r, n[3] || "");
      return {
        type: "code",
        raw: r,
        lang: n[2] ? n[2].trim() : n[2],
        text: s
      };
    }
  }
  heading(t) {
    const n = this.rules.block.heading.exec(t);
    if (n) {
      let r = n[2].trim();
      if (/#$/.test(r)) {
        const i = ks(r, "#");
        (this.options.pedantic || !i || / $/.test(i)) && (r = i.trim());
      }
      const s = {
        type: "heading",
        raw: n[0],
        depth: n[1].length,
        text: r,
        tokens: []
      };
      return this.lexer.inline(s.text, s.tokens), s;
    }
  }
  hr(t) {
    const n = this.rules.block.hr.exec(t);
    if (n)
      return {
        type: "hr",
        raw: n[0]
      };
  }
  blockquote(t) {
    const n = this.rules.block.blockquote.exec(t);
    if (n) {
      const r = n[0].replace(/^ *> ?/gm, "");
      return {
        type: "blockquote",
        raw: n[0],
        tokens: this.lexer.blockTokens(r, []),
        text: r
      };
    }
  }
  list(t) {
    let n = this.rules.block.list.exec(t);
    if (n) {
      let r, s, i, o, a, l, c, u, d, f, m, I, M = n[1].trim();
      const tt = M.length > 1, G = {
        type: "list",
        raw: "",
        ordered: tt,
        start: tt ? +M.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      M = tt ? `\\d{1,9}\\${M.slice(-1)}` : `\\${M}`, this.options.pedantic && (M = tt ? M : "[*+-]");
      const J = new RegExp(`^( {0,3}${M})((?: [^\\n]*)?(?:\\n|$))`);
      for (; t && (I = !1, !(!(n = J.exec(t)) || this.rules.block.hr.test(t))); ) {
        if (r = n[0], t = t.substring(r.length), u = n[2].split(`
`, 1)[0], d = t.split(`
`, 1)[0], this.options.pedantic ? (o = 2, m = u.trimLeft()) : (o = n[2].search(/[^ ]/), o = o > 4 ? 1 : o, m = u.slice(o), o += n[1].length), l = !1, !u && /^ *$/.test(d) && (r += d + `
`, t = t.substring(d.length + 1), I = !0), !I) {
          const Q = new RegExp(`^ {0,${Math.min(3, o - 1)}}(?:[*+-]|\\d{1,9}[.)])`);
          for (; t && (f = t.split(`
`, 1)[0], u = f, this.options.pedantic && (u = u.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), !Q.test(u)); ) {
            if (u.search(/[^ ]/) >= o || !u.trim())
              m += `
` + u.slice(o);
            else if (!l)
              m += `
` + u;
            else
              break;
            !l && !u.trim() && (l = !0), r += f + `
`, t = t.substring(f.length + 1);
          }
        }
        G.loose || (c ? G.loose = !0 : /\n *\n *$/.test(r) && (c = !0)), this.options.gfm && (s = /^\[[ xX]\] /.exec(m), s && (i = s[0] !== "[ ] ", m = m.replace(/^\[[ xX]\] +/, ""))), G.items.push({
          type: "list_item",
          raw: r,
          task: !!s,
          checked: i,
          loose: !1,
          text: m
        }), G.raw += r;
      }
      G.items[G.items.length - 1].raw = r.trimRight(), G.items[G.items.length - 1].text = m.trimRight(), G.raw = G.raw.trimRight();
      const q = G.items.length;
      for (a = 0; a < q; a++) {
        this.lexer.state.top = !1, G.items[a].tokens = this.lexer.blockTokens(G.items[a].text, []);
        const Q = G.items[a].tokens.filter((Dt) => Dt.type === "space"), Rt = Q.every((Dt) => {
          const we = Dt.raw.split("");
          let Gt = 0;
          for (const rn of we)
            if (rn === `
` && (Gt += 1), Gt > 1)
              return !0;
          return !1;
        });
        !G.loose && Q.length && Rt && (G.loose = !0, G.items[a].loose = !0);
      }
      return G;
    }
  }
  html(t) {
    const n = this.rules.block.html.exec(t);
    if (n) {
      const r = {
        type: "html",
        raw: n[0],
        pre: !this.options.sanitizer && (n[1] === "pre" || n[1] === "script" || n[1] === "style"),
        text: n[0]
      };
      return this.options.sanitize && (r.type = "paragraph", r.text = this.options.sanitizer ? this.options.sanitizer(n[0]) : Ut(n[0]), r.tokens = [], this.lexer.inline(r.text, r.tokens)), r;
    }
  }
  def(t) {
    const n = this.rules.block.def.exec(t);
    if (n)
      return n[3] && (n[3] = n[3].substring(1, n[3].length - 1)), {
        type: "def",
        tag: n[1].toLowerCase().replace(/\s+/g, " "),
        raw: n[0],
        href: n[2],
        title: n[3]
      };
  }
  table(t) {
    const n = this.rules.block.table.exec(t);
    if (n) {
      const r = {
        type: "table",
        header: Yl(n[1]).map((s) => ({ text: s })),
        align: n[2].replace(/^ *|\| *$/g, "").split(/ *\| */),
        rows: n[3] ? n[3].replace(/\n[ \t]*$/, "").split(`
`) : []
      };
      if (r.header.length === r.align.length) {
        r.raw = n[0];
        let s = r.align.length, i, o, a, l;
        for (i = 0; i < s; i++)
          /^ *-+: *$/.test(r.align[i]) ? r.align[i] = "right" : /^ *:-+: *$/.test(r.align[i]) ? r.align[i] = "center" : /^ *:-+ *$/.test(r.align[i]) ? r.align[i] = "left" : r.align[i] = null;
        for (s = r.rows.length, i = 0; i < s; i++)
          r.rows[i] = Yl(r.rows[i], r.header.length).map((c) => ({ text: c }));
        for (s = r.header.length, o = 0; o < s; o++)
          r.header[o].tokens = [], this.lexer.inlineTokens(r.header[o].text, r.header[o].tokens);
        for (s = r.rows.length, o = 0; o < s; o++)
          for (l = r.rows[o], a = 0; a < l.length; a++)
            l[a].tokens = [], this.lexer.inlineTokens(l[a].text, l[a].tokens);
        return r;
      }
    }
  }
  lheading(t) {
    const n = this.rules.block.lheading.exec(t);
    if (n) {
      const r = {
        type: "heading",
        raw: n[0],
        depth: n[2].charAt(0) === "=" ? 1 : 2,
        text: n[1],
        tokens: []
      };
      return this.lexer.inline(r.text, r.tokens), r;
    }
  }
  paragraph(t) {
    const n = this.rules.block.paragraph.exec(t);
    if (n) {
      const r = {
        type: "paragraph",
        raw: n[0],
        text: n[1].charAt(n[1].length - 1) === `
` ? n[1].slice(0, -1) : n[1],
        tokens: []
      };
      return this.lexer.inline(r.text, r.tokens), r;
    }
  }
  text(t) {
    const n = this.rules.block.text.exec(t);
    if (n) {
      const r = {
        type: "text",
        raw: n[0],
        text: n[0],
        tokens: []
      };
      return this.lexer.inline(r.text, r.tokens), r;
    }
  }
  escape(t) {
    const n = this.rules.inline.escape.exec(t);
    if (n)
      return {
        type: "escape",
        raw: n[0],
        text: Ut(n[1])
      };
  }
  tag(t) {
    const n = this.rules.inline.tag.exec(t);
    if (n)
      return !this.lexer.state.inLink && /^<a /i.test(n[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(n[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(n[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(n[0]) && (this.lexer.state.inRawBlock = !1), {
        type: this.options.sanitize ? "text" : "html",
        raw: n[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(n[0]) : Ut(n[0]) : n[0]
      };
  }
  link(t) {
    const n = this.rules.inline.link.exec(t);
    if (n) {
      const r = n[2].trim();
      if (!this.options.pedantic && /^</.test(r)) {
        if (!/>$/.test(r))
          return;
        const o = ks(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = Lv(n[2], "()");
        if (o > -1) {
          const a = (n[0].indexOf("!") === 0 ? 5 : 4) + n[1].length + o;
          n[2] = n[2].substring(0, o), n[0] = n[0].substring(0, a).trim(), n[3] = "";
        }
      }
      let s = n[2], i = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);
        o && (s = o[1], i = o[3]);
      } else
        i = n[3] ? n[3].slice(1, -1) : "";
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(r) ? s = s.slice(1) : s = s.slice(1, -1)), Ql(n, {
        href: s && s.replace(this.rules.inline._escapes, "$1"),
        title: i && i.replace(this.rules.inline._escapes, "$1")
      }, n[0], this.lexer);
    }
  }
  reflink(t, n) {
    let r;
    if ((r = this.rules.inline.reflink.exec(t)) || (r = this.rules.inline.nolink.exec(t))) {
      let s = (r[2] || r[1]).replace(/\s+/g, " ");
      if (s = n[s.toLowerCase()], !s || !s.href) {
        const i = r[0].charAt(0);
        return {
          type: "text",
          raw: i,
          text: i
        };
      }
      return Ql(r, s, r[0], this.lexer);
    }
  }
  emStrong(t, n, r = "") {
    let s = this.rules.inline.emStrong.lDelim.exec(t);
    if (!s || s[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    const i = s[1] || s[2] || "";
    if (!i || i && (r === "" || this.rules.inline.punctuation.exec(r))) {
      const o = s[0].length - 1;
      let a, l, c = o, u = 0;
      const d = s[0][0] === "*" ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
      for (d.lastIndex = 0, n = n.slice(-1 * t.length + o); (s = d.exec(n)) != null; ) {
        if (a = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !a)
          continue;
        if (l = a.length, s[3] || s[4]) {
          c += l;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + l) % 3)) {
          u += l;
          continue;
        }
        if (c -= l, c > 0)
          continue;
        if (l = Math.min(l, l + c + u), Math.min(o, l) % 2) {
          const m = t.slice(1, o + s.index + l);
          return {
            type: "em",
            raw: t.slice(0, o + s.index + l + 1),
            text: m,
            tokens: this.lexer.inlineTokens(m, [])
          };
        }
        const f = t.slice(2, o + s.index + l - 1);
        return {
          type: "strong",
          raw: t.slice(0, o + s.index + l + 1),
          text: f,
          tokens: this.lexer.inlineTokens(f, [])
        };
      }
    }
  }
  codespan(t) {
    const n = this.rules.inline.code.exec(t);
    if (n) {
      let r = n[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(r), i = /^ /.test(r) && / $/.test(r);
      return s && i && (r = r.substring(1, r.length - 1)), r = Ut(r, !0), {
        type: "codespan",
        raw: n[0],
        text: r
      };
    }
  }
  br(t) {
    const n = this.rules.inline.br.exec(t);
    if (n)
      return {
        type: "br",
        raw: n[0]
      };
  }
  del(t) {
    const n = this.rules.inline.del.exec(t);
    if (n)
      return {
        type: "del",
        raw: n[0],
        text: n[2],
        tokens: this.lexer.inlineTokens(n[2], [])
      };
  }
  autolink(t, n) {
    const r = this.rules.inline.autolink.exec(t);
    if (r) {
      let s, i;
      return r[2] === "@" ? (s = Ut(this.options.mangle ? n(r[1]) : r[1]), i = "mailto:" + s) : (s = Ut(r[1]), i = s), {
        type: "link",
        raw: r[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  url(t, n) {
    let r;
    if (r = this.rules.inline.url.exec(t)) {
      let s, i;
      if (r[2] === "@")
        s = Ut(this.options.mangle ? n(r[0]) : r[0]), i = "mailto:" + s;
      else {
        let o;
        do
          o = r[0], r[0] = this.rules.inline._backpedal.exec(r[0])[0];
        while (o !== r[0]);
        s = Ut(r[0]), r[1] === "www." ? i = "http://" + s : i = s;
      }
      return {
        type: "link",
        raw: r[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  inlineText(t, n) {
    const r = this.rules.inline.text.exec(t);
    if (r) {
      let s;
      return this.lexer.state.inRawBlock ? s = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(r[0]) : Ut(r[0]) : r[0] : s = Ut(this.options.smartypants ? n(r[0]) : r[0]), {
        type: "text",
        raw: r[0],
        text: s
      };
    }
  }
}
const Y = {
  newline: /^(?: *(?:\n|$))+/,
  code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
  fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3}bull)( [^\n]+?)?(?:\n|$)/,
  html: "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))",
  def: /^ {0,3}\[(label)\]: *(?:\n *)?<?([^\s>]+)>?(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/,
  table: js,
  lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
  _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  text: /^[^\n]+/
};
Y._label = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
Y._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
Y.def = Ct(Y.def).replace("label", Y._label).replace("title", Y._title).getRegex();
Y.bullet = /(?:[*+-]|\d{1,9}[.)])/;
Y.listItemStart = Ct(/^( *)(bull) */).replace("bull", Y.bullet).getRegex();
Y.list = Ct(Y.list).replace(/bull/g, Y.bullet).replace("hr", "\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))").replace("def", "\\n+(?=" + Y.def.source + ")").getRegex();
Y._tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
Y._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
Y.html = Ct(Y.html, "i").replace("comment", Y._comment).replace("tag", Y._tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
Y.paragraph = Ct(Y._paragraph).replace("hr", Y.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Y._tag).getRegex();
Y.blockquote = Ct(Y.blockquote).replace("paragraph", Y.paragraph).getRegex();
Y.normal = Ae({}, Y);
Y.gfm = Ae({}, Y.normal, {
  table: "^ *([^\\n ].*\\|.*)\\n {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
});
Y.gfm.table = Ct(Y.gfm.table).replace("hr", Y.hr).replace("heading", " {0,3}#{1,6} ").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Y._tag).getRegex();
Y.gfm.paragraph = Ct(Y._paragraph).replace("hr", Y.hr).replace("heading", " {0,3}#{1,6} ").replace("|lheading", "").replace("table", Y.gfm.table).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Y._tag).getRegex();
Y.pedantic = Ae({}, Y.normal, {
  html: Ct(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", Y._comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: js,
  paragraph: Ct(Y.normal._paragraph).replace("hr", Y.hr).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Y.lheading).replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").getRegex()
});
const U = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: js,
  tag: "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",
  link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(ref)\]/,
  nolink: /^!?\[(ref)\](?:\[\])?/,
  reflinkSearch: "reflink|nolink(?!\\()",
  emStrong: {
    lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
    rDelimAst: /^[^_*]*?\_\_[^_*]*?\*[^_*]*?(?=\_\_)|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
    rDelimUnd: /^[^_*]*?\*\*[^_*]*?\_[^_*]*?(?=\*\*)|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/
  },
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: js,
  text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  punctuation: /^([\spunctuation])/
};
U._punctuation = "!\"#$%&'()+\\-.,/:;<=>?@\\[\\]`^{|}~";
U.punctuation = Ct(U.punctuation).replace(/punctuation/g, U._punctuation).getRegex();
U.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
U.escapedEmSt = /\\\*|\\_/g;
U._comment = Ct(Y._comment).replace("(?:-->|$)", "-->").getRegex();
U.emStrong.lDelim = Ct(U.emStrong.lDelim).replace(/punct/g, U._punctuation).getRegex();
U.emStrong.rDelimAst = Ct(U.emStrong.rDelimAst, "g").replace(/punct/g, U._punctuation).getRegex();
U.emStrong.rDelimUnd = Ct(U.emStrong.rDelimUnd, "g").replace(/punct/g, U._punctuation).getRegex();
U._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
U._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
U._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
U.autolink = Ct(U.autolink).replace("scheme", U._scheme).replace("email", U._email).getRegex();
U._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
U.tag = Ct(U.tag).replace("comment", U._comment).replace("attribute", U._attribute).getRegex();
U._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
U._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
U._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
U.link = Ct(U.link).replace("label", U._label).replace("href", U._href).replace("title", U._title).getRegex();
U.reflink = Ct(U.reflink).replace("label", U._label).replace("ref", Y._label).getRegex();
U.nolink = Ct(U.nolink).replace("ref", Y._label).getRegex();
U.reflinkSearch = Ct(U.reflinkSearch, "g").replace("reflink", U.reflink).replace("nolink", U.nolink).getRegex();
U.normal = Ae({}, U);
U.pedantic = Ae({}, U.normal, {
  strong: {
    start: /^__|\*\*/,
    middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    endAst: /\*\*(?!\*)/g,
    endUnd: /__(?!_)/g
  },
  em: {
    start: /^_|\*/,
    middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
    endAst: /\*(?!\*)/g,
    endUnd: /_(?!_)/g
  },
  link: Ct(/^!?\[(label)\]\((.*?)\)/).replace("label", U._label).getRegex(),
  reflink: Ct(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", U._label).getRegex()
});
U.gfm = Ae({}, U.normal, {
  escape: Ct(U.escape).replace("])", "~|])").getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
});
U.gfm.url = Ct(U.gfm.url, "i").replace("email", U.gfm._extended_email).getRegex();
U.breaks = Ae({}, U.gfm, {
  br: Ct(U.br).replace("{2,}", "*").getRegex(),
  text: Ct(U.gfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
});
function vv(e) {
  return e.replace(/---/g, "—").replace(/--/g, "–").replace(/(^|[-\u2014/(\[{"\s])'/g, "$1‘").replace(/'/g, "’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1“").replace(/"/g, "”").replace(/\.{3}/g, "…");
}
function Xl(e) {
  let t = "", n, r;
  const s = e.length;
  for (n = 0; n < s; n++)
    r = e.charCodeAt(n), Math.random() > 0.5 && (r = "x" + r.toString(16)), t += "&#" + r + ";";
  return t;
}
class Je {
  constructor(t) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || fr, this.options.tokenizer = this.options.tokenizer || new pa(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: Y.normal,
      inline: U.normal
    };
    this.options.pedantic ? (n.block = Y.pedantic, n.inline = U.pedantic) : this.options.gfm && (n.block = Y.gfm, this.options.breaks ? n.inline = U.breaks : n.inline = U.gfm), this.tokenizer.rules = n;
  }
  static get rules() {
    return {
      block: Y,
      inline: U
    };
  }
  static lex(t, n) {
    return new Je(n).lex(t);
  }
  static lexInline(t, n) {
    return new Je(n).inlineTokens(t);
  }
  lex(t) {
    t = t.replace(/\r\n|\r/g, `
`).replace(/\t/g, "    "), this.blockTokens(t, this.tokens);
    let n;
    for (; n = this.inlineQueue.shift(); )
      this.inlineTokens(n.src, n.tokens);
    return this.tokens;
  }
  blockTokens(t, n = []) {
    this.options.pedantic && (t = t.replace(/^ +$/gm, ""));
    let r, s, i, o;
    for (; t; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((a) => (r = a.call({ lexer: this }, t, n)) ? (t = t.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.space(t)) {
          t = t.substring(r.raw.length), r.raw.length === 1 && n.length > 0 ? n[n.length - 1].raw += `
` : n.push(r);
          continue;
        }
        if (r = this.tokenizer.code(t)) {
          t = t.substring(r.raw.length), s = n[n.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.fences(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.heading(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.hr(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.blockquote(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.list(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.html(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.def(t)) {
          t = t.substring(r.raw.length), s = n[n.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.raw, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
            href: r.href,
            title: r.title
          });
          continue;
        }
        if (r = this.tokenizer.table(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.lheading(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (i = t, this.options.extensions && this.options.extensions.startBlock) {
          let a = 1 / 0;
          const l = t.slice(1);
          let c;
          this.options.extensions.startBlock.forEach(function(u) {
            c = u.call({ lexer: this }, l), typeof c == "number" && c >= 0 && (a = Math.min(a, c));
          }), a < 1 / 0 && a >= 0 && (i = t.substring(0, a + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(i))) {
          s = n[n.length - 1], o && s.type === "paragraph" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : n.push(r), o = i.length !== t.length, t = t.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(t)) {
          t = t.substring(r.raw.length), s = n[n.length - 1], s && s.type === "text" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : n.push(r);
          continue;
        }
        if (t) {
          const a = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(a);
            break;
          } else
            throw new Error(a);
        }
      }
    return this.state.top = !0, n;
  }
  inline(t, n) {
    this.inlineQueue.push({ src: t, tokens: n });
  }
  inlineTokens(t, n = []) {
    let r, s, i, o = t, a, l, c;
    if (this.tokens.links) {
      const u = Object.keys(this.tokens.links);
      if (u.length > 0)
        for (; (a = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          u.includes(a[0].slice(a[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, a.index) + "[" + Kl("a", a[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (a = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, a.index) + "[" + Kl("a", a[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (a = this.tokenizer.rules.inline.escapedEmSt.exec(o)) != null; )
      o = o.slice(0, a.index) + "++" + o.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
    for (; t; )
      if (l || (c = ""), l = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((u) => (r = u.call({ lexer: this }, t, n)) ? (t = t.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.escape(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.tag(t)) {
          t = t.substring(r.raw.length), s = n[n.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.link(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.reflink(t, this.tokens.links)) {
          t = t.substring(r.raw.length), s = n[n.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.emStrong(t, o, c)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.codespan(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.br(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.del(t)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.autolink(t, Xl)) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (!this.state.inLink && (r = this.tokenizer.url(t, Xl))) {
          t = t.substring(r.raw.length), n.push(r);
          continue;
        }
        if (i = t, this.options.extensions && this.options.extensions.startInline) {
          let u = 1 / 0;
          const d = t.slice(1);
          let f;
          this.options.extensions.startInline.forEach(function(m) {
            f = m.call({ lexer: this }, d), typeof f == "number" && f >= 0 && (u = Math.min(u, f));
          }), u < 1 / 0 && u >= 0 && (i = t.substring(0, u + 1));
        }
        if (r = this.tokenizer.inlineText(i, vv)) {
          t = t.substring(r.raw.length), r.raw.slice(-1) !== "_" && (c = r.raw.slice(-1)), l = !0, s = n[n.length - 1], s && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
          continue;
        }
        if (t) {
          const u = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(u);
            break;
          } else
            throw new Error(u);
        }
      }
    return n;
  }
}
class fa {
  constructor(t) {
    this.options = t || fr;
  }
  code(t, n, r) {
    const s = (n || "").match(/\S*/)[0];
    if (this.options.highlight) {
      const i = this.options.highlight(t, s);
      i != null && i !== t && (r = !0, t = i);
    }
    return t = t.replace(/\n$/, "") + `
`, s ? '<pre><code class="' + this.options.langPrefix + Ut(s, !0) + '">' + (r ? t : Ut(t, !0)) + `</code></pre>
` : "<pre><code>" + (r ? t : Ut(t, !0)) + `</code></pre>
`;
  }
  blockquote(t) {
    return `<blockquote>
` + t + `</blockquote>
`;
  }
  html(t) {
    return t;
  }
  heading(t, n, r, s) {
    return this.options.headerIds ? "<h" + n + ' id="' + this.options.headerPrefix + s.slug(r) + '">' + t + "</h" + n + `>
` : "<h" + n + ">" + t + "</h" + n + `>
`;
  }
  hr() {
    return this.options.xhtml ? `<hr/>
` : `<hr>
`;
  }
  list(t, n, r) {
    const s = n ? "ol" : "ul", i = n && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + s + i + `>
` + t + "</" + s + `>
`;
  }
  listitem(t) {
    return "<li>" + t + `</li>
`;
  }
  checkbox(t) {
    return "<input " + (t ? 'checked="" ' : "") + 'disabled="" type="checkbox"' + (this.options.xhtml ? " /" : "") + "> ";
  }
  paragraph(t) {
    return "<p>" + t + `</p>
`;
  }
  table(t, n) {
    return n && (n = "<tbody>" + n + "</tbody>"), `<table>
<thead>
` + t + `</thead>
` + n + `</table>
`;
  }
  tablerow(t) {
    return `<tr>
` + t + `</tr>
`;
  }
  tablecell(t, n) {
    const r = n.header ? "th" : "td";
    return (n.align ? "<" + r + ' align="' + n.align + '">' : "<" + r + ">") + t + "</" + r + `>
`;
  }
  strong(t) {
    return "<strong>" + t + "</strong>";
  }
  em(t) {
    return "<em>" + t + "</em>";
  }
  codespan(t) {
    return "<code>" + t + "</code>";
  }
  br() {
    return this.options.xhtml ? "<br/>" : "<br>";
  }
  del(t) {
    return "<del>" + t + "</del>";
  }
  link(t, n, r) {
    if (t = Wl(this.options.sanitize, this.options.baseUrl, t), t === null)
      return r;
    let s = '<a href="' + Ut(t) + '"';
    return n && (s += ' title="' + n + '"'), s += ">" + r + "</a>", s;
  }
  image(t, n, r) {
    if (t = Wl(this.options.sanitize, this.options.baseUrl, t), t === null)
      return r;
    let s = '<img src="' + t + '" alt="' + r + '"';
    return n && (s += ' title="' + n + '"'), s += this.options.xhtml ? "/>" : ">", s;
  }
  text(t) {
    return t;
  }
}
class nh {
  strong(t) {
    return t;
  }
  em(t) {
    return t;
  }
  codespan(t) {
    return t;
  }
  del(t) {
    return t;
  }
  html(t) {
    return t;
  }
  text(t) {
    return t;
  }
  link(t, n, r) {
    return "" + r;
  }
  image(t, n, r) {
    return "" + r;
  }
  br() {
    return "";
  }
}
class rh {
  constructor() {
    this.seen = {};
  }
  serialize(t) {
    return t.toLowerCase().trim().replace(/<[!\/a-z].*?>/ig, "").replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, "").replace(/\s/g, "-");
  }
  getNextSafeSlug(t, n) {
    let r = t, s = 0;
    if (this.seen.hasOwnProperty(r)) {
      s = this.seen[t];
      do
        s++, r = t + "-" + s;
      while (this.seen.hasOwnProperty(r));
    }
    return n || (this.seen[t] = s, this.seen[r] = 0), r;
  }
  slug(t, n = {}) {
    const r = this.serialize(t);
    return this.getNextSafeSlug(r, n.dryrun);
  }
}
class tn {
  constructor(t) {
    this.options = t || fr, this.options.renderer = this.options.renderer || new fa(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new nh(), this.slugger = new rh();
  }
  static parse(t, n) {
    return new tn(n).parse(t);
  }
  static parseInline(t, n) {
    return new tn(n).parseInline(t);
  }
  parse(t, n = !0) {
    let r = "", s, i, o, a, l, c, u, d, f, m, I, M, tt, G, J, q, Q, Rt, Dt;
    const we = t.length;
    for (s = 0; s < we; s++) {
      if (m = t[s], this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[m.type] && (Dt = this.options.extensions.renderers[m.type].call({ parser: this }, m), Dt !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(m.type))) {
        r += Dt || "";
        continue;
      }
      switch (m.type) {
        case "space":
          continue;
        case "hr": {
          r += this.renderer.hr();
          continue;
        }
        case "heading": {
          r += this.renderer.heading(
            this.parseInline(m.tokens),
            m.depth,
            th(this.parseInline(m.tokens, this.textRenderer)),
            this.slugger
          );
          continue;
        }
        case "code": {
          r += this.renderer.code(
            m.text,
            m.lang,
            m.escaped
          );
          continue;
        }
        case "table": {
          for (d = "", u = "", a = m.header.length, i = 0; i < a; i++)
            u += this.renderer.tablecell(
              this.parseInline(m.header[i].tokens),
              { header: !0, align: m.align[i] }
            );
          for (d += this.renderer.tablerow(u), f = "", a = m.rows.length, i = 0; i < a; i++) {
            for (c = m.rows[i], u = "", l = c.length, o = 0; o < l; o++)
              u += this.renderer.tablecell(
                this.parseInline(c[o].tokens),
                { header: !1, align: m.align[o] }
              );
            f += this.renderer.tablerow(u);
          }
          r += this.renderer.table(d, f);
          continue;
        }
        case "blockquote": {
          f = this.parse(m.tokens), r += this.renderer.blockquote(f);
          continue;
        }
        case "list": {
          for (I = m.ordered, M = m.start, tt = m.loose, a = m.items.length, f = "", i = 0; i < a; i++)
            J = m.items[i], q = J.checked, Q = J.task, G = "", J.task && (Rt = this.renderer.checkbox(q), tt ? J.tokens.length > 0 && J.tokens[0].type === "paragraph" ? (J.tokens[0].text = Rt + " " + J.tokens[0].text, J.tokens[0].tokens && J.tokens[0].tokens.length > 0 && J.tokens[0].tokens[0].type === "text" && (J.tokens[0].tokens[0].text = Rt + " " + J.tokens[0].tokens[0].text)) : J.tokens.unshift({
              type: "text",
              text: Rt
            }) : G += Rt), G += this.parse(J.tokens, tt), f += this.renderer.listitem(G, Q, q);
          r += this.renderer.list(f, I, M);
          continue;
        }
        case "html": {
          r += this.renderer.html(m.text);
          continue;
        }
        case "paragraph": {
          r += this.renderer.paragraph(this.parseInline(m.tokens));
          continue;
        }
        case "text": {
          for (f = m.tokens ? this.parseInline(m.tokens) : m.text; s + 1 < we && t[s + 1].type === "text"; )
            m = t[++s], f += `
` + (m.tokens ? this.parseInline(m.tokens) : m.text);
          r += n ? this.renderer.paragraph(f) : f;
          continue;
        }
        default: {
          const Gt = 'Token with "' + m.type + '" type was not found.';
          if (this.options.silent) {
            console.error(Gt);
            return;
          } else
            throw new Error(Gt);
        }
      }
    }
    return r;
  }
  parseInline(t, n) {
    n = n || this.renderer;
    let r = "", s, i, o;
    const a = t.length;
    for (s = 0; s < a; s++) {
      if (i = t[s], this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[i.type] && (o = this.options.extensions.renderers[i.type].call({ parser: this }, i), o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type))) {
        r += o || "";
        continue;
      }
      switch (i.type) {
        case "escape": {
          r += n.text(i.text);
          break;
        }
        case "html": {
          r += n.html(i.text);
          break;
        }
        case "link": {
          r += n.link(i.href, i.title, this.parseInline(i.tokens, n));
          break;
        }
        case "image": {
          r += n.image(i.href, i.title, i.text);
          break;
        }
        case "strong": {
          r += n.strong(this.parseInline(i.tokens, n));
          break;
        }
        case "em": {
          r += n.em(this.parseInline(i.tokens, n));
          break;
        }
        case "codespan": {
          r += n.codespan(i.text);
          break;
        }
        case "br": {
          r += n.br();
          break;
        }
        case "del": {
          r += n.del(this.parseInline(i.tokens, n));
          break;
        }
        case "text": {
          r += n.text(i.text);
          break;
        }
        default: {
          const l = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent) {
            console.error(l);
            return;
          } else
            throw new Error(l);
        }
      }
    }
    return r;
  }
}
function K(e, t, n) {
  if (typeof e > "u" || e === null)
    throw new Error("marked(): input parameter is undefined or null");
  if (typeof e != "string")
    throw new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected");
  if (typeof t == "function" && (n = t, t = null), t = Ae({}, K.defaults, t || {}), eh(t), n) {
    const r = t.highlight;
    let s;
    try {
      s = Je.lex(e, t);
    } catch (a) {
      return n(a);
    }
    const i = function(a) {
      let l;
      if (!a)
        try {
          t.walkTokens && K.walkTokens(s, t.walkTokens), l = tn.parse(s, t);
        } catch (c) {
          a = c;
        }
      return t.highlight = r, a ? n(a) : n(null, l);
    };
    if (!r || r.length < 3 || (delete t.highlight, !s.length))
      return i();
    let o = 0;
    K.walkTokens(s, function(a) {
      a.type === "code" && (o++, setTimeout(() => {
        r(a.text, a.lang, function(l, c) {
          if (l)
            return i(l);
          c != null && c !== a.text && (a.text = c, a.escaped = !0), o--, o === 0 && i();
        });
      }, 0));
    }), o === 0 && i();
    return;
  }
  try {
    const r = Je.lex(e, t);
    return t.walkTokens && K.walkTokens(r, t.walkTokens), tn.parse(r, t);
  } catch (r) {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, t.silent)
      return "<p>An error occurred:</p><pre>" + Ut(r.message + "", !0) + "</pre>";
    throw r;
  }
}
K.options = K.setOptions = function(e) {
  return Ae(K.defaults, e), sv(K.defaults), K;
};
K.getDefaults = J2;
K.defaults = fr;
K.use = function(...e) {
  const t = Ae({}, ...e), n = K.defaults.extensions || { renderers: {}, childTokens: {} };
  let r;
  e.forEach((s) => {
    if (s.extensions && (r = !0, s.extensions.forEach((i) => {
      if (!i.name)
        throw new Error("extension name required");
      if (i.renderer) {
        const o = n.renderers ? n.renderers[i.name] : null;
        o ? n.renderers[i.name] = function(...a) {
          let l = i.renderer.apply(this, a);
          return l === !1 && (l = o.apply(this, a)), l;
        } : n.renderers[i.name] = i.renderer;
      }
      if (i.tokenizer) {
        if (!i.level || i.level !== "block" && i.level !== "inline")
          throw new Error("extension level must be 'block' or 'inline'");
        n[i.level] ? n[i.level].unshift(i.tokenizer) : n[i.level] = [i.tokenizer], i.start && (i.level === "block" ? n.startBlock ? n.startBlock.push(i.start) : n.startBlock = [i.start] : i.level === "inline" && (n.startInline ? n.startInline.push(i.start) : n.startInline = [i.start]));
      }
      i.childTokens && (n.childTokens[i.name] = i.childTokens);
    })), s.renderer) {
      const i = K.defaults.renderer || new fa();
      for (const o in s.renderer) {
        const a = i[o];
        i[o] = (...l) => {
          let c = s.renderer[o].apply(i, l);
          return c === !1 && (c = a.apply(i, l)), c;
        };
      }
      t.renderer = i;
    }
    if (s.tokenizer) {
      const i = K.defaults.tokenizer || new pa();
      for (const o in s.tokenizer) {
        const a = i[o];
        i[o] = (...l) => {
          let c = s.tokenizer[o].apply(i, l);
          return c === !1 && (c = a.apply(i, l)), c;
        };
      }
      t.tokenizer = i;
    }
    if (s.walkTokens) {
      const i = K.defaults.walkTokens;
      t.walkTokens = function(o) {
        s.walkTokens.call(this, o), i && i.call(this, o);
      };
    }
    r && (t.extensions = n), K.setOptions(t);
  });
};
K.walkTokens = function(e, t) {
  for (const n of e)
    switch (t.call(K, n), n.type) {
      case "table": {
        for (const r of n.header)
          K.walkTokens(r.tokens, t);
        for (const r of n.rows)
          for (const s of r)
            K.walkTokens(s.tokens, t);
        break;
      }
      case "list": {
        K.walkTokens(n.items, t);
        break;
      }
      default:
        K.defaults.extensions && K.defaults.extensions.childTokens && K.defaults.extensions.childTokens[n.type] ? K.defaults.extensions.childTokens[n.type].forEach(function(r) {
          K.walkTokens(n[r], t);
        }) : n.tokens && K.walkTokens(n.tokens, t);
    }
};
K.parseInline = function(e, t) {
  if (typeof e > "u" || e === null)
    throw new Error("marked.parseInline(): input parameter is undefined or null");
  if (typeof e != "string")
    throw new Error("marked.parseInline(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected");
  t = Ae({}, K.defaults, t || {}), eh(t);
  try {
    const n = Je.lexInline(e, t);
    return t.walkTokens && K.walkTokens(n, t.walkTokens), tn.parseInline(n, t);
  } catch (n) {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, t.silent)
      return "<p>An error occurred:</p><pre>" + Ut(n.message + "", !0) + "</pre>";
    throw n;
  }
};
K.Parser = tn;
K.parser = tn.parse;
K.Renderer = fa;
K.TextRenderer = nh;
K.Lexer = Je;
K.lexer = Je.lex;
K.Tokenizer = pa;
K.Slugger = rh;
K.parse = K;
K.options;
K.setOptions;
K.use;
K.walkTokens;
K.parseInline;
tn.parse;
Je.lex;
function ga(e) {
  return e instanceof Map ? e.clear = e.delete = e.set = function() {
    throw new Error("map is read-only");
  } : e instanceof Set && (e.add = e.clear = e.delete = function() {
    throw new Error("set is read-only");
  }), Object.freeze(e), Object.getOwnPropertyNames(e).forEach(function(t) {
    var n = e[t];
    typeof n == "object" && !Object.isFrozen(n) && ga(n);
  }), e;
}
var sh = ga, bv = ga;
sh.default = bv;
class Jl {
  constructor(t) {
    t.data === void 0 && (t.data = {}), this.data = t.data, this.isMatchIgnored = !1;
  }
  ignoreMatch() {
    this.isMatchIgnored = !0;
  }
}
function Kn(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
function cn(e, ...t) {
  const n = /* @__PURE__ */ Object.create(null);
  for (const r in e)
    n[r] = e[r];
  return t.forEach(function(r) {
    for (const s in r)
      n[s] = r[s];
  }), n;
}
const wv = "</span>", t0 = (e) => !!e.kind;
class Cv {
  constructor(t, n) {
    this.buffer = "", this.classPrefix = n.classPrefix, t.walk(this);
  }
  addText(t) {
    this.buffer += Kn(t);
  }
  openNode(t) {
    if (!t0(t))
      return;
    let n = t.kind;
    t.sublanguage || (n = `${this.classPrefix}${n}`), this.span(n);
  }
  closeNode(t) {
    !t0(t) || (this.buffer += wv);
  }
  value() {
    return this.buffer;
  }
  span(t) {
    this.buffer += `<span class="${t}">`;
  }
}
class ma {
  constructor() {
    this.rootNode = { children: [] }, this.stack = [this.rootNode];
  }
  get top() {
    return this.stack[this.stack.length - 1];
  }
  get root() {
    return this.rootNode;
  }
  add(t) {
    this.top.children.push(t);
  }
  openNode(t) {
    const n = { kind: t, children: [] };
    this.add(n), this.stack.push(n);
  }
  closeNode() {
    if (this.stack.length > 1)
      return this.stack.pop();
  }
  closeAllNodes() {
    for (; this.closeNode(); )
      ;
  }
  toJSON() {
    return JSON.stringify(this.rootNode, null, 4);
  }
  walk(t) {
    return this.constructor._walk(t, this.rootNode);
  }
  static _walk(t, n) {
    return typeof n == "string" ? t.addText(n) : n.children && (t.openNode(n), n.children.forEach((r) => this._walk(t, r)), t.closeNode(n)), t;
  }
  static _collapse(t) {
    typeof t != "string" && (!t.children || (t.children.every((n) => typeof n == "string") ? t.children = [t.children.join("")] : t.children.forEach((n) => {
      ma._collapse(n);
    })));
  }
}
class _v extends ma {
  constructor(t) {
    super(), this.options = t;
  }
  addKeyword(t, n) {
    t !== "" && (this.openNode(n), this.addText(t), this.closeNode());
  }
  addText(t) {
    t !== "" && this.add(t);
  }
  addSublanguage(t, n) {
    const r = t.root;
    r.kind = n, r.sublanguage = !0, this.add(r);
  }
  toHTML() {
    return new Cv(this, this.options).value();
  }
  finalize() {
    return !0;
  }
}
function kv(e) {
  return new RegExp(e.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "m");
}
function jr(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function Ev(...e) {
  return e.map((t) => jr(t)).join("");
}
function Tv(...e) {
  return "(" + e.map((t) => jr(t)).join("|") + ")";
}
function Av(e) {
  return new RegExp(e.toString() + "|").exec("").length - 1;
}
function Sv(e, t) {
  const n = e && e.exec(t);
  return n && n.index === 0;
}
const Rv = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
function Iv(e, t = "|") {
  let n = 0;
  return e.map((r) => {
    n += 1;
    const s = n;
    let i = jr(r), o = "";
    for (; i.length > 0; ) {
      const a = Rv.exec(i);
      if (!a) {
        o += i;
        break;
      }
      o += i.substring(0, a.index), i = i.substring(a.index + a[0].length), a[0][0] === "\\" && a[1] ? o += "\\" + String(Number(a[1]) + s) : (o += a[0], a[0] === "(" && n++);
    }
    return o;
  }).map((r) => `(${r})`).join(t);
}
const Ov = /\b\B/, ih = "[a-zA-Z]\\w*", xa = "[a-zA-Z_]\\w*", La = "\\b\\d+(\\.\\d+)?", oh = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", ah = "\\b(0b[01]+)", Nv = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", Pv = (e = {}) => {
  const t = /^#![ ]*\//;
  return e.binary && (e.begin = Ev(
    t,
    /.*\b/,
    e.binary,
    /\b.*/
  )), cn({
    className: "meta",
    begin: t,
    end: /$/,
    relevance: 0,
    "on:begin": (n, r) => {
      n.index !== 0 && r.ignoreMatch();
    }
  }, e);
}, Vr = {
  begin: "\\\\[\\s\\S]",
  relevance: 0
}, Mv = {
  className: "string",
  begin: "'",
  end: "'",
  illegal: "\\n",
  contains: [Vr]
}, Fv = {
  className: "string",
  begin: '"',
  end: '"',
  illegal: "\\n",
  contains: [Vr]
}, lh = {
  begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
}, Oi = function(e, t, n = {}) {
  const r = cn(
    {
      className: "comment",
      begin: e,
      end: t,
      contains: []
    },
    n
  );
  return r.contains.push(lh), r.contains.push({
    className: "doctag",
    begin: "(?:TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):",
    relevance: 0
  }), r;
}, zv = Oi("//", "$"), Dv = Oi("/\\*", "\\*/"), Bv = Oi("#", "$"), Uv = {
  className: "number",
  begin: La,
  relevance: 0
}, Hv = {
  className: "number",
  begin: oh,
  relevance: 0
}, Gv = {
  className: "number",
  begin: ah,
  relevance: 0
}, $v = {
  className: "number",
  begin: La + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
  relevance: 0
}, jv = {
  begin: /(?=\/[^/\n]*\/)/,
  contains: [{
    className: "regexp",
    begin: /\//,
    end: /\/[gimuy]*/,
    illegal: /\n/,
    contains: [
      Vr,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [Vr]
      }
    ]
  }]
}, Vv = {
  className: "title",
  begin: ih,
  relevance: 0
}, qv = {
  className: "title",
  begin: xa,
  relevance: 0
}, Zv = {
  begin: "\\.\\s*" + xa,
  relevance: 0
}, Wv = function(e) {
  return Object.assign(
    e,
    {
      "on:begin": (t, n) => {
        n.data._beginMatch = t[1];
      },
      "on:end": (t, n) => {
        n.data._beginMatch !== t[1] && n.ignoreMatch();
      }
    }
  );
};
var Ls = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  MATCH_NOTHING_RE: Ov,
  IDENT_RE: ih,
  UNDERSCORE_IDENT_RE: xa,
  NUMBER_RE: La,
  C_NUMBER_RE: oh,
  BINARY_NUMBER_RE: ah,
  RE_STARTERS_RE: Nv,
  SHEBANG: Pv,
  BACKSLASH_ESCAPE: Vr,
  APOS_STRING_MODE: Mv,
  QUOTE_STRING_MODE: Fv,
  PHRASAL_WORDS_MODE: lh,
  COMMENT: Oi,
  C_LINE_COMMENT_MODE: zv,
  C_BLOCK_COMMENT_MODE: Dv,
  HASH_COMMENT_MODE: Bv,
  NUMBER_MODE: Uv,
  C_NUMBER_MODE: Hv,
  BINARY_NUMBER_MODE: Gv,
  CSS_NUMBER_MODE: $v,
  REGEXP_MODE: jv,
  TITLE_MODE: Vv,
  UNDERSCORE_TITLE_MODE: qv,
  METHOD_GUARD: Zv,
  END_SAME_AS_BEGIN: Wv
});
function Yv(e, t) {
  e.input[e.index - 1] === "." && t.ignoreMatch();
}
function Kv(e, t) {
  !t || !e.beginKeywords || (e.begin = "\\b(" + e.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", e.__beforeBegin = Yv, e.keywords = e.keywords || e.beginKeywords, delete e.beginKeywords, e.relevance === void 0 && (e.relevance = 0));
}
function Qv(e, t) {
  !Array.isArray(e.illegal) || (e.illegal = Tv(...e.illegal));
}
function Xv(e, t) {
  if (e.match) {
    if (e.begin || e.end)
      throw new Error("begin & end are not supported with match");
    e.begin = e.match, delete e.match;
  }
}
function Jv(e, t) {
  e.relevance === void 0 && (e.relevance = 1);
}
const tb = [
  "of",
  "and",
  "for",
  "in",
  "not",
  "or",
  "if",
  "then",
  "parent",
  "list",
  "value"
], eb = "keyword";
function ch(e, t, n = eb) {
  const r = {};
  return typeof e == "string" ? s(n, e.split(" ")) : Array.isArray(e) ? s(n, e) : Object.keys(e).forEach(function(i) {
    Object.assign(
      r,
      ch(e[i], t, i)
    );
  }), r;
  function s(i, o) {
    t && (o = o.map((a) => a.toLowerCase())), o.forEach(function(a) {
      const l = a.split("|");
      r[l[0]] = [i, nb(l[0], l[1])];
    });
  }
}
function nb(e, t) {
  return t ? Number(t) : rb(e) ? 0 : 1;
}
function rb(e) {
  return tb.includes(e.toLowerCase());
}
function sb(e, { plugins: t }) {
  function n(a, l) {
    return new RegExp(
      jr(a),
      "m" + (e.case_insensitive ? "i" : "") + (l ? "g" : "")
    );
  }
  class r {
    constructor() {
      this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
    }
    addRule(l, c) {
      c.position = this.position++, this.matchIndexes[this.matchAt] = c, this.regexes.push([c, l]), this.matchAt += Av(l) + 1;
    }
    compile() {
      this.regexes.length === 0 && (this.exec = () => null);
      const l = this.regexes.map((c) => c[1]);
      this.matcherRe = n(Iv(l), !0), this.lastIndex = 0;
    }
    exec(l) {
      this.matcherRe.lastIndex = this.lastIndex;
      const c = this.matcherRe.exec(l);
      if (!c)
        return null;
      const u = c.findIndex((f, m) => m > 0 && f !== void 0), d = this.matchIndexes[u];
      return c.splice(0, u), Object.assign(c, d);
    }
  }
  class s {
    constructor() {
      this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
    }
    getMatcher(l) {
      if (this.multiRegexes[l])
        return this.multiRegexes[l];
      const c = new r();
      return this.rules.slice(l).forEach(([u, d]) => c.addRule(u, d)), c.compile(), this.multiRegexes[l] = c, c;
    }
    resumingScanAtSamePosition() {
      return this.regexIndex !== 0;
    }
    considerAll() {
      this.regexIndex = 0;
    }
    addRule(l, c) {
      this.rules.push([l, c]), c.type === "begin" && this.count++;
    }
    exec(l) {
      const c = this.getMatcher(this.regexIndex);
      c.lastIndex = this.lastIndex;
      let u = c.exec(l);
      if (this.resumingScanAtSamePosition() && !(u && u.index === this.lastIndex)) {
        const d = this.getMatcher(0);
        d.lastIndex = this.lastIndex + 1, u = d.exec(l);
      }
      return u && (this.regexIndex += u.position + 1, this.regexIndex === this.count && this.considerAll()), u;
    }
  }
  function i(a) {
    const l = new s();
    return a.contains.forEach((c) => l.addRule(c.begin, { rule: c, type: "begin" })), a.terminatorEnd && l.addRule(a.terminatorEnd, { type: "end" }), a.illegal && l.addRule(a.illegal, { type: "illegal" }), l;
  }
  function o(a, l) {
    const c = a;
    if (a.isCompiled)
      return c;
    [
      Xv
    ].forEach((d) => d(a, l)), e.compilerExtensions.forEach((d) => d(a, l)), a.__beforeBegin = null, [
      Kv,
      Qv,
      Jv
    ].forEach((d) => d(a, l)), a.isCompiled = !0;
    let u = null;
    if (typeof a.keywords == "object" && (u = a.keywords.$pattern, delete a.keywords.$pattern), a.keywords && (a.keywords = ch(a.keywords, e.case_insensitive)), a.lexemes && u)
      throw new Error("ERR: Prefer `keywords.$pattern` to `mode.lexemes`, BOTH are not allowed. (see mode reference) ");
    return u = u || a.lexemes || /\w+/, c.keywordPatternRe = n(u, !0), l && (a.begin || (a.begin = /\B|\b/), c.beginRe = n(a.begin), a.endSameAsBegin && (a.end = a.begin), !a.end && !a.endsWithParent && (a.end = /\B|\b/), a.end && (c.endRe = n(a.end)), c.terminatorEnd = jr(a.end) || "", a.endsWithParent && l.terminatorEnd && (c.terminatorEnd += (a.end ? "|" : "") + l.terminatorEnd)), a.illegal && (c.illegalRe = n(a.illegal)), a.contains || (a.contains = []), a.contains = [].concat(...a.contains.map(function(d) {
      return ib(d === "self" ? a : d);
    })), a.contains.forEach(function(d) {
      o(d, c);
    }), a.starts && o(a.starts, l), c.matcher = i(c), c;
  }
  if (e.compilerExtensions || (e.compilerExtensions = []), e.contains && e.contains.includes("self"))
    throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
  return e.classNameAliases = cn(e.classNameAliases || {}), o(e);
}
function hh(e) {
  return e ? e.endsWithParent || hh(e.starts) : !1;
}
function ib(e) {
  return e.variants && !e.cachedVariants && (e.cachedVariants = e.variants.map(function(t) {
    return cn(e, { variants: null }, t);
  })), e.cachedVariants ? e.cachedVariants : hh(e) ? cn(e, { starts: e.starts ? cn(e.starts) : null }) : Object.isFrozen(e) ? cn(e) : e;
}
var ob = "10.7.3";
function ab(e) {
  return !!(e || e === "");
}
function lb(e) {
  const t = {
    props: ["language", "code", "autodetect"],
    data: function() {
      return {
        detectedLanguage: "",
        unknownLanguage: !1
      };
    },
    computed: {
      className() {
        return this.unknownLanguage ? "" : "hljs " + this.detectedLanguage;
      },
      highlighted() {
        if (!this.autoDetect && !e.getLanguage(this.language))
          return console.warn(`The language "${this.language}" you specified could not be found.`), this.unknownLanguage = !0, Kn(this.code);
        let n = {};
        return this.autoDetect ? (n = e.highlightAuto(this.code), this.detectedLanguage = n.language) : (n = e.highlight(this.language, this.code, this.ignoreIllegals), this.detectedLanguage = this.language), n.value;
      },
      autoDetect() {
        return !this.language || ab(this.autodetect);
      },
      ignoreIllegals() {
        return !0;
      }
    },
    render(n) {
      return n("pre", {}, [
        n("code", {
          class: this.className,
          domProps: { innerHTML: this.highlighted }
        })
      ]);
    }
  };
  return { Component: t, VuePlugin: {
    install(n) {
      n.component("highlightjs", t);
    }
  } };
}
const cb = {
  "after:highlightElement": ({ el: e, result: t, text: n }) => {
    const r = e0(e);
    if (!r.length)
      return;
    const s = document.createElement("div");
    s.innerHTML = t.value, t.value = hb(r, e0(s), n);
  }
};
function R1(e) {
  return e.nodeName.toLowerCase();
}
function e0(e) {
  const t = [];
  return function n(r, s) {
    for (let i = r.firstChild; i; i = i.nextSibling)
      i.nodeType === 3 ? s += i.nodeValue.length : i.nodeType === 1 && (t.push({
        event: "start",
        offset: s,
        node: i
      }), s = n(i, s), R1(i).match(/br|hr|img|input/) || t.push({
        event: "stop",
        offset: s,
        node: i
      }));
    return s;
  }(e, 0), t;
}
function hb(e, t, n) {
  let r = 0, s = "";
  const i = [];
  function o() {
    return !e.length || !t.length ? e.length ? e : t : e[0].offset !== t[0].offset ? e[0].offset < t[0].offset ? e : t : t[0].event === "start" ? e : t;
  }
  function a(u) {
    function d(f) {
      return " " + f.nodeName + '="' + Kn(f.value) + '"';
    }
    s += "<" + R1(u) + [].map.call(u.attributes, d).join("") + ">";
  }
  function l(u) {
    s += "</" + R1(u) + ">";
  }
  function c(u) {
    (u.event === "start" ? a : l)(u.node);
  }
  for (; e.length || t.length; ) {
    let u = o();
    if (s += Kn(n.substring(r, u[0].offset)), r = u[0].offset, u === e) {
      i.reverse().forEach(l);
      do
        c(u.splice(0, 1)[0]), u = o();
      while (u === e && u.length && u[0].offset === r);
      i.reverse().forEach(a);
    } else
      u[0].event === "start" ? i.push(u[0].node) : i.pop(), c(u.splice(0, 1)[0]);
  }
  return s + Kn(n.substr(r));
}
const n0 = {}, Ki = (e) => {
  console.error(e);
}, r0 = (e, ...t) => {
  console.log(`WARN: ${e}`, ...t);
}, Le = (e, t) => {
  n0[`${e}/${t}`] || (console.log(`Deprecated as of ${e}. ${t}`), n0[`${e}/${t}`] = !0);
}, Qi = Kn, s0 = cn, i0 = Symbol("nomatch"), ub = function(e) {
  const t = /* @__PURE__ */ Object.create(null), n = /* @__PURE__ */ Object.create(null), r = [];
  let s = !0;
  const i = /(^(<[^>]+>|\t|)+|\n)/gm, o = "Could not find the language '{}', did you forget to load/include a language module?", a = { disableAutodetect: !0, name: "Plain text", contains: [] };
  let l = {
    noHighlightRe: /^(no-?highlight)$/i,
    languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
    classPrefix: "hljs-",
    tabReplace: null,
    useBR: !1,
    languages: null,
    __emitter: _v
  };
  function c(k) {
    return l.noHighlightRe.test(k);
  }
  function u(k) {
    let j = k.className + " ";
    j += k.parentNode ? k.parentNode.className : "";
    const ct = l.languageDetectRe.exec(j);
    if (ct) {
      const lt = Tt(ct[1]);
      return lt || (r0(o.replace("{}", ct[1])), r0("Falling back to no-highlight mode for this block.", k)), lt ? ct[1] : "no-highlight";
    }
    return j.split(/\s+/).find((lt) => c(lt) || Tt(lt));
  }
  function d(k, j, ct, lt) {
    let It = "", Ie = "";
    typeof j == "object" ? (It = k, ct = j.ignoreIllegals, Ie = j.language, lt = void 0) : (Le("10.7.0", "highlight(lang, code, ...args) has been deprecated."), Le("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), Ie = k, It = j);
    const qt = {
      code: It,
      language: Ie
    };
    Se("before:highlight", qt);
    const se = qt.result ? qt.result : f(qt.language, qt.code, ct, lt);
    return se.code = qt.code, Se("after:highlight", se), se;
  }
  function f(k, j, ct, lt) {
    function It(z, Z) {
      const rt = T.case_insensitive ? Z[0].toLowerCase() : Z[0];
      return Object.prototype.hasOwnProperty.call(z.keywords, rt) && z.keywords[rt];
    }
    function Ie() {
      if (!E.keywords) {
        F.addText(H);
        return;
      }
      let z = 0;
      E.keywordPatternRe.lastIndex = 0;
      let Z = E.keywordPatternRe.exec(H), rt = "";
      for (; Z; ) {
        rt += H.substring(z, Z.index);
        const ht = It(E, Z);
        if (ht) {
          const [$t, Bt] = ht;
          if (F.addText(rt), rt = "", et += Bt, $t.startsWith("_"))
            rt += Z[0];
          else {
            const xe = T.classNameAliases[$t] || $t;
            F.addKeyword(Z[0], xe);
          }
        } else
          rt += Z[0];
        z = E.keywordPatternRe.lastIndex, Z = E.keywordPatternRe.exec(H);
      }
      rt += H.substr(z), F.addText(rt);
    }
    function qt() {
      if (H === "")
        return;
      let z = null;
      if (typeof E.subLanguage == "string") {
        if (!t[E.subLanguage]) {
          F.addText(H);
          return;
        }
        z = f(E.subLanguage, H, !0, V[E.subLanguage]), V[E.subLanguage] = z.top;
      } else
        z = I(H, E.subLanguage.length ? E.subLanguage : null);
      E.relevance > 0 && (et += z.relevance), F.addSublanguage(z.emitter, z.language);
    }
    function se() {
      E.subLanguage != null ? qt() : Ie(), H = "";
    }
    function ie(z) {
      return z.className && F.openNode(T.classNameAliases[z.className] || z.className), E = Object.create(z, { parent: { value: E } }), E;
    }
    function p(z, Z, rt) {
      let ht = Sv(z.endRe, rt);
      if (ht) {
        if (z["on:end"]) {
          const $t = new Jl(z);
          z["on:end"](Z, $t), $t.isMatchIgnored && (ht = !1);
        }
        if (ht) {
          for (; z.endsParent && z.parent; )
            z = z.parent;
          return z;
        }
      }
      if (z.endsWithParent)
        return p(z.parent, Z, rt);
    }
    function g(z) {
      return E.matcher.regexIndex === 0 ? (H += z[0], 1) : (At = !0, 0);
    }
    function v(z) {
      const Z = z[0], rt = z.rule, ht = new Jl(rt), $t = [rt.__beforeBegin, rt["on:begin"]];
      for (const Bt of $t)
        if (Bt && (Bt(z, ht), ht.isMatchIgnored))
          return g(Z);
      return rt && rt.endSameAsBegin && (rt.endRe = kv(Z)), rt.skip ? H += Z : (rt.excludeBegin && (H += Z), se(), !rt.returnBegin && !rt.excludeBegin && (H = Z)), ie(rt), rt.returnBegin ? 0 : Z.length;
    }
    function C(z) {
      const Z = z[0], rt = j.substr(z.index), ht = p(E, z, rt);
      if (!ht)
        return i0;
      const $t = E;
      $t.skip ? H += Z : ($t.returnEnd || $t.excludeEnd || (H += Z), se(), $t.excludeEnd && (H = Z));
      do
        E.className && F.closeNode(), !E.skip && !E.subLanguage && (et += E.relevance), E = E.parent;
      while (E !== ht.parent);
      return ht.starts && (ht.endSameAsBegin && (ht.starts.endRe = ht.endRe), ie(ht.starts)), $t.returnEnd ? 0 : Z.length;
    }
    function w() {
      const z = [];
      for (let Z = E; Z !== T; Z = Z.parent)
        Z.className && z.unshift(Z.className);
      z.forEach((Z) => F.openNode(Z));
    }
    let S = {};
    function P(z, Z) {
      const rt = Z && Z[0];
      if (H += z, rt == null)
        return se(), 0;
      if (S.type === "begin" && Z.type === "end" && S.index === Z.index && rt === "") {
        if (H += j.slice(Z.index, Z.index + 1), !s) {
          const ht = new Error("0 width match regex");
          throw ht.languageName = k, ht.badRule = S.rule, ht;
        }
        return 1;
      }
      if (S = Z, Z.type === "begin")
        return v(Z);
      if (Z.type === "illegal" && !ct) {
        const ht = new Error('Illegal lexeme "' + rt + '" for mode "' + (E.className || "<unnamed>") + '"');
        throw ht.mode = E, ht;
      } else if (Z.type === "end") {
        const ht = C(Z);
        if (ht !== i0)
          return ht;
      }
      if (Z.type === "illegal" && rt === "")
        return 1;
      if (dt > 1e5 && dt > Z.index * 3)
        throw new Error("potential infinite loop, way more iterations than matches");
      return H += rt, rt.length;
    }
    const T = Tt(k);
    if (!T)
      throw Ki(o.replace("{}", k)), new Error('Unknown language: "' + k + '"');
    const N = sb(T, { plugins: r });
    let _ = "", E = lt || N;
    const V = {}, F = new l.__emitter(l);
    w();
    let H = "", et = 0, Lt = 0, dt = 0, At = !1;
    try {
      for (E.matcher.considerAll(); ; ) {
        dt++, At ? At = !1 : E.matcher.considerAll(), E.matcher.lastIndex = Lt;
        const z = E.matcher.exec(j);
        if (!z)
          break;
        const Z = j.substring(Lt, z.index), rt = P(Z, z);
        Lt = z.index + rt;
      }
      return P(j.substr(Lt)), F.closeAllNodes(), F.finalize(), _ = F.toHTML(), {
        relevance: Math.floor(et),
        value: _,
        language: k,
        illegal: !1,
        emitter: F,
        top: E
      };
    } catch (z) {
      if (z.message && z.message.includes("Illegal"))
        return {
          illegal: !0,
          illegalBy: {
            msg: z.message,
            context: j.slice(Lt - 100, Lt + 100),
            mode: z.mode
          },
          sofar: _,
          relevance: 0,
          value: Qi(j),
          emitter: F
        };
      if (s)
        return {
          illegal: !1,
          relevance: 0,
          value: Qi(j),
          emitter: F,
          language: k,
          top: E,
          errorRaised: z
        };
      throw z;
    }
  }
  function m(k) {
    const j = {
      relevance: 0,
      emitter: new l.__emitter(l),
      value: Qi(k),
      illegal: !1,
      top: a
    };
    return j.emitter.addText(k), j;
  }
  function I(k, j) {
    j = j || l.languages || Object.keys(t);
    const ct = m(k), lt = j.filter(Tt).filter(yt).map(
      (ie) => f(ie, k, !1)
    );
    lt.unshift(ct);
    const It = lt.sort((ie, p) => {
      if (ie.relevance !== p.relevance)
        return p.relevance - ie.relevance;
      if (ie.language && p.language) {
        if (Tt(ie.language).supersetOf === p.language)
          return 1;
        if (Tt(p.language).supersetOf === ie.language)
          return -1;
      }
      return 0;
    }), [Ie, qt] = It, se = Ie;
    return se.second_best = qt, se;
  }
  function M(k) {
    return l.tabReplace || l.useBR ? k.replace(i, (j) => j === `
` ? l.useBR ? "<br>" : j : l.tabReplace ? j.replace(/\t/g, l.tabReplace) : j) : k;
  }
  function tt(k, j, ct) {
    const lt = j ? n[j] : ct;
    k.classList.add("hljs"), lt && k.classList.add(lt);
  }
  const G = {
    "before:highlightElement": ({ el: k }) => {
      l.useBR && (k.innerHTML = k.innerHTML.replace(/\n/g, "").replace(/<br[ /]*>/g, `
`));
    },
    "after:highlightElement": ({ result: k }) => {
      l.useBR && (k.value = k.value.replace(/\n/g, "<br>"));
    }
  }, J = /^(<[^>]+>|\t)+/gm, q = {
    "after:highlightElement": ({ result: k }) => {
      l.tabReplace && (k.value = k.value.replace(
        J,
        (j) => j.replace(/\t/g, l.tabReplace)
      ));
    }
  };
  function Q(k) {
    let j = null;
    const ct = u(k);
    if (c(ct))
      return;
    Se(
      "before:highlightElement",
      { el: k, language: ct }
    ), j = k;
    const lt = j.textContent, It = ct ? d(lt, { language: ct, ignoreIllegals: !0 }) : I(lt);
    Se("after:highlightElement", { el: k, result: It, text: lt }), k.innerHTML = It.value, tt(k, ct, It.language), k.result = {
      language: It.language,
      re: It.relevance,
      relavance: It.relevance
    }, It.second_best && (k.second_best = {
      language: It.second_best.language,
      re: It.second_best.relevance,
      relavance: It.second_best.relevance
    });
  }
  function Rt(k) {
    k.useBR && (Le("10.3.0", "'useBR' will be removed entirely in v11.0"), Le("10.3.0", "Please see https://github.com/highlightjs/highlight.js/issues/2559")), l = s0(l, k);
  }
  const Dt = () => {
    Dt.called || (Dt.called = !0, Le("10.6.0", "initHighlighting() is deprecated.  Use highlightAll() instead."), document.querySelectorAll("pre code").forEach(Q));
  };
  function we() {
    Le("10.6.0", "initHighlightingOnLoad() is deprecated.  Use highlightAll() instead."), Gt = !0;
  }
  let Gt = !1;
  function rn() {
    if (document.readyState === "loading") {
      Gt = !0;
      return;
    }
    document.querySelectorAll("pre code").forEach(Q);
  }
  function qe() {
    Gt && rn();
  }
  typeof window < "u" && window.addEventListener && window.addEventListener("DOMContentLoaded", qe, !1);
  function xn(k, j) {
    let ct = null;
    try {
      ct = j(e);
    } catch (lt) {
      if (Ki("Language definition for '{}' could not be registered.".replace("{}", k)), s)
        Ki(lt);
      else
        throw lt;
      ct = a;
    }
    ct.name || (ct.name = k), t[k] = ct, ct.rawDefinition = j.bind(null, e), ct.aliases && _t(ct.aliases, { languageName: k });
  }
  function Mn(k) {
    delete t[k];
    for (const j of Object.keys(n))
      n[j] === k && delete n[j];
  }
  function Fn() {
    return Object.keys(t);
  }
  function mr(k) {
    Le("10.4.0", "requireLanguage will be removed entirely in v11."), Le("10.4.0", "Please see https://github.com/highlightjs/highlight.js/pull/2844");
    const j = Tt(k);
    if (j)
      return j;
    throw new Error("The '{}' language is required, but not loaded.".replace("{}", k));
  }
  function Tt(k) {
    return k = (k || "").toLowerCase(), t[k] || t[n[k]];
  }
  function _t(k, { languageName: j }) {
    typeof k == "string" && (k = [k]), k.forEach((ct) => {
      n[ct.toLowerCase()] = j;
    });
  }
  function yt(k) {
    const j = Tt(k);
    return j && !j.disableAutodetect;
  }
  function Ce(k) {
    k["before:highlightBlock"] && !k["before:highlightElement"] && (k["before:highlightElement"] = (j) => {
      k["before:highlightBlock"](
        Object.assign({ block: j.el }, j)
      );
    }), k["after:highlightBlock"] && !k["after:highlightElement"] && (k["after:highlightElement"] = (j) => {
      k["after:highlightBlock"](
        Object.assign({ block: j.el }, j)
      );
    });
  }
  function xr(k) {
    Ce(k), r.push(k);
  }
  function Se(k, j) {
    const ct = k;
    r.forEach(function(lt) {
      lt[ct] && lt[ct](j);
    });
  }
  function sn(k) {
    return Le("10.2.0", "fixMarkup will be removed entirely in v11.0"), Le("10.2.0", "Please see https://github.com/highlightjs/highlight.js/issues/2534"), M(k);
  }
  function Re(k) {
    return Le("10.7.0", "highlightBlock will be removed entirely in v12.0"), Le("10.7.0", "Please use highlightElement now."), Q(k);
  }
  Object.assign(e, {
    highlight: d,
    highlightAuto: I,
    highlightAll: rn,
    fixMarkup: sn,
    highlightElement: Q,
    highlightBlock: Re,
    configure: Rt,
    initHighlighting: Dt,
    initHighlightingOnLoad: we,
    registerLanguage: xn,
    unregisterLanguage: Mn,
    listLanguages: Fn,
    getLanguage: Tt,
    registerAliases: _t,
    requireLanguage: mr,
    autoDetection: yt,
    inherit: s0,
    addPlugin: xr,
    vuePlugin: lb(e).VuePlugin
  }), e.debugMode = function() {
    s = !1;
  }, e.safeMode = function() {
    s = !0;
  }, e.versionString = ob;
  for (const k in Ls)
    typeof Ls[k] == "object" && sh(Ls[k]);
  return Object.assign(e, Ls), e.addPlugin(G), e.addPlugin(cb), e.addPlugin(q), e;
};
var db = ub({}), An = db;
function pb(e) {
  return {
    name: "Plain text",
    aliases: [
      "text",
      "txt"
    ],
    disableAutodetect: !0
  };
}
var fb = pb;
const o0 = "[A-Za-z$_][0-9A-Za-z$_]*", gb = [
  "as",
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends"
], mb = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], xb = [
  "Intl",
  "DataView",
  "Number",
  "Math",
  "Date",
  "String",
  "RegExp",
  "Object",
  "Function",
  "Boolean",
  "Error",
  "Symbol",
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  "Proxy",
  "Reflect",
  "JSON",
  "Promise",
  "Float64Array",
  "Int16Array",
  "Int32Array",
  "Int8Array",
  "Uint16Array",
  "Uint32Array",
  "Float32Array",
  "Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "ArrayBuffer",
  "BigInt64Array",
  "BigUint64Array",
  "BigInt"
], Lb = [
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], yb = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], vb = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "module",
  "global"
], bb = [].concat(
  yb,
  vb,
  xb,
  Lb
);
function wb(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function a0(e) {
  return I1("(?=", e, ")");
}
function I1(...e) {
  return e.map((t) => wb(t)).join("");
}
function Cb(e) {
  const t = (q, { after: Q }) => {
    const Rt = "</" + q[0].slice(1);
    return q.input.indexOf(Rt, Q) !== -1;
  }, n = o0, r = {
    begin: "<>",
    end: "</>"
  }, s = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    isTrulyOpeningTag: (q, Q) => {
      const Rt = q[0].length + q.index, Dt = q.input[Rt];
      if (Dt === "<") {
        Q.ignoreMatch();
        return;
      }
      Dt === ">" && (t(q, { after: Rt }) || Q.ignoreMatch());
    }
  }, i = {
    $pattern: o0,
    keyword: gb,
    literal: mb,
    built_in: bb
  }, o = "[0-9](_?[0-9])*", a = `\\.(${o})`, l = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", c = {
    className: "number",
    variants: [
      { begin: `(\\b(${l})((${a})|\\.)?|(${a}))[eE][+-]?(${o})\\b` },
      { begin: `\\b(${l})\\b((${a})\\b|\\.)?|(${a})\\b` },
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, u = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: i,
    contains: []
  }, d = {
    begin: "html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        u
      ],
      subLanguage: "xml"
    }
  }, f = {
    begin: "css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        e.BACKSLASH_ESCAPE,
        u
      ],
      subLanguage: "css"
    }
  }, m = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      e.BACKSLASH_ESCAPE,
      u
    ]
  }, I = {
    className: "comment",
    variants: [
      e.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              className: "doctag",
              begin: "@[A-Za-z]+",
              contains: [
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: n + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      e.C_BLOCK_COMMENT_MODE,
      e.C_LINE_COMMENT_MODE
    ]
  }, M = [
    e.APOS_STRING_MODE,
    e.QUOTE_STRING_MODE,
    d,
    f,
    m,
    c,
    e.REGEXP_MODE
  ];
  u.contains = M.concat({
    begin: /\{/,
    end: /\}/,
    keywords: i,
    contains: [
      "self"
    ].concat(M)
  });
  const tt = [].concat(I, u.contains), G = tt.concat([
    {
      begin: /\(/,
      end: /\)/,
      keywords: i,
      contains: ["self"].concat(tt)
    }
  ]), J = {
    className: "params",
    begin: /\(/,
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: i,
    contains: G
  };
  return {
    name: "Javascript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: i,
    exports: { PARAMS_CONTAINS: G },
    illegal: /#(?![$_A-z])/,
    contains: [
      e.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      {
        label: "use_strict",
        className: "meta",
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      },
      e.APOS_STRING_MODE,
      e.QUOTE_STRING_MODE,
      d,
      f,
      m,
      I,
      c,
      {
        begin: I1(
          /[{,\n]\s*/,
          a0(I1(
            /(((\/\/.*$)|(\/\*(\*[^/]|[^*])*\*\/))\s*)*/,
            n + "\\s*:"
          ))
        ),
        relevance: 0,
        contains: [
          {
            className: "attr",
            begin: n + a0("\\s*:"),
            relevance: 0
          }
        ]
      },
      {
        begin: "(" + e.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        contains: [
          I,
          e.REGEXP_MODE,
          {
            className: "function",
            begin: "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + e.UNDERSCORE_IDENT_RE + ")\\s*=>",
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: e.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: i,
                    contains: G
                  }
                ]
              }
            ]
          },
          {
            begin: /,/,
            relevance: 0
          },
          {
            className: "",
            begin: /\s/,
            end: /\s*/,
            skip: !0
          },
          {
            variants: [
              { begin: r.begin, end: r.end },
              {
                begin: s.begin,
                "on:begin": s.isTrulyOpeningTag,
                end: s.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: s.begin,
                end: s.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ],
        relevance: 0
      },
      {
        className: "function",
        beginKeywords: "function",
        end: /[{;]/,
        excludeEnd: !0,
        keywords: i,
        contains: [
          "self",
          e.inherit(e.TITLE_MODE, { begin: n }),
          J
        ],
        illegal: /%/
      },
      {
        beginKeywords: "while if switch catch for"
      },
      {
        className: "function",
        begin: e.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        returnBegin: !0,
        contains: [
          J,
          e.inherit(e.TITLE_MODE, { begin: n })
        ]
      },
      {
        variants: [
          { begin: "\\." + n },
          { begin: "\\$" + n }
        ],
        relevance: 0
      },
      {
        className: "class",
        beginKeywords: "class",
        end: /[{;=]/,
        excludeEnd: !0,
        illegal: /[:"[\]]/,
        contains: [
          { beginKeywords: "extends" },
          e.UNDERSCORE_TITLE_MODE
        ]
      },
      {
        begin: /\b(?=constructor)/,
        end: /[{;]/,
        excludeEnd: !0,
        contains: [
          e.inherit(e.TITLE_MODE, { begin: n }),
          "self",
          J
        ]
      },
      {
        begin: "(get|set)\\s+(?=" + n + "\\()",
        end: /\{/,
        keywords: "get set",
        contains: [
          e.inherit(e.TITLE_MODE, { begin: n }),
          { begin: /\(\)/ },
          J
        ]
      },
      {
        begin: /\$[(.]/
      }
    ]
  };
}
var _b = Cb;
function kb(e) {
  return e ? typeof e == "string" ? e : e.source : null;
}
function Eb(...e) {
  return e.map((t) => kb(t)).join("");
}
function Tb(e) {
  const t = {}, n = {
    begin: /\$\{/,
    end: /\}/,
    contains: [
      "self",
      {
        begin: /:-/,
        contains: [t]
      }
    ]
  };
  Object.assign(t, {
    className: "variable",
    variants: [
      { begin: Eb(
        /\$[\w\d#@][\w\d_]*/,
        "(?![\\w\\d])(?![$])"
      ) },
      n
    ]
  });
  const r = {
    className: "subst",
    begin: /\$\(/,
    end: /\)/,
    contains: [e.BACKSLASH_ESCAPE]
  }, s = {
    begin: /<<-?\s*(?=\w+)/,
    starts: {
      contains: [
        e.END_SAME_AS_BEGIN({
          begin: /(\w+)/,
          end: /(\w+)/,
          className: "string"
        })
      ]
    }
  }, i = {
    className: "string",
    begin: /"/,
    end: /"/,
    contains: [
      e.BACKSLASH_ESCAPE,
      t,
      r
    ]
  };
  r.contains.push(i);
  const o = {
    className: "",
    begin: /\\"/
  }, a = {
    className: "string",
    begin: /'/,
    end: /'/
  }, l = {
    begin: /\$\(\(/,
    end: /\)\)/,
    contains: [
      { begin: /\d+#[0-9a-f]+/, className: "number" },
      e.NUMBER_MODE,
      t
    ]
  }, c = [
    "fish",
    "bash",
    "zsh",
    "sh",
    "csh",
    "ksh",
    "tcsh",
    "dash",
    "scsh"
  ], u = e.SHEBANG({
    binary: `(${c.join("|")})`,
    relevance: 10
  }), d = {
    className: "function",
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: !0,
    contains: [e.inherit(e.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
    relevance: 0
  };
  return {
    name: "Bash",
    aliases: ["sh", "zsh"],
    keywords: {
      $pattern: /\b[a-z._-]+\b/,
      keyword: "if then else elif fi for while in do done case esac function",
      literal: "true false",
      built_in: "break cd continue eval exec exit export getopts hash pwd readonly return shift test times trap umask unset alias bind builtin caller command declare echo enable help let local logout mapfile printf read readarray source type typeset ulimit unalias set shopt autoload bg bindkey bye cap chdir clone comparguments compcall compctl compdescribe compfiles compgroups compquote comptags comptry compvalues dirs disable disown echotc echoti emulate fc fg float functions getcap getln history integer jobs kill limit log noglob popd print pushd pushln rehash sched setcap setopt stat suspend ttyctl unfunction unhash unlimit unsetopt vared wait whence where which zcompile zformat zftp zle zmodload zparseopts zprof zpty zregexparse zsocket zstyle ztcp"
    },
    contains: [
      u,
      e.SHEBANG(),
      d,
      l,
      e.HASH_COMMENT_MODE,
      s,
      i,
      o,
      a,
      t
    ]
  };
}
var Ab = Tb;
function Sb(e) {
  var t = "true false yes no null", n = "[\\w#;/?:@&=+$,.~*'()[\\]]+", r = {
    className: "attr",
    variants: [
      { begin: "\\w[\\w :\\/.-]*:(?=[ 	]|$)" },
      { begin: '"\\w[\\w :\\/.-]*":(?=[ 	]|$)' },
      { begin: "'\\w[\\w :\\/.-]*':(?=[ 	]|$)" }
    ]
  }, s = {
    className: "template-variable",
    variants: [
      { begin: /\{\{/, end: /\}\}/ },
      { begin: /%\{/, end: /\}/ }
    ]
  }, i = {
    className: "string",
    relevance: 0,
    variants: [
      { begin: /'/, end: /'/ },
      { begin: /"/, end: /"/ },
      { begin: /\S+/ }
    ],
    contains: [
      e.BACKSLASH_ESCAPE,
      s
    ]
  }, o = e.inherit(i, {
    variants: [
      { begin: /'/, end: /'/ },
      { begin: /"/, end: /"/ },
      { begin: /[^\s,{}[\]]+/ }
    ]
  }), a = "[0-9]{4}(-[0-9][0-9]){0,2}", l = "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?", c = "(\\.[0-9]*)?", u = "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?", d = {
    className: "number",
    begin: "\\b" + a + l + c + u + "\\b"
  }, f = {
    end: ",",
    endsWithParent: !0,
    excludeEnd: !0,
    keywords: t,
    relevance: 0
  }, m = {
    begin: /\{/,
    end: /\}/,
    contains: [f],
    illegal: "\\n",
    relevance: 0
  }, I = {
    begin: "\\[",
    end: "\\]",
    contains: [f],
    illegal: "\\n",
    relevance: 0
  }, M = [
    r,
    {
      className: "meta",
      begin: "^---\\s*$",
      relevance: 10
    },
    {
      className: "string",
      begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
    },
    {
      begin: "<%[%=-]?",
      end: "[%-]?%>",
      subLanguage: "ruby",
      excludeBegin: !0,
      excludeEnd: !0,
      relevance: 0
    },
    {
      className: "type",
      begin: "!\\w+!" + n
    },
    {
      className: "type",
      begin: "!<" + n + ">"
    },
    {
      className: "type",
      begin: "!" + n
    },
    {
      className: "type",
      begin: "!!" + n
    },
    {
      className: "meta",
      begin: "&" + e.UNDERSCORE_IDENT_RE + "$"
    },
    {
      className: "meta",
      begin: "\\*" + e.UNDERSCORE_IDENT_RE + "$"
    },
    {
      className: "bullet",
      begin: "-(?=[ ]|$)",
      relevance: 0
    },
    e.HASH_COMMENT_MODE,
    {
      beginKeywords: t,
      keywords: { literal: t }
    },
    d,
    {
      className: "number",
      begin: e.C_NUMBER_RE + "\\b",
      relevance: 0
    },
    m,
    I,
    i
  ], tt = [...M];
  return tt.pop(), tt.push(o), f.contains = tt, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: M
  };
}
var Rb = Sb;
An.registerLanguage("plaintext", fb);
An.registerLanguage("javascript", _b);
An.registerLanguage("bash", Ab);
An.registerLanguage("yaml", Rb);
const Ib = {
  codespan(e) {
    let t = /(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH)\s+(.+)/gi.exec(e);
    return (t == null ? void 0 : t.length) === 3 ? `
          <code class="rest-api">
          <span class="http-method-${t[1].toLowerCase()}">${t[1]}</span>
          <span class="http-path">${t[2]}</span>
          </code>
        ` : `<code>${e}</code>`;
  }
};
K.setOptions({
  highlight: function(e, t) {
    if (!t)
      return An.highlightAuto(e).value;
    const n = An.getLanguage(t) ? t : "plaintext";
    return An.highlight(n, e).value;
  },
  breaks: !0
});
K.use({ renderer: Ib });
const Ob = {
  name: "comment",
  props: ["comment", "commentObj"],
  computed: {
    markedComment() {
      var e, t;
      return ((e = this.commentObj) == null ? void 0 : e.text) && K.parse((t = this.commentObj) == null ? void 0 : t.text) || this.comment && K.parse(this.comment);
    },
    color() {
      var e;
      return (e = this.commentObj) == null ? void 0 : e.color;
    }
  }
}, Nb = ["innerHTML"];
function Pb(e, t, n, r, s, i) {
  return R(), W("div", {
    class: "comments text-skin-comment min-w-[100px] flex justify-around text-left text-sm opacity-50 hover:opacity-100",
    style: gt({ color: i.color })
  }, [
    b("div", { innerHTML: i.markedComment }, null, 8, Nb)
  ], 4);
}
const rs = /* @__PURE__ */ xt(Ob, [["render", Pb], ["__scopeId", "data-v-15224042"]]), Mb = {
  name: "occurrence",
  props: ["context", "selfCallIndent", "participant", "rtl"],
  data: function() {
    return {
      center: 0
    };
  },
  computed: {
    ...ge(["centerOf", "messageLayerLeft"]),
    ...eo(["code"]),
    computedCenter: function() {
      try {
        return this.centerOf(this.participant);
      } catch (e) {
        return console.error(e), 0;
      }
    }
  }
}, Fb = ["data-belongs-to", "data-x-offset", "data-debug-center-of"];
function zb(e, t, n, r, s, i) {
  const o = ot("block");
  return R(), W("div", {
    class: ne(["occurrence border-skin-occurrence bg-skin-occurrence rounded-sm border-2 relative left-full", { "right-to-left": n.rtl }]),
    "data-el-type": "occurrence",
    "data-belongs-to": n.participant,
    "data-x-offset": e.center,
    "data-debug-center-of": i.computedCenter
  }, [
    this.context.braceBlock() ? (R(), wt(o, {
      key: 0,
      context: n.context.braceBlock().block(),
      selfCallIndent: n.selfCallIndent
    }, null, 8, ["context", "selfCallIndent"])) : mt("", !0)
  ], 10, Fb);
}
const uh = /* @__PURE__ */ xt(Mb, [["render", zb], ["__scopeId", "data-v-054f42d1"]]);
class gr {
  constructor(t, n, r, s) {
    B(this, "start"), B(this, "stop"), this.start = { line: t, col: n }, this.stop = { line: r, col: s };
  }
  static from(t) {
    const n = t.start, r = t.stop;
    return new gr(n.line, n.column, r.line, r.column + r.text.length);
  }
}
const l0 = qr.child({ name: "Creation" }), Db = {
  name: "creation",
  props: ["context", "comment", "selfCallIndent"],
  computed: {
    ...ge(["cursor", "onElementClick", "distance"]),
    from() {
      return this.context.Origin();
    },
    creation() {
      return this.context.creation();
    },
    interactionWidth() {
      let e = Math.abs(this.distance(this.to, this.from)), t = this.selfCallIndent || 0;
      return e + (this.rightToLeft ? t : -t);
    },
    rightToLeft() {
      return this.distance(this.to, this.from) < 0;
    },
    signature() {
      return this.creation.SignatureText();
    },
    assignee() {
      function e(s) {
        return s && s.getFormattedText() || "";
      }
      let t = this.creation.creationBody().assignment();
      if (!t)
        return "";
      let n = e(t.assignee());
      const r = e(t.type());
      return n + (r ? ":" + r : "");
    },
    to() {
      return this.creation.Owner();
    },
    isCurrent() {
      return this.creation.isCurrent(this.cursor);
    }
  },
  mounted() {
    this.layoutMessageContainer(), l0.log(`mounted for ${this.to}`);
  },
  updated() {
    this.layoutMessageContainer(), l0.debug(`mounted for ${this.to}`);
  },
  methods: {
    layoutMessageContainer() {
      (() => {
        if (!this.$refs.participantPlaceHolder || !this.$refs.messageContainer)
          return;
        const e = this.$refs.participantPlaceHolder.offsetWidth / 2;
        this.$refs.messageContainer.style.width = `calc(100% + ${e + 6}px`, this.rightToLeft && (this.$refs.messageContainer.style.transform = `translateX( ${-(e + 6)}px`);
      })();
    },
    onClick() {
      this.onElementClick(gr.from(this.context));
    }
  },
  components: {
    Participant: U2,
    Comment: rs,
    Occurrence: uh,
    Message: ns
  }
}, Bb = ["data-signature"], Ub = ["data-to"], Hb = {
  ref: "participantPlaceHolder",
  class: "invisible right-0 flex flex-col justify-center flex-shrink-0"
};
function Gb(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("message"), l = ot("participant"), c = ot("occurrence");
  return R(), W("div", {
    class: ne(["interaction creation sync text-center transform", {
      "right-to-left": i.rightToLeft,
      "-translate-x-full": i.rightToLeft,
      highlight: i.isCurrent
    }]),
    onClick: t[0] || (t[0] = ii((...u) => i.onClick && i.onClick(...u), ["stop"])),
    "data-signature": i.signature,
    style: gt({ width: i.interactionWidth + "px" })
  }, [
    n.comment ? (R(), wt(o, {
      key: 0,
      comment: n.comment
    }, null, 8, ["comment"])) : mt("", !0),
    b("div", {
      ref: "messageContainer",
      class: ne(["message-container pointer-events-none flex items-center h-10", { "flex-row-reverse": i.rightToLeft }]),
      "data-type": "creation",
      "data-to": i.to
    }, [
      at(a, {
        ref: "messageEl",
        class: "invocation w-full transform -translate-y-1/2 pointer-events-auto",
        content: i.signature,
        rtl: i.rightToLeft,
        type: "creation"
      }, null, 8, ["content", "rtl"]),
      b("div", Hb, [
        at(l, {
          entity: { name: i.to }
        }, null, 8, ["entity"])
      ], 512)
    ], 10, Ub),
    at(c, {
      context: i.creation,
      class: "pointer-events-auto",
      participant: i.to
    }, null, 8, ["context", "participant"]),
    i.assignee ? (R(), wt(a, {
      key: 1,
      class: "return transform -translate-y-full pointer-events-auto",
      content: i.assignee,
      rtl: !i.rightToLeft,
      type: "return"
    }, null, 8, ["content", "rtl"])) : mt("", !0)
  ], 14, Bb);
}
const $b = /* @__PURE__ */ xt(Db, [["render", Gb]]), jb = {
  name: "self-invocation",
  props: ["content", "assignee"]
}, Vb = {
  class: "message self text-sm flex items-start",
  style: { "border-width": "0" }
}, qb = /* @__PURE__ */ b("svg", {
  class: "arrow text-skin-message-arrow",
  width: "30",
  height: "24"
}, [
  /* @__PURE__ */ b("polyline", {
    class: "line stroke-current fill-none stroke-2",
    points: "0,2 28,2 28,15 14,15"
  }),
  /* @__PURE__ */ b("polyline", {
    class: "head stroke-current fill-current stroke-2",
    points: "18,9 8,15 18,21"
  })
], -1), Zb = { class: "name px-px hover:text-skin-message-hover hover:bg-skin-message-hover" }, Wb = { key: 0 };
function Yb(e, t, n, r, s, i) {
  return R(), W("div", Vb, [
    qb,
    b("label", Zb, [
      n.assignee ? (R(), W("span", Wb, Ht(n.assignee) + " = ", 1)) : mt("", !0),
      Rs(" " + Ht(n.content), 1)
    ])
  ]);
}
const Kb = /* @__PURE__ */ xt(jb, [["render", Yb]]), Qb = {
  name: "interaction",
  props: ["context", "selfCallIndent", "commentObj"],
  computed: {
    ...ge(["participants", "distance2", "cursor", "onElementClick"]),
    hasComment() {
      var e, t;
      return ((e = this.commentObj) == null ? void 0 : e.text) !== "" || ((t = this.commentObj) == null ? void 0 : t.color) !== "";
    },
    color() {
      var e;
      return (e = this.commentObj) == null ? void 0 : e.color;
    },
    message: function() {
      var e;
      return (e = this.context) == null ? void 0 : e.message();
    },
    providedFrom: function() {
      var e, t;
      return (t = (e = this.context) == null ? void 0 : e.message()) == null ? void 0 : t.ProvidedFrom();
    },
    from: function() {
      return this.providedFrom || this.origin;
    },
    outOfBand: function() {
      return !!this.providedFrom && this.providedFrom !== this.origin;
    },
    assignee: function() {
      var e;
      let t = (e = this.message) == null ? void 0 : e.Assignment();
      return t ? t.getText() : "";
    },
    signature: function() {
      var e;
      return (e = this.message) == null ? void 0 : e.SignatureText();
    },
    translateX: function() {
      if (!this.rightToLeft && !this.outOfBand)
        return 0;
      const e = this.rightToLeft ? this.to : this.providedFrom, t = this.distance2(this.origin, e), n = this.selfCallIndent || 0;
      return t + 0 - n;
    },
    rightToLeft: function() {
      return this.distance2(this.from, this.to) < 0;
    },
    isCurrent: function() {
      var e;
      return (e = this.message) == null ? void 0 : e.isCurrent(this.cursor);
    },
    showStarter() {
      return this.participants.Starter().name !== "_STARTER_";
    },
    isRootBlock() {
      var e, t;
      return ((t = (e = this.context) == null ? void 0 : e.parentCtx) == null ? void 0 : t.parentCtx) instanceof Gg;
    },
    origin: function() {
      var e;
      return (e = this.context) == null ? void 0 : e.Origin();
    },
    passOnOffset: function() {
      return this.isSelf ? (this.selfCallIndent || 0) + 6 : 0;
    },
    interactionWidth: function() {
      if (this.context && this.isSelf)
        return 0;
      let e = this.outOfBand ? 0 : this.selfCallIndent || 0;
      return Math.abs(this.distance2(this.from, this.to) - e);
    },
    to: function() {
      var e, t;
      return (t = (e = this.context) == null ? void 0 : e.message()) == null ? void 0 : t.Owner();
    },
    isSelf: function() {
      return !this.to || this.to === this.from;
    },
    invocation: function() {
      return this.isSelf ? "SelfInvocation" : "Message";
    }
  },
  methods: {
    onClick() {
      this.onElementClick(gr.from(this.context));
    }
  },
  components: {
    Message: ns,
    SelfInvocation: Kb,
    Comment: rs,
    Occurrence: uh
  }
}, Xb = ["data-to", "data-signature"];
function Jb(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("occurrence"), l = ot("message");
  return R(), W("div", {
    class: ne(["interaction sync inline-block", { highlight: i.isCurrent, self: i.isSelf }]),
    onClick: t[0] || (t[0] = ii((...c) => i.onClick && i.onClick(...c), ["stop"])),
    "data-to": i.to,
    "data-type": "interaction",
    "data-signature": i.signature,
    style: gt({
      width: !i.isSelf && i.interactionWidth + "px",
      transform: "translateX(" + i.translateX + "px)"
    })
  }, [
    i.showStarter && i.isRootBlock || i.outOfBand ? (R(), W("div", {
      key: 0,
      class: ne(["occurrence source border-2", { "right-to-left": i.rightToLeft }])
    }, null, 2)) : mt("", !0),
    i.hasComment ? (R(), wt(o, {
      key: 1,
      commentObj: n.commentObj
    }, null, 8, ["commentObj"])) : mt("", !0),
    (R(), wt(W1(i.invocation), {
      class: "text-center",
      color: i.color,
      content: i.signature,
      assignee: i.assignee,
      rtl: i.rightToLeft,
      type: "sync"
    }, null, 8, ["color", "content", "assignee", "rtl"])),
    at(a, {
      context: i.message,
      participant: i.to,
      selfCallIndent: i.passOnOffset,
      rtl: i.rightToLeft
    }, null, 8, ["context", "participant", "selfCallIndent", "rtl"]),
    i.assignee && !i.isSelf ? (R(), wt(l, {
      key: 2,
      class: "return transform -translate-y-full",
      content: i.assignee,
      rtl: !i.rightToLeft,
      type: "return"
    }, null, 8, ["content", "rtl"])) : mt("", !0)
  ], 14, Xb);
}
const tw = /* @__PURE__ */ xt(Qb, [["render", Jb], ["__scopeId", "data-v-86ce6a08"]]), ew = {
  name: "self-invocation-async",
  props: ["content"]
}, nw = (e) => ($e("data-v-25f755f6"), e = e(), je(), e), rw = {
  class: "message self flex items-start",
  style: { "border-width": "0" }
}, sw = /* @__PURE__ */ nw(() => /* @__PURE__ */ b("svg", {
  class: "arrow text-skin-message-arrow",
  width: "34",
  height: "34"
}, [
  /* @__PURE__ */ b("polyline", {
    class: "stroke-current stroke-2 fill-none",
    points: "0,2 28,2 28,25 1,25"
  }),
  /* @__PURE__ */ b("polyline", {
    class: "head stroke-current stroke-2 fill-none",
    points: "11,19 1,25 11,31"
  })
], -1)), iw = { class: "name px-px hover:text-skin-message-hover hover:bg-skin-message-hover" };
function ow(e, t, n, r, s, i) {
  return R(), W("div", rw, [
    sw,
    b("label", iw, Ht(n.content), 1)
  ]);
}
const aw = /* @__PURE__ */ xt(ew, [["render", ow], ["__scopeId", "data-v-25f755f6"]]);
function Xi(e) {
  return e == null;
}
const lw = {
  name: "interaction-async",
  props: ["context", "comment", "selfCallIndent"],
  computed: {
    ...ge(["distance", "cursor", "onElementClick"]),
    from: function() {
      return this.context.Origin();
    },
    asyncMessage: function() {
      var e;
      return (e = this.context) == null ? void 0 : e.asyncMessage();
    },
    interactionWidth: function() {
      var e;
      return this.isSelf ? 10 * (((e = this.signature) == null ? void 0 : e.length) || 0) + 100 : Math.abs(this.distance(this.target, this.source));
    },
    translateX: function() {
      return this.rightToLeft ? this.distance(this.target, this.from) : this.distance(this.source, this.from);
    },
    rightToLeft: function() {
      return this.distance(this.target, this.source) < 0;
    },
    signature: function() {
      var e, t;
      return (t = (e = this.asyncMessage) == null ? void 0 : e.content()) == null ? void 0 : t.getFormattedText();
    },
    source: function() {
      var e, t;
      return ((t = (e = this.asyncMessage) == null ? void 0 : e.from()) == null ? void 0 : t.getFormattedText()) || this.from;
    },
    target: function() {
      var e, t;
      return (t = (e = this.asyncMessage) == null ? void 0 : e.to()) == null ? void 0 : t.getFormattedText();
    },
    isCurrent: function() {
      const e = this.asyncMessage.start.start, t = this.asyncMessage.stop.stop + 1;
      return Xi(this.cursor) || Xi(e) || Xi(t) ? !1 : this.cursor >= e && this.cursor <= t;
    },
    isSelf: function() {
      return this.source === this.target;
    },
    invocation: function() {
      return this.isSelf ? "SelfInvocationAsync" : "Message";
    }
  },
  methods: {
    onClick() {
      this.onElementClick(gr.from(this.context));
    }
  },
  components: {
    Comment: rs,
    SelfInvocationAsync: aw,
    Message: ns
  }
}, cw = ["data-signature"];
function hw(e, t, n, r, s, i) {
  const o = ot("comment");
  return R(), W("div", {
    class: ne(["interaction async", { "right-to-left": i.rightToLeft, highlight: i.isCurrent }]),
    onClick: t[0] || (t[0] = ii((...a) => i.onClick && i.onClick(...a), ["stop"])),
    "data-signature": i.signature,
    style: gt({ width: i.interactionWidth + "px", transform: "translateX(" + i.translateX + "px)" })
  }, [
    n.comment ? (R(), wt(o, {
      key: 0,
      comment: n.comment
    }, null, 8, ["comment"])) : mt("", !0),
    (R(), wt(W1(i.invocation), {
      content: i.signature,
      rtl: i.rightToLeft,
      type: "async"
    }, null, 8, ["content", "rtl"]))
  ], 14, cw);
}
const uw = /* @__PURE__ */ xt(lw, [["render", hw], ["__scopeId", "data-v-4d783075"]]), dw = {
  name: "fragment-alt",
  props: ["context", "comment", "selfCallIndent", "commentObj"],
  mixins: [es],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    alt: function() {
      return this.context.alt();
    },
    blockInIfBlock: function() {
      var e, t, n;
      return (n = (t = (e = this.alt) == null ? void 0 : e.ifBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : n.block();
    },
    condition: function() {
      var e;
      return this.conditionFromIfElseBlock((e = this.alt) == null ? void 0 : e.ifBlock());
    },
    elseBlock: function() {
      var e, t, n;
      return (n = (t = (e = this.alt) == null ? void 0 : e.elseBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : n.block();
    }
  },
  methods: {
    conditionFromIfElseBlock(e) {
      var t, n;
      return (n = (t = e == null ? void 0 : e.parExpr()) == null ? void 0 : t.condition()) == null ? void 0 : n.getFormattedText();
    },
    blockInElseIfBlock(e) {
      var t;
      return (t = e == null ? void 0 : e.braceBlock()) == null ? void 0 : t.block();
    }
  }
}, ya = (e) => ($e("data-v-c5cae879"), e = e(), je(), e), pw = { class: "segment" }, fw = /* @__PURE__ */ ya(() => /* @__PURE__ */ b("div", { class: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t" }, [
  /* @__PURE__ */ b("div", { class: "name font-semibold p-1 border-b" }, [
    /* @__PURE__ */ b("label", { class: "p-0" }, "Alt")
  ])
], -1)), gw = { class: "segment" }, mw = { class: "text-skin-fragment" }, xw = { class: "condition p-1" }, Lw = /* @__PURE__ */ ya(() => /* @__PURE__ */ b("label", { class: "else-if hidden" }, "else if", -1)), yw = { class: "condition p-1" }, vw = {
  key: 0,
  class: "segment mt-2 border-t border-solid"
}, bw = /* @__PURE__ */ ya(() => /* @__PURE__ */ b("div", { class: "text-skin-fragment" }, [
  /* @__PURE__ */ b("label", { class: "p-1" }, "[else]")
], -1));
function ww(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("block");
  return R(), W("div", {
    class: "fragment alt border-skin-fragment rounded",
    style: gt(e.fragmentStyle)
  }, [
    b("div", pw, [
      n.comment ? (R(), wt(o, {
        key: 0,
        comment: n.comment,
        commentObj: n.commentObj
      }, null, 8, ["comment", "commentObj"])) : mt("", !0),
      fw,
      b("div", gw, [
        b("div", mw, [
          b("label", xw, "[" + Ht(i.condition) + "]", 1)
        ]),
        i.blockInIfBlock ? (R(), wt(a, {
          key: 0,
          style: gt({ paddingLeft: `${e.offsetX}px` }),
          context: i.blockInIfBlock,
          selfCallIndent: n.selfCallIndent
        }, null, 8, ["style", "context", "selfCallIndent"])) : mt("", !0)
      ])
    ]),
    (R(!0), W(zt, null, Sn(i.alt.elseIfBlock(), (l, c) => (R(), W("div", {
      key: c + 500,
      class: "segment mt-2 border-t border-solid"
    }, [
      (R(), W("div", {
        class: "text-skin-fragment",
        key: c + 1e3
      }, [
        Lw,
        b("label", yw, "[" + Ht(i.conditionFromIfElseBlock(l)) + "]", 1)
      ])),
      (R(), wt(a, {
        style: gt({ paddingLeft: `${e.offsetX}px` }),
        context: i.blockInElseIfBlock(l),
        selfCallIndent: n.selfCallIndent,
        key: c + 2e3
      }, null, 8, ["style", "context", "selfCallIndent"]))
    ]))), 128)),
    i.elseBlock ? (R(), W("div", vw, [
      bw,
      at(a, {
        style: gt({ paddingLeft: `${e.offsetX}px` }),
        context: i.elseBlock,
        selfCallIndent: n.selfCallIndent
      }, null, 8, ["style", "context", "selfCallIndent"])
    ])) : mt("", !0)
  ], 4);
}
const Cw = /* @__PURE__ */ xt(dw, [["render", ww], ["__scopeId", "data-v-c5cae879"]]), _w = {
  name: "fragment-par",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [es],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    par: function() {
      return this.context.par();
    }
  }
}, kw = (e) => ($e("data-v-bc96f29d"), e = e(), je(), e), Ew = /* @__PURE__ */ kw(() => /* @__PURE__ */ b("div", { class: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t" }, [
  /* @__PURE__ */ b("div", { class: "name font-semibold p-1 border-b" }, [
    /* @__PURE__ */ b("label", null, "Par")
  ])
], -1));
function Tw(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("block");
  return R(), W("div", {
    class: "fragment par border-skin-fragment rounded",
    style: gt(e.fragmentStyle)
  }, [
    n.comment ? (R(), wt(o, {
      key: 0,
      comment: n.comment
    }, null, 8, ["comment"])) : mt("", !0),
    Ew,
    at(a, {
      style: gt({ paddingLeft: `${e.offsetX}px` }),
      context: i.par.braceBlock().block(),
      selfCallIndent: n.selfCallIndent
    }, null, 8, ["style", "context", "selfCallIndent"])
  ], 4);
}
const Aw = /* @__PURE__ */ xt(_w, [["render", Tw], ["__scopeId", "data-v-bc96f29d"]]), Sw = {
  name: "fragment-loop",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [es],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    loop: function() {
      return this.context.loop();
    },
    blockInLoop: function() {
      var e, t;
      return (t = (e = this.loop) == null ? void 0 : e.braceBlock()) == null ? void 0 : t.block();
    },
    condition: function() {
      var e, t, n;
      return (n = (t = (e = this.loop) == null ? void 0 : e.parExpr()) == null ? void 0 : t.condition()) == null ? void 0 : n.getFormattedText();
    }
  }
}, Rw = (e) => ($e("data-v-62b3ca90"), e = e(), je(), e), Iw = /* @__PURE__ */ Rw(() => /* @__PURE__ */ b("div", { class: "header text-skin-fragment-header bg-skin-fragment-header text-base leading-4" }, [
  /* @__PURE__ */ b("div", { class: "name font-semibold p-1 border-b" }, [
    /* @__PURE__ */ b("label", { class: "p-0" }, "Loop")
  ])
], -1)), Ow = { class: "segment" }, Nw = { class: "text-skin-fragment" }, Pw = { class: "condition p-1" };
function Mw(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("block");
  return R(), W("div", {
    class: "fragment loop border-skin-fragment rounded",
    style: gt(e.fragmentStyle)
  }, [
    n.comment ? (R(), wt(o, {
      key: 0,
      comment: n.comment
    }, null, 8, ["comment"])) : mt("", !0),
    Iw,
    b("div", Ow, [
      b("div", Nw, [
        b("label", Pw, "[" + Ht(i.condition) + "]", 1)
      ]),
      at(a, {
        style: gt({ paddingLeft: `${e.offsetX}px` }),
        context: i.blockInLoop,
        selfCallIndent: n.selfCallIndent
      }, null, 8, ["style", "context", "selfCallIndent"])
    ])
  ], 4);
}
const Fw = /* @__PURE__ */ xt(Sw, [["render", Mw], ["__scopeId", "data-v-62b3ca90"]]), zw = {
  name: "fragment-opt",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [es],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    opt: function() {
      return this.context.opt();
    }
  }
}, Dw = (e) => ($e("data-v-e9cc75db"), e = e(), je(), e), Bw = /* @__PURE__ */ Dw(() => /* @__PURE__ */ b("div", { class: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4" }, [
  /* @__PURE__ */ b("div", { class: "name font-semibold p-1 border-b" }, [
    /* @__PURE__ */ b("label", null, "Opt")
  ])
], -1));
function Uw(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("block");
  return R(), W("div", {
    class: "fragment opt border-skin-fragment rounded",
    style: gt(e.fragmentStyle)
  }, [
    n.comment ? (R(), wt(o, {
      key: 0,
      comment: n.comment
    }, null, 8, ["comment"])) : mt("", !0),
    Bw,
    at(a, {
      style: gt({ paddingLeft: `${e.offsetX}px` }),
      context: i.opt.braceBlock().block(),
      selfCallIndent: n.selfCallIndent
    }, null, 8, ["style", "context", "selfCallIndent"])
  ], 4);
}
const Hw = /* @__PURE__ */ xt(zw, [["render", Uw], ["__scopeId", "data-v-e9cc75db"]]), Gw = {
  name: "fragment-tcf",
  props: ["context", "comment", "selfCallIndent"],
  mixins: [es],
  computed: {
    from: function() {
      return this.context.Origin();
    },
    tcf: function() {
      return this.context.tcf();
    },
    blockInTryBlock: function() {
      var e, t, n;
      return (n = (t = (e = this.tcf) == null ? void 0 : e.tryBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : n.block();
    },
    finallyBlock: function() {
      var e, t, n;
      return (n = (t = (e = this.tcf) == null ? void 0 : e.finallyBlock()) == null ? void 0 : t.braceBlock()) == null ? void 0 : n.block();
    }
  },
  methods: {
    exception(e) {
      var t;
      return (t = e == null ? void 0 : e.invocation()) == null ? void 0 : t.parameters().getText();
    },
    blockInCatchBlock(e) {
      var t;
      return (t = e == null ? void 0 : e.braceBlock()) == null ? void 0 : t.block();
    }
  }
}, va = (e) => ($e("data-v-107670fe"), e = e(), je(), e), $w = { class: "segment" }, jw = /* @__PURE__ */ va(() => /* @__PURE__ */ b("div", { class: "header bg-skin-fragment-header text-skin-fragment-header text-base leading-4 rounded-t" }, [
  /* @__PURE__ */ b("div", { class: "name font-semibold p-1 border-b" }, [
    /* @__PURE__ */ b("label", null, "Try")
  ])
], -1)), Vw = /* @__PURE__ */ va(() => /* @__PURE__ */ b("label", { class: "keyword catch p-1" }, "catch", -1)), qw = { class: "exception p-1" }, Zw = {
  key: 0,
  class: "segment mt-2 border-t border-solid"
}, Ww = /* @__PURE__ */ va(() => /* @__PURE__ */ b("div", { class: "header text-skin-fragment finally" }, [
  /* @__PURE__ */ b("label", { class: "keyword finally p-1" }, "finally")
], -1));
function Yw(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("block");
  return R(), W("div", {
    class: "fragment tcf border-skin-fragment rounded",
    style: gt(e.fragmentStyle)
  }, [
    b("div", $w, [
      n.comment ? (R(), wt(o, {
        key: 0,
        comment: n.comment
      }, null, 8, ["comment"])) : mt("", !0),
      jw,
      i.blockInTryBlock ? (R(), wt(a, {
        key: 1,
        style: gt({ paddingLeft: `${e.offsetX}px` }),
        context: i.blockInTryBlock,
        selfCallIndent: n.selfCallIndent
      }, null, 8, ["style", "context", "selfCallIndent"])) : mt("", !0)
    ]),
    (R(!0), W(zt, null, Sn(i.tcf.catchBlock(), (l, c) => (R(), W("div", {
      key: c + 500,
      class: "segment mt-2 border-t border-solid"
    }, [
      (R(), W("div", {
        class: "header text-skin-fragment",
        key: c + 1e3
      }, [
        Vw,
        b("label", qw, Ht(i.exception(l)), 1)
      ])),
      (R(), wt(a, {
        style: gt({ paddingLeft: `${e.offsetX}px` }),
        context: i.blockInCatchBlock(l),
        selfCallIndent: n.selfCallIndent,
        key: c + 2e3
      }, null, 8, ["style", "context", "selfCallIndent"]))
    ]))), 128)),
    i.finallyBlock ? (R(), W("div", Zw, [
      Ww,
      at(a, {
        style: gt({ paddingLeft: `${e.offsetX}px` }),
        context: i.finallyBlock,
        selfCallIndent: n.selfCallIndent
      }, null, 8, ["style", "context", "selfCallIndent"])
    ])) : mt("", !0)
  ], 4);
}
const Kw = /* @__PURE__ */ xt(Gw, [["render", Yw], ["__scopeId", "data-v-107670fe"]]), Qw = {
  name: "return",
  props: ["context", "comment"],
  computed: {
    ...ge(["distance", "cursor", "onElementClick"]),
    from: function() {
      return this.context.Origin();
    },
    asyncMessage: function() {
      var e;
      return (e = this.context) == null ? void 0 : e.ret().asyncMessage();
    },
    width: function() {
      return this.isSelf ? Hs(this.signature, rr.MessageContent) : Math.abs(this.distance(this.target, this.source));
    },
    left: function() {
      return this.rightToLeft ? this.distance(this.target, this.from) + 2 : this.distance(this.source, this.from) + 2;
    },
    rightToLeft: function() {
      return this.distance(this.target, this.source) < 0;
    },
    signature: function() {
      var e, t, n, r, s;
      return ((t = (e = this.asyncMessage) == null ? void 0 : e.content()) == null ? void 0 : t.getFormattedText()) || ((s = (r = (n = this.context) == null ? void 0 : n.ret()) == null ? void 0 : r.expr()) == null ? void 0 : s.getFormattedText());
    },
    source: function() {
      var e, t;
      return ((t = (e = this.asyncMessage) == null ? void 0 : e.from()) == null ? void 0 : t.getFormattedText()) || this.from;
    },
    target: function() {
      var e, t, n, r;
      return ((t = (e = this.asyncMessage) == null ? void 0 : e.to()) == null ? void 0 : t.getFormattedText()) || ((r = (n = this.context) == null ? void 0 : n.ret()) == null ? void 0 : r.ReturnTo());
    },
    isCurrent: function() {
      return !1;
    },
    isSelf: function() {
      return this.source === this.target;
    }
  },
  methods: {
    onClick() {
      this.onElementClick(gr.from(this.context));
    }
  },
  components: {
    Comment: rs,
    Message: ns
  }
}, Xw = ["data-signature"], Jw = {
  key: 1,
  class: "flex items-center"
}, tC = /* @__PURE__ */ b("svg", {
  class: "w-3 h-3 flex-shrink-0 fill-current m-1",
  viewBox: "0 0 512 512"
}, [
  /* @__PURE__ */ b("path", {
    class: "cls-1",
    d: "M256 0C114.84 0 0 114.84 0 256s114.84 256 256 256 256-114.84 256-256S397.16 0 256 0Zm0 469.33c-117.63 0-213.33-95.7-213.33-213.33S138.37 42.67 256 42.67 469.33 138.37 469.33 256 373.63 469.33 256 469.33Z"
  }),
  /* @__PURE__ */ b("path", {
    class: "cls-1",
    d: "M288 192h-87.16l27.58-27.58a21.33 21.33 0 1 0-30.17-30.17l-64 64a21.33 21.33 0 0 0 0 30.17l64 64a21.33 21.33 0 0 0 30.17-30.17l-27.58-27.58H288a53.33 53.33 0 0 1 0 106.67h-32a21.33 21.33 0 0 0 0 42.66h32a96 96 0 0 0 0-192Z"
  })
], -1), eC = { class: "name text-sm" };
function nC(e, t, n, r, s, i) {
  const o = ot("comment"), a = ot("Message");
  return R(), W("div", {
    class: ne(["interaction return relative", { "right-to-left": i.rightToLeft, highlight: i.isCurrent }]),
    onClick: t[0] || (t[0] = ii((...l) => i.onClick && i.onClick(...l), ["stop"])),
    "data-signature": i.signature,
    style: gt({ width: i.width + "px", left: i.left + "px" })
  }, [
    n.comment ? (R(), wt(o, {
      key: 0,
      comment: n.comment
    }, null, 8, ["comment"])) : mt("", !0),
    i.isSelf ? (R(), W("div", Jw, [
      tC,
      b("span", eC, Ht(i.signature), 1)
    ])) : mt("", !0),
    i.isSelf ? mt("", !0) : (R(), wt(a, {
      key: 2,
      content: i.signature,
      rtl: i.rightToLeft,
      type: "return"
    }, null, 8, ["content", "rtl"]))
  ], 14, Xw);
}
const rC = /* @__PURE__ */ xt(Qw, [["render", nC]]), sC = {
  name: "divider",
  props: ["context"],
  computed: {
    ...ge(["participants", "centerOf"]),
    width() {
      let e = this.participants.Names().pop();
      return this.centerOf(e) + 10;
    },
    from: function() {
      return this.context.Origin();
    },
    centerOfFrom() {
      return this.centerOf(this.from);
    },
    name: function() {
      return this.context.divider().Note();
    }
  }
}, dh = (e) => ($e("data-v-9e567e69"), e = e(), je(), e), iC = /* @__PURE__ */ dh(() => /* @__PURE__ */ b("div", { class: "left bg-skin-divider" }, null, -1)), oC = { class: "name" }, aC = /* @__PURE__ */ dh(() => /* @__PURE__ */ b("div", { class: "right bg-skin-divider" }, null, -1));
function lC(e, t, n, r, s, i) {
  return R(), W("div", {
    class: "divider",
    style: gt({ width: i.width + "px", transform: "translateX(" + (-1 * i.centerOfFrom + 10) + "px)" })
  }, [
    iC,
    b("div", oC, Ht(i.name), 1),
    aC
  ], 4);
}
const cC = /* @__PURE__ */ xt(sC, [["render", lC], ["__scopeId", "data-v-9e567e69"]]);
class hC {
  constructor(t) {
    B(this, "text"), B(this, "color");
    const n = t.split(`
`);
    this.color = n.find((s) => s.trimStart().startsWith("[red]")) ? "red" : void 0;
    const r = n.map((s) => s.replace("[red]", ""));
    this.text = r.join(`
`), this.text = this.text.trimEnd();
  }
}
const uC = {
  name: "statement",
  props: ["context", "selfCallIndent"],
  computed: {
    comment: function() {
      return this.context.getComment() ? this.context.getComment() : "";
    },
    commentObj: function() {
      return new hC(this.comment);
    },
    subStatement: function() {
      let e = this, t = {
        loop: "FragmentLoop",
        alt: "FragmentAlt",
        par: "FragmentPar",
        opt: "FragmentOpt",
        tcf: "FragmentTryCatchFinally",
        creation: "Creation",
        message: "Interaction",
        asyncMessage: "InteractionAsync",
        divider: "Divider",
        ret: "Return"
      }, n = Object.keys(t).find((r) => e.context[r]() !== null);
      return t[n];
    }
  },
  components: {
    Creation: $b,
    Interaction: tw,
    InteractionAsync: uw,
    FragmentAlt: Cw,
    FragmentPar: Aw,
    FragmentOpt: Hw,
    FragmentTryCatchFinally: Kw,
    FragmentLoop: Fw,
    Divider: cC,
    Return: rC
  }
};
function dC(e, t, n, r, s, i) {
  return R(), wt(W1(i.subStatement), {
    class: "text-left text-sm text-skin-message",
    context: n.context,
    comment: i.comment,
    commentObj: i.commentObj,
    selfCallIndent: n.selfCallIndent
  }, null, 8, ["context", "comment", "commentObj", "selfCallIndent"]);
}
const pC = /* @__PURE__ */ xt(uC, [["render", dC]]), fC = {
  name: "block",
  props: ["context", "selfCallIndent"],
  computed: {
    statements: function() {
      var e;
      return (e = this.context) == null ? void 0 : e.stat();
    }
  },
  components: {
    Statement: pC
  }
}, gC = { class: "block" };
function mC(e, t, n, r, s, i) {
  const o = ot("statement");
  return R(), W("div", gC, [
    (R(!0), W(zt, null, Sn(i.statements, (a, l) => (R(), W("div", {
      class: "statement-container mt-1",
      key: l
    }, [
      at(o, {
        context: a,
        selfCallIndent: n.selfCallIndent
      }, null, 8, ["context", "selfCallIndent"])
    ]))), 128))
  ]);
}
const xC = /* @__PURE__ */ xt(fC, [["render", mC]]), LC = qr.child({ name: "core" });
class c0 {
  constructor(t, n = !1) {
    B(this, "el"), B(this, "_code"), B(this, "_theme"), B(this, "store"), B(this, "app"), this.el = t, this.store = I4(sm()), this.app = i4(n ? $2 : rv), this.app.component("Comment", rs), this.app.component("Block", xC), this.app.use(this.store), this.app.mount(this.el);
  }
  async render(t, n) {
    return LC.debug("rendering", t, n), this._code = t || this._code, this._theme = n || this._theme, this.store.state.theme = this._theme || "default", await this.store.dispatch("updateCode", { code: this._code }), Promise.resolve(this);
  }
  get code() {
    return this._code;
  }
  get theme() {
    return this._theme;
  }
  async getPng() {
    return this.el.children[0].__vue__.toPng();
  }
}
const yC = /^\s*zenuml/;
function vC(e) {
  const t = document.createElement("div");
  t.id = `container-${e}`, t.style.display = "flex", t.innerHTML = `<div id="zenUMLApp-${e}"></div>`;
  const n = t.querySelector(`#zenUMLApp-${e}`);
  return { container: t, app: n };
}
function bC(e) {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  t.setAttribute("x", "0"), t.setAttribute("y", "0"), t.setAttribute("width", "100%"), t.setAttribute("height", "100%");
  const { container: n, app: r } = vC(e);
  return t.appendChild(n), { foreignObject: t, container: n, app: r };
}
const wC = async function(e, t) {
  var f;
  We.info("draw with Zen UML renderer", c0), e = e.replace(yC, "");
  const { securityLevel: n } = h0();
  let r = null;
  n === "sandbox" && (r = document.getElementById("i" + t));
  const s = n === "sandbox" ? (f = r == null ? void 0 : r.contentWindow) == null ? void 0 : f.document : document, i = s == null ? void 0 : s.querySelector(`svg#${t}`);
  if (!s || !i) {
    We.error("Cannot find root or svgContainer");
    return;
  }
  const { foreignObject: o, container: a, app: l } = bC(t);
  i.appendChild(o), await new c0(l).render(e, "theme-mermaid");
  const { width: u, height: d } = window.getComputedStyle(a);
  We.debug("zenuml diagram size", u, d), i.setAttribute("style", `width: ${u}; height: ${d};`);
}, CC = {
  draw: wC
}, _C = {
  db: {
    clear: () => {
    }
  },
  renderer: CC,
  parser: fh,
  styles: () => {
  },
  injectUtils: ph
};
export {
  _C as diagram
};
