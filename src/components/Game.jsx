import { useState, useEffect, useRef } from "react";

// 🔊 サウンド素材のインポート
import startSound from "../assets/start.mp3";
import cueSound from "../assets/cue.mp3";
import goodSound from "../assets/good.mp3";
import perfectSound from "../assets/perfect.mp3";
import badSound from "../assets/bad.mp3";
import failSound from "../assets/fail.mp3";
import retrySound from "../assets/retry.mp3";
import resultSound from "../assets/result.mp3";

// ⚙️ ゲーム設定用定数
const NORMAL_ROUNDS = 5;
const ADVANCED_ROUNDS = 10;
const MAX_MISSES = 3;
const PERFECT_THRESHOLD = 30;
const GOOD_THRESHOLD = 100;
const MAX_REACTION_TIME = 600;
const FAKE_DURATION = 1500;

// 📤 シェア用のURL（Vercelデプロイ先）
const SHARE_URL = "https://reaction-game-jet.vercel.app";

// 📳 バイブレーション機能
const vibrate = (pattern) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export default function Game() {
  // 🎮 ゲームの状態管理
  const [gameState, setGameState] = useState("idle");
  const [mode, setMode] = useState("normal");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [message, setMessage] = useState("モードを選んでね");
  const [startTime, setStartTime] = useState(0);
  const [bgClass, setBgClass] = useState("bg-gray-200");
  const [isFake, setIsFake] = useState(false);
  const [animClass, setAnimClass] = useState("");

  // 🧠 タイマーの参照用
  const timeoutRef = useRef(null);
  const fakeTimeoutRef = useRef(null);

  // 🔊 サウンドの参照用
  const startRef = useRef(null);
  const cueRef = useRef(null);
  const goodRef = useRef(null);
  const perfectRef = useRef(null);
  const badRef = useRef(null);
  const failRef = useRef(null);
  const retryRef = useRef(null);
  const resultRef = useRef(null);

  // 🔁 サウンド再生共通関数
  const play = (ref) => {
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play();
    }
  };

  // 🧠 スコアに応じたランクを返す
  const getRank = (score) => {
    if (score >= 1600) return "Sランク 🏆";
    if (score >= 1200) return "Aランク 🎯";
    if (score >= 800) return "Bランク 👍";
    if (score >= 400) return "Cランク 😅";
    return "Dランク 🐢";
  };

  // 📋 結果をクリップボードにコピーする
  const handleShare = async () => {
    const text = `🎮 反射神経ゲーム結果：\nスコア：${score}点（${getRank(score)}）でクリア！\n👉 ${SHARE_URL}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("結果をクリップボードにコピーしました！\nそのままSNSにペーストしてシェアしてね✨");
    } catch (e) {
      alert("コピーに失敗しました。お手数ですが手動でシェアしてください。");
    }
  };

  // 🐦 X（Twitter）で投稿する
  const handleXShare = () => {
    const tweet = encodeURIComponent(`🎮 反射神経ゲーム結果：\nスコア：${score}点（${getRank(score)}）でクリア！\n👉 ${SHARE_URL}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, "_blank");
  };

  // 🕹️ ゲームスタート
  const handleStart = (selectedMode) => {
    play(startRef);
    setMode(selectedMode);
    setRound(0);
    setScore(0);
    setMisses(0);
    setGameState("starting");
    setTimeout(() => {
      setRound(1);
      startRound();
    }, 1000);
  };

  // 🔁 リトライボタン押下時
  const handleRetry = () => {
    play(retryRef);
    handleStart(mode);
  };

  // 🔙 タイトルに戻る
  const handleBackToStart = () => {
    setGameState("idle");
    setMessage("モードを選んでね");
    setBgClass("bg-gray-200");
  };

  // 🚦 ラウンドの開始処理
  const startRound = () => {
    const delay = Math.floor(Math.random() * 3000) + 1000;
    const fake = mode === "advanced" && Math.random() < 0.3;
    setIsFake(fake);
    setMessage("...");
    setBgClass("bg-gray-200");
    setAnimClass("");
    timeoutRef.current = setTimeout(() => {
      setStartTime(Date.now());
      setGameState("cue");
      setMessage(fake ? "押すな！" : "今だ！");
      setBgClass(fake ? "bg-yellow-600 animate-pulse" : "bg-green-500 animate-pulse");
      play(cueRef);

      if (fake) {
        fakeTimeoutRef.current = setTimeout(() => {
          const maxRounds = mode === "advanced" ? ADVANCED_ROUNDS : NORMAL_ROUNDS;
          if (round >= maxRounds || misses >= MAX_MISSES) {
            play(resultRef);
            setGameState("finished");
          } else {
            setRound((r) => r + 1);
            startRound();
          }
        }, FAKE_DURATION);
      }
    }, delay);
    setGameState("waiting");
  };

  // 👆 画面クリック時の処理
  const handleClick = () => {
    if (gameState === "cue") {
      if (isFake) {
        clearTimeout(fakeTimeoutRef.current);
        play(failRef);
        vibrate([50, 30, 50]);
        setMisses((m) => m + 1);
        setMessage("罠だった！");
        setBgClass("bg-red-600");
        setAnimClass("animate-shake");
        const maxRounds = mode === "advanced" ? ADVANCED_ROUNDS : NORMAL_ROUNDS;
        if (round >= maxRounds || misses + 1 >= MAX_MISSES) {
          play(resultRef);
          setGameState("finished");
          return;
        }
        setRound((r) => r + 1);
        setTimeout(() => {
          startRound();
        }, 1000);
        return;
      }
      const reaction = Date.now() - startTime;
      let addScore = 0;
      if (reaction <= PERFECT_THRESHOLD) {
        play(perfectRef);
        vibrate(30);
        addScore = 200;
        setMessage(`PERFECT! (${reaction}ms)`);
        setBgClass("bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500");
        setAnimClass("animate-bounce text-4xl");
      } else if (reaction <= GOOD_THRESHOLD) {
        play(goodRef);
        vibrate(30);
        addScore = 100;
        setMessage(`Good! (${reaction}ms)`);
        setBgClass("bg-green-400");
        setAnimClass("animate-bounce text-3xl");
      } else if (reaction <= MAX_REACTION_TIME) {
        play(badRef);
        vibrate([50, 30, 50]);
        setMessage(`遅い… (${reaction}ms)`);
        setBgClass("bg-orange-400");
        setAnimClass("text-xl");
      } else {
        play(failRef);
        vibrate([50, 30, 50]);
        setMisses((m) => m + 1);
        setMessage("遅すぎた！");
        setBgClass("bg-red-600");
        setAnimClass("animate-shake");
      }
      setScore((s) => s + addScore);
      const maxRounds = mode === "advanced" ? ADVANCED_ROUNDS : NORMAL_ROUNDS;
      if (round >= maxRounds || misses + 1 >= MAX_MISSES) {
        play(resultRef);
        setGameState("finished");
        return;
      }
      setRound((r) => r + 1);
      setTimeout(() => {
        startRound();
      }, 1000);
    } else if (gameState === "waiting") {
      play(failRef);
      vibrate([50, 30, 50]);
      setMisses((m) => m + 1);
      setMessage("早すぎた！");
      setBgClass("bg-red-600");
      setAnimClass("animate-shake");
      const maxRounds = mode === "advanced" ? ADVANCED_ROUNDS : NORMAL_ROUNDS;
      if (misses + 1 >= MAX_MISSES) {
        play(resultRef);
        setGameState("finished");
        return;
      }
      setRound((r) => r + 1);
      setTimeout(() => {
        startRound();
      }, 1000);
    }
  };

  // 🖼️ 表示部分
  return (
    <div
      className={`flex flex-col items-center justify-center h-screen text-center transition-colors duration-200 ${bgClass}`}
      onClick={handleClick}
    >
      {gameState === "idle" ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-2">モードを選んでね</h1>
          <button
            onClick={() => handleStart("normal")}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 w-4/5 max-w-xs"
          >
            通常モード
          </button>
          <button
            onClick={() => handleStart("advanced")}
            className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 w-4/5 max-w-xs"
          >
            上級モード
          </button>
        </div>
      ) : gameState === "finished" ? (
        <div className="bg-white p-8 rounded-lg shadow-lg w-11/12 max-w-md">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">結果発表！</h2>
          <p className="text-xl mb-2 text-gray-800">スコア: {score}</p>
          <p className="text-xl mb-2 text-gray-800">ランク: {getRank(score)}</p>
          <p className="text-xl mb-6 text-red-600">ミス: {misses}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleRetry}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              リトライ
            </button>
            <button
              onClick={handleBackToStart}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              モード選択へ戻る
            </button>
            <button
              onClick={handleShare}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              シェア（コピー）
            </button>
            <button
              onClick={handleXShare}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
            >
              Xでシェア
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className={`font-bold mb-4 ${animClass}`}>{message}</h1>
          <p>スコア: {score} / ラウンド: {round} / <span className="text-red-600">ミス: {misses}</span></p>
        </>
      )}

      {/* 🔊 サウンド要素 */}
      <audio ref={startRef} src={startSound} />
      <audio ref={cueRef} src={cueSound} />
      <audio ref={goodRef} src={goodSound} />
      <audio ref={perfectRef} src={perfectSound} />
      <audio ref={badRef} src={badSound} />
      <audio ref={failRef} src={failSound} />
      <audio ref={retryRef} src={retrySound} />
      <audio ref={resultRef} src={resultSound} />
    </div>
  );
}