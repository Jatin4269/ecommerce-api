// ---- CONFIG ----
// Razorpay's public Key ID is safe to expose in frontend code — it is NOT the secret.
// Replace this with your actual test Key ID from the Razorpay dashboard.
const RAZORPAY_KEY_ID = "rzp_test_TRWZS1FEGUuoaG";
const API_BASE = "http://localhost:8080";

const cart = JSON.parse(sessionStorage.getItem("checkoutCart") || "[]");
let authToken = sessionStorage.getItem("authToken") || null;
let userEmail = sessionStorage.getItem("userEmail") || null;

const emptyState = document.getElementById("emptyState");
const checkoutFlow = document.getElementById("checkoutFlow");
const summaryRows = document.getElementById("summaryRows");
const summaryTotal = document.getElementById("summaryTotal");

const authCard = document.getElementById("authCard");
const payCard = document.getElementById("payCard");
const loggedInAs = document.getElementById("loggedInAs");
const payAmount = document.getElementById("payAmount");
const payBtn = document.getElementById("payBtn");
const payError = document.getElementById("payError");

const loginFields = document.getElementById("loginFields");
const registerFields = document.getElementById("registerFields");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const regName = document.getElementById("regName");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const registerBtn = document.getElementById("registerBtn");
const registerError = document.getElementById("registerError");

function money(n){ return "₹" + n.toLocaleString("en-IN"); }

function renderSummary(){
    if (cart.length === 0){
        emptyState.style.display = "block";
        checkoutFlow.style.display = "none";
        return;
    }
    emptyState.style.display = "none";
    checkoutFlow.style.display = "block";

    summaryRows.innerHTML = cart.map(c => `
    <div class="co-row">
      <span>${c.name} × ${c.qty}</span>
      <span>${money(c.price * c.qty)}</span>
    </div>
  `).join("");

    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    summaryTotal.textContent = money(total);
    payAmount.textContent = money(total);
}

function showPayCard(){
    authCard.style.display = "none";
    payCard.style.display = "block";
    loggedInAs.textContent = "LOGGED IN AS " + userEmail.toUpperCase();
}

showRegister.addEventListener("click", () => {
    loginFields.style.display = "none";
    registerFields.style.display = "block";
    document.getElementById("authHeading").textContent = "CREATE ACCOUNT";
});
showLogin.addEventListener("click", () => {
    registerFields.style.display = "none";
    loginFields.style.display = "block";
    document.getElementById("authHeading").textContent = "LOG IN TO PAY";
});

loginBtn.addEventListener("click", async () => {
    loginError.classList.remove("show");
    loginBtn.disabled = true;
    loginBtn.textContent = "LOGGING IN...";

    try{
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginEmail.value, password: loginPassword.value })
        });

        if (!res.ok) throw new Error("bad credentials");

        const data = await res.json();
        authToken = data.token;
        userEmail = loginEmail.value;
        sessionStorage.setItem("authToken", authToken);
        sessionStorage.setItem("userEmail", userEmail);
        showPayCard();
    } catch(err){
        loginError.classList.add("show");
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "LOG IN";
    }
});

registerBtn.addEventListener("click", async () => {
    registerError.classList.remove("show");
    registerBtn.disabled = true;
    registerBtn.textContent = "CREATING...";

    try{
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: regName.value, email: regEmail.value, password: regPassword.value })
        });

        if (!res.ok) throw new Error("register failed");

        // auto-login right after registering
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: regEmail.value, password: regPassword.value })
        });
        const data = await loginRes.json();
        authToken = data.token;
        userEmail = regEmail.value;
        sessionStorage.setItem("authToken", authToken);
        sessionStorage.setItem("userEmail", userEmail);
        showPayCard();
    } catch(err){
        registerError.classList.add("show");
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = "CREATE ACCOUNT";
    }
});

payBtn.addEventListener("click", async () => {
    payError.classList.remove("show");
    payBtn.disabled = true;
    payBtn.textContent = "PREPARING...";

    try{
        const payload = cart.map(c => ({ productId: c.id, quantity: c.qty }));

        const res = await fetch(`${API_BASE}/api/checkout/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authToken
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("order creation failed");
        const order = await res.json();

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "Shelf Steal",
            description: "Order #" + order.internalOrderId,
            order_id: order.razorpayOrderId,
            handler: async function(response){
                await verifyPayment(response, order);
            },
            prefill: { email: userEmail },
            theme: { color: "#17140f" },
            modal: {
                ondismiss: function(){
                    payBtn.disabled = false;
                    payBtn.textContent = "PAY " + payAmount.textContent;
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch(err){
        payError.classList.add("show");
        payBtn.disabled = false;
        payBtn.textContent = "PAY " + payAmount.textContent;
    }
});

async function verifyPayment(response, order){
    try{
        const verifyRes = await fetch(`${API_BASE}/api/checkout/verify-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + authToken
            },
            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            })
        });

        if (!verifyRes.ok) throw new Error("verification failed");

        sessionStorage.setItem("lastOrder", JSON.stringify({
            items: cart,
            total: cart.reduce((sum, c) => sum + c.price * c.qty, 0),
            orderId: order.internalOrderId,
            paymentId: response.razorpay_payment_id
        }));
        sessionStorage.removeItem("checkoutCart");
        window.location.href = "receipt.html";
    } catch(err){
        payError.classList.add("show");
        payBtn.disabled = false;
        payBtn.textContent = "PAY " + payAmount.textContent;
    }
}

// If already logged in from a previous step this session, skip straight to pay card
if (authToken && userEmail){
    renderSummary();
    if (cart.length > 0) showPayCard();
} else {
    renderSummary();
}

const checkoutLogoutBtn = document.getElementById("checkoutLogoutBtn");
function updateCheckoutLogoutVisibility(){
    checkoutLogoutBtn.style.display = sessionStorage.getItem("authToken") ? "inline-block" : "none";
}
checkoutLogoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userEmail");
    authToken = null;
    userEmail = null;
    payCard.style.display = "none";
    authCard.style.display = "block";
    updateCheckoutLogoutVisibility();
});
updateCheckoutLogoutVisibility();