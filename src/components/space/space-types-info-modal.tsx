'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Icon, type IconName } from '@/components/ui/icon';

const TYPES: ReadonlyArray<{ id: string; iconName: IconName }> = [
  { id: 'storage', iconName: 'storage' },
  { id: 'workspace', iconName: 'workspace' },
  { id: 'garden', iconName: 'garden' },
  { id: 'room', iconName: 'room' },
];

interface SpaceTypesInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function SpaceTypesInfoModal({ open, onClose }: SpaceTypesInfoModalProps) {
  const t = useTranslations('typeInfo');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (e: MouseEvent) => { if (e.target === dialog) onClose(); };
    const handleClose = () => onClose();
    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('click', handleClick);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} data-modal aria-labelledby="typeinfo-title">
      <button type="button" className="modal__close" aria-label={t('close')} onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      <div style={{ padding: 'var(--s-6) var(--s-5) var(--s-5)' }}>
        <h2 id="typeinfo-title" style={{ fontSize: 'var(--t-lg)', fontWeight: 600, marginBottom: 'var(--s-4)' }}>
          {t('title')}
        </h2>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          {TYPES.map(({ id, iconName }) => (
            <li key={id} style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 'var(--r-sm)',
                background: 'var(--glass-strong)',
                border: '1px solid var(--glass-border)',
              }}>
                <Icon name={iconName} size={20} />
              </span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 'var(--s-1)' }}>
                  {t(`${id}.label`)}
                </p>
                <p style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-mute)', lineHeight: 1.5 }}>
                  {t(`${id}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
