import type { OrderStatus, PaymentStatus } from "@/types/database";

export type TrackingStageId =
  | "processing"
  | "packed"
  | "shipped"
  | "out-for-delivery"
  | "delivered";

export type TrackingStageState = "complete" | "current" | "upcoming";

export type TrackingStage = {
  id: TrackingStageId;
  label: string;
  description: string;
  state: TrackingStageState;
  timestamp?: string;
  timestampLabel?: string;
};

export type TrackingOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  zip: string;
  grandTotal: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  items: { id: string; name: string; sku: string; quantity: number; size: string | null; color: string | null; price: number; total: number }[];
};

const STAGES: Omit<TrackingStage, "state" | "timestamp" | "timestampLabel">[] = [
  {
    id: "processing",
    label: "Processing",
    description: "Your pieces are being checked, wrapped and prepared in the atelier.",
  },
  {
    id: "packed",
    label: "Packed",
    description: "Sealed, labelled and waiting for MECO at the dispatch door.",
  },
  {
    id: "shipped",
    label: "Shipped",
    description: "MECO has collected the parcel and it is moving through the network.",
  },
  {
    id: "out-for-delivery",
    label: "Out for delivery",
    description: "The final mile — MECO is heading to your door with the parcel.",
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Handed over with care. The atelier would love to hear what you think.",
  },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  PROCESSING: 0,
  PACKED: 1,
  SHIPPED: 2,
  DELIVERED: 5,
  CANCELLED: -1,
  RETURNED: 5,
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed",
  PROCESSING: "In the atelier",
  PACKED: "Packed",
  SHIPPED: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const STATUS_COPY: Record<OrderStatus, string> = {
  PENDING: "We have your order. The atelier is preparing the first check.",
  CONFIRMED: "Your order is confirmed and moving into the atelier queue.",
  PROCESSING: "The atelier is checking, wrapping and labelling your pieces.",
  PACKED: "Your parcel is sealed and waiting for MECO's collection.",
  SHIPPED: "MECO is carrying your parcel. The next scan will be the final mile.",
  DELIVERED: "Delivered. We hope the unboxing feels like a small event.",
  CANCELLED: "This order was cancelled. If this is unexpected, contact the atelier.",
  RETURNED: "The return has been received back at the atelier.",
};

export function deriveTracking(order: Pick<TrackingOrder, "status" | "createdAt" | "updatedAt">) {
  const index = STATUS_INDEX[order.status];
  const halted = order.status === "CANCELLED" || order.status === "RETURNED";
  const delivered = order.status === "DELIVERED";

  const stages: TrackingStage[] = STAGES.map((stage, stageIndex) => {
    let state: TrackingStageState = "upcoming";
    if (halted) {
      state = "upcoming";
    } else if (delivered) {
      state = "complete";
    } else if (stageIndex < index) {
      state = "complete";
    } else if (stageIndex === index) {
      state = "current";
    }

    let timestamp: string | undefined;
    let timestampLabel: string | undefined;
    if (stage.id === "processing" && (state === "complete" || state === "current")) {
      timestamp = order.createdAt;
      timestampLabel = "Placed";
    } else if (stage.id === "delivered" && state === "complete") {
      timestamp = order.updatedAt;
      timestampLabel = "Delivered";
    } else if (state === "current") {
      timestamp = order.updatedAt;
      timestampLabel = "Updated";
    } else if (state === "complete") {
      timestampLabel = "Cleared";
    }

    return { ...stage, state, timestamp, timestampLabel };
  });

  const currentStage =
    stages.find((stage) => stage.state === "current") ??
    (delivered ? stages[stages.length - 1] : stages[0]);

  const eta = new Date(order.createdAt);
  eta.setDate(eta.getDate() + 5);

  return {
    stages,
    currentStage,
    currentIndex: index,
    halted,
    delivered,
    inTransit: order.status === "SHIPPED",
    progress: delivered ? 100 : halted ? 0 : Math.round((Math.max(index, 0) / (STAGES.length - 1)) * 100),
    statusLabel: STATUS_LABEL[order.status],
    statusCopy: STATUS_COPY[order.status],
    estimatedDelivery: delivered ? order.updatedAt : eta.toISOString(),
    lastUpdated: order.updatedAt,
  };
}
