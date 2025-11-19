import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface StudentStats {
  full_name: string;
  totalSubjects: number;
  totalQuizzes: number;
  totalHours: number;
  progress: number;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentPerformance();

    // Real-time updates
    const quizChannel = supabase
      .channel("quiz-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_attempts" },
        () => fetchStudentPerformance()
      )
      .subscribe();

    const courseChannel = supabase
      .channel("course-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_courses" },
        () => fetchStudentPerformance()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(quizChannel);
      supabase.removeChannel(courseChannel);
    };
  }, []);

  const fetchStudentPerformance = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        toast.error("Please log in to continue");
        return;
      }

      const studentId = session.user.id;

      // 1. Fetch student name
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", studentId)
        .single();
      if (profileError) throw profileError;

      // 2. Fetch enrolled courses
      const { data: courses, error: courseError } = await supabase
        .from("student_courses")
        .select("progress")
        .eq("student_id", studentId);
      if (courseError) throw courseError;

      // 3. Fetch completed quiz attempts
      const { data: quizzes, error: quizError } = await supabase
        .from("quiz_attempts")
        .select("id, completed_at, duration")
        .eq("student_id", studentId)
        .not("completed_at", "is", null);
      if (quizError) throw quizError;

      // Calculate metrics
      const totalSubjects = courses?.length || 0;
      const totalQuizzes = quizzes?.length || 0;
      const avgProgress =
        courses?.reduce((sum, c) => sum + (c.progress || 0), 0) /
          (courses?.length || 1) || 0;
      const totalHours =
        quizzes?.reduce((sum, q) => sum + (q.duration || 0), 0) / 60 || 0;

      setStats({
        full_name: profile?.full_name || "Student",
        totalSubjects,
        totalQuizzes,
        totalHours: parseFloat(totalHours.toFixed(1)),
        progress: parseFloat(avgProgress.toFixed(1)),
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-600 via-orange-400 to-yellow-300">
        <Skeleton className="h-32 w-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-orange-400 to-yellow-300 text-white p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-block bg-white/20 px-4 py-1 rounded-full mb-6 text-sm font-medium">
          Student Dashboard
        </div>

        <h1 className="text-5xl font-bold mb-2">
          Welcome back, {stats.full_name}!
        </h1>
        <p className="text-lg mb-10">
          Continue your learning journey with Rwanda's best educational platform.
        </p>

        {/* Stats section */}
        <div className="bg-white/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <p className="text-lg font-semibold">Overall Progress</p>
            <p className="text-lg font-semibold">{stats.progress}%</p>
          </div>
          <Progress value={stats.progress} className="h-3 mb-6" />

          {/* Stats Grid */}
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-4xl font-bold">{stats.totalSubjects}</p>
              <p className="text-sm">Subjects</p>
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.totalQuizzes}</p>
              <p className="text-sm">Quizzes</p>
            </div>
            <div>
              <p className="text-4xl font-bold">{stats.totalHours}</p>
              <p className="text-sm">Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
