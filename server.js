const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 4173;
const host = process.env.HOST || "0.0.0.0";
const root = __dirname;
const githubToken = process.env.GITHUB_TOKEN || "";
const githubOwner = process.env.GITHUB_OWNER || "jgrimm24";
const githubRepo = process.env.GITHUB_REPO || "spot-inspections-air-force";
const githubBranch = process.env.GITHUB_BRANCH || "main";
const libraryPath = process.env.GITHUB_LIBRARY_PATH || "Spot-Inspection-Library";
const deleteToken = process.env.LIBRARY_DELETE_TOKEN || "";
const maxBodySize = 8 * 1024 * 1024;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Library-Delete-Token"
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodySize) {
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function createGitHubHeaders(extraHeaders = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "spot-inspection-library-service",
    ...extraHeaders
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

async function fetchGitHubJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: createGitHubHeaders(options.headers || {})
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.message || "GitHub request failed.");
    error.statusCode = response.status;
    throw error;
  }

  return result;
}

function encodeGitHubPath(targetPath) {
  return encodeURIComponent(targetPath).replace(/%2F/g, "/");
}

function sanitizeSlug(value, fallback = "spot-inspection") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function createInspectionFilename(record) {
  const unit = sanitizeSlug(record.unit, "unit");
  const date = sanitizeSlug(record.inspectionDate, "date");
  const area = sanitizeSlug(record.functionalArea, "area");
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  return `${unit}-${area}-${date}-${stamp}.json`;
}

function validateLibraryPath(value) {
  const targetPath = String(value || "").trim();
  if (!targetPath || !targetPath.startsWith(`${libraryPath}/`) || path.extname(targetPath).toLowerCase() !== ".json") {
    throw new Error("The requested inspection library file could not be validated.");
  }

  return targetPath;
}

function requireGitHubToken() {
  if (!githubToken) {
    throw new Error("The service is missing the GITHUB_TOKEN environment variable.");
  }
}

async function fetchExistingFileSha(targetPath) {
  const response = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${encodeGitHubPath(targetPath)}?ref=${encodeURIComponent(githubBranch)}`, {
    headers: createGitHubHeaders()
  });

  if (response.status === 404) {
    return "";
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "GitHub request failed.");
  }

  return result.sha || "";
}

async function writeGitHubFile(targetPath, content, message) {
  requireGitHubToken();

  const existingSha = await fetchExistingFileSha(targetPath);
  const body = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: githubBranch
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  return fetchGitHubJson(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${encodeGitHubPath(targetPath)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function readGitHubJsonFile(targetPath) {
  const result = await fetchGitHubJson(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${encodeGitHubPath(targetPath)}?ref=${encodeURIComponent(githubBranch)}`);
  if (!result.content) {
    return null;
  }

  return JSON.parse(Buffer.from(String(result.content).replace(/\s/g, ""), "base64").toString("utf8"));
}

async function listInspectionFiles() {
  try {
    const result = await fetchGitHubJson(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${encodeGitHubPath(libraryPath)}?ref=${encodeURIComponent(githubBranch)}`);
    return Array.isArray(result)
      ? result.filter((item) => item?.type === "file" && String(item.name || "").endsWith(".json"))
      : [];
  } catch (error) {
    if (error.statusCode === 404) {
      return [];
    }
    throw error;
  }
}

async function listInspections() {
  const files = await listInspectionFiles();
  const entries = await Promise.all(files.map(async (file) => {
    const payload = await readGitHubJsonFile(file.path);
    return {
      id: payload?.id || file.sha,
      path: file.path,
      sha: file.sha,
      savedAt: payload?.savedAt || "",
      record: payload?.record || {},
      reportText: payload?.reportText || ""
    };
  }));

  return entries.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

async function saveInspection(payload) {
  const record = payload?.record || {};
  if (!record.unit || !record.inspectionDate) {
    throw new Error("Unit and inspection date are required before saving.");
  }

  const entry = {
    id: `SI-${Date.now()}`,
    savedAt: new Date().toISOString(),
    record,
    reportText: payload.reportText || ""
  };
  const filename = createInspectionFilename(record);
  const targetPath = `${libraryPath}/${filename}`;
  await writeGitHubFile(
    targetPath,
    JSON.stringify(entry, null, 2),
    `Add spot inspection for ${record.unit} [skip render]`
  );

  return { ...entry, path: targetPath };
}

async function deleteInspection(payload, requestDeleteToken) {
  requireGitHubToken();
  if (deleteToken && String(requestDeleteToken || "") !== deleteToken) {
    const error = new Error("A valid library delete code is required.");
    error.statusCode = 401;
    throw error;
  }

  const targetPath = validateLibraryPath(payload?.path);
  const sha = String(payload?.sha || "").trim();
  if (!sha) {
    throw new Error("The inspection file SHA is required for deletion.");
  }

  await fetchGitHubJson(`https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${encodeGitHubPath(targetPath)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Delete spot inspection ${path.basename(targetPath)} [skip render]`,
      sha,
      branch: githubBranch
    })
  });
}

async function updateInspection(payload) {
  requireGitHubToken();

  const targetPath = validateLibraryPath(payload?.path);
  const currentEntry = await readGitHubJsonFile(targetPath);
  if (!currentEntry?.record) {
    throw new Error("The saved inspection record could not be loaded for update.");
  }

  const updates = payload?.recordUpdates || {};
  const updatedRecord = {
    ...currentEntry.record,
    reviewer: String(updates.reviewer || "").trim(),
    reviewDate: String(updates.reviewDate || "").trim(),
    followUpLog: String(updates.followUpLog || "").trim()
  };

  const updatedEntry = {
    ...currentEntry,
    updatedAt: new Date().toISOString(),
    record: updatedRecord
  };

  const result = await writeGitHubFile(
    targetPath,
    JSON.stringify(updatedEntry, null, 2),
    `Update follow-up for ${updatedRecord.unit || "spot inspection"} [skip render]`
  );

  return { ...updatedEntry, path: targetPath, sha: result?.content?.sha || "" };
}

function serveStaticFile(requestUrl, res) {
  const requestPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);
  const relativePath = path.relative(root, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${port}`}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Library-Delete-Token"
    });
    res.end();
    return;
  }

  try {
    if (requestUrl.pathname === "/api/inspections" && req.method === "GET") {
      sendJson(res, 200, { ok: true, inspections: await listInspections(), requiresDeleteToken: Boolean(deleteToken) });
      return;
    }

    if (requestUrl.pathname === "/api/inspections" && req.method === "POST") {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || "{}");
      sendJson(res, 200, { ok: true, inspection: await saveInspection(payload) });
      return;
    }

    if (requestUrl.pathname === "/api/inspections" && req.method === "PATCH") {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || "{}");
      sendJson(res, 200, { ok: true, inspection: await updateInspection(payload) });
      return;
    }

    if (requestUrl.pathname === "/api/inspections" && req.method === "DELETE") {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || "{}");
      await deleteInspection(payload, req.headers["x-library-delete-token"]);
      sendJson(res, 200, { ok: true });
      return;
    }
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Spot inspection library request failed."
    });
    return;
  }

  serveStaticFile(requestUrl, res);
}).listen(port, host, () => {
  console.log(`Spot Inspection app running at http://${host}:${port}`);
});
