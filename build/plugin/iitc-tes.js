"use strict";
// ==UserScript==
// @id iitc-tes
// @name IITC Plugin: Tesselation
// @category Misc
// @version 0.0.1
// @author https://ginhub.com/agsh
// @namespace https://tempuri.org/iitc/hello
// @description MU collector for the MU map
// @include https://intel.ingress.com/intel*
// @match https://intel.ingress.com/intel*
// @grant none
// ==/UserScript==
// Wrapper function that will be stringified and injected
// into the document. Because of this, normal closure rules
// do not apply here.
function wrapper(plugin_info) {
    const _window = window;
    // Make sure that window.plugin exists. IITC defines it as a no-op function,
    // and other plugins assume the same.
    if (typeof _window.plugin !== 'function')
        _window.plugin = () => { };
    // use own namespace for plugin
    _window.plugin.tes = {};
    // Name of the IITC build for first-party plugins
    plugin_info.buildName = 'tes';
    // Datetime-derived version of the plugin
    plugin_info.dateTimeVersion = '20200418210000';
    // ID/name of the plugin
    plugin_info.pluginId = 'tes';
    function getRandom(arr, n) {
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
    _window.plugin.tes.redeem = function (passcodes) {
        // passcodes.forEach((passcode) => {
        //   _window.postAjax(
        //     'redeemReward',
        //     { passcode },
        //     console.log,
        //     console.error,
        //   );
        // });
        console.log(passcodes);
        _window.postAjax('redeemReward', { passcode: passcodes[0] }, console.log, console.error);
    };
    async function check() {
        if (!_window.plugin.tes.try) {
            clearInterval(_window.plugin.tes.interval);
            return;
        }
        const a13 = $('<div/>').load(_window.plugin.tes.url, async () => {
            const link = [...a13.get(0).querySelectorAll('a').values()].filter((a) => a.innerText === 'here')[0];
            console.log(link); // TODO
            if (!link)
                return;
            const pdf = await pdfjsLib.getDocument(link.href).promise;
            const passcodes = (await Promise.all([...new Array(pdf.numPages)].map((_, i) => (async () => {
                const page = await pdf.getPage(i + 1);
                const content = await page.getTextContent();
                return content.items
                    .map((a) => a.str)
                    .filter((a) => a.length > 3);
            })()))).flat();
            console.log(passcodes);
            _window.plugin.tes.redeem(getRandom(passcodes, 20));
        });
    }
    // The entry point for this plugin.
    function setup() {
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.js', () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.js';
        });
        _window.plugin.tes.try = true;
        _window.plugin.tes.url = prompt('Enter url of the new tesselation round forum topic', 'https://community.ingress.com/en/discussion/10473/tessera-round-10-mind-palace/p1');
        _window.plugin.tes.interval = setInterval(check, 3000);
    }
    // Add an info property for IITC's plugin system
    setup.info = plugin_info;
    // Make sure window.bootPlugins exists and is an array
    if (!_window.bootPlugins)
        _window.bootPlugins = [];
    // Add our startup hook
    _window.bootPlugins.push(setup);
    // If IITC has already booted, immediately run the 'setup' function
    if (_window.iitcLoaded && typeof setup === 'function')
        setup();
}
// Create a script element to hold our content script
const script = document.createElement('script');
const info = {};
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
const textContent = document.createTextNode(`(${wrapper})(${JSON.stringify(info)})`);
// Add some content to the script element
script.appendChild(textContent);
// Finally, inject it... wherever.
(document.body || document.head || document.documentElement).appendChild(script);
//# sourceMappingURL=iitc-tes.js.map