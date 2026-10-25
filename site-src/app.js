(function () {
  "use strict";
  const REPO = "brianerdelyi/tpam";
  const ORDER = ["Downtown - Business Core", "Downtown - Midtown", "Downtown - West", "Downtown - East", "Downtown - South & Waterfront"];
  const el = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const layerName = (l) => (l || "").replace(/^Layer \d+\s*[–-]\s*/, "");
  const known = (a) => a && !/^not consistently documented$/i.test(a.trim());

  Promise.all([
    fetch("artworks.json").then((r) => r.json()),
    fetch("zones.json").then((r) => r.json()),
    fetch("config.json").then((r) => r.json()).catch(() => ({}))
  ]).then(([works, zdata, cfg]) => init(works, zdata, cfg))
    .catch((e) => { el("zones").textContent = "Could not load the data: " + e.message; });

  function init(works, zdata, cfg) {
    // map: embedded Google My Map
    const url = cfg.my_maps_embed_url || "";
    if (/^https:\/\/www\.google\.com\/maps\/d\//.test(url)) {
      const f = mk("iframe"); f.src = url; f.title = "Map of the zones and artworks"; f.loading = "lazy"; f.allowFullscreen = true;
      f.referrerPolicy = "no-referrer-when-downgrade"; el("map").appendChild(f);
    } else {
      el("map").appendChild(mk("p", "nomap", "The map is coming soon."));
    }

    const zoneInfo = {}; zdata.zones.forEach((z) => (zoneInfo[z.zone] = z));
    el("sub").textContent = works.length + " outdoor works in 5 downtown zones, by foot or bike.";
    el("cat-title").textContent = "The works (" + works.length + ")";

    let openId = null;
    const host = el("zones");

    function detail(w) {
      const d = mk("div", "detail");
      if (w.description) d.appendChild(mk("p", null, w.description));
      const dl = mk("dl");
      const row = (k, v) => { if (v) { dl.append(mk("dt", null, k), mk("dd", null, v)); } };
      row("Layer", layerName(w.layer));
      row("Sub-zone", w.sub_zone);
      row("Place", w.location_context);
      row("Address", w.address && !/^toronto, on$/i.test(w.address) ? w.address : "");
      row("Artist", known(w.artist_attribution) ? w.artist_attribution : "");
      row("Credit check", w.verified ? "Verified" : "Not yet verified");
      d.appendChild(dl);
      const foot = mk("p", "foot");
      const q = w.name + ", " + (/toronto/i.test(w.address || "") && !/^toronto, on$/i.test(w.address) ? w.address : (w.location_context || "") + ", Toronto, ON");
      const g = mk("a", null, "Open in Google Maps"); g.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); g.target = "_blank"; g.rel = "noopener";
      foot.append(g, document.createTextNode(" · "));
      if (w.source_url) { const s = mk("a", null, "Source"); s.href = w.source_url; s.rel = "noopener"; foot.append(s, document.createTextNode(" · ")); }
      const c = mk("a", null, "Report a correction");
      c.href = "https://github.com/" + REPO + "/issues/new?template=correction.md&title=" + encodeURIComponent("[Correction] " + w.id + " " + w.name); c.rel = "noopener";
      foot.appendChild(c); d.appendChild(foot);
      return d;
    }

    function render() {
      const openZone = openId ? (works.find((w) => w.id === openId) || {}).zone : null;
      const wasOpen = new Set(Array.from(host.querySelectorAll("details[open]")).map((d) => d.dataset.zone));
      host.innerHTML = "";
      ORDER.concat(zdata.zones.map((z) => z.zone).filter((z) => !ORDER.includes(z))).forEach((zn) => {
        const list = works.filter((w) => w.zone === zn).sort((a, b) => a.sub_zone.localeCompare(b.sub_zone) || a.name.localeCompare(b.name));
        if (!list.length) return;
        const z = zoneInfo[zn] || {};
        const d = mk("details", "zone"); d.dataset.zone = zn;
        if (wasOpen.has(zn) || zn === openZone) d.open = true;
        const s = mk("summary"); const dot = mk("span", "dot"); dot.style.background = z.color || "#888";
        s.append(dot, document.createTextNode(zn.replace(/^Downtown - /, "")), mk("span", "n", list.length + " works"));
        d.appendChild(s);
        if (z.description) d.appendChild(mk("p", "zdesc", z.description));
        const ul = mk("ul", "works");
        list.forEach((w) => {
          const li = mk("li", "work" + (w.id === openId ? " open" : ""));
          const b = mk("button"); b.type = "button"; b.setAttribute("aria-expanded", w.id === openId ? "true" : "false");
          b.append(mk("span", "name", w.name), mk("span", "where", w.sub_zone));
          b.addEventListener("click", () => { openId = openId === w.id ? null : w.id; render(); });
          li.appendChild(b);
          if (w.id === openId) li.appendChild(detail(w));
          ul.appendChild(li);
        });
        d.appendChild(ul); host.appendChild(d);
      });
    }
    render();
  }
})();
