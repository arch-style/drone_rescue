// パワーアップシステム
class UpgradeSystem {
    constructor() {
        // お金
        this.money = 0;
        
        // アップグレードレベル（0-9、最大10段階）
        this.levels = {
            maxSpeed: 0,        // ドローンの最大速度
            acceleration: 0,    // ドローンの加速度
            batteryEfficiency: 0, // バッテリー効率
            maxCapacity: 0,     // 最大収容人数
            ropeSpeed: 0,       // 梯子を降ろす速度
            ropeLength: 0,      // 梯子の長さ
            ropeBatteryEfficiency: 0 // 梯子のバッテリー効率
        };
        
        // 基本価格
        this.basePrices = {
            maxSpeed: 20,
            acceleration: 15,
            batteryEfficiency: 25,
            maxCapacity: 30,
            ropeSpeed: 15,
            ropeLength: 20,
            ropeBatteryEfficiency: 20
        };
        
        // 効果の説明
        this.descriptions = {
            maxSpeed: "最高速度",
            acceleration: "加速性能",
            batteryEfficiency: "バッテリー効率",
            maxCapacity: "収容人数",
            ropeSpeed: "ハシゴ展開速度",
            ropeLength: "ハシゴの長さ",
            ropeBatteryEfficiency: "ハシゴバッテリー効率"
        };
        
        // アップグレード属性（game.jsが期待する形式）
        this.attributes = {
            maxSpeed: { name: "最高速度", description: "ドローンの最高速度が20%上昇" },
            acceleration: { name: "加速性能", description: "ドローンの加速度が20%上昇" },
            batteryEfficiency: { name: "バッテリー効率", description: "バッテリー消費が10%減少" },
            maxCapacity: { name: "収容人数", description: "最大収容人数が1人増加" },
            ropeSpeed: { name: "ハシゴ展開速度", description: "ハシゴを降ろす速度が30%上昇" },
            ropeLength: { name: "ハシゴの長さ", description: "ハシゴの最大長が20%伸びる" },
            ropeBatteryEfficiency: { name: "ハシゴバッテリー効率", description: "ハシゴ使用時のバッテリー消費が15%減少" }
        };
        
        // 効果の倍率（全て2倍に強化）
        this.effectMultipliers = {
            maxSpeed: 1.2,        // 20%ずつ上昇
            acceleration: 1.2,    // 20%ずつ上昇
            batteryEfficiency: 0.9, // 10%ずつ消費減少（半分に調整）
            maxCapacity: 1,       // 1人ずつ増加（特別処理）
            ropeSpeed: 1.3,       // 30%ずつ上昇
            ropeLength: 1.2,      // 20%ずつ上昇
            ropeBatteryEfficiency: 0.85 // 15%ずつ消費減少（半分に調整）
        };
    }
    
    // 現在の価格を取得
    getPrice(upgradeType, level = null) {
        if (level === null) {
            level = this.levels[upgradeType];
        }
        
        // レベルが上がるごとに価格が1.5倍になる
        const basePrice = this.basePrices[upgradeType];
        return Math.floor(basePrice * Math.pow(1.5, level));
    }
    
    // ランダムな価格変動を適用
    getRandomizedPrice(upgradeType, level = null) {
        const basePrice = this.getPrice(upgradeType, level);
        const variation = 0.1; // ±10%
        const multiplier = 1 + (Math.random() * 2 - 1) * variation;
        return Math.floor(basePrice * multiplier);
    }
    
    // アップグレード可能かチェック
    canUpgrade(upgradeType) {
        return this.levels[upgradeType] < 9; // 最大レベル9（10段階）
    }
    
    // アップグレードを購入
    purchaseUpgrade(upgradeType, price) {
        if (this.money >= price && this.canUpgrade(upgradeType)) {
            this.money -= price;
            this.levels[upgradeType]++;
            return true;
        }
        return false;
    }
    
    // 効果を適用
    applyUpgrades(drone, game) {
        // 最大速度
        drone.maxSpeed = 700 * Math.pow(this.effectMultipliers.maxSpeed, this.levels.maxSpeed); // 基準値を2倍に
        
        // 加速度
        drone.acceleration = 1000 * Math.pow(this.effectMultipliers.acceleration, this.levels.acceleration); // 基準値を2倍に
        
        // バッテリー効率
        drone.batteryDrainBase = 0.4 * Math.pow(this.effectMultipliers.batteryEfficiency, this.levels.batteryEfficiency);
        
        // 最大収容人数（特別処理）
        drone.maxCapacity = 5 + this.levels.maxCapacity; // 1人ずつ増加
        
        // ハシゴを降ろす速度
        const ropeSpeedMultiplier = Math.pow(this.effectMultipliers.ropeSpeed, this.levels.ropeSpeed);
        // game.jsでropeSpeedを使用するように修正が必要
        
        // ハシゴの長さ
        drone.maxRopeLength = 20 * Math.pow(this.effectMultipliers.ropeLength, this.levels.ropeLength); // 初期倴20
        
        // ハシゴのバッテリー効率は別途処理
    }
    
    // ランダムなアップグレード選択肢を生成
    generateUpgradeChoices() {
        const choices = [];
        const availableUpgrades = Object.keys(this.levels).filter(key => this.canUpgrade(key));
        
        if (availableUpgrades.length === 0) return choices;
        
        // 通常の選択肢を2つ
        for (let i = 0; i < 2 && availableUpgrades.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            const upgradeType = availableUpgrades.splice(randomIndex, 1)[0];
            
            choices.push({
                type: 'single',
                attribute: upgradeType,
                upgrades: [{ attribute: upgradeType }],
                price: this.getRandomizedPrice(upgradeType),
                description: this.descriptions[upgradeType]
            });
        }
        
        // お得な2つ同時アップグレード（30%の確率）
        if (Math.random() < 0.3 && availableUpgrades.length >= 2) {
            const upgrade1 = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
            let upgrade2;
            do {
                upgrade2 = Object.keys(this.levels)[Math.floor(Math.random() * Object.keys(this.levels).length)];
            } while (upgrade2 === upgrade1 || !this.canUpgrade(upgrade2));
            
            const totalPrice = this.getPrice(upgrade1) + this.getPrice(upgrade2);
            const discountedPrice = Math.floor(totalPrice * 0.7); // 30%割引
            
            choices.push({
                type: 'double',
                upgrades: [{ attribute: upgrade1 }, { attribute: upgrade2 }],
                price: discountedPrice,
                originalPrice: totalPrice,
                description: `${this.descriptions[upgrade1]} & ${this.descriptions[upgrade2]}`,
                isSpecial: true
            });
        } else if (availableUpgrades.length > 0) {
            // 3つ目の通常選択肢
            const upgradeType = availableUpgrades[0];
            choices.push({
                type: 'single',
                attribute: upgradeType,
                upgrades: [{ attribute: upgradeType }],
                price: this.getRandomizedPrice(upgradeType),
                description: this.descriptions[upgradeType]
            });
        }
        
        return choices;
    }
    
    // 評価に基づいた報酬金額を計算
    calculateReward(batteryPercent, timePercent) {
        // バッテリー残量と残り時間の平均を取る
        const score = (batteryPercent + timePercent) / 2;
        
        // 0〜61ドルの範囲で報酬を計算（47 * 1.3 = 61.1）
        const reward = Math.floor(score * 61);
        
        return Math.max(0, Math.min(61, reward));
    }
    
    // セーブデータ
    save() {
        return {
            money: this.money,
            levels: {...this.levels}
        };
    }
    
    // ロード
    load(data) {
        if (data) {
            this.money = data.money || 0;
            if (data.levels) {
                Object.assign(this.levels, data.levels);
            }
        }
    }
}