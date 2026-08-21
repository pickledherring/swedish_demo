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
  const selectMusicOnly = document.getElementById('selectMusicOnly');
  const selectTranslationsOnly = document.getElementById('selectTranslationsOnly');
  const downloadAll = document.getElementById('downloadAll');

  const rowCheckbox = (row) => row.querySelector('.date input');
  const partCheckbox = (row, part) => row.querySelector(`input[data-part="${part}"]`);
  const checkedRows = () => rows.filter((row) => rowCheckbox(row).checked);

  // Selected pieces and their files; a row with both parts off yields nothing.
  function selection() {
    const items = [];

    for (const row of checkedRows()) {
      const parts = [];
      if (partCheckbox(row, 'music').checked) parts.push('music');
      if (partCheckbox(row, 'translation').checked) parts.push('translation');
      if (parts.length === 0) continue;

      items.push({ title: rowCheckbox(row).dataset.title, parts });
    }

    return items;
  }

  // checks every piece, keeping only the named part
  function selectOnly(part) {
    for (const row of rows) {
      rowCheckbox(row).checked = true;
      partCheckbox(row, 'music').checked = part === 'music';
      partCheckbox(row, 'translation').checked = part === 'translation';
    }
    render();
  }

  function render() {
    const items = selection();
    const files = countFiles(items);

    if (items.length === 0) {
      count.textContent = 'Nothing selected';
    } else {
      const pieceWord = items.length === 1 ? 'piece' : 'pieces';
      const fileWord = files === 1 ? 'file' : 'files';
      count.textContent = `${items.length} ${pieceWord}, ${files} ${fileWord}`;
    }

    downloadAll.disabled = items.length === 0;
    selectAll.textContent = items.length === rows.length ? 'Clear all' : 'Select all';
  }

  list.addEventListener('change', render);

  selectAll.addEventListener('click', () => {
    const fill = checkedRows().length !== rows.length;
    for (const row of rows) {
      rowCheckbox(row).checked = fill;
      if (fill) {
        partCheckbox(row, 'music').checked = true;
        partCheckbox(row, 'translation').checked = true;
      }
    }
    render();
  });

  selectMusicOnly.addEventListener('click', () => selectOnly('music'));
  selectTranslationsOnly.addEventListener('click', () => selectOnly('translation'));

  downloadAll.addEventListener('click', async () => {
    if (await sessionExpired()) {
      reauthenticate();
      return;
    }
    await downloadScores(selection());
  });

  render();
});
