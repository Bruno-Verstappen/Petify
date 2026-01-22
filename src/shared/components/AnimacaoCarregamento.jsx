import React from "react";
import Sketch from "react-p5";

const LoadingPatinhas = () => {
  // Configurações
  const totalPatinhas = 5;
  const intervalo = 30;

  const setup = (p5, canvasParentRef) => {
    // Cria o canvas e liga-o ao React
    p5.createCanvas(600, 300).parent(canvasParentRef);
    p5.noStroke();
  };

  const draw = (p5) => {
    p5.background(255, 248, 240); // Fundo claro

    // 1. Calcular quantas patinhas devem estar visíveis
    // Em JS, a divisão pode dar números decimais, por isso usamos Math.floor para arredondar para inteiro
    let patinhasVisiveis = Math.floor(p5.frameCount / intervalo) % (totalPatinhas + 1);

    // 2. Desenhar as patinhas visíveis
    for (let i = 0; i < patinhasVisiveis; i++) {
      let x = 140 + (i * 80);
      let y = p5.height / 2;

      // Chamamos a função auxiliar passando o 'p5'
      desenharPatinha(p5, x, y);
    }

    // Texto opcional
    p5.textAlign(p5.CENTER);
    p5.fill(150);
    p5.textSize(16);
    p5.text("A carregar...", p5.width / 2, p5.height / 2 + 60);
  };

  // --- FUNÇÃO PERSONALIZADA ---
  // Recebe 'p5' como primeiro argumento para poder desenhar
  const desenharPatinha = (p5, x, y) => {
    p5.fill(100, 80, 60); // Cor castanha

    // A almofada grande
    p5.ellipse(x, y, 40, 35);

    // Os três dedos
    p5.ellipse(x - 20, y - 25, 15, 15); // Esquerdo
    p5.ellipse(x, y - 35, 15, 15);      // Meio
    p5.ellipse(x + 20, y - 25, 15, 15); // Direito
  };

  return <Sketch setup={setup} draw={draw} />;
};

export default LoadingPatinhas;