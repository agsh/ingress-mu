// ==UserScript==
// @id iitc-mu
// @name IITC Plugin: MU collector for the MU map
// @category Misc
// @version 0.0.1
// @namespace https://tempuri.org/iitc/hello
// @description MU collector for the MU map
// @include https://intel.ingress.com/intel*
// @match https://intel.ingress.com/intel*
// @grant none
// ==/UserScript==

declare module 'my-config' {
  global {
    const GM_info: {
      script: { version: string; name: string; description: string };
    };
  }
}

interface IITC extends Window {
  plugin: Function;
  bootPlugins: Function[];
  iitcLoaded: boolean;
}

// Wrapper function that will be stringified and injected
// into the document. Because of this, normal closure rules
// do not apply here.

function wrapper(plugin_info: any): void {
  const _window = (window as any) as IITC;
  // Make sure that window.plugin exists. IITC defines it as a no-op function,
  // and other plugins assume the same.
  if (typeof _window.plugin !== 'function') _window.plugin = (): void => {};

  // Name of the IITC build for first-party plugins
  plugin_info.buildName = 'mu';

  // Datetime-derived version of the plugin
  plugin_info.dateTimeVersion = '20200418210000';

  // ID/name of the plugin
  plugin_info.pluginId = 'mu';

  // The entry point for this plugin.
  function setup() {
    alert('Hello, IITC!');
  }

  // Add an info property for IITC's plugin system
  setup.info = plugin_info;

  // Make sure window.bootPlugins exists and is an array
  if (!_window.bootPlugins) _window.bootPlugins = [];
  // Add our startup hook
  _window.bootPlugins.push(setup);
  // If IITC has already booted, immediately run the 'setup' function
  if (_window.iitcLoaded && typeof setup === 'function') setup();
}

// Create a script element to hold our content script
const script = document.createElement('script');
const info: { script?: object } = {};

// GM_info is defined by the assorted monkey-themed browser extensions
// and holds information parsed from the script header.
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
  info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description,
  };
}

// Create a text node and our IIFE inside of it
const textContent = document.createTextNode(
  `(${wrapper})(${JSON.stringify(info)})`,
);
// Add some content to the script element
script.appendChild(textContent);
// Finally, inject it... wherever.
(document.body || document.head || document.documentElement).appendChild(
  script,
);
