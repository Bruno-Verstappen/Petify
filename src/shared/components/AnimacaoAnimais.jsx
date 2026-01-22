import React from "react";
import Sketch from "react-p5";

const AnimacaoAnimais = () => {
  // --- VARIÁVEIS DE POSIÇÃO ---
  let caoX = -100;
  let gatoAndarX = -250;
  let gatoCorrerX = -400;

  // Ajuste de altura para alinhar com o chão
  const yFaixaTras = 55;   
  const yFaixaMeio = 50;   
  const yFaixaFrente = 25; 

  // Variáveis Imagens
  let sheetCao, sheetGato;
  let framesCaoSaltar = [];
  let framesGatoAndar = [];
  let framesGatoCorrer = [];

  const preload = (p5) => {
    // Garante que as imagens estão na pasta public
    sheetCao = p5.loadImage("/cao_sprite.png");
    sheetGato = p5.loadImage("/gato_sprite.png");
  };

  const setup = (p5, canvasParentRef) => {
    // Cria o canvas com a largura da janela e 150px de altura
    p5.createCanvas(p5.windowWidth, 150).parent(canvasParentRef);
    p5.noStroke();
    p5.imageMode(p5.CENTER);
    p5.rectMode(p5.CENTER);

    if (!sheetCao || !sheetGato) return;

    // --- CORTAR IMAGENS ---
    const wCao = sheetCao.width / 3;
    const hCao = sheetCao.height / 2;
    // Proteção contra imagens não carregadas
    if (wCao === 0 || hCao === 0) return;

    for (let i = 0; i < 3; i++) {
      framesCaoSaltar[i] = sheetCao.get(i * wCao, hCao, wCao, hCao);
    }

    const wGato = sheetGato.width / 3;
    const hGato = sheetGato.height / 2;
    for (let i = 0; i < 3; i++) {
      let frameAndar = sheetGato.get(i * wGato, 0, wGato, hGato);
      frameAndar.resize(80, 0);
      framesGatoAndar[i] = frameAndar;

      let frameCorrer = sheetGato.get(i * wGato, hGato, wGato, hGato);
      frameCorrer.resize(90, 0);
      framesGatoCorrer[i] = frameCorrer;
    }
  };

  const draw = (p5) => {
    // 1. LIMPAR O FUNDO (Fica Transparente)
    p5.clear();

    // 2. DESENHAR O CHÃO (Faixa branca/azulada em baixo)
    p5.fill(220, 230, 240); // Podes mudar a cor aqui
    // Desenha um retângulo na base do canvas (largura total, 20px altura)
    p5.rect(p5.width / 2, p5.height - 10, p5.width, 20);

    // 3. DESENHAR OS ANIMAIS (Só se os frames existirem)
    if (framesCaoSaltar.length > 0) animarCaoSaltar(p5);
    if (framesGatoAndar.length > 0) animarGatoAndar(p5);
    if (framesGatoCorrer.length > 0) animarGatoCorrer(p5);
  };

  // --- LÓGICA DE MOVIMENTO ---
  const animarCaoSaltar = (p5) => {
    caoX += 4;
    if (caoX > p5.width + 60) caoX = -60;
    let frame = Math.floor(p5.frameCount / 5) % 3;
    
    p5.push();
    p5.translate(caoX, p5.height - yFaixaTras);
    p5.scale(0.7);
    if (framesCaoSaltar[frame]) p5.image(framesCaoSaltar[frame], 0, 0);
    p5.pop();
  };

  const animarGatoAndar = (p5) => {
    gatoAndarX += 2;
    if (gatoAndarX > p5.width + 60) gatoAndarX = -60;
    let frame = Math.floor(p5.frameCount / 10) % 3;

    p5.push();
    p5.translate(gatoAndarX, p5.height - yFaixaMeio);
    p5.scale(0.85);
    if (framesGatoAndar[frame]) p5.image(framesGatoAndar[frame], 0, 0);
    p5.pop();
  };

  const animarGatoCorrer = (p5) => {
    gatoCorrerX += 6;
    if (gatoCorrerX > p5.width + 60) gatoCorrerX = -200;
    let frame = Math.floor(p5.frameCount / 4) % 3;

    p5.push();
    p5.translate(gatoCorrerX, p5.height - yFaixaFrente);
    if (framesGatoCorrer[frame]) p5.image(framesGatoCorrer[frame], 0, 0);
    p5.pop();
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, 150);
  };

  return <Sketch preload={preload} setup={setup} draw={draw} windowResized={windowResized} />;
};

export default AnimacaoAnimais;