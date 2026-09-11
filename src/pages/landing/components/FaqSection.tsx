import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is ExamSphere?",
      a: "ExamSphere is a modern online examination and assessment management system designed for schools, colleges, and training institutes. It unifies exam creation, question banking, student testing, live proctoring telemetry, automated grading, and comprehensive performance analytics into a single platform.",
    },
    {
      q: "Who can use ExamSphere?",
      a: "ExamSphere supports three distinct user roles: Students (who view schedules, attempt exams, and inspect results), Teachers (who build question banks, schedule exams, and evaluate submissions), and Administrators (who oversee users, classes, platform activity logs, and institutional metrics).",
    },
    {
      q: "How does automated grading work?",
      a: "Objective question formats such as Multiple Choice Questions (MCQs) and True/False questions are automatically evaluated immediately upon student submission. Short-answer and subjective questions route directly to the teacher's evaluation queue where instructors can award custom marks and provide written feedback.",
    },
    {
      q: "How does exam integrity monitoring work?",
      a: "ExamSphere uses a transparent, non-invasive telemetry engine. Before beginning an exam, students verify hardware readiness. During the assessment, the system monitors fullscreen compliance and window focus changes, creating an auditable timeline for educators without installing intrusive kernel software.",
    },
    {
      q: "Is camera/microphone access required for every exam?",
      a: "Hardware checks ensure that when proctoring is enabled by the instructor, the candidate's browser has granted appropriate media permissions. If an exam does not require video monitoring, candidates can proceed directly to the test interface.",
    },
    {
      q: "How do class codes and batch enrollments work?",
      a: "Teachers can create custom class batches (e.g., 'CS Year 3 - Distributed Systems') and share a unique 6-character class code. Students enter this code in their student portal to join the class, automatically gaining access to all exams published for that cohort.",
    },
    {
      q: "Can students review their past exam scores and feedback?",
      a: "Yes! Students have access to dedicated 'My Results' and 'Exam History' portals where they can view overall percentages, pass/fail status, question-by-question answer comparisons, and individualized teacher feedback for all completed assessments.",
    },
    {
      q: "Can ExamSphere be used on mobile devices or tablets?",
      a: "Absolutely. ExamSphere is built as a responsive Progressive Web App (PWA). It works smoothly on desktop browsers, laptops, iPads, tablets, and smartphones, adapting its layout to ensure comfortable question reading and answer selection.",
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-blue-500/10 dark:bg-blue-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
            Frequently Asked Questions
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything You Need to Know.
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Got questions about how ExamSphere works? Here are the most common questions from students, teachers, and administrators.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
