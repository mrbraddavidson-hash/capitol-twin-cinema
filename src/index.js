const STATE_KEY = "current";
const CONFIG_KEY = "site-config";
const SESSION_COOKIE = "ctc_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_BODY_BYTES = 24_000;

const EMPTY_STATE = Object.freeze({
  version: 1,
  updatedAt: null,
  entries: []
});

const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  movieLinePhone: "(519) 291-6000",
  facebookUrl: "https://www.facebook.com/CapitolTwinCinema/",
  introCopy: "Movie titles and start times can change during the week. Use the movie line or Facebook before travelling.",
  noticeTitle: "Confirm today’s film and start time.",
  noticeBody: "Call the recorded movie line or check the theatre’s Facebook page for the latest update."
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/showtimes" && request.method === "GET") {
        return jsonResponse(await readState(env), 200, { "Cache-Control": "no-store" });
      }

      if (url.pathname === "/api/site-config" && request.method === "GET") {
        return jsonResponse(await readConfig(env), 200, { "Cache-Control": "no-store" });
      }

      if (url.pathname === "/api/admin/login" && request.method === "POST") {
        return handleLogin(request, env);
      }

      if (url.pathname === "/api/admin/logout" && request.method === "POST") {
        const secure = url.protocol === "https:" ? "; Secure" : "";
        return new Response(null, {
          status: 204,
          headers: {
            "Set-Cookie": `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly${secure}; SameSite=Lax`
          }
        });
      }

      if (url.pathname.startsWith("/api/admin/")) {
        if (!(await hasValidSession(request, env))) {
          return jsonResponse({ error: "Admin sign-in required." }, 401);
        }

        if (url.pathname === "/api/admin/status" && request.method === "GET") {
          return jsonResponse({
            storageConfigured: Boolean(env.NOW_SHOWING),
            trailerSearchConfigured: Boolean(env.YOUTUBE_API_KEY),
            adminPasswordConfigured: Boolean(env.ADMIN_PASSWORD)
          });
        }

        if (url.pathname === "/api/admin/config" && request.method === "GET") {
          return jsonResponse(await readConfig(env));
        }

        if (url.pathname === "/api/admin/config" && request.method === "POST") {
          return saveConfig(request, env);
        }

        if (url.pathname === "/api/admin/showtimes" && request.method === "GET") {
          return jsonResponse(await readState(env));
        }

        if (url.pathname === "/api/admin/showtimes" && request.method === "POST") {
          return saveShowtimes(request, env);
        }

        const deleteMatch = url.pathname.match(/^\/api\/admin\/showtimes\/([^/]+)$/);
        if (deleteMatch && request.method === "DELETE") {
          return deleteShowtime(deleteMatch[1], env);
        }

        if (url.pathname === "/api/admin/trailer-search" && request.method === "POST") {
          return searchTrailers(request, env);
        }
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Request failed", error);
      return jsonResponse({ error: "The request could not be completed." }, 500);
    }
  }
};

async function handleLogin(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return jsonResponse({
      error: "Admin access is not configured yet. Set the ADMIN_PASSWORD Worker secret."
    }, 503);
  }

  const body = await readJson(request);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !(await constantTimeEqual(password, env.ADMIN_PASSWORD))) {
    return jsonResponse({ error: "Incorrect admin password." }, 401);
  }

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = encodeText(JSON.stringify({ exp: expiresAt }));
  const signature = await sign(payload, env.ADMIN_PASSWORD);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const cookie = `${SESSION_COOKIE}=${payload}.${signature}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly${secure}; SameSite=Lax`;
  return jsonResponse({ ok: true, expiresAt }, 200, { "Set-Cookie": cookie });
}

async function saveShowtimes(request, env) {
  if (!env.NOW_SHOWING) {
    return jsonResponse({ error: "NOW_SHOWING storage is not configured." }, 503);
  }

  const body = await readJson(request);
  if (!Array.isArray(body?.entries)) {
    return jsonResponse({ error: "Send an entries array." }, 400);
  }

  if (body.entries.length > 12) {
    return jsonResponse({ error: "A maximum of 12 listings can be published." }, 400);
  }

  const entries = [];
  for (let index = 0; index < body.entries.length; index += 1) {
    try {
      entries.push(normalizeEntry(body.entries[index], index));
    } catch (error) {
      return jsonResponse({ error: error.message || `Listing ${index + 1} is invalid.` }, 400);
    }
  }

  const state = {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries
  };
  await env.NOW_SHOWING.put(STATE_KEY, JSON.stringify(state));
  return jsonResponse(state, 201);
}

async function saveConfig(request, env) {
  if (!env.NOW_SHOWING) {
    return jsonResponse({ error: "NOW_SHOWING storage is not configured." }, 503);
  }

  const body = await readJson(request);
  const config = normalizeConfig(body?.config || body);
  const record = { ...config, updatedAt: new Date().toISOString() };
  await env.NOW_SHOWING.put(CONFIG_KEY, JSON.stringify(record));
  return jsonResponse(record, 201);
}

async function deleteShowtime(id, env) {
  if (!env.NOW_SHOWING) {
    return jsonResponse({ error: "NOW_SHOWING storage is not configured." }, 503);
  }

  const state = await readState(env);
  const entries = state.entries.filter((entry) => entry.id !== id);
  if (entries.length === state.entries.length) {
    return jsonResponse({ error: "Listing not found." }, 404);
  }

  const nextState = { version: 1, updatedAt: new Date().toISOString(), entries };
  await env.NOW_SHOWING.put(STATE_KEY, JSON.stringify(nextState));
  return jsonResponse(nextState);
}

async function searchTrailers(request, env) {
  if (!env.YOUTUBE_API_KEY) {
    return jsonResponse({
      error: "Trailer lookup is not configured yet. Set the YOUTUBE_API_KEY Worker secret."
    }, 503);
  }

  const body = await readJson(request);
  const title = cleanText(body?.title, 120);
  if (!title) {
    return jsonResponse({ error: "Enter a movie title first." }, 400);
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "6",
    regionCode: "CA",
    relevanceLanguage: "en",
    q: `${title} official trailer`,
    key: env.YOUTUBE_API_KEY
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  const data = await response.json();
  if (!response.ok) {
    return jsonResponse({
      error: data?.error?.message || "YouTube trailer lookup failed."
    }, 502);
  }

  const results = (Array.isArray(data.items) ? data.items : [])
    .filter((item) => item?.id?.videoId && item?.snippet)
    .map((item) => ({
      videoId: item.id.videoId,
      title: cleanText(item.snippet.title, 180),
      channelTitle: cleanText(item.snippet.channelTitle, 120),
      publishedAt: item.snippet.publishedAt || null,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || null
    }));

  return jsonResponse({ query: `${title} official trailer`, results });
}

async function readState(env) {
  if (!env.NOW_SHOWING) return EMPTY_STATE;
  const raw = await env.NOW_SHOWING.get(STATE_KEY);
  if (!raw) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.entries)) return EMPTY_STATE;
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      entries: parsed.entries.map((entry, index) => normalizeEntry(entry, index))
    };
  } catch {
    return EMPTY_STATE;
  }
}

async function readConfig(env) {
  if (!env.NOW_SHOWING) return { ...DEFAULT_CONFIG, updatedAt: null };
  const raw = await env.NOW_SHOWING.get(CONFIG_KEY);
  if (!raw) return { ...DEFAULT_CONFIG, updatedAt: null };

  try {
    const parsed = JSON.parse(raw);
    return {
      ...normalizeConfig(parsed),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null
    };
  } catch {
    return { ...DEFAULT_CONFIG, updatedAt: null };
  }
}

function normalizeEntry(input, index) {
  const title = cleanText(input?.title, 120);
  if (!title) throw new Error(`Listing ${index + 1} needs a movie title.`);

  const screen = input?.screen === "Screen 2" ? "Screen 2" : "Screen 1";
  const showtimes = Array.isArray(input?.showtimes)
    ? input.showtimes.map((time) => cleanText(time, 32)).filter(Boolean).slice(0, 16)
    : cleanText(input?.showtimes, 320).split(",").map((time) => time.trim()).filter(Boolean).slice(0, 16);
  const trailerId = cleanText(input?.trailerId, 32).match(/^[A-Za-z0-9_-]{6,20}$/)?.[0] || "";
  const trailerUrl = trailerId
    ? `https://www.youtube.com/watch?v=${trailerId}`
    : safeExternalUrl(input?.trailerUrl);

  return {
    id: cleanText(input?.id, 80) || `${slugify(screen)}-${slugify(title)}-${index + 1}`,
    screen,
    title,
    rating: cleanText(input?.rating, 16),
    runtime: cleanText(input?.runtime, 32),
    date: cleanText(input?.date, 32),
    showtimes,
    trailerId,
    trailerUrl,
    posterUrl: safeImageUrl(input?.posterUrl),
    notes: cleanText(input?.notes, 240)
  };
}

function normalizeConfig(input) {
  return {
    version: 1,
    movieLinePhone: cleanText(input?.movieLinePhone, 40) || DEFAULT_CONFIG.movieLinePhone,
    facebookUrl: safeFacebookUrl(input?.facebookUrl) || DEFAULT_CONFIG.facebookUrl,
    introCopy: cleanText(input?.introCopy, 240) || DEFAULT_CONFIG.introCopy,
    noticeTitle: cleanText(input?.noticeTitle, 120) || DEFAULT_CONFIG.noticeTitle,
    noticeBody: cleanText(input?.noticeBody, 240) || DEFAULT_CONFIG.noticeBody
  };
}

function cleanText(value, maxLength) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function slugify(value) {
  return cleanText(value, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "listing";
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && ["youtube.com", "www.youtube.com", "youtu.be"].includes(url.hostname)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function safeFacebookUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && ["facebook.com", "www.facebook.com"].includes(url.hostname)
      ? url.href.slice(0, 240)
      : "";
  } catch {
    return "";
  }
}

function safeImageUrl(value) {
  const raw = String(value || "").trim();
  if (raw.startsWith("/assets/")) return raw.slice(0, 240);
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname === "i.ytimg.com" ? url.href.slice(0, 240) : "";
  } catch {
    return "";
  }
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("Request body is too large.");
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("Request body is too large.");
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

async function hasValidSession(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const token = parseCookies(request.headers.get("Cookie") || "")[SESSION_COOKIE];
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const session = JSON.parse(decodeText(payload));
    if (!session.exp || Number(session.exp) < Date.now()) return false;
    return await verify(payload, signature, env.ADMIN_PASSWORD);
  } catch {
    return false;
  }
}

function parseCookies(header) {
  return header.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");
    if (index === -1) return cookies;
    cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    return cookies;
  }, {});
}

async function constantTimeEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)]);
  let difference = leftHash.length === rightHash.length ? 0 : 1;
  for (let index = 0; index < Math.max(leftHash.length, rightHash.length); index += 1) {
    difference |= (leftHash[index] || 0) ^ (rightHash[index] || 0);
  }
  return difference === 0;
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return bytesToBase64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

async function verify(value, signature, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, base64urlToBytes(signature), new TextEncoder().encode(value));
}

function encodeText(value) {
  return bytesToBase64url(new TextEncoder().encode(value));
}

function decodeText(value) {
  return new TextDecoder().decode(base64urlToBytes(value));
}

function bytesToBase64url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}
