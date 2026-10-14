import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8),
  shippingAddress: z.string().min(5),
  billingAddress: z.string().optional().or(z.literal("")),
  city: z.string().min(2),
  zip: z.string().min(4),
  paymentMethod: z.enum(["COD", "UPI", "CARD", "NETBANKING"]),
  cardHolder: z.string().optional().or(z.literal("")),
  cardNumber: z.string().optional().or(z.literal("")),
  expiryMonth: z.string().optional().or(z.literal("")),
  expiryYear: z.string().optional().or(z.literal("")),
  cvv: z.string().optional().or(z.literal("")),
  upiId: z.string().optional().or(z.literal("")),
  bank: z.string().optional().or(z.literal("")),
  couponCode: z.string().optional().or(z.literal("")),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      size: z.string().optional().or(z.literal("")),
      color: z.string().optional().or(z.literal("")),
      price: z.number().positive(),
      coverImage: z.string().optional(),
    }),
  ).min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
