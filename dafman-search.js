const dafmanSearchInput = document.querySelector("#dafmanSearchInput");
const dafmanSearchStatus = document.querySelector("#dafmanSearchStatus");
const dafmanSearchResults = document.querySelector("#dafmanSearchResults");
const dafmanIndex = Array.isArray(window.DAFMAN_SEARCH_INDEX) ? window.DAFMAN_SEARCH_INDEX : [];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchTerms(value) {
  return normalizeSearchText(value).split(" ").filter((term) => term.length > 1);
}

function resultScore(entry, terms, query) {
  const haystack = normalizeSearchText(`${entry.section} ${entry.chapterTitle} ${entry.text}`);
  return terms.reduce((score, term) => {
    if (!haystack.includes(term)) return score - 20;
    if (normalizeSearchText(entry.section).includes(term)) return score + 30;
    if (normalizeSearchText(entry.chapterTitle).includes(term)) return score + 12;
    if (haystack.includes(query)) return score + 10;
    return score + 5;
  }, 0);
}

function highlightTerms(text, terms) {
  let escaped = escapeHtml(text);
  terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .forEach((term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      escaped = escaped.replace(new RegExp(`(${safeTerm})`, "gi"), "<mark>$1</mark>");
    });
  return escaped;
}

function searchDafman(query) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = searchTerms(query);
  if (!normalizedQuery || !terms.length) return [];

  return dafmanIndex
    .map((entry) => ({ ...entry, score: resultScore(entry, terms, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.section.localeCompare(b.section, undefined, { numeric: true }))
    .slice(0, 50);
}

function renderResults() {
  const query = dafmanSearchInput.value.trim();
  const terms = searchTerms(query);
  const results = searchDafman(query);

  if (!query) {
    dafmanSearchStatus.textContent = "Enter a term to search DAFMAN 91-203.";
    dafmanSearchResults.innerHTML = "";
    return;
  }

  if (!results.length) {
    dafmanSearchStatus.textContent = `No DAFMAN matches found for "${query}".`;
    dafmanSearchResults.innerHTML = `
      <div class="empty-library">
        <strong>No matching numbered paragraphs found.</strong>
        <span>Try a shorter term or a related word. Example: use "extension cord" instead of "daisy chain".</span>
      </div>
    `;
    return;
  }

  dafmanSearchStatus.textContent = `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`;
  dafmanSearchResults.innerHTML = results.map((entry) => `
    <article class="dafman-result">
      <div>
        <p class="eyebrow">Chapter ${escapeHtml(entry.chapter)} - ${escapeHtml(entry.chapterTitle)}</p>
        <h3>${escapeHtml(entry.section)}</h3>
      </div>
      <p>${highlightTerms(entry.text, terms)}</p>
    </article>
  `).join("");
}

const query = new URLSearchParams(window.location.search).get("q") || "";
dafmanSearchInput.value = query;
renderResults();
dafmanSearchInput.addEventListener("input", renderResults);
