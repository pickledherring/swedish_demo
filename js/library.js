// Members music library.
//
// Gating is Cloudflare Access, which runs at the edge: an unauthenticated
// visitor never reaches this file, they get the Access login screen instead.
// So this script does not authenticate anyone. It only reads the identity
// Access already established, and notices when that session has gone stale.

const ACCESS_IDENTITY = '/cdn-cgi/access/get-identity';
const ACCESS_LOGOUT = '/cdn-cgi/access/logout';

// Ask Access who the current visitor is.
// Returns null when the page is opened outside Access (local preview).
async function getIdentity() {
  try {
    const res = await fetch(ACCESS_IDENTITY, { credentials: 'same-origin' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// An Access session lasts a fixed period, so a page left open overnight will
// still render while every download 302s to the login screen. Detect that by
// watching for a redirect off-origin and send them back through the front door.
async function sessionExpired() {
  try {
    const res = await fetch(ACCESS_IDENTITY, { credentials: 'same-origin' });
    return res.redirected || res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}

function reauthenticate() {
  window.location.href = `${ACCESS_LOGOUT}?returnTo=${encodeURIComponent(window.location.href)}`;
}

// STUB: hand the selected pieces to whatever serves the files.
// Replace with the real implementation once the scores are hosted, e.g. POST
// the titles to a Worker that streams back a zip, or fetch each PDF in turn.
// Access forwards the session cookie on same-origin requests, so the endpoint
// stays protected without any token work here.
async function downloadScores(titles) {
  console.log('TODO: download', titles);
  window.alert(`Downloading ${titles.length} piece(s). Hook up downloadScores() to the real files.`);
}

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('scoreList');
  if (!list) return;

  const boxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
  const count = document.getElementById('selectionCount');
  const selectAll = document.getElementById('selectAll');
  const downloadAll = document.getElementById('downloadAll');

  const identity = await getIdentity();
  if (identity && identity.email) {
    count.dataset.email = identity.email;
  }

  const selected = () => boxes.filter((b) => b.checked);

  function render() {
    const n = selected().length;
    count.textContent = n === 0 ? 'Nothing selected'
      : n === 1 ? '1 piece selected'
      : `${n} pieces selected`;
    downloadAll.disabled = n === 0;
    selectAll.textContent = n === boxes.length ? 'Clear all' : 'Select all';
  }

  boxes.forEach((b) => b.addEventListener('change', render));

  selectAll.addEventListener('click', () => {
    const fill = selected().length !== boxes.length;
    boxes.forEach((b) => { b.checked = fill; });
    render();
  });

  downloadAll.addEventListener('click', async () => {
    if (await sessionExpired()) {
      reauthenticate();
      return;
    }
    await downloadScores(selected().map((b) => b.dataset.title));
  });

  render();
});
