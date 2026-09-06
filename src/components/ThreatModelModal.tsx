import React from 'react';
import { X, ShieldCheck, Lock, AlertTriangle, KeyRound, Database, Cpu, CheckCircle2, FileCode } from 'lucide-react';

interface ThreatModelModalProps {
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-fadeIn">
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-[#2C2C2E] bg-[#0D0D0F] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F23] px-6 py-4 bg-[#0D0D0F]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F2F2F7] font-serif italic">
                Threat Model & Security Specification
              </h2>
              <p className="text-xs text-[#8E8E93]">
                OWASP Top 10 (Web & LLM) & 5-Zone Threat Defense Analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-[#D1D1D6] leading-relaxed">
          
          {/* Executive Overview */}
          <div className="rounded-xl border border-[#30D158]/30 bg-[#30D158]/5 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-[10px] font-bold text-[#30D158] uppercase tracking-[0.2em] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero-Insecure-Default Architecture</span>
              </h3>
              <span className="rounded bg-[#1C1C1E] border border-[#30D158]/30 px-2 py-0.5 text-[9px] font-mono text-[#30D158]">
                dev-tutorial=cloud-run-ai-challenge
              </span>
            </div>
            <p className="text-xs text-[#D1D1D6] font-light leading-relaxed">
              Sanctum implements zero hardcoded credentials, strict owner-bound Firestore security rules (<code className="text-[#30D158] text-[11px]">request.auth.uid == userId</code>), server-side Gemini API proxying, top-level payload hygiene, and resilient model fallback recovery designed for Google Cloud Run serverless deployment.
            </p>
          </div>

          {/* 5 Threat Zones Summary Table */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5E5CE6] mb-3">
              1. The 5 Threat Zones & Countermeasures
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-[#2C2C2E]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2C2C2E] bg-[#1C1C1E] text-[#F2F2F7]">
                    <th className="p-3 text-[10px] uppercase tracking-wider font-semibold">Threat Zone</th>
                    <th className="p-3 text-[10px] uppercase tracking-wider font-semibold">Risk / Attack Vector</th>
                    <th className="p-3 text-[10px] uppercase tracking-wider font-semibold">Implemented Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C2E]">
                  <tr className="hover:bg-[#1C1C1E]/50">
                    <td className="p-3 font-semibold text-[#5E5CE6]">1. Input Surfaces</td>
                    <td className="p-3 text-[#AEAEB2]">Prompt injection, payload tampering, huge text denial of service.</td>
                    <td className="p-3 text-[#30D158]">Top-level JSON body parsing (10MB bound), defensive null-safe destructuring, strict string trimming.</td>
                  </tr>
                  <tr className="hover:bg-[#1C1C1E]/50">
                    <td className="p-3 font-semibold text-[#5E5CE6]">2. Planning & Reasoning</td>
                    <td className="p-3 text-[#AEAEB2]">System instruction bypass, adversarial roleplay hijacking.</td>
                    <td className="p-3 text-[#30D158]">Delimited context encapsulation with strict system instructions; untrusted journal input treated strictly as passive data.</td>
                  </tr>
                  <tr className="hover:bg-[#1C1C1E]/50">
                    <td className="p-3 font-semibold text-[#5E5CE6]">3. Tool Execution</td>
                    <td className="p-3 text-[#AEAEB2]">Privilege escalation, SSRF, dynamic code execution.</td>
                    <td className="p-3 text-[#30D158]">Strict server-side proxy routes (<code className="text-[#5E5CE6]">/api/gemini/*</code>) with zero dynamic code execution or arbitrary URL fetching.</td>
                  </tr>
                  <tr className="hover:bg-[#1C1C1E]/50">
                    <td className="p-3 font-semibold text-[#5E5CE6]">4. Memory & State</td>
                    <td className="p-3 text-[#AEAEB2]">Cross-user data leakage, unauthenticated document manipulation, undefined write crashes.</td>
                    <td className="p-3 text-[#30D158]">Owner-bound Firestore security rules (<code className="text-[#30D158]">/users/$&#123;userId&#125;/...</code>) and automated undefined-stripping payload sanitization.</td>
                  </tr>
                  <tr className="hover:bg-[#1C1C1E]/50">
                    <td className="p-3 font-semibold text-[#5E5CE6]">5. Inter-System Comm.</td>
                    <td className="p-3 text-[#AEAEB2]">API Key leakage in client JS bundles, network interception.</td>
                    <td className="p-3 text-[#30D158]">GEMINI_API_KEY is 100% server-side only in process.env / Secret Manager. Zero client exposure.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Firestore Security Rules Inspection */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5E5CE6] mb-2 flex items-center gap-1.5">
              <FileCode className="h-4 w-4" />
              <span>Deployed Firestore Security Rules (Strict Owner Isolation)</span>
            </h3>
            <pre className="rounded-xl border border-[#2C2C2E] bg-[#0A0A0B] p-4 font-mono text-[11px] text-[#AEAEB2] overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}`}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-[#1F1F23] px-6 py-3.5 bg-[#0D0D0F] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2C2C2E] transition-colors cursor-pointer"
          >
            Close Specification
          </button>
        </div>

      </div>
    </div>
  );
};

