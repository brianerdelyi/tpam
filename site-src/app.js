(function () {
  "use strict";
  const REPO = "brianerdelyi/tpam";
  const el = (id) => document.getElementById(id);
  const norm = (s) => (s || "").toLowerCase();

  Promise.all([
    fetch("artworks.json").then((r) => r.json()),
    fetch("zones.json").then((r) => r.json()),
    fetch("config.json").then((r) => r.json()).catch(() => ({}))
  ]).then(([works, zdata, cfg]) => init(works, zdata, cfg))
    .catch((e) => { el("count").textContent = "Could not load the data: " + e.message; });

  function init(works, zdata, cfg) {
    // ---- map: embedded Google My Map ----
    const mapEl = el("map");
    const url = cfg.my_maps_embed_url || "";
    if (/^https:\/\/www\.google\.com\/maps\/d\//.test(url)) {
      const f = document.createElement("iframe");
      f.src = url; f.title = "Map of the zones"; f.loading = "lazy"; f.allowFullscreen = true;
      f.referrerPolicy = "no-referrer-when-downgrade";
      mapEl.appendChild(f);
    } else {
      const p = document.createElement("p"); p.className = "nomap";
      p.textContent = "The map is coming soon.";
      mapEl.appendChild(p);
    }

    const zoneByName = {};
    zdata.zones.forEach((z) => (zoneByName[z.zone] = z));

    // ---- filters ----
    const sel = { zone: el("zone"), sub: el("subzone"), layer: el("layer") };
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    const fill = (s, first, values) => {
      const cur = s.value; s.innerHTML = "";
      const o0 = document.createElement("option"); o0.value = ""; o0.textContent = first; s.appendChild(o0);
      values.forEach((v) => { const o = document.createElement("option"); o.value = v; o.textContent = v.replace(/^Downtown - /, ""); s.appendChild(o); });
      if (values.includes(cur)) s.value = cur;
    };
    fill(sel.zone, "All zones", zdata.zones.map((z) => z.zone));
    fill(sel.layer, "All layers", uniq(works.map((w) => w.layer)).sort());
    const refreshSubs = () => fill(sel.sub, "All sub-zones", uniq(works.filter((w) => !sel.zone.value || w.zone === sel.zone.value).map((w) => w.sub_zone)).sort());
    refreshSubs();

    const list = el("list");
    let openId = null;

    function matches(w) {
      if (sel.zone.value && w.zone !== sel.zone.value) return false;
      if (sel.sub.value && w.sub_zone !== sel.sub.value) return false;
      if (sel.layer.value && w.layer !== sel.layer.value) return false;
      const q = norm(el("q").value).trim();
      if (q && !norm([w.name, w.artist_attribution, w.location_context, w.address, w.sub_zone, w.description].join(" ")).includes(q)) return false;
      return true;
    }

    function detail(w) {
      const d = document.createElement("div"); d.className = "detail";
      if (w.description) { const p = document.createElement("p"); p.textContent = w.description; d.appendChild(p); }
      const dl = document.createElement("dl");
      const row = (k, v) => { if (!v) return; const t = document.createElement("dt"), x = document.createElement("dd"); t.textContent = k; x.textContent = v; dl.append(t, x); };
      row("Zone", w.zone); row("Sub-zone", w.sub_zone); row("Layer", w.layer);
      row("Location", w.location_context); row("Address", w.address);
      row("Artist", w.artist_attribution); row("Access", w.accessibility);
      d.appendChild(dl);
      const foot = document.createElement("p"); foot.style.marginTop = "10px";
      if (w.address) {
        const g = document.createElement("a");
        g.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(w.name + ", " + (w.address.includes("Toronto") ? w.address : w.location_context + ", Toronto, ON"));
        g.textContent = "Open in Google Maps"; g.target = "_blank"; g.rel = "noopener";
        foot.append(g, document.createTextNode(" · "));
      }
      if (w.source_url) { const a = document.createElement("a"); a.href = w.source_url; a.textContent = "Source"; a.rel = "noopener"; foot.append(a, document.createTextNode(" · ")); }
      const c = document.createElement("a");
      c.href = "https://github.com/" + REPO + "/issues/new?template=correction.md&title=" + encodeURIComponent("[Correction] " + w.id + " " + w.name);
      c.textContent = "Report a correction"; c.rel = "noopener"; foot.appendChild(c);
      d.appendChild(foot);
      return d;
    }

    function render() {
      const shown = works.filter(matches);
      list.innerHTML = "";
      shown.forEach((w) => {
        const li = document.createElement("li"); li.className = "item" + (w.id === openId ? " open" : ""); li.dataset.id = w.id;
        const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-expanded", w.id === openId ? "true" : "false");
        const n = document.createElement("div"); n.className = "name"; n.textContent = w.name;
        const meta = document.createElement("div"); meta.className = "meta";
        const dot = document.createElement("span"); dot.className = "dot"; dot.style.background = (zoneByName[w.zone] || {}).color || "#888";
        const t1 = document.createElement("span"); t1.textContent = ((zoneByName[w.zone] || {}).short || w.zone) + " · " + w.sub_zone;
        const bd = document.createElement("span"); bd.className = "badge" + (w.verified ? " ok" : ""); bd.textContent = w.verified ? "Verified" : "Unverified";
        meta.append(dot, t1, bd);
        b.append(n, meta);
        b.addEventListener("click", () => { openId = openId === w.id ? null : w.id; render(); });
        li.appendChild(b);
        if (w.id === openId) li.appendChild(detail(w));
        list.appendChild(li);
      });
      el("count").textContent = shown.length + " of " + works.length + " works";
      el("sub").textContent = works.length + " outdoor works in 5 downtown zones, by foot or bike.";
    }

    sel.zone.addEventListener("change", () => { refreshSubs(); render(); });
    sel.sub.addEventListener("change", render);
    sel.layer.addEventListener("change", render);
    el("q").addEventListener("input", render);
    render();
  }
})();
