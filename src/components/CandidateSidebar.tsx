import React, { useState } from "react";
import { CandidateProfile } from "../types";
import { Search, SlidersHorizontal, Trash2, FileText, Star, Briefcase } from "lucide-react";
import { formatDate } from "../utils";

interface CandidateSidebarProps {
  candidates: CandidateProfile[];
  selectedId: string | null;
  onSelectCandidate: (id: string) => void;
  onDeleteCandidate: (id: string, e: React.MouseEvent) => void;
  onStartUpload: () => void;
}

export default function CandidateSidebar({
  candidates,
  selectedId,
  onSelectCandidate,
  onDeleteCandidate,
  onStartUpload,
}: CandidateSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter candidates based on search terms and rating
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.personalInfo.currentTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills.some((cat) =>
        cat.list.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      ) ||
      candidate.workExperience.some(
        (job) =>
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesRating = ratingFilter === "all" || candidate.assessment.overallRating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  return (
    <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50 flex flex-col h-full" id="candidate-sidebar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-700" />
            Recruiter Pool
          </h2>
          <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-0.5 rounded-full">
            {candidates.length} {candidates.length === 1 ? "Profile" : "Profiles"}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onStartUpload}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm py-2 px-4 rounded-lg shadow-xs transition duration-150 cursor-pointer mb-3"
          id="btn-upload-new"
        >
          <FileText className="w-4 h-4" />
          Parse New Resume
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, skill, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 focus:bg-white text-sm pl-9 pr-8 py-2 rounded-md border-0 focus:ring-2 focus:ring-gray-900 transition duration-150"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 top-2 p-1 rounded-md hover:bg-gray-200 transition ${
              ratingFilter !== "all" || showFilters ? "text-gray-900 bg-gray-200" : "text-gray-400"
            }`}
            title="Filter options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs animate-fadeIn">
            <div className="font-semibold text-gray-700 mb-1.5">Overall Fit Rating</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setRatingFilter("all")}
                className={`px-2 py-1 rounded-md border font-medium cursor-pointer transition ${
                  ratingFilter === "all"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-2 py-1 rounded-md border flex items-center gap-1 font-medium cursor-pointer transition ${
                    ratingFilter === rating
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {rating} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Candidates List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {filteredCandidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No candidates match your criteria.
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const isSelected = candidate.id === selectedId;
            const initials = candidate.personalInfo.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={candidate.id}
                onClick={() => onSelectCandidate(candidate.id)}
                className={`p-4 cursor-pointer flex gap-3 transition-colors duration-150 relative group ${
                  isSelected ? "bg-white border-l-4 border-gray-900" : "hover:bg-gray-100/70"
                }`}
              >
                {/* Initials Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-semibold shrink-0">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {candidate.personalInfo.name}
                    </h3>
                    <button
                      onClick={(e) => onDeleteCandidate(candidate.id, e)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 truncate mb-1">
                    {candidate.personalInfo.currentTitle || "Candidate"}
                  </p>

                  <div className="flex items-center justify-between text-xxs mt-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < candidate.assessment.overallRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-400">
                      {new Date(candidate.uploadedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
