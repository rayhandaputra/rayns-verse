import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { cn } from "~/lib/utils";
import { Link } from "react-router";
import { Button } from "../ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Link } from "@remix-run/react";
// import { cn } from "@/lib/utils";

type HighlightItem = {
  id: number;
  institution: string;
  event: string;
  description?: string;
  imageUrl: string;
  link?: string;
};

interface HighlightSectionProps {
  highlights: HighlightItem[];
}

export function HighlightSection({ highlights }: HighlightSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-3">
          <span className="text-blue-600">Agenda</span> & Sorotan Event
        </h2>
        <p className="text-gray-500 mb-10">
          Temukan event menarik dan kegiatan dari berbagai instansi yang berpartisipasi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
          {highlights.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col p-2 border-0"
              )}
            >
              <div className="relative w-full h-[28rem]">
                <img
                  src={item.imageUrl}
                  alt={item.event}
                  className="object-cover rounded-4xl w-full h-full"
                />
              </div>
              <CardHeader className="text-left">
                <h3 className="text-xl font-semibold text-gray-800">{item.event}</h3>
                {/* <p className="text-sm text-gray-500">{item.institution}</p> */}
              </CardHeader>
              <CardContent className="flex flex-col justify-between flex-grow text-left">
                {item.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {item.description}
                  </p>
                )}
                {item.link && (
                  <Link to={item.link} className="mb-4">
                    <Button
                      variant="default"
                      className="flex items-center bg-gray-800 text-white gap-2 group"
                    >
                      Learn More{" "}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
