class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // アップグレードシステム
        this.upgradeSystem = new UpgradeSystem();
        
        // サウンドマネージャー
        this.soundManager = new SoundManager();
        this.soundManager.createSounds();
        
        // キャンバスサイズ設定（スマホ縦画面対応）
        this.width = 360;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // レスポンシブ対応
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // デバイスに応じて操作説明を切り替え
        this.updateControlsDisplay();
        
        // iOS Safariのアドレスバー対策
        this.setupMobileOptimizations();
        
        // スクロール関連
        this.camera = {
            x: 0,
            y: 0
        };
        this.worldWidth = 1600; // ベースのワールド横幅
        
        // ゲーム状態
        this.state = 'menu'; // menu, playing, gameover, failed
        this.score = 0;
        this.rescuedCount = 0;
        this.time = 0;
        this.timeLimit = 90; // 1分30秒の制限時間
        this.lastTime = 0;
        this.failureReason = '';
        this.currentStage = 1; // 現在のステージ番号
        this.continueCount = 0; // コンティニュー回数
        this.totalRescued = 0; // 総救助人数
        
        // ゲームオブジェクト
        this.drone = null;
        this.citizens = [];
        this.stage = null;
        
        // 入力管理
        this.keys = {};
        this.setupInput();
        
        // UI要素
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.failedScreen = document.getElementById('failedScreen');
        this.batteryFill = document.getElementById('batteryFill');
        this.batteryPercent = document.getElementById('batteryPercent');
        this.batteryDrain = document.getElementById('batteryDrain');
        this.capacityText = document.getElementById('capacityText');
        this.rescuedText = document.getElementById('rescuedText');
        this.timeText = document.getElementById('timeText');
        this.stageText = document.getElementById('stageText');
        
        // ボタンイベント
        document.getElementById('startButton').addEventListener('click', () => {
            this.soundManager.play('click');
            this.startGame();
        });
        // restartButtonは削除されたためコメントアウト
        // document.getElementById('restartButton').addEventListener('click', () => {
        //     this.soundManager.play('click');
        //     this.startGame();
        // });
        document.getElementById('continueButton').addEventListener('click', () => {
            this.soundManager.play('click');
            this.continueGame();
        });
        document.getElementById('titleButton').addEventListener('click', () => {
            this.soundManager.play('click');
            this.returnToTitle();
        });
        
        // アップグレード画面のイベント
        const upgradeIcon = document.getElementById('upgradeIcon');
        const closeProgressBtn = document.getElementById('closeProgressBtn');
        
        if (upgradeIcon) {
            upgradeIcon.addEventListener('click', () => {
                this.soundManager.play('click');
                this.showUpgradeProgress();
            });
        }
        
        if (closeProgressBtn) {
            closeProgressBtn.addEventListener('click', () => this.closeUpgradeProgress());
        }
        
        // タイトルに戻るボタン
        const titleFromProgressBtn = document.getElementById('titleFromProgressBtn');
        if (titleFromProgressBtn) {
            titleFromProgressBtn.addEventListener('click', () => {
                this.soundManager.play('click');
                if (confirm('進行状況を失いますが、タイトルに戻りますか？')) {
                    this.closeUpgradeProgress();
                    this.returnToTitle();
                }
            });
        }
    }
    
    setupInput() {
        // キーボード入力
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // スペースキー処理
            if (e.key === ' ' && this.state === 'playing') {
                e.preventDefault();
                this.handleRescueAction();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // タッチコントロールの設定
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        // アナログスティック関連の変数
        this.touchActive = false;
        this.touchStartTime = 0;
        this.touchIdentifier = null;
        this.stickPosition = { x: 0, y: 0 };
        this.stickCenter = { x: 0, y: 0 };
        
        const analogStick = document.getElementById('analogStick');
        const stickBase = analogStick.querySelector('.stick-base');
        const stickKnob = analogStick.querySelector('.stick-knob');
        const stickRadius = 75; // スティックベースの半径
        const knobMaxDistance = 50; // ノブの最大移動距離
        
        // タッチ開始
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (this.state !== 'playing') return;
            
            // 複数タッチの処理
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                
                // 最初のタッチ（アナログスティック用）
                if (!this.touchActive) {
                    this.touchStartTime = Date.now();
                    this.touchIdentifier = touch.identifier;
                    
                    // スティックを表示（タッチ位置を中心に）
                    analogStick.classList.remove('hidden');
                    analogStick.style.left = `${touch.clientX - stickRadius}px`;
                    analogStick.style.top = `${touch.clientY - stickRadius}px`;
                    
                    this.stickCenter = {
                        x: touch.clientX,
                        y: touch.clientY
                    };
                    
                    this.touchActive = true;
                } else {
                    // 2本目以降のタッチ（救助アクション用）
                    if (touch.identifier !== this.touchIdentifier) {
                        this.handleRescueAction();
                    }
                }
            }
        });
        
        // タッチ移動
        window.addEventListener('touchmove', (e) => {
            if (!this.touchActive) return;
            
            // 該当するタッチを探す
            let touch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.touchIdentifier) {
                    touch = e.touches[i];
                    break;
                }
            }
            
            if (!touch) return;
            
            e.preventDefault();
            
            // スティックの位置を計算
            const deltaX = touch.clientX - this.stickCenter.x;
            const deltaY = touch.clientY - this.stickCenter.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 最大距離に制限
            let limitedDeltaX = deltaX;
            let limitedDeltaY = deltaY;
            
            if (distance > knobMaxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                limitedDeltaX = Math.cos(angle) * knobMaxDistance;
                limitedDeltaY = Math.sin(angle) * knobMaxDistance;
            }
            
            // ノブの位置を更新
            stickKnob.style.transform = `translate(${limitedDeltaX}px, ${limitedDeltaY}px)`;
            
            // 入力値を正規化（-1 から 1 の範囲）
            this.stickPosition = {
                x: limitedDeltaX / knobMaxDistance,
                y: limitedDeltaY / knobMaxDistance
            };
        });
        
        // タッチ終了
        window.addEventListener('touchend', (e) => {
            if (!this.touchActive) return;
            
            // 該当するタッチが終了したか確認
            let touchEnded = true;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.touchIdentifier) {
                    touchEnded = false;
                    break;
                }
            }
            
            if (!touchEnded) return;
            
            e.preventDefault();
            
            const touchDuration = Date.now() - this.touchStartTime;
            
            // 短いタップ（300ms以下）の場合、救助アクション
            if (touchDuration < 300 && Math.abs(this.stickPosition.x) < 0.2 && Math.abs(this.stickPosition.y) < 0.2) {
                this.handleRescueAction();
            }
            
            // スティックを非表示
            analogStick.classList.add('hidden');
            stickKnob.style.transform = 'translate(0, 0)';
            
            this.touchActive = false;
            this.stickPosition = { x: 0, y: 0 };
            this.touchIdentifier = null;
        });
        
        // タッチキャンセル
        window.addEventListener('touchcancel', (e) => {
            if (!this.touchActive) return;
            
            e.preventDefault();
            
            // スティックを非表示
            analogStick.classList.add('hidden');
            stickKnob.style.transform = 'translate(0, 0)';
            
            this.touchActive = false;
            this.stickPosition = { x: 0, y: 0 };
            this.touchIdentifier = null;
        });
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.rescuedCount = 0;
        this.time = 0;
        this.continueCount = 0; // ステージ開始時にリセット
        
        // UI更新
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.failedScreen.classList.add('hidden');
        
        
        // BGM開始（既に再生中の場合は停止してから再開始）
        this.soundManager.stopBGM();
        this.soundManager.playBGM();
        
        // ゲームオブジェクト初期化
        this.initializeGame();
    }
    
    initializeGame() {
        // ステージに応じてワールドサイズを拡大
        this.worldWidth = 1600 + (this.currentStage - 1) * 400; // ステージごとに400px拡大
        
        // ステージ初期化（ワールドサイズを渡す）
        this.stage = new Stage(this.worldWidth, this.height, this.currentStage);
        
        // ドローン初期化 (基地の近くに配置)
        this.drone = new Drone(this.stage.baseX + this.stage.baseWidth/2, 300);
        this.drone.worldWidth = this.worldWidth; // ドローンにワールドサイズを設定
        
        // アップグレードを適用
        this.upgradeSystem.applyUpgrades(this.drone, this);
        
        // 充電ポートの充電量をステージに応じて設定
        const baseChargeAmount = 30 - Math.min(this.currentStage * 2, 20); // ステージが進むほど充電量が減る
        this.stage.chargingPort.chargeAmount = baseChargeAmount;
        this.stage.chargingPort.used = false;
        
        // 市民配置（ランダム生成）
        this.citizens = [];
        this.generateCitizens();
    }
    
    generateCitizens() {
        // 救助者数（ステージが進むと増えるが、最初は5人）
        const citizenCount = Math.min(5 + Math.floor((this.currentStage - 1) / 2), 10);
        
        // 地上と屋上の比率
        const roofRatio = Math.min(0.3 + (this.currentStage - 1) * 0.1, 0.7);
        const roofCount = Math.floor(citizenCount * roofRatio);
        const groundCount = citizenCount - roofCount;
        
        // ホームポイントの位置
        const homeX = this.stage.baseX + this.stage.baseWidth / 2;
        
        // 地上の市民を配置
        for (let i = 0; i < groundCount; i++) {
            // ホームポイントの左右にランダムに配置
            let x;
            if (Math.random() < 0.3) {
                // 30%の確率でホームポイントの左側
                x = Math.random() * (homeX - 100) + 50;
            } else {
                // 70%の確率でホームポイントの右側
                x = Math.random() * (this.worldWidth - homeX - 100) + homeX + 50;
            }
            
            const citizen = new Citizen(x, this.stage.groundLevel);
            citizen.type = 'ground';
            this.citizens.push(citizen);
        }
        
        // 屋上の市民を配置
        const availableBuildings = [...this.stage.buildings];
        for (let i = 0; i < roofCount && availableBuildings.length > 0; i++) {
            const buildingIndex = Math.floor(Math.random() * availableBuildings.length);
            const building = availableBuildings.splice(buildingIndex, 1)[0];
            const originalIndex = this.stage.buildings.indexOf(building);
            
            // 建物の上にランダムな位置で配置
            const x = building.x + Math.random() * (building.width - 20) + 10;
            const y = building.y - building.height;
            
            const citizen = new Citizen(x, y);
            citizen.type = 'roof';
            citizen.buildingIndex = originalIndex;
            this.citizens.push(citizen);
        }
    }
    
    handleRescueAction() {
        if (!this.drone || this.drone.isCrashing) return;
        
        // ロープ救助の開始/停止
        if (!this.drone.isRescuing) {
            // ハシゴを出す時のバッテリー消費（アップグレード効果を適用）
            const ropeConsumption = 3 * Math.pow(this.upgradeSystem.effectMultipliers.ropeBatteryEfficiency, this.upgradeSystem.levels.ropeBatteryEfficiency);
            this.drone.battery = Math.max(0, this.drone.battery - ropeConsumption);
            this.drone.consumptionAmount = ropeConsumption; // 表示用
            this.drone.showRopeConsumption(); // 消費表示
            this.drone.isRescuing = true;
            this.drone.ropeLength = 0;
            this.soundManager.play('rope');
        } else {
            this.drone.isRescuing = false;
            this.drone.ropeLength = 0;
        }
    }
    
    findNearestCitizen() {
        let nearest = null;
        let minDistance = Infinity;
        
        this.citizens.forEach(citizen => {
            if (!citizen.rescued) {
                const distance = this.getDistance(this.drone, citizen);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = citizen;
                }
            }
        });
        
        return nearest;
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    rescueCitizen(citizen) {
        citizen.rescued = true;
        this.drone.passengers.push(citizen);
        citizen.boardDrone(this.drone);
        this.soundManager.play('rescue');
    }
    
    isNearBase() {
        if (!this.stage || !this.drone) return false;
        const baseCenter = this.stage.baseX + this.stage.baseWidth/2;
        const distance = Math.abs(this.drone.x - baseCenter);
        return distance < 50;
    }
    
    isAboveBase() {
        if (!this.stage || !this.drone) return false;
        return this.isNearBase() && this.drone.y < this.stage.groundLevel - 10; // 高度判定を大幅に緩和
    }
    
    dropOffPassengers() {
        const droppedCount = this.drone.passengers.length;
        this.drone.passengers.forEach(citizen => {
            citizen.delivered = true;
        });
        this.drone.passengers = [];
        this.rescuedCount += droppedCount;
        this.totalRescued += droppedCount; // 総救助人数を更新
        this.score += droppedCount * 100;
        this.soundManager.play('dropOff');
    }
    
    update(deltaTime) {
        if (this.state !== 'playing' && this.state !== 'paused') return;
        
        // pausedの場合は更新を停止
        if (this.state === 'paused') return;
        
        // 時間更新
        this.time += deltaTime;
        
        // カメラ更新（ドローンを中心に）
        if (this.drone) {
            this.camera.x = this.drone.x - this.width / 2;
            this.camera.x = Math.max(0, Math.min(this.worldWidth - this.width, this.camera.x));
        }
        
        
        // ドローン更新
        if (this.drone) {
            // タッチ操作の場合はアナログスティックの値を使用
            if (this.touchActive) {
                this.drone.updateWithAnalogStick(deltaTime, this.stickPosition);
            } else {
                this.drone.update(deltaTime, this.keys);
            }
            
            // ロープ救助の処理（ゲーム終了時は処理しない）
            if (this.drone.isRescuing && this.state === 'playing') {
                // ロープを伸ばす（アップグレード効果を適用）
                const ropeSpeed = 100 * Math.pow(this.upgradeSystem.effectMultipliers.ropeSpeed, this.upgradeSystem.levels.ropeSpeed);
                if (this.drone.ropeLength < this.drone.maxRopeLength) {
                    this.drone.ropeLength += ropeSpeed * deltaTime;
                }
                
                // ロープの先端位置を計算
                const ropeEndX = this.drone.x;
                const ropeEndY = this.drone.y + this.drone.height/2 + this.drone.ropeLength;
                
                // 救助可能な市民をチェック
                if (this.drone.passengers.length < this.drone.maxCapacity) {
                    this.citizens.forEach(citizen => {
                        if (!citizen.rescued && !citizen.delivered) {
                            const distance = Math.sqrt(
                                Math.pow(citizen.x - ropeEndX, 2) + 
                                Math.pow(citizen.y - ropeEndY, 2)
                            );
                            if (distance < 30) {
                                this.rescueCitizen(citizen);
                                // 救助後、ハシゴを自動収納
                                this.drone.isRescuing = false;
                                this.drone.ropeLength = 0;
                            }
                        }
                    });
                }
                
                // ホームポイント上空で乗客がいる場合、降下処理
                if (this.isAboveBase() && this.drone.passengers.length > 0) {
                    // ハシゴが基地に届いたら降下
                    const ropeEndY = this.drone.y + this.drone.height/2 + this.drone.ropeLength;
                    if (ropeEndY >= this.stage.groundLevel - 10) {
                        this.dropOffPassengers();
                        this.drone.isRescuing = false;
                        this.drone.ropeLength = 0;
                    }
                }
            }
            
            // 充電ポートとの接触チェック（墜落中は充電不可）
            if (!this.drone.isCrashing) {
                const port = this.stage.chargingPort;
                if (!port.used) {
                    const distanceToPort = Math.sqrt(
                        Math.pow(this.drone.x - port.x, 2) + 
                        Math.pow(this.drone.y - (port.y - port.height/2), 2)
                    );
                    
                    // ドローンが充電ポートに触れている場合
                    if (distanceToPort < 40 && this.drone.isNearGround()) {
                        this.drone.battery = Math.min(100, this.drone.battery + port.chargeAmount);
                        port.used = true; // 使用済みにする
                        this.soundManager.play('charge');
                    }
                }
            }
            
            // バッテリー切れチェック
            if (this.drone.battery <= 0 && !this.drone.isCrashing) {
                this.drone.startCrash();
                this.failureReason = 'バッテリー切れで墜落しました';
                this.soundManager.play('crash');
            }
            
            // 墜落チェック
            if (this.drone.isCrashing && this.drone.y > this.stage.groundLevel) {
                this.state = 'failed';
                this.soundManager.stopBGM();
                this.gameOver();
            }
        }
        
        // 制限時間チェック
        if (this.timeLimit - this.time <= 0) {
            this.state = 'failed';
            this.failureReason = '制限時間を超過しました';
            this.soundManager.stopBGM();
            this.gameOver();
        }
        
        // 市民更新
        this.citizens.forEach(citizen => {
            citizen.update(deltaTime);
        });
        
        // UI更新
        this.updateUI();
        
        // 勝利条件チェック
        if (this.rescuedCount >= this.citizens.length) {
            this.gameOver();
        }
    }
    
    updateUI() {
        // バッテリー
        const batteryPercent = Math.max(0, this.drone.battery);
        this.batteryFill.style.width = batteryPercent + '%';
        this.batteryPercent.textContent = Math.floor(batteryPercent) + '%';
        
        // バッテリー残量に応じて色を変更
        if (batteryPercent < 20) {
            this.batteryPercent.style.color = '#ff0000';
        } else if (batteryPercent < 50) {
            this.batteryPercent.style.color = '#ffaa00';
        } else {
            this.batteryPercent.style.color = '#ffffff';
        }
        
        // バッテリー消費率表示
        if (this.drone) {
            const drainRate = this.drone.currentDrainRate || 0;
            this.batteryDrain.textContent = `-${drainRate.toFixed(1)}%/s`;
            
            // 消費率に応じて色を変更
            if (drainRate > 3.0) {
                this.batteryDrain.style.color = '#ff0000';
            } else if (drainRate > 1.5) {
                this.batteryDrain.style.color = '#ffa500';
            } else {
                this.batteryDrain.style.color = '#ffd700';
            }
        }
        
        // ステージ
        this.stageText.textContent = this.currentStage;
        
        // 収容人数
        this.capacityText.textContent = `${this.drone.passengers.length}/${this.drone.maxCapacity}`;
        
        // 救助人数
        this.rescuedText.textContent = `${this.rescuedCount}/${this.citizens.length}`;
        
        // 残り時間
        const remainingTime = Math.max(0, this.timeLimit - this.time);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        this.timeText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 残り時間が少ない場合は赤く表示
        if (remainingTime < 30) {
            document.getElementById('timeText').style.color = '#ff0000';
        } else {
            document.getElementById('timeText').style.color = '#fff';
        }
    }
    
    render() {
        // クリア
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // カメラ変換を適用
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // ステージ描画
        if (this.stage) {
            this.stage.render(this.ctx);
        }
        
        // 市民描画
        this.citizens.forEach(citizen => {
            citizen.render(this.ctx);
        });
        
        // ドローン描画
        if (this.drone) {
            this.drone.render(this.ctx);
        }
        
        this.ctx.restore();
        
        // 画面外の救助者表示（カメラ変換外）
        this.renderOffscreenIndicators();
        
        // ホームポイント上空でのサイン表示
        this.renderDropOffSign();
        
        // ゲームオーバー時のオーバーレイ
        if (this.state === 'gameover' || this.state === 'failed') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    renderOffscreenIndicators() {
        // ステージが初期化されていない場合は何もしない
        if (!this.stage) return;
        
        const leftCount = this.citizens.filter(c => 
            !c.rescued && !c.delivered && c.x < this.camera.x
        ).length;
        
        const rightCount = this.citizens.filter(c => 
            !c.rescued && !c.delivered && c.x > this.camera.x + this.width
        ).length;
        
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        
        // 左側の表示（UIと重ならないように位置調整）
        let leftY = 120; // 上部UIの下から開始
        if (leftCount > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, leftY, 60, 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('◀', 40, leftY + 30);
            this.ctx.fillText(leftCount.toString(), 40, leftY + 50);
            leftY += 70;
        }
        
        // ホームポイント（左側）
        const homeX = this.stage.baseX + this.stage.baseWidth/2;
        if (homeX < this.camera.x) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, leftY, 60, 60);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillText('◀', 40, leftY + 30);
            this.ctx.fillText('H', 40, leftY + 50);
            leftY += 70;
        }
        
        // 充電ポイント（左側）
        if (!this.stage.chargingPort.used && this.stage.chargingPort.x < this.camera.x) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, leftY, 60, 60);
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fillText('◀', 40, leftY + 30);
            this.ctx.fillText('⚡', 40, leftY + 50);
        }
        
        // 右側の表示（UIと重ならないように位置調整）
        let rightY = 120; // 上部UIの下から開始
        if (rightCount > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width - 70, rightY, 60, 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('▶', this.width - 40, rightY + 30);
            this.ctx.fillText(rightCount.toString(), this.width - 40, rightY + 50);
            rightY += 70;
        }
        
        // ホームポイント（右側）
        if (homeX > this.camera.x + this.width) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width - 70, rightY, 60, 60);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillText('▶', this.width - 40, rightY + 30);
            this.ctx.fillText('H', this.width - 40, rightY + 50);
            rightY += 70;
        }
        
        // 充電ポイント（右側）
        if (!this.stage.chargingPort.used && this.stage.chargingPort.x > this.camera.x + this.width) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width - 70, rightY, 60, 60);
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fillText('▶', this.width - 40, rightY + 30);
            this.ctx.fillText('⚡', this.width - 40, rightY + 50);
        }
    }
    
    renderDropOffSign() {
        // ステージまたはドローンが初期化されていない場合は何もしない
        if (!this.stage || !this.drone) return;
        
        // ホームポイント上空で乗客がいる場合のサイン表示
        if (this.isAboveBase() && this.drone.passengers.length > 0) {
            const screenX = this.drone.x - this.camera.x;
            const screenY = this.drone.y - this.camera.y;
            
            // 点滅エフェクト
            const pulse = Math.sin(this.time * 5) * 0.5 + 0.5;
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY + 40);
            
            // 背景
            this.ctx.fillStyle = `rgba(76, 175, 80, ${0.7 + pulse * 0.3})`;
            this.ctx.fillRect(-60, -20, 120, 40);
            
            // テキスト
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ハシゴで降下', 0, 5);
            
            // 下向き矢印
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 25);
            this.ctx.lineTo(0, 35);
            this.ctx.moveTo(-5, 30);
            this.ctx.lineTo(0, 35);
            this.ctx.lineTo(5, 30);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    gameOver() {
        if (this.state === 'failed') {
            // ミッション失敗
            document.getElementById('failedReason').textContent = this.failureReason;
            const failedScoreText = `<span style="font-size: 24px; color: #ff6b6b">ステージ ${this.currentStage}</span><br><br>` +
                                  `所持金: $${this.upgradeSystem.money}<br>` +
                                  `総救助人数: ${this.totalRescued}人`;
            document.getElementById('failedScore').innerHTML = failedScoreText;
            
            // コンティニュー金額を計算（50 * 2^回数）
            const continueCost = 50 * Math.pow(2, this.continueCount);
            const continueBtn = document.getElementById('continueButton');
            continueBtn.textContent = `コンティニュー ($${continueCost})`;
            
            // 資金不足の場合はボタンを無効化
            if (this.upgradeSystem.money >= continueCost) {
                continueBtn.disabled = false;
            } else {
                continueBtn.disabled = true;
            }
            
            this.failedScreen.classList.remove('hidden');
            
            return;
        } else {
            // ミッション成功
            this.state = 'gameover';
            const h2 = this.gameOverScreen.querySelector('h2');
            h2.textContent = 'ミッション完了！';
            h2.style.color = '#4CAF50';
            
            // 評価計算
            const batteryPercent = this.drone.battery / 100;
            const timePercent = (this.timeLimit - this.time) / this.timeLimit;
            const reward = this.upgradeSystem.calculateReward(batteryPercent, timePercent);
            
            // 評価ランク
            let rank = 'C';
            if (reward >= 80) rank = 'S';
            else if (reward >= 60) rank = 'A';
            else if (reward >= 40) rank = 'B';
            
            const finalScoreText = `<span style="font-size: 28px; color: #FFD700">ステージ ${this.currentStage} クリア！</span><br><br>` +
                                 `救助人数: ${this.rescuedCount}/${this.citizens.length}<br>` +
                                 `クリア時間: ${Math.floor(this.time / 60)}:${Math.floor(this.time % 60).toString().padStart(2, '0')}<br>` +
                                 `バッテリー残量: ${Math.floor(this.drone.battery)}%<br>` +
                                 `<br>` +
                                 `<span style="font-size: 32px; color: #FFD700">評価: ${rank}</span><br>` +
                                 `<span style="font-size: 24px; color: #4CAF50">報酬: $${reward}</span>`;
            document.getElementById('finalScore').innerHTML = finalScoreText;
            
            // 報酬を追加
            this.upgradeSystem.money += reward;
            
            // アップグレード選択は表示される前にゲームオーバー画面が非表示になる
        }
        
        // ゲームオーバー画面表示
        this.gameOverScreen.classList.remove('hidden');
        
        // 3秒後にゲームオーバー画面を非表示にしてからアップグレード選択を表示
        setTimeout(() => {
            this.gameOverScreen.classList.add('hidden');
            this.showUpgradeSelection();
        }, 3000);
    }
    
    showUpgradeSelection() {
        // アップグレード選択肢を生成
        const choices = this.upgradeSystem.generateUpgradeChoices();
        const modal = document.getElementById('upgradeModal');
        const choicesContainer = document.getElementById('upgradeChoices');
        const rewardAmount = document.getElementById('rewardAmount');
        const currentMoney = document.getElementById('currentMoney');
        
        if (!modal) return;
        
        // 現在の資金のみ表示
        currentMoney.textContent = this.upgradeSystem.money;
        
        // 選択肢をクリア
        choicesContainer.innerHTML = '';
        
        // 各アップグレード選択肢を作成
        choices.forEach((upgrade, index) => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            if (upgrade.isSpecial) {
                card.className += ' special';
            }
            
            // アップグレード名
            const nameDiv = document.createElement('div');
            nameDiv.className = 'upgrade-name';
            if (upgrade.isSpecial) {
                nameDiv.textContent = upgrade.upgrades.map(u => this.upgradeSystem.attributes[u.attribute].name).join(' + ');
            } else {
                nameDiv.textContent = this.upgradeSystem.attributes[upgrade.attribute].name;
            }
            card.appendChild(nameDiv);
            
            // アップグレード詳細
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'upgrade-details';
            if (upgrade.isSpecial) {
                const details = upgrade.upgrades.map(u => {
                    const attr = this.upgradeSystem.attributes[u.attribute];
                    const currentLevel = this.upgradeSystem.levels[u.attribute];
                    return `${attr.name}: Lv${currentLevel} → Lv${currentLevel + 1}`;
                }).join('<br>');
                detailsDiv.innerHTML = details;
            } else {
                const attr = this.upgradeSystem.attributes[upgrade.attribute];
                const currentLevel = this.upgradeSystem.levels[upgrade.attribute];
                detailsDiv.innerHTML = `Lv${currentLevel} → Lv${currentLevel + 1}<br>${attr.description}`;
            }
            card.appendChild(detailsDiv);
            
            // 価格表示
            const priceDiv = document.createElement('div');
            if (upgrade.isSpecial && upgrade.originalPrice) {
                priceDiv.innerHTML = `<span class="upgrade-price original">$${upgrade.originalPrice}</span><span class="upgrade-price">$${upgrade.price}</span>`;
            } else {
                priceDiv.innerHTML = `<span class="upgrade-price">$${upgrade.price}</span>`;
            }
            card.appendChild(priceDiv);
            
            // クリックイベント
            card.addEventListener('click', () => {
                if (this.upgradeSystem.money >= upgrade.price) {
                    this.soundManager.play('powerup');
                    this.purchaseUpgrade(upgrade);
                    modal.classList.add('hidden');
                    // 次のステージへ
                    this.nextStage();
                } else {
                    alert('資金が不足しています');
                }
            });
            
            choicesContainer.appendChild(card);
        });
        
        // 「何も買わない」選択肢を追加
        const skipCard = document.createElement('div');
        skipCard.className = 'upgrade-card';
        
        const skipName = document.createElement('div');
        skipName.className = 'upgrade-name';
        skipName.textContent = 'スキップ';
        skipCard.appendChild(skipName);
        
        const skipDetails = document.createElement('div');
        skipDetails.className = 'upgrade-details';
        skipDetails.innerHTML = '何も買わずに次のステージへ';
        skipCard.appendChild(skipDetails);
        
        const skipPrice = document.createElement('div');
        skipPrice.innerHTML = '<span class="upgrade-price">無料</span>';
        skipCard.appendChild(skipPrice);
        
        skipCard.addEventListener('click', () => {
            this.soundManager.play('click');
            modal.classList.add('hidden');
            this.nextStage();
        });
        
        choicesContainer.appendChild(skipCard);
        
        // モーダルを表示
        modal.classList.remove('hidden');
    }
    
    purchaseUpgrade(upgrade) {
        this.upgradeSystem.money -= upgrade.price;
        
        if (upgrade.isSpecial) {
            // 特別なダブルアップグレード
            upgrade.upgrades.forEach(u => {
                if (this.upgradeSystem.levels[u.attribute] < 10) {
                    this.upgradeSystem.levels[u.attribute]++;
                }
            });
        } else {
            // 通常のアップグレード
            if (this.upgradeSystem.levels[upgrade.attribute] < 10) {
                this.upgradeSystem.levels[upgrade.attribute]++;
            }
        }
    }
    
    showUpgradeProgress() {
        // ゲームを一時停止
        const previousState = this.state;
        this.state = 'paused';
        
        const modal = document.getElementById('upgradeProgressModal');
        const list = document.getElementById('upgradeList');
        
        // リストをクリア
        list.innerHTML = '';
        
        // 各アップグレードの進捗を表示
        Object.keys(this.upgradeSystem.attributes).forEach(key => {
            const attr = this.upgradeSystem.attributes[key];
            const level = this.upgradeSystem.levels[key];
            
            const item = document.createElement('div');
            item.className = 'upgrade-item';
            
            // アップグレード情報コンテナ
            const infoDiv = document.createElement('div');
            infoDiv.className = 'upgrade-item-info';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'upgrade-item-name';
            nameSpan.textContent = attr.name;
            infoDiv.appendChild(nameSpan);
            
            // グラフ表示
            const graphDiv = document.createElement('div');
            graphDiv.className = 'upgrade-item-graph';
            
            const barDiv = document.createElement('div');
            barDiv.className = 'upgrade-item-bar';
            
            const barFill = document.createElement('div');
            barFill.className = 'upgrade-item-bar-fill';
            barFill.style.width = `${level * 10}%`;
            barDiv.appendChild(barFill);
            
            const levelSpan = document.createElement('span');
            levelSpan.className = 'upgrade-item-level';
            levelSpan.textContent = `Lv ${level}/10`;
            
            graphDiv.appendChild(barDiv);
            graphDiv.appendChild(levelSpan);
            infoDiv.appendChild(graphDiv);
            
            item.appendChild(infoDiv);
            list.appendChild(item);
        });
        
        // 現在の資金も表示
        const moneyItem = document.createElement('div');
        moneyItem.className = 'upgrade-item';
        moneyItem.style.marginTop = '20px';
        moneyItem.style.borderTop = '1px solid #444';
        moneyItem.style.paddingTop = '15px';
        
        const moneyInfo = document.createElement('div');
        moneyInfo.className = 'upgrade-item-info';
        
        const moneyLabel = document.createElement('span');
        moneyLabel.className = 'upgrade-item-name';
        moneyLabel.textContent = '資金';
        moneyInfo.appendChild(moneyLabel);
        
        const moneyValue = document.createElement('span');
        moneyValue.className = 'upgrade-item-level';
        moneyValue.textContent = `$${this.upgradeSystem.money}`;
        moneyValue.style.color = '#4CAF50';
        moneyValue.style.fontSize = '18px';
        
        moneyItem.appendChild(moneyInfo);
        moneyItem.appendChild(moneyValue);
        list.appendChild(moneyItem);
        
        modal.classList.remove('hidden');
        
        // 前の状態を保存して、閉じるボタンで復元できるようにする
        modal.dataset.previousState = previousState;
    }
    
    closeUpgradeProgress() {
        const modal = document.getElementById('upgradeProgressModal');
        modal.classList.add('hidden');
        
        // 前の状態に戻す
        const previousState = modal.dataset.previousState;
        if (previousState && previousState !== 'paused') {
            this.state = previousState;
        }
    }
    
    nextStage() {
        // 次のステージへ進む
        this.currentStage++;
        this.startGame();
    }
    
    continueGame() {
        // コンティニュー処理
        const continueCost = 50 * Math.pow(2, this.continueCount);
        
        if (this.upgradeSystem.money >= continueCost) {
            this.upgradeSystem.money -= continueCost;
            this.continueCount++; // コンティニュー回数を増やす
            this.state = 'playing';
            this.failedScreen.classList.add('hidden');
            
            // ドローンを初期位置に戻す
            this.drone.x = this.stage.baseX + this.stage.baseWidth/2;
            this.drone.y = 300;
            this.drone.vx = 0;
            this.drone.vy = 0;
            this.drone.battery = 50; // バッテリー50%で復活
            this.drone.isCrashing = false;
            this.drone.crashY = 0;
            this.drone.isRescuing = false;
            this.drone.ropeLength = 0;
            
            // カメラをドローンに合わせる
            this.camera.x = this.drone.x - this.width / 2;
            this.camera.x = Math.max(0, Math.min(this.worldWidth - this.width, this.camera.x));
        }
    }
    
    returnToTitle() {
        // タイトル画面に戻る（全て初期化）
        this.state = 'menu';
        this.failedScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        
        // ゲームデータを初期化
        this.currentStage = 1;
        this.totalRescued = 0;
        this.continueCount = 0;
        
        // アップグレードシステムを初期化
        this.upgradeSystem = new UpgradeSystem();
        
        this.soundManager.stopBGM();
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // キャンバスのアスペクト比
        const canvasRatio = this.width / this.height;
        const windowRatio = windowWidth / windowHeight;
        
        let scale;
        if (windowRatio > canvasRatio) {
            // ウィンドウが横長の場合、高さに合わせる
            scale = windowHeight / this.height;
        } else {
            // ウィンドウが縦長の場合、幅に合わせる
            scale = windowWidth / this.width;
        }
        
        // キャンバスのスタイルを設定
        this.canvas.style.width = `${this.width * scale}px`;
        this.canvas.style.height = `${this.height * scale}px`;
        
        // 中央揃え
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '50%';
        this.canvas.style.top = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
    }
    
    updateControlsDisplay() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const pcControls = document.getElementById('pcControls');
        const touchControls = document.getElementById('touchControls');
        
        if (pcControls && touchControls) {
            if (isTouchDevice) {
                pcControls.style.display = 'none';
                touchControls.style.display = 'block';
            } else {
                pcControls.style.display = 'block';
                touchControls.style.display = 'none';
            }
        }
        
        // iOSでスタンドアロンモードでない場合はヒントを表示
        if (this.isIOS() && !window.navigator.standalone) {
            const hint = document.querySelector('.fullscreen-hint');
            if (hint) {
                hint.style.display = 'block';
            }
        }
    }
    
    setupMobileOptimizations() {
        // スクロールを無効化
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // ダブルタップでのズームを無効化
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // iOS Safariでアドレスバーを隠す
        if (this.isIOS()) {
            // 初回読み込み時
            window.scrollTo(0, 1);
            
            // 少し待ってから再度実行
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 100);
            
            // orientationchangeイベントでも実行
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    window.scrollTo(0, 1);
                }, 100);
            });
        }
        
        // フルスクリーンAPIが利用可能な場合
        if (document.documentElement.requestFullscreen) {
            // タッチまたはクリックでフルスクリーン化を促す
            const enterFullscreen = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log('Fullscreen request failed:', err);
                    });
                }
            };
            
            // ゲーム開始時にフルスクリーンを試みる
            document.getElementById('startButton').addEventListener('click', enterFullscreen);
        }
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
}