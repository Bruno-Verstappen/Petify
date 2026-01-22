import React, { useRef } from "react";
import Sketch from "react-p5";

const LetterPetAnimation = ({ trigger, onComplete }) => {
  if (!trigger) return null;

  // Usamos useRef para garantir que estas variáveis SOBREVIVEM às atualizações do React
  const sheetCaoRef = useRef(null);
  const xRef = useRef(-100); 

  // 1. PRELOAD
  const preload = (p5) => {
    // Carrega a imagem para dentro da referência
    sheetCaoRef.current = p5.loadImage("/cao_sprite.png", () => {
        console.log("Sprite carregada!");
    });
  };

  // 2. SETUP
  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.noStroke();
    p5.imageMode(p5.CENTER);
    p5.rectMode(p5.CENTER);
  };

  // 3. DRAW
  const draw = (p5) => {
    p5.clear(); // Fundo transparente

    // Se a imagem ainda não carregou, não faz nada
    if (!sheetCaoRef.current) return;

    // Velocidade (reduzi de 15 para 10 para se ver melhor)
    xRef.current += 10; 
    let y = p5.height / 2;

    // --- CÁLCULOS DA SPRITE ---
    const img = sheetCaoRef.current;
    // Largura e Altura de UM frame
    const frameW = img.width / 3;
    const frameH = img.height / 2;
    
    // Qual frame estamos a mostrar? (0, 1 ou 2)
    let frameIndex = Math.floor(p5.frameCount / 6) % 3;

    // Coordenadas de onde cortar na imagem original
    let sx = frameIndex * frameW; // Posição X na folha
    let sy = frameH;              // Posição Y na folha (linha de baixo para correr)

    // --- DESENHAR O CÃO ---
    p5.push();
    p5.translate(xRef.current, y);
    p5.scale(1.2); // Aumentar um pouco o cão

    // A FUNÇÃO MÁGICA: image() com 9 argumentos desenha apenas uma parte da imagem
    // image(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight)
    p5.image(
        img, 
        0, 0, frameW, frameH, // Onde desenhar no ecrã (0,0 porque fizemos translate)
        sx, sy, frameW, frameH // Onde cortar na imagem original
    );
    
    // --- DESENHAR A CARTA ---
    // Desenha-se por cima do cão
    p5.fill(255);
    p5.stroke(200);
    p5.strokeWeight(1);
    
    // Ajuste da carta perto da boca
    p5.rect(15, 5, 24, 16); 
    p5.line(15 - 12, 5 - 8, 15, 5); 
    p5.line(15 + 12, 5 - 8, 15, 5);
    p5.pop();

    // --- FINALIZAR ---
    if (xRef.current > p5.width + 100) {
      onComplete();
      xRef.current = -100; // Reset para a próxima vez
    }
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9999, pointerEvents: 'none' 
    }}>
      <Sketch preload={preload} setup={setup} draw={draw} windowResized={windowResized} />
    </div>
  );
};

export default LetterPetAnimation;