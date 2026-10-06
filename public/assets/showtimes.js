(function () {
  const defaultConfig = {
    movieLinePhone: "(519) 291-6000",
    facebookUrl: "https://www.facebook.com/CapitolTwinCinema/",
    introCopy: "Movie titles and start times can change during the week. Use the movie line or Facebook before travelling.",
    noticeTitle: "Confirm today’s film and start time.",
    noticeBody: "Call the recorded movie line or check the theatre’s Facebook page for the latest update."
  };

  let currentConfig = normalizeConfig(defaultConfig);
  const fallbackImage = {
    "Screen 1": "/assets/screen1-generic.jpg",
    "Screen 2": "/assets/screen2-generic.jpg"
  };
  const screenOrder = ["Screen 1", "Screen 2"];

  function fallbackEntry(screen) {
    if (screen === "Screen 2") {
      return {
        screen,
        title: "Facebook updates",
        rating: "Digital",
        runtime: "Dolby 5.1",
        fallbackCopy: "Check the theatre’s Facebook page for the current film and schedule, then call to confirm before travelling.",
        fallbackAction: "facebook"
      };
    }

    return {
      screen,
      title: "Movie line schedule",
      rating: "Digital",
      runtime: "Dolby 5.1",
      fallbackCopy: "Call the theatre’s recorded line for the current film, rating, running time and showtimes.",
      fallbackAction: "phone"
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeImage(value, screen) {
    const image = String(value || "").trim();
    if (image.startsWith("/assets/") || image.startsWith("https://")) return image;
    return fallbackImage[screen] || fallbackImage["Screen 1"];
  }

  function trailerIdFor(entry) {
    const directId = String(entry?.trailerId || "").trim();
    if (/^[A-Za-z0-9_-]{6,20}$/.test(directId)) return directId;

    try {
      const url = new URL(String(entry?.trailerUrl || ""));
      if (!["youtube.com", "www.youtube.com", "youtu.be"].includes(url.hostname)) return "";
      const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") || "";
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : "";
    } catch {
      return "";
    }
  }

  function trailerPreviewUrl(entry, trailerId, screen) {
    const poster = String(entry?.posterUrl || "").trim();
    if (poster.startsWith("/assets/") || poster.startsWith("https://")) return poster;
    return `https://i.ytimg.com/vi/${encodeURIComponent(trailerId)}/hqdefault.jpg`;
  }

  function activateTrailer(button) {
    const trailerId = button.dataset.trailerId;
    const title = button.dataset.trailerTitle || "Movie";
    const preview = button.closest(".showtime-card-trailer-preview");
    if (!preview || !/^[A-Za-z0-9_-]{6,20}$/.test(trailerId || "")) return;
    preview.outerHTML = `<div class="showtime-card-trailer-frame">
      <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerId)}?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="${escapeHtml(title)} official trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>`;
  }

  function bindTrailerPreviews(scope) {
    scope.querySelectorAll("[data-trailer-id]").forEach((button) => {
      button.addEventListener("click", () => activateTrailer(button));
    });
  }

  function renderEntry(entry, index) {
    const screen = entry.screen === "Screen 2" ? "Screen 2" : "Screen 1";
    const title = escapeHtml(entry.title);
    const details = [entry.date, entry.rating, entry.runtime].filter(Boolean).join(" • ");
    const trailerId = trailerIdFor(entry);
    const media = trailerId
      ? `<div class="showtime-card-media showtime-card-media--trailer">
        <div class="showtime-card-trailer-preview">
          <img src="${escapeHtml(trailerPreviewUrl(entry, trailerId, screen))}" alt="${title} official trailer preview" loading="lazy" decoding="async">
          <button type="button" class="showtime-card-trailer-play" data-trailer-id="${escapeHtml(trailerId)}" data-trailer-title="${title}" aria-label="Play ${title} trailer"><i class="fa-solid fa-play"></i><span>Play trailer</span></button>
        </div>
        <span class="showtime-card-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <span class="showtime-card-caption">Official trailer</span>
      </div>`
      : `<div class="showtime-card-media">
        <img src="${escapeHtml(safeImage(entry.posterUrl, screen))}" alt="${title} reference image for ${screen}" width="1600" height="900" loading="lazy" decoding="async" class="showtime-card-image" onerror="this.src='${fallbackImage[screen]}'">
        <span class="showtime-card-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <span class="showtime-card-caption">${escapeHtml(screen)}</span>
      </div>`;
    const schedule = entry.showtimes?.length ? entry.showtimes.join(" • ") : "Call the movie line for today’s times.";
    const trailer = trailerId
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailerId)}`
      : entry.trailerUrl || "";
    const fallbackLink = entry.fallbackAction === "facebook"
      ? `<a class="showtime-card-link" href="${escapeHtml(currentConfig.facebookUrl)}" target="_blank" rel="noopener noreferrer">Open Facebook updates <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : `<a class="showtime-card-link" href="${escapeHtml(currentConfig.phoneHref)}">Call for Screen ${screen === "Screen 2" ? "2" : "1"} <i class="fa-solid fa-arrow-right"></i></a>`;
    const trailerLink = trailer
      ? `<a class="showtime-card-link" href="${escapeHtml(trailer)}" target="_blank" rel="noopener noreferrer">Open trailer on YouTube <i class="fa-brands fa-youtube"></i></a>`
      : entry.fallbackAction ? fallbackLink : `<a class="showtime-card-link" href="${escapeHtml(currentConfig.phoneHref)}">Call for showtimes <i class="fa-solid fa-arrow-right"></i></a>`;
    const bodyCopy = entry.fallbackCopy || schedule;
    const overview = entry.overview
      ? `<p class="showtime-card-overview">${escapeHtml(entry.overview)}</p>`
      : "";

    return `<article class="showtime-card ${index % 2 ? "showtime-card--gold" : "showtime-card--ruby"}">
      ${media}
      <div class="showtime-card-content">
        <div class="showtime-card-meta"><span>${escapeHtml(screen)}</span><span><i class="fa-solid fa-film"></i> ${escapeHtml(details || "Current listing")}</span></div>
        <h3>${title}</h3>
        <p class="showtime-card-schedule">${escapeHtml(bodyCopy)}</p>
        ${overview}
        ${entry.fallbackCopy ? "" : (entry.notes ? `<p class="showtime-card-note">${escapeHtml(entry.notes)}</p>` : "")}
        ${trailerLink}
      </div>
    </article>`;
  }

  function normalizeConfig(value) {
    const phone = String(value?.movieLinePhone || defaultConfig.movieLinePhone).trim() || defaultConfig.movieLinePhone;
    const digits = phone.replace(/\D/g, "");
    const facebookUrl = safeFacebookUrl(value?.facebookUrl) || defaultConfig.facebookUrl;
    return {
      movieLinePhone: phone,
      phoneHref: digits ? `tel:${digits}` : "tel:5192916000",
      facebookUrl,
      introCopy: String(value?.introCopy || defaultConfig.introCopy).trim() || defaultConfig.introCopy,
      noticeTitle: String(value?.noticeTitle || defaultConfig.noticeTitle).trim() || defaultConfig.noticeTitle,
      noticeBody: String(value?.noticeBody || defaultConfig.noticeBody).trim() || defaultConfig.noticeBody
    };
  }

  function safeFacebookUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" && ["facebook.com", "www.facebook.com"].includes(url.hostname)
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function applyConfig(value) {
    currentConfig = normalizeConfig(value);
    const intro = document.querySelector(".showtimes-intro-copy");
    const noticeTitle = document.querySelector(".showtimes-notice-copy strong");
    const noticeBody = document.querySelector(".showtimes-notice-copy p");
    if (intro) intro.textContent = currentConfig.introCopy;
    if (noticeTitle) noticeTitle.textContent = currentConfig.noticeTitle;
    if (noticeBody) noticeBody.textContent = currentConfig.noticeBody;
    document.querySelectorAll("[data-showtimes-phone]").forEach((link) => {
      link.href = currentConfig.phoneHref;
    });
    document.querySelectorAll("[data-showtimes-phone-label]").forEach((label) => {
      label.textContent = currentConfig.movieLinePhone;
    });
    document.querySelectorAll("[data-showtimes-facebook]").forEach((link) => {
      link.href = currentConfig.facebookUrl;
    });
  }

  async function loadConfig() {
    try {
      const response = await fetch("/api/site-config", { headers: { Accept: "application/json" } });
      if (response.ok) applyConfig(await response.json());
    } catch {
      // Static copy remains visible when configuration is unavailable.
    }
  }

  async function loadShowtimes() {
    const grid = document.getElementById("showtimes-grid");
    if (!grid) return;

    await loadConfig();
    try {
      const response = await fetch("/api/showtimes", { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.entries) || data.entries.length === 0) return;

      const entries = screenOrder.map((screen) => data.entries.find((entry) => entry.screen === screen) || fallbackEntry(screen));
      grid.innerHTML = entries.map(renderEntry).join("");
      bindTrailerPreviews(grid);
    } catch {
      // The static movie-line/Facebook fallback remains visible when the feed is unavailable.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadShowtimes, { once: true });
  } else {
    loadShowtimes();
  }
})();
