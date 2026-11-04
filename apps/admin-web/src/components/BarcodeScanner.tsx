import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { CameraOff, Flashlight } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export interface ScanResult {
  code: string;
  format: string;
}

const FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.QR_CODE,
];

/** EAN/UPC check-digit validation to reject misreads. */
export function isValidGtin(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Live camera barcode + QR reader (ZXing, runs fully in the browser). */
export function BarcodeScanner({ onResult, paused }: { onResult: (r: ScanResult) => void; paused?: boolean }) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<'denied' | 'unavailable' | null>(null);
  const [torch, setTorch] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const cb = useRef(onResult);
  cb.current = onResult;

  useEffect(() => {
    if (paused) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unavailable');
      return;
    }
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
    let stopped = false;
    let lastCode = '';
    let streak = 0;

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current!,
        (result) => {
          if (!result || stopped) return;
          const code = result.getText().trim();
          const format = BarcodeFormat[result.getBarcodeFormat()];
          const isLinear = format !== 'QR_CODE';
          if (isLinear && /^\d+$/.test(code) && code.length >= 8 && !isValidGtin(code)) return;
          // Require two identical consecutive reads for 1D codes to avoid misreads
          streak = code === lastCode ? streak + 1 : 1;
          lastCode = code;
          if (isLinear && streak < 2) return;
          stopped = true;
          navigator.vibrate?.(60);
          controlsRef.current?.stop();
          cb.current({ code, format });
        },
      )
      .then((controls) => {
        controlsRef.current = controls;
        if (stopped) controls.stop();
        const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setTorchSupported(!!caps?.torch);
      })
      .catch((e: Error) => setError(e?.name === 'NotAllowedError' ? 'denied' : 'unavailable'));

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [paused]);

  const toggleTorch = async () => {
    const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(!torch);
    } catch {
      setTorchSupported(false);
    }
  };

  if (error) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-lg bg-surface-2 p-6 text-center text-ink-2">
        <CameraOff size={32} />
        <p className="max-w-xs text-sm font-semibold">{error === 'denied' ? t('cameraDenied') : t('cameraUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} className="size-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-[58%] w-[78%] rounded-md">
          {['top-0 start-0 border-t-4 border-s-4 rounded-tl-2xl', 'top-0 end-0 border-t-4 border-e-4 rounded-tr-2xl', 'bottom-0 start-0 border-b-4 border-s-4 rounded-bl-2xl', 'bottom-0 end-0 border-b-4 border-e-4 rounded-br-2xl'].map((c) => (
            <span key={c} className={`absolute size-8 border-brand-300 ${c}`} />
          ))}
          <span className="scan-line absolute inset-x-3 h-0.5 rounded-full bg-brand-300" />
        </div>
      </div>
      {torchSupported && (
        <button
          type="button"
          onClick={toggleTorch}
          className={`absolute bottom-3 end-3 grid size-11 place-items-center rounded-full backdrop-blur ${torch ? 'bg-white text-black' : 'bg-black/50 text-white'}`}
          aria-label="Torch"
        >
          <Flashlight size={20} />
        </button>
      )}
    </div>
  );
}
