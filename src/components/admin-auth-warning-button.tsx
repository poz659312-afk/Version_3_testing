// [PERF] Optimized: removed framer-motion — replaced with CSS animation
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";

interface AdminAuthWarningButtonProps {
  onAuthorize: () => void;
}

export function AdminAuthWarningButton({ onAuthorize }: AdminAuthWarningButtonProps) {
  return (
    <div className="animate-notif-modal-enter">
      <Button
        onClick={onAuthorize}
        className="relative bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700  font-semibold shadow-lg transition-all duration-300 hover:scale-105"
        size="sm"
      >
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-md bg-yellow-400 animate-ping opacity-20"></span>
        
        {/* Content */}
        <span className="relative flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">Authorize Admin Access</span>
          <span className="sm:hidden">Authorize</span>
          <Shield className="w-4 h-4" />
        </span>
      </Button>
    </div>
  );
}
