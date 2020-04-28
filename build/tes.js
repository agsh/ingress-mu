"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
// @ts-ignore
const opn_1 = __importDefault(require("opn"));
// https://storage.googleapis.com/truthseeker/nemesis/Tessellation/GlobalPasscode/glb_mindPala78h2Kwq.pdf
setInterval(async () => {
    const dom = await jsdom_1.JSDOM.fromURL('https://community.ingress.com/en/discussion/10599/tessera-round-10-perpetua-unmasked-new/p1');
    const link = [
        ...dom.window.document.querySelectorAll('a').values(),
    ].filter((a) => /googleapi/.test(a.href))[0];
    if (link) {
        console.log(link.href);
        opn_1.default(link.href);
        process.exit(0);
    }
}, 3000);
//# sourceMappingURL=tes.js.map