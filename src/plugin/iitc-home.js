// ==UserScript==
// @id iitc-home
// @name IITC Plugin: Home portal map
// @category Misc
// @version 0.0.1
// @author https://ginhub.com/agsh
// @namespace https://tempuri.org/iitc/hello
// @description Show home portals
// @include https://intel.ingress.com/intel*
// @match https://intel.ingress.com/intel*
// @grant none
// ==/UserScript==

/* global L, GM_info, $ */

function wrapper(pluginInfo) {
  const home = (window.plugin.home = {
    serverUrl: 'http://localhost:13666/',
    testData: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            player: 'sitty',
            fraction: 'resistance',
            added: {
              date: '2020',
              player: 'agsh',
            },
            approved: {
              date: '2020',
              player: 'agsh',
            },
          },
          geometry: {
            type: 'Point',
            coordinates: [30.348014831542965, 59.97856221809323],
          },
        },
      ],
    },

    setup() {
      window.addHook('portalDetailsUpdated', window.plugin.home.portalDetail);
      home.addLayer();
    },

    addLayer() {
      home.layer = L.geoJSON(this.testData).bindPopup((layer) => {
        return JSON.stringify(layer.feature.properties);
      });
      window.addLayerGroup('Home', home.layer, true);
    },

    portalDetail(data) {
      const latLng = {
        lat: data.portalDetails.latE6 / 10e5,
        lng: data.portalDetails.lngE6 / 10e5,
      };
      const button = $(`
        <span 
            class="material-icons icon-button" 
            title="${latLng.lat} : ${latLng.lng}"
        >🏠</span>`);
      button.appendTo($('#portaldetails').children('h3'));
    },
  });

  const { setup } = window.plugin.home;
  setup.info = {
    script: {
      version: pluginInfo.script.version,
      name: pluginInfo.script.name,
      description: pluginInfo.script.description,
    },
  };

  // Make sure window.bootPlugins exists and is an array
  if (!window.bootPlugins) window.bootPlugins = [];
  // Add our startup hook
  window.bootPlugins.push(setup);
  // If IITC has already booted, immediately run the 'setup' function
  if (window.iitcLoaded && typeof setup === 'function') setup();
}

// Create a script element to hold our content script
const script = document.createElement('script');
const info = {
  script: {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description,
  },
};

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
