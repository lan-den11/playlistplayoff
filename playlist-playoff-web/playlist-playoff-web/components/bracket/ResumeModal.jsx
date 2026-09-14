'use client';

import GradientButton from '../ui/GradientButton';
import GlassButton from '../ui/GlassButton';
import Modal from './Modal';

export default function ResumeModal({ open, onResume, onDiscard }) {
  return (
    <Modal open={open} onClose={onDiscard} closable={false}>
      <h3 className="font-display text-lg font-bold tracking-tight text-zinc-50">Resume your bracket?</h3>
      <p className="mt-2 text-sm text-zinc-400">You've got a bracket in progress. Pick up right where you left off?</p>
      <div className="mt-6 flex justify-center gap-3">
        <GradientButton gradient="brand" onClick={onResume}>
          Resume
        </GradientButton>
        <GlassButton onClick={onDiscard}>Start fresh</GlassButton>
      </div>
    </Modal>
  );
}
