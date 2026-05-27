/* =========================================================
   /layout/componente_bandera.js
   Selector dinámico de países para páginas de visas.
   Renderiza dentro de:
   - #countrySwitcher[data-current-country]
   - .country-switcher[data-current-country]
========================================================= */
(function () {
  "use strict";

  if (window.__TN_COUNTRY_SWITCHER_INIT__) return;
  window.__TN_COUNTRY_SWITCHER_INIT__ = true;

  var COUNTRIES = [
    {
      id: "estados-unidos",
      name: "Estados Unidos",
      region: "América · B1/B2",
      href: "/pages/visaspais/visa-estados-unidos.html",
      flag: "https://flagcdn.com/w80/us.png",
      alt: "Bandera de Estados Unidos"
    },
    {
      id: "canada",
      name: "Canadá",
      region: "América · Visa / eTA",
      href: "/pages/visaspais/visa-canada.html",
      flag: "https://flagcdn.com/w80/ca.png",
      alt: "Bandera de Canadá"
    },
    {
      id: "reino-unido",
      name: "Reino Unido",
      region: "Europa · ETA",
      href: "/pages/visaspais/visa-reino-unido.html",
      flag: "https://flagcdn.com/w80/gb.png",
      alt: "Bandera de Reino Unido"
    },
    {
      id: "australia",
      name: "Australia",
      region: "Oceanía · Turismo",
      href: "/pages/visaspais/visa-australia.html",
      flag: "https://flagcdn.com/w80/au.png",
      alt: "Bandera de Australia"
    },
    {
      id: "china",
      name: "China",
      region: "Asia · Turismo/Negocios",
      href: "/pages/visaspais/visa-china.html",
      flag: "https://flagcdn.com/w80/cn.png",
      alt: "Bandera de China"
    },
    {
      id: "india",
      name: "India",
      region: "Asia · e-Visa",
      href: "/pages/visaspais/visa-india.html",
      flag: "https://flagcdn.com/w80/in.png",
      alt: "Bandera de India"
    },
    {
      id: "taiwan",
      name: "Taiwán",
      region: "Asia · Turismo/Negocios",
      href: "/pages/visaspais/visa-taiwan.html",
      flag: "https://flagcdn.com/w80/tw.png",
      alt: "Bandera de Taiwán"
    },
    {
      id: "sudafrica",
      name: "Sudáfrica",
      region: "África · Visitante",
      href: "/pages/visaspais/visa-sudafrica.html",
      flag: "https://flagcdn.com/w80/za.png",
      alt: "Bandera de Sudáfrica"
    }
  ];

  function onReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function createIcon(className) {
    var icon = document.createElement("i");
    icon.className = className;
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function createCountryRow(country) {
    if (!country || typeof country !== "object") return null;

    var link = document.createElement("a");
    var img = document.createElement("img");
    var info = document.createElement("div");
    var name = document.createElement("div");
    var region = document.createElement("div");

    link.className = "pais-row";
    link.href = typeof country.href === "string" ? country.href : "#";

    if (country.external === true) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    img.className = "pais-flag";
    img.src = typeof country.flag === "string" ? country.flag : "";
    img.alt = typeof country.alt === "string" ? country.alt : "Bandera del país";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 80;
    img.height = 54;

    info.className = "pais-info";

    name.className = "pais-name";
    name.textContent = typeof country.name === "string" ? country.name : "País";

    region.className = "pais-region";
    region.textContent = typeof country.region === "string" ? country.region : "";

    info.appendChild(name);
    info.appendChild(region);

    link.appendChild(img);
    link.appendChild(info);
    link.appendChild(createIcon("fas fa-chevron-right pais-arrow"));

    return link;
  }

  function createBackRow(href) {
    var link = document.createElement("a");
    var iconWrap = document.createElement("div");
    var info = document.createElement("div");
    var name = document.createElement("div");
    var region = document.createElement("div");

    link.className = "pais-row pais-row-back";
    link.href = typeof href === "string" && href ? href : "/pages/core/servicios.html#banderaspaises";

    iconWrap.className = "pais-flag-emoji";
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.appendChild(createIcon("fas fa-arrow-left"));

    info.className = "pais-info";

    name.className = "pais-name";
    name.textContent = "Volver";

    region.className = "pais-region";
    region.textContent = "A todos los países";

    info.appendChild(name);
    info.appendChild(region);

    link.appendChild(iconWrap);
    link.appendChild(info);
    link.appendChild(createIcon("fas fa-chevron-right pais-arrow"));

    return link;
  }

  function renderHeader(container) {
    var header = document.createElement("div");
    var label = document.createElement("span");
    var title = document.createElement("h2");
    var text = document.createElement("p");

    header.className = "section-header text-center";

    label.className = "section-label";
    label.textContent = "Explora otros destinos";

    title.id = "country-switcher-title";
    title.textContent = "Banderas disponibles";

    text.className = "section-subtext";
    text.textContent = "Selecciona otro país o vuelve al listado completo.";

    header.appendChild(label);
    header.appendChild(title);
    header.appendChild(text);

    container.appendChild(header);
  }

  function renderSwitcher(root) {
    if (!root || root.dataset.tnRendered === "1") return;

    var currentCountry = String(
      root.dataset.currentCountry || document.body.dataset.country || ""
    ).trim();

    var backHref = root.dataset.backHref || "/pages/core/servicios.html#banderaspaises";

    var inner = document.createElement("div");
    var table = document.createElement("div");

    inner.className = "country-switcher-inner";
    table.className = "paises-table";
    table.setAttribute("aria-label", "Selector de países disponibles");

    renderHeader(inner);

    COUNTRIES.forEach(function (country) {
      if (country.id === currentCountry) return;

      var row = createCountryRow(country);

      if (row) {
        table.appendChild(row);
      }
    });

    table.appendChild(createBackRow(backHref));

    inner.appendChild(table);

    root.replaceChildren(inner);
    root.dataset.tnRendered = "1";
  }

  onReady(function () {
    var roots = document.querySelectorAll(
      "#countrySwitcher[data-current-country], .country-switcher[data-current-country]"
    );

    roots.forEach(renderSwitcher);
  });
})();