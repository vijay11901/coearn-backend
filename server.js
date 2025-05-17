Dashboard page:            <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CoEarn Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://unpkg.com/phosphor-icons@1.4.2/css/phosphor.css" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;
    }
    body {
      background: linear-gradient(to bottom right, #43cea2, #185a9d);
      color: white;
      padding-bottom: 80px;
      min-height: 100vh;
    }
    .container {
      max-width: 500px;
      margin: auto;
      padding: 16px;
    }
    .profile-card {
      background: rgba(255, 255, 255, 0.08);
      padding: 20px;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    .profile-card h2 {
      font-size: 20px;
      margin-bottom: 5px;
    }
    .wallet-btn {
      background: #fff;
      color: #185a9d;
      border: none;
      padding: 8px 16px;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .feature-card {
      background: rgba(255, 255, 255, 0.1);
      padding: 16px;
      border-radius: 20px;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      text-align: center;
      transition: transform 0.3s ease;
    }
    .feature-card:hover {
      transform: translateY(-5px);
    }
    .feature-card span {
      font-size: 14px;
      color: #e0f7ff;
    }
    .feature-card h3 {
      font-size: 18px;
      margin: 10px 0;
      color: #fff;
    }
    .offerwall, .task-section {
      margin-bottom: 20px;
    }
    .offerwall h3, .task-section h3 {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .offer-item, .task-item {
      background: rgba(255, 255, 255, 0.08);
      padding: 12px 16px;
      border-radius: 16px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }
    .offer-item:hover, .task-item:hover {
      transform: translateX(5px);
    }
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      justify-content: space-around;
      padding: 12px 0;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }
    .bottom-nav a {
      text-decoration: none;
      color: #fff;
      font-size: 13px;
      text-align: center;
      font-weight: 500;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .bottom-nav a.active {
      color: #00e6ff;
      font-weight: bold;
    }
    .bottom-nav i {
      font-size: 18px;
    }
    .coin-display {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .coin-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: linear-gradient(145deg, #2962FF, #00BFA5);
      color: white;
      border-radius: 50%;
      font-weight: bold;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .logout-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      color: white;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      z-index: 1000;
      display: none;
    }
    .loader {
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 2px solid #fff;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }
    .task-button {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .task-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .task-button.completed {
      background: rgba(0, 230, 118, 0.2);
      color: #00e676;
    }
    .task-button.pending {
      background: rgba(255, 213, 79, 0.2);
      color: #ffd54f;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="notification" id="notification"></div>
  <button class="logout-btn" id="logoutBtn">
    <i class="ph ph-sign-out"></i> Logout
  </button>

  <div class="container">
    <div class="profile-card">
      <div>
        <h2 id="userName">Loading...</h2>
        <div class="coin-display">
          <span>Balance:</span>
          <strong id="userCoins">0</strong>
          <span class="coin-icon">Co</span>
        </div>
      </div>
      <button class="wallet-btn" onclick="location.href='wallet.html'">
        <i class="ph ph-wallet"></i> Wallet
      </button>
    </div>

    <div class="card-grid">
      <div class="feature-card" onclick="location.href='daily.html'">
        <h3>Daily Reward</h3>
        <span>Claim daily coins</span>
      </div>
      <div class="feature-card" onclick="location.href='refer.html'">
        <h3>Refer & Earn</h3>
        <span>Invite friends</span>
      </div>
    </div>

    <div class="offerwall">
      <h3>Trending Offerwalls</h3>
      <div class="offer-item" onclick="location.href='offerwall.html?type=games'">
        <span>Games Offerwall</span>
        <i class="ph ph-arrow-right" style="color: #00eaff;"></i>
      </div>
      <div class="offer-item" onclick="location.href='offerwall.html?type=surveys'">
        <span>Surveys Offerwall</span>
        <i class="ph ph-arrow-right" style="color: #00eaff;"></i>
      </div>
    </div>

    <div class="task-section">
      <h3>Quick Tasks</h3>
      <div class="task-item">
        <span>Join Telegram Channel</span>
        <div class="coin-display">
          <strong>20</strong>
          <span class="coin-icon">Co</span>
          <button class="task-button" id="telegramTaskBtn" onclick="startTelegramTask()">Start</button>
        </div>
      </div>
      <div class="task-item">
        <span>Watch YouTube Video</span>
        <div class="coin-display">
          <strong>30</strong>
          <span class="coin-icon">Co</span>
          <button class="task-button" id="youtubeTaskBtn" onclick="startYoutubeTask()">Start</button>
        </div>
      </div>
      <div class="task-item">
        <span>Subscribe YouTube Channel</span>
        <div class="coin-display">
          <strong>10</strong>
          <span class="coin-icon">Co</span>
          <button class="task-button" id="subscribeTaskBtn" onclick="startSubscribeTask()">Start</button>
        </div>
      </div>
    </div>
  </div>

  <div class="bottom-nav">
    <a href="dashboard.html" class="active">
      <i class="ph ph-house"></i>
      <span>Home</span>
    </a>
    <a href="refer.html">
      <i class="ph ph-users"></i>
      <span>Refer</span>
    </a>
    <a href="wallet.html">
      <i class="ph ph-wallet"></i>
      <span>Wallet</span>
    </a>
    <a href="profile.html">
      <i class="ph ph-user"></i>
      <span>Profile</span>
    </a>
  </div>

  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
  <script>
    const firebaseConfig = {
      apiKey: "AIzaSyA01oF-TQmnjvITLay4mCpuLVRCFBanXtg",
      authDomain: "coearn1.firebaseapp.com",
      projectId: "coearn1",
      storageBucket: "coearn1.appspot.com",
      messagingSenderId: "588728353392",
      appId: "1:588728353392:web:dd28f0d656775cd4b9eab5",
      measurementId: "G-CKZ1MSRG6L"
    };
    
    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // DOM Elements
    const userName = document.getElementById('userName');
    const userCoins = document.getElementById('userCoins');
    const logoutBtn = document.getElementById('logoutBtn');
    const notification = document.getElementById('notification');
    const telegramTaskBtn = document.getElementById('telegramTaskBtn');
    const youtubeTaskBtn = document.getElementById('youtubeTaskBtn');
    const subscribeTaskBtn = document.getElementById('subscribeTaskBtn');

    // Show notification
    function showNotification(message, duration = 3000) {
      notification.textContent = message;
      notification.style.display = 'block';
      setTimeout(() => {
        notification.style.display = 'none';
      }, duration);
    }

    // Logout Functionality
    logoutBtn.addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = 'login.html';
      });
    });

    // Real-time User Data from Firestore
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      // Load user data
      db.collection("users").doc(user.uid).onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          userName.textContent = data.name || "User";
          userCoins.textContent = data.coins || 0;
          
          // Check completed tasks
          if (data.completedTasks) {
            if (data.completedTasks.includes('telegram')) {
              telegramTaskBtn.textContent = 'Completed';
              telegramTaskBtn.classList.add('completed');
              telegramTaskBtn.disabled = true;
            }
            if (data.completedTasks.includes('youtube')) {
              youtubeTaskBtn.textContent = 'Completed';
              youtubeTaskBtn.classList.add('completed');
              youtubeTaskBtn.disabled = true;
            }
            if (data.completedTasks.includes('subscribe')) {
              subscribeTaskBtn.textContent = 'Completed';
              subscribeTaskBtn.classList.add('completed');
              subscribeTaskBtn.disabled = true;
            }
          }
        }
      });

      // Check for pending referrals
      checkPendingReferrals(user.uid);
    });

    // Check for pending referral bonuses
    async function checkPendingReferrals(userId) {
      try {
        const pendingRef = db.collection('pending_referrals')
          .where('newUserId', '==', userId)
          .where('processed', '==', false)
          .limit(1);

        pendingRef.onSnapshot(snapshot => {
          if (!snapshot.empty) {
            const referral = snapshot.docs[0].data();
            processReferralBonus(userId, referral.referrerId, snapshot.docs[0].id);
          }
        });
      } catch (error) {
        console.error("Referral check error:", error);
      }
    }

    // Process referral bonus with backend
    async function processReferralBonus(newUserId, referrerId, docId) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch('https://coearn-backend.onrender.com/process-referral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken
          },
          body: JSON.stringify({
            newUserId,
            referrerId
          })
        });

        if (response.ok) {
          // Mark as processed
          await db.collection('pending_referrals').doc(docId).update({
            processed: true
          });
          showNotification("Referral bonus processed!");
        }
      } catch (error) {
        console.error("Referral processing error:", error);
      }
    }

    // Telegram Task
    function startTelegramTask() {
      telegramTaskBtn.textContent = 'Verifying...';
      telegramTaskBtn.disabled = true;
      
      // Open Telegram channel
      window.open('https://t.me/coearn1', '_blank');
      
      // Start verification process
      verifyTask('telegram', 20, telegramTaskBtn);
    }

    // YouTube Video Task
    function startYoutubeTask() {
      youtubeTaskBtn.textContent = 'Verifying...';
      youtubeTaskBtn.disabled = true;
      
      // Open YouTube video
      window.open('https://youtube.com/shorts/cFfwZeAB0gE?feature=shared', '_blank');
      
      // Start verification process
      verifyTask('youtube', 30, youtubeTaskBtn);
    }

    // YouTube Subscribe Task
    function startSubscribeTask() {
      subscribeTaskBtn.textContent = 'Verifying...';
      subscribeTaskBtn.disabled = true;
      
      // Open YouTube channel
      window.open('https://youtube.com/@nut337?feature=shared', '_blank');
      
      // Start verification process
      verifyTask('subscribe', 10, subscribeTaskBtn);
    }

    // Task Verification
    async function verifyTask(taskType, coins, button) {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        // In a real implementation, you would have a backend service
        // that verifies the task completion (e.g., checking Telegram API,
        // YouTube API, or using a third-party verification service)
        
        // For demo purposes, we'll simulate verification after 5 seconds
        setTimeout(async () => {
          const idToken = await user.getIdToken();
          const response = await fetch('https://coearn-backend.onrender.com/complete-task', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': idToken
            },
            body: JSON.stringify({ 
              taskType,
              coins 
            })
          });
          
          const result = await response.json();
          if (response.ok) {
            button.textContent = 'Completed';
            button.classList.add('completed');
            showNotification(`Task completed! You earned ${coins} Co`);
            
            // Update user's completed tasks in Firestore
            await db.collection("users").doc(user.uid).update({
              completedTasks: firebase.firestore.FieldValue.arrayUnion(taskType),
              coins: firebase.firestore.FieldValue.increment(coins)
            });
          } else {
            button.textContent = 'Retry';
            button.disabled = false;
            showNotification(result.message || "Verification failed");
          }
        }, 5000); // Simulate 5 second verification delay
        
      } catch (error) {
        console.error("Task error:", error);
        button.textContent = 'Error';
        showNotification("Error verifying task");
        setTimeout(() => {
          button.textContent = 'Retry';
          button.disabled = false;
        }, 2000);
      }
    }
  </script>
</body>
</html>.                                  Wallet page : <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Wallet - CoEarn</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(to bottom right, #43cea2, #185a9d);
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .wallet-box {
      background: #f5fdfb;
      border-radius: 20px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      max-width: 400px;
      margin: auto;
    }
    .wallet-box h3 {
      margin-bottom: 10px;
      color: #333;
    }
    .coins {
      font-size: 28px;
      font-weight: 700;
      margin: 10px 0;
      color: #ffb600;
    }
    .rupees {
      font-size: 20px;
      font-weight: 600;
      color: #2e7d32;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      margin-top: 10px;
      background: #000;
      color: #fff;
      padding: 10px 24px;
      border-radius: 30px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .history-buttons {
      margin-top: 30px;
      display: flex;
      justify-content: space-around;
    }
    .history-buttons button {
      flex: 1;
      margin: 0 10px;
      padding: 12px;
      border-radius: 10px;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    .point-history {
      background-color: #fff176;
    }
    .withdraw-history {
      background-color: #b2ebf2;
    }
  </style>
</head>
<body>
  <div class="wallet-box">
    <h3>Available Balance</h3>
    <div class="coins" id="coinBalance">Loading...</div>
    <div class="rupees" id="inrValue">₹0.00</div>
    <a class="btn" href="withdraw.html">Withdraw Now</a>
    
    <div class="history-buttons">
      <button class="point-history" onclick="location.href='point-history.html'">Point History</button>
      <button class="withdraw-history" onclick="location.href='withdraw-history.html'">Withdraw History</button>
    </div>
  </div>

  <!-- Firebase Scripts -->
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
  <script>
    const firebaseConfig = {
      apiKey: "AIzaSyA01oF-TQmnjvITLay4mCpuLVRCFBanXtg",
      authDomain: "coearn1.firebaseapp.com",
      projectId: "coearn1"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
      if (user) {
        const uid = user.uid;
        db.collection("users").doc(uid).get().then(doc => {
          if (doc.exists) {
            const coins = doc.data().coins || 0;
            const inr = (coins / 100).toFixed(2);
            document.getElementById("coinBalance").textContent = `${coins} Coins`;
            document.getElementById("inrValue").textContent = `₹${inr}`;
          } else {
            document.getElementById("coinBalance").textContent = "0 Coins";
            document.getElementById("inrValue").textContent = "₹0.00";
          }
        });
      } else {
        window.location.href = "login.html";
      }
    });
  </script>
</body>
</html>.                daily login bonus page: <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Daily Bonus - CoEarn</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(to bottom right, #43cea2, #185a9d);
      color: #fff;
      padding: 20px;
      text-align: center;
    }

    h1 {
      margin-bottom: 10px;
    }

    .sub-text {
      font-size: 14px;
      color: #cbeeff;
      margin-bottom: 20px;
    }

    .bonus-container {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      max-width: 700px;
      margin: 0 auto 20px;
    }

    .bonus-box {
      background: rgba(255,255,255,0.08);
      width: 80px;
      border-radius: 12px;
      padding: 10px 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: 0.3s;
      position: relative;
    }

    .bonus-box.claimed {
      background: rgba(0, 255, 100, 0.2);
      border: 2px solid #00ff77;
    }

    .bonus-box.current {
      background: rgba(255, 215, 0, 0.2);
      border: 2px solid gold;
      animation: pulse 2s infinite;
    }

    .bonus-box .coin {
      background: radial-gradient(circle, #00d4ff, #005f9d);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
      margin: 5px 0;
    }

    .bonus-box .tick {
      color: lime;
      font-size: 20px;
      margin-top: 5px;
    }

    .bonus-box .timer {
      font-size: 11px;
      color: #ffeecc;
      margin-top: 4px;
    }

    .claim-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 20px;
      background: #fff;
      color: #185a9d;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
    }

    .claim-btn:disabled {
      background: #aaa;
      color: #444;
      cursor: not-allowed;
    }

    .claim-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .popup {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 999;
    }

    .popup-content {
      background: #fff;
      color: #000;
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      max-width: 300px;
    }

    .popup-content button {
      background: #185a9d;
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 10px;
      font-weight: bold;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .streak-info {
      background: rgba(255,255,255,0.1);
      padding: 10px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <h1>Daily Reward</h1>
  <p class="sub-text">Come back daily to claim exciting Co rewards!</p>
  <div class="streak-info" id="streakInfo">Current streak: 0 days</div>

  <div class="bonus-container" id="bonusContainer"></div>

  <button class="claim-btn" id="claimBtn">Claim Today Reward</button>

  <div class="popup" id="popup">
    <div class="popup-content">
      <h2>Congratulations! 🎉</h2>
      <p>You received <span id="earnedCoins" style="font-weight:bold;"></span> Co</p>
      <button onclick="closePopup()">OK</button>
    </div>
  </div>

  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
  <script>
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyA01oF-TQmnjvITLay4mCpuLVRCFBanXtg",
      authDomain: "coearn1.firebaseapp.com",
      projectId: "coearn1",
      storageBucket: "coearn1.appspot.com",
      messagingSenderId: "588728353392",
      appId: "1:588728353392:web:dd28f0d656775cd4b9eab5",
      measurementId: "G-CKZ1MSRG6L"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Reward structure
    const rewards = [10, 15, 25, 35, 45, 60, 100];
    const bonusContainer = document.getElementById('bonusContainer');
    const claimBtn = document.getElementById('claimBtn');
    const streakInfo = document.getElementById('streakInfo');

    // User data
    let userData = {
      streak: 0,
      lastClaimDate: null,
      claimedDays: 0
    };
    let userId = null;

    // Initialize the page
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      userId = user.uid;
      
      // Load user data from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        userData = {
          streak: userDoc.data().streak || 0,
          lastClaimDate: userDoc.data().lastClaimDate ? 
            new Date(userDoc.data().lastClaimDate.toDate()) : null,
          claimedDays: userDoc.data().claimedDays || 0
        };
      }

      updateUI();
      startCountdown();
    });

    // Update the UI based on user data
    function updateUI() {
      bonusContainer.innerHTML = '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user can claim today
      const lastClaim = userData.lastClaimDate ? 
        new Date(userData.lastClaimDate) : null;
      lastClaim?.setHours(0, 0, 0, 0);

      const canClaimToday = !lastClaim || lastClaim.getTime() < today.getTime();

      // Check if streak is broken (missed a day)
      if (lastClaim) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastClaim.getTime() < yesterday.getTime()) {
          // Streak broken
          userData.streak = 0;
          updateFirestore({ streak: 0 });
        }
      }

      // Build reward boxes
      rewards.forEach((amount, index) => {
        const box = document.createElement('div');
        box.className = 'bonus-box';
        
        if (index < userData.claimedDays) {
          // Already claimed
          box.classList.add('claimed');
          box.innerHTML = `
            <div>Day ${index+1}</div>
            <div class="coin">Co</div>
            <div>${amount}</div>
            <div class="tick">✔</div>
          `;
        } else if (index === userData.claimedDays) {
          // Current day to claim
          if (canClaimToday) {
            box.classList.add('current');
            box.innerHTML = `
              <div>Day ${index+1}</div>
              <div class="coin">Co</div>
              <div>${amount}</div>
              <div>Claim Now!</div>
            `;
          } else {
            box.innerHTML = `
              <div>Day ${index+1}</div>
              <div class="coin">Co</div>
              <div>${amount}</div>
              <div class="timer" id="timer">${getCountdown()}</div>
            `;
          }
        } else {
          // Future days
          box.innerHTML = `
            <div>Day ${index+1}</div>
            <div class="coin">Co</div>
            <div>${amount}</div>
            <div>Coming soon</div>
          `;
        }
        
        bonusContainer.appendChild(box);
      });

      // Update claim button
      claimBtn.disabled = !canClaimToday || userData.claimedDays >= rewards.length;
      claimBtn.textContent = userData.claimedDays >= rewards.length ? 
        "All rewards claimed!" : 
        "Claim Today Reward";

      // Update streak info
      streakInfo.textContent = `Current streak: ${userData.streak} day${userData.streak !== 1 ? 's' : ''}`;
    }

    // Claim today's reward
    claimBtn.addEventListener('click', async () => {
      if (claimBtn.disabled) return;

      try {
        const today = new Date();
        const newClaimedDays = userData.claimedDays + 1;
        const coinsEarned = rewards[userData.claimedDays];
        const newStreak = userData.streak + 1;

        // Update Firestore
        await db.collection('users').doc(userId).update({
          coins: firebase.firestore.FieldValue.increment(coinsEarned),
          claimedDays: newClaimedDays,
          lastClaimDate: today,
          streak: newStreak
        });

        // Update local data
        userData = {
          ...userData,
          claimedDays: newClaimedDays,
          lastClaimDate: today,
          streak: newStreak
        };

        // Show success popup
        document.getElementById('earnedCoins').textContent = coinsEarned;
        document.getElementById('popup').style.display = 'flex';

        // Update UI
        updateUI();
      } catch (error) {
        console.error("Error claiming reward:", error);
        alert("Error claiming reward. Please try again.");
      }
    });

    // Close popup
    function closePopup() {
      document.getElementById('popup').style.display = 'none';
    }

    // Countdown to next claim
    function getCountdown() {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const diff = nextMidnight - now;

      const hrs = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, '0');
      const mins = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
      const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }

    function startCountdown() {
      setInterval(() => {
        const timer = document.getElementById('timer');
        if (timer) timer.textContent = getCountdown();
      }, 1000);
    }

    // Helper function to update Firestore
    async function updateFirestore(data) {
      try {
        await db.collection('users').doc(userId).update(data);
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
    }
  </script>
</body>
</html>.     Now server.js for backend:  const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const auth = admin.auth();

// Middleware: Verify ID token
async function verifyToken(req, res, next) {
  const idToken = req.headers.authorization;
  if (!idToken) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Process referral bonus (called from client when pending referral is detected)
app.post('/process-referral', verifyToken, async (req, res) => {
  const { newUserId, referrerId } = req.body;

  try {
    const batch = db.batch();

    // 1. Update new user's coins (+10)
    const newUserRef = db.collection('users').doc(newUserId);
    batch.update(newUserRef, {
      coins: admin.firestore.FieldValue.increment(10)
    });

    // 2. Update referrer's coins (+5) and referral count
    const referrerRef = db.collection('users').doc(referrerId);
    batch.update(referrerRef, {
      coins: admin.firestore.FieldValue.increment(5),
      referrals: admin.firestore.FieldValue.increment(1)
    });

    await batch.commit();
    res.json({ success: true });

  } catch (error) {
    console.error('Referral processing error:', error);
    res.status(500).json({ message: 'Error processing referral' });
  }
});

// Complete task and award coins
app.post('/complete-task', verifyToken, async (req, res) => {
  const { taskType } = req.body;
  const userId = req.uid;

  // Determine coins based on task type
  let coinsEarned = 0;
  switch(taskType) {
    case 'youtube': coinsEarned = 5; break;
    case 'instagram': coinsEarned = 3; break;
    default: coinsEarned = 1;
  }

  try {
    await db.collection('users').doc(userId).update({
      coins: admin.firestore.FieldValue.increment(coinsEarned),
      lastTaskCompleted: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ coinsEarned });
  } catch (error) {
    console.error('Task completion error:', error);
    res.status(500).json({ message: 'Error completing task' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});         now give me full complete updated ready to use  code for dashboard.html, wallet, server.js, daliy , so I can copy paste without any work, i mean give me complete code without miss and skip any part of code like body and head
