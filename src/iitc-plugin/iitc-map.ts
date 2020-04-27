// ==UserScript==
// @id iitc-pmap
// @name IITC Plugin: Portal map
// @category Misc
// @version 0.0.1
// @author https://ginhub.com/agsh
// @namespace https://tempuri.org/iitc
// @description MU collector for the MU map
// @include https://intel.ingress.com/intel*
// @match https://intel.ingress.com/intel*
// @grant none
// ==/UserScript==

declare module 'iitc-map' {
  global {
    const GM_info: {
      script: { version: string; name: string; description: string };
    };
  }
}

interface IITC extends Window {
  plugin: any;
  bootPlugins: Function[];
  iitcLoaded: boolean;
  addHook: (event: string, handler: (data: any) => void) => void;
  portals: Record<string, any>;
  getPortalLinks: (id: string) => any;
  links: Record<
    string,
    { options: { data: { oGuid: string; dGuid: string } } }
  >;
  postAjax: Function;
}

// Wrapper function that will be stringified and injected
// into the document. Because of this, normal closure rules
// do not apply here.

function wrapper(plugin_info: any): void {
  const _window = (window as any) as IITC;
  // Make sure that window.plugin exists. IITC defines it as a no-op function,
  // and other plugins assume the same.
  if (typeof _window.plugin !== 'function') _window.plugin = (): void => {};

  // use own namespace for plugin
  _window.plugin.tes = {};

  // Name of the IITC build for first-party plugins
  plugin_info.buildName = 'pmap';

  // Datetime-derived version of the plugin
  plugin_info.dateTimeVersion = '20202020200000';

  // ID/name of the plugin
  plugin_info.pluginId = 'tes';

  function getRandom<T>(arr: Array<T>, n: number): Array<T> {
    if (arr.length <= n) {
      return arr;
    }
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  async function redeem(passcode: string): Promise<boolean> {
    return new Promise((resolve) => {
      _window.postAjax(
        'redeemReward',
        { passcode },
        (result: any) => {
          if (result.error) {
            console.error(result);
            return resolve(false);
          }
          console.log(result);
          return resolve(true);
        },
        (err: any) => {
          console.log(err);
          resolve(false);
        },
      );
    });
  }

  async function redeemPasscodes(allPasscodes: string[]): Promise<void> {
    const passcodes = getRandom(allPasscodes, 40);
    let check = true;
    while (check) {
      const passcode = passcodes.pop();
      console.log(`trying to redeem '${passcode}'`);
      check = !(await redeem(passcode!)) && passcodes.length > 0;
    }
  }

  async function check() {
    if (!_window.plugin.tes.try) {
      clearInterval(_window.plugin.tes.interval);
      return;
    }
    const a13 = $('<div/>').load(_window.plugin.tes.url, async () => {
      const link = [...a13.get(0).querySelectorAll('a').values()].filter(
        (a) => a.innerText === 'here',
      )[0];
      if (!link) return;
      console.log(link.href); // TODO
      _window.plugin.tes.try = false;
      const query = await fetch(link.href);
      const data = await query.arrayBuffer();
      console.log(data);
      const pdf = await pdfjsLib.getDocument(data).promise;
      const allPasscodes = (
        await Promise.all(
          [...new Array(pdf.numPages)].map((_, i) =>
            (async () => {
              const page = await pdf.getPage(i + 1);
              const content = await page.getTextContent();
              return content.items
                .map((a: { str: string }) => a.str)
                .join('')
                .split(' ')
                .filter((s: string) => s.length > 3);
            })(),
          ),
        )
      ).flat();
      if (allPasscodes.length < 20) return;
      console.log(allPasscodes);
      redeemPasscodes(allPasscodes);
    });
  }

  // The entry point for this plugin.
  function setup(): void {
    $.getScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.js',
      () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.js';
      },
    );
    const input = $(
      '<div style=""><textarea style="width: 100%;box-sizing: border-box;"></textarea></div>',
    ).appendTo($('#updatestatus'));
    input.children('textarea').on('keydown', async function (e) {
      if (e.key === 'Enter') {
        const text = (this as HTMLTextAreaElement).value;
        const passcodes = text.split('\n').filter((a) => a.length > 2);
        console.log(passcodes);
        await redeemPasscodes(passcodes);
      }
    });
    _window.plugin.tes.try = true;
    _window.plugin.tes.url = prompt(
      'Enter url of the new tesselation round forum topic',
      'https://community.ingress.com/en/discussion/10599/tessera-round-10-perpetua-unmasked-new/p1',
    );
    if (_window.plugin.tes.url) {
      _window.plugin.tes.url = _window.plugin.tes.url.trim();
      _window.plugin.tes.interval = setInterval(check, 3000);
    }
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
