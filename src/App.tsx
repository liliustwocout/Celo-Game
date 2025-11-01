h

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import GameInterface from "./components/GameInterface.tsx";
import { NETWORK_PARAMS, TOKEN_ABI, ARENA_ABI } from "./celoConfig.ts";

interface LeaderboardEntry {
  address: string;
  wins: number;
  totalBets: number;
}

const App: React.FC = () => {
  const [account, setAccount] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [arenaContract, setArenaContract] = useState<ethers.Contract | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Hàm kết nối ví
  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(web3Provider);

        // Yêu cầu truy cập tài khoản
        await web3Provider.send("eth_requestAccounts", []);
        const signer = await web3Provider.getSigner();
        const acct = await signer.getAddress();
        setAccount(acct);

        // Khởi tạo contract token và arena
        const token = new ethers.Contract(NETWORK_PARAMS.tokenAddress, TOKEN_ABI, signer);
        setTokenContract(token);
        const arena = new ethers.Contract(NETWORK_PARAMS.arenaAddress, ARENA_ABI, signer);
        setArenaContract(arena);

        // Lấy số dư token ban đầu
        const bal = await token.balanceOf(acct);
        setTokenBalance(ethers.formatUnits(bal, 18));
      } catch (err) {
        console.error("Connect wallet error", err);
        alert("Có lỗi khi kết nối ví: " + (err as any)?.message || err);
      }
    } else {
      alert("Vui lòng cài MetaMask hoặc tương đương!");
    }
  };

  // Hàm fetch leaderboard từ events
  const fetchLeaderboard = async () => {
    if (!arenaContract) return;
    try {
      const filter = arenaContract.filters.GameResult();
      const events = await arenaContract.queryFilter(filter, 0, "latest");
      const stats: { [key: string]: LeaderboardEntry } = {};
      events.forEach((event) => {
        if ('args' in event) {
          const { player, won } = event.args;
          const addr = player.toLowerCase();
          if (!stats[addr]) {
            stats[addr] = { address: addr, wins: 0, totalBets: 0 };
          }
          stats[addr].totalBets += 1;
          if (won) stats[addr].wins += 1;
        }
      });
      const sorted = Object.values(stats).sort((a, b) => b.wins - a.wins || b.totalBets - a.totalBets);
      setLeaderboard(sorted.slice(0, 10)); // Top 10
    } catch (err) {
      console.error("Fetch leaderboard error", err);
    }
  };

  // Hàm claim daily reward
  const claimDailyReward = async () => {
    const lastClaim = localStorage.getItem(`dailyClaim_${account}`);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (lastClaim && now - parseInt(lastClaim) < oneDay) {
      alert("Bạn đã claim reward hôm nay rồi!");
      return;
    }
    try {
      setIsClaiming(true);
      // Simulate reward: add 5 tokens to balance (frontend only, since mint is owner-only)
      const reward = 5;
      const newBalance = parseFloat(tokenBalance) + reward;
      setTokenBalance(newBalance.toString());
      localStorage.setItem(`dailyClaim_${account}`, now.toString());
      alert(`Đã claim ${reward} GAME tokens thành công!`);
    } catch (err) {
      console.error("Claim reward error", err);
      alert("Có lỗi khi claim reward!");
    } finally {
      setIsClaiming(false);
    }
  };

  // Khởi tạo kết nối MetaMask tự động (optional)
  useEffect(() => {
    // Có thể bỏ qua auto-connect để user tự nhấn nút connect
  }, []);

  // Fetch leaderboard on mount and after play
  useEffect(() => {
    fetchLeaderboard();
  }, [arenaContract]);

  // Hàm cập nhật số dư token từ hợp đồng
  const updateBalance = async () => {
    if (tokenContract && account) {
      const bal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(bal, 18));
    }
  };

  // Hàm khi người dùng nhấn "Play Game"
  const playGame = async () => {
    if (!arenaContract || !tokenContract) {
      alert("Contracts chưa được khởi tạo!");
      return;
    }
    try {
      setIsPlaying(true);
      const betAmount = ethers.parseUnits("10", 18);

      // Kiểm tra số dư
      const balance = await tokenContract.balanceOf(account);
      if (balance < betAmount) {
        alert("Không đủ token! Bạn cần ít nhất 10 GAME tokens.");
        return;
      }

      // Approve arena contract to spend tokens
      console.log("Approving tokens...");
      const approveTx = await tokenContract.approve(NETWORK_PARAMS.arenaAddress, betAmount);
      await approveTx.wait();
      console.log("Approval successful");

      // Gọi hàm playGame
      console.log("Playing game...");
      const tx = await arenaContract.playGame(betAmount);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      // Cập nhật số dư
      await updateBalance();
      // Refresh leaderboard after play
      await fetchLeaderboard();
      alert("Chúc mừng! Bạn đã chơi xong.");
    } catch (err: any) {
      console.error("playGame error", err);
      const errorMessage = err?.reason || err?.message || "Unknown error";
      alert("Có lỗi khi chơi game: " + errorMessage);
    } finally {
      setIsPlaying(false);
    }
  };

  // Hàm mint tokens - Tạm thời disable vì chỉ owner mới có thể mint
  const mintTokens = async () => {
    alert("Tính năng mint tokens hiện tại chỉ dành cho owner của contract. Vui lòng liên hệ admin để nhận tokens test.");
    return;

    // Code cũ (commented out)
    /*
    if (!tokenContract) {
      alert("Token contract chưa được khởi tạo!");
      return;
    }
    try {
      setIsMinting(true);
      const mintAmount = ethers.parseUnits("100", 18);
      const tx = await tokenContract.mint(account, mintAmount);
      await tx.wait();
      await updateBalance();
      alert("Đã mint 100 GAME tokens thành công!");
    } catch (err: any) {
      console.error("mintTokens error", err);
      alert("Có lỗi khi mint tokens: " + (err?.message || err));
    } finally {
      setIsMinting(false);
    }
    */
  };

  // Hàm disconnect wallet
  const disconnectWallet = () => {
    setAccount("");
    setTokenBalance("0");
    setProvider(null);
    setTokenContract(null);
    setArenaContract(null);
    alert("Đã ngắt kết nối ví!");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ textAlign: "center", padding: "2rem", color: "white" }}>
        <h1 style={{
          fontSize: "3rem",
          marginBottom: "0.5rem",
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
        }}>
          🎮 Play-to-Earn Game
        </h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>
          Trên mạng Celo Sepolia
        </p>
      </div>

      {/* Giới thiệu */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto 2rem",
        padding: "2rem",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: "15px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        <h2 style={{ color: "white", marginBottom: "1rem" }}>🎯 Giới thiệu</h2>
        <p style={{ color: "white", lineHeight: "1.6", fontSize: "1.1rem" }}>
          Chào mừng bạn đến với Play-to-Earn Game! Đây là một trò chơi blockchain nơi bạn có thể kiếm token GAME
          bằng cách tham gia các lượt chơi. Mỗi lượt chơi yêu cầu đặt cược 10 GAME tokens và có cơ hội thắng thưởng.
        </p>
      </div>

      {/* Cách chơi */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto 2rem",
        padding: "2rem",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: "15px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        <h2 style={{ color: "white", marginBottom: "1rem" }}>📋 Cách chơi</h2>
        <ol style={{ color: "white", textAlign: "left", lineHeight: "1.8", fontSize: "1.1rem" }}>
          <li>Kết nối ví MetaMask của bạn</li>
          <li>Mint 100 GAME tokens miễn phí (nếu chưa có)</li>
          <li>Nhấn "Play Game" để tham gia với mức cược 10 GAME tokens</li>
          <li>Chờ kết quả và nhận thưởng nếu thắng</li>
          <li>Lặp lại để kiếm thêm token!</li>
        </ol>
      </div>
      {/* Game Interface */}
      <GameInterface
        account={account}

        onPlayGame={playGame}
        onMintTokens={mintTokens}
        onDisconnect={disconnectWallet}
        onConnectWallet={connectWallet}
        isPlaying={isPlaying}
        isMinting={isMinting}
        leaderboard={leaderboard}
        onClaimDailyReward={claimDailyReward}
        isClaiming={isClaiming}
      />
      {/* Footer */}
      <footer style={{
        marginTop: "3rem",
        padding: "1rem",
        color: "rgba(255,255,255,0.7)",
        fontSize: "0.9rem"
      }}>
        <p>⚠️ Lưu ý: Đây là game trên testnet, không có giá trị thực tế.</p>
      </footer>
    </div>
  );
};

export default App;
