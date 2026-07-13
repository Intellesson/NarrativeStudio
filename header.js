/* Shared site header. Edit the nav in ONE place here; every page loads this
   script right after <body> and the header is injected before anything else
   renders. The link matching the current page is highlighted. */
(function () {
  var LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'workflow.html', label: 'Workflow' },
    { href: 'speech-to-speech.html', label: 'Speech to Speech' }
  ];
  var DOWNLOAD = { href: 'index.html#download', label: 'Coming soon' };

  // Current file name ('' -> index.html, e.g. served as the site root).
  var here = location.pathname.split('/').pop() || 'index.html';

  var nav = LINKS.map(function (l) {
    var current = l.href === here ? ' aria-current="page"' : '';
    return '<a class="nav-link"' + current + ' href="' + l.href + '">' + l.label + '</a>';
  }).join('\n      ');

  document.body.insertAdjacentHTML('afterbegin',
    '<header class="bar">\n' +
    '    <a class="logo" href="index.html">\n' +
    '      <img class="brand-mark" src="assets/logo/AHlogo.svg" alt="">\n' +
    '      <span><span class="lg-audio">NARRATIVE</span><span class="lg-hook">STUDIO</span></span>\n' +
    '    </a>\n' +
    '    <nav class="bar-nav">\n      ' + nav + '\n' +
    '      <a class="bar-download" href="' + DOWNLOAD.href + '">' + DOWNLOAD.label + '</a>\n' +
    '    </nav>\n' +
    '  </header>');
})();
