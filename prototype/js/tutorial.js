class Tutorial {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.isActive = false;
        this.completed = false;
        
        // タッチデバイスかどうかを判定
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // チュートリアルステップの定義
        this.steps = [
            {
                id: 'welcome',
                title: 'ドローンレスキューへようこそ！',
                text: '災害で取り残された市民を救助するミッションです。',
                action: null,
                highlight: null,
                position: 'center',
                allowInput: false,
                nextCondition: 'click'
            },
            {
                id: 'objective',
                title: 'ゲームの目的',
                text: '建物に取り残された市民を見つけて、基地まで運びましょう。',
                action: null,
                highlight: null,
                position: 'center',
                allowInput: false,
                nextCondition: 'click'
            },
            {
                id: 'controls_move',
                title: 'ドローンの操作',
                text: this.isTouchDevice ? 
                    '画面をタッチするとアナログスティックが表示されます。\nスティックでドローンを移動できます。\n短くタップするとハシゴを出し入れできます。\n上下左右すべての方向に動かし、タップも試してみましょう！' :
                    '矢印キーまたはWASDキーでドローンを移動できます。\nスペースキーでハシゴを出し入れできます。\n上下左右すべての方向に動かし、ハシゴも試してみましょう！',
                action: 'move',
                highlight: 'drone',
                position: 'top',
                allowInput: true,
                nextCondition: 'allControlsUsed'
            },
            {
                id: 'battery',
                title: 'バッテリー管理',
                text: '画面上部のバーがバッテリー残量です。\n時間や移動、救助操作で減少します。\n収容人数が多いほど消費量が増加します。\n0%になるとゲームオーバーです。',
                action: null,
                highlight: 'battery',
                position: 'top',
                allowInput: false,
                nextCondition: 'click'
            },
            {
                id: 'time_limit',
                title: '残り時間',
                text: '画面上部の「時間」が制限時間です。\n時間内にすべての市民を救助しましょう！',
                action: null,
                highlight: 'time',
                position: 'top',
                allowInput: false,
                nextCondition: 'click'
            },
            {
                id: 'find_citizen',
                title: '市民を見つけよう',
                text: '建物の近くにいる市民を探しましょう。\n市民の近くまで移動してください。',
                action: 'findCitizen',
                highlight: 'citizen',
                position: 'bottom',
                allowInput: true,
                nextCondition: 'nearCitizen'
            },
            {
                id: 'rescue',
                title: '市民を救助',
                text: this.isTouchDevice ?
                    '短くタップしてハシゴを降ろし、市民を救助しましょう！' :
                    'スペースキーを押してハシゴを降ろし、市民を救助しましょう！',
                action: 'rescue',
                highlight: 'citizen',
                position: 'bottom',
                allowInput: true,
                nextCondition: 'rescued'
            },
            {
                id: 'transport',
                title: '基地へ運ぶ',
                text: '救助した市民を基地（緑の建物）まで運びましょう。',
                action: 'transport',
                highlight: 'base',
                position: 'top',
                allowInput: true,
                nextCondition: 'nearBase'
            },
            {
                id: 'deliver',
                title: '市民を降ろす',
                text: this.isTouchDevice ?
                    '基地の上で短くタップして、市民を安全に降ろしましょう。' :
                    '基地の上でスペースキーを押して、市民を安全に降ろしましょう。',
                action: 'deliver',
                highlight: 'base',
                position: 'top',
                allowInput: true,
                nextCondition: 'delivered'
            },
            {
                id: 'charging_intro',
                title: '充電ポート',
                text: '青い建物は充電ポートです。\n接触するとバッテリーが回復します。\n実際に充電ポートまで移動してみましょう！',
                action: 'showCharging',
                highlight: 'chargingPort',
                position: 'center',
                allowInput: true,
                nextCondition: 'nearChargingPort'
            },
            {
                id: 'charging_action',
                title: 'バッテリー充電',
                text: '充電ポートに接触してバッテリーを回復させましょう！\n地面近くまで降りてください。',
                action: 'charge',
                highlight: 'chargingPort',
                position: 'center',
                allowInput: true,
                nextCondition: 'charged'
            },
            {
                id: 'stage_clear',
                title: 'ステージクリア',
                text: 'すべての市民を救助するとステージクリアです！\nクリアするとパワーアップを選択できます。',
                action: null,
                highlight: null,
                position: 'center',
                allowInput: false,
                nextCondition: 'click'
            },
            {
                id: 'powerups',
                title: 'パワーアップ',
                text: 'バッテリー容量、速度、充電効率など\n様々な強化を選択できます。',
                action: null,
                highlight: null,
                position: 'center',
                allowInput: false,
                nextCondition: 'click'
            },
            {
                id: 'complete',
                title: 'チュートリアル完了！',
                text: '準備ができました！\n実際のゲームを始めましょう。',
                action: null,
                highlight: null,
                position: 'center',
                allowInput: false,
                nextCondition: 'click'
            }
        ];
        
        // チュートリアルUI要素
        this.createUI();
        
        // 状態管理
        this.moveDetected = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.ladderUsed = false;
        this.citizenRescued = false;
        this.citizenDelivered = false;
    }
    
    createUI() {
        // チュートリアルオーバーレイ
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorialOverlay';
        this.overlay.className = 'tutorial-overlay hidden';
        
        // チュートリアルボックス
        this.tutorialBox = document.createElement('div');
        this.tutorialBox.className = 'tutorial-box';
        
        // タイトル
        this.titleElement = document.createElement('h3');
        this.titleElement.className = 'tutorial-title';
        
        // テキスト
        this.textElement = document.createElement('p');
        this.textElement.className = 'tutorial-text';
        
        // 次へボタン
        this.nextButton = document.createElement('button');
        this.nextButton.className = 'button tutorial-button';
        this.nextButton.textContent = '次へ';
        this.nextButton.addEventListener('click', () => this.handleNext());
        
        // スキップボタン
        this.skipButton = document.createElement('button');
        this.skipButton.className = 'button tutorial-skip';
        this.skipButton.textContent = 'スキップ';
        this.skipButton.addEventListener('click', () => this.skip());
        
        // 要素を組み立て
        this.tutorialBox.appendChild(this.titleElement);
        this.tutorialBox.appendChild(this.textElement);
        this.tutorialBox.appendChild(this.nextButton);
        this.tutorialBox.appendChild(this.skipButton);
        this.overlay.appendChild(this.tutorialBox);
        
        // ハイライト要素
        this.highlightElement = document.createElement('div');
        this.highlightElement.className = 'tutorial-highlight hidden';
        this.overlay.appendChild(this.highlightElement);
        
        // 矢印要素
        this.arrowElement = document.createElement('div');
        this.arrowElement.className = 'tutorial-arrow hidden';
        this.overlay.appendChild(this.arrowElement);
        
        // DOMに追加
        document.getElementById('gameUI').appendChild(this.overlay);
    }
    
    generateTutorialCitizens() {
        // チュートリアル用の市民を3人生成（実際のゲームと同じアルゴリズム）
        const citizenCount = 3;
        const roofRatio = 0.33; // 屋上1人、地上2人
        const roofCount = 1;
        const groundCount = 2;
        
        const homeX = this.game.stage.baseX + this.game.stage.baseWidth / 2;
        
        // 地上の市民を配置
        for (let i = 0; i < groundCount; i++) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                const stageMargin = 50;
                const x = Math.random() * (this.game.worldWidth - stageMargin * 2) + stageMargin;
                
                const homeBuffer = 150;
                const homeDistance = Math.abs(x - homeX);
                
                if (homeDistance < homeBuffer) {
                    attempts++;
                    continue;
                }
                
                let canPlace = true;
                const minDistance = 50;
                
                for (const other of this.game.citizens) {
                    if (Math.abs(other.x - x) < minDistance) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    const citizen = new Citizen(x, this.game.stage.groundLevel);
                    citizen.type = 'ground';
                    this.game.citizens.push(citizen);
                    placed = true;
                }
                
                attempts++;
            }
        }
        
        // 屋上の市民を配置
        const availableBuildings = [...this.game.stage.buildings];
        for (let i = 0; i < roofCount && availableBuildings.length > 0; i++) {
            const buildingIndex = Math.floor(Math.random() * availableBuildings.length);
            const building = availableBuildings.splice(buildingIndex, 1)[0];
            const originalIndex = this.game.stage.buildings.indexOf(building);
            
            let placed = false;
            let attempts = 0;
            const maxAttempts = 50;
            
            while (!placed && attempts < maxAttempts) {
                const x = building.x + Math.random() * (building.width - 20) + 10;
                const y = building.y - building.height;
                
                let canPlace = true;
                const minDistance = 10;
                
                for (const other of this.game.citizens) {
                    if (other.type === 'roof' && Math.abs(other.y - y) < 5) {
                        if (Math.abs(other.x - x) < minDistance * 2) {
                            canPlace = false;
                            break;
                        }
                    }
                }
                
                if (canPlace) {
                    const citizen = new Citizen(x, y);
                    citizen.type = 'roof';
                    citizen.buildingIndex = originalIndex;
                    this.game.citizens.push(citizen);
                    placed = true;
                }
                
                attempts++;
            }
        }
    }
    
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.classList.remove('hidden');
        
        // 状態を完全に初期化
        this.moveDetected = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.ladderUsed = false;
        this.citizenRescued = false;
        this.citizenDelivered = false;
        
        // チュートリアル用のステージを作成
        this.game.state = 'tutorial';
        this.game.currentStage = 0; // チュートリアルステージ
        this.game.worldWidth = 1600; // チュートリアル用の固定幅
        this.game.stage = new Stage(this.game.worldWidth, this.game.height, 0);
        this.game.drone = new Drone(this.game.stage.baseX + this.game.stage.baseWidth/2, 200);
        this.game.drone.worldWidth = this.game.worldWidth;
        this.game.drone.battery = 100; // バッテリーを満タンに
        
        // チュートリアル用の市民を実際のゲームと同じアルゴリズムで配置
        this.game.citizens = [];
        this.generateTutorialCitizens();
        
        // 充電ポートを未使用状態にリセット
        if (this.game.stage.chargingPort) {
            this.game.stage.chargingPort.used = false;
        }
        
        // 時間とスコアをリセット
        this.game.time = 0;
        this.game.rescuedCount = 0;
        
        this.showStep();
    }
    
    showStep() {
        const step = this.steps[this.currentStep];
        
        // UIを更新
        this.titleElement.textContent = step.title;
        
        // 操作進捗を表示
        if (step.nextCondition === 'allControlsUsed') {
            const progress = [];
            if (this.moveDetected.up) progress.push('↑');
            if (this.moveDetected.down) progress.push('↓');
            if (this.moveDetected.left) progress.push('←');
            if (this.moveDetected.right) progress.push('→');
            if (this.ladderUsed) progress.push('🪜');
            
            const remaining = [];
            if (!this.moveDetected.up) remaining.push('↑上');
            if (!this.moveDetected.down) remaining.push('↓下');
            if (!this.moveDetected.left) remaining.push('←左');
            if (!this.moveDetected.right) remaining.push('→右');
            if (!this.ladderUsed) remaining.push(this.isTouchDevice ? 'タップ(ハシゴ)' : 'スペース(ハシゴ)');
            
            let progressText = step.text;
            if (remaining.length > 0) {
                progressText += `\n\n残り: ${remaining.join(', ')}`;
            } else {
                progressText += '\n\n✅ すべての操作完了！\n1秒後に次へ進みます...';
            }
            this.textElement.textContent = progressText;
        } else {
            this.textElement.textContent = step.text;
        }
        
        // ボタンの表示制御
        if (step.nextCondition === 'click') {
            this.nextButton.style.display = 'block';
        } else {
            this.nextButton.style.display = 'none';
        }
        
        // ハイライトに応じて位置を動的に設定
        this.setTutorialBoxPosition(step);
        
        // ハイライトを設定
        if (step.highlight) {
            this.setHighlight(step.highlight);
        } else {
            this.highlightElement.classList.add('hidden');
            this.arrowElement.classList.add('hidden');
        }
        
        // 入力制御
        this.game.allowInput = step.allowInput;
    }
    
    setHighlight(target) {
        this.highlightElement.classList.remove('hidden');
        
        switch(target) {
            case 'drone':
                this.updateHighlightPosition(
                    this.game.drone.x - this.game.camera.x - 10,
                    this.game.drone.y - this.game.camera.y - 10,
                    this.game.drone.width + 20, this.game.drone.height + 20
                );
                break;
            case 'battery':
                this.highlightElement.style.left = '0px';
                this.highlightElement.style.top = '0px';
                this.highlightElement.style.width = '360px';
                this.highlightElement.style.height = '40px';
                break;
            case 'time':
                this.highlightElement.style.left = '270px';
                this.highlightElement.style.top = '50px';
                this.highlightElement.style.width = '80px';
                this.highlightElement.style.height = '30px';
                break;
            case 'citizen':
                if (this.game.citizens.length > 0) {
                    const citizen = this.game.citizens[0];
                    this.updateHighlightPosition(
                        citizen.x - this.game.camera.x - 10,
                        citizen.y - this.game.camera.y - 10,
                        30, 40
                    );
                }
                break;
            case 'base':
                this.updateHighlightPosition(
                    this.game.stage.baseX - this.game.camera.x - 5,
                    this.game.stage.baseY - this.game.camera.y - 5,
                    this.game.stage.baseWidth + 10, this.game.stage.baseHeight + 10
                );
                break;
            case 'chargingPort':
                const port = this.game.stage.chargingPort;
                if (port) {
                    this.updateHighlightPosition(
                        port.x - this.game.camera.x - 5,
                        port.y - port.height - this.game.camera.y - 5,
                        port.width + 10, port.height + 10
                    );
                }
                break;
        }
        
        // 画面外ハイライトの矢印表示
        this.updateOffscreenArrow(target);
    }
    
    updateOffscreenArrow(target) {
        const highlightRect = this.highlightElement.getBoundingClientRect();
        const gameRect = document.getElementById('gameCanvas').getBoundingClientRect();
        
        // ハイライトが画面内にあるかチェック
        const isVisible = highlightRect.left >= gameRect.left &&
                         highlightRect.right <= gameRect.right &&
                         highlightRect.top >= gameRect.top &&
                         highlightRect.bottom <= gameRect.bottom;
        
        if (!isVisible) {
            // 画面外の場合、矢印を表示
            this.arrowElement.classList.remove('hidden');
            
            // 矢印の位置を計算
            let arrowX = 180; // 画面中央
            let arrowY = 320;
            
            if (highlightRect.left < gameRect.left) {
                // 左側にある
                arrowX = 20;
                arrowY = Math.max(50, Math.min(590, highlightRect.top - gameRect.top));
                this.arrowElement.style.transform = 'rotate(-90deg)';
            } else if (highlightRect.right > gameRect.right) {
                // 右側にある
                arrowX = 340;
                arrowY = Math.max(50, Math.min(590, highlightRect.top - gameRect.top));
                this.arrowElement.style.transform = 'rotate(90deg)';
            } else if (highlightRect.top < gameRect.top) {
                // 上側にある
                arrowX = Math.max(20, Math.min(340, highlightRect.left - gameRect.left));
                arrowY = 50;
                this.arrowElement.style.transform = 'rotate(0deg)';
            } else if (highlightRect.bottom > gameRect.bottom) {
                // 下側にある
                arrowX = Math.max(20, Math.min(340, highlightRect.left - gameRect.left));
                arrowY = 590;
                this.arrowElement.style.transform = 'rotate(180deg)';
            }
            
            this.arrowElement.style.left = arrowX + 'px';
            this.arrowElement.style.top = arrowY + 'px';
        } else {
            this.arrowElement.classList.add('hidden');
        }
    }
    
    setTutorialBoxPosition(step) {
        if (!step.highlight) {
            // ハイライトがない場合はデフォルト位置
            this.tutorialBox.className = 'tutorial-box tutorial-' + step.position;
            return;
        }
        
        // ハイライト位置を取得
        let highlightX = 0, highlightY = 0;
        
        switch(step.highlight) {
            case 'drone':
                highlightX = this.game.drone.x - this.game.camera.x;
                highlightY = this.game.drone.y - this.game.camera.y;
                break;
            case 'citizen':
                if (this.game.citizens.length > 0) {
                    const citizen = this.game.citizens[0];
                    highlightX = citizen.x - this.game.camera.x;
                    highlightY = citizen.y - this.game.camera.y;
                }
                break;
            case 'base':
                highlightX = this.game.stage.baseX - this.game.camera.x;
                highlightY = this.game.stage.baseY - this.game.camera.y;
                break;
            case 'chargingPort':
                const port = this.game.stage.chargingPort;
                if (port) {
                    highlightX = port.x - this.game.camera.x;
                    highlightY = port.y - this.game.camera.y;
                }
                break;
            case 'time':
                highlightX = 310; // 時間表示の位置
                highlightY = 65;
                break;
        }
        
        // ハイライトと重ならない位置にウィンドウを配置
        let position = 'center';
        
        if (highlightY < 150) {
            // ハイライトが上部にある場合は下部に表示
            position = 'bottom';
        } else if (highlightY > 450) {
            // ハイライトが下部にある場合は上部に表示
            position = 'top';
        } else {
            // ハイライトが中央にある場合は左右で判定
            if (highlightX < 120) {
                // 左側にある場合は右側に表示
                position = 'right';
            } else if (highlightX > 240) {
                // 右側にある場合は左側に表示
                position = 'left';
            } else {
                // 中央にある場合は上部に表示
                position = 'top';
            }
        }
        
        this.tutorialBox.className = 'tutorial-box tutorial-' + position;
    }
    
    updateHighlightPosition(x, y, width, height) {
        this.highlightElement.style.left = x + 'px';
        this.highlightElement.style.top = y + 'px';
        this.highlightElement.style.width = width + 'px';
        this.highlightElement.style.height = height + 'px';
    }
    
    update() {
        if (!this.isActive) return;
        
        const step = this.steps[this.currentStep];
        
        // 条件チェック
        switch(step.nextCondition) {
            case 'allControlsUsed':
                // 各方向の移動を検出
                if (this.game.keys['ArrowUp'] || this.game.keys['w']) {
                    this.moveDetected.up = true;
                }
                if (this.game.keys['ArrowDown'] || this.game.keys['s']) {
                    this.moveDetected.down = true;
                }
                if (this.game.keys['ArrowLeft'] || this.game.keys['a']) {
                    this.moveDetected.left = true;
                }
                if (this.game.keys['ArrowRight'] || this.game.keys['d']) {
                    this.moveDetected.right = true;
                }
                if (this.game.keys[' ']) {
                    this.ladderUsed = true;
                }
                
                // タッチ操作の検出
                if (this.isTouchDevice && this.game.touchActive) {
                    // スティック操作を検出
                    if (Math.abs(this.game.stickPosition.x) > 0.3) {
                        if (this.game.stickPosition.x > 0) {
                            this.moveDetected.right = true;
                        } else {
                            this.moveDetected.left = true;
                        }
                    }
                    if (Math.abs(this.game.stickPosition.y) > 0.3) {
                        if (this.game.stickPosition.y > 0) {
                            this.moveDetected.down = true;
                        } else {
                            this.moveDetected.up = true;
                        }
                    }
                }
                
                // タップによるハシゴ操作の検出
                if (this.isTouchDevice && this.game.drone && this.game.drone.isRescuing) {
                    this.ladderUsed = true;
                }
                
                // 操作進捗をUIに反映
                this.showStep();
                
                // 全操作が完了したかチェック
                if (this.moveDetected.up && this.moveDetected.down && 
                    this.moveDetected.left && this.moveDetected.right && this.ladderUsed) {
                    // 1秒待ってから次へ進む
                    setTimeout(() => {
                        this.steps[this.currentStep].nextCondition = 'click';
                        this.showStep();
                    }, 1000);
                }
                break;
                
            case 'nearCitizen':
                if (this.game.citizens.length > 0) {
                    const citizen = this.game.citizens[0];
                    const distance = Math.sqrt(
                        Math.pow(this.game.drone.x - citizen.x, 2) +
                        Math.pow(this.game.drone.y - citizen.y, 2)
                    );
                    if (distance < 100) {
                        this.nextStep();
                    }
                }
                break;
                
            case 'rescued':
                if (this.game.drone.passengers && this.game.drone.passengers.length > 0) {
                    this.citizenRescued = true;
                    this.nextStep();
                }
                break;
                
            case 'nearBase':
                if (this.game.drone.x >= this.game.stage.baseX && 
                    this.game.drone.x <= this.game.stage.baseX + this.game.stage.baseWidth &&
                    this.game.drone.y >= this.game.stage.baseY - 50 &&
                    this.game.drone.y <= this.game.stage.baseY + this.game.stage.baseHeight + 50) {
                    this.nextStep();
                }
                break;
                
            case 'delivered':
                if (this.citizenRescued && this.game.drone.passengers && this.game.drone.passengers.length === 0) {
                    this.citizenDelivered = true;
                    this.nextStep();
                }
                break;
                
            case 'nearChargingPort':
                const port = this.game.stage.chargingPort;
                if (port) {
                    const distance = Math.sqrt(
                        Math.pow(this.game.drone.x - port.x, 2) + 
                        Math.pow(this.game.drone.y - (port.y - port.height/2), 2)
                    );
                    if (distance < 80) {
                        this.nextStep();
                    }
                }
                break;
                
            case 'charged':
                // バッテリーが充電されたかチェック
                if (this.game.stage.chargingPort.used) {
                    this.nextStep();
                }
                break;
        }
        
        // ハイライトの更新（常に更新）
        if (step.highlight) {
            this.setHighlight(step.highlight);
        }
    }
    
    handleNext() {
        const step = this.steps[this.currentStep];
        if (step.nextCondition === 'click') {
            this.nextStep();
        }
    }
    
    nextStep() {
        this.currentStep++;
        
        if (this.currentStep >= this.steps.length) {
            this.complete();
        } else {
            this.showStep();
        }
    }
    
    skip() {
        if (confirm('チュートリアルをスキップしますか？')) {
            this.complete();
        }
    }
    
    complete() {
        this.isActive = false;
        this.completed = true;
        this.overlay.classList.add('hidden');
        this.game.allowInput = true;
        
        // タイトル画面に戻る
        this.game.returnToTitle();
    }
}