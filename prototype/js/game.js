class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // アップグレードシステム
        this.upgradeSystem = new UpgradeSystem();
        
        // キャンバスサイズ設定（スマホ縦画面対応）
        this.width = 360;
        this.height = 640;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // スクロール関連
        this.camera = {
            x: 0,
            y: 0
        };
        this.worldWidth = 1600; // ワールドの横幅
        
        // ゲーム状態
        this.state = 'menu'; // menu, playing, gameover, failed
        this.score = 0;
        this.rescuedCount = 0;
        this.time = 0;
        this.timeLimit = 180; // 3分の制限時間
        this.lastTime = 0;
        this.failureReason = '';
        
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
        this.batteryBar = document.getElementById('batteryBar');
        this.batteryText = document.getElementById('batteryText');
        this.drainRateText = document.getElementById('drainRateText');
        this.capacityText = document.getElementById('capacityText');
        this.rescuedText = document.getElementById('rescuedText');
        this.timeText = document.getElementById('timeText');
        
        // ボタンイベント
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        
        // アップグレード画面のイベント
        const upgradeIcon = document.getElementById('upgradeIcon');
        const closeProgressBtn = document.getElementById('closeProgressBtn');
        
        if (upgradeIcon) {
            upgradeIcon.addEventListener('click', () => this.showUpgradeProgress());
        }
        
        if (closeProgressBtn) {
            closeProgressBtn.addEventListener('click', () => this.closeUpgradeProgress());
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
        
        // タッチ入力（将来の実装用）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // タッチ操作の実装
        });
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.rescuedCount = 0;
        this.time = 0;
        
        // UI更新
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // ゲームオブジェクト初期化
        this.initializeGame();
    }
    
    initializeGame() {
        // ドローン初期化 (基地の近くに配置)
        this.drone = new Drone(150, 300);
        
        // アップグレードを適用
        this.upgradeSystem.applyUpgrades(this.drone, this);
        
        // ステージ初期化（ワールドサイズを渡す）
        this.stage = new Stage(this.worldWidth, this.height);
        
        // 充電ポートの充電量を固定値に設定（ステージ1は25%）
        this.stage.chargingPort.chargeAmount = 25;
        this.stage.chargingPort.used = false;
        
        // 市民配置
        this.citizens = [];
        const citizenPositions = [
            { x: 300, y: this.stage.groundLevel, type: 'ground' },
            { x: 700, y: this.stage.groundLevel, type: 'ground' },
            { x: 1100, y: this.stage.groundLevel, type: 'ground' },
            { x: 400, y: this.stage.buildings[0].y - this.stage.buildings[0].height, type: 'roof', buildingIndex: 0 },
            { x: 610, y: this.stage.buildings[1].y - this.stage.buildings[1].height, type: 'roof', buildingIndex: 1 },
            { x: 840, y: this.stage.buildings[2].y - this.stage.buildings[2].height, type: 'roof', buildingIndex: 2 },
            { x: 1050, y: this.stage.buildings[3].y - this.stage.buildings[3].height, type: 'roof', buildingIndex: 3 },
            { x: 1275, y: this.stage.buildings[4].y - this.stage.buildings[4].height, type: 'roof', buildingIndex: 4 }
        ];
        
        citizenPositions.forEach(pos => {
            const citizen = new Citizen(pos.x, pos.y);
            citizen.type = pos.type;
            citizen.buildingIndex = pos.buildingIndex;
            this.citizens.push(citizen);
        });
    }
    
    handleRescueAction() {
        if (!this.drone || this.drone.isCrashing) return;
        
        // ロープ救助の開始/停止
        if (!this.drone.isRescuing) {
            // 縄梯子を出す時のバッテリー消費（アップグレード効果を適用）
            const ropeConsumption = 3 * Math.pow(this.upgradeSystem.effectMultipliers.ropeBatteryEfficiency, this.upgradeSystem.levels.ropeBatteryEfficiency);
            this.drone.battery = Math.max(0, this.drone.battery - ropeConsumption);
            this.drone.consumptionAmount = ropeConsumption; // 表示用
            this.drone.showRopeConsumption(); // 消費表示
            this.drone.isRescuing = true;
            this.drone.ropeLength = 0;
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
    }
    
    isNearBase() {
        if (!this.stage || !this.drone) return false;
        const baseCenter = this.stage.baseX + this.stage.baseWidth/2;
        const distance = Math.abs(this.drone.x - baseCenter);
        return distance < 50;
    }
    
    isAboveBase() {
        if (!this.stage || !this.drone) return false;
        return this.isNearBase() && this.drone.y < this.stage.groundLevel - 50;
    }
    
    dropOffPassengers() {
        const droppedCount = this.drone.passengers.length;
        this.drone.passengers.forEach(citizen => {
            citizen.delivered = true;
        });
        this.drone.passengers = [];
        this.rescuedCount += droppedCount;
        this.score += droppedCount * 100;
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // 時間更新
        this.time += deltaTime;
        
        // カメラ更新（ドローンを中心に）
        if (this.drone) {
            this.camera.x = this.drone.x - this.width / 2;
            this.camera.x = Math.max(0, Math.min(this.worldWidth - this.width, this.camera.x));
        }
        
        
        // ドローン更新
        if (this.drone) {
            this.drone.update(deltaTime, this.keys);
            
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
                                // 救助後、縄梯子を自動収納
                                this.drone.isRescuing = false;
                                this.drone.ropeLength = 0;
                            }
                        }
                    });
                }
                
                // ホームポイント上空で乗客がいる場合、降下処理
                if (this.isAboveBase() && this.drone.passengers.length > 0) {
                    // 縄梯子が基地に届いたら降下
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
                    }
                }
            }
            
            // バッテリー切れチェック
            if (this.drone.battery <= 0 && !this.drone.isCrashing) {
                this.drone.startCrash();
                this.failureReason = 'バッテリー切れで墜落しました';
            }
            
            // 墜落チェック
            if (this.drone.isCrashing && this.drone.y > this.stage.groundLevel) {
                this.state = 'failed';
            }
        }
        
        // 制限時間チェック
        if (this.timeLimit - this.time <= 0) {
            this.state = 'failed';
            this.failureReason = '制限時間を超過しました';
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
        this.batteryBar.style.width = batteryPercent + '%';
        this.batteryText.textContent = Math.floor(batteryPercent) + '%';
        
        // バッテリー消費率表示
        if (this.drone) {
            const drainRate = this.drone.currentDrainRate || 0;
            this.drainRateText.textContent = `(-${drainRate.toFixed(1)}%/s)`;
            
            // 消費率に応じて色を変更
            if (drainRate > 2.0) {
                this.drainRateText.style.color = '#ff0000';
            } else if (drainRate > 1.0) {
                this.drainRateText.style.color = '#ffa500';
            } else {
                this.drainRateText.style.color = '#ffd700';
            }
        }
        
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
        
        // 左側の表示
        let leftY = this.height/2 - 30;
        if (leftCount > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, leftY, 60, 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('◀', 40, leftY + 30);
            this.ctx.fillText(leftCount.toString(), 40, leftY + 50);
            leftY -= 70;
        }
        
        // ホームポイント（左側）
        const homeX = this.stage.baseX + this.stage.baseWidth/2;
        if (homeX < this.camera.x) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, leftY, 60, 60);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillText('◀', 40, leftY + 30);
            this.ctx.fillText('H', 40, leftY + 50);
            leftY -= 70;
        }
        
        // 充電ポイント（左側）
        if (!this.stage.chargingPort.used && this.stage.chargingPort.x < this.camera.x) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, leftY, 60, 60);
            this.ctx.fillStyle = '#2196F3';
            this.ctx.fillText('◀', 40, leftY + 30);
            this.ctx.fillText('⚡', 40, leftY + 50);
        }
        
        // 右側の表示
        let rightY = this.height/2 - 30;
        if (rightCount > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width - 70, rightY, 60, 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('▶', this.width - 40, rightY + 30);
            this.ctx.fillText(rightCount.toString(), this.width - 40, rightY + 50);
            rightY -= 70;
        }
        
        // ホームポイント（右側）
        if (homeX > this.camera.x + this.width) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.width - 70, rightY, 60, 60);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillText('▶', this.width - 40, rightY + 30);
            this.ctx.fillText('H', this.width - 40, rightY + 50);
            rightY -= 70;
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
            this.ctx.fillText('スペースで降下', 0, 5);
            
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
            const h2 = this.gameOverScreen.querySelector('h2');
            h2.textContent = 'ミッション失敗';
            h2.style.color = '#ff0000';
            
            const finalScoreText = `<span style="color: #ff0000">${this.failureReason}</span><br><br>` +
                                 `救助人数: ${this.rescuedCount}/${this.citizens.length}<br>` +
                                 `スコア: ${this.score}`;
            document.getElementById('finalScore').innerHTML = finalScoreText;
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
            
            const finalScoreText = `救助人数: ${this.rescuedCount}/${this.citizens.length}<br>` +
                                 `クリア時間: ${Math.floor(this.time / 60)}:${Math.floor(this.time % 60).toString().padStart(2, '0')}<br>` +
                                 `バッテリー残量: ${Math.floor(this.drone.battery)}%<br>` +
                                 `<br>` +
                                 `<span style="font-size: 32px; color: #FFD700">評価: ${rank}</span><br>` +
                                 `<span style="font-size: 24px; color: #4CAF50">報酬: $${reward}</span>`;
            document.getElementById('finalScore').innerHTML = finalScoreText;
            
            // 報酬を追加
            this.upgradeSystem.money += reward;
            
            // 3秒後にアップグレード選択を表示
            setTimeout(() => {
                this.showUpgradeSelection();
            }, 3000);
        }
        
        // ゲームオーバー画面表示
        this.gameOverScreen.classList.remove('hidden');
    }
    
    showUpgradeSelection() {
        // アップグレード選択肢を生成
        const choices = this.upgradeSystem.generateUpgradeChoices();
        const modal = document.getElementById('upgradeModal');
        const choicesContainer = document.getElementById('upgradeChoices');
        const rewardAmount = document.getElementById('rewardAmount');
        const currentMoney = document.getElementById('currentMoney');
        
        if (!modal) return;
        
        // 報酬と現在の資金を表示
        const batteryPercent = this.drone.battery / 100;
        const timePercent = (this.timeLimit - this.time) / this.timeLimit;
        const reward = this.upgradeSystem.calculateReward(batteryPercent, timePercent);
        rewardAmount.textContent = reward;
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
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'upgrade-item-name';
            nameSpan.textContent = attr.name;
            
            const levelSpan = document.createElement('span');
            levelSpan.className = 'upgrade-item-level';
            levelSpan.textContent = `Lv ${level}/10`;
            
            item.appendChild(nameSpan);
            item.appendChild(levelSpan);
            list.appendChild(item);
        });
        
        // 現在の資金も表示
        const moneyItem = document.createElement('div');
        moneyItem.className = 'upgrade-item';
        moneyItem.style.marginTop = '20px';
        moneyItem.style.borderTop = '1px solid #444';
        moneyItem.style.paddingTop = '15px';
        
        const moneyLabel = document.createElement('span');
        moneyLabel.className = 'upgrade-item-name';
        moneyLabel.textContent = '資金';
        
        const moneyValue = document.createElement('span');
        moneyValue.className = 'upgrade-item-level';
        moneyValue.textContent = `$${this.upgradeSystem.money}`;
        moneyValue.style.color = '#4CAF50';
        
        moneyItem.appendChild(moneyLabel);
        moneyItem.appendChild(moneyValue);
        list.appendChild(moneyItem);
        
        modal.classList.remove('hidden');
        
        // ゲームは続行（ポーズしない）
    }
    
    closeUpgradeProgress() {
        document.getElementById('upgradeProgressModal').classList.add('hidden');
    }
    
    nextStage() {
        // 次のステージを開始（現在は同じステージを再開）
        this.startGame();
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
}