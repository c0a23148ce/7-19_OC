/* ============================================================
   環境音（Web Audio APIで簡易生成。外部音源ファイルなしで動く）
   - 波音を控えめなBGMとして全体に流す
   - 決断確定・倒れるシーン・救助シーンでそれぞれ違う効果音を鳴らす
   - ミュートボタンでオン/オフを切り替えられる
   ============================================================ */
const AudioManager = (function(){
  let ctx = null;
  let muted = false;
  let bgm = null; // { noise, filter, gain, swell }

  function ensureCtx(){
    if(!ctx){
      try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ ctx = null; }
    }
    if(ctx && ctx.state === "suspended"){ ctx.resume().catch(() => {}); }
    return ctx;
  }

  // 波音のアンビエントBGM：フィルターをかけたノイズをループ再生し、
  // ゆっくりとしたLFOで音量を揺らして波のうねりのように聞こえさせる。
  function startBgm(){
    if(muted || bgm) return;
    const c = ensureCtx();
    if(!c) return;

    const bufferSize = 2 * c.sampleRate;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++){ data[i] = Math.random() * 2 - 1; }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 480;
    filter.Q.value = 0.6;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 2);

    const swell = c.createOscillator(); // 波のうねりを表現するゆっくりしたLFO
    swell.type = "sine";
    swell.frequency.value = 0.12;
    const swellGain = c.createGain();
    swellGain.gain.value = 0.022;
    swell.connect(swellGain);
    swellGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    try{ noise.start(); swell.start(); }catch(e){}
    bgm = { noise, filter, gain, swell };
  }

  function stopBgm(){
    if(!bgm || !ctx) { bgm = null; return; }
    const { noise, gain, swell } = bgm;
    try{
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    }catch(e){}
    setTimeout(() => { try{ noise.stop(); swell.stop(); }catch(e){} }, 700);
    bgm = null;
  }

  // freqsを少しずつずらして鳴らす短い和音（決断確定・救助シーン用）
  function playChord(freqs, wave, dur, peakGain){
    const c = ensureCtx();
    if(!c || muted) return;
    freqs.forEach((f, i) => {
      const startAt = c.currentTime + i * 0.09;
      const osc = c.createOscillator();
      osc.type = wave;
      osc.frequency.setValueAtTime(f, startAt);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, startAt);
      g.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
      osc.connect(g);
      g.connect(c.destination);
      try{ osc.start(startAt); osc.stop(startAt + dur + 0.05); }catch(e){}
    });
  }

  function playSfx(name){
    if(muted) return;
    if(name === "confirm") playChord([523.3, 659.3, 784.0], "sine", 0.35, 0.16); // 決断確定：明るい和音
    else if(name === "collapse") playChord([185, 146.8], "sawtooth", 0.5, 0.13); // 倒れる：低く沈む音
    else if(name === "rescue") playChord([392, 523.3, 659.3, 784.0], "sine", 0.7, 0.18); // 救助：上昇する和音
  }

  function toggleMute(){
    muted = !muted;
    if(muted){ stopBgm(); } else { startBgm(); }
    return muted;
  }

  function isMuted(){ return muted; }

  return { ensureCtx, startBgm, stopBgm, playSfx, toggleMute, isMuted };
})();
