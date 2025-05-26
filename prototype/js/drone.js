class Drone {
    constructor(x, y) {
        // 位置と速度
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // ドローンの仕様
        this.width = 40;
        this.height = 20;
        this.maxSpeed = 350;
        this.acceleration = 500;
        this.friction = 0.92;
        
        // リソース
        this.battery = 100;
        this.batteryDrainBase = 0.2; // ホバリング時の基本消費率/秒
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
        this.maxRopeLength = 75;
        this.isCrashing = false;
        this.crashY = 0;
        
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
        const passengerPenalty = 1 + (this.passengers.length * 0.15); // 1人につき15%増加
        const batteryDrain = (this.batteryDrainBase + (speedRatio * 2)) * passengerPenalty;
        
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
        this.x = Math.max(this.width / 2, Math.min(1600 - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(540, this.y));
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
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ドローンの影（墜落中は大きくなる）
        const shadowScale = this.isCrashing ? 2 : 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.ellipse(0, 5 + (this.isCrashing ? 20 : 0), this.width/2 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
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
        const bodyColor = this.passengers.length >= this.maxCapacity ? '#CC0000' : '#1a1a1a';
        
        // メインボディ（横から見た形）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/3);
        ctx.lineTo(this.width/2, -this.height/3);
        ctx.lineTo(this.width/2 - 5, this.height/2);
        ctx.lineTo(-this.width/2 + 5, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // コックピット（前方）
        ctx.fillStyle = '#00BCD4';
        ctx.beginPath();
        if (this.facing === 1) {
            ctx.moveTo(this.width/2, -this.height/3);
            ctx.lineTo(this.width/2 + 8, 0);
            ctx.lineTo(this.width/2, this.height/3);
            ctx.lineTo(this.width/2 - 5, this.height/3);
            ctx.lineTo(this.width/2 - 5, -this.height/3);
        } else {
            ctx.moveTo(-this.width/2, -this.height/3);
            ctx.lineTo(-this.width/2 - 8, 0);
            ctx.lineTo(-this.width/2, this.height/3);
            ctx.lineTo(-this.width/2 + 5, this.height/3);
            ctx.lineTo(-this.width/2 + 5, -this.height/3);
        }
        ctx.closePath();
        ctx.fill();
        
        // ランディングギア
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.width/3, this.height/2);
        ctx.lineTo(-this.width/3, this.height/2 + 5);
        ctx.moveTo(this.width/3, this.height/2);
        ctx.lineTo(this.width/3, this.height/2 + 5);
        ctx.stroke();
        
        // テールローター（横から見た時の特徴）
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.facing * this.width/2, 0);
        ctx.lineTo(-this.facing * this.width/2 - 10, 0);
        ctx.stroke();
        
        // テールローターブレード
        ctx.save();
        ctx.translate(-this.facing * (this.width/2 + 10), 0);
        ctx.rotate(this.propellerAngle * 2);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
        
        // メインローター（上部）
        this.renderMainRotor(ctx);
        
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
    
    renderMainRotor(ctx) {
        // メインローター（上部）
        ctx.save();
        ctx.translate(0, -this.height/2 - 8);
        
        // ローターマスト
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 8);
        ctx.stroke();
        
        // ローターブレード
        ctx.rotate(this.propellerAngle);
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
        ctx.lineWidth = 3;
        
        // ブレード1
        ctx.beginPath();
        ctx.moveTo(-this.width, 0);
        ctx.lineTo(this.width, 0);
        ctx.stroke();
        
        // ブレード2（90度回転）
        ctx.beginPath();
        ctx.moveTo(0, -this.width);
        ctx.lineTo(0, this.width);
        ctx.stroke();
        
        // センターハブ
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}