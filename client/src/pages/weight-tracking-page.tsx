import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";
import { WeightForm } from "@/components/weight-form";
import { WeightHistory } from "@/components/weight-history";

interface Params {
  id: string;
}

export default function WeightTrackingPage() {
  const { user } = useAuth();
  const [, params] = useParams<Params>();
  const challengeId = parseInt(params.id);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Weight Tracking</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <WeightForm challengeId={challengeId} />
        <WeightHistory challengeId={challengeId} userId={user.id} />
      </div>
    </div>
  );
}