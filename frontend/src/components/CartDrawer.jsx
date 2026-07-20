import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { img, rupee } from "../data/content.js";

export default function CartDrawer() {
  const cart = useCart();
  const navigate = useNavigate();

  if (!cart.isOpen) return null;

  const goCheckout = () => {
    cart.setIsOpen(false);
    navigate("/checkout");
  };

  return (
    <div className="cart-overlay" onClick={() => cart.setIsOpen(false)}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-head">
          <h3>Your Bag ({cart.count})</h3>
          <button onClick={() => cart.setIsOpen(false)}><X size={20} /></button>
        </div>
        <div className="cart-items">
          {cart.items.length === 0 && <div className="cart-empty">Your bag is empty. Add a saree you love.</div>}
          {cart.items.map(item => (
            <div className="cart-item" key={item.productId}>
              <img src={img(item.seed, 200, 260)} alt={item.name} />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p>{rupee(item.price)}</p>
                <div className="cart-qty">
                  <button onClick={() => cart.updateQty(item.productId, item.qty - 1)}><Minus size={12} /></button>
                  <span>{item.qty}</span>
                  <button onClick={() => cart.updateQty(item.productId, item.qty + 1)}><Plus size={12} /></button>
                  <button className="cart-item-remove" onClick={() => cart.removeItem(item.productId)}>Remove</button>
                </div>
              </div>
              <div className="cart-item-price">{rupee(item.price * item.qty)}</div>
            </div>
          ))}
        </div>
        {cart.items.length > 0 && (
          <div className="cart-foot">
            <div className="cart-row total"><span>Subtotal</span><span>{rupee(cart.subtotal)}</span></div>
            <p style={{ fontSize: 11, color: "#8a7a68", marginTop: 4 }}>Shipping & taxes calculated at checkout.</p>
            <button className="btn-gold" onClick={goCheckout}>Proceed to Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}
