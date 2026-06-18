const dafiSearchInput = document.querySelector("#dafiSearchInput");
const dafiSearchStatus = document.querySelector("#dafiSearchStatus");
const dafiSearchResults = document.querySelector("#dafiSearchResults");
const dafiIndex = Array.isArray(window.DAFI_SEARCH_INDEX) ? window.DAFI_SEARCH_INDEX : [];

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
  }, entry.source.includes("DAFGM") ? 2 : 0);
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

function searchDafi(query) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = searchTerms(query);
  if (!normalizedQuery || !terms.length) return [];

  return dafiIndex
    .map((entry) => ({ ...entry, score: resultScore(entry, terms, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.section.localeCompare(b.section, undefined, { numeric: true }))
    .slice(0, 50);
}

function resultHeading(entry) {
  if (entry.source.includes("DAFGM")) return entry.source;
  return `Chapter ${entry.chapter} - ${entry.chapterTitle}`;
}

function renderResults() {
  const query = dafiSearchInput.value.trim();
  const terms = searchTerms(query);
  const results = searchDafi(query);

  if (!query) {
    dafiSearchStatus.textContent = "Enter a term to search DAFI 91-202.";
    dafiSearchResults.innerHTML = "";
    return;
  }

  if (!results.length) {
    dafiSearchStatus.textContent = `No DAFI matches found for "${query}".`;
    dafiSearchResults.innerHTML = `
      <div class="empty-library">
        <strong>No matching numbered paragraphs found.</strong>
        <span>Try a shorter term or a related phrase such as "hazard report," "supervisor training," or "JSTO."</span>
      </div>
    `;
    return;
  }

  dafiSearchStatus.textContent = `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`;
  dafiSearchResults.innerHTML = results.map((entry) => `
    <article class="dafman-result">
      <div>
        <p class="eyebrow">${escapeHtml(resultHeading(entry))}</p>
        <h3>${escapeHtml(entry.section)}</h3>
      </div>
      <p>${highlightTerms(entry.text, terms)}</p>
    </article>
  `).join("");
}

const query = new URLSearchParams(window.location.search).get("q") || "";
dafiSearchInput.value = query;
renderResults();
dafiSearchInput.addEventListener("input", renderResults);
