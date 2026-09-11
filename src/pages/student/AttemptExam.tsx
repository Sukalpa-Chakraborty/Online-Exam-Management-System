import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CloudOff,
  Eye,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
  XCircle,
} from "lucide-react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import { getStudentClasses } from "../../services/classService";
import {
  notifyAdminsOfClassGrade,
  notifyTeacherOfSubmission,
} from "../../services/notificationService";
import {
  clearDraftAttempt,
  getDraftAttempt,
  saveDraftAttempt,
  subscribeToAttempt,
  type DeviceStatus,
  type IntegrityEvent,
  type IntegrityEventType,
} from "../../services/examAttemptService";
import {
  calculateExamEndTime,
  getExamScheduleDetails,
  getServerTime,
} from "../../services/serverTimeService";

type QuestionType = "mcq" | "true_false" | "short_answer";
type OptionKey = "A" | "B" | "C" | "D";

interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  status: string;
  teacherId?: string;
}

interface QuestionOptions {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
}

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: QuestionOptions;
  correctAnswer?: string;
  marks: number;
}

interface ResultQuestion extends Question {
  selectedAnswer?: string;
  isCorrect: boolean | null;
  evaluationStatus: "auto_evaluated" | "pending" | "evaluated";
  awardedMarks: number;
  feedback?: string;
}

interface ExamResult {
  examId: string;
  examTitle: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  submittedAutomatically: boolean;
  evaluationStatus: "pending" | "partially_evaluated" | "evaluated";
  pendingEvaluationCount: number;
  questions: ResultQuestion[];
  integrityWarningsCount?: number;
  integrityLogs?: IntegrityEvent[];
}

function AttemptExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt, setStartedAt] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Flow Step: "pre_check" | "active" | "cancelled"
  const [flowStep, setFlowStep] = useState<"pre_check" | "active" | "cancelled">("pre_check");
  const [cancellationInfo, setCancellationInfo] = useState<{
    reason?: string;
    cancelledByName?: string;
    cancelledAt?: string;
  } | null>(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "offline" | "failed"
  >("idle");
  const [lastSavedText, setLastSavedText] = useState("");
  const autoSaveTimerRef = useRef<number | null>(null);

  // Integrity & Device monitoring state
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: "ready",
    mic: "ready",
    fullscreen: "inactive",
  });
  const [integrityWarningsCount, setIntegrityWarningsCount] = useState(0);
  const [integrityLogs, setIntegrityLogs] = useState<IntegrityEvent[]>([]);
  const [activeWarningMessage, setActiveWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Media streams & Audio metering
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [testingDevices, setTestingDevices] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [pipMinimized, setPipMinimized] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioMeterAnimationRef = useRef<number | null>(null);

  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  const integrityLogsRef = useRef(integrityLogs);
  const integrityWarningsRef = useRef(integrityWarningsCount);
  const startedAtRef = useRef(startedAt);
  const deviceStatusRef = useRef(deviceStatus);
  const lastViolationTimeRef = useRef<number>(0);

  // Sync refs
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    integrityLogsRef.current = integrityLogs;
  }, [integrityLogs]);

  useEffect(() => {
    integrityWarningsRef.current = integrityWarningsCount;
  }, [integrityWarningsCount]);

  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    deviceStatusRef.current = deviceStatus;
  }, [deviceStatus]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  // Attach stream to video elements whenever mediaStream or refs change
  useEffect(() => {
    if (mediaStream) {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
      if (activeVideoRef.current) {
        activeVideoRef.current.srcObject = mediaStream;
      }
    }
  }, [mediaStream, flowStep, pipMinimized]);

  // Clean up all media streams and audio context safely
  const stopAllMediaStreams = () => {
    if (audioMeterAnimationRef.current) {
      cancelAnimationFrame(audioMeterAnimationRef.current);
      audioMeterAnimationRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Track stop notice:", e);
        }
      });
      mediaStreamRef.current = null;
    }
    setMediaStream(null);
  };

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMediaStreams();
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Request & Test Devices (Camera & Microphone)
  const testDevicesAndPermissions = async () => {
    setTestingDevices(true);
    setError("");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDeviceStatus((prev) => ({
          ...prev,
          camera: "not_found",
          mic: "not_found",
        }));
        setError("Media devices are not supported in this browser environment.");
        setTestingDevices(false);
        return;
      }

      // Stop previous streams if any
      stopAllMediaStreams();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });

      setMediaStream(stream);
      mediaStreamRef.current = stream;
      setCameraPermissionGranted(true);
      setMicPermissionGranted(true);

      setDeviceStatus((prev) => ({
        ...prev,
        camera: "active",
        mic: "active",
      }));

      // Set up simple audio metering
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!mediaStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            audioMeterAnimationRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (audioErr) {
        console.warn("Audio meter init notice:", audioErr);
      }
    } catch (err: unknown) {
      console.warn("Media device request notice:", err);
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      setDeviceStatus((prev) => ({
        ...prev,
        camera: isDenied ? "denied" : "offline",
        mic: isDenied ? "denied" : "offline",
      }));

      if (isDenied) {
        setError("Camera and/or Microphone permission was denied. Please allow device access in your browser settings.");
      } else {
        setError("Could not access camera/microphone. You may proceed if non-proctored, but proctoring indicators will log device unavailability.");
      }
    } finally {
      setTestingDevices(false);
    }
  };

  // Load Exam and Restore Existing Draft Answers
  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) {
        setError("Exam ID is missing from the URL.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("You must be logged in to attempt this exam.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const existingResultRef = doc(
          db,
          "users",
          user.uid,
          "examResults",
          examId
        );

        const existingResultSnapshot = await getDoc(existingResultRef);

        if (existingResultSnapshot.exists()) {
          const resData = existingResultSnapshot.data();
          if (resData.status === "cancelled") {
            setCancellationInfo({
              reason: resData.cancellationReason,
              cancelledByName: resData.cancelledByName,
              cancelledAt: resData.cancelledAt,
            });
            setFlowStep("cancelled");
            setLoading(false);
            return;
          }
          setError("You have already completed this exam.");
          setLoading(false);
          return;
        }

        const examRef = doc(db, "exams", examId);
        const examSnapshot = await getDoc(examRef);

        if (!examSnapshot.exists()) {
          setError("Exam not found.");
          setLoading(false);
          return;
        }

        const examData = examSnapshot.data();

        if (examData.status !== "published") {
          setError("This exam is not available.");
          setLoading(false);
          return;
        }

        if (Array.isArray(examData.classIds) && examData.classIds.length > 0) {
          const joinedClassIds = new Set(
            (await getStudentClasses(user.uid)).map((item) => item.id)
          );
          if (
            !examData.classIds.some((classId: string) =>
              joinedClassIds.has(classId)
            )
          ) {
            setError(
              "You must join the assigned class before attempting this exam."
            );
            setLoading(false);
            return;
          }
        }

        const duration = Number(examData.duration) || 30;
        const calculatedEndTime =
          examData.endTime ||
          calculateExamEndTime(examData.startTime, duration);

        const schedule = getExamScheduleDetails(
          examData.startTime,
          duration,
          calculatedEndTime
        );

        if (schedule.status === "scheduled") {
          const startTimeStr = examData.startTime
            ? new Date(examData.startTime).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "the scheduled time";
          setError(
            `This exam has not started yet. It will open at ${startTimeStr}.`
          );
          setLoading(false);
          return;
        }

        if (schedule.status === "completed") {
          const endTimeStr = calculatedEndTime
            ? new Date(calculatedEndTime).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "the scheduled end time";
          setError(
            `The exam window closed at ${endTimeStr}. Attempts are no longer accepted.`
          );
          setLoading(false);
          return;
        }

        setExam({
          id: examSnapshot.id,
          title: examData.title || "Untitled Exam",
          subject: examData.subject || "General",
          duration,
          startTime: examData.startTime,
          endTime: calculatedEndTime,
          status: examData.status,
          teacherId: examData.teacherId || "",
        });

        // Load Questions
        const questionsRef = collection(db, "exams", examId, "questions");
        const questionsSnapshot = await getDocs(questionsRef);

        const loadedQuestions: Question[] = questionsSnapshot.docs.map(
          (questionDoc) => {
            const data = questionDoc.data();
            let questionType: QuestionType = "mcq";

            const rawType = String(
              data.type || data.questionType || "mcq"
            )
              .toLowerCase()
              .replace(/[\s\-/]+/g, "_");

            if (rawType === "true_false" || rawType === "truefalse") {
              questionType = "true_false";
            } else if (
              rawType === "short_answer" ||
              rawType === "shortanswer" ||
              rawType === "short"
            ) {
              questionType = "short_answer";
            }

            return {
              id: questionDoc.id,
              question: data.question || "",
              type: questionType,
              options: {
                A: data.options?.A || data.optionA || "",
                B: data.options?.B || data.optionB || "",
                C: data.options?.C || data.optionC || "",
                D: data.options?.D || data.optionD || "",
              },
              correctAnswer: data.correctAnswer || data.correctOption || "",
              marks: Number(data.marks) || 1,
            };
          }
        );

        if (loadedQuestions.length === 0) {
          setError("This exam has no questions.");
          setLoading(false);
          return;
        }

        setQuestions(loadedQuestions);

        // Attempt Answer & State Recovery
        const existingDraft = await getDraftAttempt(user.uid, examId);

        if (existingDraft?.status === "cancelled") {
          setCancellationInfo({
            reason: existingDraft.cancellationReason,
            cancelledByName: existingDraft.cancelledByName,
            cancelledAt: existingDraft.cancelledAt,
          });
          setFlowStep("cancelled");
          setLoading(false);
          return;
        }

        const now = getServerTime();
        const endTimeMs = new Date(calculatedEndTime).getTime();
        const windowRemainingSeconds = Math.max(
          0,
          Math.floor((endTimeMs - now) / 1000)
        );

        if (existingDraft && existingDraft.startedAt) {
          setStartedAt(existingDraft.startedAt);
          setAnswers(existingDraft.answers || {});
          setIntegrityWarningsCount(existingDraft.integrityWarningsCount || 0);
          setIntegrityLogs(existingDraft.integrityLogs || []);
          setSaveStatus("saved");
          setLastSavedText("Recovered from previous session");

          // Calculate remaining time considering both personal startedAt and window deadline
          const elapsedSeconds = Math.floor(
            (now - new Date(existingDraft.startedAt).getTime()) / 1000
          );
          const personalRemainingSeconds = Math.max(
            0,
            duration * 60 - elapsedSeconds
          );
          const effectiveRemaining = Math.min(
            windowRemainingSeconds,
            personalRemainingSeconds
          );

          setTimeLeft(effectiveRemaining);
          setFlowStep("active");
        } else {
          // New Attempt: effective time is bounded by the window end
          const effectiveRemaining = Math.min(
            windowRemainingSeconds,
            duration * 60
          );
          setTimeLeft(effectiveRemaining);
          setFlowStep("pre_check");
        }
      } catch (err: unknown) {
        console.error("FAILED TO LOAD EXAM", err);
        const msg = err instanceof Error ? err.message : "Unknown error occurred.";
        setError(`Unable to load exam: ${msg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId, user]);

  // Real-time listener on active attempt document to detect Teacher cancellation immediately
  useEffect(() => {
    if (!user || !examId || flowStep === "cancelled") return;

    const unsubscribe = subscribeToAttempt(user.uid, examId, (updatedAttempt) => {
      if (updatedAttempt && updatedAttempt.status === "cancelled") {
        stopAllMediaStreams();
        setCancellationInfo({
          reason: updatedAttempt.cancellationReason,
          cancelledByName: updatedAttempt.cancelledByName,
          cancelledAt: updatedAttempt.cancelledAt,
        });
        setFlowStep("cancelled");
      }
    });

    return () => unsubscribe();
  }, [user, examId, flowStep]);

  // Auto-Save Execution Function
  const performSave = async (currentAnswersMap: Record<string, string>) => {
    if (
      !user ||
      !exam ||
      submitting ||
      submittedRef.current ||
      !startedAtRef.current ||
      flowStep !== "active"
    ) {
      return;
    }

    setSaveStatus("saving");

    try {
      const studentName =
        userProfile?.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student";

      const res = await saveDraftAttempt(user.uid, exam.id, {
        studentName,
        studentEmail: user.email || userProfile?.email || "",
        examTitle: exam.title,
        teacherId: exam.teacherId,
        answers: currentAnswersMap,
        startedAt: startedAtRef.current,
        integrityWarningsCount: integrityWarningsRef.current,
        integrityLogs: integrityLogsRef.current,
        deviceStatus: deviceStatusRef.current,
        status: "in_progress",
      });

      if (res.cancelled) {
        stopAllMediaStreams();
        setFlowStep("cancelled");
        return;
      }

      if (res.syncedToServer) {
        setSaveStatus("saved");
        setLastSavedText(
          `Saved at ${new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`
        );
      } else {
        setSaveStatus("offline");
        setLastSavedText("Saved locally (offline)");
      }
    } catch (saveError) {
      console.warn("Auto-save attempt notice:", saveError);
      setSaveStatus("failed");
      setLastSavedText("Failed to sync (saved locally)");
    }
  };

  // Debounced Auto-Save Trigger on Answer Changes
  useEffect(() => {
    if (loading || submitting || submittedRef.current || !exam || !user || flowStep !== "active") return;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      void performSave(answers);
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [answers, loading, submitting, exam, user, flowStep]);

  // Periodic Auto-Save Heartbeat (Every 20 Seconds)
  useEffect(() => {
    if (loading || submitting || submittedRef.current || !exam || !user || flowStep !== "active") return;

    const interval = window.setInterval(() => {
      void performSave(answersRef.current);
    }, 20000);

    return () => window.clearInterval(interval);
  }, [loading, submitting, exam, user, flowStep]);

  // Exam Integrity Event Logger with De-duplication
  const logIntegrityEvent = (
    type: IntegrityEventType,
    category: IntegrityEvent["category"],
    details: string
  ) => {
    if (loading || submitting || submittedRef.current || !exam || !user || flowStep !== "active") return;

    // De-duplicate events firing within 1 second of each other (e.g. visibility change + window blur)
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1000) {
      return;
    }
    lastViolationTimeRef.current = now;

    const event: IntegrityEvent = {
      type,
      category,
      timestamp: new Date().toISOString(),
      details,
    };

    setIntegrityLogs((prev) => [...prev, event]);
    setIntegrityWarningsCount((prev) => {
      const nextCount = prev + 1;
      setActiveWarningMessage(
        `Integrity Notice (${nextCount}): ${details}`
      );
      return nextCount;
    });

    // Immediately persist draft with new integrity event
    void performSave(answersRef.current);
  };

  // Integrity Event Listeners (Tab Switch, Window Blur, Fullscreen Exit, Media Disconnects)
  useEffect(() => {
    if (loading || submitting || submittedRef.current || !exam || !user || flowStep !== "active") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logIntegrityEvent(
          "tab_switch",
          "suspicious",
          "Browser tab switched or exam window minimized."
        );
      }
    };

    const handleWindowBlur = () => {
      logIntegrityEvent(
        "window_blur",
        "suspicious",
        "Exam window lost focus (clicked outside or switched application)."
      );
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFullscreen);
      setDeviceStatus((prev) => ({
        ...prev,
        fullscreen: isNowFullscreen ? "active" : "inactive",
      }));

      if (!isNowFullscreen && isFullscreen) {
        logIntegrityEvent(
          "fullscreen_exit",
          "suspicious",
          "Exited distraction-free fullscreen mode."
        );
      }
    };

    const handleDeviceChange = () => {
      // Check if tracks ended or devices changed
      if (mediaStreamRef.current) {
        const videoTracks = mediaStreamRef.current.getVideoTracks();
        const audioTracks = mediaStreamRef.current.getAudioTracks();

        const videoActive = videoTracks.some((t) => t.readyState === "live");
        const audioActive = audioTracks.some((t) => t.readyState === "live");

        setDeviceStatus((prev) => ({
          ...prev,
          camera: videoActive ? "active" : "offline",
          mic: audioActive ? "active" : "offline",
        }));

        if (!videoActive) {
          logIntegrityEvent(
            "camera_disconnected",
            "device_issue",
            "Camera stream disconnected or unavailable."
          );
        }
        if (!audioActive) {
          logIntegrityEvent(
            "mic_disconnected",
            "device_issue",
            "Microphone stream disconnected or unavailable."
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
    };
  }, [loading, submitting, exam, user, isFullscreen, flowStep]);

  // Request Fullscreen Mode
  const enterFullscreenMode = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setDeviceStatus((prev) => ({ ...prev, fullscreen: "active" }));
      }
    } catch (e) {
      console.warn("Fullscreen request error:", e);
      setDeviceStatus((prev) => ({ ...prev, fullscreen: "unsupported" }));
    }
  };

  // Exit / Toggle Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await enterFullscreenMode();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setDeviceStatus((prev) => ({ ...prev, fullscreen: "inactive" }));
      }
    } catch (e) {
      console.warn("Fullscreen toggle notice:", e);
    }
  };

  // Action: Start Exam from Pre-Check Screen (Triggered directly by Student click)
  const handleStartExamFromPreCheck = async () => {
    if (!exam || !user) return;

    // 1. Re-verify live schedule status
    const schedule = getExamScheduleDetails(
      exam.startTime,
      exam.duration,
      exam.endTime
    );

    if (schedule.status === "scheduled") {
      setError("This exam has not started yet.");
      return;
    }
    if (schedule.status === "completed") {
      setError("The exam window has ended. Attempts are no longer permitted.");
      return;
    }

    // 2. Trigger Fullscreen from this direct user interaction
    await enterFullscreenMode();

    // 3. Set start time and initialize draft
    const attemptStartTime =
      startedAt || new Date(getServerTime()).toISOString();
    setStartedAt(attemptStartTime);
    startedAtRef.current = attemptStartTime;

    const now = getServerTime();
    const endTimeMs = exam.endTime
      ? new Date(exam.endTime).getTime()
      : new Date(schedule.endTime).getTime();
    const windowRemainingSeconds = Math.max(
      0,
      Math.floor((endTimeMs - now) / 1000)
    );
    const personalRemainingSeconds = exam.duration * 60;
    const effectiveRemaining = Math.min(
      windowRemainingSeconds,
      personalRemainingSeconds
    );
    setTimeLeft(effectiveRemaining);

    const studentName =
      userProfile?.name ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Student";

    void saveDraftAttempt(user.uid, exam.id, {
      studentName,
      studentEmail: user.email || userProfile?.email || "",
      examTitle: exam.title,
      teacherId: exam.teacherId,
      answers: answersRef.current,
      startedAt: attemptStartTime,
      integrityWarningsCount: 0,
      integrityLogs: [],
      deviceStatus: {
        camera: mediaStreamRef.current?.getVideoTracks().some((t) => t.readyState === "live")
          ? "active"
          : "offline",
        mic: mediaStreamRef.current?.getAudioTracks().some((t) => t.readyState === "live")
          ? "active"
          : "offline",
        fullscreen: Boolean(document.fullscreenElement) ? "active" : "inactive",
      },
      status: "in_progress",
    });

    setFlowStep("active");
  };

  // Timer Countdown during Active Exam with Authoritative Server Time Synchronization
  useEffect(() => {
    if (loading || submitting || submittedRef.current || !exam || flowStep !== "active") return;

    const calculateAuthoritativeRemaining = () => {
      const now = getServerTime();
      const endTimeMs = exam.endTime
        ? new Date(exam.endTime).getTime()
        : exam.startTime
        ? new Date(exam.startTime).getTime() + exam.duration * 60000
        : now + exam.duration * 60000;
      const windowRemainingSeconds = Math.max(
        0,
        Math.floor((endTimeMs - now) / 1000)
      );

      const startedAtMs = startedAt ? new Date(startedAt).getTime() : now;
      const personalRemainingSeconds = Math.max(
        0,
        Math.floor(exam.duration * 60 - (now - startedAtMs) / 1000)
      );

      return Math.min(windowRemainingSeconds, personalRemainingSeconds);
    };

    const initialRemaining = calculateAuthoritativeRemaining();
    if (initialRemaining <= 0) {
      setTimeLeft(0);
      void submitExam(true);
      return;
    }

    const timer = window.setInterval(() => {
      const remaining = calculateAuthoritativeRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        void submitExam(true);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading, submitting, exam, startedAt, flowStep]);

  // Submit Exam Function
  const submitExam = async (
    autoSubmit = false,
    currentAnswers = answers
  ) => {
    if (
      submittedRef.current ||
      !exam ||
      !user ||
      questions.length === 0 ||
      flowStep === "cancelled"
    ) {
      return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    setError("");

    // Stop all media streams immediately upon submission
    stopAllMediaStreams();

    try {
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let unanswered = 0;
      let obtainedMarks = 0;
      let pendingEvaluationCount = 0;

      const resultQuestions: ResultQuestion[] = questions.map((question) => {
        const selectedAnswer = currentAnswers[question.id]?.trim() || "";

        // SHORT ANSWER
        if (question.type === "short_answer") {
          if (!selectedAnswer) unanswered++;
          pendingEvaluationCount++;

          return {
            ...question,
            selectedAnswer,
            isCorrect: null,
            evaluationStatus: "pending",
            awardedMarks: 0,
          };
        }

        // MCQ / TRUE FALSE
        const isCorrect =
          selectedAnswer.toLowerCase() ===
          String(question.correctAnswer || "")
            .trim()
            .toLowerCase();

        if (!selectedAnswer) {
          unanswered++;
        } else if (isCorrect) {
          correctAnswers++;
          obtainedMarks += question.marks;
        } else {
          wrongAnswers++;
        }

        return {
          ...question,
          selectedAnswer,
          isCorrect,
          evaluationStatus: "auto_evaluated",
          awardedMarks: isCorrect ? question.marks : 0,
        };
      });

      const totalMarks = questions.reduce(
        (total, question) => total + question.marks,
        0
      );

      const percentage =
        totalMarks > 0
          ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2))
          : 0;

      const result: ExamResult = {
        examId: exam.id,
        examTitle: exam.title,
        subject: exam.subject,
        totalQuestions: questions.length,
        correctAnswers,
        wrongAnswers,
        unanswered,
        obtainedMarks,
        totalMarks,
        percentage,
        submittedAutomatically: autoSubmit,
        evaluationStatus:
          pendingEvaluationCount > 0 ? "pending" : "evaluated",
        pendingEvaluationCount,
        questions: resultQuestions,
        integrityWarningsCount: integrityWarningsRef.current,
        integrityLogs: integrityLogsRef.current,
      };

      const resultRef = doc(db, "users", user.uid, "examResults", exam.id);

      await setDoc(resultRef, {
        ...result,
        studentId: user.uid,
        studentName:
          userProfile?.name ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "Student",
        studentEmail: user.email || userProfile?.email || "",
        teacherId: exam.teacherId || "",
        status: "submitted",
        submittedAt: serverTimestamp(),
      });

      // Cleanup temporary active attempt draft
      await clearDraftAttempt(user.uid, exam.id);

      const studentName =
        userProfile?.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Student";

      void notifyTeacherOfSubmission({
        teacherId: exam.teacherId,
        examTitle: exam.title,
        studentName,
      }).catch((notificationError) =>
        console.error("Teacher notification failed:", notificationError)
      );

      if (pendingEvaluationCount === 0) {
        void notifyAdminsOfClassGrade({
          examId: exam.id,
          examTitle: exam.title,
        }).catch((notificationError) =>
          console.error("Admin grade notification failed:", notificationError)
        );
      }

      // Exit fullscreen if still active
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (e) {
          console.warn("Fullscreen exit notice:", e);
        }
      }

      navigate(`/student/exams/${exam.id}/result`, {
        state: { result },
        replace: true,
      });
    } catch (err: unknown) {
      console.error("FAILED TO SUBMIT EXAM", err);
      const msg = err instanceof Error ? err.message : "Unknown submission error.";
      setError(`Failed to submit exam: ${msg}`);
      setSubmitting(false);
      submittedRef.current = false;
    }
  };

  const handleManualSubmit = () => {
    const answeredCount = Object.keys(answers).filter(
      (key) => answers[key]?.trim()
    ).length;

    const unansweredCount = questions.length - answeredCount;

    let confirmMessage = "Are you sure you want to finish and submit your exam?";

    if (unansweredCount > 0) {
      confirmMessage = `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`;
    }

    if (window.confirm(confirmMessage)) {
      void submitExam(false);
    }
  };

  const selectAnswer = (questionId: string, value: string) => {
    if (submitting || submittedRef.current || flowStep !== "active") return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const currentQuestionData = questions[currentQuestion];

  const optionKeys = useMemo<OptionKey[]>(
    () => ["A", "B", "C", "D"],
    []
  );

  const answeredQuestions = Object.keys(answers).filter(
    (key) => answers[key]?.trim()
  ).length;

  const progressPercentage =
    questions.length > 0
      ? Math.round((answeredQuestions / questions.length) * 100)
      : 0;

  // ----------------------------------------------------
  // RENDER: Loading Screen
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Initializing exam session and proctoring environment...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Error Screen (if blocked)
  // ----------------------------------------------------
  if (error && flowStep === "pre_check" && !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            Unable to Start Exam
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate("/student/exams")}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
          >
            Back to Available Exams
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: CANCELLED BY TEACHER SCREEN
  // ----------------------------------------------------
  if (flowStep === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-slate-900 p-8 text-center shadow-2xl shadow-red-950/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/30">
            <XCircle size={36} />
          </div>
          <span className="mt-4 inline-block rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-bold text-red-300 ring-1 ring-red-500/30 uppercase tracking-wider">
            Attempt Terminated
          </span>
          <h1 className="mt-3 text-xl font-bold text-white">
            Exam Attempt Cancelled
          </h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Your instructor ({cancellationInfo?.cancelledByName || "Exam Administrator"}) has cancelled this active exam attempt.
          </p>

          {cancellationInfo?.reason && (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Reason Provided by Instructor:
              </p>
              <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                "{cancellationInfo.reason}"
              </p>
            </div>
          )}

          <p className="mt-4 text-[11px] text-slate-500">
            Your answered progress and integrity audit logs have been preserved for teacher review.
          </p>

          <button
            type="button"
            onClick={() => navigate("/student/dashboard", { replace: true })}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 cursor-pointer"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: PRE-EXAM INTEGRITY & PERMISSIONS CHECK
  // ----------------------------------------------------
  if (flowStep === "pre_check" && exam) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {/* Header Specs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                  {exam.subject}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock3 size={14} className="text-blue-400" />
                  <span>{exam.duration} Minutes Max</span>
                </span>
                {exam.endTime && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Window Ends: {new Date(exam.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {exam.title}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/exams")}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Timing & Late Start Warning Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Timer size={16} />
              <span>
                Your Available Attempt Time: <b>{formatTimer(timeLeft)}</b>
              </span>
            </div>
            {exam.endTime && (
              <span className="text-[11px] text-slate-400">
                Exam window closes promptly at {new Date(exam.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-300">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Device & Camera Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex items-center justify-center">
                {mediaStream ? (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-3">
                      <Camera size={32} />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">
                      Camera preview not started
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
                      Click "Test Devices & Permissions" below to enable your camera and microphone.
                    </p>
                  </div>
                )}

                {/* Live Camera Active Badge */}
                {mediaStream && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md ring-1 ring-emerald-500/40">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Camera Live</span>
                  </div>
                )}

                {/* Audio Meter in Preview */}
                {mediaStream && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-2xl bg-slate-950/85 px-3 py-2 text-xs backdrop-blur-md border border-slate-800">
                    <Mic size={14} className="text-blue-400 shrink-0" />
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">Mic Activity</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${Math.max(5, audioLevel)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Device Test Button */}
              <button
                type="button"
                onClick={testDevicesAndPermissions}
                disabled={testingDevices}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 py-3 text-xs font-bold text-blue-300 shadow-sm transition hover:bg-blue-500/20 disabled:opacity-60 cursor-pointer"
              >
                {testingDevices ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Requesting device permissions...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={15} />
                    <span>{mediaStream ? "Retest Devices & Camera" : "Test Devices & Permissions"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Rules & Permissions Disclosure */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <ShieldCheck size={18} />
                  <h3 className="text-sm font-bold text-white">Proctoring Disclosure</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  To ensure academic integrity, this exam uses transparent proctoring guidelines:
                </p>

                <div className="space-y-3 text-xs">
                  {/* Fullscreen Requirement */}
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-950/70 p-3 border border-slate-800/80">
                    <Maximize2 size={16} className="mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Fullscreen Exam Mode</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Exam launches in fullscreen. Exiting fullscreen mode will be logged as an integrity notice.
                      </p>
                    </div>
                  </div>

                  {/* Camera & Mic */}
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-950/70 p-3 border border-slate-800/80">
                    <Camera size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Device Status Monitoring</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Camera and microphone presence is verified. No videos are stored on cloud servers.
                      </p>
                    </div>
                  </div>

                  {/* Tab switch */}
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-950/70 p-3 border border-slate-800/80">
                    <Eye size={16} className="mt-0.5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Tab & Focus Tracking</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Switching browser tabs or minimizing the test window will be recorded.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Readiness Checklist */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className={`h-2 w-2 rounded-full ${cameraPermissionGranted ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span>Camera: {cameraPermissionGranted ? "Ready" : "Pending"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className={`h-2 w-2 rounded-full ${micPermissionGranted ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span>Mic: {micPermissionGranted ? "Ready" : "Pending"}</span>
                  </div>
                </div>
              </div>

              {/* Start Exam Button */}
              <button
                type="button"
                onClick={handleStartExamFromPreCheck}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
              >
                <Play size={18} />
                <span>Start Exam & Enter Fullscreen</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-[11px] text-slate-600">
          ExamSphere Transparent Proctoring • All media tracks stop automatically upon exam submission
        </footer>
      </div>
    );
  }

  if (!exam || !currentQuestionData) {
    return null;
  }

  // ----------------------------------------------------
  // RENDER: ACTIVE PROCTORED EXAM INTERFACE
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070b14] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Proctoring & Timer Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brand & Exam Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white line-clamp-1">
                {exam.title}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {exam.subject} • Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
          </div>

          {/* Center Proctoring Telemetry Badges */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Monitored Status */}
            <div className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Proctored Session</span>
            </div>

            {/* Camera Status */}
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                deviceStatus.camera === "active"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-500/20"
              }`}
            >
              {deviceStatus.camera === "active" ? <Camera size={12} /> : <CameraOff size={12} />}
              <span>{deviceStatus.camera === "active" ? "Camera Active" : "Camera Offline"}</span>
            </div>

            {/* Microphone Status */}
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                deviceStatus.mic === "active"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-500/20"
              }`}
            >
              {deviceStatus.mic === "active" ? <Mic size={12} /> : <MicOff size={12} />}
              <span>{deviceStatus.mic === "active" ? "Mic Active" : "Mic Offline"}</span>
            </div>

            {/* Fullscreen Status */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                isFullscreen
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-100"
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isFullscreen ? "Fullscreen" : "Windowed (Click to Maximize)"}</span>
            </button>

            {/* Violation Warnings Counter */}
            {integrityWarningsCount > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                <ShieldAlert size={12} />
                <span>{integrityWarningsCount} Notice{integrityWarningsCount > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Right Timer & Save Status */}
          <div className="flex items-center gap-3">
            {/* Auto-save badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {saveStatus === "saving" ? (
                <>
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span className="truncate max-w-[120px]">{lastSavedText || "Saved"}</span>
                </>
              ) : saveStatus === "offline" ? (
                <>
                  <CloudOff size={13} className="text-amber-500" />
                  <span>Offline (Saved locally)</span>
                </>
              ) : (
                <span className="text-slate-400">Auto-save ready</span>
              )}
            </div>

            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold shadow-xs transition-colors ${
                timeLeft < 300
                  ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 ring-2 ring-red-500/30 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
              }`}
            >
              <Clock3 size={16} className={timeLeft < 300 ? "text-red-500" : "text-blue-600 dark:text-blue-400"} />
              <span className="font-mono tracking-wider">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Active Warning Notification Toast Banner */}
        {activeWarningMessage && (
          <div className="flex items-center justify-between gap-3 bg-amber-500/15 border-t border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <span>{activeWarningMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveWarningMessage(null)}
              className="rounded p-0.5 text-amber-600 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </header>

      {/* Floating Picture-in-Picture Live Webcam Widget */}
      {mediaStream && (
        <div className="fixed bottom-4 right-4 z-50 transition-all duration-300">
          <div className={`overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl ${pipMinimized ? "h-10 w-36" : "h-36 w-48 sm:h-44 sm:w-56"}`}>
            <div className="flex h-7 items-center justify-between bg-slate-900/90 px-2.5 text-[10px] font-bold text-slate-300 border-b border-slate-800">
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Feed</span>
              </div>
              <button
                type="button"
                onClick={() => setPipMinimized((prev) => !prev)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
                title={pipMinimized ? "Expand Camera Feed" : "Minimize Camera Feed"}
              >
                {pipMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
            </div>

            {!pipMinimized && (
              <div className="relative h-[calc(100%-1.75rem)] w-full bg-black">
                <video
                  ref={activeVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Question & Navigation Container */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Question Card Panel */}
          <section className="lg:col-span-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
            {/* Question Header & Marks */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-blue-50 dark:bg-blue-950/50 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Question {currentQuestion + 1}
                </span>
                <span className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {currentQuestionData.type.replace("_", " ")}
                </span>
              </div>

              <span className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentQuestionData.marks} Mark{currentQuestionData.marks > 1 ? "s" : ""}
              </span>
            </div>

            {/* Question Text */}
            <div className="mt-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg leading-relaxed">
                {currentQuestionData.question}
              </h2>

              {/* Short Answer Input */}
              {currentQuestionData.type === "short_answer" ? (
                <div className="mt-8">
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Your Response
                  </label>

                  <textarea
                    value={answers[currentQuestionData.id] || ""}
                    onChange={(event) =>
                      selectAnswer(currentQuestionData.id, event.target.value)
                    }
                    placeholder="Type your response here..."
                    rows={7}
                    disabled={submitting || submittedRef.current}
                    className="w-full resize-y rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Short answers are auto-saved and will be manually reviewed by your instructor.
                  </p>
                </div>
              ) : currentQuestionData.type === "true_false" ? (
                <div className="mt-8 space-y-3">
                  {["True", "False"].map((option) => {
                    const isSelected = answers[currentQuestionData.id] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectAnswer(currentQuestionData.id, option)}
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                          }`}
                        >
                          {option === "True" ? "T" : "F"}
                        </span>

                        <span className="text-sm font-semibold text-slate-800 dark:text-white">
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 space-y-3">
                  {optionKeys.map((optionKey) => {
                    const optionText = currentQuestionData.options?.[optionKey];
                    if (!optionText) return null;

                    const isSelected = answers[currentQuestionData.id] === optionKey;

                    return (
                      <button
                        key={optionKey}
                        type="button"
                        onClick={() => selectAnswer(currentQuestionData.id, optionKey)}
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                          }`}
                        >
                          {optionKey}
                        </span>

                        <span className="text-sm font-medium text-slate-800 dark:text-white">
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => setCurrentQuestion((current) => Math.max(0, current - 1))}
                disabled={currentQuestion === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestion((current) => Math.min(questions.length - 1, current + 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{submitting ? "Submitting..." : "Finish & Submit"}</span>
                </button>
              )}
            </div>
          </section>

          {/* Question Navigator Sidebar */}
          <aside className="lg:col-span-4 flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Question Navigator
              </h3>
            </div>

            {/* Progress Meter */}
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {answeredQuestions} / {questions.length} answered
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="mt-5 grid grid-cols-5 gap-2">
              {questions.map((question, index) => {
                const isCurrent = index === currentQuestion;
                const isAnswered = Boolean(answers[question.id]?.trim());

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQuestion(index)}
                    className={`flex aspect-square items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30"
                        : isAnswered
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800 hover:bg-emerald-100"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-400">Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-900 ring-1 ring-emerald-300 dark:ring-emerald-700" />
                <span className="text-slate-600 dark:text-slate-400">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-800" />
                <span className="text-slate-600 dark:text-slate-400">Unanswered</span>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? "Submitting..." : "Finish & Submit"}</span>
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default AttemptExam;
