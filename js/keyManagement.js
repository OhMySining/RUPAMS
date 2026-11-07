/**
 * RUPAMS - Peer-to-Peer Key Transfer & Multi-Modal Verification Controller
 * College of Industrial Technology (CIT) - URS Morong Campus
 */

const KeyManager = {
  /**
   * Process Peer-to-Peer Transfer (Student to Student, Faculty to Student, or Return to Cabinet)
   * Enforces 2-Factor Physical Access Validation:
   * 1. Physical Key NFC Card UID
   * 2. Personal Identity QR Code Token
   */
  processP2PTransfer({ keyId, roomCode, nfcUid, qrToken, fromUser, toUser, actionType, purpose }) {
    if (!nfcUid) {
      return { success: false, error: "NFC Physical Key Card required for custody verification." };
    }
    if (!qrToken) {
      return { success: false, error: "Personal QR Code identification required to authorize transfer." };
    }

    const transferRecord = {
      roomCode: roomCode,
      keyId: keyId,
      fromUser: fromUser || "Current Holder",
      toUser: toUser || "Authorized Recipient",
      nfcUidVerified: nfcUid,
      qrTokenVerified: qrToken,
      actionType: actionType || "P2P_TRANSFER",
      purpose: purpose || "Academic / Laboratory Access"
    };

    const savedRecord = window.appState.addTransfer(transferRecord);

    if (window.SoundManager) {
      window.SoundManager.playSuccess();
    }

    return {
      success: true,
      transfer: savedRecord
    };
  }
};

window.KeyManager = KeyManager;
