import { z } from "zod";

export const errandSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  title: z.string().min(4, "Give your errand a short, clear title").max(80),
  description: z.string().min(10, "Add a bit more detail so runners know what's involved").max(1000),
  pickupLocation: z.string().min(3, "Enter a pickup location"),
  destination: z.string().min(3, "Enter a destination"),
  budget: z.coerce
    .number({ invalid_type_error: "Enter a budget amount" })
    .min(500, "Minimum budget is ₦500"),
  urgency: z.enum(["low", "normal", "urgent"]),
  preferredDate: z.string().optional(),
});

export type ErrandInput = z.infer<typeof errandSchema>;
