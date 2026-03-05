<?php
// Cambia esto por tu número en formato internacional SIN + ni espacios.
// Ejemplo Uruguay: 5989xxxxxxx | Venezuela: 58414xxxxxxx
$WHATSAPP_NUMBER = "584144259594";
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pedidos | Comida Árabe</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="logo">🧆</div>
      <div>
        <div class="brand-title">Comida Árabe</div>
        <div class="brand-sub">Pedidos rápidos • Delivery</div>
      </div>
    </div>

    <div class="search-wrap">
      <input id="search" type="search" placeholder="Buscar shawarma, falafel, hummus..." />
      <button id="btnClear" class="btn ghost" type="button">Limpiar</button>
    </div>
  </header>

  <main class="layout">
    <section class="content">
      <div class="hero">
        <div class="hero-text">
          <h1>Pedí en 30 segundos (sin llamar a tu ex…)</h1>
          <p>Elegí tus platos, confirmá y te abrimos WhatsApp con el pedido listo para enviar.</p>
          <div class="hero-tags">
            <span class="tag">🔥 Shawarma</span>
            <span class="tag">🥙 Falafel</span>
            <span class="tag">🫓 Hummus</span>
            <span class="tag">🚀 Delivery</span>
          </div>
        </div>
        <div class="hero-img" aria-hidden="true"></div>
      </div>

      <div class="section-head">
        <h2>Menú</h2>
        <div class="chips">
          <button class="chip active" data-filter="all">Todo</button>
          <button class="chip" data-filter="shawarma">Shawarma</button>
          <button class="chip" data-filter="falafel">Falafel</button>
          <button class="chip" data-filter="entradas">Entradas</button>
          <button class="chip" data-filter="bebidas">Bebidas</button>
        </div>
      </div>

      <div id="grid" class="grid"></div>
    </section>

    <aside class="cart">
      <div class="cart-head">
        <h3>Tu pedido</h3>
        <button id="btnEmpty" class="btn ghost" type="button">Vaciar</button>
      </div>

      <div id="cartItems" class="cart-items"></div>

      <div class="cart-summary">
        <div class="row">
          <span>Subtotal</span>
          <strong id="subtotal">$0</strong>
        </div>
        <div class="row">
          <span>Envío</span>
          <strong id="shipping">$0</strong>
        </div>
        <div class="row total">
          <span>Total</span>
          <strong id="total">$0</strong>
        </div>
      </div>

      <div class="checkout">
        <h4>Datos para el envío</h4>
        <div class="form">
          <label>
            Nombre
            <input id="cName" type="text" placeholder="Tu nombre" />
          </label>
          <label>
            Dirección
            <input id="cAddr" type="text" placeholder="Calle, número, referencia" />
          </label>
          <label>
            Notas
            <textarea id="cNotes" rows="2" placeholder="Sin cebolla, extra salsa, etc."></textarea>
          </label>
          <label>
            Pago
            <select id="cPay">
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Pago móvil">Pago móvil</option>
            </select>
          </label>

          <label class="toggle">
            <input id="cDelivery" type="checkbox" checked />
            <span>Delivery</span>
          </label>

          <button id="btnWhatsApp" class="btn primary" type="button">
            Enviar por WhatsApp
          </button>

          <button id="btnSave" class="btn" type="button">
            Guardar pedido (PHP)
          </button>

          <p class="mini">
            *WhatsApp se abre con el mensaje armado. Vos solo apretás “Enviar”.
          </p>
        </div>
      </div>
    </aside>
  </main>

  <script>
    window.APP_CONFIG = {
      whatsappNumber: "<?php echo htmlspecialchars($WHATSAPP_NUMBER, ENT_QUOTES); ?>",
      currencySymbol: "$",
      shippingFlat: 3, // cambia a 0 si no cobras envío fijo
      saveEndpoint: "api/save_order.php"
    };
  </script>
  <script src="assets/app.js"></script>
</body>
</html>
