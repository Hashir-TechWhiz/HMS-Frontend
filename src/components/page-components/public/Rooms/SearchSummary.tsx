"use client";

import { FC } from "react";
import { Calendar, Users } from "lucide-react";

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
  // Check if we have any search criteria
  const hasSearchCriteria = checkIn || checkOut || guests;

  return (
    <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Criteria or Default Message */}
        {hasSearchCriteria ? (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {checkIn && checkOut && (
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {checkIn} - {checkOut}
                </span>
              </div>
            )}

            {guests && (
              <div className="flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  {guests} {guests === 1 ? "Guest" : "Guests"}
                </span>
              </div>
            )}
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
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="font-semibold text-foreground">{resultsCount}</span>{" "}
          {resultsCount === 1 ? "room" : "rooms"} available
        </div>
      </div>
    </div>
  );
};

export default SearchSummary;

