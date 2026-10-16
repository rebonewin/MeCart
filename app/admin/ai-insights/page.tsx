import { getDashboardStats, getTopProducts, getTrafficSeries } from "@/lib/repositories/analytics";
import { getCustomerStats } from "@/lib/repositories/customers";
import { getInventoryStats, listInventory } from "@/lib/repositories/inventory";
import { getMonthlyRevenueSeries, getOrderStats } from "@/lib/repositories/orders";
import { getReviewStats } from "@/lib/repositories/reviews";
import { AiInsightsView, type AiInsightsData } from "@/components/admin/ai-insights-view";

export const dynamic = "force-dynamic";

export default async function AiInsightsPage() {
  const [dashboard, orderStats, customerStats, inventoryStats, inventory, reviewStats, topProducts, monthly, traffic] =
    await Promise.all([
      getDashboardStats(),
      getOrderStats(),
      getCustomerStats(),
      getInventoryStats(),
      listInventory(),
      getReviewStats(),
      getTopProducts(5),
      getMonthlyRevenueSeries(6),
      getTrafficSeries(14),
    ]);

  const topProduct = topProducts[0] ?? null;
  const restockCandidate = inventory.find((item) => item.quantity <= item.lowStockThreshold) ?? null;

  const data: AiInsightsData = {
    revenueChangePct: dashboard.revenueChangePct,
    ordersChangePct: dashboard.ordersChangePct,
    totalRevenue: orderStats.totalRevenue,
    totalOrders: orderStats.totalOrders,
    pendingOrders: orderStats.pendingOrders,
    lowStock: inventoryStats.lowStock,
    outOfStock: inventoryStats.outOfStock,
    totalInventoryItems: inventoryStats.totalItems,
    totalCustomers: customerStats.total,
    activeCustomers: customerStats.active,
    newCustomersThisMonth: customerStats.newThisMonth,
    pendingReviews: reviewStats.pending,
    averageRating: reviewStats.averageRating,
    topProductName: topProduct?.name ?? null,
    topProductUnits: topProduct?.units ?? 0,
    restockItem: restockCandidate
      ? { name: restockCandidate.productName, quantity: restockCandidate.quantity }
      : null,
    trafficEvents: traffic.reduce((sum, point) => sum + point.events, 0),
    trafficOrders: traffic.reduce((sum, point) => sum + point.orders, 0),
    revenueSeries: monthly.map((month) => ({ label: month.label, revenue: month.revenue, orders: month.orders })),
    generatedAtLabel: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  return <AiInsightsView data={data} />;
}
