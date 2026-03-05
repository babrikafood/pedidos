$(function(){
  // SPLASH
  setTimeout(function(){
    $("#splash").fadeOut(500,function(){$("#main").removeClass("hidden");});
  },2000);

  const KEY = "cart_arabe_v2";
  let cart = JSON.parse(localStorage.getItem(KEY)||"{}");

  function saveCart(){ localStorage.setItem(KEY,JSON.stringify(cart)); }

  // Fetch menú
  $.getJSON("menu.json",function(products){
    window.PRODUCTS = products;
    renderGrid();
    renderCart();
  });

  function renderGrid(){
    const term=$("#search").val()?$("#search").val().toLowerCase():"";
    const filter=$(".chip.active").data("filter");
    const html=window.PRODUCTS.filter(p=>{
      const okCat=filter==="all"||p.cat===filter;
      const okSearch=!term||(`${p.name} ${p.desc}`).toLowerCase().includes(term);
      return okCat&&okSearch;
    }).map(p=>`
      <div class="card">
        <div class="img" style="background-image:url(${p.img})"></div>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div><span>$${p.price}</span> <button class="btn primary" data-add="${p.id}">Agregar</button></div>
      </div>
    `).join("");
    $("#grid").html(html);
  }

  function cartLines(){return Object.keys(cart).map(id=>{
    const p=window.PRODUCTS.find(x=>x.id===id);
    const q=cart[id];return {id,name:p.name,price:p.price,qty:q,line:p.price*q};
  });}

  function totals(){
    const sub=cartLines().reduce((a,x)=>a+x.line,0);
    const ship=$("#cDelivery").prop("checked")?window.APP_CONFIG.shippingFlat:0;
    return {sub,ship,total:sub+ship};
  }

  function renderCart(){
    const lines=cartLines();
    if(!lines.length){$("#cartItems").html("<div>Carrito vacío</div>");return;}
    $("#cartItems").html(lines.map(x=>`
      <div class="item">
        <span>${x.name} x${x.qty}</span>
        <button data-add="${x.id}">+</button>
        <button data-sub="${x.id}">-</button>
      </div>
    `).join(""));
    const t=totals();
    $("#subtotal").text(`$${t.sub}`);$("#shipping").text(`$${t.ship}`);$("#total").text(`$${t.total}`);
  }

  // eventos
  $("#grid").on("click","[data-add]",function(){const id=$(this).data("add");cart[id]=(cart[id]||0)+1;saveCart();renderCart();});
  $("#cartItems").on("click","[data-add]",function(){const id=$(this).data("add");cart[id]=(cart[id]||0)+1;saveCart();renderCart();});
  $("#cartItems").on("click","[data-sub]",function(){const id=$(this).data("sub");cart[id]=(cart[id]||0)-1;if(cart[id]<=0)delete cart[id];saveCart();renderCart();});
  $(".chip").click(function(){$(".chip").removeClass("active");$(this).addClass("active");renderGrid();});
  $("#search").on("input",renderGrid);$("#btnClear").click(function(){$("#search").val("");renderGrid();});
  $("#btnEmpty").click(function(){cart={};saveCart();renderCart();});

  $("#btnWhatsApp").click(function(){
    if(!cartLines().length){alert("Carrito vacío");return;}
    let msg="*Nuevo pedido*%0A";
    msg+=`*Cliente:* ${encodeURIComponent($("#cName").val()) || "-"}%0A`;
    msg+=`*Dirección:* ${encodeURIComponent($("#cAddr").val()) || "-"}%0A`;
    msg+=`*Delivery:* ${$("#cDelivery").prop("checked")?"Sí":"No"}%0A`;
    msg+=`*Pago:* ${encodeURIComponent($("#cPay").val())}%0A`;
    msg+="%0A*Items:*%0A";
    cartLines().forEach(x=>{msg+=`• ${x.qty} x ${encodeURIComponent(x.name)} ($${x.price}) = $${x.line}%0A`;});
    const t=totals();msg+=`%0A*Subtotal:* $${t.sub}%0A*Envío:* $${t.ship}%0A*Total:* $${t.total}`;
    window.open(`https://wa.me/${window.APP_CONFIG.whatsappNumber}?text=${msg}`,"_blank");
  });
});
