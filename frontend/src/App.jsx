import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Storefront       from "./pages/Storefront.jsx";
import ProductPage     from "./pages/ProductPage.jsx";
import CollectionPage   from "./pages/CollectionPage.jsx";
import Checkout         from "./pages/Checkout.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";

import AdminLogin   from "./pages/admin/Login.jsx";
import AdminLayout  from "./pages/admin/AdminLayout.jsx";
import Dashboard    from "./pages/admin/Dashboard.jsx";
import Products     from "./pages/admin/Products.jsx";
import Collections  from "./pages/admin/Collections.jsx";
import Orders       from "./pages/admin/Orders.jsx";
import { Customers, Discounts, Banners, Settings, Reviews, AdManager } from "./pages/admin/AdminPages.jsx";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Storefront */}
          <Route path="/"                   element={<Storefront />} />
          <Route path="/collection/:id"     element={<CollectionPage />} />
          <Route path="/product/:id"         element={<ProductPage />} />
          <Route path="/checkout"           element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login"               element={<AdminLogin />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index                element={<Dashboard />} />
            <Route path="products"      element={<Products />} />
            <Route path="collections"   element={<Collections />} />
            <Route path="orders"        element={<Orders />} />
            <Route path="customers"     element={<Customers />} />
            <Route path="discounts"     element={<Discounts />} />
            <Route path="banners"       element={<Banners />} />
            <Route path="settings"      element={<Settings />} />
            <Route path="reviews"       element={<Reviews />} />
            <Route path="ads"           element={<AdManager />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
