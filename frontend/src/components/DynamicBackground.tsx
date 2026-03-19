import React, { useEffect, useRef } from 'react';

const DynamicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w = window.innerWidth;
    let h = window.innerHeight;
    
    // Mouse tracking
    let mouse = { x: w / 2, y: h / 2, targetX: w / 2, targetY: h / 2 };

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    handleResize();

    // Particles
    const particles: Particle[] = [];
    const particleCount = 40;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        
        const colors = ['rgba(59, 130, 246, 0.4)', 'rgba(147, 51, 234, 0.4)', 'rgba(59, 130, 246, 0.2)'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > w) this.x = 0;
        else if (this.x < 0) this.x = w;
        if (this.y > h) this.y = 0;
        else if (this.y < 0) this.y = h;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Gradient Orbs
    const orbs = [
      { x: w * 0.2, y: h * 0.3, baseRadius: w * 0.4, color: 'rgba(59, 130, 246, 0.15)', phase: 0 },
      { x: w * 0.8, y: h * 0.7, baseRadius: w * 0.35, color: 'rgba(147, 51, 234, 0.15)', phase: Math.PI }
    ];

    const drawBackground = () => {
      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.fillStyle = '#050505'; // Deep black base
      ctx.fillRect(0, 0, w, h);

      // Draw interactive glowing orbs
      orbs.forEach((orb, i) => {
        orb.phase += 0.005;
        
        // Parallax effect with mouse
        const parallaxX = (mouse.x - w / 2) * (i === 0 ? -0.05 : 0.05);
        const parallaxY = (mouse.y - h / 2) * (i === 0 ? -0.05 : 0.05);
        
        // Breathing effect, ensure radius is always positive
        const currentRadius = Math.max(0.1, orb.baseRadius + Math.sin(orb.phase) * 50);

        const x = orb.x + parallaxX;
        const y = orb.y + parallaxY;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      // Draw mouse glow
      const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
      mouseGlow.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = mouseGlow;
      ctx.fillRect(0, 0, w, h);

      // Draw particles and lines
      particles.forEach((p, i) => {
        p.update();
        p.draw();

        // Connect nearby particles
        for (let j = i; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        
        // Connect to mouse
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distMouse < 200) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(147, 51, 234, ${0.15 * (1 - distMouse / 200)})`;
          ctx.lineWidth = 1.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });
    };

    const render = () => {
      drawBackground();
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      style={{ background: '#050505' }}
    />
  );
};

export default DynamicBackground;