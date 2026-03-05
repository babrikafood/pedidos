const PRODUCTS = [
  { id:"shawarma-pollo", name:"Shawarma de Pollo", cat:"shawarma", price:8,  desc:"Pollo jugoso, ajo, encurtidos y papas.", img:"https://picsum.photos/seed/shawarma1/800/600" },
  { id:"shawarma-carne", name:"Shawarma de Carne", cat:"shawarma", price:9,  desc:"Carne especiada, tahini y ensalada fresca.", img:"https://picsum.photos/seed/shawarma2/800/600" },
  { id:"falafel-wrap",   name:"Wrap de Falafel",   cat:"falafel",  price:8,  desc:"Falafel crujiente, hummus y verduras.", img:"https://picsum.photos/seed/falafel1/800/600" },
  { id:"hummus",         name:"Hummus + Pan Árabe",cat:"entradas", price:6,  desc:"Cremoso, oliva y pimentón.", img:"https://picsum.photos/seed/hummus/800/600" },
  { id:"tabule",         name:"Tabulé",            cat:"entradas", price:6,  desc:"Perejil, tomate, burgol y limón.", img:"https://picsum.photos/seed/tabule/800/600" },
  { id:"refresco",       name:"Refresco",          cat:"bebidas",  price:2,  desc:"Bien frío. Tu lengua lo agradece.", img:"https://picsum.photos/seed/soda/800/600" },
];

const KEY = "cart_arabe_v1";

const state = {
  cart: loadCart(),
  filter: "all",
  search: ""
};

function cfg(){ return window.APP_CONFIG || {}; }
function sym(){ return cfg().currencySymbol || "$"; }
function money(n){ return `${sym()}${Number(n).toFixed(0)}`; }

function loadCart(){
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function saveCart(){ localStorage.setItem(KEY, JSON.stringify(state.cart)); }
function qtyOf(id){ return state.cart[id] || 0; }

function setQty(id, qty){
  if(qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;
  saveCart();
  renderCart();
}

function add(id){ setQty(id, qtyOf(id) + 1); }
function sub(id){ setQty(id, qtyOf(id) - 1); }

function filteredProducts(){
  const term = state.search.trim().toLowerCase();
  return PRODUCTS.filter(p => {
    const okCat = state.filter === "all" || p.cat === state.filter;
    const okSearch = !term || (`${p.name} ${p.desc}`).toLowerCase().includes(term);
    return okCat && okSearch;
  });
}

function renderGrid(){
  const html = filteredProducts().map(p => `
    <article class="card">
      <div class="img" style="background-image:url('${p.img}')"></div>
      <div class="body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="meta">
          <span class="price">${money(p.price)}</span>
          <button class="btn primary" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>
  `).join("");

  $("#grid").html(html);
}

function cartLines(){
  return Object.keys(state.cart).map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    const qty = state.cart[id];
    const price = p ? p.price : 0;
    return { id, name: p ? p.name : id, price, qty, line: price * qty };
  });
}

function totals(){
  const sub = cartLines().reduce((a,x)=>a+x.line,0);
  const isDelivery = $("#cDelivery").prop("checked");
  const ship = isDelivery ? Number(cfg().shippingFlat || 0) : 0;
  return { sub, ship, total: sub + ship };
}

function renderCart(){
  const lines = cartLines();

  if(lines.length === 0){
    $("#cartItems").html(`<div class="mini">Tu carrito está vacío. Agregá algo rico 😉</div>`);
  } else {
    $("#cartItems").html(lines.map(x => `
      <div class="item">
        <div>
          <strong>${x.name}</strong>
          <small>${money(x.price)} • Cant: ${x.qty}</small>
        </div>
        <div class="qty">
          <button data-sub="${x.id}" aria-label="Quitar">−</button>
          <span>${x.qty}</span>
          <button data-add="${x.id}" aria-label="Agregar">+</button>
        </div>
      </div>
    `).join(""));
  }

  const t = totals();
  $("#subtotal").text(money(t.sub));
  $("#shipping").text(money(t.ship));
  $("#total").text(money(t.total));
}

function buildWhatsAppMessage(){
  const name = $("#cName").val().trim() || "-";
  const addr = $("#cAddr").val().trim() || "-";
  const notes = $("#cNotes").val().trim();
  const pay = $("#cPay").val();
  const delivery = $("#cDelivery").prop("checked") ? "Sí" : "No";

  const lines = cartLines();
  const t = totals();

  let msg = `*Nuevo pedido*%0A`;
  msg += `%0A*Cliente:* ${encodeURIComponent(name)}%0A`;
  msg += `*Dirección:* ${encodeURIComponent(addr)}%0A`;
  msg += `*Delivery:* ${delivery}%0A`;
  msg += `*Pago:* ${encodeURIComponent(pay)}%0A`;

  msg += `%0A*Items:*%0A`;
  lines.forEach(x => {
    msg += `• ${x.qty} x ${encodeURIComponent(x.name)} (${encodeURIComponent(money(x.price))}) = ${encodeURIComponent(money(x.line))}%0A`;
  });

  msg += `%0A*Subtotal:* ${encodeURIComponent(money(t.sub))}%0A`;
  msg += `*Envío:* ${encodeURIComponent(money(t.ship))}%0A`;
  msg += `*Total:* ${encodeURIComponent(money(t.total))}%0A`;

  if(notes) msg += `%0A*Notas:* ${encodeURIComponent(notes)}%0A`;

  return msg;
}

function openWhatsApp(){
  const number = String(cfg().whatsappNumber || "").replace(/\D/g,"");
  if(!number){
    alert("Configurá APP_CONFIG.whatsappNumber en index.html (sin + ni espacios).");
    return;
  }
  if(Object.keys(state.cart).length === 0){
    alert("Tu carrito está vacío 😅");
    return;
  }

  const msg = buildWhatsAppMessage();
  const url = `https://wa.me/${number}?text=${msg}`;
  window.open(url, "_blank");
}

function bindUI(){
  // Filtros
  $(".chip").on("click", function(){
    $(".chip").removeClass("active");
    $(this).addClass("active");
    state.filter = $(this).data("filter");
    renderGrid();
  });

  // Search
  $("#search").on("input", function(){
    state.search = $(this).val();
    renderGrid();
  });

  $("#btnClear").on("click", function(){
    $("#search").val("");
    state.search = "";
    renderGrid();
  });

  // Delegación: agregar desde grid
  $("#grid").on("click", "[data-add]", function(){
    add($(this).data("add"));
  });

  // Delegación: +/-
  $("#cartItems").on("click", "[data-add]", function(){
    add($(this).data("add"));
  });
  $("#cartItems").on("click", "[data-sub]", function(){
    sub($(this).data("sub"));
  });

  // Vaciar
  $("#btnEmpty").on("click", function(){
    state.cart = {};
    saveCart();
    renderCart();
  });

  // Recalcular envío
  $("#cDelivery").on("change", renderCart);

  // WhatsApp
  $("#btnWhatsApp").on("click", openWhatsApp);
}

$(function(){
  renderGrid();
  renderCart();
  bindUI();
});
