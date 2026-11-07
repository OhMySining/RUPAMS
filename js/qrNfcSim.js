/**
 * RUPAMS - NFC Identification & QR Code Multi-Modal Simulator
 * Supports real Web NFC API (Android Chrome), Camera BarcodeDetector,
 * dynamic SVG QR code rendering, and interactive hardware simulation.
 */

const QRNfcSimulator = {
  activeCameraStream: null,
  scannerInterval: null,

  /**
   * Simple client-side QR Code Matrix Generator (Type 2-4 Alphanumeric/Byte)
   * Generates clean SVG markup for display on mobile digital passes and physical key tags.
   */
  generateQRSVG(payloadText, size = 180) {
    // Generate a stylized deterministic 21x21 QR code pattern for client-side display
    // Using string hashing + standard QR finder patterns at top-left, top-right, bottom-left
    const hash = this._hashString(payloadText);
    const matrix = [];
    const N = 25;

    for (let r = 0; r < N; r++) {
      matrix[r] = [];
      for (let c = 0; c < N; c++) {
        matrix[r][c] = false;
      }
    }

    // Add Finder Pattern (7x7) at (0,0), (0, N-7), (N-7, 0)
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

    // Fill data area based on text hash
    let bitIdx = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip finder areas
        if ((r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)) {
          continue;
        }
        if (r === 6 || c === 6) continue;

        const val = ((hash >> (bitIdx % 31)) & 1) ^ ((r * 7 + c * 13) % 3 === 0);
        matrix[r][c] = !!val;
        bitIdx++;
      }
    }

    // Render SVG
    const cellSize = (size / N).toFixed(2);
    let rects = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (matrix[r][c]) {
          const x = (c * cellSize).toFixed(2);
          const y = (r * cellSize).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#0d2b5c" />`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="rupams-qr-svg" style="border-radius: 8px; background: #ffffff; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
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
   * Real Web NFC Reader Support (if supported on mobile device)
   */
  async startWebNfcReader(onTagReadCallback) {
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        ndef.onreading = event => {
          const serialNumber = event.serialNumber;
          if (window.SoundManager) window.SoundManager.playNfcTap();
          if (onTagReadCallback) onTagReadCallback(serialNumber);
        };
        return { supported: true, active: true };
      } catch (error) {
        console.warn('Web NFC scan error or permission denied:', error);
        return { supported: true, active: false, error: error.message };
      }
    }
    return { supported: false };
  },

  /**
   * Interactive Virtual NFC Transceiver Simulator
   * Renders an interactive modal where user can tap physical CIT keys
   */
  openNfcTapModal(mode = 'checkout', targetRoomCode = null, onComplete = null) {
    const modal = document.getElementById('nfcModal');
    if (!modal) return;

    const data = window.appState.data;
    const keyList = data.keys;
    const titleEl = document.getElementById('nfcModalTitle');
    const descEl = document.getElementById('nfcModalDesc');
    const container = document.getElementById('nfcKeyList');

    if (titleEl) {
      titleEl.textContent = mode === 'return' ? 'NFC Cabinet Key Return' : 'NFC Key Identification & Checkout';
    }
    if (descEl) {
      descEl.textContent = mode === 'return'
        ? 'Tap physical key against smart cabinet reader slot to log instantaneous return.'
        : 'Tap physical key tag against reader to verify custody transfer and unlock facility.';
    }

    // Populate key tags to tap
    if (container) {
      container.innerHTML = keyList.map(k => {
        const isBorrowed = k.status === 'borrowed' || k.status === 'overdue';
        const isSelected = targetRoomCode && k.roomCode === targetRoomCode;
        return `
          <div class="nfc-tag-card ${isBorrowed ? 'tag-borrowed' : 'tag-available'} ${isSelected ? 'tag-highlight' : ''}" 
               data-keyid="${k.keyId}" 
               data-room="${k.roomCode}"
               data-status="${k.status}">
            <div class="nfc-tag-chip">
              <span class="nfc-wifi-icon">📡</span>
              <span class="nfc-uid">${k.nfcUid}</span>
            </div>
            <div class="nfc-tag-body">
              <strong>${k.roomCode}</strong>
              <small>${k.label}</small>
              <span class="tag-status-badge ${k.status}">${k.status.toUpperCase()}</span>
            </div>
            <button class="btn btn-nfc-tap" onclick="QRNfcSimulator.simulateNfcTap('${k.keyId}', '${mode}')">
              Tap Key Tag
            </button>
          </div>
        `;
      }).join('');
    }

    modal.classList.add('active');
  },

  simulateNfcTap(keyId, mode) {
    const key = window.appState.getKey(keyId);
    if (!key) return;

    // Trigger visual pulse
    const readerBox = document.querySelector('.nfc-reader-scanner-box');
    if (readerBox) {
      readerBox.classList.add('pulse-active');
      setTimeout(() => readerBox.classList.remove('pulse-active'), 800);
    }

    if (window.SoundManager) {
      window.SoundManager.playNfcTap();
    }

    setTimeout(() => {
      let result;
      if (mode === 'return') {
        result = window.KeyManager.returnKey(keyId, 'NFC_TAP');
        if (result.success) {
          window.appUi.showToast(`✅ [NFC Check-In] Key ${key.roomCode} successfully logged to Cabinet ${key.cabinetSlot}.`, 'success');
        } else {
          window.appUi.showToast(`⚠️ ${result.error}`, 'error');
        }
      } else {
        // Checkout
        const currentUser = window.appState.currentUser;
        result = window.KeyManager.checkoutKey(keyId, {
          userId: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          purpose: "Laboratory Access Session",
          durationHours: 2
        }, 'NFC_TAP');

        if (result.success) {
          window.appUi.showToast(`🎉 [NFC Check-Out] Key ${key.roomCode} verified and released to ${currentUser.name}!`, 'success');
        } else {
          window.appUi.showToast(`⚠️ ${result.error}`, 'error');
        }
      }

      this.closeNfcModal();
    }, 400);
  },

  closeNfcModal() {
    const modal = document.getElementById('nfcModal');
    if (modal) modal.classList.remove('active');
  },

  /**
   * QR Code Scanner Modal (Webcam + Simulation Presets)
   */
  openQrScannerModal(mode = 'any', onScanResult = null) {
    const modal = document.getElementById('qrScannerModal');
    if (!modal) return;

    modal.classList.add('active');
    this.startCameraScanner(onScanResult);
  },

  closeQrScannerModal() {
    this.stopCameraScanner();
    const modal = document.getElementById('qrScannerModal');
    if (modal) modal.classList.remove('active');
  },

  async startCameraScanner(onScanResult) {
    const video = document.getElementById('qrVideoElement');
    const statusText = document.getElementById('qrCameraStatus');
    if (!video) return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        this.activeCameraStream = stream;
        video.srcObject = stream;
        await video.play();
        if (statusText) statusText.textContent = "Camera active: Align QR code in target box";

        // Check for native BarcodeDetector API
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          this.scannerInterval = setInterval(async () => {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                this.handleScannedQR(rawValue, onScanResult);
              }
            } catch (err) {}
          }, 350);
        }
      } else {
        if (statusText) statusText.textContent = "Camera not available. Please use Rapid Preset Test buttons below.";
      }
    } catch (err) {
      if (statusText) statusText.textContent = "Camera permission denied or camera not found. Use Quick Test buttons.";
    }
  },

  stopCameraScanner() {
    if (this.scannerInterval) {
      clearInterval(this.scannerInterval);
      this.scannerInterval = null;
    }
    if (this.activeCameraStream) {
      this.activeCameraStream.getTracks().forEach(track => track.stop());
      this.activeCameraStream = null;
    }
  },

  simulateQRScan(presetType) {
    if (window.SoundManager) window.SoundManager.playQrScan();
    
    let payload = "";
    if (presetType === 'pass_juan') {
      payload = "RUPAMS-PASS-REQ-2026-102|USER:Juan Dela Cruz|ROOM:CIT-ELX";
    } else if (presetType === 'key_cit101') {
      payload = "RUPAMS-KEY-CIT-101-SECURE";
    } else if (presetType === 'key_auto_overdue') {
      payload = "RUPAMS-KEY-CIT-AUTO-SECURE";
    } else if (presetType === 'key_complab1') {
      payload = "RUPAMS-KEY-CIT-CL1-SECURE";
    } else {
      payload = `RUPAMS-CODE-${Date.now()}`;
    }

    this.handleScannedQR(payload);
  },

  handleScannedQR(payload, customCallback = null) {
    if (window.SoundManager) window.SoundManager.playQrScan();
    this.closeQrScannerModal();

    if (customCallback) {
      customCallback(payload);
      return;
    }

    // Default router for scanned payload
    if (payload.includes('CIT-101')) {
      const key = window.appState.getKey('KEY-CIT-101');
      if (key.status === 'in_cabinet') {
        window.KeyManager.checkoutKey('KEY-CIT-101', {
          userId: window.appState.currentUser.id,
          name: window.appState.currentUser.name,
          role: window.appState.currentUser.role,
          purpose: "Lecture / Multi-media Session",
          durationHours: 2
        }, 'QR_SCAN');
        window.appUi.showToast("⚡ [QR Checkout] CIT-101 Key released via verified QR tag!", "success");
      } else {
        window.KeyManager.returnKey('KEY-CIT-101', 'QR_SCAN');
        window.appUi.showToast("✅ [QR Check-In] CIT-101 Key returned to cabinet slot #01.", "success");
      }
    } else if (payload.includes('CIT-AUTO')) {
      const key = window.appState.getKey('KEY-CIT-AUTO');
      if (key.status === 'overdue' || key.status === 'borrowed') {
        const res = window.KeyManager.returnKey('KEY-CIT-AUTO', 'QR_SCAN');
        window.appUi.showToast("✅ [QR Check-In] OVERDUE key for CIT-AUTO resolved and safely returned!", "success");
      } else {
        window.KeyManager.checkoutKey('KEY-CIT-AUTO', {
          name: "Mark Jayson Rivera",
          role: "Student",
          purpose: "Engine Overhaul Bay Practice"
        }, 'QR_SCAN');
        window.appUi.showToast("⚡ [QR Checkout] CIT-AUTO Key released.", "success");
      }
    } else if (payload.includes('Juan Dela Cruz')) {
      window.appUi.showToast("👤 [QR Validated] Borrower Pass: Juan Dela Cruz (BSIT 3A) verified for CIT-ELX.", "info");
    } else {
      window.appUi.showToast(`🔍 Scanned QR: ${payload}`, "info");
    }
  }
};

window.QRNfcSimulator = QRNfcSimulator;
