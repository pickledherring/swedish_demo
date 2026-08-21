// Members music library: row selection and downloads.
// Cloudflare Access gates this page at the edge, so nothing here authenticates;
// it only catches a session that expired after load.

const ACCESS_IDENTITY = '/cdn-cgi/access/get-identity';
const ACCESS_LOGOUT = '/cdn-cgi/access/logout';

// True when the Access session is gone and downloads would redirect to login.
async function sessionExpired() {
  try {
    const res = await fetch(ACCESS_IDENTITY, { credentials: 'same-origin' });
    if (res.redirected) return true;
    if (res.status === 401 || res.status === 403) return true;
    return false;
  } catch {
    return false;   // opened outside Access, e.g. local preview
  }
}

function reauthenticate() {
  window.location.href = `${ACCESS_LOGOUT}?returnTo=${encodeURIComponent(window.location.href)}`;
}

// Total files across selected pieces.
function countFiles(items) {
  let files = 0;
  for (const item of items) {
    files += item.parts.length;
  }
  return files;
}

// STUB: replace with the real fetch once scores are hosted.
// items: [{ title, parts: ['music', 'translation'] }]
async function downloadScores(items) {
  console.log('TODO: download', items);
  window.alert(`Downloading ${countFiles(items)} file(s) across ${items.length} piece(s).`);
}

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('scoreList');
  if (!list) return;

  const rows = Array.from(list.querySelectorAll('.score'));
  const count = document.getElementById('selectionCount');
  const selectAll = document.getElementById('selectAll');
  const downloadAll = document.getElementById('downloadAll');
  const downloadMusic = document.getElementById('downloadMusic');

  const rowCheckbox = (row) => row.querySelector('.date input');
  const translationCheckbox = (row) => row.querySelector('input[data-part="translation"]');
  const checkedRows = () => rows.filter((row) => rowCheckbox(row).checked);

  // Selected pieces and their files. Music is always included; musicOnly
  // ignores the per-row translation boxes.
  function selection(musicOnly) {
    return checkedRows().map((row) => {
      const parts = ['music'];
      if (!musicOnly && translationCheckbox(row).checked) {
        parts.push('translation');
      }
      return { title: rowCheckbox(row).dataset.title, parts };
    });
  }

  function render() {
    const items = selection(false);
    const files = countFiles(items);

    if (items.length === 0) {
      count.textContent = 'Nothing selected';
    } else {
      const pieceWord = items.length === 1 ? 'piece' : 'pieces';
      const fileWord = files === 1 ? 'file' : 'files';
      count.textContent = `${items.length} ${pieceWord}, ${files} ${fileWord}`;
    }

    downloadAll.disabled = items.length === 0;
    downloadMusic.disabled = items.length === 0;
    selectAll.textContent = items.length === rows.length ? 'Clear all' : 'Select all';
  }

  async function startDownload(musicOnly) {
    if (await sessionExpired()) {
      reauthenticate();
      return;
    }
    await downloadScores(selection(musicOnly));
  }

  list.addEventListener('change', render);

  selectAll.addEventListener('click', () => {
    const fill = checkedRows().length !== rows.length;
    for (const row of rows) {
      rowCheckbox(row).checked = fill;
    }
    render();
  });

  downloadAll.addEventListener('click', () => startDownload(false));
  downloadMusic.addEventListener('click', () => startDownload(true));

  render();
});
