document.addEventListener("DOMContentLoaded", () => {
  const pad = (n, len = 2) => String(n).padStart(len, "0");

  // Tab Switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.toggle("active", b === btn));
      tabContents.forEach((c) =>
        c.classList.toggle("active", c.id === targetId)
      );
    });
  });

  // 12H / 24H Format Toggle
  let is24Hour = localStorage.getItem("tempo-24h") !== "false";
  const formatToggle = document.getElementById("formatToggle");

  function updateFormatButton() {
    formatToggle.textContent = is24Hour ? "24H" : "12H";
  }
  updateFormatButton();

  formatToggle.addEventListener("click", () => {
    is24Hour = !is24Hour;
    localStorage.setItem("tempo-24h", is24Hour);
    updateFormatButton();
    tick();
  });

  // WORLD CLOCK CITIES
  const WORLD_ZONES = [
    { city: "New York", zone: "America/New_York", country: "USA" },
    { city: "London", zone: "Europe/London", country: "UK" },
    { city: "Paris", zone: "Europe/Paris", country: "France" },
    { city: "New Delhi", zone: "Asia/Kolkata", country: "India" },
    { city: "Tokyo", zone: "Asia/Tokyo", country: "Japan" },
    { city: "Sydney", zone: "Australia/Sydney", country: "Australia" }
  ];

  const zonesGrid = document.getElementById("zonesGrid");

  function renderWorldClockCards() {
    zonesGrid.innerHTML = "";
    WORLD_ZONES.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "zone-card";
      card.id = `zone-card-${index}`;
      card.innerHTML = `
        <div class="zone-top">
          <span class="zone-name">${item.city} <small style="opacity:0.6">· ${item.country}</small></span>
          <span class="zone-icon" id="zone-icon-${index}">☀️</span>
        </div>
        <b class="zone-time" id="zone-time-${index}">--:--</b>
        <span class="zone-offset" id="zone-date-${index}">Loading...</span>
      `;
      zonesGrid.append(card);
    });
  }
  renderWorldClockCards();

  // CLOCK TICK
  const timeEl = document.getElementById("time");
  const ampmEl = document.getElementById("ampm");
  const dateEl = document.getElementById("date");

  function tick() {
    const now = new Date();

    // Main clock
    let hours = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    let ampm = "";

    if (!is24Hour) {
      ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
    }

    timeEl.textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    ampmEl.textContent = ampm;

    dateEl.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(now);

    // World clocks
    WORLD_ZONES.forEach((item, index) => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: item.zone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: !is24Hour
        }).format(now);

        const dateStr = new Intl.DateTimeFormat("en-US", {
          timeZone: item.zone,
          weekday: "short",
          month: "short",
          day: "numeric"
        }).format(now);

        const hourInZone = parseInt(
          new Intl.DateTimeFormat("en-US", {
            timeZone: item.zone,
            hour: "numeric",
            hour12: false
          }).format(now),
          10
        );

        const isDayTime = hourInZone >= 6 && hourInZone < 18;

        const timeElem = document.getElementById(`zone-time-${index}`);
        const dateElem = document.getElementById(`zone-date-${index}`);
        const iconElem = document.getElementById(`zone-icon-${index}`);

        if (timeElem) timeElem.textContent = timeStr;
        if (dateElem) dateElem.textContent = dateStr;
        if (iconElem) iconElem.textContent = isDayTime ? "☀️" : "🌙";
      } catch (e) {
        // Fallback gracefully
      }
    });
  }

  tick();
  setInterval(tick, 1000);

  // STOPWATCH
  let swElapsed = 0;
  let swStarted = 0;
  let swTimer = null;
  let laps = [];
  let lastLapTime = 0;

  const swDisplay = document.getElementById("sw");
  const startBtn = document.getElementById("start");
  const lapBtn = document.getElementById("lap");
  const resetBtn = document.getElementById("reset");
  const lapsList = document.getElementById("laps");

  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${pad(mins)}:${pad(secs)}.${pad(hundredths)}`;
  }

  function updateStopwatch() {
    const current = swElapsed + (swTimer ? Date.now() - swStarted : 0);
    swDisplay.textContent = formatTime(current);
  }

  startBtn.addEventListener("click", () => {
    if (swTimer) {
      // Pause
      clearInterval(swTimer);
      swTimer = null;
      swElapsed += Date.now() - swStarted;
      startBtn.textContent = "Start";
      startBtn.classList.remove("btn-danger");
      lapBtn.disabled = true;
    } else {
      // Start
      swStarted = Date.now();
      swTimer = setInterval(updateStopwatch, 25);
      startBtn.textContent = "Pause";
      lapBtn.disabled = false;
    }
  });

  lapBtn.addEventListener("click", () => {
    if (!swTimer) return;
    const currentTotal = swElapsed + (Date.now() - swStarted);
    const split = currentTotal - lastLapTime;
    lastLapTime = currentTotal;

    laps.unshift({
      num: laps.length + 1,
      split,
      total: currentTotal
    });

    renderLaps();
  });

  function renderLaps() {
    lapsList.innerHTML = "";
    if (laps.length === 0) return;

    let minSplit = Infinity;
    let maxSplit = -Infinity;

    if (laps.length >= 2) {
      laps.forEach((l) => {
        if (l.split < minSplit) minSplit = l.split;
        if (l.split > maxSplit) maxSplit = l.split;
      });
    }

    laps.forEach((lap) => {
      const li = document.createElement("li");
      li.className = "lap-item";

      if (laps.length >= 2) {
        if (lap.split === minSplit) li.classList.add("fastest");
        else if (lap.split === maxSplit) li.classList.add("slowest");
      }

      li.innerHTML = `
        <span>Lap ${pad(lap.num)}</span>
        <span>+${formatTime(lap.split)}</span>
        <span>${formatTime(lap.total)}</span>
      `;
      lapsList.append(li);
    });
  }

  resetBtn.addEventListener("click", () => {
    clearInterval(swTimer);
    swTimer = null;
    swElapsed = 0;
    lastLapTime = 0;
    laps = [];
    swDisplay.textContent = "00:00.00";
    startBtn.textContent = "Start";
    lapBtn.disabled = true;
    lapsList.innerHTML = "";
  });

  // COUNTDOWN TIMER
  let timerDuration = 25 * 60; // 25 mins in seconds
  let timerRemaining = timerDuration;
  let timerInterval = null;

  const timerDisplay = document.getElementById("timerDisplay");
  const timerMinsInput = document.getElementById("timerMins");
  const timerSecsInput = document.getElementById("timerSecs");
  const timerStartBtn = document.getElementById("timerStart");
  const timerResetBtn = document.getElementById("timerReset");
  const presetBtns = document.querySelectorAll(".preset-btn");

  function formatTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${pad(mins)}:${pad(secs)}`;
  }

  function updateTimerUI() {
    timerDisplay.textContent = formatTimerDisplay(timerRemaining);
  }

  function playAlarmSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      [0, 0.25, 0.5, 0.75].forEach((delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now + delay); // A5

        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
      });
    } catch {
      // AudioContext not permitted or muted
    }
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      presetBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const mins = parseInt(btn.dataset.mins, 10);
      timerMinsInput.value = mins;
      timerSecsInput.value = 0;
      resetTimer();
    });
  });

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartBtn.textContent = "Start";
    const mins = parseInt(timerMinsInput.value, 10) || 0;
    const secs = parseInt(timerSecsInput.value, 10) || 0;
    timerDuration = Math.max(1, mins * 60 + secs);
    timerRemaining = timerDuration;
    updateTimerUI();
  }

  timerMinsInput.addEventListener("change", resetTimer);
  timerSecsInput.addEventListener("change", resetTimer);

  timerStartBtn.addEventListener("click", () => {
    if (timerInterval) {
      // Pause
      clearInterval(timerInterval);
      timerInterval = null;
      timerStartBtn.textContent = "Resume";
    } else {
      // Start or Resume
      if (timerRemaining <= 0) {
        resetTimer();
      }
      timerStartBtn.textContent = "Pause";
      timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerUI();
        if (timerRemaining <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          timerStartBtn.textContent = "Start";
          playAlarmSound();
          alert("⏰ Timer completed!");
        }
      }, 1000);
    }
  });

  timerResetBtn.addEventListener("click", resetTimer);

  updateTimerUI();
});