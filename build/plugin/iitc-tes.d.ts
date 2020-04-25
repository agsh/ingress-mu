declare module 'iitc-tes' {
    global {
        const GM_info: {
            script: {
                version: string;
                name: string;
                description: string;
            };
        };
        const pdfjsLib: any;
    }
}
interface IITC extends Window {
    plugin: any;
    bootPlugins: Function[];
    iitcLoaded: boolean;
    addHook: (event: string, handler: (data: any) => void) => void;
    portals: Record<string, any>;
    getPortalLinks: (id: string) => any;
    links: Record<string, {
        options: {
            data: {
                oGuid: string;
                dGuid: string;
            };
        };
    }>;
    postAjax: Function;
}
declare function wrapper(plugin_info: any): void;
declare const script: HTMLScriptElement;
declare const info: {
    script?: object;
};
declare const textContent: Text;
