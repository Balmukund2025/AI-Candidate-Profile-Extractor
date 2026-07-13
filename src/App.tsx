import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Cpu,
  FileText,
  Search,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  Star,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Bookmark,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Settings,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import { CandidateProfile } from "./types";
import { sampleCandidate } from "./sampleData";
import { fileToBase64, formatDate, exportToMarkdown } from "./utils";

export default function App() {
  // Candidate storage in LocalStorage to persist parser results
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assessment" | "experience" | "education" | "skills" | "projects">("assessment");
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Model Settings & Keys State
  const [provider, setProvider] = useState<"gemini" | "openai" | "claude">("gemini");
  const [model, setModel] = useState<string>("gemini-3.5-flash");
  const [apiKeys, setApiKeys] = useState<{ gemini: string; openai: string; claude: string }>({
    gemini: "",
    openai: "",
    claude: ""
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Temporary Form Draft State for Modal Settings
  const [tempProvider, setTempProvider] = useState<"gemini" | "openai" | "claude">("gemini");
  const [tempModel, setTempModel] = useState<string>("gemini-3.5-flash");
  const [tempKeys, setTempKeys] = useState({ gemini: "", openai: "", claude: "" });
  const [showKey, setShowKey] = useState(false);

  // Sync temp states whenever settings modal is shown
  useEffect(() => {
    if (showSettingsModal) {
      setTempProvider(provider);
      setTempModel(model);
      setTempKeys({ ...apiKeys });
      setShowKey(false);
    }
  }, [showSettingsModal, provider, model, apiKeys]);

  const handleTempProviderChange = (prov: "gemini" | "openai" | "claude") => {
    setTempProvider(prov);
    if (prov === "gemini") {
      setTempModel("gemini-3.5-flash");
    } else if (prov === "openai") {
      setTempModel("gpt-4o-mini");
    } else if (prov === "claude") {
      setTempModel("claude-3-5-sonnet-latest");
    }
  };

  const handleSaveSettings = (
    newProvider: "gemini" | "openai" | "claude",
    newModel: string,
    newKeys: { gemini: string; openai: string; claude: string }
  ) => {
    setProvider(newProvider);
    setModel(newModel || (newProvider === "gemini" ? "gemini-3.5-flash" : newProvider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-latest"));
    setApiKeys(newKeys);
    
    try {
      localStorage.setItem("talentlens_api_keys", JSON.stringify(newKeys));
      localStorage.setItem("talentlens_active_provider", newProvider);
      localStorage.setItem("talentlens_active_model", newModel || (newProvider === "gemini" ? "gemini-3.5-flash" : newProvider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-latest"));
    } catch (e) {
      console.error("Failed to save model settings:", e);
    }
    
    setShowSettingsModal(false);
    showToast(`Extraction engine configured to ${newProvider === "gemini" ? "Gemini" : newProvider === "openai" ? "OpenAI" : "Claude"} (${newModel})`);
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize candidates list from localStorage or load sample
  useEffect(() => {
    const stored = localStorage.getItem("recruiter_candidates");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CandidateProfile[];
        if (parsed.length > 0) {
          setCandidates(parsed);
          setSelectedCandidateId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored candidates:", e);
      }
    }
    // Fallback: If empty, add sample candidate but let user know it's a sample
    setCandidates([sampleCandidate]);
    setSelectedCandidateId(sampleCandidate.id);
  }, []);

  // Initialize model configs from LocalStorage on mount
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem("talentlens_api_keys");
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
      
      const savedProvider = localStorage.getItem("talentlens_active_provider");
      if (savedProvider) {
        setProvider(savedProvider as any);
      }
      
      const savedModel = localStorage.getItem("talentlens_active_model");
      if (savedModel) {
        setModel(savedModel);
      }
    } catch (e) {
      console.error("Failed to load model configurations:", e);
    }
  }, []);

  // Save candidates list to localStorage whenever it changes
  const saveCandidates = (newList: CandidateProfile[]) => {
    setCandidates(newList);
    localStorage.setItem("recruiter_candidates", JSON.stringify(newList));
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Find currently active candidate
  const currentCandidate = candidates.find((c) => c.id === selectedCandidateId) || sampleCandidate;

  // Handle Drag Events for File Upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Parse candidate resume using the API route
  const processFile = async (file: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !["pdf", "docx", "txt"].includes(fileExt || "")) {
      setUploadError("Invalid file format. Please upload a PDF, DOCX (Word), or TXT resume.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const base64Data = await fileToBase64(file);
      
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          base64Data,
          provider,
          model,
          apiKey: apiKeys[provider] || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const extractedProfile = await response.json();
      
      // Inject unique client ID and metadata
      const newCandidate: CandidateProfile = {
        ...extractedProfile,
        id: `candidate-${Date.now()}`,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
      };

      // Append to list and make active
      const updatedList = [newCandidate, ...candidates.filter(c => c.id !== "sample-sarah-jenkins")];
      saveCandidates(updatedList);
      setSelectedCandidateId(newCandidate.id);
      showToast(`Successfully extracted profile for ${newCandidate.personalInfo.name}!`);
      
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred while parsing the resume. Please make sure the Gemini API Key is configured and try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Copy candidate detail to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  // Delete candidate from local history
  const deleteCandidate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this candidate profile from your dashboard?")) {
      const updated = candidates.filter((c) => c.id !== id);
      saveCandidates(updated);
      if (selectedCandidateId === id) {
        if (updated.length > 0) {
          setSelectedCandidateId(updated[0].id);
        } else {
          // Reset to sample if list is completely empty
          setCandidates([sampleCandidate]);
          setSelectedCandidateId(sampleCandidate.id);
        }
      }
      showToast("Candidate profile removed.");
    }
  };

  // Export Markdown report download
  const handleExportMarkdown = () => {
    if (!currentCandidate) return;
    const mdContent = exportToMarkdown(currentCandidate);
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${currentCandidate.personalInfo.name.replace(/\s+/g, "_")}_Profile_Summary.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Successfully exported candidate profile as Markdown!");
  };

  // Filter candidates based on search
  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.personalInfo.name.toLowerCase().includes(q) ||
      (c.personalInfo.currentTitle || "").toLowerCase().includes(q) ||
      c.skills.some((cat) => cat.list.some((s) => s.toLowerCase().includes(q))) ||
      c.workExperience.some((job) => job.company.toLowerCase().includes(q) || job.jobTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="app_root">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div id="toast" className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded border border-slate-800 shadow-lg flex items-center space-x-2 animate-slide-up text-xs font-mono">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 text-white p-1.5 rounded flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-1.5">
              TalentInsight AI <span className="font-normal text-slate-400 text-xs italic">v3.5 Flash</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligent Candidate & Resume Profiler</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2.5">
          {/* Active Model Indicator */}
          <div className="hidden md:flex flex-col items-end mr-1 text-[10px] font-medium text-slate-500">
            <span className="font-bold text-indigo-600 uppercase tracking-wider">{provider} Mode</span>
            <span className="text-[9px] text-slate-400">{model}</span>
          </div>

          <button
            id="btn-settings-trigger"
            onClick={() => setShowSettingsModal(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded transition flex items-center justify-center cursor-pointer"
            title="Configure AI Models & Keys"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-upload-trigger"
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Resume</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </header>

      {/* Core Dashboard Grid */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Left Hand Sidebar: Upload box and parsed candidates catalog */}
        <aside id="sidebar-candidates" className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          
          {/* Quick upload drop area inside sidebar */}
          <div className="p-4 border-b border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Upload Interface</label>
            <div
              id="drop-zone-sidebar"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                dragActive
                  ? "border-indigo-400 bg-indigo-50/50"
                  : "border-indigo-150 bg-indigo-50/10 hover:border-indigo-300 hover:bg-indigo-50/25"
              }`}
            >
              <Upload className="w-7 h-7 text-indigo-450 mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Drop resume files here</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, TXT up to 10MB</p>
            </div>
            
            {uploadError && (
              <div id="upload-error-alert" className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{uploadError}</span>
              </div>
            )}

            {isUploading && (
              <div id="upload-progress-alert" className="mt-3 bg-slate-900 text-white p-3.5 rounded border border-slate-800">
                <div className="flex items-center space-x-2.5 mb-2 border-b border-slate-800 pb-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <span className="text-[9px] font-mono text-indigo-400 tracking-widest font-bold uppercase">EXTRACTION_ACTIVE</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-1 rounded-full animate-pulse" style={{ width: "85%" }}></div>
                </div>
                <p className="text-[9px] font-mono text-slate-400 mt-2">
                  Deep-parsing with {provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "Claude"} ({model})...
                </p>
              </div>
            )}
          </div>

          {/* Search tool for parsed records */}
          <div className="p-3 border-b border-slate-150 bg-slate-50/30">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-455" />
              <input
                id="candidate-search-input"
                type="text"
                placeholder="Search pipeline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 pl-8 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* List of Cataloged Candidates */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Extraction Pipeline ({filteredCandidates.length})</span>
                {candidates.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm("Reset candidates list to sample data?")) {
                        saveCandidates([sampleCandidate]);
                        setSelectedCandidateId(sampleCandidate.id);
                        showToast("Reset candidate index to sample.");
                      }
                    }}
                    className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold uppercase tracking-wide cursor-pointer"
                  >
                    Reset List
                  </button>
                )}
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-400">
                  <User className="w-7 h-7 mx-auto stroke-1 mb-2 text-slate-350" />
                  <p className="text-xs font-semibold">No matching candidates in pipeline.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCandidates.map((candidate) => {
                    const isSelected = candidate.id === selectedCandidateId;
                    const isSample = candidate.id === "sample-sarah-jenkins";
                    return (
                      <div
                        key={candidate.id}
                        id={`sidebar-item-${candidate.id}`}
                        onClick={() => setSelectedCandidateId(candidate.id)}
                        className={`group relative p-2.5 rounded cursor-pointer transition flex items-start space-x-2.5 border-l-2 ${
                          isSelected
                            ? "bg-indigo-50/50 border-indigo-500"
                            : "bg-white border-transparent hover:bg-slate-50"
                        }`}
                      >
                        {/* Compact Avatar representing candidate profile picture */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center">
                          {candidate.customPhoto ? (
                            <img
                              src={candidate.customPhoto}
                              alt={candidate.personalInfo.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : candidate.avatarSvg ? (
                            <div
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: candidate.avatarSvg }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                              {candidate.personalInfo.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Summary Details */}
                        <div className="flex-1 min-w-0 pr-5">
                          <div className="flex items-center space-x-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                              {candidate.personalInfo.name}
                            </h4>
                            {isSample && (
                              <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1 py-0.5 rounded scale-90 shrink-0 uppercase">Sample</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-450 truncate">
                            {candidate.personalInfo.currentTitle || "No title specified"}
                          </p>
                          
                          <div className="flex items-center space-x-1.5 mt-1 text-[9px] text-slate-400">
                            <span className="flex items-center shrink-0 font-bold text-slate-500">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-0.5" />
                              <span>{candidate.assessment.overallRating}/5 Rating</span>
                            </span>
                            <span className="truncate">• {candidate.filename}</span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => deleteCandidate(candidate.id, e)}
                          className="absolute right-2 top-2 text-slate-300 hover:text-rose-500 p-1 rounded opacity-0 group-hover:opacity-100 transition duration-150"
                          title="Delete candidate profile from local storage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick info panel in sidebar bottom (styled as a system log) */}
          <div className="p-4 bg-slate-900 text-[10px] font-mono text-slate-400 space-y-1 border-t border-slate-800 mt-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-green-400">ATS_STATUS_LOG</span>
              <span className="text-[9px] font-mono text-slate-500 italic">0.42s latency</span>
            </div>
            <div className="leading-tight space-y-1">
              <p><span className="text-green-500">[INFO]</span> Parser Engine Ready</p>
              <p><span className="text-green-500">[INFO]</span> Active: {provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "Claude"} ({model})</p>
              <p><span className="text-indigo-400">[SYNC]</span> SQLite Index Synchronized</p>
            </div>
          </div>
        </aside>

        {/* Right Hand Side: Multi-tab candidate visualizer dashboard */}
        <main id="main-candidate-dashboard" className="flex-1 bg-slate-50 overflow-y-auto flex flex-col p-5 min-w-0">
          
          {/* Sample Candidate Warning banner if viewing sample */}
          {currentCandidate.id === "sample-sarah-jenkins" && (
            <div id="sample-banner" className="mb-4 bg-amber-50 border border-amber-200 rounded p-3 flex items-start space-x-3">
              <Bookmark className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Viewing Demo Candidate Profile</p>
                <p className="text-[11px] text-amber-600 mt-0.5 leading-normal">
                  This is pre-configured demo resume data to explore. Click the <strong className="font-bold underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>Upload Resume</strong> button to test with any real candidate PDF or Word CV!
                </p>
              </div>
            </div>
          )}

          {/* Candidate Profile Cover Header card */}
          <section id="candidate-cover-card" className="bg-white border border-slate-200 rounded p-5 shadow-sm mb-5 relative overflow-hidden">
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              
              {/* Primary bio and profile portrait from resume */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                
                {/* Generated Candidate Profile Picture container */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex items-center justify-center">
                    {currentCandidate.customPhoto ? (
                      <img
                        src={currentCandidate.customPhoto}
                        alt={currentCandidate.personalInfo.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : currentCandidate.avatarSvg ? (
                      <div
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{ __html: currentCandidate.avatarSvg }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xl">
                        {currentCandidate.personalInfo.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 border border-white text-white p-0.5 rounded shadow-sm" title="Parsed successfully from Resume photo">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">{currentCandidate.personalInfo.name}</h2>
                    <span className="bg-indigo-55/60 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                      {currentCandidate.personalInfo.currentTitle || "Candidate"}
                    </span>
                  </div>

                  {currentCandidate.personalInfo.location && (
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide flex items-center justify-center sm:justify-start space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentCandidate.personalInfo.location}</span>
                    </p>
                  )}

                  {/* Summary teaser */}
                  <p className="text-slate-600 text-xs max-w-2xl leading-relaxed pt-1">
                    {currentCandidate.summary}
                  </p>
                </div>
              </div>

              {/* Action utilities (Export Markdown) */}
              <div className="w-full md:w-auto shrink-0 flex items-center justify-center pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                <button
                  id="btn-export-markdown"
                  onClick={handleExportMarkdown}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded text-xs font-bold inline-flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report (.MD)</span>
                </button>
              </div>

            </div>

            {/* Micro details shelf: contact tags with click-to-copy */}
            <div className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              
              {currentCandidate.personalInfo.email && (
                <div
                  onClick={() => copyToClipboard(currentCandidate.personalInfo.email || "", "Email")}
                  className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 rounded cursor-pointer transition text-left flex items-center space-x-2 group"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-xs text-slate-700 truncate font-semibold">{currentCandidate.personalInfo.email}</p>
                  </div>
                </div>
              )}

              {currentCandidate.personalInfo.phone && (
                <div
                  onClick={() => copyToClipboard(currentCandidate.personalInfo.phone || "", "Phone Number")}
                  className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 rounded cursor-pointer transition text-left flex items-center space-x-2 group"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="text-xs text-slate-700 truncate font-semibold">{currentCandidate.personalInfo.phone}</p>
                  </div>
                </div>
              )}

              {currentCandidate.personalInfo.linkedin && (
                <a
                  href={currentCandidate.personalInfo.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 rounded cursor-pointer transition text-left flex items-center space-x-2 group"
                >
                  <Linkedin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn Profile</p>
                    <p className="text-xs text-slate-700 truncate font-semibold flex items-center">
                      <span>View Profile</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1 text-slate-400 shrink-0" />
                    </p>
                  </div>
                </a>
              )}

              {currentCandidate.personalInfo.github && (
                <a
                  href={currentCandidate.personalInfo.github}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 rounded cursor-pointer transition text-left flex items-center space-x-2 group"
                >
                  <Github className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">GitHub Account</p>
                    <p className="text-xs text-slate-700 truncate font-semibold flex items-center">
                      <span>View Repos</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1 text-slate-400 shrink-0" />
                    </p>
                  </div>
                </a>
              )}

              {currentCandidate.personalInfo.website && (
                <a
                  href={currentCandidate.personalInfo.website}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-50 hover:bg-slate-100 p-2 border border-slate-200 rounded cursor-pointer transition text-left flex items-center space-x-2 group hidden lg:flex"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Website/Portfolio</p>
                    <p className="text-xs text-slate-700 truncate font-semibold flex items-center">
                      <span>Visit Site</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1 text-slate-400 shrink-0" />
                    </p>
                  </div>
                </a>
              )}

            </div>
          </section>

          {/* Navigation Tabs */}
          <div id="tabs-navigation" className="flex overflow-x-auto border-b border-slate-200 mb-5 bg-white rounded p-1 shadow-sm space-x-1 shrink-0">
            <button
              onClick={() => setActiveTab("assessment")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === "assessment"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment & Questions</span>
            </button>
            <button
              onClick={() => setActiveTab("experience")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === "experience"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work Experience</span>
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === "skills"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Skills Inventory</span>
            </button>
            <button
              onClick={() => setActiveTab("education")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === "education"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education & Certs</span>
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === "projects"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
          </div>

          {/* Active Tab Contents Area */}
          <div id="tab-content-wrapper" className="flex-1">
            
            {/* Tab 1: AI & Recruiter Evaluation Assessment */}
            {activeTab === "assessment" && (
              <div id="tab-assessment-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
                
                {/* Left col: Match metrics and cultural summary */}
                <div className="lg:col-span-1 space-y-5">
                  {/* Rating card */}
                  <div className="bg-white border border-slate-200 rounded p-5 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Overall Candidate Match</p>
                    <div className="flex items-center justify-center space-x-1 mb-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-7 h-7 ${
                            star <= currentCandidate.assessment.overallRating
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-2xl font-black text-slate-900">{currentCandidate.assessment.overallRating}/5 Rating</span>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Calculated from matching roles, core technical skills depth, and employment continuity.
                    </p>
                  </div>

                  {/* Top Matching Corporate roles */}
                  <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Matching Open Roles</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCandidate.assessment.matchingRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-1 rounded border border-indigo-100 flex items-center uppercase"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cultural Fit analysis paragraph */}
                  {currentCandidate.assessment.culturalFit && (
                    <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Cultural Fit Analysis</span>
                      </h3>
                      <p className="text-xs text-slate-605 leading-relaxed bg-slate-50 p-3 rounded border border-slate-150 font-medium">
                        {currentCandidate.assessment.culturalFit}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right col: Strengths, Growth points and custom recruiter interview questions */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* Strengths & Weaknesses bento block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Key Strengths */}
                    <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center space-x-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700">Key Strengths</span>
                      </h3>
                      <ul className="space-y-2">
                        {currentCandidate.assessment.keyStrengths.map((str, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                            <span className="bg-emerald-50 text-emerald-700 rounded-full h-4 w-4 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed font-medium">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for upskilling */}
                    <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-700">Areas for Growth</span>
                      </h3>
                      <ul className="space-y-2">
                        {currentCandidate.assessment.areasForGrowth.map((growth, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                            <span className="bg-amber-50 text-amber-700 rounded-full h-4 w-4 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed font-medium">{growth}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended deep dive custom interview questions */}
                  <div className="bg-slate-900 text-slate-100 rounded p-5 border border-slate-850">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Suggested Interview Questions</span>
                      </h3>
                      <span className="text-[9px] font-mono text-slate-500 italic">Engineered via Gemini</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      These questions were generated specifically for {currentCandidate.personalInfo.name} based on technology stacks, career milestones, and experience gaps:
                    </p>

                    <div className="space-y-2.5">
                      {currentCandidate.assessment.suggestedQuestions.map((question, i) => (
                        <div
                          key={i}
                          className="bg-white/5 hover:bg-white/10 p-3 rounded.5 border border-white/10 flex items-start justify-between space-x-3 transition group/item"
                        >
                          <div className="flex items-start space-x-2 text-xs leading-relaxed text-slate-200">
                            <span className="font-bold text-indigo-400 shrink-0 mt-0.5">Q{i + 1}.</span>
                            <p className="font-medium italic">"{question}"</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(question, `Interview Question ${i + 1}`)}
                            className="text-slate-400 hover:text-indigo-400 p-1 rounded hover:bg-slate-800 transition shrink-0 cursor-pointer"
                            title="Copy question text"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab 2: Chronological Career/Work Experience */}
            {activeTab === "experience" && (
              <div id="tab-experience-panel" className="bg-white border border-slate-200 rounded p-5 shadow-sm animate-fade-in space-y-6">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    <span>Career Timeline</span>
                  </h3>
                </div>

                <div className="space-y-6">
                  {currentCandidate.workExperience.map((job, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-indigo-100 flex flex-col gap-1 group">
                      
                      {/* Timeline node icon */}
                      <div className="absolute -left-[7px] top-[5px] w-3 h-3 bg-indigo-500 rounded-full border-2 border-white transition-transform group-hover:scale-125" />

                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{job.jobTitle}</h4>
                            <div className="flex items-center space-x-1.5 mt-0.5 text-xs text-slate-500 font-medium">
                              <span className="font-bold text-indigo-600 flex items-center">
                                {job.company}
                              </span>
                              {job.location && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{job.location}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-xs font-mono text-slate-400 uppercase">
                            <span>{job.startDate} – {job.endDate}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {job.description}
                        </p>

                        {/* Bulleted Achievements */}
                        {job.achievements && job.achievements.length > 0 && (
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-2 pl-2 space-y-1.5">
                            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Key Deliverables & Accomplishments</p>
                            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                              {job.achievements.map((ach, aIdx) => (
                                <li key={aIdx} className="leading-relaxed">
                                  <span className="text-slate-605">{ach}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Detailed Categorized Skills Catalog */}
            {activeTab === "skills" && (
              <div id="tab-skills-panel" className="bg-white border border-slate-200 rounded p-5 shadow-sm animate-fade-in space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <span>Skills Matrix & Competency</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentCandidate.skills.map((cat, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 hover:bg-slate-100/50 p-4 rounded border border-slate-200 transition flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>{cat.category}</span>
                          <span className="bg-slate-200 text-slate-600 normal-case font-bold px-1.5 py-0.5 rounded text-[9px]">{cat.list.length} Items</span>
                        </h4>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {cat.list.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-white text-slate-700 text-[11px] font-bold px-2 py-1 rounded border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition duration-150 flex items-center uppercase"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Education History & Certifications */}
            {activeTab === "education" && (
              <div id="tab-education-panel" className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
                
                {/* Left side: Academics */}
                <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-200 pb-2.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      <span>Academic Background</span>
                    </h3>
                  </div>

                  <div className="space-y-4 pt-1">
                    {currentCandidate.education.map((edu, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-indigo-500 space-y-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {edu.degree} in {edu.fieldOfStudy}
                          </h4>
                          <p className="text-[11px] font-bold text-indigo-600 mt-0.5">{edu.institution}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                            {edu.graduationYear && (
                              <span className="flex items-center">
                                Graduated {edu.graduationYear}
                              </span>
                            )}
                            {edu.location && <span>• {edu.location}</span>}
                            {edu.grade && (
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">{edu.grade}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: Certifications */}
                <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-200 pb-2.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-indigo-500" />
                      <span>Professional Certifications</span>
                    </h3>
                  </div>

                  {!currentCandidate.certifications || currentCandidate.certifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Award className="w-7 h-7 mx-auto stroke-1 mb-2 text-slate-300" />
                      <p className="text-xs">No professional certifications parsed.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {currentCandidate.certifications.map((cert, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50/50 hover:bg-slate-55 p-3 rounded border border-slate-250 transition flex items-start space-x-2.5 group"
                        >
                          <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded shrink-0 group-hover:scale-105 transition">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-bold text-slate-800 leading-tight truncate" title={cert.name}>
                              {cert.name}
                            </h4>
                            <p className="text-[10px] text-indigo-500 font-bold truncate">{cert.issuer}</p>
                            {cert.year && <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">Earned {cert.year}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 5: Projects */}
            {activeTab === "projects" && (
              <div id="tab-projects-panel" className="bg-white border border-slate-200 rounded p-5 shadow-sm animate-fade-in space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Projects & Codebases</span>
                  </h3>
                </div>

                {!currentCandidate.projects || currentCandidate.projects.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Layers className="w-8 h-8 mx-auto stroke-1 mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No major software or business projects detailed in the resume.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentCandidate.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 hover:bg-slate-100/50 p-4 rounded border border-slate-200 transition flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-slate-900 text-xs">{proj.name}</h4>
                            {proj.url && (
                              <a
                                href={proj.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-55 hover:text-indigo-75 p-1 rounded hover:bg-white transition shrink-0 cursor-pointer"
                                title="Visit project link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-normal">
                            {proj.description}
                          </p>
                        </div>

                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-200/60">
                            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-2">Technologies Used</p>
                            <div className="flex flex-wrap gap-1">
                              {proj.technologies.map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="bg-white text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </main>

      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-600 animate-spin" style={{ animationDuration: '10s' }} />
                <div>
                  <h3 className="font-bold text-slate-800 text-xs">Extraction Engine Settings</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Configure multi-provider models</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[9px] font-mono font-bold rounded">
                Client Secured
              </span>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4">
              
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  AI Model Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleTempProviderChange("gemini")}
                    className={`p-2.5 rounded border text-center transition cursor-pointer ${
                      tempProvider === "gemini"
                        ? "border-indigo-500 bg-indigo-50/40 text-indigo-700 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    }`}
                  >
                    <div className="text-xs">Gemini</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-normal">Google</div>
                  </button>
                  <button
                    onClick={() => handleTempProviderChange("openai")}
                    className={`p-2.5 rounded border text-center transition cursor-pointer ${
                      tempProvider === "openai"
                        ? "border-indigo-500 bg-indigo-50/40 text-indigo-700 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    }`}
                  >
                    <div className="text-xs">OpenAI</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-normal">GPT-4o</div>
                  </button>
                  <button
                    onClick={() => handleTempProviderChange("claude")}
                    className={`p-2.5 rounded border text-center transition cursor-pointer ${
                      tempProvider === "claude"
                        ? "border-indigo-500 bg-indigo-50/40 text-indigo-700 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                    }`}
                  >
                    <div className="text-xs">Claude</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-normal">Anthropic</div>
                  </button>
                </div>
              </div>

              {/* Model Choice Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Active Model Name
                </label>
                <div className="relative">
                  <select
                    value={
                      ["gemini-3.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"].includes(tempModel)
                        ? tempModel
                        : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setTempModel("");
                      } else {
                        setTempModel(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                  >
                    {tempProvider === "gemini" && (
                      <>
                        <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Recommended)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (Detailed Understanding)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Latest Model)</option>
                      </>
                    )}
                    {tempProvider === "openai" && (
                      <>
                        <option value="gpt-4o-mini">gpt-4o-mini (Extremely Fast & Cost-Effective)</option>
                        <option value="gpt-4o">gpt-4o (High-fidelity corporate parsing)</option>
                      </>
                    )}
                    {tempProvider === "claude" && (
                      <>
                        <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest (Highly Recommended)</option>
                        <option value="claude-3-5-haiku-latest">claude-3-5-haiku-latest (Fast Reasoning)</option>
                      </>
                    )}
                    <option value="custom">-- Custom Model Name --</option>
                  </select>
                </div>

                {/* Freeform input if custom model is chosen */}
                {!["gemini-3.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"].includes(tempModel) && (
                  <input
                    type="text"
                    placeholder="Enter custom model identifier (e.g. gpt-4-turbo)..."
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-medium mt-1.5"
                  />
                )}
              </div>

              {/* Secure API Key Config */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                    <Key className="w-3 h-3 text-slate-400" />
                    <span>API Credentials ({tempProvider})</span>
                  </label>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    {showKey ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide Key</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Show Key</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder={`Enter your ${tempProvider === "gemini" ? "Google Gemini" : tempProvider === "openai" ? "OpenAI" : "Anthropic Claude"} key...`}
                    value={tempKeys[tempProvider] || ""}
                    onChange={(e) =>
                      setTempKeys({ ...tempKeys, [tempProvider]: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 font-medium pr-10"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  🔑 <strong>Privacy Notice:</strong> Keys are stored directly in your local browser cache and never sent elsewhere. If left blank, parsing will fallback to the developer's server environment variables (if configured).
                </p>
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex justify-end items-center gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-600 rounded text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveSettings(tempProvider, tempModel, tempKeys)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Save Configuration
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
