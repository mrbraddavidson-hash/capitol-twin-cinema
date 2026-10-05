(function () {
  const fallbackImage = {
    "Screen 1": "/assets/screen1-generic.jpg",
    "Screen 2": "/assets/screen2-generic.jpg"
  };

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

  function renderEntry(entry, index) {
    const screen = entry.screen === "Screen 2" ? "Screen 2" : "Screen 1";
    const image = escapeHtml(safeImage(entry.posterUrl, screen));
    const title = escapeHtml(entry.title);
    const details = [entry.rating, entry.runtime].filter(Boolean).join(" • ");
    const schedule = entry.showtimes?.length ? entry.showtimes.join(" • ") : "Call the movie line for today’s times.";
    const trailer = entry.trailerId
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(entry.trailerId)}`
      : entry.trailerUrl || "";
    const trailerLink = trailer
      ? `<a class="showtime-card-link" href="${escapeHtml(trailer)}" target="_blank" rel="noopener noreferrer">Watch trailer <i class="fa-brands fa-youtube"></i></a>`
      : `<a class="showtime-card-link" href="tel:5192916000">Call for showtimes <i class="fa-solid fa-arrow-right"></i></a>`;

    return `<article class="showtime-card ${index % 2 ? "showtime-card--gold" : "showtime-card--ruby"}">
      <div class="showtime-card-media">
        <img src="${image}" alt="${title} reference image for ${screen}" width="1600" height="900" loading="lazy" decoding="async" class="showtime-card-image" onerror="this.src='${fallbackImage[screen]}'">
        <span class="showtime-card-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
        <span class="showtime-card-caption">${escapeHtml(screen)}</span>
      </div>
      <div class="showtime-card-content">
        <div class="showtime-card-meta"><span>${escapeHtml(screen)}</span><span><i class="fa-solid fa-film"></i> ${escapeHtml(details || "Current listing")}</span></div>
        <h3>${title}</h3>
        <p class="showtime-card-schedule">${escapeHtml(schedule)}</p>
        ${entry.notes ? `<p class="showtime-card-note">${escapeHtml(entry.notes)}</p>` : ""}
        ${trailerLink}
      </div>
    </article>`;
  }

  async function loadShowtimes() {
    const grid = document.getElementById("showtimes-grid");
    if (!grid) return;

    try {
      const response = await fetch("/api/showtimes", { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.entries) || data.entries.length === 0) return;

      grid.innerHTML = data.entries.map(renderEntry).join("");
      const copy = document.querySelector(".showtimes-intro-copy");
      if (copy) copy.textContent = "Current films and showtimes are maintained by the theatre team. Call before travelling for last-minute changes.";
      const notice = document.querySelector(".showtimes-notice-copy p");
      if (notice) notice.textContent = "The listings below are the latest published update. Call the movie line to confirm before travelling.";
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
