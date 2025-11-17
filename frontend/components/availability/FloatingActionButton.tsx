'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, FileText, Ban, Download, Settings } from 'lucide-react';

interface FloatingActionButtonProps {
  onAddNote?: () => void;
  onBlockDate?: () => void;
  onExport?: () => void;
  onBulkUpdate?: () => void;
}

export default function FloatingActionButton({
  onAddNote,
  onBlockDate,
  onExport,
  onBulkUpdate,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const menuItems = [
    {
      label: 'Add Note',
      icon: FileText,
      onClick: () => {
        onAddNote?.();
        setIsExpanded(false);
      },
    },
    {
      label: 'Block Date',
      icon: Ban,
      onClick: () => {
        onBlockDate?.();
        setIsExpanded(false);
      },
    },
    {
      label: 'Bulk Update',
      icon: Settings,
      onClick: () => {
        onBulkUpdate?.();
        setIsExpanded(false);
      },
    },
    {
      label: 'Export',
      icon: Download,
      onClick: () => {
        onExport?.();
        setIsExpanded(false);
      },
    },
  ].filter((item) => item.onClick !== undefined);

  return (
    <div ref={menuRef} className="fixed bottom-20 lg:bottom-6 right-6 z-50">
      {/* Menu Items */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2 animate-in slide-in-from-bottom-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex items-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap"
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 
          text-white shadow-lg hover:shadow-xl transition-all
          flex items-center justify-center
          ${isExpanded ? 'rotate-45' : 'hover:scale-110'}
        `}
        title="Quick Actions"
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
