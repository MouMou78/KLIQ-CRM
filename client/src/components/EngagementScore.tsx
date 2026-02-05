import { Flame, Droplet, Snowflake } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EngagementScoreProps {
  score: number; // 0-100
}

export function EngagementScore({ score }: EngagementScoreProps) {
  const getScoreLevel = () => {
    if (score >= 70) return { level: "hot", icon: Flame, color: "text-red-500", label: "Hot Lead" };
    if (score >= 40) return { level: "warm", icon: Droplet, color: "text-orange-500", label: "Warm Lead" };
    return { level: "cold", icon: Snowflake, color: "text-blue-400", label: "Cold Lead" };
  };

  const { icon: Icon, color, label } = getScoreLevel();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} ({score}/100)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
