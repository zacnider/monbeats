class Arrow {
  constructor(arrowOpts) {
    this.imgUrl = arrowOpts['imgUrl'];  
    this.direction = arrowOpts['direction'];
    this.rotation = this.getRotation();
    this.pos = arrowOpts['position'];
    this.scale = .35;
    this.size = 268 * this.scale;
    this.setHorizPos();
    // even though velocity has 2 nums, we'll only be using the Y since arrows
    // will only be moving upwards
    this.velocity = arrowOpts['velocity'] || [0, 0];

    this.img = new Image();
    this.img.src = this.imgUrl;
    this.isAMine = arrowOpts['isAMine'] || false;
    this.isATarget = arrowOpts['target'] || false;
    this.isAPop = arrowOpts['isAPop'] || false;
    
    // Hit animation properties
    this.isHit = false;
    this.hitTime = 0;
    this.hitScale = 1;
    this.hitRotation = 0;
    this.hitAlpha = 1;
    this.hitParticles = [];
  }

  // Determine which lane for target based on it's direction/orientation.
  setHorizPos() {
    const startPos = this.pos[0];
    const gap = 103;
    switch(this.direction) {
      case 'left':
        this.pos[0] = startPos + (gap * 0);
        break;
      case 'down':
        this.pos[0] = startPos + (gap * 1);
        break;
      case 'up':
        this.pos[0] = startPos + (gap * 2);
        break;
      case 'right':
        this.pos[0] = startPos + (gap * 3);
        break;
    }
  }
  
  // This is hard-coded for 4 panels. need to refactor to make scalable
  render(ctx) {
    // Update hit animation
    this.updateHitAnimation();
    
    // Render hit particles first (behind arrow)
    this.renderHitParticles(ctx);
    
    // Mine rotation
    if (this.isAMine) {
      this.rotation += .1
    }
    
    // Apply effects without changing rotation
    if (this.isHit) {
      ctx.globalAlpha = this.hitAlpha;
      ctx.setTransform(this.scale * this.hitScale, 0, 0, this.scale * this.hitScale, this.pos[0], this.pos[1]);
    } else {
      ctx.setTransform(this.scale, 0, 0, this.scale, this.pos[0], this.pos[1]);
    }
    
    // Always use original rotation (no hit rotation)
    ctx.rotate(this.rotation);
    ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
    
    // Reset transform and alpha
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  // Helper to move arrows per frame.
  move() {
    const [x, y] = this.pos;
    const [a, b] = this.velocity;
    this.pos = [x + a, y + b];
  }

  // This is hard-coded for 4 panels, need to refactor to make scalable
  // Helper to determine which way the arrow will face, since the image is
  // facing upward by default.
  getRotation() {
    switch (this.direction) {
      case 'left':
        return Math.PI * 0.5
      case 'down':
        return Math.PI * 0
      case 'up':
        return Math.PI * 1
      case 'right':
        return Math.PI * 1.5
    }
  }

  // Helper to calculate distance between two Arrow Objects.
  getDistance(otherArrow) {
    let ourY = this.pos[1];
    let theirY = otherArrow.pos[1];
    return theirY - ourY
  }
  
  // Method to trigger hit animation
  hit() {
    this.isHit = true;
    this.hitTime = Date.now();
    this.hitScale = 1.3;
    this.hitRotation = 0; // Rotasyonu sıfırla
    this.hitAlpha = 1;
    
    // Create hit particles - daha çok parçacık
    for (let i = 0; i < 12; i++) {
      this.hitParticles.push({
        x: this.pos[0],
        y: this.pos[1],
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        size: Math.random() * 6 + 3,
        color: this.getHitColor(),
        sparkle: Math.random() > 0.5
      });
    }
  }
  
  // Get color based on arrow direction for hit effect
  getHitColor() {
    const colors = {
      'left': '#FF6B6B',    // Red
      'down': '#4ECDC4',    // Teal
      'up': '#45B7D1',      // Blue
      'right': '#96CEB4'    // Green
    };
    return colors[this.direction] || '#FFD93D';
  }
  
  // Update hit animation
  updateHitAnimation() {
    if (!this.isHit) return;
    
    const elapsed = Date.now() - this.hitTime;
    const duration = 400; // 400ms animation
    
    if (elapsed > duration) {
      this.isHit = false;
      this.hitParticles = [];
      return;
    }
    
    const progress = elapsed / duration;
    
    // Scale animation - sadece büyür, döndürme yok
    this.hitScale = 1 + (0.3 * Math.sin(progress * Math.PI));
    
    // Alpha animation - yavaş fade
    this.hitAlpha = 1 - (progress * 0.8);
    
    // Update particles
    this.hitParticles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98; // Yavaşla
      particle.vy *= 0.98; // Yavaşla
      particle.life -= 0.025;
      particle.size *= 0.97;
      
      // Sparkle effect
      if (particle.sparkle) {
        particle.size += Math.sin(elapsed * 0.01) * 0.5;
      }
    });
    
    // Remove dead particles
    this.hitParticles = this.hitParticles.filter(p => p.life > 0);
  }
  
  // Render hit particles
  renderHitParticles(ctx) {
    if (!this.isHit || this.hitParticles.length === 0) return;
    
    this.hitParticles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      
      // Gradient effect for particles
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Sparkle effect
      if (particle.sparkle) {
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = particle.life * 0.8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }
}

module.exports = Arrow;