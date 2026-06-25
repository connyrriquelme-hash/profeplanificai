import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, icon, defaultExpanded = false, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className='flex flex-col rounded-2xl border border-[#E5E5E1] bg-white mb-6'>
      <button onClick={() => setExpanded(!expanded)} className={`w-full flex items-center justify-between p-6 bg-white hover:bg-[#F9F9F8] transition-colors focus:outline-none ${expanded ? 'border-b border-dashed border-[#E5E5E1]' : ''} rounded-2xl`}>
        <div className='flex items-center gap-3'>
          <div className='text-[#1A1A1A]'>{icon}</div>
          <h2 className='text-xs font-black uppercase tracking-widest text-[#888883]'>{title}</h2>
        </div>
        <div className='text-[#888883]'>{expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className='overflow-hidden'>
            <div className='p-6 bg-white rounded-b-2xl'>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}