(function () {
  // Find our script tag
  const scripts = document.getElementsByTagName('script');
  let currentScript = null;
  
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.includes('embed.js')) {
      if (scripts[i].getAttribute('data-nexcal-user')) {
        currentScript = scripts[i];
        break;
      }
    }
  }

  // Fallback if currentScript is null
  if (!currentScript && document.currentScript && document.currentScript.getAttribute('data-nexcal-user')) {
    currentScript = document.currentScript;
  }

  if (!currentScript) {
    console.error('NexCal embed script requires a data-nexcal-user attribute.');
    return;
  }

  const username = currentScript.getAttribute('data-nexcal-user');
  const eventSlug = currentScript.getAttribute('data-nexcal-event'); // Optional
  const theme = currentScript.getAttribute('data-nexcal-theme') || 'light'; // Optional
  
  // Base host
  const scriptUrl = new URL(currentScript.src);
  const host = scriptUrl.origin;
  
  // Construct URL
  let iframeUrl = `${host}/${username}`;
  if (eventSlug) {
    iframeUrl += `/${eventSlug}`;
  }
  iframeUrl += `?embed=true&theme=${theme}`;

  // Find or create container
  let container = document.getElementById('nexcal-widget');
  if (!container) {
    container = document.createElement('div');
    container.id = 'nexcal-widget';
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
  }

  // Inject iframe
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '400px';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('allowtransparency', 'true');
  container.appendChild(iframe);

  // Listen for resize messages
  window.addEventListener('message', function (e) {
    if (e.origin !== host) return; // Security check
    if (e.data && e.data.type === 'nexcal-resize' && e.data.height) {
      iframe.style.height = e.data.height + 'px';
    }
  });
})();
