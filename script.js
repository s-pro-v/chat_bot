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

      addMessageToChat("bot", data.reply);

      if (data.action) {
        executeBotAction(data.action);
      }
    } catch (error) {
      console.error("Błąd:", error);
      addMessageToChat(
        "bot",
        "<em>[BŁĄD SYSTEMU]: Brak połączenia z serwerem produkcyjnym. Sprawdź status na Render.com.</em>",
      );
    }
  });
});
