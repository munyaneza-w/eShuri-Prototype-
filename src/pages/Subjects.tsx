import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Calculator, Atom, Beaker, Dna, BookOpen, ScrollText, Globe, Code, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, any> = {
  Calculator,
  Atom,
  Flask: Beaker,
  Dna,
  BookOpen,
  ScrollText,
  Globe,
  Code,
};

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load subjects");
      setLoading(false);
      return;
    }

    setSubjects(data || []);
    setLoading(false);
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <nav className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">E-shuri</h1>
              <p className="text-xs text-muted-foreground">Rwanda Learning Platform</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Subjects</h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="bg-muted h-12 w-12 rounded-lg mb-3" />
                  <div className="bg-muted h-6 w-32 rounded" />
                  <div className="bg-muted h-4 w-full rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => {
              const Icon = iconMap[subject.icon] || BookOpen;
              return (
                <Card
                  key={subject.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/subject/${subject.id}`)}
                >
                  <CardHeader>
                    <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">{subject.name}</CardTitle>
                    <CardDescription className="text-base">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      View Content
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No subjects found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
