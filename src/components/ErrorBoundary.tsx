/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, HelpCircle, GraduationCap } from 'lucide-react';

interface Props {
  children: ReactNode;
  theme?: 'light' | 'dark';
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  private handleContactSupport = () => {
    window.location.href = 'mailto:vermakishan478@gmail.com?subject=NoteIT%20AI%20Support%20Request';
  };

  public render() {
    if (this.state.hasError) {
      const isDark = this.props.theme !== 'light';

      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${
          isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#FAF9F5] text-gray-900'
        }`}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] ${
              isDark ? 'bg-indigo-950/35' : 'bg-indigo-100/40'
            }`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] ${
              isDark ? 'bg-purple-950/30' : 'bg-purple-100/30'
            }`} />
          </div>

          <div className={`w-full max-w-md p-8 rounded-2xl border text-center space-y-6 shadow-2xl relative z-10 ${
            isDark ? 'bg-[#121318]/90 border-neutral-800' : 'bg-white border-gray-200'
          }`}>
            <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                <span className="text-[10px] font-black tracking-widest font-mono uppercase text-indigo-400">
                  Application Error Center
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight">We saved your work.</h2>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                An unexpected exception was caught in the cognitive sandbox. Your transcripts, notes, and local recording drafts remain completely secure in Firestore and IndexedDB.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-white text-black hover:bg-neutral-100'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                <RefreshCw className="h-4 w-4 text-indigo-500" />
                <span>Retry Processing</span>
              </button>

              <button
                onClick={this.handleContactSupport}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 border focus:outline-none cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-900/40'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
