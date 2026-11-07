/**
 * RUPAMS - Key Transaction & Logging Controller
 * College of Industrial Technology (CIT) - URS Morong Campus
 * Handles Borrowed, Returned, and Transfered events (Mobile or Dean's Office Counter)
 */

const KeyManager = {
  /**
   * Process and log Key Transaction
   * Action Types strictly: "Borrowed", "Returned", "Transfered"
   * Requires:
   * 1. Physical Key NFC Card UID
   * 2. Personal Identity QR Code Token
   */
  processKeyTransaction({ keyId, roomCode, nfcUid, qrToken, fromUser, toUser, actionType, purpose, loggedLocation }) {
    if (!nfcUid) {
      return { success: false, error: "Physical Key NFC Card verification is required." };
    }
    if (!qrToken) {
      return { success: false, error: "Personal Identity QR Code is required to authorize transaction." };
    }

    // Default action type normalization
    let validAction = actionType || "Borrowed";
    if (validAction === 'BORROW_TRANSFER' || validAction === 'CABINET_CHECKOUT') validAction = "Borrowed";
    if (validAction === 'RETURN_TO_CABINET') validAction = "Returned";
    if (validAction === 'P2P_TRANSFER') validAction = "Transfered";

    const savedRecord = window.appState.addKeyLog({
      roomCode: roomCode,
      keyId: keyId,
      fromUser: fromUser || (validAction === 'Borrowed' ? "In Cabinet (Dean's Office)" : "Current Holder"),
      toUser: toUser || (validAction === 'Returned' ? "In Cabinet (Dean's Office)" : "Authorized Borrower"),
      actionType: validAction, // "Borrowed" | "Returned" | "Transfered"
      nfcUidVerified: nfcUid,
      qrTokenVerified: qrToken,
      purpose: purpose || "Academic / Laboratory Session",
      loggedLocation: loggedLocation || "Dean's Office Counter"
    });

    if (window.SoundManager) {
      window.SoundManager.playSuccess();
    }

    return {
      success: true,
      log: savedRecord
    };
  },

  // Backward compatibility alias
  processP2PTransfer(params) {
    return this.processKeyTransaction(params);
  }
};

window.KeyManager = KeyManager;
