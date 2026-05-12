document.addEventListener('DOMContentLoaded', () => {
    // 1. 気分とアクティビティのデータ定義
    const vibeOptions = [
        { id: '1', icon: '🏕️', name: "アウトドア vibe", desc: "外に出たい！身体を動かしたい！", activities: ["散歩", "カフェ巡り", "買い物", "サウナ", "公園散策", "ボウリング", "スポーツ", "ドライブ", "テーマパーク"] },
        { id: '2', icon: '☕', name: "インドア chill vibe", desc: "家でまったりしたい...", activities: ["映画鑑賞", "アニメ一気見", "こだわりの料理", "断捨離・掃除", "ゲーム", "全力でだらだらする", "お昼寝", "漫画を読む"] },
        { id: '3', icon: '🎨', name: "クリエイティブ vibe", desc: "何か作りたい・集中したい！", activities: ["絵を描く", "動画編集", "プログラミング", "作文・ブログ", "日記を書く", "音楽制作", "本を読む", "DIY"] },
        { id: '4', icon: '🗣️', name: "友だち vibe", desc: "誰かと関わりたい・話したい！", activities: ["友達に電話", "ご飯に誘う", "ゲーセン", "ボードゲーム", "カラオケ", "オンラインマルチ対戦", "飲みに行く"] },
        { id: '5', icon: '🛁', name: "リフレッシュ vibe", desc: "とにかく疲れてる・癒やされたい...", activities: ["ゆっくりお風呂", "近所を散歩", "静かなカフェ", "贅沢な昼寝", "マッサージ", "公園でぼーっとする", "ヨガ・ストレッチ"] }
    ];

    const chatHistory = document.getElementById('chat-history');
    const inputTextArea = document.getElementById('input-text-area');
    const inputButtonArea = document.getElementById('input-button-area');
    const destInput = document.getElementById('dest-input');
    const btnSendDest = document.getElementById('btn-send-dest');

    // 状態管理
    const stepOrder = ['morning', 'noon', 'night'];
    let currentStepIndex = 0;
    const schedule = { morning: null, noon: null, night: null };
    let currentDestination = "";
    let usedActivities = new Set();
    let currentVibe = null;

    // --- チャットUI用ヘルパー関数 ---

    // 一番下までスクロール
    function scrollToBottom() {
        setTimeout(() => { 
            chatHistory.scrollTop = chatHistory.scrollHeight; 
        }, 50);
    }

    // BOTのメッセージを追加
    function addBotMessage(htmlContent) {
        const row = document.createElement('div');
        row.className = 'message-row bot';
        row.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="bubble">${htmlContent}</div>
        `;
        chatHistory.appendChild(row);
        scrollToBottom();
    }

    // ユーザーのメッセージを追加
    function addUserMessage(text) {
        const row = document.createElement('div');
        row.className = 'message-row user';
        row.innerHTML = `<div class="bubble">${text}</div>`;
        chatHistory.appendChild(row);
        scrollToBottom();
    }

    // 入力エリアを隠す
    function clearInputs() {
        inputButtonArea.innerHTML = '';
        inputButtonArea.classList.add('hidden');
        inputTextArea.classList.add('hidden');
    }

    // --- ロジック ---

    function startApp() {
        currentStepIndex = 0;
        currentDestination = "";
        usedActivities.clear();
        currentVibe = null;
        chatHistory.innerHTML = '';
        clearInputs();

        // 最初の挨拶
        addBotMessage("🗺️ 今日はどこへ行く？<br><span style='font-size:0.8rem;color:#666;'>（決まってなければ空欄で送信してね！）</span>");
        
        // 少し遅れて入力欄を表示
        setTimeout(() => {
            inputTextArea.classList.remove('hidden');
            destInput.value = '';
            destInput.focus();
        }, 600);
    }

    function askVibe() {
        const step = stepOrder[currentStepIndex];
        let timeText = step === 'morning' ? "朝" : step === 'noon' ? "昼" : "夜";
        
        setTimeout(() => {
            addBotMessage(`✨ 「${timeText}」は何をする？<br>今の気分を教えてね！`);
            showVibeButtons();
        }, 800); // リアルな間を演出
    }

    function showVibeButtons() {
        clearInputs();
        vibeOptions.forEach(vibe => {
            const btn = document.createElement('button');
            btn.className = 'chat-btn';
            btn.innerHTML = `<span style="font-size:1.5rem;margin-right:10px;">${vibe.icon}</span> <div><strong>${vibe.name}</strong><br><span style="font-size:0.75rem;color:#666;">${vibe.desc}</span></div>`;
            
            // 選んだ時の処理
            btn.onclick = () => {
                addUserMessage(`${vibe.icon} ${vibe.name}`);
                currentVibe = vibe;
                showSuggestions();
            };
            inputButtonArea.appendChild(btn);
        });
        inputButtonArea.classList.remove('hidden');
    }

    // 未使用のアクティビティをランダム取得
    function getRandomActivities(activities, count) {
        const available = activities.filter(a => !usedActivities.has(a));
        const pool = available.length >= count ? available : activities;
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    function showSuggestions() {
        clearInputs();
        setTimeout(() => {
            addBotMessage(`「${currentVibe.name}」だね！<br>この中から選んでみて💡`);
            
            const numToSuggest = Math.min(3, currentVibe.activities.length);
            const suggestions = getRandomActivities(currentVibe.activities, numToSuggest);

            suggestions.forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'chat-btn';
                btn.innerHTML = `✅ ${act}`;
                btn.onclick = () => {
                    addUserMessage(act);
                    commitActivity(act);
                };
                inputButtonArea.appendChild(btn);
            });

            // その他アクション
            const rerollBtn = document.createElement('button');
            rerollBtn.className = 'chat-btn action';
            rerollBtn.innerHTML = "🔄 他の候補を見る";
            rerollBtn.onclick = () => {
                addUserMessage("他の候補を見る");
                showSuggestions();
            };
            inputButtonArea.appendChild(rerollBtn);

            const backBtn = document.createElement('button');
            backBtn.className = 'chat-btn action';
            backBtn.innerHTML = "⬅️ 気分を選び直す";
            backBtn.onclick = () => {
                addUserMessage("やっぱり気分を選び直す！");
                askVibe();
            };
            inputButtonArea.appendChild(backBtn);

            inputButtonArea.classList.remove('hidden');
        }, 800);
    }

    function commitActivity(activity) {
        const step = stepOrder[currentStepIndex];
        schedule[step] = activity;
        usedActivities.add(activity); // 重複防止
        
        currentStepIndex++;
        clearInputs();

        if (currentStepIndex >= stepOrder.length) {
            // 全て埋まったら結果へ
            setTimeout(showResult, 800);
        } else {
            // 次のステップへ
            askVibe();
        }
    }

    // スケジュール結果表示（吹き出しの中にカードを描画）
    function showResult() {
        addBotMessage("🎉 スケジュール完成！<br>最高の1日になりますように✨");

        const baseMapUrl = "https://www.google.com/maps/search/?api=1&query=";
        const queryPrefix = currentDestination ? currentDestination + " " : "";

        let destHtml = "";
        if (currentDestination) {
            destHtml = `<div style="font-weight:bold; color:#0ea5e9; margin-bottom: 15px; font-size:1.1rem;">🗺️ 行き先: ${currentDestination}</div>`;
        }

        const scheduleHtml = `
            <div class="schedule-card">
                ${destHtml}
                <ul class="timeline">
                    <li class="timeline-item">
                        <div class="timeline-icon">🌅</div>
                        <div class="timeline-content">
                            <span class="time-label">朝 (Morning)</span>
                            <span class="activity-text">${schedule.morning}</span>
                            <a href="${baseMapUrl + encodeURIComponent(queryPrefix + schedule.morning + " おすすめ")}" target="_blank" class="map-link-btn">📍 マップで提案を見る</a>
                        </div>
                    </li>
                    <li class="timeline-item">
                        <div class="timeline-icon">☀️</div>
                        <div class="timeline-content">
                            <span class="time-label">昼 (Noon)</span>
                            <span class="activity-text">${schedule.noon}</span>
                            <a href="${baseMapUrl + encodeURIComponent(queryPrefix + schedule.noon + " おすすめ")}" target="_blank" class="map-link-btn">📍 マップで提案を見る</a>
                        </div>
                    </li>
                    <li class="timeline-item">
                        <div class="timeline-icon">🌙</div>
                        <div class="timeline-content">
                            <span class="time-label">夜 (Night)</span>
                            <span class="activity-text">${schedule.night}</span>
                            <a href="${baseMapUrl + encodeURIComponent(queryPrefix + schedule.night + " おすすめ")}" target="_blank" class="map-link-btn">📍 マップで提案を見る</a>
                        </div>
                    </li>
                </ul>
            </div>
        `;
        
        setTimeout(() => {
            addBotMessage(scheduleHtml);
            
            // もう一度ボタンを表示
            clearInputs();
            const restartBtn = document.createElement('button');
            restartBtn.className = 'chat-btn action';
            restartBtn.innerHTML = "🔄 別のスケジュールを作る";
            restartBtn.onclick = () => {
                addUserMessage("最初からやり直す！");
                setTimeout(startApp, 1000);
            };
            inputButtonArea.appendChild(restartBtn);
            inputButtonArea.classList.remove('hidden');
        }, 1200); // 結果は少しタメてから出す
    }

    // --- イベントリスナー ---

    // 目的地の送信
    btnSendDest.onclick = () => {
        const val = destInput.value.trim();
        if (val) {
            currentDestination = val;
            addUserMessage(val);
        } else {
            currentDestination = "";
            addUserMessage("（目的地：未定）");
        }
        clearInputs();
        askVibe();
    };

    destInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnSendDest.click();
    });

    // アプリ開始
    startApp();
});
