class Stage {
    constructor(width, height, stageNumber = 1) {
        this.width = width;
        this.height = height;
        this.stageNumber = stageNumber;
        
        // 地形データ
        this.groundLevel = height - 100;
        
        // 基地の位置（中央付近に配置）
        this.baseX = width / 2 - 50;
        this.baseY = this.groundLevel;
        this.baseWidth = 100;
        this.baseHeight = 80;
        
        // 建物データを動的に生成
        this.buildings = this.generateBuildings();
        
        // 雲のデータを動的に生成
        this.clouds = this.generateClouds();
        
        // 充電ポート（ランダムな位置に配置）
        const portSide = Math.random() < 0.5 ? 'left' : 'right';
        const portRange = width * 0.3; // ホームポイントから30%の範囲
        
        if (portSide === 'left') {
            this.chargingPort = {
                x: Math.random() * (this.baseX - portRange - 100) + 100,
                y: this.groundLevel,
                width: 60,
                height: 40,
                used: false,
                chargeAmount: 25
            };
        } else {
            this.chargingPort = {
                x: Math.random() * (width - this.baseX - this.baseWidth - portRange - 100) + this.baseX + this.baseWidth + portRange,
                y: this.groundLevel,
                width: 60,
                height: 40,
                used: false,
                chargeAmount: 25
            };
        }
        
        // 背景のグラデーション用
        this.skyGradient = null;
    }
    
    generateBuildings() {
        const buildings = [];
        const buildingCount = 8 + this.stageNumber * 2; // ステージごとに建物増加
        
        // ホームポイントの左右に建物を配置
        for (let i = 0; i < buildingCount; i++) {
            let x, attempts = 0;
            let validPosition = false;
            
            while (!validPosition && attempts < 50) {
                x = Math.random() * (this.width - 150) + 50;
                
                // ホームポイントとの距離をチェック
                if (Math.abs(x - this.baseX) > 200) {
                    validPosition = true;
                    
                    // 他の建物との重なりをチェック
                    for (const building of buildings) {
                        if (Math.abs(x - building.x) < 150) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                attempts++;
            }
            
            if (validPosition) {
                buildings.push({
                    x: x,
                    y: this.groundLevel,
                    width: 80 + Math.random() * 70,
                    height: 120 + Math.random() * 100
                });
            }
        }
        
        return buildings;
    }
    
    generateClouds() {
        const clouds = [];
        const cloudCount = 3 + Math.floor(this.stageNumber / 2);
        
        for (let i = 0; i < cloudCount; i++) {
            clouds.push({
                x: Math.random() * this.width,
                y: 50 + Math.random() * 150,
                width: 60 + Math.random() * 60,
                height: 30 + Math.random() * 30,
                speed: 10 + Math.random() * 20
            });
        }
        
        return clouds;
    }
    
    update(deltaTime) {
        // 雲の移動
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed * deltaTime;
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
    }
    
    render(ctx) {
        // 空のグラデーション
        if (!this.skyGradient) {
            this.skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
            this.skyGradient.addColorStop(0, '#87CEEB');
            this.skyGradient.addColorStop(0.7, '#98D8E8');
            this.skyGradient.addColorStop(1, '#B0E0E6');
        }
        ctx.fillStyle = this.skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 雲
        this.renderClouds(ctx);
        
        // 地面
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, this.groundLevel, this.width, this.height - this.groundLevel);
        
        // 建物
        this.renderBuildings(ctx);
        
        // 基地
        this.renderBase(ctx);
        
        // 充電ポート
        this.renderChargingPort(ctx);
        
        // 地面の詳細
        this.renderGroundDetails(ctx);
    }
    
    renderClouds(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            // 雲の形を複数の円で表現
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.height/2, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.25, cloud.y - cloud.height * 0.2, cloud.height/2.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.height/2, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.75, cloud.y - cloud.height * 0.1, cloud.height/2.2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderBuildings(ctx) {
        this.buildings.forEach(building => {
            // 建物本体
            ctx.fillStyle = '#666';
            ctx.fillRect(building.x, building.y - building.height, building.width, building.height);
            
            // 建物の輪郭
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(building.x, building.y - building.height, building.width, building.height);
            
            // 窓
            this.renderWindows(ctx, building);
            
            // 屋上
            ctx.fillStyle = '#555';
            ctx.fillRect(building.x - 5, building.y - building.height - 10, building.width + 10, 10);
        });
    }
    
    renderWindows(ctx, building) {
        ctx.fillStyle = '#FFE082';
        const windowWidth = 15;
        const windowHeight = 20;
        const windowSpacingX = 25;
        const windowSpacingY = 30;
        const windowsPerRow = Math.floor((building.width - 20) / windowSpacingX);
        const windowRows = Math.floor((building.height - 40) / windowSpacingY);
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowsPerRow; col++) {
                const windowX = building.x + 15 + col * windowSpacingX;
                const windowY = building.y - building.height + 20 + row * windowSpacingY;
                
                // ランダムに一部の窓を暗くする
                if (Math.random() > 0.3) {
                    ctx.fillStyle = '#FFE082';
                } else {
                    ctx.fillStyle = '#444';
                }
                
                ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
            }
        }
    }
    
    renderBase(ctx) {
        // 基地の建物
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(this.baseX, this.baseY - this.baseHeight, this.baseWidth, this.baseHeight);
        
        // 基地の屋根
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(this.baseX - 10, this.baseY - this.baseHeight);
        ctx.lineTo(this.baseX + this.baseWidth/2, this.baseY - this.baseHeight - 30);
        ctx.lineTo(this.baseX + this.baseWidth + 10, this.baseY - this.baseHeight);
        ctx.closePath();
        ctx.fill();
        
        // 赤十字マーク
        ctx.fillStyle = '#FF0000';
        const crossX = this.baseX + this.baseWidth/2;
        const crossY = this.baseY - this.baseHeight/2;
        const crossSize = 20;
        
        // 横棒
        ctx.fillRect(crossX - crossSize/2, crossY - 5, crossSize, 10);
        // 縦棒
        ctx.fillRect(crossX - 5, crossY - crossSize/2, 10, crossSize);
        
        // ヘリパッドマーク
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.baseX + this.baseWidth/2, this.baseY - 20, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hマーク
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText('H', this.baseX + this.baseWidth/2, this.baseY - 15);
    }
    
    renderGroundDetails(ctx) {
        // 地面のテクスチャ
        ctx.strokeStyle = '#6B5D54';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < this.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, this.groundLevel);
            ctx.lineTo(x + 10, this.groundLevel + 5);
            ctx.stroke();
        }
    }
    
    renderChargingPort(ctx) {
        const port = this.chargingPort;
        
        // 充電ポートのベース（使用済みの場合はグレー）
        ctx.fillStyle = port.used ? '#757575' : '#2196F3';
        ctx.fillRect(port.x - port.width/2, port.y - port.height, port.width, port.height);
        
        // 充電ポートの枠
        ctx.strokeStyle = port.used ? '#616161' : '#1976D2';
        ctx.lineWidth = 2;
        ctx.strokeRect(port.x - port.width/2, port.y - port.height, port.width, port.height);
        
        // 充電シンボル（稲妻マーク）
        ctx.fillStyle = port.used ? '#BDBDBD' : '#FFD700';
        ctx.beginPath();
        ctx.moveTo(port.x - 8, port.y - port.height + 10);
        ctx.lineTo(port.x + 3, port.y - port.height + 20);
        ctx.lineTo(port.x - 2, port.y - port.height + 20);
        ctx.lineTo(port.x + 8, port.y - port.height + 30);
        ctx.lineTo(port.x - 3, port.y - port.height + 20);
        ctx.lineTo(port.x + 2, port.y - port.height + 20);
        ctx.closePath();
        ctx.fill();
        
        // 充電パッド
        ctx.fillStyle = '#333';
        ctx.fillRect(port.x - port.width/2 + 5, port.y - 5, port.width - 10, 5);
        
        // 充電量表示（未使用時のみ）
        if (!port.used) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`+${port.chargeAmount}%`, port.x, port.y - port.height - 5);
        }
    }
}