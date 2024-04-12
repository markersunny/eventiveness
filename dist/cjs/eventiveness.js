"use strict";function e(t,n,s){if(s||(s="P"),n instanceof Array||(n=[n]),n.includes(s))throw new Error(`Render name ${s} clashes with the name of one of the arguments. \n        Please change the rendername or the argument name to resolve this.`);const r=Function(s,...n,"return "+s+"`"+t+"`;");return(...t)=>r(e.promise,...t)}e.promise=async function(e,...t){const n=[];for(let[e,s]of t.entries())s instanceof Promise?n.push(s):n.push(Promise.resolve(s));const s=await Promise.all(n);return s.map(((t,n)=>`${e[n]}${t}`)).join("")+e[s.length]};const t=async(n,s)=>{for(;"string"!=typeof n&&!(n instanceof Node);)n instanceof Promise&&(n=await n),"function"==typeof n&&(n=n());let r,o;return"string"==typeof n&&s?(o=e(n),r=(...e)=>t.tree(o(...e)).cloneNode()):("string"==typeof n&&(n=t.tree(n)),r=()=>n.cloneNode(!0)),r.tree=n,r.template=o,r};function n(){const e={},t=(t,n)=>s(t,e,n);return t.import=t=>r(t,e),t.set=(t,s)=>function(e,t,s){if(s.hasOwnProperty(e))s[e].self.replaceSync(t);else{const r=document.createElement("style");r.innerText=t,s[e]=new n.StyleSheet(r)}return s[e]}(t,s,e),t.styles=e,t}function s(e,t,r){const o=[];if(e instanceof HTMLStyleElement||e instanceof HTMLLinkElement&&"stylesheet"===e.getAttribute("rel")){const s=e.getAttribute("o-name")||e.getAttribute("href")||n.hash(e.textContent);if(!t.hasOwnProperty(s)||r||e.hasAttribute("o-replace")){let r,i;t.hasOwnProperty(s)?(i=t[s],r=i.self):(r=new CSSStyleSheet,i=new n.StyleSheet(r),t[s]=i),o.push(i),e instanceof HTMLStyleElement?r.replaceSync(e.textContent):fetch(e.getAttribute("href")).then((e=>e.text())).then((e=>r.replaceSync(e)))}else o.push(t[s])}else{let n,i=e.children[0];for(;i;)n=i.nextElementSibling,o.push(...s(i,t,r)),(i instanceof HTMLStyleElement||e instanceof HTMLLinkElement&&"stylesheet"===e.getAttribute("rel"))&&e.removeChild(i),i=n}return o}t.tree=function(e){const t=document.createElement("template");return t.innerHTML=e,t.content};const r=function(e,t){if(t.hasOwnProperty(e))return t[e];{const s=new CSSStyleSheet,r=new n.StyleSheet(s);return t[e]=r,fetch(e).then((e=>e.text())).then((e=>s.replaceSync(e))),r}};function o(){const e={handlers:{},hc:0,handler:t=>{const n=new o.HandlerContext(e);return n.options=t,n.proxy},event:(t,n)=>{const s=new(n||o.EventContext)(e);return s.options=t,s.proxy}};return e.owners=new Map,e}function i(e,t,n){const s=[];for(let r of e.cssRules)if(r.cssText.startsWith(t)){if(n)return r;s.push(r)}return s}function c(e,t){return t||(t=document),t instanceof CSSStyleSheet?i(t,e):t.querySelectorAll(e)}function h(e,t,n,s){let r=!1;e.addEventListener(t,(async(...e)=>{if(s&&e[0].preventDefault(),r)return;r=!0;const t=n(...e);t instanceof Promise&&await t,r=!1}))}n.hash=e=>{let t,n=0;for(let s=0,r=e.length;s<r;s++)t=e.charCodeAt(s),n=(n<<5)-n+t,n|=0;return n},n.StyleSheet=class{constructor(e){this.self=e}style(...e){for(let t of e)t.adoptedStyleSheets?.includes(this.self)||(t.adoptedStyleSheets=[...t.adoptedStyleSheets||[],this.self])}remove(...e){for(let t of e)t.adoptedStyleSheets.includes(this.self)&&t.adoptedStyleSheets.splice(t.adoptedStyleSheets.indexOf(this.self))}},o.Context=class{scope;options={};#e;prefix=null;constructor(e){this.scope=e}clone(e){const t=new this.constructor(this.scope);return Object.assign(t,this,e||{}),null===t.prefix&&(t.prefix=""),t}get proxy(){if(!this.#e){const e=this.trap;this.#e=new Proxy(((...e)=>e.length?this.create(...e):this),e)}return this.#e}create(...e){}get trap(){const e=this;return{get:(t,n)=>null===e.prefix?e.clone().proxy[n]:"$"===n?e.clone().proxy:(e.prefix=(e.prefix?e.prefix+".":"")+n,e.update(),e.proxy)}}update(){}},o.HandlerContext=class extends o.Context{eventName="";handlerFunction=null;handlerName;create(e,t){if(0===e)return void(this.scope.handlers[this.eventName]={});if(t&&(this.options=Object.assign({},this.options||{},t)),e||(e=this.handlerFunction),this.handlerFunction=e,e){if(this.options?.raf){const t=e;e=e=>window.requestAnimationFrame((n=>t(e,n)))}else if(this.options?.st){const t=e;e=e=>setTimeout(((...n)=>t(e,...n)))}this.scope.hc++;const t=this.options?.name||"h"+this.scope.hc;let o;if(this.handlerName=t,this.options?.own){let e=this.options.own;"string"!=typeof e&&(e=this.eventName);const t=this.scope.owners;t.hasOwnProperty(e)||(t[e]=[]),t[e].push((n=this.scope.handlers,s=this.eventName,r=this.handlerName,()=>delete n[s][r]))}o=[this,e,t],this.scope.handlers.hasOwnProperty(this.eventName)||(this.scope.handlers[this.eventName]={}),this.scope.handlers[this.eventName][t]=o}var n,s,r;let o;const i=this;return new Proxy(((...t)=>t.length?this.create(e,t[0]):this),{get:(e,t)=>(o||(o=i.clone({prefix:"",eventName:""}).proxy),o[t])})}delete(){this.eventName&&this.handlerName&&(delete this.scope.handlers[this.eventName][this.handlerName],this.eventName="",delete this.handlerName)}update(){this.eventName=this.prefix}},o.EventContext=class extends o.Context{events=[];args=null;clone(e){const t=super.clone(e);return t.events=[],t}handle(e,t,n,s){let[r,o,i]=e;Object.assign(t,{handler:r});const c=o(t);return this.options?.clear&&delete s[i],c}dispatch(e){const t={};let n,s,r,o,i,c;for(let h of this.events)if(n=this.scope.handlers[h],n){for(r of(s=Array.from(Object.values(n)),s)){if(o=this.handle(r,e,h,n),"esc"===o&&this.options?.esc||r[0].options?.esc)return;r[0].options?.name&&(t[r[0].options.name]=o)}for(c of(i=this.scope.owners[h]||[],i))c()}return t}create(e,t,n){const s=e;t&&(this.options=Object.assign({},this.options||{},t)),e.length||(e=this.args||[]),e instanceof Array||(e=[e]),this.args=e;const r={args:e,event:this,target:n},o=this.dispatch(r,t);let i;const c=this;return new Proxy(((...t)=>t.length?this.create(e,t[0]):this),{get:(e,t)=>"$"===t?{args:s,results:o}:(i||(i=c.clone({prefix:"",events:[]}).proxy),i[t])})}update(){this.events.push(this.prefix)}};class a{registry={};constructor(e,t){this.props=e||{},this.attrs=t||"c-"}register(e,t){this.registry[e]=t}process(e,t){let n,s,r,o,i=[],c=!1;for(let{attr:h,value:a}of e.attributes)if(h.startsWith(this.compAttr)){if(c=!0,n=h.substring(this.compAttr.length),!this.registry.hasOwnProperty(n)){console.error(`The component  "${n}" was not found in the registry.`);break}if(i=[],o=!0,a=a.trim(),a)for(s of a.split(" "))if(s=s.trim(),s){if(r=t[s]||this.props[s],void 0===r){o=!1;break}i.push(r)}if(!o){console.error(`Some properties were not found for the component "${n}."`);break}this.registry[n](e,...i)}if(!c)for(child of e.children)this.process(e,t)}}exports.Fragment=class{constructor(e){this.childNodes=Array.from(e.childNodes)}get(){const e=new DocumentFragment;return e.append(...this.childNodes),e}remove(){for(let e of this.childNodes)e.parentNode?.removeChild(e)}},exports.actribute=function(e,t){const n=new a(e,t);return{comp:(e,t)=>n.process(e,t),act:n}},exports.addEventListener=h,exports.apply=function(e,t){let n,s,r;for(let[o,i]of Object.entries(e))for(r of(n=c(o,t),i instanceof Array||(i=[i]),n))for(s of i)s(r)},exports.apriori=t,exports.arender=e,exports.eventivity=o,exports.onEnter=function(e,t,n){h(e,"keyup",(e=>{if(13===e.key)return n&&e.preventDefault(),t()}))},exports.querySelector=function(e,t){return t||(t=document),t instanceof CSSStyleSheet?i(t,e,!0):t.querySelector(e)},exports.querySelectorAll=c,exports.selectRules=i,exports.sophistry=n;
