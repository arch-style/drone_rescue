class Drone {
    constructor(x, y) {
        // 位置と速度
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // ドローンの仕様
        this.width = 60; // 1.5倍に拡大
        this.height = 30; // 1.5倍に拡大
        this.maxSpeed = 700; // 350 * 2 = 700
        this.acceleration = 1000; // 500 * 2 = 1000
        this.friction = 0.92;
        
        // リソース
        this.battery = 100;
        this.batteryDrainBase = 0.4; // ホバリング時の基本消費率/秒（倍増）
        this.currentDrainRate = 0; // 現在の消費率（表示用）
        this.maxCapacity = 5;
        this.passengers = [];
        
        // プロペラアニメーション
        this.propellerAngle = 0;
        this.propellerSpeed = 20;
        
        // 状態
        this.facing = 1; // 1: 右向き, -1: 左向き
        this.isRescuing = false;
        this.ropeLength = 0;
        this.maxRopeLength = 20; // 初期長さは20px
        this.isCrashing = false;
        this.crashY = 0;
        
        // ワールドサイズ（後から設定される）
        this.worldWidth = 1600;
        
        // バッテリー消費表示
        this.showBatteryConsumption = false;
        this.batteryConsumptionTimer = 0;
        this.consumptionAmount = 3; // デフォルト値
    }
    
    update(deltaTime, keys) {
        if (this.isCrashing) {
            // 墜落アニメーション
            this.crashY += 300 * deltaTime;
            this.y += this.crashY * deltaTime;
            this.propellerSpeed = Math.max(0, this.propellerSpeed - 30 * deltaTime);
            this.propellerAngle += this.propellerSpeed * deltaTime;
            return;
        }
        
        // 入力処理
        this.handleInput(keys, deltaTime);
        
        // 物理更新
        this.updatePhysics(deltaTime);
        
        // バッテリー消費計算
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const speedRatio = speed / this.maxSpeed;
        
        // 速度による消費（速度が高いほど大きく消費）
        const speedConsumption = this.batteryDrainBase + (speedRatio * speedRatio * 6); // 二乗で加速度的に増加（倍増）
        
        // 上昇・下降による消費
        let verticalConsumption = 1.0;
        if (this.vy < 0) {
            // 上昇時は大きく消費（現在の4倍）
            verticalConsumption = 1.0 + Math.abs(this.vy) / this.maxSpeed * 4.0;
        } else if (this.vy > 0) {
            // 下降時は消費を減らす（現在の0.5倍）
            verticalConsumption = 1.0 - Math.min(this.vy / this.maxSpeed * 0.5, 0.5);
        }
        
        // 乗客数による消費（より大きく増加）
        const passengerPenalty = 1 + (this.passengers.length * 0.6); // 1人につき60%増加（倍増）
        
        const batteryDrain = speedConsumption * verticalConsumption * passengerPenalty;
        
        // 現在の消費率を保存（表示用）
        this.currentDrainRate = batteryDrain;
        
        this.battery -= batteryDrain * deltaTime;
        this.battery = Math.max(0, this.battery);
        
        // プロペラアニメーション
        this.propellerAngle += this.propellerSpeed * deltaTime;
        
        // バッテリー消費表示タイマー更新
        if (this.showBatteryConsumption) {
            this.batteryConsumptionTimer -= deltaTime;
            if (this.batteryConsumptionTimer <= 0) {
                this.showBatteryConsumption = false;
            }
        }
    }
    
    handleInput(keys, deltaTime) {
        // 上下移動
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.vy -= this.acceleration * deltaTime;
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.vy += this.acceleration * deltaTime;
        }
        
        // 左右移動
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.vx -= this.acceleration * deltaTime;
            this.facing = -1;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.vx += this.acceleration * deltaTime;
            this.facing = 1;
        }
    }
    
    updatePhysics(deltaTime) {
        // 摩擦を適用
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // 速度制限
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // 位置更新
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // ワールド境界チェック
        this.x = Math.max(this.width / 2, Math.min(this.worldWidth - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(540, this.y));
    }
    
    updateWithAnalogStick(deltaTime, stickPosition) {
        if (this.isCrashing) {
            // 墜落アニメーション
            this.crashY += 300 * deltaTime;
            this.y += this.crashY * deltaTime;
            this.propellerSpeed = Math.max(0, this.propellerSpeed - 30 * deltaTime);
            this.propellerAngle += this.propellerSpeed * deltaTime;
            return;
        }
        
        // アナログスティックの入力を加速度に変換
        this.vx += stickPosition.x * this.acceleration * deltaTime;
        this.vy += stickPosition.y * this.acceleration * deltaTime;
        
        // 向きの更新
        if (stickPosition.x < -0.1) {
            this.facing = -1;
        } else if (stickPosition.x > 0.1) {
            this.facing = 1;
        }
        
        // 物理更新
        this.updatePhysics(deltaTime);
        
        // バッテリー消費計算（update関数と同じロジック）
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const speedRatio = speed / this.maxSpeed;
        
        const speedConsumption = this.batteryDrainBase + (speedRatio * speedRatio * 6);
        
        let verticalConsumption = 1.0;
        if (this.vy < 0) {
            verticalConsumption = 1.0 + Math.abs(this.vy) / this.maxSpeed * 4.0;
        } else if (this.vy > 0) {
            verticalConsumption = 1.0 - Math.min(this.vy / this.maxSpeed * 0.5, 0.5);
        }
        
        const passengerPenalty = 1 + (this.passengers.length * 0.6);
        
        const batteryDrain = speedConsumption * verticalConsumption * passengerPenalty;
        
        this.currentDrainRate = batteryDrain;
        
        this.battery -= batteryDrain * deltaTime;
        this.battery = Math.max(0, this.battery);
        
        // プロペラアニメーション
        this.propellerAngle += this.propellerSpeed * deltaTime;
        
        // バッテリー消費表示タイマー更新
        if (this.showBatteryConsumption) {
            this.batteryConsumptionTimer -= deltaTime;
            if (this.batteryConsumptionTimer <= 0) {
                this.showBatteryConsumption = false;
            }
        }
    }
    
    isNearGround() {
        return this.y > 500; // 地面に近い
    }
    
    startCrash() {
        this.isCrashing = true;
        this.isRescuing = false;
        this.ropeLength = 0;
    }
    
    showRopeConsumption() {
        this.showBatteryConsumption = true;
        this.batteryConsumptionTimer = 2.0; // 2秒間表示
    }
    
    render(ctx, groundLevel = null) {
        // 地面に影を描画（地面レベルが指定されている場合）
        if (groundLevel !== null) {
            ctx.save();
            const shadowScale = this.isCrashing ? 2 : 1;
            const shadowOpacity = Math.max(0.1, 0.3 - (this.y - groundLevel) / 1000); // 高度に応じて薄くなる
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
            ctx.beginPath();
            ctx.ellipse(this.x, groundLevel - 10, this.width/2 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 墜落中の回転
        if (this.isCrashing) {
            ctx.rotate(this.crashY * 0.01);
        }
        
        // 縄梯子（救助中かつゲームプレイ中の場合のみ）
        if (this.isRescuing && this.ropeLength > 0 && this.battery > 0) {
            // 縄梯子の横紐
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-5, this.height/2);
            ctx.lineTo(-5, this.height/2 + this.ropeLength);
            ctx.moveTo(5, this.height/2);
            ctx.lineTo(5, this.height/2 + this.ropeLength);
            ctx.stroke();
            
            // 縄梯子の横棒
            const rungs = Math.floor(this.ropeLength / 15);
            for (let i = 1; i <= rungs; i++) {
                const y = this.height/2 + i * 15;
                ctx.beginPath();
                ctx.moveTo(-5, y);
                ctx.lineTo(5, y);
                ctx.stroke();
            }
        }
        
        // 収容人数がMAXの場合、ドローンを赤く表示
        const bodyColor = this.passengers.length >= this.maxCapacity ? '#CC0000' : '#FFFFFF';
        
        // 画像を参考にしたドローン描画（上から見た視点）
        // メインボディ（中央部）- 円形
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // メインボディの円形エッジ
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // アーム（4本）- X字型配置の白いアーム
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        
        const armLength = this.width/2 - 15;
        const armWidth = 6;
        
        // X字型にアームを配置（45度角度）
        const armAngles = [-Math.PI/4, Math.PI/4, 3*Math.PI/4, -3*Math.PI/4]; // 前右、前左、後左、後右
        
        armAngles.forEach((angle, index) => {
            ctx.save();
            ctx.rotate(angle);
            
            // アーム本体
            ctx.fillRect(12, -armWidth/2, armLength, armWidth);
            ctx.strokeRect(12, -armWidth/2, armLength, armWidth);
            
            ctx.restore();
        });
        
        // 赤いストライプ（装飾）- X字型アームに対応
        if (this.passengers.length < this.maxCapacity) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            
            // 前右アームの赤いライン
            ctx.save();
            ctx.rotate(-Math.PI/4);
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(25, 0);
            ctx.stroke();
            ctx.restore();
            
            // 前左アームの赤いライン
            ctx.save();
            ctx.rotate(Math.PI/4);
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(25, 0);
            ctx.stroke();
            ctx.restore();
        }
        
        // カメラジンバル（下部）- 小さな黒い四角
        ctx.fillStyle = '#1C1C1C';
        ctx.fillRect(-3, 8, 6, 4);
        
        // プロペラ（4つ）
        this.renderQuadcopterProps(ctx);
        
        // 乗客表示
        if (this.passengers.length > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`👥 ${this.passengers.length}`, 0, -this.height/2 - 15);
            
            // MAX表示
            if (this.passengers.length >= this.maxCapacity) {
                ctx.fillStyle = '#FF0000';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('MAX', 0, -this.height/2 - 25);
            }
        }
        
        // バッテリー消費表示（縄梯子使用時）
        if (this.showBatteryConsumption) {
            const alpha = Math.min(1, this.batteryConsumptionTimer);
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`-${this.consumptionAmount.toFixed(1)}%`, 0, -40);
        }
        
        ctx.restore();
    }
    
    renderQuadcopterProps(ctx) {
        // 4つのプロペラをX字型アーム配置に合わせて描画
        const armLength = this.width/2 - 15;
        const propDistance = armLength + 12;
        const propAngles = [-Math.PI/4, Math.PI/4, 3*Math.PI/4, -3*Math.PI/4]; // X字型配置
        
        // バッテリー消費速度に応じてプロペラ回転速度を調整
        const drainRate = this.currentDrainRate || this.batteryDrainBase;
        const speedMultiplier = 1 + (drainRate / 2); // 消費速度に比例
        
        propAngles.forEach((angle, index) => {
            ctx.save();
            
            // プロペラの位置を計算（X字型）
            const x = Math.cos(angle) * propDistance;
            const y = Math.sin(angle) * propDistance;
            ctx.translate(x, y);
            
            // 各プロペラの回転角度（バッテリー消費に比例した速度）
            const rotation = this.propellerAngle * speedMultiplier * (index % 2 === 0 ? 1 : -1); // 対角線で反対方向
            ctx.rotate(rotation);
            
            // プロペラブレード（白色、透明度で回転効果）
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            
            // 2枚ブレード
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            
            // モーターハブ（白色）
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        });
    }
}