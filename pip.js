// Arc's mini player. Chrome already moves a playing video into a picture-in-picture window when you switch
// tabs, and puts it back when you return, but only for pages that register this handler. Runs in the page's
// own world at document_start, so a site that registers its own handler later (Meet, Zoom) replaces this one.
navigator.mediaSession?.setActionHandler('enterpictureinpicture', () => {
  const playing = [...document.querySelectorAll('video')].find((v) => !v.paused && !v.ended && v.readyState > 2);
  playing?.requestPictureInPicture().catch(() => {});
});
