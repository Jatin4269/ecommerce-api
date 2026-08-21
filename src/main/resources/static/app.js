const PRODUCTS = [
    {
        id: 9,
        tier: "TIER 1",
        name: "FROGGIE",
        price: 279,
        desc: "A tiny Bauhaus frog who has never once been asked how he's doing. Sits on your shelf, judges your life choices in silence, never leaves.",
        specs: [["Personality", "Unbothered"], ["Skills", "Sitting"], ["Will it fight you", "No, but it wants to"]],
        images: [
            "images/froggie-1.jpeg",
            "images/froggie-2-front.jpeg",
            "images/froggie-3-side.jpeg",
            "images/froggie-4-rear.jpeg",
            "images/froggie-5-chassis.jpeg"
        ]
    },
    {
        id: 10,
        tier: "TIER 2",
        name: "PIKA WHISTLE",
        price: 199,
        desc: "Technically a whistle. Spiritually a cry for attention. Blow it once and every Pokémon fan in a 50m radius will make eye contact with you.",
        specs: [["Volume", "Regrettable"], ["Friends made", "0"], ["Enemies made", "Several"]],
        images: [
            "images/pika-1.jpeg",
            "images/pika-2-front.jpeg",
            "images/pika-3-side.jpeg",
            "images/pika-4-back.jpeg",
            "images/pika-5-bottom.jpeg"
        ]
    },
    {
        id: 3,
        tier: "TIER 3",
        name: "CLIPPER",
        price: 240,
        desc: "Tropical print, questionable life choices. Will disappear from your pocket at every party and somehow always come back to someone else's.",
        specs: [["Loyalty", "None"], ["Aesthetic", "Vacation you can't afford"], ["Vibe", "Immaculate"]],
        images: [
            "images/clipper-1.jpeg",
            "images/clipper-2.jpeg",
            "images/clipper-3.jpeg",
            "images/clipper-4.jpeg"
        ]
    },
    {
        id: 11,
        tier: "TIER 4",
        name: "CHE BAND",
        price: 119,
        desc: "Instant main-character energy for your wrist. Radicalizes no one, but the aesthetic is doing a lot of heavy lifting.",
        specs: [["Politics", "Wrist-deep only"], ["Comfort", "Suspiciously high"], ["Revolution status", "Pending"]],
        images: [
            "images/che-1.jpeg",
            "images/che-2.jpeg",
            "images/che-3.jpeg",
            "images/che-4.jpeg"
        ]
    }
];

let cart = [];
let activeProduct = null;
let currentQty = 1;

const wall = document.getElementById("wall");
const room = document.getElementById("room");
const backdrop = document.getElementById("backdrop");
const drawer = document.getElementById("drawer");
const drawerBack = document.getElementById("drawerBack");
const drawerEyebrow = document.getElementById("drawerEyebrow");
const drawerTitle = document.getElementById("drawerTitle");
const drawerPrice = document.getElementById("drawerPrice");
const drawerDesc = document.getElementById("drawerDesc");
const drawerSpecs = document.getElementById("drawerSpecs");
const gallery = document.getElementById("gallery");
const galleryDots = document.getElementById("galleryDots");
const qtyValue = document.getElementById("qtyValue");
const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const addToCartBtn = document.getElementById("addToCart");
const drawerAdded = document.getElementById("drawerAdded");

const cartToggle = document.getElementById("cartToggle");
const cartPanel = document.getElementById("cartPanel");
const cartClose = document.getElementById("cartClose");
const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartFooter = document.getElementById("cartFooter");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const checkoutBtn = document.getElementById("checkoutBtn");

function money(n){ return "₹" + n.toLocaleString("en-IN"); }

function zoomToProduct(el, product){
    const roomRect = room.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const elCenterX = elRect.left + elRect.width / 2;
    const elCenterY = elRect.top + elRect.height / 2;
    const roomCenterX = roomRect.left + roomRect.width / 2;
    const roomCenterY = roomRect.top + roomRect.height / 2;

    const scale = 1.8;
    const offsetX = roomCenterX - elCenterX;
    const offsetY = roomCenterY - elCenterY;

    wall.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    backdrop.classList.add("active");

    activeProduct = product;
    currentQty = 1;
    qtyValue.textContent = "1";
    populateDrawer(product);

    requestAnimationFrame(() => {
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
    });
}

function resetZoom(){
    wall.style.transform = "translate(0,0) scale(1)";
    if (!cartPanel.classList.contains("open")) backdrop.classList.remove("active");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawerAdded.classList.remove("show");
    activeProduct = null;
}

function populateDrawer(product){
    drawerEyebrow.textContent = product.tier;
    drawerTitle.textContent = product.name;
    drawerPrice.textContent = money(product.price);
    drawerDesc.textContent = product.desc;
    drawerSpecs.innerHTML = product.specs
        .map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`)
        .join("");

    const slides = product.images.length > 0
        ? product.images.map(src => `<img src="${src}" alt="${product.name}">`)
        : ["ph-yellow", "ph-red", "ph-blue"].map(cls => `<div class="gph ${cls}"><div class="ph-shape ph-circle"></div></div>`);

    gallery.innerHTML = slides.join("");
    galleryDots.innerHTML = slides.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("");

    const dots = galleryDots.querySelectorAll("span");
    gallery.onscroll = () => {
        const idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
        dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    };
}

document.querySelectorAll(".product-slot").forEach(slot => {
    slot.addEventListener("click", () => {
        const idx = Number(slot.dataset.product);
        zoomToProduct(slot, PRODUCTS[idx]);
    });
});

drawerBack.addEventListener("click", resetZoom);
backdrop.addEventListener("click", () => {
    resetZoom();
    closeCart();
});

qtyMinus.addEventListener("click", () => {
    if (currentQty > 1) { currentQty--; qtyValue.textContent = currentQty; }
});
qtyPlus.addEventListener("click", () => {
    currentQty++; qtyValue.textContent = currentQty;
});

addToCartBtn.addEventListener("click", () => {
    if (!activeProduct) return;
    const existing = cart.find(c => c.id === activeProduct.id);
    if (existing) existing.qty += currentQty;
    else cart.push({ id: activeProduct.id, name: activeProduct.name, price: activeProduct.price, qty: currentQty });

    renderCart();
    drawerAdded.classList.add("show");
    setTimeout(() => drawerAdded.classList.remove("show"), 1600);
});

function renderCart(){
    cartCount.textContent = cart.reduce((sum, c) => sum + c.qty, 0);

    if (cart.length === 0){
        cartItems.innerHTML = "";
        cartEmpty.classList.remove("hide");
        cartFooter.classList.add("hide");
        return;
    }

    cartEmpty.classList.add("hide");
    cartFooter.classList.remove("hide");

    cartItems.innerHTML = cart.map(c => `
    <div class="cart-row" data-id="${c.id}">
      <div class="cart-row-thumb"></div>
      <div class="cart-row-info">
        <div class="cart-row-name">${c.name}</div>
        <div class="cart-row-meta">${money(c.price)} × ${c.qty}</div>
      </div>
      <button class="cart-row-remove" data-remove="${c.id}">REMOVE</button>
    </div>
  `).join("");

    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    cartTotal.textContent = money(total);

    cartItems.querySelectorAll("[data-remove]").forEach(btn => {
        btn.addEventListener("click", () => {
            cart = cart.filter(c => c.id !== Number(btn.dataset.remove));
            renderCart();
        });
    });
}

function openCart(){
    cartPanel.classList.add("open");
    cartPanel.setAttribute("aria-hidden", "false");
    backdrop.classList.add("active");
}
function closeCart(){
    cartPanel.classList.remove("open");
    cartPanel.setAttribute("aria-hidden", "true");
    if (!activeProduct) backdrop.classList.remove("active");
}

cartToggle.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);

checkoutBtn.addEventListener("click", () => {
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    window.location.href = "checkout.html";
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape"){ resetZoom(); closeCart(); }
});

renderCart();