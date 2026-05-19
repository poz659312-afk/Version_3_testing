import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { departmentData } from "@/lib/department-data";
import { cn } from "@/lib/utils";
import AdBanner from "@/components/AdBanner";

interface Props {
  params: Promise<{ department: string }>;
}

export default async function DepartmentPage({ params }: Props) {
  const resolvedParams = await params;
  const dept = departmentData[resolvedParams.department];

  if (!dept) {
    notFound();
  }

  const levels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const levelColors = [
    "from-primary/[0.15]",
    "from-secondary/[0.15]",
    "from-accent/[0.15]",
    "from-primary/[0.25] to-secondary/[0.15]",
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 blur-lg md:blur-xl" />

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/specialization">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 border border-white/[0.08] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Specializations
              </Button>
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              <span
                style={{ WebkitTextStroke: "1.2px currentColor", WebkitTextFillColor: "transparent" }}
                className="transition-all duration-300 text-primary"
              >
                {dept.name}
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
              {dept.description}
            </p>

            <Badge
              variant="outline"
              className="text-lg px-4 py-2 bg-white/[0.03] border-primary/20 text-primary/90"
            >
              Choose Your Academic Level
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {levels.map((level, index) => (
              <Link key={level} href={`/specialization/${resolvedParams.department}/${index + 1}`}>
                <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                  <CardHeader className="text-center pb-3">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3",
                        "bg-gradient-to-r to-transparent border-2 border-white/[0.15] transition-transform duration-300 group-hover:scale-110",
                        "shadow-[0_4px_16px_0_rgba(255,255,255,0.08)]",
                        levelColors[index],
                      )}
                    >
                      <GraduationCap className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {level}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground group-hover:text-foreground/70 transition-colors mb-3">
                      Access {level.toLowerCase()} curriculum and study materials
                    </p>
                    <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1] text-muted-foreground group-hover:border-primary/20 group-hover:text-primary transition-colors">
                      {dept.levels[index + 1]?.subjects.term1.length + dept.levels[index + 1]?.subjects.term2.length || 0} Subjects
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70 pointer-events-none" />
    </div>
  );
}
