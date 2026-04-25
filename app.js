document.addEventListener('DOMContentLoaded', () => {
    // 1. 気分とアクティビティのデータ定義 (少し選択肢を増やして重複回避しやすく)
    const vibeOptions = [
        {
            id: '1', icon: '🏕️', name: "アウトドア vibe", desc: "外に出たい！身体を動かしたい！",
            activities: ["散歩", "カフェ巡り", "買い物", "サウナ", "公園散策", "ボウリング", "スポーツ", "ドライブ", "テーマパーク"]
        },
        {
            id: '2', icon: '☕', name: "インドア chill vibe", desc: "家でまったりしたい...",
            activities: ["映画鑑賞", "アニメ一気見", "こだわりの料理", "断捨離・掃除", "ゲーム", "全力でだらだらする", "お昼寝", "漫画を読む"]
        },
        {
            id: '3', icon: '🎨', name: "クリエイティブ vibe", desc: "何か作りたい・集中したい！",
            activities: ["絵を描く", "動画編集", "プログラミング", "作文・ブログ", "日記を書く", "音楽制作", "本を読む", "DIY"]
        },
        {
            id: '4', icon: '🗣️', name: "友だち vibe", desc: "誰かと関わりたい・話したい！",
            activities: ["友達に電話", "ご飯に誘う", "ゲーセン", "ボードゲーム", "カラオケ", "オンラインマルチ対戦", "飲みに行く"]
        },
        {
            id: '5', icon: '🛁', name: "リフレッシュ vibe", desc: "とにかく疲れてる・癒やされたい...",
            activities: ["ゆっくりお風呂", "近所を散歩", "静かなカフェ", "贅沢な昼寝", "マッサージ", "公園でぼーっとする", "ヨガ・ストレッチ"]
        }
    ];

    const views = {
        vibe: document.getElementById('view-vibe'),
        suggestions: document.getElementById('view-suggestions'),
        result: document.getElementById('view-result')
    };

    const vibeButtonsContainer = document.getElementById('vibe-buttons');
    const suggestionList = document.getElementById('suggestion-list');
    const suggestionTitle = document.getElementById('suggestion-title');
    const vibeTitle = document.getElementById('vibe-title');
    const progressFill = document.getElementById('progress-fill');

    // スケジュール状態管理
    const stepOrder = ['morning', 'noon', 'night'];
    let currentStepIndex = 0;

    const schedule = {
        morning: null,
        noon: null,
        night: null
    };

    // 使ったアクティビティを記録（重複防止用）
    let usedActivities = new Set();
    let currentVibe = null;

    // --- 初期化処理 ---

    // 気分ボタンを生成
    vibeOptions.forEach(vibe => {
        const btn = document.createElement('button');
        btn.className = 'vibe-btn';
        btn.innerHTML = `
            <span class="vibe-icon">${vibe.icon}</span>
            <div class="vibe-info">
                <strong class="vibe-name">${vibe.name}</strong>
                <span class="vibe-desc">${vibe.desc}</span>
            </div>
        `;

        btn.addEventListener('click', () => {
            currentVibe = vibe;
            showSuggestions();
        });

        vibeButtonsContainer.appendChild(btn);
    });

    // 画面のタイトルとプログレスバーを更新
    function updateVibeScreenData() {
        const step = stepOrder[currentStepIndex];

        if (step === 'morning') {
            vibeTitle.innerHTML = "✨ まずは「朝」何をする？✨";
            progressFill.style.width = "10%";
        } else if (step === 'noon') {
            vibeTitle.innerHTML = "✨ 次は「昼」何をする？✨";
            progressFill.style.width = "45%";
        } else if (step === 'night') {
            vibeTitle.innerHTML = "✨ 最後に「夜」何をする？✨";
            progressFill.style.width = "80%";
        }
    }

    // --- ロジック ---

    // 画面切り替えフェードアニメーション
    function switchView(viewName) {
        Object.values(views).forEach(v => {
            if (v.classList.contains('active')) {
                v.classList.remove('active');
                setTimeout(() => {
                    v.style.display = 'none';
                }, 400);
            }
        });

        setTimeout(() => {
            views[viewName].style.display = 'flex';
            void views[viewName].offsetWidth;
            views[viewName].classList.add('active');
        }, 400);
    }

    // 未使用のアクティビティをランダム取得
    function getRandomActivities(activities, count) {
        // すでに選んだものを除外する
        const available = activities.filter(a => !usedActivities.has(a));

        // もし候補が足りなくなってしまったら、重複を許容する(フォールバック)
        const pool = available.length >= count ? available : activities;

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // 提案画面
    function showSuggestions() {
        if (!currentVibe) return;

        const timeLabel =
            stepOrder[currentStepIndex] === 'morning' ? "🌅 朝" :
                stepOrder[currentStepIndex] === 'noon' ? "☀️ 昼" : "🌙 夜";

        suggestionTitle.innerHTML = `「${currentVibe.name}」<br><span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: normal;">${timeLabel}の提案</span>`;
        suggestionList.innerHTML = '';

        // 最大3つの提案を取得
        const numToSuggest = Math.min(3, currentVibe.activities.length);
        const suggestions = getRandomActivities(currentVibe.activities, numToSuggest);

        suggestions.forEach((activity) => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.innerHTML = activity;

            // 選んだときの処理
            btn.addEventListener('click', () => {
                commitActivity(activity);
            });

            suggestionList.appendChild(btn);
        });

        switchView('suggestions');
    }

    // スケジュール決定時の処理
    function commitActivity(activity) {
        const step = stepOrder[currentStepIndex];
        schedule[step] = activity;
        usedActivities.add(activity); // 重複防止のために記憶

        currentStepIndex++;

        if (currentStepIndex >= stepOrder.length) {
            // 全て埋まったら結果画面へ
            showResult();
        } else {
            // 次のステップへ (毎回気分を聞くため Vibe画面 に戻る)
            currentVibe = null;
            updateVibeScreenData();
            switchView('vibe');
        }
    }

    // 結果画面
    function showResult() {
        progressFill.style.width = "100%";

        // 取得した予定をHTMLにセット
        document.getElementById('final-morning').textContent = schedule.morning;
        document.getElementById('final-noon').textContent = schedule.noon;
        document.getElementById('final-night').textContent = schedule.night;

        switchView('result');
    }

    // 最初からやり直す処理
    function resetApp() {
        currentStepIndex = 0;
        schedule.morning = null;
        schedule.noon = null;
        schedule.night = null;
        usedActivities.clear();
        currentVibe = null;

        updateVibeScreenData();
        switchView('vibe');
    }

    // --- イベントリスナー ---
    document.getElementById('btn-reroll').addEventListener('click', showSuggestions);

    document.getElementById('btn-back').addEventListener('click', () => {
        // 気分を選び直す (ステップは維持)
        currentVibe = null;
        switchView('vibe');
    });

    document.getElementById('btn-restart').addEventListener('click', resetApp);

    // アプリ起動時のセットアップ
    updateVibeScreenData();
});
