(() => {
  const cfg = window.APP_CONFIG;
  const state = {
    products: [],
    cart: loadJSON(cfg.cartStorageKey, {}),
    customer: loadJSON(cfg.customerStorageKey, {
      name: "",
      address: "",
      notes: "",
      pay: "Efectivo"
    }),
    filter: "all",
    shipping: {
      amount: 0,
      km: null,
      ready: false,
      meta: "Calcula el delivery con tu dirección."
    },
    map: {
      instance: null,
      originMarker: null,
      destinationMarker: null,
      routeLine: null,
      originCoords: null,
      destinationCoords: null
    }
  };

  const refs = {
    splash: byId("splash"),
    app: byId("app"),
    grid: byId("grid"),
    chips: byId("chips"),
    resultInfo: byId("resultInfo"),
    search: byId("search"),
    btnClear: byId("btnClear"),
    cartItems: byId("cartItems"),
    subtotal: byId("subtotal"),
    shipping: byId("shipping"),
    shippingMeta: byId("shippingMeta"),
    total: byId("total"),
    btnEmpty: byId("btnEmpty"),
    checkout: byId("checkout"),
    cName: byId("cName"),
    cAddr: byId("cAddr"),
    cNotes: byId("cNotes"),
    cPay: byId("cPay"),
    btnCalcDelivery: byId("btnCalcDelivery")
  };

  init();

  async function init() {
    hydrateCustomer();
    attachEvents();
    startSplash();

    try {
      const res = await fetch("menu.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar menu.json");
      state.products = await res.json();
      renderChips();
      renderGrid();
      renderCart();
    } catch (err) {
      refs.grid.innerHTML = `<p class="empty">Error cargando menú: ${err.message}</p>`;
    }
  }

  function startSplash() {
    setTimeout(() => {
      refs.splash.style.display = "none";
      refs.app.classList.remove("hidden");
      setupMap();
    }, cfg.splashMs);
  }

  function setupMap() {
    if (!window.L) {
      state.shipping.meta = "No se pudo cargar Leaflet. Calcula luego.";
      renderCart();
      return;
    }

    state.map.instance = L.map("map", {
      zoomControl: true
    }).setView([10.1879, -68.0077], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap"
    }).addTo(state.map.instance);
  }

  function attachEvents() {
    refs.search.addEventListener("input", renderGrid);
    refs.btnClear.addEventListener("click", () => {
      refs.search.value = "";
      renderGrid();
    });

    refs.grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add]");
      if (!button) return;
      addToCart(button.dataset.add, 1);
    });

    refs.cartItems.addEventListener("click", (event) => {
      const add = event.target.closest("[data-add]");
      const sub = event.target.closest("[data-sub]");
      if (add) addToCart(add.dataset.add, 1);
      if (sub) addToCart(sub.dataset.sub, -1);
    });

    refs.btnEmpty.addEventListener("click", () => {
      state.cart = {};
      persistCart();
      renderCart();
    });

    refs.checkout.addEventListener("input", persistCustomer);
    refs.btnCalcDelivery.addEventListener("click", calculateDelivery);

    refs.checkout.addEventListener("submit", async (event) => {
      event.preventDefault();
      await sendWhatsApp();
    });
  }

  function categories() {
    const set = new Set(state.products.map((p) => p.cat));
    return ["all", ...set];
  }

  function renderChips() {
    refs.chips.innerHTML = categories()
      .map((cat) => `<button class="btn chip ${cat === state.filter ? "active" : ""}" data-filter="${cat}">${labelCat(cat)}</button>`)
      .join("");

    refs.chips.querySelectorAll("[data-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.filter = chip.dataset.filter;
        renderChips();
        renderGrid();
      });
    });
  }

  function filteredProducts() {
    const term = refs.search.value.trim().toLowerCase();
    return state.products.filter((p) => {
      const byCat = state.filter === "all" || p.cat === state.filter;
      const text = `${p.name} ${p.desc}`.toLowerCase();
      const byTerm = !term || text.includes(term);
      return byCat && byTerm;
    });
  }

  function renderGrid() {
    const list = filteredProducts();
    refs.resultInfo.textContent = `${list.length} resultado(s) en ${labelCat(state.filter)}.`;

    if (!list.length) {
      refs.grid.innerHTML = '<p class="empty">No encontramos productos con ese filtro.</p>';
      return;
    }

    refs.grid.innerHTML = list
      .map(
        (p) => `<article class="card">
            <div class="img" style="background-image:url('${p.img}')"></div>
            <div class="content">
              <h4>${p.name}</h4>
              <p>${p.desc}</p>
              <div class="meta">
                <span class="price">${money(p.price)}</span>
                <button class="btn primary" data-add="${p.id}">Agregar</button>
              </div>
            </div>
          </article>`
      )
      .join("");
  }

  function addToCart(id, delta) {
    const current = state.cart[id] || 0;
    const next = current + delta;
    if (next <= 0) delete state.cart[id];
    else state.cart[id] = next;
    persistCart();
    renderCart();
  }

  function cartLines() {
    return Object.entries(state.cart)
      .map(([id, qty]) => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return null;
        return { id, name: product.name, price: product.price, qty, line: product.price * qty };
      })
      .filter(Boolean);
  }

  function totals() {
    const sub = cartLines().reduce((sum, line) => sum + line.line, 0);
    return { sub, ship: state.shipping.amount, total: sub + state.shipping.amount };
  }

  function renderCart() {
    const lines = cartLines();
    if (!lines.length) {
      refs.cartItems.innerHTML = '<div class="empty">Tu carrito está vacío.</div>';
    } else {
      refs.cartItems.innerHTML = lines
        .map(
          (line) => `<div class="cart-item">
              <div class="cart-item-top">
                <strong>${line.name}</strong>
                <span>${money(line.line)}</span>
              </div>
              <div class="qty">
                <button type="button" data-sub="${line.id}">−</button>
                <span>${line.qty}</span>
                <button type="button" data-add="${line.id}">+</button>
                <small>${money(line.price)} c/u</small>
              </div>
            </div>`
        )
        .join("");
    }

    const t = totals();
    refs.subtotal.textContent = money(t.sub);
    refs.shipping.textContent = money(t.ship);
    refs.total.textContent = money(t.total);
    refs.shippingMeta.textContent = state.shipping.meta;
  }

  async function calculateDelivery() {
    const address = refs.cAddr.value.trim();
    if (!address) {
      state.shipping = { amount: 0, km: null, ready: false, meta: "Ingresa una dirección para calcular delivery." };
      renderCart();
      return;
    }

    refs.btnCalcDelivery.disabled = true;
    state.shipping.meta = "Calculando ruta desde El Trigal Sur...";
    renderCart();

    try {
      const [origin, destination] = await Promise.all([
        geocodeAddress(cfg.baseAddress),
        geocodeAddress(`${address}, Valencia, Carabobo, Venezuela`)
      ]);

      const route = await getRoute(origin, destination);
      const km = Math.max(1, Math.ceil(route.distance / 1000));
      const cost = Math.max(cfg.minDelivery, km * cfg.eurPerKm);

      state.shipping = {
        amount: cost,
        km,
        ready: true,
        meta: `Distancia ${km} km · €${cfg.eurPerKm}/km desde El Trigal Sur.`
      };

      drawMap(origin, destination, route.geometry);
    } catch {
      state.shipping = {
        amount: 0,
        km: null,
        ready: false,
        meta: "No fue posible calcular la ruta ahora. Reintenta."
      };
    } finally {
      refs.btnCalcDelivery.disabled = false;
      renderCart();
    }
  }

  async function geocodeAddress(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "es" } });
    if (!res.ok) throw new Error("Error geocoding");
    const data = await res.json();
    if (!data.length) throw new Error("Address not found");
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  }

  async function getRoute(origin, destination) {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Route failed");
    const data = await res.json();
    if (!data.routes?.length) throw new Error("No route");
    return data.routes[0];
  }

  function drawMap(origin, destination, geometry) {
    if (!state.map.instance || !window.L) return;

    if (state.map.originMarker) state.map.originMarker.remove();
    if (state.map.destinationMarker) state.map.destinationMarker.remove();
    if (state.map.routeLine) state.map.routeLine.remove();

    state.map.originMarker = L.marker([origin.lat, origin.lon]).addTo(state.map.instance).bindPopup("Origen: El Trigal Sur");
    state.map.destinationMarker = L.marker([destination.lat, destination.lon]).addTo(state.map.instance).bindPopup("Destino cliente");

    const latlngs = geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    state.map.routeLine = L.polyline(latlngs, { color: "#d6c48f", weight: 5 }).addTo(state.map.instance);
    state.map.instance.fitBounds(state.map.routeLine.getBounds(), { padding: [24, 24] });
  }

  function persistCart() {
    localStorage.setItem(cfg.cartStorageKey, JSON.stringify(state.cart));
  }

  function hydrateCustomer() {
    refs.cName.value = state.customer.name;
    refs.cAddr.value = state.customer.address;
    refs.cNotes.value = state.customer.notes;
    refs.cPay.value = state.customer.pay;
  }

  function persistCustomer() {
    state.customer = {
      name: refs.cName.value.trim(),
      address: refs.cAddr.value.trim(),
      notes: refs.cNotes.value.trim(),
      pay: refs.cPay.value
    };
    localStorage.setItem(cfg.customerStorageKey, JSON.stringify(state.customer));
  }

  async function sendWhatsApp() {
    const lines = cartLines();
    if (!lines.length) return alert("Primero agrega productos al carrito.");
    if (!refs.cName.value.trim() || !refs.cAddr.value.trim()) return alert("Completa nombre y dirección.");
    if (!state.shipping.ready) {
      await calculateDelivery();
      if (!state.shipping.ready) return alert("No se pudo calcular el delivery. Reintenta.");
    }

    persistCustomer();
    const t = totals();
    const msg = [
      "*Nuevo pedido BabriKa*",
      `*Cliente:* ${state.customer.name}`,
      `*Dirección:* ${state.customer.address}`,
      `*Pago:* ${state.customer.pay}`,
      `*Notas:* ${state.customer.notes || "-"}`,
      "",
      "*Items:*",
      ...lines.map((line) => `• ${line.qty} x ${line.name} (${money(line.price)}) = ${money(line.line)}`),
      "",
      `*Subtotal:* ${money(t.sub)}`,
      `*Delivery:* ${money(t.ship)} (${state.shipping.km} km)` ,
      `*Total:* ${money(t.total)}`
    ].join("\n");

    window.open(`https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  function loadJSON(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  function money(value) {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: 2
    }).format(value);
  }

  function labelCat(cat) {
    return ({ all: "todo el menú", shawarma: "shawarma", falafel: "falafel", entradas: "entradas", bebidas: "bebidas" }[cat] || cat);
  }

  function byId(id) {
    return document.getElementById(id);
  }
})();
