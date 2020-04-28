import { JSDOM } from 'jsdom';
// @ts-ignore
import opn from 'opn';

// https://storage.googleapis.com/truthseeker/nemesis/Tessellation/GlobalPasscode/glb_mindPala78h2Kwq.pdf

setInterval(async () => {
  const dom = await JSDOM.fromURL(
    'https://community.ingress.com/en/discussion/10599/tessera-round-10-perpetua-unmasked-new/p1',
    // 'https://community.ingress.com/en/discussion/10473/tessera-round-10-mind-palace/p1',
  );
  const link = [
    ...dom.window.document.querySelectorAll('a').values(),
  ].filter((a) => /googleapi/.test(a.href))[0];
  if (link) {
    console.log(link.href);
    opn(link.href);
    process.exit(0);
  }
}, 3000);
