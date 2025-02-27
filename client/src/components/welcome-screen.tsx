import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { WeightRecord, Challenge, Participant } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { TrendingDown, Trophy, Target, Dumbbell } from "lucide-react";

export function WelcomeScreen() {
  const { user } = useAuth();

  console.log("Welcome Screen mounted, user:", user);

  const { data: weightRecords = [], isLoading: isLoadingWeight, error: weightError } = useQuery<WeightRecord[]>({
    queryKey: [`/api/users/${user?.id}/weight-records`],
    enabled: !!user,
  });

  const { data: participations = [], isLoading: isLoadingParticipations, error: participationsError } = useQuery<Participant[]>({
    queryKey: [`/api/users/${user?.id}/participations`],
    enabled: !!user,
  });

  console.log("Weight Records:", weightRecords);
  console.log("Participations:", participations);

  if (weightError || participationsError) {
    console.error("Weight Error:", weightError);
    console.error("Participations Error:", participationsError);
  }

  // Calculate weight loss progress
  const sortedRecords = [...weightRecords].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const initialWeight = sortedRecords[0]?.weight;
  const currentWeight = sortedRecords[sortedRecords.length - 1]?.weight;
  const weightChange = initialWeight && currentWeight 
    ? Number(currentWeight) - Number(initialWeight)
    : 0;

  const achievements = [
    {
      icon: <Dumbbell className="h-8 w-8" />,
      title: "Active Challenges",
      value: participations.filter(p => p.userId === user?.id).length,
      color: "text-blue-500",
    },
    {
      icon: <TrendingDown className="h-8 w-8" />,
      title: "Weight Progress",
      value: `${Math.abs(weightChange).toFixed(1)} lbs`,
      description: weightChange <= 0 ? "Lost" : "Gained",
      color: weightChange <= 0 ? "text-green-500" : "text-red-500",
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Weigh-ins",
      value: weightRecords.length,
      color: "text-yellow-500",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Latest Weight",
      value: `${currentWeight || 0} lbs`,
      description: format(new Date(sortedRecords[sortedRecords.length - 1]?.recordedAt || new Date()), 'MMM d'),
      color: "text-purple-500",
    },
  ];

  if (isLoadingWeight || isLoadingParticipations) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-lg p-6 text-center">
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-card rounded-lg shadow-xl max-w-2xl w-full p-6"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-center mb-8"
          >
            Welcome Back, {user?.username}!
          </motion.h1>

          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`${achievement.color}`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {achievement.title}
                      </p>
                      <p className="text-2xl font-bold">
                        {achievement.value}
                      </p>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground">
              Click anywhere to continue
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}