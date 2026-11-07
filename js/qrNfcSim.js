/**
 * RUPAMS - NFC Card & QR Code Verification Handler
 * Light minimalist styling with client-side SVG QR rendering
 */

const QRNfcSimulator = {
  activeCameraStream: null,
  scannerInterval: null,

  /**
   * Generates a clean vector SVG QR code for Personal Identity Tokens
   */
  generatePersonalQRSVG(payloadText, size = 160) {
    const hash = this._hashString(payloadText);
    const N = 21;
    const matrix = [];

    for (let r = 0; r < N; r++) {
      matrix[r] = [];
      for (let c = 0; c < N; c++) {
        matrix[r][c] = false;
      }
    }

    // 7x7 Finder patterns
    const addFinder = (startR, startC) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[startR + r][startC + c] = true;
          }
        }
      }
    };

    addFinder(0, 0);
    addFinder(0, N - 7);
    addFinder(N - 7, 0);

    // Timing lines
    for (let i = 8; i < N - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Data bits
    let bitIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)) continue;
        if (r === 6 || c === 6) continue;
        matrix[r][c] = (((hash >> (bitIdx % 31)) & 1) ^ ((r * 5 + c * 11) % 3 === 0)) === 1;
        bitIdx++;
      }
    }

    const cellSize = (size / N).toFixed(2);
    let rects = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (matrix[r][c]) {
          const x = (c * cellSize).toFixed(2);
          const y = (r * cellSize).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#1e3a5f" />`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="clean-qr-svg">
        <rect width="${size}" height="${size}" fill="#ffffff" rx="6" />
        ${rects}
      </svg>
    `;
  },

  _hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  /**
   * Camera QR Scanner
   */
  async startCamera(videoElementId, onScanSuccess) {
    const video = document.getElementById(videoElementId);
    if (!video) return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        this.activeCameraStream = stream;
        video.srcObject = stream;
        await video.play();

        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          this.scannerInterval = setInterval(async () => {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                this.stopCamera();
                if (window.SoundManager) window.SoundManager.playQrScan();
                if (onScanSuccess) onScanSuccess(code);
              }
            } catch (e) {}
          }, 350);
        }
      }
    } catch (err) {
      console.warn("Camera could not be accessed:", err);
    }
  },

  stopCamera() {
    if (this.scannerInterval) {
      clearInterval(this.scannerInterval);
      this.scannerInterval = null;
    }
    if (this.activeCameraStream) {
      this.activeCameraStream.getTracks().forEach(track => track.stop());
      this.activeCameraStream = null;
    }
  }
};

window.QRNfcSimulator = QRNfcSimulator;
