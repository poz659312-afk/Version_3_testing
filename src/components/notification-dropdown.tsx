// [PERF] Optimized: removed framer-motion — replaced with CSS animations
// Notification modal entrance, backdrop, and notification items all use CSS now
"use client"

import { useEffect, useMemo, useCallback, useRef } from "react"
import { X, Check, CheckCheck, Bell, Trash2, Info, AlertTriangle, XCircle, Sparkles, Zap, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { createPortal } from "react-dom"
import { useLenis } from "lenis/react"

// Helper function to render URLs within text as clickable links
const renderMessageWithLinks = (text: string) => {
  if (!text) return 'No description provided.';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline relative z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { notifications, markAllAsRead, isLoading, deleteNotification } = useNotifications()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Memoize expensive calculations
  const hasUnreadNotifications = useMemo(() =>
    notifications.some(n => n.seen !== 'true'),
    [notifications]
  )

  // Animated icon selector based on type
  const getTypeConfig = useCallback((type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          glow: 'from-blue-500/20 to-transparent'
        }
      case 'success':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          glow: 'from-emerald-500/20 to-transparent'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          glow: 'from-amber-500/20 to-transparent'
        }
      case 'failure':
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-500" />,
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          glow: 'from-rose-500/20 to-transparent'
        }
      default:
        return {
          icon: <Zap className="w-5 h-5 text-primary" />,
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          glow: 'from-primary/20 to-transparent'
        }
    }
  }, [])

  const formatTime = useCallback((dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown time'
    }
  }, [])

  useEffect(() => {
    if (isOpen && hasUnreadNotifications) {
      markAllAsRead()
    }
  }, [isOpen, hasUnreadNotifications, markAllAsRead])

  const handleDelete = useCallback(async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }, [deleteNotification])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  const lenis = useLenis();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      lenis?.stop();
    } else {
      document.body.style.overflow = ''
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = ''
      lenis?.start();
    }
  }, [isOpen, lenis])

  if (typeof document === 'undefined') return null;

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop — CSS fade-in, no backdrop-blur on mobile */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 md:backdrop-blur-sm animate-notif-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Premium Centered Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4 md:p-6">
        <div
          ref={dropdownRef}
          className="w-full max-w-lg max-h-[85vh] bg-background/95 md:bg-background/70 md:backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-auto flex flex-col relative transform-gpu animate-notif-modal-enter"
          role="dialog"
          aria-label="Notifications"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dynamic Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Header Implementation */}
          <div className="relative flex items-center justify-between px-8 py-7 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Activity
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
                  System Signals
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:rotate-90 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Notifications List */}
          <div 
            className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain touch-pan-y" 
            style={{ maxHeight: 'calc(85vh - 180px)', WebkitOverflowScrolling: 'touch' }}
            data-lenis-prevent
          >
            <div className="p-6 pt-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary/50" />
                    </div>
                  </div>
                  <p className="text-muted-foreground font-medium animate-pulse">Syncing core frequencies...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="w-24 h-24 mb-6 rounded-full bg-muted/20 flex items-center justify-center border border-dashed border-muted-foreground/30">
                    <Bell className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Signal Silence</h4>
                  <p className="text-muted-foreground text-sm max-w-[200px] leading-relaxed">
                    Your frequency remains undisturbed for now.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => {
                    const config = getTypeConfig(notification.type)
                    const isUnread = notification.seen !== 'true'
                    
                    return (
                      <div
                        key={notification.id}
                        style={{ 
                          borderRadius: '1.5rem',
                          animationDelay: `${index * 0.05 + 0.2}s`,
                        }}
                        className={`group/item relative p-5 transition-all duration-300 border animate-notif-item-enter ${
                          isUnread 
                          ? 'bg-white/[0.08] border-primary/30 shadow-xl shadow-primary/5' 
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex gap-5">
                          {/* Side Icon Design */}
                          <div className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl border ${config.bg} ${config.border} shadow-inner`}>
                            <div className="relative">
                              {config.icon}
                              {isUnread && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className={`text-base font-bold truncate tracking-tight ${isUnread ? 'text-primary' : 'text-foreground'}`}>
                                {notification.title || 'System Protocol'}
                              </h4>
                              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest ml-3 mt-1 shrink-0">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                            
                            <p className={`text-sm leading-relaxed mb-4 ${isUnread ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                              {renderMessageWithLinks(notification.message_content || '')}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border-white/10 text-muted-foreground uppercase font-bold tracking-wider">
                                {notification.provider || 'Core'}
                              </Badge>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="w-8 h-8 rounded-xl text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Footer */}
          {notifications.length > 0 && (
            <div className="p-6 bg-white/[0.02] border-t border-white/5">
              <Button
                onClick={markAllAsRead}
                disabled={!hasUnreadNotifications}
                className={`w-full py-6 rounded-2xl font-bold text-base transition-all duration-500 group/btn ${
                  hasUnreadNotifications 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95' 
                  : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                {hasUnreadNotifications ? (
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                    Acknowledge All Signals
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    All Signals Verified
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
