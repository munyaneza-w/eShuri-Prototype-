import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Award, TrendingUp, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AttemptData {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
  quiz: {
    title: string;
    subject: {
      name: string;
    };
  };
}

const Progress = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    highestScore: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchProgress();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProgress = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        score,
        max_score,
        completed_at,
        quiz:quizzes(
          title,
          subject:subjects(name)
        )
      `)
      .eq("student_id", session.user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) {
      toast.error("Failed to load progress");
      setLoading(false);
      return;
    }

    const typedData = data as unknown as AttemptData[];
    setAttempts(typedData);

    // Calculate stats
    const totalQuizzes = typedData.length;
    const scores = typedData.map((a) => (a.score / a.max_score) * 100);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / (totalQuizzes || 1);
    const highestScore = Math.max(...scores, 0);

    setStats({ totalQuizzes, averageScore, highestScore });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background">
        <div className="container mx-auto p-6 max-w-6xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold mb-8">My Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Quizzes Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.totalQuizzes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">
                {stats.averageScore.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent-foreground" />
                Best Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent-foreground">
                {stats.highestScore.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>Your recent quiz performance</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No quiz attempts yet. Take your first quiz to see your progress!
              </p>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => {
                  const percentage = (attempt.score / attempt.max_score) * 100;
                  return (
                    <div key={attempt.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{attempt.quiz.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {attempt.quiz.subject.name} •{" "}
                            {new Date(attempt.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {attempt.score}/{attempt.max_score}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              percentage >= 70
                                ? "text-green-600"
                                : percentage >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <ProgressBar value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;
