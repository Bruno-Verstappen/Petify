import React, { useRef, useEffect, useState } from "react";
import Sketch from "react-p5";

const ProgressoAdocoes = ({ currentAdoptions, goal = 10 }) => {
  const avalancheRef = useRef([]);
  const prevAdoptionsRef = useRef(currentAdoptions);
  const barWidthRef = useRef(0);
  const [shouldTrigger, setShouldTrigger] = useState(false);

  useEffect(() => {
    // Se o número de adoções aumentou, ativa o gatilho da avalanche
    if (currentAdoptions > prevAdoptionsRef.current) {
      setShouldTrigger(true);
    }
    prevAdoptionsRef.current = currentAdoptions;
  }, [currentAdoptions]);

  const triggerAvalanche = (p5) => {
    // Cria 80 patinhas para uma explosão impactante
    for (let i = 0; i < 80; i++) {
      avalancheRef.current.push(createPaw(p5));
    }
  };

  const createPaw = (p5) => {
    return {
      x: p5.width / 2, // Começa no centro da barra
      y: 95,           // Altura da barra
      vx: (Math.random() * 14) - 7,    // Explosão lateral
      vy: (Math.random() * -12) - 5,   // Salto inicial para cima
      rotation: Math.random() * Math.PI * 2,
      vRotation: (Math.random() * 0.4) - 0.2,
      size: Math.random() * 20 + 15,
      // Cores de patinhas (tons de castanho, bege e cinza)
      c: [p5.random(100, 200), p5.random(80, 150), p5.random(50, 100)]
    };
  };

  const updatePaw = (p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.4; // Gravidade
    p.rotation += p.vRotation;
  };

  const displayPaw = (p, p5) => {
    p5.push();
    p5.translate(p.x, p.y);
    p5.rotate(p.rotation);
    p5.fill(p.c[0], p.c[1], p.c[2], 200);
    p5.noStroke();
    
    let s = p.size;
    // Almofada central
    p5.ellipse(0, 0, s, s * 0.8); 
    // Dedos
    p5.ellipse(-s * 0.4, -s * 0.4, s * 0.3, s * 0.3);
    p5.ellipse(-s * 0.15, -s * 0.6, s * 0.3, s * 0.3);
    p5.ellipse(s * 0.15, -s * 0.6, s * 0.3, s * 0.3);
    p5.ellipse(s * 0.4, -s * 0.4, s * 0.3, s * 0.3);
    p5.pop();
  };

  const setup = (p5, canvasParentRef) => {
    const canvasWidth = p5.windowWidth < 840 ? p5.windowWidth - 40 : 800;
    p5.createCanvas(canvasWidth, 200).parent(canvasParentRef);
    p5.textAlign(p5.CENTER, p5.CENTER);
  };

  const draw = (p5) => {
    // Se o useEffect ativou o gatilho, dispara a avalanche aqui no loop do p5
    if (shouldTrigger) {
      triggerAvalanche(p5);
      setShouldTrigger(false);
    }

    // p5.clear() garante que o canvas em si é transparente
    p5.clear();

    let maxWidth = p5.width - 40;
    let targetWidth = p5.map(currentAdoptions, 0, goal, 0, maxWidth);
    targetWidth = p5.constrain(targetWidth, 0, maxWidth);

    // Animação lerp da barra
    barWidthRef.current = p5.lerp(barWidthRef.current, targetWidth, 0.05);

    // 1. Desenhar Fundo da Barra
    p5.noStroke();
    // Tornei o fundo da barra ligeiramente mais opaco para se destacar sem o fundo branco do contentor
    p5.fill(220, 220, 220, 180); 
    p5.rect(20, 80, maxWidth, 35, 20);

    // 2. Desenhar Progresso
    if (currentAdoptions >= goal) {
      p5.fill(100, 220, 100); // Verde meta atingida
    } else {
      p5.fill(76, 175, 80); // Verde padrão
    }
    p5.rect(20, 80, barWidthRef.current, 35, 20);

    // 3. Texto da Meta
    // Mudei a cor do texto para branco (ou quase branco) para contrastar com o fundo escuro do dashboard
    p5.fill(245); 
    p5.textSize(22);
    p5.textStyle(p5.BOLD);
    // Adicionei um pequeno contorno (stroke) para garantir leitura em qualquer fundo
    p5.stroke(50, 50, 50, 150); 
    p5.strokeWeight(2);
    p5.text(`Objetivo: ${currentAdoptions} / ${goal} Adoções`, p5.width / 2, 45);
    p5.noStroke();

    // 4. Processar Avalanche de Patinhas
    for (let i = avalancheRef.current.length - 1; i >= 0; i--) {
      let p = avalancheRef.current[i];
      updatePaw(p);
      displayPaw(p, p5);
      
      // Remove se sair do ecrã por baixo
      if (p.y > p5.height + 100) {
        avalancheRef.current.splice(i, 1);
      }
    }
  };

  const windowResized = (p5) => {
    const canvasWidth = p5.windowWidth < 840 ? p5.windowWidth - 40 : 800;
    p5.resizeCanvas(canvasWidth, 200);
  };

  return (
    // Removidos: background, borderRadius e boxShadow
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      width: '100%', 
      margin: '20px 0' 
    }}>
      <Sketch setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
};

export default ProgressoAdocoes;