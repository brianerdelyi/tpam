(function () {
  "use strict";
  var el = document.getElementById("map");
  fetch("config.json").then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (cfg) {
    var url = cfg.my_maps_embed_url || "";
    if (/^https:\/\/www\.google\.com\/maps\/d\//.test(url)) {
      var f = document.createElement("iframe");
      f.src = url; f.title = "Map of the artworks"; f.allowFullscreen = true;
      f.referrerPolicy = "no-referrer-when-downgrade";
      el.appendChild(f);
    } else {
      var p = document.createElement("p"); p.className = "nomap"; p.textContent = "The map is coming soon."; el.appendChild(p);
    }
  });
})();
