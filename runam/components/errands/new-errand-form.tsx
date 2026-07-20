"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { errandSchema, type ErrandInput } from "@/lib/validations/errand";
import { createErrand } from "@/lib/actions/errands";

export function NewErrandForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ErrandInput>({
    resolver: zodResolver(errandSchema),
    defaultValues: { urgency: "normal" },
  });

  async function onSubmit(values: ErrandInput) {
    setServerError(null);
    setIsSubmitting(true);
    const result = await createErrand(values);
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push(`/errands/${result.errand.id}`);
  }

  return (
    <Card>
      {serverError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Input
          label="Title"
          placeholder="e.g. Pick up documents from Ikeja GRA"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          label="Description"
          placeholder="Give the runner everything they need to know — contact person, what to say, timing constraints..."
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Pickup location"
            placeholder="e.g. 14 Adeola Odeku St, VI"
            error={errors.pickupLocation?.message}
            {...register("pickupLocation")}
          />
          <Input
            label="Destination"
            placeholder="e.g. Lekki Phase 1"
            error={errors.destination?.message}
            {...register("destination")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Budget (₦)"
            type="number"
            placeholder="3000"
            error={errors.budget?.message}
            {...register("budget")}
          />
          <Select label="Urgency" error={errors.urgency?.message} {...register("urgency")}>
            <option value="low">Low — anytime this week</option>
            <option value="normal">Normal — today</option>
            <option value="urgent">Urgent — ASAP</option>
          </Select>
        </div>

        <Input
          label="Preferred date (optional)"
          type="date"
          error={errors.preferredDate?.message}
          {...register("preferredDate")}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Post Errand
        </Button>
      </form>
    </Card>
  );
}
