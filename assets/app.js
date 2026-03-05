(() => {
  const cfg = window.APP_CONFIG;
  const state = {
    products: [],
    cart: loadJSON(cfg.cartStorageKey, {}),
    customer: loadJSON(cfg.customerStorageKey, {
      name: "",
      address: "",
      notes: "",
      pay: "Efectivo",
      delivery: true
    }),
    filter: "all"
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
    total: byId("total"),
    btnEmpty: byId("btnEmpty"),
    checkout: byId("checkout"),
    cName: byId("cName"),
    cAddr: byId("cAddr"),
    cNotes: byId("cNotes"),
    cPay: byId("cPay"),
    cDelivery: byId("cDelivery")
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
    }, cfg.splashMs);
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
    refs.checkout.addEventListener("submit", (event) => {
      event.preventDefault();
      sendWhatsApp();
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
        return {
          id,
          name: product.name,
          price: product.price,
          qty,
          line: product.price * qty
        };
      })
      .filter(Boolean);
  }

  function totals() {
    const sub = cartLines().reduce((sum, line) => sum + line.line, 0);
    const ship = refs.cDelivery.checked ? cfg.shippingFlat : 0;
    return { sub, ship, total: sub + ship };
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
  }

  function persistCart() {
    localStorage.setItem(cfg.cartStorageKey, JSON.stringify(state.cart));
  }

  function hydrateCustomer() {
    refs.cName.value = state.customer.name;
    refs.cAddr.value = state.customer.address;
    refs.cNotes.value = state.customer.notes;
    refs.cPay.value = state.customer.pay;
    refs.cDelivery.checked = Boolean(state.customer.delivery);
  }

  function persistCustomer() {
    state.customer = {
      name: refs.cName.value.trim(),
      address: refs.cAddr.value.trim(),
      notes: refs.cNotes.value.trim(),
      pay: refs.cPay.value,
      delivery: refs.cDelivery.checked
    };
    localStorage.setItem(cfg.customerStorageKey, JSON.stringify(state.customer));
    renderCart();
  }

  function sendWhatsApp() {
    const lines = cartLines();
    if (!lines.length) {
      alert("Primero agrega productos al carrito.");
      return;
    }

    if (!refs.cName.value.trim() || (refs.cDelivery.checked && !refs.cAddr.value.trim())) {
      alert("Completa nombre y dirección para continuar.");
      return;
    }

    persistCustomer();
    const t = totals();

    const message = [
      "*Nuevo pedido BabriKa*",
      `*Cliente:* ${state.customer.name}`,
      `*Dirección:* ${state.customer.delivery ? state.customer.address : "Retiro en local"}`,
      `*Delivery:* ${state.customer.delivery ? "Sí" : "No"}`,
      `*Pago:* ${state.customer.pay}`,
      `*Notas:* ${state.customer.notes || "-"}`,
      "",
      "*Items:*",
      ...lines.map((line) => `• ${line.qty} x ${line.name} (${money(line.price)}) = ${money(line.line)}`),
      "",
      `*Subtotal:* ${money(t.sub)}`,
      `*Envío:* ${money(t.ship)}`,
      `*Total:* ${money(t.total)}`
    ].join("\n");

    const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
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
    return (
      {
        all: "todo el menú",
        shawarma: "shawarma",
        falafel: "falafel",
        entradas: "entradas",
        bebidas: "bebidas"
      }[cat] || cat
    );
  }

  function byId(id) {
    return document.getElementById(id);
  }
})();
