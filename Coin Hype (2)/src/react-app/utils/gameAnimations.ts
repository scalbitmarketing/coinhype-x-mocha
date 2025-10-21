import { gsap } from 'gsap';

export class GameAnimations {

  /**
   * Initialize GSAP with optimized settings
   */
  static init() {
    gsap.set([], { force3D: true }); // Enable hardware acceleration
    gsap.config({ nullTargetWarn: false });
  }

  /**
   * Dice roll animation with 3D bounce effect
   */
  static animateDiceRoll(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: resolve
      });

      // Initial shake
      tl.to(element, {
        duration: 0.1,
        x: "random(-5, 5)",
        y: "random(-5, 5)",
        rotation: "random(-10, 10)",
        repeat: 5,
        yoyo: true
      })
      // Bounce effect
      .to(element, {
        duration: 0.3,
        scale: 1.2,
        rotationX: 360,
        rotationY: 180,
        ease: "back.out(2)"
      })
      // Settle
      .to(element, {
        duration: 0.2,
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        ease: "bounce.out"
      })
      // Final glow
      .to(element, {
        duration: 0.5,
        boxShadow: "0 0 30px rgba(0, 217, 255, 0.8)",
        repeat: 1,
        yoyo: true
      });
    });
  }

  /**
   * Plinko ball drop animation
   */
  static animatePlinkoDrops(
    ballElements: HTMLElement[], 
    pegs: { x: number; y: number }[],
    onPegHit?: (pegIndex: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      const promises = ballElements.map((ball) => {
        return new Promise<void>((ballResolve) => {
          const tl = gsap.timeline({ onComplete: ballResolve });
          
          // Start from center top
          gsap.set(ball, { x: 0, y: 0, scale: 1 });
          
          // Animate through pegs
          pegs.forEach((peg, pegIndex) => {
            tl.to(ball, {
              duration: 0.2,
              x: peg.x + (Math.random() - 0.5) * 20,
              y: peg.y,
              ease: "power2.out",
              onComplete: () => {
                if (onPegHit) onPegHit(pegIndex);
              }
            })
            .to(ball, {
              duration: 0.1,
              scale: 0.9,
              yoyo: true,
              repeat: 1
            }, "<");
          });
          
          // Final drop
          tl.to(ball, {
            duration: 0.3,
            y: "+=100",
            ease: "power2.in"
          });
        });
      });
      
      Promise.all(promises).then(() => resolve());
    });
  }

  /**
   * Slots reel spin animation with inertia
   */
  static animateSlotReels(
    reels: HTMLElement[], 
    onReelStop?: (reelIndex: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      
      reels.forEach((reel, index) => {
        const spinCount = 3 + index * 0.5; // Staggered stops
        
        tl.to(reel, {
          duration: 1 + index * 0.2,
          rotationY: spinCount * 360,
          ease: "power3.out",
          onComplete: () => {
            if (onReelStop) onReelStop(index);
          }
        }, index * 0.1)
        .to(reel, {
          duration: 0.2,
          scale: 1.1,
          yoyo: true,
          repeat: 1,
          boxShadow: "0 0 20px rgba(0, 217, 255, 0.6)"
        }, "-=0.2");
      });
    });
  }

  /**
   * Crash multiplier animation
   */
  static animateCrashMultiplier(
    element: HTMLElement, 
    startValue: number, 
    endValue: number,
    onUpdate?: (value: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      gsap.to({ value: startValue }, {
        duration: 2,
        value: endValue,
        ease: "power2.out",
        onUpdate: function() {
          const currentValue = this.targets()[0].value;
          if (onUpdate) onUpdate(currentValue);
          element.textContent = `${currentValue.toFixed(2)}x`;
        },
        onComplete: resolve
      });
    });
  }

  /**
   * Win celebration animation
   */
  static animateWin(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      
      tl.to(element, {
        duration: 0.1,
        scale: 1.2,
        ease: "power2.out"
      })
      .to(element, {
        duration: 0.3,
        rotation: 360,
        ease: "back.out(2)"
      })
      .to(element, {
        duration: 0.5,
        scale: 1,
        boxShadow: "0 0 50px rgba(34, 197, 94, 0.8)",
        repeat: 2,
        yoyo: true
      });
    });
  }

  /**
   * Mine explosion animation
   */
  static animateMineExplosion(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      
      tl.to(element, {
        duration: 0.1,
        scale: 0.8
      })
      .to(element, {
        duration: 0.2,
        scale: 1.5,
        rotation: 180,
        backgroundColor: "#ef4444",
        boxShadow: "0 0 30px rgba(239, 68, 68, 1)",
        ease: "power2.out"
      })
      .to(element, {
        duration: 0.3,
        scale: 1,
        rotation: 360
      });
    });
  }

  /**
   * Gem reveal animation
   */
  static animateGemReveal(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      
      tl.to(element, {
        duration: 0.2,
        scale: 1.2,
        backgroundColor: "#10b981",
        boxShadow: "0 0 20px rgba(16, 185, 129, 0.8)"
      })
      .to(element, {
        duration: 0.3,
        scale: 1,
        rotation: 360,
        ease: "back.out(2)"
      });
    });
  }

  /**
   * Button pulse animation
   */
  static animateButtonPulse(element: HTMLElement): void {
    gsap.to(element, {
      duration: 0.5,
      scale: 1.05,
      boxShadow: "0 0 30px rgba(0, 217, 255, 0.6)",
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });
  }

  /**
   * Stop all animations
   */
  static killAll(): void {
    gsap.killTweensOf("*");
  }

  /**
   * Preload animation performance
   */
  static preload(): void {
    // Create dummy elements to warm up GPU
    const dummy = document.createElement('div');
    dummy.style.position = 'absolute';
    dummy.style.left = '-9999px';
    document.body.appendChild(dummy);
    
    // Warm up common animations
    gsap.to(dummy, { duration: 0.01, x: 1, rotation: 1, scale: 1.01 });
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(dummy);
    }, 100);
  }
}

// Initialize on module load
GameAnimations.init();
