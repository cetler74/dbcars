'use client';

import {
  FileText,
  Ban,
  Eye,
  Settings,
  Download,
  X,
  Calendar,
  Wrench,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

interface QuickActionMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  context: 'day' | 'vehicle' | 'subunit';
  targetId?: string;
  targetDate?: Date;
  onClose: () => void;
  onAddNote?: (date?: Date) => void;
  onBlockDate?: (date?: Date) => void;
  onViewBookings?: (date?: Date) => void;
  onChangeStatus?: () => void;
  onExport?: () => void;
  onMaintenance?: (date?: Date) => void;
}

export default function QuickActionMenu({
  isOpen,
  position,
  context,
  targetId,
  targetDate,
  onClose,
  onAddNote,
  onBlockDate,
  onViewBookings,
  onChangeStatus,
  onExport,
  onMaintenance,
}: QuickActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      // Adjust position to stay within viewport
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (adjustedX + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (adjustedY + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }
      if (adjustedX < 0) adjustedX = 10;
      if (adjustedY < 0) adjustedY = 10;

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const menuItems = [];

  if (context === 'day') {
    menuItems.push(
      {
        label: 'Add Note',
        icon: FileText,
        onClick: () => {
          onAddNote?.(targetDate);
          onClose();
        },
      },
      {
        label: 'Block Date',
        icon: Ban,
        onClick: () => {
          onBlockDate?.(targetDate);
          onClose();
        },
      },
      {
        label: 'Maintenance',
        icon: Wrench,
        onClick: () => {
          onMaintenance?.(targetDate);
          onClose();
        },
      },
      {
        label: 'View Bookings',
        icon: Eye,
        onClick: () => {
          onViewBookings?.(targetDate);
          onClose();
        },
      }
    );
  } else if (context === 'vehicle' || context === 'subunit') {
    menuItems.push(
      {
        label: 'Change Status',
        icon: Settings,
        onClick: () => {
          onChangeStatus?.();
          onClose();
        },
      },
      {
        label: 'View Details',
        icon: Eye,
        onClick: () => {
          onViewBookings?.();
          onClose();
        },
      }
    );
  }

  menuItems.push({
    label: 'Export',
    icon: Download,
    onClick: () => {
      onExport?.();
      onClose();
    },
  });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
