'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Icon, type IconName } from '@/components/ui/icon';
import type { SpaceType } from '@/lib/schemas/space';

const TYPES: ReadonlyArray<{ id: SpaceType; iconName: IconName }> = [
  { id: 'workspace', iconName: 'workspace' },
  { id: 'garden', iconName: 'garden' },
  { id: 'room', iconName: 'room' },
  { id: 'storage', iconName: 'storage' },
  { id: 'parking', iconName: 'parking' },
];

const TYPE_COLORS: Record<SpaceType, { tint: string; main: string }> = {
  workspace: { tint: 'var(--type-workspace-tint)', main: 'var(--type-workspace)' },
  garden:    { tint: 'var(--type-garden-tint)',    main: 'var(--type-garden)'    },
  storage:   { tint: 'var(--type-storage-tint)',   main: 'var(--type-storage)'   },
  room:      { tint: 'var(--type-room-tint)',       main: 'var(--type-room)'      },
  parking:   { tint: 'var(--type-parking-tint)',   main: 'var(--type-parking)'   },
};

interface SpaceTypesInfoModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: SpaceType) => void;
}

export function SpaceTypesInfoModal({ open, onClose, onSelectType }: SpaceTypesInfoModalProps) {
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

  function handleSelect(type: SpaceType) {
    onSelectType(type);
    onClose();
  }

  return (
    <dialog ref={dialogRef} data-modal aria-labelledby="typeinfo-title">
      <button type="button" className="modal__close" aria-label={t('close')} onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      <div style={{ padding: 'var(--s-6) var(--s-5) var(--s-5)' }}>
        <h2 id="typeinfo-title" style={{ fontSize: 'var(--t-lg)', fontWeight: 600, marginBottom: 'var(--s-4)' }}>
          {t('title')}
        </h2>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          {TYPES.map(({ id, iconName }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => handleSelect(id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: 'var(--s-3)',
                  alignItems: 'flex-start',
                  padding: 'var(--s-3)',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${TYPE_COLORS[id].main}40`,
                  background: TYPE_COLORS[id].tint,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'filter var(--t-fast) var(--ease)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.95)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '';               }}
              >
                <span style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 'var(--r-sm)',
                  background: TYPE_COLORS[id].main,
                  color: '#fff',
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
              </button>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 'var(--s-4)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--glass-border)' }}>
          <a
            href="ajuda"
            style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-mute)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            onClick={onClose}
          >
            {t('helpLink')}
          </a>
        </div>
      </div>
    </dialog>
  );
}
