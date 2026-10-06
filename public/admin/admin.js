(() => {
  const $ = (selector) => document.querySelector(selector);
  const DEFAULT_CONFIG = {
    movieLinePhone: "(519) 291-6000",
    facebookUrl: "https://www.facebook.com/CapitolTwinCinema/",
    introCopy: "Movie titles and start times can change during the week. Use the movie line or Facebook before travelling.",
    noticeTitle: "Confirm today’s film and start time.",
    noticeBody: "Call the recorded movie line or check the theatre’s Facebook page for the latest update."
  };
  const state = { entries: [], trailerResults: [], editingId: "", config: { ...DEFAULT_CONFIG } };

  const loginView = $("#login-view");
  const appView = $("#app-view");
  const loginMessage = $("#login-message");
  const formMessage = $("#form-message");
  const statusMessage = $("#admin-status");
  const configMessage = $("#config-message");
  const facebookMessage = $("#facebook-message");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function setMessage(element, message, isError = true) {
    element.textContent = message || "";
    element.classList.toggle("is-success", Boolean(message) && !isError);
  }

  function showApp(data) {
    loginView.hidden = true;
    appView.hidden = false;
    state.entries = Array.isArray(data.entries) ? data.entries : [];
    renderEntries();
    loadAdminStatus();
    loadConfig();
    loadFacebookStatus();
    showFacebookQueryMessage();
  }

  function showLogin(message = "") {
    loginView.hidden = false;
    appView.hidden = true;
    setMessage(loginMessage, message, Boolean(message));
  }

  async function loadAdminStatus() {
    try {
      const status = await api("/api/admin/status", { method: "GET", headers: {} });
      setConnectionStatus("#status-storage", status.storageConfigured);
      setConnectionStatus("#status-password", status.adminPasswordConfigured);
      setConnectionStatus("#status-trailer", status.trailerSearchConfigured);
      statusMessage.textContent = status.trailerSearchConfigured
        ? "Trailer lookup is ready. Select an official result before publishing."
        : "Listings storage is ready. Trailer lookup needs the YOUTUBE_API_KEY Worker secret before it can search YouTube.";
    } catch (error) {
      statusMessage.textContent = error.message;
    }
  }

  async function loadFacebookStatus() {
    try {
      const status = await api("/api/admin/facebook/status", { method: "GET", headers: {} });
      const badge = $("#status-facebook");
      const pageName = $("#facebook-page-name");
      const connect = $("#connect-facebook");
      const refresh = $("#refresh-facebook");
      const disconnect = $("#disconnect-facebook");
      const redirectHelp = $("#facebook-redirect-help");

      badge.textContent = !status.configured ? "Needs Meta setup" : status.connected ? "Connected" : "Not connected";
      badge.dataset.ready = status.connected ? "true" : "false";
      pageName.textContent = status.connected ? `Connected Page: ${status.pageName}` : "";
      connect.disabled = !status.configured;
      refresh.disabled = !status.connected;
      disconnect.hidden = !status.connected;
      redirectHelp.textContent = status.configured
        ? `Meta callback URL: ${status.redirectUri}`
        : "Add META_APP_ID and META_APP_SECRET in Worker secrets, then reload this panel.";
    } catch (error) {
      setMessage(facebookMessage, error.message);
    }
  }

  function showFacebookQueryMessage() {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("facebook");
    if (result === "connected") {
      setMessage(facebookMessage, "Facebook Page connected. Check the latest posts when you are ready.", false);
    } else if (result === "error") {
      setMessage(facebookMessage, params.get("message") || "Facebook connection failed.");
    }
    if (result) window.history.replaceState({}, "", "/admin/");
  }

  async function connectFacebook() {
    const button = $("#connect-facebook");
    button.disabled = true;
    button.textContent = "Opening Facebook…";
    try {
      const data = await api("/api/admin/facebook/start", { method: "GET", headers: {} });
      window.location.assign(data.url);
    } catch (error) {
      setMessage(facebookMessage, error.message);
      button.disabled = false;
      button.textContent = "Connect Facebook";
    }
  }

  function renderFacebookPosts(posts) {
    const list = $("#facebook-posts");
    if (!posts.length) {
      list.innerHTML = '<p class="admin-help">No recent Page posts were returned.</p>';
      return;
    }
    list.innerHTML = posts.map((post) => {
      const date = post.createdAt ? new Date(post.createdAt).toLocaleString() : "Date unavailable";
      const message = post.message || "This post has no text. Open it on Facebook to review the media.";
      const link = post.permalinkUrl
        ? `<a href="${escapeHtml(post.permalinkUrl)}" target="_blank" rel="noopener noreferrer">Open Facebook post <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
        : "";
      return `<article class="facebook-post">
        <time datetime="${escapeHtml(post.createdAt || "")}">${escapeHtml(date)}</time>
        <p>${escapeHtml(message)}</p>
        ${link}
      </article>`;
    }).join("");
  }

  async function loadFacebookPosts() {
    const button = $("#refresh-facebook");
    button.disabled = true;
    button.textContent = "Checking Facebook…";
    try {
      const data = await api("/api/admin/facebook/posts", { method: "GET", headers: {} });
      renderFacebookPosts(data.posts || []);
      setMessage(facebookMessage, `Loaded ${data.posts?.length || 0} recent posts from ${data.pageName}.`, false);
    } catch (error) {
      setMessage(facebookMessage, error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Check latest posts";
    }
  }

  async function disconnectFacebook() {
    if (!window.confirm("Disconnect the saved Facebook Page from this admin panel?")) return;
    try {
      await api("/api/admin/facebook/disconnect", { method: "POST" });
      $("#facebook-posts").replaceChildren();
      setMessage(facebookMessage, "Facebook Page disconnected from this site.", false);
      await loadFacebookStatus();
    } catch (error) {
      setMessage(facebookMessage, error.message);
    }
  }

  function setConnectionStatus(selector, ready) {
    const element = $(selector);
    if (!element) return;
    element.textContent = ready ? "Ready" : "Needs setup";
    element.dataset.ready = ready ? "true" : "false";
  }

  function fillConfig(config) {
    state.config = { ...DEFAULT_CONFIG, ...config };
    $("#config-phone").value = state.config.movieLinePhone;
    $("#config-facebook").value = state.config.facebookUrl;
    $("#config-intro").value = state.config.introCopy;
    $("#config-notice-title").value = state.config.noticeTitle;
    $("#config-notice-body").value = state.config.noticeBody;
    $("#config-updated-at").textContent = config.updatedAt ? `Saved ${new Date(config.updatedAt).toLocaleString()}` : "Using defaults";
  }

  async function loadConfig() {
    try {
      fillConfig(await api("/api/admin/config", { method: "GET", headers: {} }));
    } catch (error) {
      setMessage(configMessage, error.message);
    }
  }

  async function saveConfig(event) {
    event.preventDefault();
    const config = {
      movieLinePhone: $("#config-phone").value.trim(),
      facebookUrl: $("#config-facebook").value.trim(),
      introCopy: $("#config-intro").value.trim(),
      noticeTitle: $("#config-notice-title").value.trim(),
      noticeBody: $("#config-notice-body").value.trim()
    };
    if (!config.movieLinePhone || !config.facebookUrl || !config.introCopy || !config.noticeTitle || !config.noticeBody) {
      setMessage(configMessage, "Complete every public settings field before saving.");
      return;
    }

    const button = $("#config-form button[type=submit]");
    button.disabled = true;
    try {
      const data = await api("/api/admin/config", {
        method: "POST",
        body: JSON.stringify({ config })
      });
      fillConfig(data);
      setMessage(configMessage, "Public settings saved. Refresh the public site to see the update.", false);
    } catch (error) {
      setMessage(configMessage, error.message);
    } finally {
      button.disabled = false;
    }
  }

  function resetConfig() {
    fillConfig(DEFAULT_CONFIG);
    setMessage(configMessage, "Form reset to the default theatre settings.", false);
  }

  async function copyCommand(button) {
    const command = button.dataset.copyCommand;
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = original; }, 1400);
    } catch {
      setMessage(configMessage, "Copy was blocked by the browser. Select the command manually.");
    }
  }

  function renderEntries() {
    const list = $("#published-list");
    const empty = $("#published-empty");
    const updatedAt = $("#updated-at");
    empty.hidden = state.entries.length > 0;
    updatedAt.textContent = state.entries.length ? "Published now" : "";
    list.innerHTML = state.entries.map((entry) => {
      const times = entry.showtimes?.length ? entry.showtimes.join(" • ") : "No times entered";
      const trailer = entry.trailerId ? "Trailer selected" : "No trailer selected";
      return `<article class="published-entry">
        <h3>${escapeHtml(entry.title)}</h3>
        <p><strong>${escapeHtml(entry.screen)}</strong>${entry.date ? ` · ${escapeHtml(entry.date)}` : ""}</p>
        <p>${escapeHtml(times)}</p>
        <p>${escapeHtml([entry.rating, entry.runtime, trailer].filter(Boolean).join(" · "))}</p>
        <div class="published-entry-actions">
          <button class="admin-text-button" type="button" data-edit="${escapeHtml(entry.id)}">Edit</button>
          <button class="admin-text-button" type="button" data-delete="${escapeHtml(entry.id)}">Remove</button>
        </div>
      </article>`;
    }).join("");

    list.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => editEntry(button.dataset.edit));
    });
    list.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => removeEntry(button.dataset.delete));
    });
  }

  function resetForm() {
    $("#movie-form").reset();
    $("#screen").value = "Screen 1";
    $("#entry-id").value = "";
    $("#trailer-id").value = "";
    $("#trailer-results").replaceChildren();
    state.trailerResults = [];
    state.editingId = "";
    setMessage(formMessage, "", true);
  }

  function editEntry(id) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry) return;
    state.editingId = id;
    $("#entry-id").value = entry.id;
    $("#screen").value = entry.screen;
    $("#date").value = entry.date || "";
    $("#title").value = entry.title || "";
    $("#rating").value = entry.rating || "";
    $("#runtime").value = entry.runtime || "";
    $("#showtimes").value = (entry.showtimes || []).join(", ");
    $("#trailer-id").value = entry.trailerId || "";
    $("#trailer-url").value = entry.trailerUrl || "";
    $("#poster-url").value = entry.posterUrl || "";
    $("#notes").value = entry.notes || "";
    setMessage(formMessage, `Editing ${entry.title}. Publish when ready.`, false);
    $("#title").focus();
  }

  async function removeEntry(id) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry || !window.confirm(`Remove ${entry.title} from Now Showing?`)) return;
    try {
      const data = await api(`/api/admin/showtimes/${encodeURIComponent(id)}`, { method: "DELETE" });
      state.entries = data.entries || [];
      renderEntries();
      setMessage(formMessage, "Listing removed.", false);
    } catch (error) {
      setMessage(formMessage, error.message);
    }
  }

  function renderTrailerResults(results) {
    state.trailerResults = results;
    $("#trailer-results").innerHTML = results.length
      ? results.map((result, index) => `<button type="button" class="trailer-result" data-trailer-index="${index}" aria-pressed="false">
          ${result.thumbnail ? `<img src="${escapeHtml(result.thumbnail)}" alt="">` : "<span></span>"}
          <span><strong>${escapeHtml(result.title)}</strong><span>${escapeHtml(result.channelTitle || "YouTube")}</span></span>
        </button>`).join("")
      : "<p class=\"admin-help\">No trailer matches found. Try the full title or paste a YouTube URL.</p>";

    $("#trailer-results").querySelectorAll("[data-trailer-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = state.trailerResults[Number(button.dataset.trailerIndex)];
        if (!result) return;
        $("#trailer-id").value = result.videoId;
        $("#trailer-url").value = `https://www.youtube.com/watch?v=${result.videoId}`;
        if (result.thumbnail) $("#poster-url").value = result.thumbnail;
        $("#trailer-results").querySelectorAll("[data-trailer-index]").forEach((item) => item.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");
        setMessage(formMessage, `Selected ${result.title}`, false);
      });
    });
  }

  async function findTrailer() {
    const title = $("#title").value.trim();
    if (!title) {
      setMessage(formMessage, "Enter a movie title before searching.");
      $("#title").focus();
      return;
    }

    const button = $("#find-trailer");
    button.disabled = true;
    button.textContent = "Searching YouTube…";
    try {
      const data = await api("/api/admin/trailer-search", {
        method: "POST",
        body: JSON.stringify({ title })
      });
      renderTrailerResults(data.results || []);
      setMessage(formMessage, data.results?.length ? "Select the official trailer match to attach it." : "No trailer matches found.", !data.results?.length);
    } catch (error) {
      setMessage(formMessage, error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fa-brands fa-youtube"></i> Find official trailer';
    }
  }

  async function publish(event) {
    event.preventDefault();
    const entry = {
      id: $("#entry-id").value.trim(),
      screen: $("#screen").value,
      date: $("#date").value.trim(),
      title: $("#title").value.trim(),
      rating: $("#rating").value.trim(),
      runtime: $("#runtime").value.trim(),
      showtimes: $("#showtimes").value.split(",").map((time) => time.trim()).filter(Boolean),
      trailerId: $("#trailer-id").value.trim(),
      trailerUrl: $("#trailer-url").value.trim(),
      posterUrl: $("#poster-url").value.trim(),
      notes: $("#notes").value.trim()
    };
    if (!entry.title || !entry.showtimes.length) {
      setMessage(formMessage, "Add a movie title and at least one showtime.");
      return;
    }

    const nextEntries = state.entries.filter((item) => item.id !== state.editingId && item.id !== entry.id);
    nextEntries.push(entry);
    try {
      const data = await api("/api/admin/showtimes", {
        method: "POST",
        body: JSON.stringify({ entries: nextEntries })
      });
      state.entries = data.entries || [];
      renderEntries();
      resetForm();
      setMessage(formMessage, "Published. The public Now Showing section will update shortly.", false);
    } catch (error) {
      setMessage(formMessage, error.message);
    }
  }

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(loginMessage, "Signing in…", false);
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: $("#admin-password").value })
      });
      $("#admin-password").value = "";
      showApp(await api("/api/admin/showtimes", { method: "GET", headers: {} }));
    } catch (error) {
      setMessage(loginMessage, error.message);
    }
  });

  $("#logout-button").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    showLogin("Signed out.");
  });

  $("#movie-form").addEventListener("submit", publish);
  $("#find-trailer").addEventListener("click", findTrailer);
  $("#reset-form").addEventListener("click", resetForm);
  $("#config-form").addEventListener("submit", saveConfig);
  $("#reset-config").addEventListener("click", resetConfig);
  $("#connect-facebook").addEventListener("click", connectFacebook);
  $("#refresh-facebook").addEventListener("click", loadFacebookPosts);
  $("#disconnect-facebook").addEventListener("click", disconnectFacebook);
  document.querySelectorAll("[data-copy-command]").forEach((button) => {
    button.addEventListener("click", () => copyCommand(button));
  });

  api("/api/admin/showtimes", { method: "GET", headers: {} })
    .then(showApp)
    .catch((error) => {
      if (error.status === 401) showLogin();
      else showLogin(error.message);
    });
})();
