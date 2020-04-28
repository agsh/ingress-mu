"use strict";
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
    _window.plugin.mu = {};
    // Name of the IITC build for first-party plugins
    plugin_info.buildName = 'mu';
    // Datetime-derived version of the plugin
    plugin_info.dateTimeVersion = '20200418210000';
    // ID/name of the plugin
    plugin_info.pluginId = 'mu';
    _window.plugin.mu.tes = function (text) {
        const prefix = text.slice(1, 3);
        const passcodes = text
            .slice(1, -1)
            .split(prefix)
            .filter((a) => a)
            .map((text) => prefix + text);
        passcodes.forEach((passcode) => {
            _window.postAjax('redeemReward', { passcode }, console.log, console.error);
        });
    };
    function findLinkedPortals(latFrom, lngFrom, latTo, lngTo) {
        let from;
        let to;
        for (const [id, point] of Object.entries(_window.portals)) {
            if (point._latlng.lat === latFrom / 1e6 &&
                point._latlng.lng === lngFrom / 1e6) {
                from = id;
            }
            else if (point._latlng.lat === latTo / 1e6 &&
                point._latlng.lng === lngTo / 1e6) {
                to = id;
            }
            if (from && to) {
                break;
            }
        }
        if (from && to) {
            return [from, to];
        }
        return undefined;
    }
    function waitForPortals(cb) {
        if (Object.keys(_window.portals).length > 0) {
            cb(_window.portals);
        }
        else {
            setTimeout(waitForPortals, 1000, cb);
        }
    }
    function getLinkedPortals(links) {
        return [
            ...links.in.map((inLink) => _window.links[inLink].options.data.oGuid),
            ...links.out.map((outLink) => _window.links[outLink].options.data.dGuid),
        ];
    }
    _window.plugin.mu.processFields = (rawPlexts) => {
        const fieldsAndLinks = rawPlexts.filter((rawPlext) => {
            const action = rawPlext[2].plext.markup[1][1].plain;
            return action === ' created a Control Field @' || action === ' linked ';
        });
        const uniqueFieldsAndLinks = {};
        fieldsAndLinks.forEach((fieldOrLink) => {
            const { markup } = fieldOrLink[2].plext;
            if (markup.length === 5) {
                uniqueFieldsAndLinks[fieldOrLink[0]] = {
                    type: 'link',
                    dateTime: fieldOrLink[1],
                    from: markup[2][1],
                    to: markup[4][1],
                    player: markup[0][1].plain,
                };
            }
            else {
                uniqueFieldsAndLinks[fieldOrLink[0]] = {
                    type: 'field',
                    dateTime: fieldOrLink[1],
                    from: markup[2][1],
                    mu: parseInt(markup[4][1].plain, 10),
                };
            }
        });
        const actionsByTime = {};
        Object.values(uniqueFieldsAndLinks).forEach((fieldOrLink) => {
            actionsByTime[fieldOrLink.dateTime]
                ? actionsByTime[fieldOrLink.dateTime].push(fieldOrLink)
                : (actionsByTime[fieldOrLink.dateTime] = [fieldOrLink]);
        });
        const links = Object.values(actionsByTime)
            .filter((action) => action.length > 1)
            .map((action) => {
            let mu = 0;
            let link;
            action.forEach((linkOrField) => {
                if (linkOrField.type === 'field') {
                    mu += linkOrField.mu;
                }
                else {
                    link = linkOrField;
                }
            });
            if (!link) {
                console.log(`data when link is undefined`, action);
            }
            return Object.assign(Object.assign({}, link), { mu, num: action.length - 1 });
        })
            .filter((link) => typeof link.from !== 'undefined');
        // console.log('links', links);
        // console.log('waiting');
        waitForPortals(() => {
            // console.log('done');
            const portals = links
                .map((data) => {
                const result = findLinkedPortals(data.from.latE6, data.from.lngE6, data.to.latE6, data.to.lngE6);
                if (!result) {
                    return null;
                }
                const [fromPortalId, toPortalId] = result;
                const instance = {
                    num: data.num,
                    from: getLinkedPortals(_window.getPortalLinks(fromPortalId)),
                    fromPortal: data.from,
                    fromPortalId,
                    to: getLinkedPortals(_window.getPortalLinks(toPortalId)),
                    toPortal: data.to,
                    toPortalId,
                    mu: data.mu,
                };
                // console.log('instance', instance);
                const commonPoints = [];
                for (const id of instance.from) {
                    if (instance.to.includes(id)) {
                        commonPoints.push(id);
                    }
                }
                // console.log(commonPoints.length, data.num);
                if (commonPoints.length !== data.num) {
                    return null;
                }
                let sourcePoints;
                switch (commonPoints.length) {
                    case 2:
                        sourcePoints = [
                            fromPortalId,
                            commonPoints[0],
                            toPortalId,
                            commonPoints[1],
                        ];
                        break;
                    case 1:
                        sourcePoints = [fromPortalId, commonPoints[0], toPortalId];
                        break;
                    default:
                        console.log('strange common points', commonPoints);
                        return null;
                }
                const coordinates = sourcePoints.map((id) => _window.portals[id].toGeoJSON().geometry.coordinates);
                return {
                    type: 'Feature',
                    properties: {
                        mu: data.mu,
                        dateTime: data.dateTime,
                        player: data.player,
                        from: data.from.plain,
                        to: data.to.plain,
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[...coordinates, coordinates[0]]],
                    },
                };
            })
                .filter((a) => a !== null);
            console.log(portals);
            portals.forEach((portal) => {
                $.ajax({
                    type: 'POST',
                    url: 'http://localhost:13666/mu',
                    data: JSON.stringify(portal),
                    contentType: 'application/json',
                    dataType: 'json',
                })
                    .then((data) => console.log('posted', data, portal))
                    .catch(() => console.error('error posting', portal));
            });
        });
    };
    // The entry point for this plugin.
    function setup() {
        /*
        a13 = $('<div/>').load('https://community.ingress.com/en/discussion/10473/tessera-round-10-mind-palace/p1', async () => {
          const link = [...a13.get(0).querySelectorAll('a').values()].filter(a => a.innerText == 'here')[0];
          console.log(link);
          if (!link) return;
    
          const pdf = await pdfjsLib.getDocument(link.href);
          const page = await pdf.getPage(1);
          const content = await page.getTextContent();
          console.log(content);
        })
        */
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.js', () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.js';
        });
        let plexts = [];
        _window.addHook('publicChatDataAvailable', (data) => {
            // console.log('hi', data.result);
            plexts.push(data.result);
            _window.plugin.mu.processFields(data.result);
        });
        _window.addHook('mapDataRefreshEnd', () => {
            plexts.forEach((plext) => {
                console.log('process', plext);
                _window.plugin.mu.processFields(plext);
            });
            plexts = [];
        });
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
//# sourceMappingURL=iitc-mu.js.map