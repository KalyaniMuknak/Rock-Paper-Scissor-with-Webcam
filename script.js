const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');

const computerHandImage = document.getElementById('computerHandImage');
const countdownText = document.getElementById('countdown');
const resultText = document.getElementById('resultText');
const userScoreSpan = document.getElementById('userScore');
const computerScoreSpan = document.getElementById('computerScore');

let userScore = 0;
let computerScore = 0;
let currentUserMove = null;

// MediaPipe Hands
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8
});

function drawLandmarks(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw points
      for (const point of landmarks) {
        canvasCtx.beginPath();
        canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = '#00FF00';
        canvasCtx.fill();
      }
      // Draw lines
      const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
      for (const [start, end] of connections) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(landmarks[start].x * canvasElement.width, landmarks[start].y * canvasElement.height);
        canvasCtx.lineTo(landmarks[end].x * canvasElement.width, landmarks[end].y * canvasElement.height);
        canvasCtx.strokeStyle = '#00FF00';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
      }
      currentUserMove = detectGesture(landmarks); // Detect gesture
    }
  }

  canvasCtx.restore();
}

hands.onResults(drawLandmarks);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 320,
  height: 240
});
camera.start();

function detectGesture(landmarks) {
  const fingerTips = [8, 12, 16, 20];
  const extendedFingers = fingerTips.map(i => landmarks[i].y < landmarks[i - 2].y);

  if (!extendedFingers.includes(true)) return "rock";
  if (extendedFingers.every(v => v)) return "paper";
  if (extendedFingers[0] && !extendedFingers[1] && !extendedFingers[2] && !extendedFingers[3]) return "scissors";
  return null;
}

function getComputerMove() {
  const moves = ["rock", "paper", "scissors"];
  return moves[Math.floor(Math.random() * 3)];
}

function decideWinner(user, computer) {
  if (user === computer) return "It's a tie!";
  if ((user === "rock" && computer === "scissors") ||
      (user === "paper" && computer === "rock") ||
      (user === "scissors" && computer === "paper")) {
    userScore++;
    userScoreSpan.textContent = userScore;
    return "You win!";
  } else {
    computerScore++;
    computerScoreSpan.textContent = computerScore;
    return "Computer wins!";
  }
}

function startGame() {
  let count = 3;
  countdownText.textContent = count;

  computerHandImage.src = ""; // Clear image first

  const interval = setInterval(() => {
    count--;
    countdownText.textContent = count > 0 ? count : "Shoot!";

    if (count === 0) {
      clearInterval(interval);

      const computerMove = getComputerMove();
      computerHandImage.src = `images/${computerMove}.png`;

      const result = decideWinner(currentUserMove, computerMove);
      resultText.textContent = `You: ${currentUserMove || "none"} | Computer: ${computerMove} → ${result}`;
    }
  }, 1000);
}
