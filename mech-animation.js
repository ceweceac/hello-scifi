(function(){
  const c=document.getElementById('mechCanvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  let w,h;
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight}
  resize();
  addEventListener('resize',resize);

  const helm={x:w/2,y:h/2,rot:0,glow:0};

  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.save();
    ctx.translate(helm.x,helm.y);
    ctx.rotate(helm.rot);

    const g=ctx.createRadialGradient(-20,-20,10,0,0,100);
    g.addColorStop(0,'#991b1b');
    g.addColorStop(.5,'#7f1d1d');
    g.addColorStop(1,'#450a0a');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(0,0,100,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(-70,-15,140,50);

    const glow=.5+Math.sin(helm.glow)*.5;
    ctx.shadowBlur=25;
    ctx.shadowColor='#ef4444';
    ctx.fillStyle=`rgba(239,68,68,${glow})`;
    ctx.beginPath();
    ctx.ellipse(-35,0,18,10,0,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(35,0,18,10,0,0,Math.PI*2);
    ctx.fill();

    ctx.shadowBlur=0;
    ctx.strokeStyle='#ef4444';
    ctx.lineWidth=1.5;
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*85,Math.sin(a)*85);
      ctx.lineTo(Math.cos(a)*100,Math.sin(a)*100);
      ctx.stroke();
    }

    ctx.restore();
    helm.rot+=.001;
    helm.glow+=.05;
    requestAnimationFrame(draw);
  }
  draw();
})();
