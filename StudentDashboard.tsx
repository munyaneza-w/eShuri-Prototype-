import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

/**
 * Fetches performance data for the current user from Supabase.
 * @param userId The ID of the currently logged-in user.
 * @returns An object with performance metrics.
 */
const fetchStudentPerformance = async (userId: string) => {
  // Fetch total subjects available
  const { count: totalSubjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true });

  if (subjectsError) throw new Error(subjectsError.message);

  // Fetch quiz attempts for the specific user
  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("score, subject_id, duration_seconds") // Fetch duration
    .eq("user_id", userId);

  if (attemptsError) throw new Error(attemptsError.message);

  // Calculate performance metrics
  const quizzesTaken = attempts.length;

  // Calculate total time spent from all quiz attempts
  const totalTimeSpentSeconds = attempts.reduce(
    (sum, attempt) => sum + (attempt.duration_seconds || 0),
    0
  );

  const averageScore =
    quizzesTaken > 0
      ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizzesTaken
      : 0;

  // Calculate unique subjects the user has been tested in
  const subjectsCompleted = new Set(attempts.map((a) => a.subject_id)).size;

  return {
    totalSubjects: totalSubjects ?? 0,
    quizzesTaken,
    averageScore: Math.round(averageScore),
    subjectsCompleted,
    totalTimeSpent: totalTimeSpentSeconds,
  };
};

/**
 * Formats a duration in seconds into a human-readable string (e.g., "1 hr 25 min").
 * @param totalSeconds The total duration in seconds.
 * @returns A formatted string.
 */
const formatTime = (totalSeconds: number) => {
  if (totalSeconds < 60) return `${totalSeconds} sec`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let timeString = "";
  if (hours > 0) timeString += `${hours} hr `;
  if (minutes > 0) timeString += `${minutes} min`;

  return timeString.trim() || "0 min";
};

const StudentDashboard = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // Use React Query to fetch data. It will only run if `user.id` is available.
  const {
    data: performance,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["studentPerformance", user?.id],
    queryFn: () => fetchStudentPerformance(user!.id),
    enabled: !!user, // This is crucial: the query will not run until the user object is loaded.
  });

  if (isLoading) {
    return <div>Loading performance data...</div>;
  }

  if (isError) {
    return <div>Error loading data: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {user?.email || "Student"}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Performance Card: Average Score */}
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="text-lg font-semibold text-muted-foreground">Average Score</h3>
          <p className="text-4xl font-bold">{performance?.averageScore}%</p>
        </div>

        {/* Performance Card: Subjects Completed */}
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="text-lg font-semibold text--muted-foreground">Subjects Progress</h3>
          <p className="text-4xl font-bold">
            {performance?.subjectsCompleted} / {performance?.totalSubjects}
          </p>
        </div>

        {/* Performance Card: Quizzes Taken */}
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="text-lg font-semibold text-muted-foreground">Quizzes Taken</h3>
          <p className="text-4xl font-bold">{performance?.quizzesTaken}</p>
        </div>

        {/* Performance Card: Time Spent */}
        <div className="p-6 bg-card rounded-lg shadow">
          <h3 className="text-lg font-semibold text-muted-foreground">Time Spent</h3>
          <p className="text-4xl font-bold">{formatTime(performance?.totalTimeSpent ?? 0)}</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;