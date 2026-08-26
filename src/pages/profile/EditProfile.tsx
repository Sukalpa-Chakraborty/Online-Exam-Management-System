import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  Save,
  Shield,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
} from "lucide-react";

import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import {
  removeProfilePicture,
  uploadProfilePicture,
} from "../../services/authService";

function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, userProfile, loading, refreshUserProfile } = useAuth();

  // Basic Information
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  // Student Information
  const [rollNumber, setRollNumber] = useState("");
  const [semester, setSemester] = useState("");
  const [collegeName, setCollegeName] = useState("");

  // Teacher Information
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

  // Profile Picture State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");

  // Status
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const role = userProfile?.role;

  useEffect(() => {
    if (!userProfile) return;

    setFullName(userProfile.name || "");
    setPhone(userProfile.phone || "");
    setDepartment(userProfile.department || "");

    // Student data
    setRollNumber(userProfile.rollNumber || "");
    setSemester(userProfile.semester || "");
    setCollegeName(userProfile.collegeName || "");

    // Teacher data
    setEmployeeId(userProfile.employeeId || "");
    setDesignation(userProfile.designation || "");
    setTeacherCode(userProfile.teacherCode || "");
  }, [userProfile]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith("blob:")) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const handlePhoneChange = (value: string) => {
    // Strip everything except digits
    let numericValue = value.replace(/\D/g, "");

    // If user pasted a 12-digit number starting with 91, or 11-digit starting with 0, trim prefix
    if (numericValue.length === 12 && numericValue.startsWith("91")) {
      numericValue = numericValue.slice(2);
    } else if (numericValue.length === 11 && numericValue.startsWith("0")) {
      numericValue = numericValue.slice(1);
    }

    setPhone(numericValue.slice(0, 10));
  };

  // Handle file selection and preview
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoError("");
    setPhotoSuccess("");
    setError("");
    setMessage("");

    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file format (PNG, JPG, JPEG, or WEBP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (5MB maximum)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setPhotoError("Selected image exceeds the 5MB file size limit. Please choose a smaller image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewURL(objectUrl);
  };

  // Cancel preview
  const handleCancelPreview = () => {
    if (previewURL && previewURL.startsWith("blob:")) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL(null);
    setSelectedFile(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload and persist profile picture
  const handleUploadPhoto = async () => {
    if (!user || !selectedFile) return;

    try {
      setUploadingPhoto(true);
      setPhotoError("");
      setPhotoSuccess("");

      await uploadProfilePicture(user.uid, selectedFile);
      await refreshUserProfile();

      if (previewURL && previewURL.startsWith("blob:")) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setPhotoSuccess("Profile picture updated and saved successfully!");
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      setPhotoError(
        err instanceof Error
          ? err.message
          : "Unable to upload profile picture. Please try again."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove profile picture
  const handleRemovePhoto = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture? Your avatar will revert to your initials."
    );
    if (!confirmed) return;

    try {
      setRemovingPhoto(true);
      setPhotoError("");
      setPhotoSuccess("");

      if (previewURL && previewURL.startsWith("blob:")) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL(null);
        setSelectedFile(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";

      await removeProfilePicture(user.uid, userProfile?.photoURL);
      await refreshUserProfile();

      setPhotoSuccess("Profile picture removed successfully.");
    } catch (err) {
      console.error("Failed to remove profile picture:", err);
      setPhotoError(
        err instanceof Error
          ? err.message
          : "Unable to remove profile picture. Please try again."
      );
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleSave = async () => {
    setMessage("");
    setError("");

    if (!user) {
      setError("You must be logged in to update your profile.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (phone.trim() && phone.trim().length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (role === "student") {
      if (!rollNumber.trim()) {
        setError("Please enter your roll number.");
        return;
      }

      if (!collegeName.trim()) {
        setError("Please enter your college name.");
        return;
      }
    }

    if (role === "teacher") {
      if (!teacherCode.trim()) {
        setError("Please enter your teacher code.");
        return;
      }
    }

    try {
      setSaving(true);

      // If a new photo is staged in preview, upload it alongside the text profile details
      if (selectedFile) {
        try {
          await uploadProfilePicture(user.uid, selectedFile);
          if (previewURL && previewURL.startsWith("blob:")) {
            URL.revokeObjectURL(previewURL);
          }
          setPreviewURL(null);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (photoErr) {
          console.warn("Photo upload during main save had issue:", photoErr);
        }
      }

      const profileRef = doc(db, "users", user.uid);

      const profileData: Record<string, unknown> = {
        name: fullName.trim(),
        phone: phone.trim(),
        updatedAt: serverTimestamp(),
      };

      if (role !== "admin") {
        profileData.department = department.trim();
      }

      if (role === "student") {
        profileData.rollNumber = rollNumber.trim();
        profileData.semester = semester.trim();
        profileData.collegeName = collegeName.trim();
      }

      if (role === "teacher") {
        profileData.employeeId = employeeId.trim();
        profileData.designation = designation.trim();
        profileData.teacherCode = teacherCode.trim();
      }

      await updateDoc(profileRef, profileData);
      await refreshUserProfile();

      setMessage("Your profile details were updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">
            Loading profile information...
          </p>
        </div>
      </div>
    );
  }

  if (role !== "student" && role !== "teacher" && role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-base font-bold text-slate-900">
            Profile Not Available
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Your user role is not supported for profile editing.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = previewURL || userProfile.photoURL;
  const initialLetter = fullName
    ? fullName.charAt(0).toUpperCase()
    : (user.email ? user.email.charAt(0).toUpperCase() : "U");

  return (
    <DashboardLayout
      role={role}
      title="Edit Profile"
      subtitle="Manage your personal information, profile photo, and credentials."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        {/* Profile Card Header Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Circular Avatar with Hover Overlay */}
            <div className="relative group shrink-0">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={fullName || "User Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">
                    {initialLetter}
                  </span>
                )}

                {/* Hover Camera Icon Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || removingPhoto}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white"
                  title="Click to select new profile picture"
                >
                  <Camera size={22} className="stroke-[2.2]" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
                    Change
                  </span>
                </button>
              </div>

              {/* Preview Status Pill */}
              {previewURL && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  Preview
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-100 backdrop-blur-xs">
                {role === "admin" ? (
                  <Shield size={12} />
                ) : role === "teacher" ? (
                  <UserCheck size={12} />
                ) : (
                  <GraduationCap size={12} />
                )}
                <span>{role} Account</span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl truncate">
                {fullName || "User Profile"}
              </h1>

              <p className="mt-1 text-xs text-blue-100 truncate">{user.email}</p>
            </div>
          </div>
        </section>

        {/* Global Feedback Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Profile Picture Management Section */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Camera size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Profile Picture
                </h2>
                <p className="text-xs text-slate-500">
                  Upload a custom photo or manage your circular avatar
                </p>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {photoError && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{photoError}</span>
            </div>
          )}

          {photoSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{photoSuccess}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-slate-200 bg-white shadow-xs flex items-center justify-center">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={fullName || "User Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-slate-700">
                    {initialLetter}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900">
                  {selectedFile
                    ? selectedFile.name
                    : userProfile.photoURL
                    ? "Custom Profile Picture Active"
                    : "Default Initials Avatar"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to save`
                    : "PNG, JPG, or WEBP. Max file size: 5MB."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {selectedFile ? (
                <>
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving Photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Save Picture</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={removingPhoto}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>{userProfile.photoURL ? "Change Photo" : "Upload Photo"}</span>
                  </button>

                  {userProfile.photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={removingPhoto}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60 cursor-pointer"
                    >
                      {removingPhoto ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      <span>Remove</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Basic Details Section */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500">
                Primary contact details & identifiers
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-500 outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Managed via authentication provider.
              </p>
            </div>

            {/* Mobile Number (India) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Mobile Number (India)
                </label>
                {phone.length === 10 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 size={12} />
                    10-digit number
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center gap-1.5 border-r border-slate-200 pr-2.5 text-xs font-bold text-slate-600">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={10}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-20 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Enter 10-digit mobile number</span>
                <span className={phone.length === 10 ? "font-bold text-emerald-600" : ""}>
                  {phone.length}/10 digits
                </span>
              </div>
            </div>

            {/* Department */}
            {role !== "admin" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Department
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Role Specific Section */}
        {role === "student" && (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Academic Information
                </h2>
                <p className="text-xs text-slate-500">
                  Roll number, semester, and college institution
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Roll Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 2024-CSE-042"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Semester / Term
                </label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 4th Semester"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  College / Institute Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="Enter your college or institution name"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {role === "teacher" && (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Professional Teacher Credentials
                </h2>
                <p className="text-xs text-slate-500">
                  Employee ID, faculty designation, and teacher special code
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Employee / Faculty ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-9921"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Academic Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Assistant Professor"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Teacher Special Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    placeholder="4+ character secret code"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Used for two-step security verification whenever you sign into your teacher portal.
                </p>
              </div>
            </div>
          </section>
        )}



        {/* Save CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-7 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EditProfile;
