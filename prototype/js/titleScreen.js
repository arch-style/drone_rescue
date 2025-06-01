class TitleScreen {
    constructor() {
        this.canvas = document.getElementById('titleCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // キャンバスサイズを設定
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // アニメーション用の変数
        this.time = 0;
        this.drones = [];
        this.buildings = [];
        this.clouds = [];
        this.particles = [];
        
        // 初期化
        this.init();
        
        // アニメーション開始
        this.animate();
    }
    
    resize() {
        this.canvas.width = 360;
        this.canvas.height = 640;
        
        // レスポンシブ対応
        const container = document.getElementById('gameContainer');
        if (container) {
            const rect = container.getBoundingClientRect();
            const scale = Math.min(rect.width / 360, rect.height / 640);
            this.canvas.style.transform = `scale(${scale})`;
            this.canvas.style.transformOrigin = 'top left';
        }
    }
    
    init() {
        // ドローンを生成（メインドローン）
        this.mainDrone = {
            x: 180,
            y: 200,
            size: 40,
            angle: 0,
            floatOffset: 0,
            propellerAngle: 0
        };
        
        // 背景のドローンを生成
        for (let i = 0; i < 3; i++) {
            this.drones.push({
                x: Math.random() * 360,
                y: Math.random() * 200 + 50,
                size: 20 + Math.random() * 10,
                speed: 0.3 + Math.random() * 0.3,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
        
        // ビルを生成
        const buildingCount = 8;
        for (let i = 0; i < buildingCount; i++) {
            this.buildings.push({
                x: (i * 360 / buildingCount) + Math.random() * 20,
                width: 30 + Math.random() * 20,
                height: 100 + Math.random() * 150,
                color: `hsl(220, 20%, ${15 + Math.random() * 10}%)`
            });
        }
        
        // 雲を生成
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * 400,
                y: Math.random() * 150,
                size: 30 + Math.random() * 40,
                speed: 0.1 + Math.random() * 0.1
            });
        }
    }
    
    animate() {
        this.time += 0.016; // 約60fps
        
        // 背景をクリア
        this.ctx.fillStyle = '#87CEEB'; // 空の色
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グラデーション背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(135, 206, 235, 1)');
        gradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.8)');
        gradient.addColorStop(1, 'rgba(50, 80, 100, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 雲を描画
        this.drawClouds();
        
        // 都市を描画
        this.drawCity();
        
        // 背景のドローンを描画
        this.drawBackgroundDrones();
        
        // メインドローンを描画
        this.drawMainDrone();
        
        // パーティクルエフェクト
        this.updateParticles();
        
        // アニメーションを継続
        requestAnimationFrame(() => this.animate());
    }
    
    drawClouds() {
        this.ctx.save();
        
        this.clouds.forEach(cloud => {
            // 雲を移動
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = 360 + cloud.size;
            }
            
            // 雲を描画
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            
            // 複数の円で雲を形成
            for (let i = 0; i < 3; i++) {
                const offsetX = (i - 1) * cloud.size * 0.3;
                const offsetY = Math.sin(i) * cloud.size * 0.2;
                this.ctx.arc(
                    cloud.x + offsetX,
                    cloud.y + offsetY,
                    cloud.size * 0.4,
                    0,
                    Math.PI * 2
                );
            }
            
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    drawCity() {
        this.ctx.save();
        
        // ビルの影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.buildings.forEach(building => {
            this.ctx.fillRect(
                building.x + 5,
                this.canvas.height - building.height + 5,
                building.width,
                building.height
            );
        });
        
        // ビル本体
        this.buildings.forEach(building => {
            // ビルのグラデーション
            const buildingGradient = this.ctx.createLinearGradient(
                building.x,
                this.canvas.height - building.height,
                building.x,
                this.canvas.height
            );
            buildingGradient.addColorStop(0, building.color);
            buildingGradient.addColorStop(1, 'rgba(20, 20, 20, 1)');
            
            this.ctx.fillStyle = buildingGradient;
            this.ctx.fillRect(
                building.x,
                this.canvas.height - building.height,
                building.width,
                building.height
            );
            
            // 窓を描画
            this.ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
            const windowSize = 4;
            const windowGap = 8;
            
            for (let y = 10; y < building.height - 10; y += windowGap) {
                for (let x = 4; x < building.width - 4; x += windowGap) {
                    // ランダムに一部の窓を光らせる
                    if (Math.random() > 0.3) {
                        this.ctx.fillRect(
                            building.x + x,
                            this.canvas.height - building.height + y,
                            windowSize,
                            windowSize
                        );
                    }
                }
            }
        });
        
        this.ctx.restore();
    }
    
    drawBackgroundDrones() {
        this.drones.forEach(drone => {
            // ドローンを移動
            drone.x += drone.speed;
            if (drone.x > 360 + drone.size) {
                drone.x = -drone.size;
            }
            
            // 浮遊アニメーション
            const floatY = Math.sin(this.time + drone.floatOffset) * 5;
            
            this.ctx.save();
            this.ctx.translate(drone.x, drone.y + floatY);
            this.ctx.scale(0.5, 0.5); // 背景のドローンは小さく
            this.ctx.globalAlpha = 0.6;
            
            this.drawDrone(0);
            
            this.ctx.restore();
        });
    }
    
    drawMainDrone() {
        // メインドローンの浮遊アニメーション
        this.mainDrone.floatOffset = Math.sin(this.time * 1.5) * 8;
        this.mainDrone.angle = Math.sin(this.time * 0.5) * 0.1;
        
        this.ctx.save();
        this.ctx.translate(this.mainDrone.x, this.mainDrone.y + this.mainDrone.floatOffset);
        this.ctx.rotate(this.mainDrone.angle);
        
        // 影を描画
        this.ctx.save();
        this.ctx.translate(0, 180);
        this.ctx.scale(1, 0.3);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // ドローンを描画
        this.drawDrone(this.time * 10);
        
        // 救助中の市民を描画
        if (Math.sin(this.time) > 0) {
            this.ctx.save();
            this.ctx.translate(0, 25);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👥', 0, 0);
            this.ctx.restore();
        }
        
        this.ctx.restore();
        
        // たまにパーティクルを生成
        if (Math.random() < 0.05) {
            this.particles.push({
                x: this.mainDrone.x + (Math.random() - 0.5) * 40,
                y: this.mainDrone.y + this.mainDrone.floatOffset + 10,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: 1,
                color: Math.random() > 0.5 ? '#4CAF50' : '#FFD700'
            });
        }
    }
    
    drawDrone(propellerAngle) {
        // ドローン本体（中央部）
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#E0E0E0';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // アーム（4本）
        const armLength = 15;
        const armWidth = 6;
        const armAngles = [-Math.PI/4, Math.PI/4, 3*Math.PI/4, -3*Math.PI/4];
        
        armAngles.forEach((angle) => {
            this.ctx.save();
            this.ctx.rotate(angle);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(12, -armWidth/2, armLength, armWidth);
            this.ctx.strokeStyle = '#E0E0E0';
            this.ctx.strokeRect(12, -armWidth/2, armLength, armWidth);
            
            this.ctx.restore();
        });
        
        // 赤いストライプ
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        
        this.ctx.save();
        this.ctx.rotate(-Math.PI/4);
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, 0);
        this.ctx.stroke();
        this.ctx.restore();
        
        this.ctx.save();
        this.ctx.rotate(Math.PI/4);
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, 0);
        this.ctx.stroke();
        this.ctx.restore();
        
        // プロペラ
        const propDistance = 27;
        armAngles.forEach((angle, index) => {
            this.ctx.save();
            
            const x = Math.cos(angle) * propDistance;
            const y = Math.sin(angle) * propDistance;
            this.ctx.translate(x, y);
            
            const rotation = propellerAngle * (index % 2 === 0 ? 1 : -1);
            this.ctx.rotate(rotation);
            
            // プロペラブレード
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-16, 0);
            this.ctx.lineTo(16, 0);
            this.ctx.stroke();
            
            // モーターハブ
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            
            if (particle.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return true;
            }
            return false;
        });
    }
}