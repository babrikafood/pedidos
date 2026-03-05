# Pedidos BabriKa (HTML/CSS/JS/JSON)

Demo de sistema de pedidos tipo delivery (estilo PedidosYa) construido **solo con frontend**:

- HTML para estructura.
- CSS para diseño responsive.
- JavaScript (vanilla) para lógica de carrito, filtros y checkout.
- JSON local (`menu.json`) como catálogo de productos.

## Cómo usar

1. Levantar un servidor estático en la carpeta del proyecto.
2. Abrir el navegador.
3. Armar carrito y confirmar por WhatsApp.

Ejemplo con Python:

```bash
python3 -m http.server 4173
```

Luego abrir `http://localhost:4173`.

## Características

- Splash inicial con branding.
- Buscador y filtros por categoría generados desde el JSON.
- Carrito persistente en `localStorage`.
- Datos del cliente persistidos en `localStorage`.
- Cálculo automático de subtotal y total.
- Validación básica de checkout.
- Envío del pedido a WhatsApp con mensaje estructurado.

## Sin backend

Este proyecto no usa:

- PHP
- Base de datos
- Frameworks de servidor

Ideal para prototipos rápidos, landing de pedidos o MVPs de restaurantes.
