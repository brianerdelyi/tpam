(function () {
  "use strict";
  const REPO = "brianerdelyi/tpam";
  const el = (id) => document.getElementById(id);
  const norm = (s) => (s || "").toLowerCase();
  const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  Promise.all([fetch("artworks.json").then((r) => r.json()), fetch("zones.json").then((r) => r.json())])
    .then(([works, zdata]) => init(works, zdata))
    .catch((e) => { el("count").textContent = "Could not load the data: " + e.message; });

  function init(works, zdata) {
    const zoneByName = {};
    zdata.zones.forEach((z) => (zoneByName[z.zone] = z));

    // ---- map ----
    const map = L.map("map", { zoomSnap: 0.25, zoomDelta: 0.5 });
    const tiles = dark ? "dark_all" : "light_all";
    L.tileLayer("https://{s}.basemaps.cartocdn.com/" + tiles + "/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    const polys = {}, overlays = {};
    zdata.zones.forEach((z) => {
      const p = L.polygon(z.coords, { color: z.color, weight: 2.5, fillColor: z.color, fillOpacity: 0.2 }).addTo(map);
      p.bindTooltip(z.short, { permanent: true, direction: "center", className: "zlabel" });
      p.on("click", () => { el("zone").value = z.zone; onZone(); });
      polys[z.zone] = p;
      overlays[z.short] = p;
    });
    const cor = [];
    [[44, 0.10], [30, 0.14], [18, 0.2]].forEach(([w, o]) =>
      cor.push(L.polyline(zdata.corridor.coords, { color: zdata.corridor.color, weight: w, opacity: o, lineCap: "round", interactive: false }).addTo(map)));
    overlays["Bloor Corridor"] = L.layerGroup(cor);
    L.control.layers(null, overlays, { collapsed: true }).addTo(map);
    const all = L.latLngBounds(zdata.zones.flatMap((z) => z.coords));
    const refit = () => { map.invalidateSize(); map.fitBounds(all.pad(0.05)); };
    refit();
    window.addEventListener("load", refit);
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => map.invalidateSize(), 150); });

    // ---- markers (only works with coordinates) ----
    const markers = {};
    const markerLayer = L.layerGroup().addTo(map);
    works.forEach((w) => {
      if (w.lat == null || w.lng == null) return;
      const z = zoneByName[w.zone];
      const m = L.circleMarker([w.lat, w.lng], { radius: 7, color: "#1d1d1b", weight: 1.5, fillColor: z ? z.color : "#888", fillOpacity: 0.95 });
      m.bindPopup(() => { const d = document.createElement("div"); const b = document.createElement("b"); b.textContent = w.name; d.append(b, document.createElement("br"), document.createTextNode(w.location_context || w.address || "")); return d; });
      m.on("click", () => select(w.id, false));
      markers[w.id] = m;
    });

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
      markerLayer.clearLayers();
      shown.forEach((w) => {
        const li = document.createElement("li"); li.className = "item" + (w.id === openId ? " open" : ""); li.dataset.id = w.id;
        const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-expanded", w.id === openId ? "true" : "false");
        const n = document.createElement("div"); n.className = "name"; n.textContent = w.name;
        const meta = document.createElement("div"); meta.className = "meta";
        const dot = document.createElement("span"); dot.className = "dot"; dot.style.background = (zoneByName[w.zone] || {}).color || "#888";
        const t1 = document.createElement("span"); t1.textContent = (zoneByName[w.zone] || {}).short + " · " + w.sub_zone;
        const bd = document.createElement("span"); bd.className = "badge" + (w.verified ? " ok" : ""); bd.textContent = w.verified ? "Verified" : "Unverified";
        meta.append(dot, t1, bd);
        b.append(n, meta);
        b.addEventListener("click", () => select(w.id, true));
        li.appendChild(b);
        if (w.id === openId) li.appendChild(detail(w));
        list.appendChild(li);
        if (markers[w.id]) markerLayer.addLayer(markers[w.id]);
      });
      const onMap = shown.filter((w) => w.lat != null).length;
      el("count").textContent = shown.length + " of " + works.length + " works" + (onMap ? " · " + onMap + " on the map" : " · locations coming soon, select a work to highlight its zone");
      el("sub").textContent = works.length + " outdoor works in 5 downtown zones, by foot or bike.";
    }

    let flash = null;
    function select(id, scroll) {
      openId = openId === id && scroll ? null : id;
      render();
      if (!openId) return;
      const w = works.find((x) => x.id === id);
      if (markers[id]) { map.flyTo(markers[id].getLatLng(), Math.max(map.getZoom(), 17)); markers[id].openPopup(); }
      else if (polys[w.zone]) {
        map.flyToBounds(polys[w.zone].getBounds().pad(0.1), { duration: 0.6 });
        if (flash) flash.setStyle({ weight: 2.5, fillOpacity: 0.2 });
        flash = polys[w.zone]; flash.setStyle({ weight: 5, fillOpacity: 0.38 });
      }
      const li = list.querySelector('[data-id="' + id + '"]');
      if (li && scroll) li.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function onZone() { refreshSubs(); render(); const z = polys[sel.zone.value]; if (z) map.flyToBounds(z.getBounds().pad(0.1), { duration: 0.6 }); else map.flyToBounds(all.pad(0.05), { duration: 0.6 }); }
    sel.zone.addEventListener("change", onZone);
    sel.sub.addEventListener("change", render);
    sel.layer.addEventListener("change", render);
    el("q").addEventListener("input", render);
    render();
  }
})();
