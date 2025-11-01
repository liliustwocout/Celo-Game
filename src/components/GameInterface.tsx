import React from "react";

interface GameInterfaceProps {
  account: string;
  tokenBalance: string;
  onPlayGame: () => void;
  onMintTokens: () => void;
  onDisconnect: () => void;
  onConnectWallet: () => void;
  isPlaying: boolean;
  isMinting: boolean;
}

const GameInterface: React.FC<GameInterfaceProps> = ({
  account,
  tokenBalance,
  onPlayGame,
  onMintTokens,
  onDisconnect,
  onConnectWallet,
  isPlaying,
  isMinting,
}) => {
  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "2rem",
      border: "2px solid #007bff",
      borderRadius: "12px",
      backgroundColor: "#f8f9fa",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ color: "#007bff", textAlign: "center" }}>🎮 Play-to-Earn Game</h2>
      <div style={{ marginBottom: "1rem" }}>
        <p><strong>Account:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}</p>
        <p><strong>Token Balance:</strong> {tokenBalance} GAME</p>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        {!account ? (
          <button
            onClick={onConnectWallet}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
          >
            🔗 Connect Wallet
          </button>
        ) : (
          <>
            <button
              onClick={onPlayGame}
              disabled={isPlaying || !account}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: isPlaying ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isPlaying || !account ? "not-allowed" : "pointer",
                transition: "background-color 0.3s",
              }}
            >
              {isPlaying ? "🎲 Playing..." : "🎲 Play Game (Bet 10 GAME)"}
            </button>
            <button
              onClick={onMintTokens}
              disabled={isMinting || !account}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: isMinting ? "#ccc" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isMinting || !account ? "not-allowed" : "pointer",
                transition: "background-color 0.3s",
              }}
            >
              {isMinting ? "⏳ Minting..." : "🪙 Request Tokens (Contact Admin)"}
            </button>
            <button
              onClick={onDisconnect}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
            >
              🚪 Disconnect Wallet
            </button>
          </>
        )}
      </div>
      {!account && <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>Please connect MetaMask first.</p>}
    </div>
  );
};

export default GameInterface;
