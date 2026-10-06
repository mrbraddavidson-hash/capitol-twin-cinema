(() => {
  const $ = (selector) => document.querySelector(selector);
  const DEFAULT_CONFIG = {
    movieLinePhone: "(519) 291-6000",
    facebookUrl: "https://www.facebook.com/CapitolTwinCinema/",
    introCopy: "Movie titles and start times can change during the week. Use the movie line or Facebook before travelling.",
    noticeTitle: "Confirm today’s film and start time.",
    noticeBody: "Call the recorded movie line or check the theatre’s Facebook page for the latest update."
  };
  const state = {
    entries: [],
    trailerResults: [],
    movieResults: [],
    bulkMovieResults: { "Screen 1": [], "Screen 2": [] },
    editingId: "",
    config: { ...DEFAULT_CONFIG }
  };

  const loginView = $("#login-view");
  const appView = $("#app-view");
  const loginMessage = $("#login-message");
  const formMessage = $("#form-message");
  const statusMessage = $("#admin-status");
  const configMessage = $("#config-message");

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
      setConnectionStatus("#status-movie", status.movieSearchConfigured);
      setConnectionStatus("#status-trailer", status.trailerSearchConfigured);
      const messages = [];
      messages.push(status.movieSearchConfigured
        ? "Movie data lookup is ready."
        : "Movie data lookup needs the TMDB_API_KEY Worker secret.");
      messages.push(status.trailerSearchConfigured
        ? "Trailer lookup is ready."
        : "Trailer lookup needs the YOUTUBE_API_KEY Worker secret.");
      statusMessage.textContent = messages.join(" ");
    } catch (error) {
      statusMessage.textContent = error.message;
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

  function movieResultListSelector(screen) {
    return screen === "Screen 2" ? "#screen2-movie-results" : "#screen1-movie-results";
  }

  function updateMovieDetailsPanel(details, fallbackTitle = "") {
    const title = details.title || fallbackTitle;
    const release = details.releaseDate ? `Released ${details.releaseDate}` : "";
    const summary = [
      release,
      details.rating ? `Rating ${details.rating}` : "",
      details.runtime ? `Runtime ${details.runtime}` : ""
    ].filter(Boolean).join(" • ");

    $("#tmdb-id").value = details.id ? String(details.id) : "";
    $("#title").value = title;
    $("#date").value = release;
    $("#rating").value = details.rating || "";
    $("#runtime").value = details.runtime || "";
    $("#overview").value = details.overview || "";

    const panel = $("#movie-details");
    panel.hidden = !summary && !details.overview;
    $("#movie-details-summary").textContent = summary || "TMDB details loaded. Review the description before publishing.";

    const sourceLink = $("#movie-source-link");
    if (details.sourceUrl) {
      sourceLink.href = details.sourceUrl;
      sourceLink.hidden = false;
    } else {
      sourceLink.removeAttribute("href");
      sourceLink.hidden = true;
    }

    const optional = document.querySelector(".admin-optional");
    if (optional) optional.open = true;
  }

  function clearMovieDetailsPanel() {
    $("#tmdb-id").value = "";
    $("#movie-details").hidden = true;
    $("#movie-details-summary").textContent = "Choose a movie result to load its release information.";
    const sourceLink = $("#movie-source-link");
    sourceLink.removeAttribute("href");
    sourceLink.hidden = true;
  }

  function renderMovieResults(results) {
    state.movieResults = results;
    const list = $("#movie-results");
    if (!results.length) {
      list.replaceChildren();
      return;
    }
    list.innerHTML = results.map((result, index) => `<button type="button" class="movie-result" data-movie-index="${index}">
      <strong>${escapeHtml(result.title)}</strong>
      <span>${escapeHtml(result.releaseDate || "Release date unavailable")}${result.overview ? ` · ${escapeHtml(result.overview)}` : ""}</span>
    </button>`).join("");
    list.querySelectorAll("[data-movie-index]").forEach((button) => {
      button.addEventListener("click", () => selectMovie(Number(button.dataset.movieIndex)));
    });
  }

  function renderBulkMovieResults(screen, results) {
    state.bulkMovieResults[screen] = results;
    const list = $(movieResultListSelector(screen));
    if (!results.length) {
      list.replaceChildren();
      return;
    }
    list.innerHTML = results.map((result, index) => `<button type="button" class="movie-result" data-bulk-screen="${escapeHtml(screen)}" data-bulk-movie-index="${index}">
      <strong>${escapeHtml(result.title)}</strong>
      <span>${escapeHtml(result.releaseDate || "Release date unavailable")}${result.overview ? ` · ${escapeHtml(result.overview)}` : ""}</span>
    </button>`).join("");
    list.querySelectorAll("[data-bulk-movie-index]").forEach((button) => {
      button.addEventListener("click", () => selectBulkMovie(button.dataset.bulkScreen, Number(button.dataset.bulkMovieIndex)));
    });
  }

  async function findMovie() {
    const title = $("#title").value.trim();
    if (!title) {
      setMessage(formMessage, "Enter a movie title before searching.");
      $("#title").focus();
      return;
    }

    const button = $("#find-movie");
    button.disabled = true;
    button.textContent = "Searching movie data…";
    try {
      const data = await api("/api/admin/movie-search", {
        method: "POST",
        body: JSON.stringify({ title })
      });
      renderMovieResults(data.results || []);
      setMessage(formMessage, data.results?.length ? "Choose the matching movie to fill its release data." : "No movie matches found.", !data.results?.length);
    } catch (error) {
      setMessage(formMessage, error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Find movie data';
    }
  }

  async function selectMovie(index) {
    const result = state.movieResults[index];
    if (!result) return;
    const button = $("#find-movie");
    button.disabled = true;
    setMessage(formMessage, `Loading ${result.title}…`, false);
    try {
      const details = await api("/api/admin/movie-details", {
        method: "POST",
        body: JSON.stringify({ tmdbId: result.id })
      });
      updateMovieDetailsPanel(details, result.title);
      renderMovieResults([]);
      setMessage(formMessage, `${details.title || result.title} details filled. Add showtimes, then publish.`, false);
    } catch (error) {
      setMessage(formMessage, error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Find movie data';
    }
  }

  async function findBothMovies() {
    const titles = {
      "Screen 1": $("#screen1-search-title").value.trim(),
      "Screen 2": $("#screen2-search-title").value.trim()
    };
    if (!titles["Screen 1"] || !titles["Screen 2"]) {
      setMessage($("#bulk-movie-message"), "Enter a movie title for both Screen 1 and Screen 2.");
      return;
    }

    const button = $("#find-both-movies");
    button.disabled = true;
    button.textContent = "Searching both screens…";
    setMessage($("#bulk-movie-message"), "Searching TMDB for both movies…", false);
    try {
      const results = await Promise.all(Object.entries(titles).map(async ([screen, title]) => {
        const data = await api("/api/admin/movie-search", {
          method: "POST",
          body: JSON.stringify({ title })
        });
        return [screen, data.results || []];
      }));
      results.forEach(([screen, matches]) => renderBulkMovieResults(screen, matches));
      const total = results.reduce((count, [, matches]) => count + matches.length, 0);
      setMessage($("#bulk-movie-message"), total ? "Choose a matching result. It will load into the listing form for that screen." : "No movie matches found for either screen.", !total);
    } catch (error) {
      setMessage($("#bulk-movie-message"), error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Find both movies';
    }
  }

  async function selectBulkMovie(screen, index) {
    const result = state.bulkMovieResults[screen]?.[index];
    if (!result) return;
    const button = $("#find-both-movies");
    button.disabled = true;
    setMessage($("#bulk-movie-message"), `Loading ${result.title} for ${screen}…`, false);
    try {
      const details = await api("/api/admin/movie-details", {
        method: "POST",
        body: JSON.stringify({ tmdbId: result.id })
      });
      $("#screen").value = screen;
      updateMovieDetailsPanel(details, result.title);
      renderBulkMovieResults(screen, []);
      $("#two-screen-search").open = false;
      setMessage(formMessage, `${details.title || result.title} loaded for ${screen}. Add showtimes, then publish.`, false);
    } catch (error) {
      setMessage($("#bulk-movie-message"), error.message);
    } finally {
      button.disabled = false;
      button.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Find both movies';
    }
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
        ${entry.overview ? `<p class="published-entry-overview">${escapeHtml(entry.overview)}</p>` : ""}
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
    $("#movie-results").replaceChildren();
    $("#screen1-search-title").value = "";
    $("#screen2-search-title").value = "";
    $("#bulk-movie-message").textContent = "";
    $("#two-screen-search").open = false;
    state.trailerResults = [];
    state.movieResults = [];
    renderBulkMovieResults("Screen 1", []);
    renderBulkMovieResults("Screen 2", []);
    clearMovieDetailsPanel();
    state.editingId = "";
    setMessage(formMessage, "", true);
  }

  function addShowtime() {
    const value = $("#showtime-preset").value.trim();
    if (!value) return;
    const current = $("#showtimes").value.split(",").map((time) => time.trim()).filter(Boolean);
    if (!current.some((time) => time.toLowerCase() === value.toLowerCase())) current.push(value);
    $("#showtimes").value = current.join(", ");
    $("#showtime-preset").value = "";
    $("#showtimes").focus();
    setMessage(formMessage, `${value} added.`, false);
  }

  function editEntry(id) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry) return;
    state.editingId = id;
    $("#entry-id").value = entry.id;
    $("#screen").value = entry.screen;
    $("#date").value = entry.date || "";
    $("#title").value = entry.title || "";
    $("#tmdb-id").value = entry.tmdbId ? String(entry.tmdbId) : "";
    $("#rating").value = entry.rating || "";
    $("#runtime").value = entry.runtime || "";
    $("#overview").value = entry.overview || "";
    $("#showtimes").value = (entry.showtimes || []).join(", ");
    $("#trailer-id").value = entry.trailerId || "";
    $("#trailer-url").value = entry.trailerUrl || "";
    $("#poster-url").value = entry.posterUrl || "";
    $("#notes").value = entry.notes || "";
    const savedDetails = Boolean(entry.tmdbId || entry.overview || entry.rating || entry.runtime);
    $("#movie-details").hidden = !savedDetails;
    $("#movie-details-summary").textContent = [
      entry.date,
      entry.rating ? `Rating ${entry.rating}` : "",
      entry.runtime ? `Runtime ${entry.runtime}` : ""
    ].filter(Boolean).join(" • ") || "Saved movie details.";
    const sourceLink = $("#movie-source-link");
    if (entry.tmdbId) {
      sourceLink.href = `https://www.themoviedb.org/movie/${encodeURIComponent(entry.tmdbId)}`;
      sourceLink.hidden = false;
    } else {
      sourceLink.removeAttribute("href");
      sourceLink.hidden = true;
    }
    const optional = document.querySelector(".admin-optional");
    if (optional && savedDetails) optional.open = true;
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
      tmdbId: Number($("#tmdb-id").value) || null,
      rating: $("#rating").value.trim(),
      runtime: $("#runtime").value.trim(),
      overview: $("#overview").value.trim(),
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
  $("#find-movie").addEventListener("click", findMovie);
  $("#find-both-movies").addEventListener("click", findBothMovies);
  $("#find-trailer").addEventListener("click", findTrailer);
  $("#add-showtime").addEventListener("click", addShowtime);
  $("#reset-form").addEventListener("click", resetForm);
  $("#config-form").addEventListener("submit", saveConfig);
  $("#reset-config").addEventListener("click", resetConfig);
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
