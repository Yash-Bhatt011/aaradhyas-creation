import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "../components/shared.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../api/client.js";
import { img, rupee } from "../data/content.js";
import "../styles/storefront.css";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const FREE_SHIPPING_THRESHOLD = 25000;
const STANDARD_SHIPPING = 199;

export default function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(null);
  const [couponMsg, setCouponMsg] = useState(null);
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { if (cart.items.length === 0) navigate("/"); }, 200); return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const shipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD || cart.subtotal === 0 ? 0 : STANDARD_SHIPPING;
  const discountAmount = discount
    ? discount.type === "percentage" ? Math.round((cart.subtotal * discount.value) / 100) : discount.value
    : 0;
  const total = Math.max(0, cart.subtotal + shipping - discountAmount);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await api.validateDiscount(coupon.trim());
      setDiscount(res.discount);
      setCouponMsg({ ok: true, text: `"${res.discount.code}" applied!` });
    } catch (e) {
      setDiscount(null);
      setCouponMsg({ ok: false, text: e.message });
    }
  };

  const buildOrderPayload = (paymentStatus, extra = {}) => ({
    customer: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, state: form.state, pincode: form.pincode },
    items: cart.items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty, seed: i.seed })),
    subtotal: cart.subtotal,
    shipping,
    discount: discountAmount,
    total,
    couponCode: discount?.code || null,
    paymentMethod,
    paymentStatus,
    ...extra
  });

  const validateForm = () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.pincode) {
      setError("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const placeCodOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const order = await api.createOrder(buildOrderPayload("pending"));
      cart.clearCart();
      navigate("/order-confirmation", { state: { order } });
    } catch (e) {
      setError(e.message || "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const placeRazorpayOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const [keyInfo, rzpOrder, scriptLoaded] = await Promise.all([
        api.getRazorpayKey(),
        api.createRazorpayOrder(total, `rcpt_${Date.now()}`),
        loadRazorpayScript()
      ]);

      if (!scriptLoaded) {
        setError("Could not load the payment gateway. Please check your connection and try again.");
        setPlacing(false);
        return;
      }

      const options = {
        key: keyInfo.keyId || "rzp_test_mock", // mock key when not configured
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Aaradhya's Creation",
        description: "Order payment",
        order_id: rzpOrder.mock ? undefined : rzpOrder.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#C8A158" },
        handler: async (response) => {
          try {
            const verify = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || rzpOrder.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "mock_signature"
            });
            const order = await api.createOrder(
              buildOrderPayload(verify.verified ? "paid" : "pending", {
                razorpayOrderId: rzpOrder.id,
                razorpayPaymentId: response.razorpay_payment_id || null
              })
            );
            cart.clearCart();
            navigate("/order-confirmation", { state: { order } });
          } catch (e) {
            setError("Payment captured but order creation failed. Please contact support.");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false)
        }
      };

      if (rzpOrder.mock) {
        // No real Razorpay keys configured yet — simulate success so the flow
        // can be tested end-to-end. Replace by adding real keys to backend/.env
        const fakeResponse = {
          razorpay_order_id: rzpOrder.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature"
        };
        await options.handler(fakeResponse);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setError(e.message || "Could not start payment. Please try again.");
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;
    if (paymentMethod === "cod") placeCodOrder();
    else placeRazorpayOrder();
  };

  return (
    <div className="ac-root" style={{ background: "var(--ivory)", minHeight: "100vh" }}>
      <div style={{ padding: "20px 5vw", borderBottom: "1px solid var(--beige)" }}>
        <Link to="/" className="ac-logo" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <Logo size={32} />Aaradhya's Creation
        </Link>
      </div>

      <div className="checkout-wrap">
        <div className="checkout-form">
          <h2>Shipping Details</h2>
          {error && <div className="checkout-error">{error}</div>}
          <div className="checkout-field">
            <label>Full Name *</label>
            <input value={form.name} onChange={update("name")} placeholder="Priya Mehta" />
          </div>
          <div className="checkout-row">
            <div className="checkout-field">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={update("email")} placeholder="you@email.com" />
            </div>
            <div className="checkout-field">
              <label>Phone *</label>
              <input value={form.phone} onChange={update("phone")} placeholder="98765 43210" />
            </div>
          </div>
          <div className="checkout-field">
            <label>Address *</label>
            <input value={form.address} onChange={update("address")} placeholder="House no, street, area" />
          </div>
          <div className="checkout-row">
            <div className="checkout-field">
              <label>City *</label>
              <input value={form.city} onChange={update("city")} />
            </div>
            <div className="checkout-field">
              <label>State</label>
              <input value={form.state} onChange={update("state")} />
            </div>
          </div>
          <div className="checkout-field">
            <label>Pincode *</label>
            <input value={form.pincode} onChange={update("pincode")} />
          </div>

          <h2 style={{ marginTop: 18 }}>Payment Method</h2>
          <div className="checkout-payment">
            <div className={`pay-option ${paymentMethod === "razorpay" ? "active" : ""}`} onClick={() => setPaymentMethod("razorpay")}>
              Pay Online (Razorpay)
            </div>
            <div className={`pay-option ${paymentMethod === "cod" ? "active" : ""}`} onClick={() => setPaymentMethod("cod")}>
              Cash on Delivery
            </div>
          </div>

          <button className="btn-gold" style={{ marginTop: 10, width: "100%", textAlign: "center" }} disabled={placing} onClick={handlePlaceOrder}>
            {placing ? "Processing…" : paymentMethod === "cod" ? "Place Order (COD)" : `Pay ${rupee(total)} & Place Order`}
          </button>
        </div>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cart.items.map(item => (
            <div className="checkout-summary-item" key={item.productId}>
              <span>{item.name} × {item.qty}</span>
              <span>{rupee(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="checkout-coupon">
            <input placeholder="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value)} />
            <button onClick={applyCoupon}>Apply</button>
          </div>
          {couponMsg && <p className={`checkout-coupon-msg ${couponMsg.ok ? "ok" : "bad"}`}>{couponMsg.text}</p>}
          <div className="checkout-summary-item"><span>Subtotal</span><span>{rupee(cart.subtotal)}</span></div>
          <div className="checkout-summary-item"><span>Shipping</span><span>{shipping === 0 ? "Free" : rupee(shipping)}</span></div>
          {discountAmount > 0 && <div className="checkout-summary-item"><span>Discount</span><span>-{rupee(discountAmount)}</span></div>}
          <div className="checkout-summary-item" style={{ fontSize: 16, fontWeight: 600, border: "none", marginTop: 8 }}>
            <span>Total</span><span>{rupee(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
