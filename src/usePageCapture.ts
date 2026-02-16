/**
 * Page Capture Hook for Prison Muster App
 * Uses html2canvas to capture screenshot in browser
 */

import html2canvas from 'html2canvas';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

/**
 * Capture screenshot using html2canvas in the browser
 */
export async function capturePageState(options: { pageName: string; unitId?: string }): Promise<{ id: string } | null> {
  try {
    // Capture screenshot using html2canvas
    const canvas = await html2canvas(document.documentElement, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false,
    });
    
    // Convert canvas to base64 PNG
    const screenshotDataUrl = canvas.toDataURL('image/png');
    const base64Data = screenshotDataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Also capture the HTML
    const htmlSnapshot = document.documentElement.outerHTML;
    
    const payload = {
      pageName: options.pageName,
      unitId: options.unitId || getCurrentUnitId(),
      htmlSnapshot,
      screenshotBase64: screenshotDataUrl,
      cssSnapshot: '',
      jsonState: {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(`${API_BASE}/api/audit/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Capture failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Page capture failed:', error);
    return null;
  }
}

function getCurrentUnitId(): string {
  const urlMatch = window.location.pathname.match(/\/unit\/([^/]+)/);
  if (urlMatch) return urlMatch[1];
  const stored = localStorage.getItem('currentUnitId');
  if (stored) return stored;
  return 'unknown';
}

export interface CaptureButtonProps {
  pageName: string;
  unitId?: string;
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
}
