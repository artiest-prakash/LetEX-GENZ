
import React from 'react';
import { Icons } from './Icons';

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
      >
        <div className="p-2 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200">
            <Icons.ArrowRight className="w-4 h-4 rotate-180" />
        </div>
        <span className="font-medium">Back to Lab</span>
      </button>

      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
        <p className="text-slate-400 text-sm mb-10">Last Updated: October 2024</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">1. Introduction</h3>
            <p>
              Welcome to LetEX ("we," "our," or "us"). By accessing or using our website, AI simulation services, and virtual laboratory tools, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">2. AI Disclaimer & Accuracy</h3>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-900 text-sm">
              <strong className="block mb-1">Important Notice:</strong>
              LetEX utilizes generative Artificial Intelligence (AI) to create simulation code. While we strive for accuracy, AI models can produce "hallucinations" or incorrect physics calculations.
            </div>
            <p className="mt-3">
              The simulations provided are for <strong>educational and demonstrative purposes only</strong>. They should not be used for mission-critical engineering, safety-critical calculations, or scientific research requiring verified high-precision data. We are not liable for any errors in the generated physics models.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">3. User Accounts</h3>
            <p>
              When you create an account with us (via Google OAuth), you must provide information that is accurate and complete. You are responsible for safeguarding the password/credentials that you use to access the service and for any activities or actions under your password.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">4. Intellectual Property</h3>
            <p>
              The LetEX platform, logo, and source code are the property of LetEX Labs. 
            </p>
            <p className="mt-2">
              <strong>Your Generated Content:</strong> You retain ownership of the specific prompts you enter. However, the generated simulation code is licensed under a Creative Commons Attribution-NonCommercial (CC BY-NC) license, allowing you to share and adapt it for non-commercial educational use.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">5. Prohibited Uses</h3>
            <p>You may not use the Service to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Generate simulations that depict violence, illegal acts, or sexual content.</li>
              <li>Reverse engineer the API or bypass usage limits.</li>
              <li>Distribute malware or malicious scripts via the simulation injection engine.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">6. Limitation of Liability</h3>
            <p>
              In no event shall LetEX, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
