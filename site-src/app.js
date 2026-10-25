(function () {
  "use strict";
  var REPO = "brianerdelyi/tpam";
  var $ = function (id) { return document.getElementById(id); };
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var layerName = function (l) { return (l || "").replace(/^Layer \d+\s*[–-]\s*/, ""); };
  var known = function (a) { return a && !/^not consistently documented$/i.test(a.trim()); };

  Promise.all([
    fetch("artworks.json").then(function (r) { return r.json(); }),
    fetch("zones.json").then(function (r) { return r.json(); })
  ]).then(function (d) { init(d[0], d[1]); })
    .catch(function (e) { $("works").appendChild(mk("li", "empty", "Could not load the data: " + e.message)); });

  var PROVIDERS = [
    { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", opt: { maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' } },
    { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", opt: { maxZoom: 19,
      attribution: "Tiles &copy; Esri" } }
  ];

  function init(works, zdata) {
    var zones = zdata.zones;
    var color = {}; zones.forEach(function (z) { color[z.zone] = z.color; });
    var short = {}; zones.forEach(function (z) { short[z.zone] = z.short; });
    var located = works.filter(function (w) { return w.lat != null && w.lng != null; });
    $("sub").textContent = works.length + " outdoor works in " + zones.length + " downtown zones, by foot or bike.";

    var map = L.map("map", { zoomSnap: 0.25, attributionControl: true });
    map.attributionControl.setPrefix(false);

    // base map with automatic fallback between free, key-less providers
    var pi = -1, base = null;
    function nextProvider() {
      pi++;
      if (base) map.removeLayer(base);
      if (pi >= PROVIDERS.length) { $("tilemsg").hidden = false; return; }
      var p = PROVIDERS[pi], ok = 0, bad = 0;
      base = L.tileLayer(p.url, p.opt);
      base.on("tileload", function () { ok++; });
      base.on("tileerror", function () { bad++; if (ok === 0 && bad >= 4) { base.off(); nextProvider(); } });
      base.addTo(map);
    }
    nextProvider();

    // zone outlines
    var polys = {};
    zones.forEach(function (z) {
      polys[z.zone] = L.polygon(z.coords, { color: z.color, weight: 2, fillColor: z.color, fillOpacity: 0.08, interactive: false }).addTo(map);
    });

    // pins
    var markers = {}, items = {}, selected = null, filter = null;
    located.forEach(function (w) {
      var c = color[w.zone] || "#333";
      var m = L.circleMarker([w.lat, w.lng], { radius: 8, color: "#fff", weight: 2, fillColor: c, fillOpacity: 0.95 });
      m.bindPopup(popup(w), { maxWidth: 280 });
      m.on("click", function () { select(w.id, false); });
      markers[w.id] = m;
    });

    function dirs(w) { return "https://www.google.com/maps/dir/?api=1&destination=" + w.lat + "," + w.lng; }
    function popup(w) {
      var d = mk("div", "pop");
      d.appendChild(mk("h3", null, w.name));
      d.appendChild(mk("p", "meta", [short[w.zone], layerName(w.layer)].filter(Boolean).join(" · ")));
      if (w.description) d.appendChild(mk("p", null, w.description));
      var bits = [];
      if (w.location_context) bits.push(w.location_context);
      if (known(w.artist_attribution)) bits.push("Artist: " + w.artist_attribution);
      bits.push(w.verified ? "Credit verified" : "Credit not yet verified");
      d.appendChild(mk("p", "small", bits.join(" · ")));
      var go = mk("p", "go");
      var da = mk("a", null, "Get directions"); da.href = dirs(w); da.target = "_blank"; da.rel = "noopener"; go.appendChild(da);
      d.appendChild(go);
      var f = mk("p", "small");
      var r = mk("a", null, "Report a correction");
      r.href = "https://github.com/" + REPO + "/issues/new?template=correction.md&title=" + encodeURIComponent("[Correction] " + w.id + " " + w.name);
      r.rel = "noopener"; r.target = "_blank"; f.appendChild(r);
      if (w.source_url) { f.appendChild(document.createTextNode(" · ")); var s = mk("a", null, "Source"); s.href = w.source_url; s.target = "_blank"; s.rel = "noopener"; f.appendChild(s); }
      d.appendChild(f);
      return d;
    }

    // list
    var ul = $("works");
    works.slice().sort(function (a, b) {
      return zones.findIndex(function (z) { return z.zone === a.zone; }) - zones.findIndex(function (z) { return z.zone === b.zone; }) || a.name.localeCompare(b.name);
    }).forEach(function (w) {
      var li = mk("li"), b = mk("button"), dot = mk("span", "dot"), t = mk("span");
      dot.style.background = color[w.zone] || "#333";
      t.append(mk("span", "nm", w.name), mk("span", "wh", (short[w.zone] || "") + (w.sub_zone ? " · " + w.sub_zone : "")));
      b.append(dot, t); li.appendChild(b); ul.appendChild(li);
      b.addEventListener("click", function () { select(w.id, true); });
      items[w.id] = { li: li, w: w };
    });

    function select(id, fromList) {
      if (selected && items[selected]) items[selected].li.classList.remove("sel");
      selected = id;
      var it = items[id]; if (!it) return;
      it.li.classList.add("sel");
      var m = markers[id];
      if (m) {
        if (fromList) { map.setView(m.getLatLng(), Math.max(map.getZoom(), 16)); m.openPopup(); }
      } else if (fromList) { /* no coordinates yet */ }
      if (!fromList) it.li.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    // filter chips (one set of controls)
    var bar = $("filters");
    function chip(label, zone, col) {
      var b = mk("button"); b.type = "button";
      if (col) { var d = mk("span", "dot"); d.style.background = col; b.appendChild(d); }
      var n = zone ? works.filter(function (w) { return w.zone === zone; }).length : works.length;
      b.appendChild(document.createTextNode(label + " (" + n + ")"));
      b.addEventListener("click", function () { setFilter(zone); });
      b.dataset.zone = zone || ""; bar.appendChild(b); return b;
    }
    chip("All", null);
    zones.forEach(function (z) { chip(z.short, z.zone, z.color); });

    function setFilter(zone) {
      filter = zone;
      Array.prototype.forEach.call(bar.children, function (b) { b.setAttribute("aria-pressed", String((b.dataset.zone || null) === zone)); });
      Object.keys(items).forEach(function (id) { items[id].li.hidden = !!zone && items[id].w.zone !== zone; });
      var pts = [];
      Object.keys(markers).forEach(function (id) {
        var show = !zone || items[id].w.zone === zone;
        if (show) { markers[id].addTo(map); pts.push(markers[id].getLatLng()); } else { map.removeLayer(markers[id]); }
      });
      zones.forEach(function (z) { polys[z.zone].setStyle({ weight: !zone || z.zone === zone ? 2 : 1, opacity: !zone || z.zone === zone ? 1 : 0.35, fillOpacity: !zone ? 0.08 : (z.zone === zone ? 0.14 : 0.02) }); });
      if (zone) map.fitBounds(polys[zone].getBounds().pad(0.1)); else map.fitBounds(allBounds());
    }
    function allBounds() {
      var b = L.latLngBounds([]); zones.forEach(function (z) { b.extend(polys[z.zone].getBounds()); }); return b.pad(0.04);
    }
    setFilter(null);
    window.addEventListener("resize", function () { map.invalidateSize(); });
    setTimeout(function () { map.invalidateSize(); setFilter(filter); }, 200);
  }
})();
