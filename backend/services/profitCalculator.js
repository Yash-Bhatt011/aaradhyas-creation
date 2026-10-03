function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function computeOrderProfit(order, settings = {}) {
  const gstInclusive = settings.gstInclusive !== false;
  const defaultGstPct = Number(settings.defaultGstPct) || 5;
  const paymentGatewayPct = Number(settings.paymentGatewayPct) || 2.36;

  const items = order.items || [];

  let grossItemRevenue = 0, taxableRevenue = 0, gstCollected = 0, itemCost = 0;

  items.forEach(item => {
    const lineRevenue = Number(item.price) * Number(item.qty);
    const gstPct = Number(item.gstPct ?? defaultGstPct) || 0;
    const lineCost = Number(item.cost ?? 0) * Number(item.qty);

    let lineTaxable, lineGst;
    if (gstInclusive) {
      lineTaxable = lineRevenue / (1 + gstPct / 100);
      lineGst = lineRevenue - lineTaxable;
    } else {
      lineTaxable = lineRevenue;
      lineGst = lineRevenue * (gstPct / 100);
    }

    grossItemRevenue += lineRevenue;
    taxableRevenue += lineTaxable;
    gstCollected += lineGst;
    itemCost += lineCost;
  });

  const discount = Number(order.discount) || 0;
  const shippingCharged = Number(order.shipping) || 0;

  const isPaidOnline = order.paymentMethod === "razorpay" && order.paymentStatus === "paid";
  const paymentGatewayFee = isPaidOnline ? round2(order.total * (paymentGatewayPct / 100)) : 0;

  const refundedAmount = order.cancellation?.refund?.status === "processed"
    ? Number(order.cancellation.refund.amount) || 0
    : 0;

  const isCancelled = order.status === "cancelled";

  const netRevenue = isCancelled ? 0 : (order.total - refundedAmount);
  const netCost = isCancelled ? 0 : itemCost;
  const netGst = isCancelled ? 0 : gstCollected;
  const netPaymentFee = isCancelled ? 0 : paymentGatewayFee;
  const shippingCost = isCancelled ? 0 : (Number(settings.actualShippingCostPerOrder) || 0);

  const netProfit = round2(netRevenue - netGst - netCost - netPaymentFee - shippingCost);
  const marginPct = netRevenue > 0 ? round2((netProfit / netRevenue) * 100) : 0;

  return {
    orderId: order.id, orderNumber: order.orderNumber, status: order.status, isCancelled,
    grossItemRevenue: round2(grossItemRevenue), discount: round2(discount),
    shippingCharged: round2(shippingCharged), orderTotal: round2(order.total),
    taxableRevenue: round2(taxableRevenue), gstCollected: round2(gstCollected),
    itemCost: round2(itemCost), paymentGatewayFee: round2(paymentGatewayFee),
    refundedAmount: round2(refundedAmount), netRevenue: round2(netRevenue),
    netProfit, marginPct, gstMode: gstInclusive ? "inclusive" : "exclusive"
  };
}

function computeProfitSummary(orders = [], settings = {}, range = {}) {
  let filtered = orders;
  if (range.from) filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(range.from));
  if (range.to)   filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(range.to + "T23:59:59"));

  const perOrder = filtered.map(o => computeOrderProfit(o, settings));
  const active = perOrder.filter(p => !p.isCancelled);
  const cancelled = perOrder.filter(p => p.isCancelled);
  const sum = (arr, key) => round2(arr.reduce((s, x) => s + x[key], 0));

  return {
    range, orderCount: filtered.length, activeOrderCount: active.length, cancelledOrderCount: cancelled.length,
    totals: {
      grossRevenue: sum(active, "orderTotal"), gstCollected: sum(active, "gstCollected"),
      itemCost: sum(active, "itemCost"), paymentGatewayFees: sum(active, "paymentGatewayFee"),
      refundedFromCancellations: sum(perOrder, "refundedAmount"), netProfit: sum(active, "netProfit"),
    },
    averageMarginPct: active.length ? round2(active.reduce((s, x) => s + x.marginPct, 0) / active.length) : 0,
    orders: perOrder
  };
}

module.exports = { computeOrderProfit, computeProfitSummary };
