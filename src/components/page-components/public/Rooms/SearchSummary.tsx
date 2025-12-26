"use client";

import { FC } from "react";
import { Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface SearchSummaryProps {
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  resultsCount?: number;
}

const SearchSummary: FC<SearchSummaryProps> = ({
  checkIn,
  checkOut,
  guests,
  resultsCount = 0,
}) => {
  const router = useRouter();
  
  // Check if we have any search criteria
  const hasSearchCriteria = checkIn || checkOut || guests;

  const handleClearSearch = () => {
    // Navigate to rooms page without query params
    router.push("/rooms");
  };

  return (
    <Card className="overflow-hidden transition-all duration-500 group p-0 table-bg-gradient border border-white/15 relative mb-6">
      
      <CardContent className="p-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Criteria or Default Message */}
          {hasSearchCriteria ? (
            <div className="flex flex-wrap items-center gap-3">
              {checkIn && checkOut && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {checkIn} - {checkOut}
                  </span>
                </div>
              )}

              {guests && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {guests} {guests === 1 ? "Guest" : "Guests"}
                  </span>
                </div>
              )}
              
              {/* Clear Search Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="hover:bg-white/10 border border-white/20 hover:border-primary/30 transition-all duration-300 h-auto py-2 px-3"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="text-sm text-foreground">
              <span className="font-medium">Showing all available rooms</span>
              <span className="text-muted-foreground ml-2">
                • Use the search above to refine your results
              </span>
            </div>
          )}

          {/* Results Count */}
          <Badge className="bg-white/10 backdrop-blur-sm border border-white/50 text-black-500 shadow-lg font-semibold px-4 py-2 text-sm whitespace-nowrap">
            <span className="font-semibold mr-1 text-white">{resultsCount}</span>
            <span className="text-white">{resultsCount === 1 ? "Room" : "Rooms"} Available</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchSummary;

