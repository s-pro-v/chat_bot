document.addEventListener("DOMContentLoaded", () => {
  // 🔴 TUTAJ WKLEJ SWÓJ ADRES Z RENDER.COM 🔴
  // Pamiętaj o dopisku /api/chat na końcu adresu
  const BACKEND_URL = "https://bot-backend-jsbo.onrender.com/api/chat";

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const themeToggle = document.getElementById("theme-toggle");

  // Elementy do autouzupełniania
  const autocompleteContainer = document.getElementById("chat-autocomplete");

  // ==========================================
  // 1. ZMIANA MOTYWU
  // ==========================================
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    root.setAttribute("theme", savedTheme);
  }

  themeToggle.addEventListener("click", () => {
    const currentTheme = root.getAttribute("theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    root.setAttribute("theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });

  // ==========================================
  // 2. OBSŁUGA ZAKŁADEK (TABÓW)
  // ==========================================
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetPane = document.querySelector(targetId);

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // ==========================================
  // 3. OBSŁUGA MODALI I PANELI BOCZNYCH
  // ==========================================
  const alertModal = document.getElementById("alert-modal");
  const modalOverlay = document.getElementById("modal-overlay");

  const settingsSidebar = document.getElementById("settings-sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      alertModal.classList.remove("active");
      modalOverlay.classList.remove("active");
    });
  });

  document.querySelectorAll(".sidebar-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      settingsSidebar.classList.remove("active");
      sidebarOverlay.classList.remove("active");
    });
  });

  // ==========================================
  // 4. LOGIKA CZATU I KOMUNIKACJA Z SERWEREM
  // ==========================================
  function addMessageToChat(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-message");

    if (sender === "user") {
      msgDiv.classList.add("chat-message-user");
      msgDiv.innerHTML = `
          <div class="section-tag mb-1 chat-tag-user">TY <span style="color: var(--text-muted);">[admin]</span></div>
          <p class="mb-0 text-primary">${text}</p>
      `;
    } else {
      msgDiv.classList.add("chat-message-bot");
      msgDiv.innerHTML = `
          <div class="section-tag mb-1 chat-tag-bot">SYSTEM_BOT</div>
          <p class="mb-0 text-primary chat-msg-title">${text}</p>
      `;
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function executeBotAction(action) {
    setTimeout(() => {
      if (action === "open_settings") {
        settingsSidebar.classList.add("active");
        sidebarOverlay.classList.add("active");
      } else if (action === "show_modal_alert") {
        alertModal.classList.add("active");
        modalOverlay.classList.add("active");
      } else if (action === "open_database_tab") {
        const dbTabBtn = document.querySelector(
          '.tab-btn[data-target="#tab-database"]',
        );
        if (dbTabBtn) dbTabBtn.click();
      } else if (action === "set_theme_light") {
        root.setAttribute("theme", "light");
        localStorage.setItem("theme", "light");
      } else if (action === "set_theme_dark") {
        root.setAttribute("theme", "dark");
        localStorage.setItem("theme", "dark");
      } else if (action === "toggle_theme") {
        const currentTheme = root.getAttribute("theme");
        const newT = currentTheme === "dark" ? "light" : "dark";
        root.setAttribute("theme", newT);
        localStorage.setItem("theme", newT);
      }
    }, 500);
  }

  // ==========================================
  // 5. HISTORIA KOMEND I AUTO-UZUPEŁNIANIE
  // ==========================================

  // Lista wszystkich dostępnych poleceń dla bota
  const availableCommands = [
    "otwórz ustawienia",
    "włącz alarm",
    "pokaż bazę",
    "jasny motyw",
    "ciemny motyw",
    "pomoc",
    "gdzie adres",
  ];

  // Historia wysłanych komend
  let commandHistory = [];
  let historyIndex = -1;
  let currentSelectedIndex = -1;

  // Funkcja rysująca listę podpowiedzi
  function showAutocomplete(query) {
    autocompleteContainer.innerHTML = "";
    currentSelectedIndex = -1;

    if (!query) {
      autocompleteContainer.classList.remove("active");
      return;
    }

    const filtered = availableCommands.filter((cmd) =>
      cmd.toLowerCase().includes(query.toLowerCase()),
    );

    if (filtered.length === 0) {
      autocompleteContainer.classList.remove("active");
      return;
    }

    filtered.forEach((cmd) => {
      const div = document.createElement("div");
      div.classList.add("chat-autocomplete-item");

      const regex = new RegExp(`(${query})`, "gi");
      div.innerHTML = cmd.replace(
        regex,
        `<span class="text-highlight">$1</span>`,
      );

      div.addEventListener("click", () => {
        chatInput.value = cmd;
        autocompleteContainer.classList.remove("active");
        chatInput.focus();
      });

      autocompleteContainer.appendChild(div);
    });

    autocompleteContainer.classList.add("active");
  }

  // Nasłuchiwanie wpisywania w pole
  chatInput.addEventListener("input", (e) => {
    showAutocomplete(e.target.value);
  });

  // Obsługa strzałek i klawisza Enter
  chatInput.addEventListener("keydown", (e) => {
    const items = autocompleteContainer.querySelectorAll(
      ".chat-autocomplete-item",
    );

    // Nawigacja po HISTORII, jeśli podpowiedzi są UKRYTE
    if (
      !autocompleteContainer.classList.contains("active") ||
      items.length === 0
    ) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (
          commandHistory.length > 0 &&
          historyIndex < commandHistory.length - 1
        ) {
          historyIndex++;
          chatInput.value = commandHistory[historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          chatInput.value = commandHistory[historyIndex];
        } else if (historyIndex === 0) {
          historyIndex = -1;
          chatInput.value = "";
        }
      }
      return;
    }

    // Nawigacja po PODPOWIEDZIACH
    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentSelectedIndex++;
      if (currentSelectedIndex >= items.length) currentSelectedIndex = 0;

      items.forEach((i) => i.classList.remove("selected"));
      items[currentSelectedIndex].classList.add("selected");
      chatInput.value = items[currentSelectedIndex].innerText;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentSelectedIndex--;
      if (currentSelectedIndex < 0) currentSelectedIndex = items.length - 1;

      items.forEach((i) => i.classList.remove("selected"));
      items[currentSelectedIndex].classList.add("selected");
      chatInput.value = items[currentSelectedIndex].innerText;
    } else if (e.key === "Enter" && currentSelectedIndex > -1) {
      e.preventDefault();
      chatInput.value = items[currentSelectedIndex].innerText;
      autocompleteContainer.classList.remove("active");
    } else if (e.key === "Escape") {
      autocompleteContainer.classList.remove("active");
    }
  });

  // Ukryj podpowiedzi po kliknięciu poza nimi
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".chat-input-area")) {
      autocompleteContainer.classList.remove("active");
    }
  });

  // ==========================================
  // 6. WYSYŁANIE WIADOMOŚCI DO SIECI
  // ==========================================
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    if (commandHistory[0] !== message) {
      commandHistory.unshift(message);
    }
    historyIndex = -1;
    autocompleteContainer.classList.remove("active");

    addMessageToChat("user", message);
    chatInput.value = "";

    try {
      // Zapytanie pod wskazany wyżej adres produkcyjny (Render)
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) throw new Error("Błąd serwera");
      const data = await response.json();

      // Dodanie wiadomości do interfejsu
      addMessageToChat("bot", data.reply);

      // DODANA LINIJKA: Wysłanie tekstu do syntezatora
      speakBotResponse(data.reply);

      if (data.action) {
        executeBotAction(data.action);
      }
    } catch (error) {
      console.error("Błąd:", error);
      const errorMsg =
        "<em>[BŁĄD SYSTEMU]: Brak połączenia z serwerem produkcyjnym.</em>";
      addMessageToChat("bot", errorMsg);
      speakBotResponse("Błąd systemu. Brak połączenia z serwerem."); // Zapasowy komunikat głosowy błędu
    }
  });
});
// ==========================================
// 7. OBSŁUGA POLECEŃ GŁOSOWYCH (Web Speech API)
// ==========================================
const voiceBtn = document.getElementById("voice-btn");
let isRecording = false;

// Inicjalizacja natywnego API przeglądarki (kompatybilność z Chromium/Edge na Windows)
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "pl-PL";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isRecording = true;
    voiceBtn.classList.add("voice-active");
    chatInput.placeholder = "[ NASŁUCHIWANIE AKTYWNE ] ...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Usunięcie ewentualnej kropki na końcu (częsty narzut rozpoznawania)
    chatInput.value = transcript.replace(/\.$/, "");

    // Możesz odkomentować poniższą linię, jeśli chcesz by polecenie wysyłało się automatycznie po wykryciu:
    // chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  };

  recognition.onerror = (event) => {
    console.error("Błąd modułu mowy: ", event.error);
    resetVoiceUI();
  };

  recognition.onend = () => {
    resetVoiceUI();
  };
} else {
  // Ukrycie przycisku, jeśli środowisko nie obsługuje Web Speech API
  if (voiceBtn) voiceBtn.style.display = "none";
  console.warn(
    "OSTRZEŻENIE: Brak wsparcia dla Web Speech API w obecnym środowisku.",
  );
}

function resetVoiceUI() {
  isRecording = false;
  voiceBtn.classList.remove("voice-active");
  chatInput.placeholder = "Wprowadź polecenie (użyj strzałek ↑ ↓ do historii)";
}

if (voiceBtn) {
  voiceBtn.addEventListener("click", () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
}
// ==========================================
// 8. SYNTEZATOR MOWY BOTA (Text-to-Speech)
// ==========================================
const voiceOutputToggle = document.getElementById("voice-output-toggle");
const voiceSelect = document.getElementById("voice-select");

let isVoiceOutputEnabled = true;
let preferredVoice = null;
let availablePlVoices = [];
window.currentUtterance = null;

function loadSystemVoices() {
  const allVoices = window.speechSynthesis.getVoices();
  if (allVoices.length === 0) return;

  // Pobranie tylko polskich głosów
  availablePlVoices = allVoices.filter((v) => v.lang.includes("pl"));

  if (voiceSelect) {
    voiceSelect.innerHTML = "";

    if (availablePlVoices.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Brak polskich głosów w systemie";
      voiceSelect.appendChild(option);
    } else {
      availablePlVoices.forEach((voice, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `[${voice.lang}] ${voice.name}`;
        voiceSelect.appendChild(option);
      });
    }
  }

  if (availablePlVoices.length > 0) {
    // Domyślny priorytet (najlepszy dostępny głos)
    preferredVoice =
      availablePlVoices.find(
        (v) => v.name.includes("Natural") || v.name.includes("Online"),
      ) ||
      availablePlVoices.find((v) => v.name.includes("Google")) ||
      availablePlVoices.find((v) => v.name.includes("Zofia")) ||
      availablePlVoices.find((v) => v.name.includes("Paulina")) ||
      availablePlVoices[0];

    // Zaznaczenie odpowiedniej opcji w select
    if (voiceSelect) {
      const matchIndex = availablePlVoices.indexOf(preferredVoice);
      if (matchIndex > -1) {
        voiceSelect.value = matchIndex;
      }
    }
    console.log(
      "[AUDIO_MODULE] Zainicjowano domyślny profil głosu:",
      preferredVoice.name,
    );
  }
}

// Nasłuchiwanie na zmianę z poziomu panelu ustawień
if (voiceSelect) {
  voiceSelect.addEventListener("change", (e) => {
    const selectedIndex = e.target.value;
    if (availablePlVoices[selectedIndex]) {
      preferredVoice = availablePlVoices[selectedIndex];
      console.log("[AUDIO_MODULE] Przełączono na profil:", preferredVoice.name);

      // Komunikat testowy przy zmianie
      window.speechSynthesis.cancel();
      window.currentUtterance = new SpeechSynthesisUtterance(
        "Moduł załadowany",
      );
      window.currentUtterance.voice = preferredVoice;
      window.currentUtterance.lang = "pl-PL";
      window.speechSynthesis.speak(window.currentUtterance);
    }
  });
}

// Wymuszenie odświeżenia po wykryciu nowych paczek językowych
window.speechSynthesis.onvoiceschanged = loadSystemVoices;
loadSystemVoices();

// Sterowanie głównym przełącznikiem audio (ikona w headerze)
if (voiceOutputToggle) {
  voiceOutputToggle.style.color = "var(--highlight-color)";

  voiceOutputToggle.addEventListener("click", () => {
    isVoiceOutputEnabled = !isVoiceOutputEnabled;
    const icon = voiceOutputToggle.querySelector("i");

    if (isVoiceOutputEnabled) {
      icon.classList.remove("fa-volume-mute");
      icon.classList.add("fa-volume-up");
      voiceOutputToggle.style.color = "var(--highlight-color)";
      voiceOutputToggle.title = "Moduł Audio: ONLINE";
    } else {
      icon.classList.remove("fa-volume-up");
      icon.classList.add("fa-volume-mute");
      voiceOutputToggle.style.color = "var(--text-muted)";
      voiceOutputToggle.title = "Moduł Audio: OFFLINE";
      window.speechSynthesis.cancel();
    }
  });
}

// Główna funkcja wyjściowa mowy
function speakBotResponse(htmlText) {
  if (!isVoiceOutputEnabled || !("speechSynthesis" in window)) return;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlText;
  const cleanText = tempDiv.textContent || tempDiv.innerText || "";

  if (!cleanText) return;

  window.speechSynthesis.cancel();

  window.currentUtterance = new SpeechSynthesisUtterance(cleanText);
  window.currentUtterance.lang = "pl-PL";
  window.currentUtterance.rate = 1.0;
  window.currentUtterance.pitch = 1.0;

  if (preferredVoice) {
    window.currentUtterance.voice = preferredVoice;
  }

  window.currentUtterance.onstart = () =>
    console.log("[AUDIO_MODULE] Strumieniowanie rozpoczęte...");
  window.currentUtterance.onend = () =>
    console.log("[AUDIO_MODULE] Strumieniowanie zakończone.");
  window.currentUtterance.onerror = (e) =>
    console.error("[AUDIO_MODULE] Błąd:", e.error);

  window.speechSynthesis.speak(window.currentUtterance);
}
