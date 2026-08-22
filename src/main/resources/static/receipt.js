function money(n){ return "₹" + n.toLocaleString("en-IN"); }

const wrap = document.getElementById("receiptWrap");
const order = JSON.parse(sessionStorage.getItem("lastOrder") || "null");

if (!order){
    wrap.innerHTML = `
    <div class="no-order">
      NOTHING TO SHOW HERE.<br>
      <a href="index.html">Go buy something first.</a>
    </div>
  `;
} else {

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const itemRows = order.items.map(i => `
    <div class="rp-item">
      <span class="rp-item-name">${i.name.toUpperCase()}<br><span class="rp-item-meta">${money(i.price)} × ${i.qty}</span></span>
      <span>${money(i.price * i.qty)}</span>
    </div>
  `).join("");

    const maskedPaymentId = order.paymentId
        ? order.paymentId.slice(0, 8) + "••••" + order.paymentId.slice(-4)
        : "N/A";

    wrap.innerHTML = `
    <a class="status-back" href="index.html" style="align-self:flex-start; margin-bottom:16px;">&larr; SHELF</a>

    <div class="status-card">
      <div class="status-top">
        <span class="status-plan">SHELF STEAL — ORDER #${order.orderId}</span>
        <span class="status-badge">PAID</span>
      </div>
      <div class="status-row">
        <span class="status-label">Total charged</span>
        <span class="status-total">${money(order.total)}</span>
      </div>
      <div class="status-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M4 12l5 5L20 6"/>
        </svg>
        ORDER COMPLETE
      </div>
    </div>

    <div class="receipt-stage">
      <div class="receipt-paper">
        <div class="rp-logo">SHELF STEAL</div>
        <div class="rp-sub">TAP SOMETHING. COMMIT TO NOTHING. (YET)</div>

        <div class="rp-line"><span>DATE</span><span>${dateStr}</span></div>
        <div class="rp-line"><span>TIME</span><span>${timeStr}</span></div>
        <div class="rp-line"><span>ORDER</span><span>#${order.orderId}</span></div>
        <div class="rp-line"><span>PAID WITH</span><span>•••• (TEST)</span></div>

        <hr class="rp-divider">

        ${itemRows}

        <hr class="rp-divider">

        <div class="rp-total-row"><span>TOTAL PAID</span><span>${money(order.total)}</span></div>

        <div class="rp-barcode"></div>
        <div class="rp-barcode-num">${maskedPaymentId}</div>

        <div class="rp-footer-note">
          No refunds. No regrets.<br>
          Thanks for feeding the shelf.
        </div>
      </div>
    </div>

    <div class="receipt-actions">
      <a class="rc-btn primary" href="index.html">BACK TO SHELF</a>
    </div>
  `;

    // Clear the order from session storage so refreshing doesn't re-show a stale receipt indefinitely,
    // but do it after render so the current view still works.
    sessionStorage.removeItem("lastOrder");
}