
function isBrowserSupportPassiveEventListener() {
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
      },
    });
    window.addEventListener('test', null, opts);
  } catch (e) {
    // unsupport
  }

  return supportsPassive;
}


export default isBrowserSupportPassiveEventListener();
