class Citizen {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        
        // 状態
        this.rescued = false;
        this.delivered = false;
        this.inDrone = false;
        
        // 位置タイプ
        this.type = 'ground'; // ground, roof
        this.buildingIndex = -1;
        
        // アニメーション
        this.animationTimer = 0;
        this.waveSpeed = 2;
        this.jumpHeight = 0;
        this.isWaving = true;
        
        // 感情表現
        this.emotion = 'waiting'; // waiting, happy, rescued
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        
        // 救助を待っている時のアニメーション
        if (!this.rescued && this.isWaving) {
            // 手を振るアニメーション
            this.jumpHeight = Math.sin(this.animationTimer * this.waveSpeed) * 5;
        }
        
        // 救助された時の喜び表現
        if (this.rescued && !this.inDrone) {
            this.emotion = 'happy';
        }
    }
    
    boardDrone(drone) {
        this.inDrone = true;
        this.emotion = 'rescued';
    }
    
    render(ctx) {
        // 配達済みまたはドローンに乗っている場合は描画しない
        if (this.delivered || this.inDrone) return;
        
        ctx.save();
        
        // 屋上の市民の場合、建物の端に立っているように表示
        if (this.type === 'roof') {
            ctx.translate(this.x, this.y);
            
            // 屋上の縁を表現
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();
        } else {
            // 地面の市民
            ctx.translate(this.x, this.y - this.jumpHeight);
        }
        
        // 体
        ctx.fillStyle = this.rescued ? '#4CAF50' : '#FF6B6B';
        ctx.fillRect(-this.width/2, -this.height, this.width, this.height);
        
        // 頭
        ctx.beginPath();
        ctx.arc(0, -this.height - 10, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FDBCB4';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 顔の表情
        this.renderFace(ctx);
        
        // 手を振るアニメーション
        if (!this.rescued && this.isWaving) {
            const waveAngle = Math.sin(this.animationTimer * this.waveSpeed * 2) * 0.5;
            ctx.save();
            ctx.translate(this.width/2, -this.height + 10);
            ctx.rotate(waveAngle);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, -10);
            ctx.stroke();
            ctx.restore();
        }
        
        // 救助を求める吹き出し
        if (!this.rescued) {
            this.renderHelpBubble(ctx);
        }
        
        // 屋上の市民の場合、窓から顔を出している演出を追加
        if (this.type === 'roof' && !this.rescued) {
            // 煙の表現（火災の危険を示す）
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            for (let i = 0; i < 3; i++) {
                const smokeY = -this.height - 50 - i * 20;
                const smokeX = Math.sin(this.animationTimer + i) * 10;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, 10 + i * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    renderFace(ctx) {
        // 目
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-3, -this.height - 12, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -this.height - 12, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 口
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        switch(this.emotion) {
            case 'waiting':
                // 心配そうな口
                ctx.arc(0, -this.height - 6, 3, 0.2 * Math.PI, 0.8 * Math.PI);
                break;
            case 'happy':
                // 笑顔
                ctx.arc(0, -this.height - 8, 3, 0, Math.PI);
                break;
            case 'rescued':
                // 安心した表情
                ctx.moveTo(-3, -this.height - 6);
                ctx.lineTo(3, -this.height - 6);
                break;
        }
        ctx.stroke();
    }
    
    renderHelpBubble(ctx) {
        const bubbleY = -this.height - 40;
        const pulse = Math.sin(this.animationTimer * 3) * 0.1 + 1;
        
        ctx.save();
        ctx.scale(pulse, pulse);
        
        // 吹き出し
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, bubbleY);
        ctx.lineTo(-5, bubbleY + 10);
        ctx.lineTo(5, bubbleY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, bubbleY - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // HELP!テキスト
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HELP!', 0, bubbleY - 7);
        
        ctx.restore();
    }
}