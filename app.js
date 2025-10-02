const KEY = "vocab_words_v1";
let words = JSON.parse(localStorage.getItem(KEY) || "[]");
const $ = (s) => document.querySelector(s);
const view = $("#view");

let consecutiveCorrectCount = 0; 

// 初回ロード時
if (words.length === 0) {
  fetch("words.json")
    .then(r => r.json())
    .then(d => { words = d; save(); renderLearn(); });
} else {
  renderLearn();
}
function save() { localStorage.setItem(KEY, JSON.stringify(words)); }

const navButtons = document.querySelectorAll(".nav-button");

navButtons.forEach(button => {
  button.onclick = () => {
    navButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    
    consecutiveCorrectCount = 0;

    if (button.id === "modeLearn") {
      renderLearn();
    } else if (button.id === "modeList") {
      renderList();
    } else if (button.id === "modeAdd") {
      renderAdd();
    }
  };
});

$("#modeLearn").classList.add("active");


function renderLearn() {
  if (words.length === 0) {
    view.innerHTML = `
      <p>単語がありません。新しい単語を追加してください。</p>
      <button onclick="document.getElementById('modeAdd').click()">単語を追加</button>
    `;
    return;
  }
  const q = words[Math.floor(Math.random() * words.length)];
  view.innerHTML = `
    <div class="learn-header">
      <p class="consecutive-count">連続正解数: <span id="consecutiveCorrect">${consecutiveCorrectCount}</span></p>
    </div>
    <h2 class="question-text">${q.en}</h2>
    <input id="answer" type="text" placeholder="答えを入力してください" autofocus />
    <button id="check" class="action-button">答え合わせ</button>
    <p id="result" class="result-message"></p>
  `;
  const answerInput = $("#answer");
  const resultParagraph = $("#result");
  const consecutiveCorrectSpan = $("#consecutiveCorrect");

  $("#check").onclick = () => {
    const ans = answerInput.value.trim().toLowerCase();
    const ok = ans === q.ja.toLowerCase();
    resultParagraph.textContent = ok ? "✅ 正解！" : `❌ 不正解。正解は「${q.ja}」でした。`;
    resultParagraph.style.color = ok ? "var(--success-color)" : "var(--danger-color)";
    
    if (ok) {
      consecutiveCorrectCount++;
    } else {
      consecutiveCorrectCount = 0;
    }
    consecutiveCorrectSpan.textContent = consecutiveCorrectCount;
    
    setTimeout(() => {
        resultParagraph.textContent = "";
        renderLearn();
    }, ok ? 1000 : 2000);
  };

  answerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      $("#check").click();
    }
  });
  answerInput.focus();
}

function renderList() {
  if (words.length === 0) {
    view.innerHTML = "<p>まだ単語が登録されていません。</p>";
    return;
  }
  view.innerHTML = `
    <h2>登録単語リスト</h2>
    <ul>
      ${words.map((w, index) => `
        <li>
          <span>${w.en}</span> - ${w.ja}
          <button class="delete-button" data-index="${index}">削除</button>
        </li>
      `).join("")}
    </ul>
  `;

  document.querySelectorAll(".delete-button").forEach(button => {
    button.onclick = (e) => {
      const index = parseInt(e.target.dataset.index);
      if (confirm(`「${words[index].en} - ${words[index].ja}」を削除してもよろしいですか？`)) {
        words.splice(index, 1);
        save();
        renderList();
      }
    };
  });
}

function renderAdd() {
  view.innerHTML = `
    <h2>新しい単語を追加</h2>
    <p class="add-instruction">
      1行に1つの単語ペアを入力してください。<br>
      例: apple, りんご<br>
      または: book - 本<br>
      カンマ(,)、ハイフン(-)、コロン(:) で区切れます。
    </p>
    <textarea id="wordsInput" placeholder="単語ペアをここに入力..." rows="10"></textarea>
    <button id="addMultiple" class="action-button">まとめて追加</button>
  `;
  const wordsInput = $("#wordsInput");

  $("#addMultiple").onclick = () => {
    const inputText = wordsInput.value.trim();
    if (inputText === "") {
      alert("単語ペアを入力してください。");
      return;
    }

    const lines = inputText.split('\n');
    let addedCount = 0;
    let skippedCount = 0;
    const newWords = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === "") return;

      // カンマ、ハイフン、コロンのいずれかで分割を試みる
      const parts = trimmedLine.split(/[,ー\-:]/).map(part => part.trim());

      if (parts.length >= 2) {
        const en = parts[0];
        const ja = parts[1];

        if (en && ja) {
          // 重複チェック
          const isDuplicate = words.some(word => 
            word.en.toLowerCase() === en.toLowerCase() || 
            word.ja.toLowerCase() === ja.toLowerCase()
          );
          if (isDuplicate) {
            console.warn(`Skipped duplicate: ${en} - ${ja}`);
            skippedCount++;
          } else {
            newWords.push({ en: en, ja: ja });
            addedCount++;
          }
        } else {
          console.warn(`Skipped invalid format: ${line}`);
          skippedCount++;
        }
      } else {
        console.warn(`Skipped invalid format: ${line}`);
        skippedCount++;
      }
    });

    if (newWords.length > 0) {
      words = words.concat(newWords); // 既存の単語に追加
      save();
      let message = `${addedCount}個の単語を追加しました！`;
      if (skippedCount > 0) {
        message += ` (${skippedCount}個はスキップされました: フォーマット不正または重複)`;
      }
      alert(message);
      wordsInput.value = ""; // テキストエリアをクリア
      renderList(); // 追加後にリストビューに切り替える
    } else {
      let message = "追加できる有効な単語ペアが見つかりませんでした。";
      if (skippedCount > 0) {
        message += ` (${skippedCount}個はスキップされました: フォーマット不正または重複)`;
      }
      alert(message);
    }
  };

  wordsInput.focus(); // テキストエリアにフォーカス
}