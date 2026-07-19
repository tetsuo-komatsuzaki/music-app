// @ts-nocheck
/* eslint-disable */
/* ============================================================
   アルコちゃん — 全30ポーズ パラメトリック実装 (提供モックからの移植)
   全SVGが同一テンプレート生成物のため、共通パーツ（胴体・耳・顔・手・弓）を
   関数化し、差分（腕・弓・表情・小物・エフェクト）のみデータで保持する。
   ============================================================ */

const C = {
  fur: "#F2B266", furDark: "#A8622E", belly: "#FFF3DC", ink: "#4A2A18",
  wood: "#8A5A33", hair: "#FFFDF2", cheek: "#F79E8D", mouth: "#5C3A21",
  mouthIn: "#6B4226", gold: "#F7C948", gray: "#B9A88C", tear: "#8FC7E8",
  steam: "#C8BBA4",
};

/* ---------- 共通パーツ ---------- */

const Body = ({ dy = 0 }) => (
  <g id="body" transform={`translate(0,${dy})`}>
    <path
      d="M 79,150 C 73,156 70,162 70,169 C 70,174 71.5,177 72,181 C 72.4,188 74.5,193.5 78.2,198 C 77.5,202 76,206 75.6,210 C 75.3,214.5 77.5,218.8 85,219.6 C 90.5,219.6 94,218.8 95,216 C 96.6,211 97.1,204 97.1,200.5 C 97.2,199 98.5,198.4 100,198.4 C 101.5,198.4 102.8,199 102.9,200.5 C 102.9,204 103.4,211 105,216 C 106,218.8 109.5,219.6 115,219.6 C 122.5,218.8 124.7,214.5 124.5,210 C 124,206 122.5,202 121.8,198 C 125.5,193.5 127.6,188 128,181 C 128.5,177 130,174 130,169 C 130,162 126,156 121,150 Z"
      fill={C.fur}
    />
    <ellipse cx="100" cy="188" rx="15" ry="12" fill={C.belly} />
  </g>
);

const Ears = () => (
  <g id="ears">
    <path d="M 72.9,52.1 Q 48.4,39.0 20.9,36.8 Q 13.9,35.8 14.9,43.8 Q 19.8,65.6 37.6,87.4 Z" fill={C.fur} />
    <path d="M 65.8,59.2 Q 51.4,51.1 31.0,49.1 Q 34.8,67.7 44.7,80.3 Z" fill={C.furDark} />
    <path d="M 127.1,52.1 Q 151.6,39.0 179.1,36.8 Q 186.1,35.8 185.1,43.8 Q 180.2,65.6 162.4,87.4 Z" fill={C.fur} />
    <path d="M 134.2,59.2 Q 148.6,51.1 169.0,49.1 Q 165.2,67.7 155.3,80.3 Z" fill={C.furDark} />
  </g>
);

const HandPoint = ({ at }) =>
  at ? (
    <g id="hand-point" transform={`translate(${at[0]},${at[1]}) scale(2.5) translate(0,-3)`}>
      <circle cx="0" cy="2" r="2.7" fill={C.ink} />
      <path d="M -7,13 C -7,9.5 -3.5,8 0,8 C 3.5,8 7,9.5 7,13 C 7,16 5,17 5,18.5 C 5,20 8.5,20.5 8.5,24 C 8.5,28.5 4.5,30.5 0,30.5 C -4.5,30.5 -8.5,28.5 -8.5,24 C -8.5,20.5 -5,20 -5,18.5 C -5,17 -7,16 -7,13 Z" fill={C.wood} />
      <rect x="-1.7" y="2" width="3.4" height="17" rx="1.5" fill={C.ink} />
      <path d="M -3.2,18 q -1,2.6 0,5.2" stroke={C.ink} strokeWidth="1.3" fill="none" />
      <path d="M 3.2,18 q 1,2.6 0,5.2" stroke={C.ink} strokeWidth="1.3" fill="none" />
    </g>
  ) : null;

const Bow = ({ bow }) =>
  bow ? (
    <g id="bow">
      <path d={bow.stick} stroke={C.wood} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d={bow.hair} stroke={C.hair} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <rect x={bow.frog[0]} y={bow.frog[1]} width="11" height="13" rx="3" fill={C.ink} />
    </g>
  ) : null;

const ArmPath = ({ d }) => <path d={d} fill={C.fur} />;

/* ---------- 表情 ---------- */

const BROWS = {
  normal: { d: ["M 62,101 q 8,-3.5 16,-2", "M 138,101 q -8,-3.5 -16,-2"], w: 3 },
  happy: { d: ["M 62,98 q 8,-5 16,-3", "M 138,98 q -8,-5 -16,-3"], w: 3 },
  sad: { d: ["M 61,104 L 77,99", "M 139,104 L 123,99"], w: 3 },
  fierce: { d: ["M 62,99 L 80,104", "M 138,99 L 120,104"], w: 3.2 },
};

const Brows = ({ type }) => {
  const b = BROWS[type];
  return (
    <g id="brows">
      {b.d.map((d, i) => (
        <path key={i} d={d} stroke={C.ink} strokeWidth={b.w} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};

const Eyes = ({ eyes }) => {
  if (eyes.type === "open") {
    const [a, b] = eyes.cx;
    const cy = eyes.cy;
    return (
      <g id="eyes">
        <circle cx={a} cy={cy} r="15.5" fill={C.ink} />
        <circle cx={b} cy={cy} r="15.5" fill={C.ink} />
        <circle cx={a + 5} cy={cy - 6} r="4.8" fill="#FFF" />
        <circle cx={b + 5} cy={cy - 6} r="4.8" fill="#FFF" />
      </g>
    );
  }
  if (eyes.type === "happy")
    return (
      <g id="eyes">
        <path d="M 56.5,126 q 14,-18 28,0" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M 115.5,126 q 14,-18 28,0" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    );
  if (eyes.type === "sad")
    return (
      <g id="eyes">
        <path d="M 56.5,120 q 14,11 28,0" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M 115.5,120 q 14,11 28,0" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    );
  return (
    <g id="eyes">
      <path d="M 57.5,122 L 83.5,122" stroke={C.ink} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M 116.5,122 L 142.5,122" stroke={C.ink} strokeWidth="4.5" fill="none" strokeLinecap="round" />
    </g>
  );
};

const MOUTH = {
  wavy: { d: "M 89,142 q 5.5,6 11,0 q 5.5,6 11,0", stroke: true },
  sad: { d: "M 91,145 q 4.5,-5 9,0 q 4.5,-5 9,0", stroke: true },
  open: { d: "M 90,140 q 10,12 20,0 Z", stroke: false },
  bigopen: { d: "M 87,139 q 13,16 26,0 Z", stroke: false },
};

const Head = ({ pose }) => {
  const m = MOUTH[pose.mouth];
  return (
    <g id="head" transform={`translate(0,${pose.headDy || 0}) rotate(${pose.headRotate || 0} 100 103)`}>
      <Ears />
      <ellipse id="face" cx="100" cy="103" rx="65" ry="56" fill={C.fur} />
      <Brows type={pose.brows} />
      <Eyes eyes={pose.eyes} />
      {pose.cheeks && (
        <g id="cheeks">
          <ellipse cx="51" cy="135" rx="9" ry="5.5" fill={C.cheek} opacity="0.85" />
          <ellipse cx="149" cy="135" rx="9" ry="5.5" fill={C.cheek} opacity="0.85" />
        </g>
      )}
      {m.stroke ? (
        <path id="mouth" d={m.d} stroke={C.mouth} strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path id="mouth" d={m.d} fill={C.mouthIn} />
      )}
    </g>
  );
};

/* ---------- 小物・エフェクト ---------- */

const Note = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={C.gold}>
    <circle cx="0" cy="26" r="6" />
    <rect x="4.5" y="-4" width="3" height="30" rx="1.5" />
    <path d="M 7.5,-4 q 12,3 10,15 q -2,-7 -10,-8 Z" />
  </g>
);

const Mug = () => (
  <g id="mug">
    <rect x="86" y="178" width="28" height="24" rx="5" fill="#FFF" stroke={C.mouth} strokeWidth="2.8" />
    <path d="M 114,184 q 12,6 0,13" stroke={C.mouth} strokeWidth="2.8" fill="none" />
    <path id="steam1" d="M 94,172 q 3,-5 0,-10" stroke={C.steam} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path id="steam2" d="M 104,172 q -3,-5 0,-10" stroke={C.steam} strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </g>
);

const BigNote = () => (
  <g id="bignote" transform="rotate(10 96 150)">
    <Note x={80} y={118} s={1.8} />
  </g>
);

const Sheet = () => (
  <g id="sheet" transform="rotate(-8 38 106) translate(0,-12)">
    <rect x="16" y="96" width="42" height="52" rx="4" fill="#FFF" stroke={C.mouth} strokeWidth="2.5" />
    <path d="M 22,108 h 30 M 22,118 h 30 M 22,128 h 30 M 22,138 h 30" stroke={C.gray} strokeWidth="1.6" />
    <circle cx="34" cy="116" r="2.6" fill={C.furDark} />
    <circle cx="44" cy="126" r="2.6" fill={C.furDark} />
  </g>
);

const PROPS = { mug: Mug, bignote: BigNote, sheet: Sheet };

function Effects({ fx }) {
  if (!fx) return null;
  return (
    <g id="fx">
      {fx.notes?.map((n, i) => <Note key={`n${i}`} x={n[0]} y={n[1]} s={n[2] ?? 1} />)}
      {fx.sparks?.map((p, i) => (
        <path key={`s${i}`} d={`M ${p[0]},${p[1]} l 6,6 M ${p[0] + 6},${p[1]} l -6,6`} stroke={C.gold} strokeWidth="3" fill="none" strokeLinecap="round" />
      ))}
      {fx.swoosh && <path d={fx.swoosh} stroke={C.gold} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {fx.dots && (
        <g fill={C.gray}>
          <circle cx={fx.dots[0]} cy={fx.dots[1]} r="3" />
          <circle cx={fx.dots[0] + 10} cy={fx.dots[1]} r="3" />
          <circle cx={fx.dots[0] + 20} cy={fx.dots[1]} r="3" />
        </g>
      )}
      {fx.tear && <path d={`M ${fx.tear[0]},${fx.tear[1]} q 9,11 0,18 q -9,-7 0,-18 Z`} fill={C.tear} />}
      {fx.lines?.map((d, i) => (
        <path key={`l${i}`} d={d} stroke={C.gray} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ))}
      {fx.confetti?.map((c, i) => (
        <rect key={`c${i}`} x={c[0]} y={c[1]} width="8" height="5" rx="1.5" fill={c[3]} transform={`rotate(${c[2]} ${c[0]} ${c[1]})`} />
      ))}
      {fx.zzz && (
        <g fill={C.gold} fontWeight="bold">
          <text x="150" y="60" fontSize="14">z</text>
          <text x="163" y="48" fontSize="11">z</text>
          <text x="176" y="36" fontSize="8">z</text>
        </g>
      )}
      {fx.bang && (
        <g>
          <path d={`M ${fx.bang[0]},${fx.bang[1]} L ${fx.bang[0]},${fx.bang[1] + 14}`} stroke={C.gold} strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx={fx.bang[0]} cy={fx.bang[1] + 22} r="3" fill={C.gold} />
        </g>
      )}
      {fx.question && (
        <g>
          <path d="M 158,44 q 12,-10 20,0 q 6,8 -6,14 q -4,2 -4,8" stroke={C.gold} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="168" cy="74" r="3" fill={C.gold} />
        </g>
      )}
    </g>
  );
}

/* ---------- 共有腕パス ---------- */

const AL = {
  std: "M 70.0,150.1 L 55.4,157.4 C 51.1,159.9 49.6,165.4 52.1,169.7 C 54.6,174.0 60.1,175.5 64.4,173.0 L 78.0,163.9 C 81.8,161.7 83.1,156.8 80.9,153.0 C 78.7,149.2 73.8,147.9 70.0,150.1 Z",
  up: "M 78.3,150.3 L 65.2,140.6 C 61.0,137.9 55.4,139.2 52.7,143.3 C 50.0,147.5 51.3,153.1 55.4,155.8 L 69.7,163.7 C 73.4,166.1 78.3,165.0 80.7,161.3 C 83.1,157.6 82.0,152.7 78.3,150.3 Z",
  down: "M 68.7,151.0 L 55.8,161.1 C 52.1,164.4 51.8,170.0 55.1,173.8 C 58.4,177.5 64.0,177.8 67.8,174.5 L 79.3,163.0 C 82.6,160.1 82.9,155.0 80.0,151.7 C 77.1,148.4 72.0,148.1 68.7,151.0 Z",
  droop: "M 67.4,152.5 L 57.4,165.3 C 54.6,169.4 55.6,175.0 59.7,177.8 C 63.8,180.6 69.4,179.6 72.2,175.5 L 80.6,161.5 C 83.1,157.9 82.2,152.9 78.5,150.4 C 74.9,147.9 69.9,148.8 67.4,152.5 Z",
  jump: "M 78.5,138.4 L 65.7,128.4 C 61.6,125.6 56.0,126.6 53.2,130.7 C 50.4,134.8 51.4,140.4 55.5,143.2 L 69.5,151.6 C 73.1,154.1 78.1,153.2 80.6,149.5 C 83.1,145.9 82.2,140.9 78.5,138.4 Z",
  sitL: "M 66.4,173.6 L 70.8,189.3 C 72.4,194.0 77.5,196.5 82.2,194.9 C 86.9,193.3 89.4,188.2 87.8,183.5 L 81.6,168.4 C 80.1,164.2 75.6,162.0 71.4,163.4 C 67.2,164.9 65.0,169.4 66.4,173.6 Z",
  sitR: "M 118.4,168.4 L 112.2,183.5 C 110.6,188.2 113.1,193.3 117.8,194.9 C 122.5,196.5 127.6,194.0 129.2,189.3 L 133.6,173.6 C 135.0,169.4 132.8,164.9 128.6,163.4 C 124.4,162.0 119.9,164.2 118.4,168.4 Z",
};

const BOW_BACK = { stick: "M 152.0,208.4 Q 95.0,179.4 34.8,151.7", hair: "M 154.18,203.90 Q 97.18,174.90 36.98,147.20", frog: [147.0, 201.4] };
const BOW_BACK2 = { stick: "M 152.0,209.7 Q 95.0,180.7 35.5,153.1", hair: "M 154.18,205.20 Q 97.18,176.20 37.68,148.60", frog: [147.0, 202.7] };
const BOW_BACK3 = { stick: "M 154.0,209.7 Q 96.0,180.7 33.5,153.1", hair: "M 156.13,205.17 Q 98.13,176.17 35.63,148.57", frog: [149.0, 202.7] };

/* ---------- 全30ポーズ ---------- */

export const POSES = [
  /* --- 指差しガイド --- */
  { id: "01A", label: "斜め上を指す", cat: "指差し", anim: "point", wave: true,
    arms: [AL.std, "M 130.5,163.6 L 144.5,155.2 C 148.6,152.4 149.6,146.8 146.8,142.7 C 144.0,138.6 138.4,137.6 134.3,140.4 L 121.5,150.4 C 117.8,152.9 116.9,157.9 119.4,161.5 C 121.9,165.2 126.9,166.1 130.5,163.6 Z"],
    hand: [139.4, 147.8],
    bow: { stick: "M 59.9,165.2 Q 21.5,142.8 -18.3,119.1", hair: "M 62.44,160.89 Q 24.04,138.49 -15.76,114.79", frog: [54.9, 158.2] },
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "wavy",
    fx: { notes: [[178, 26, 1]] } },

  { id: "01B", label: "横を指す", cat: "指差し", anim: "point", wave: true,
    arms: [AL.std, "M 126.3,165.0 L 142.6,165.4 C 147.6,165.2 151.5,161.0 151.3,156.1 C 151.1,151.1 146.9,147.2 142.0,147.4 L 125.7,149.0 C 121.3,149.2 117.8,152.9 118.0,157.3 C 118.2,161.7 121.9,165.2 126.3,165.0 Z"],
    hand: [142.3, 156.4],
    bow: { stick: "M 59.9,165.2 Q 33.9,162.6 7.9,158.6", hair: "M 60.53,160.24 Q 34.53,157.64 8.53,153.64", frog: [54.9, 158.2] },
    brows: "normal", eyes: { type: "open", cx: [73.5, 132.5], cy: 122 }, cheeks: true, mouth: "wavy",
    fx: { notes: [[186, 96, 0.9]] } },

  { id: "01C", label: "真上を掲げて指す", cat: "指差し", anim: "point", wave: true,
    arms: ["M 69.1,150.7 L 55.6,159.8 C 51.7,162.8 50.9,168.4 54.0,172.4 C 57.0,176.3 62.6,177.1 66.6,174.0 L 78.9,163.3 C 82.4,160.7 83.0,155.6 80.3,152.1 C 77.7,148.6 72.6,148.0 69.1,150.7 Z", "M 131.3,163.0 L 144.2,153.1 C 148.0,149.8 148.4,144.1 145.1,140.4 C 141.8,136.6 136.1,136.2 132.4,139.5 L 120.7,151.0 C 117.4,153.9 117.1,158.9 120.0,162.3 C 122.9,165.6 127.9,165.9 131.3,163.0 Z"],
    hand: [138.3, 146.3],
    bow: { stick: "M 61.1,166.9 Q 41.5,134.0 25.0,101.0", hair: "M 65.49,164.50 Q 45.89,131.60 29.39,98.60", frog: [56.1, 159.9] },
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 119 }, cheeks: true, mouth: "wavy",
    fx: { notes: [[170, 14, 0.9]] } },

  /* --- 喜び --- */
  { id: "02A", label: "両手上げジャンプ", cat: "喜び", anim: "hop", bodyDy: -12, headDy: -12,
    arms: [AL.jump, "M 130.6,151.6 L 144.5,143.1 C 148.6,140.3 149.6,134.7 146.8,130.6 C 144.0,126.5 138.4,125.5 134.3,128.3 L 121.4,138.4 C 117.8,140.9 116.9,145.9 119.4,149.6 C 121.9,153.2 126.9,154.1 130.6,151.6 Z"],
    hand: [139.4, 135.7],
    bow: { stick: "M 60.6,135.8 Q 36.8,104.2 25.0,72.5", hair: "M 64.96,133.35 Q 41.16,101.75 29.36,70.05", frog: [55.6, 128.8] },
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "open",
    fx: { sparks: [[30, 44], [178, 150]] } },

  { id: "02B", label: "ダブルガッツ", cat: "喜び", anim: "hop", bowFirst: true,
    arms: ["M 79.0,150.7 L 66.8,139.8 C 62.9,136.8 57.2,137.4 54.1,141.3 C 51.1,145.2 51.7,150.9 55.6,154.0 L 69.0,163.3 C 72.5,166.0 77.5,165.4 80.3,162.0 C 83.0,158.5 82.4,153.5 79.0,150.7 Z", "M 131.0,163.3 L 144.4,154.0 C 148.3,150.9 148.9,145.2 145.9,141.3 C 142.8,137.4 137.1,136.8 133.2,139.8 L 121.0,150.7 C 117.6,153.5 117.0,158.5 119.7,162.0 C 122.5,165.4 127.5,166.0 131.0,163.3 Z"],
    hand: [138.8, 146.9], bow: BOW_BACK,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "bigopen",
    fx: { sparks: [[36, 60], [166, 52]] } },

  { id: "02C", label: "両手ほっぺ", cat: "喜び", anim: "squeeze", bowFirst: true,
    arms: ["M 81.1,153.4 L 74.6,138.4 C 72.4,134.0 66.9,132.2 62.5,134.5 C 58.1,136.7 56.3,142.2 58.6,146.6 L 66.9,160.6 C 68.9,164.6 73.7,166.1 77.6,164.1 C 81.6,162.1 83.1,157.3 81.1,153.4 Z", "M 133.2,160.5 L 141.2,146.2 C 143.4,141.7 141.5,136.4 137.0,134.2 C 132.5,132.0 127.2,133.9 125.0,138.4 L 118.8,153.5 C 116.9,157.5 118.5,162.3 122.5,164.2 C 126.5,166.1 131.3,164.5 133.2,160.5 Z"],
    hand: [133.1, 142.3],
    bow: { stick: "M 24.0,216.3 Q 18.0,186.0 21.5,157.0", hair: "M 29.00,216.09 Q 23.00,185.79 26.50,156.79", frog: [19.0, 209.3] },
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "wavy",
    fx: { notes: [[30, 50, 1], [168, 40, 0.8]], sparks: [[50, 150]] } },

  /* --- 励まし --- */
  { id: "03A", label: "片腕突き上げ", cat: "励まし", anim: "punch", wave: true, bowFirst: true,
    arms: ["M 70.4,149.8 L 55.4,156.3 C 50.9,158.5 49.1,163.9 51.4,168.3 C 53.6,172.8 59.0,174.6 63.4,172.3 L 77.6,164.2 C 81.5,162.2 83.1,157.4 81.2,153.4 C 79.2,149.5 74.4,147.9 70.4,149.8 Z", "M 131.2,163.1 L 144.2,153.2 C 148.0,150.0 148.5,144.3 145.2,140.6 C 142.0,136.8 136.3,136.3 132.6,139.6 L 120.8,150.9 C 117.4,153.8 117.0,158.8 119.9,162.2 C 122.8,165.6 127.8,166.0 131.2,163.1 Z"],
    hand: [138.4, 146.4], bow: BOW_BACK3,
    brows: "fierce", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "wavy",
    fx: { swoosh: "M 178,48 q 10,2 8,12" } },

  { id: "03B", label: "弓を振って応援", cat: "励まし", anim: "wave", wave: true,
    arms: [AL.std, "M 130.3,163.7 L 144.6,155.8 C 148.7,153.1 150.0,147.5 147.3,143.3 C 144.6,139.2 139.0,137.9 134.8,140.6 L 121.7,150.3 C 118.0,152.7 116.9,157.6 119.3,161.3 C 121.7,165.0 126.6,166.1 130.3,163.7 Z"],
    hand: [139.7, 148.2],
    bow: { stick: "M 59.9,165.2 Q 19.5,142.8 -15.6,116.5", hair: "M 62.61,161.00 Q 22.21,138.60 -12.89,112.30", frog: [54.9, 158.2] },
    brows: "fierce", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "open",
    fx: { lines: ["M 176,26 q 8,-6 16,-2", "M 174,35 q 9,-6 18,-2"] } },

  { id: "03C", label: "前傾ファイト", cat: "励まし", anim: "push", bowFirst: true, rootRotate: -8,
    arms: ["M 76.0,164.8 L 92.0,161.7 C 96.8,160.5 99.7,155.6 98.5,150.8 C 97.3,146.0 92.4,143.1 87.6,144.3 L 72.0,149.2 C 67.8,150.3 65.2,154.7 66.2,159.0 C 67.3,163.2 71.7,165.8 76.0,164.8 Z", "M 127.9,149.2 L 112.4,144.4 C 107.5,143.2 102.7,146.1 101.5,150.9 C 100.3,155.8 103.2,160.6 108.0,161.8 L 124.1,164.8 C 128.4,165.8 132.7,163.2 133.8,158.9 C 134.8,154.6 132.2,150.3 127.9,149.2 Z"],
    hand: [110.2, 153.1],
    bow: { stick: "M 142.0,204.5 Q 96.0,178.1 47.5,153.1", hair: "M 144.39,200.11 Q 98.39,173.71 49.89,148.71", frog: [137.0, 197.5] },
    brows: "fierce", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "wavy",
    fxOutside: { sparks: [[172, 56]] } },

  /* --- しょんぼり --- */
  { id: "04A", label: "うつむき", cat: "しょんぼり", anim: "droop", headDy: 10,
    arms: [AL.droop, "M 119.4,161.5 L 127.8,175.5 C 130.6,179.6 136.2,180.6 140.3,177.8 C 144.4,175.0 145.4,169.4 142.6,165.3 L 132.6,152.5 C 130.1,148.8 125.1,147.9 121.5,150.4 C 117.8,152.9 116.9,157.9 119.4,161.5 Z"],
    hand: [135.2, 170.4],
    bow: { stick: "M 120,216 Q 156,210 192,204", hair: "M 120.82,220.93 Q 156.82,214.93 192.82,208.93", frog: [115, 209] },
    brows: "sad", eyes: { type: "sad" }, cheeks: false, mouth: "sad",
    fx: { tear: [160, 62] } },

  { id: "04B", label: "座り込み", cat: "しょんぼり", anim: "droop", bodyDy: 14, headDy: 24,
    arms: ["M 68.0,165.7 L 56.5,177.4 C 53.2,181.1 53.6,186.8 57.4,190.1 C 61.1,193.4 66.8,193.0 70.1,189.2 L 80.0,176.3 C 82.9,172.9 82.6,167.9 79.3,165.0 C 75.9,162.1 70.9,162.4 68.0,165.7 Z", "M 120.0,176.3 L 129.9,189.2 C 133.2,193.0 138.9,193.4 142.6,190.1 C 146.4,186.8 146.8,181.1 143.5,177.4 L 132.0,165.7 C 129.1,162.4 124.1,162.1 120.7,165.0 C 117.4,167.9 117.1,172.9 120.0,176.3 Z"],
    hand: [136.7, 183.3],
    bow: { stick: "M 66,232 Q 110,228 154,226", hair: "M 66.34,236.99 Q 110.34,232.99 154.34,230.99", frog: [61, 225] },
    brows: "sad", eyes: { type: "sad" }, cheeks: false, mouth: "sad",
    fx: { tear: [158, 70] } },

  { id: "04C", label: "弓を杖にがっくり", cat: "しょんぼり", anim: "droop", headDy: 8,
    arms: [AL.droop, "M 126.9,164.9 L 143.2,164.0 C 148.2,163.5 151.7,159.0 151.1,154.1 C 150.6,149.1 146.1,145.6 141.2,146.2 L 125.1,149.1 C 120.7,149.6 117.5,153.5 118.1,157.9 C 118.6,162.3 122.5,165.5 126.9,164.9 Z"],
    hand: [142.2, 155.1],
    bow: { stick: "M 64.8,170.4 Q 66.8,148.0 69.0,109.8", hair: "M 69.79,170.75 Q 71.79,148.35 73.99,110.15", frog: [59.8, 163.4] },
    brows: "normal", eyes: { type: "flat" }, cheeks: false, mouth: "sad",
    fx: { tear: [52, 70] } },

  /* --- 説明・レッスン --- */
  { id: "05A", label: "弓を両手で構える", cat: "説明", anim: "breathe",
    arms: ["M 74.0,149.0 L 57.7,148.0 C 52.7,148.0 48.7,152.0 48.7,157.0 C 48.7,162.0 52.7,166.0 57.7,166.0 L 74.0,165.0 C 78.4,165.0 82.0,161.4 82.0,157.0 C 82.0,152.6 78.4,149.0 74.0,149.0 Z", "M 126.0,165.0 L 142.3,166.0 C 147.3,166.0 151.3,162.0 151.3,157.0 C 151.3,152.0 147.3,148.0 142.3,148.0 L 126.0,149.0 C 121.6,149.0 118.0,152.6 118.0,157.0 C 118.0,161.4 121.6,165.0 126.0,165.0 Z"],
    hand: null,
    bow: { stick: "M 142.3,157.0 Q 80.3,151.7 12.3,153.0", hair: "M 142.45,152.00 Q 80.45,146.70 12.45,148.00", frog: [137.3, 150.0] },
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "open" },

  { id: "05B", label: "ここポイント！", cat: "説明", anim: "point", wave: true, bowFirst: true,
    arms: [AL.std, "M 131.2,163.1 L 144.2,153.2 C 148.0,150.0 148.5,144.3 145.2,140.6 C 142.0,136.8 136.3,136.3 132.6,139.6 L 120.8,150.9 C 117.4,153.8 117.0,158.8 119.9,162.2 C 122.8,165.6 127.8,166.0 131.2,163.1 Z"],
    hand: [138.4, 146.4], bow: BOW_BACK3,
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "open",
    fx: { bang: [170, 74] } },

  { id: "05C", label: "楽譜を見せる", cat: "説明", anim: "breathe", prop: "sheet",
    arms: ["M 79.0,150.8 L 67.0,139.7 C 63.1,136.6 57.4,137.2 54.3,141.0 C 51.2,144.9 51.8,150.6 55.6,153.7 L 69.0,163.2 C 72.4,166.0 77.4,165.5 80.2,162.0 C 83.0,158.6 82.5,153.6 79.0,150.8 Z", "M 121.5,163.6 L 134.3,173.6 C 138.4,176.4 144.0,175.4 146.8,171.3 C 149.6,167.2 148.6,161.6 144.5,158.8 L 130.5,150.4 C 126.9,147.9 121.9,148.8 119.4,152.5 C 116.9,156.1 117.8,161.1 121.5,163.6 Z"],
    hand: null,
    bow: { stick: "M 139.4,166.2 Q 145.4,117.4 161.6,68.7", hair: "M 144.28,167.31 Q 150.28,118.51 166.48,69.81", frog: [134.4, 159.2] },
    brows: "normal", eyes: { type: "open", cx: [67.5, 126.5], cy: 123 }, cheeks: true, mouth: "wavy" },

  /* --- 拍手・称賛 --- */
  { id: "06A", label: "両手ぱちぱち", cat: "称賛", anim: "clap", bowFirst: true,
    arms: ["M 75.6,164.8 L 91.8,162.6 C 96.6,161.7 99.8,156.9 98.8,152.0 C 97.9,147.2 93.1,144.0 88.2,145.0 L 72.4,149.2 C 68.1,150.0 65.3,154.2 66.2,158.6 C 67.0,162.9 71.2,165.7 75.6,164.8 Z", "M 127.5,149.1 L 111.7,145.1 C 106.8,144.1 102.1,147.3 101.2,152.2 C 100.2,157.1 103.4,161.8 108.3,162.7 L 124.5,164.9 C 128.8,165.7 133.0,162.9 133.9,158.5 C 134.7,154.2 131.9,150.0 127.5,149.1 Z"],
    hand: null, bow: BOW_BACK,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "open",
    fx: { lines: ["M 66,150 q -9,-5 -11,-13", "M 62,158 q -9,-2 -13,-8", "M 132,150 q 9,-5 11,-13", "M 136,158 q 9,-2 13,-8"] } },

  { id: "06B", label: "紙吹雪ブラボー", cat: "称賛", anim: "hop", bowFirst: true,
    arms: ["M 77.5,149.8 L 63.4,141.7 C 58.9,139.5 53.5,141.4 51.3,145.8 C 49.1,150.3 51.0,155.7 55.4,157.9 L 70.5,164.2 C 74.4,166.1 79.2,164.5 81.2,160.5 C 83.1,156.6 81.5,151.8 77.5,149.8 Z", "M 129.6,164.2 L 144.6,157.7 C 149.1,155.5 150.9,150.1 148.6,145.7 C 146.4,141.2 141.0,139.4 136.6,141.7 L 122.4,149.8 C 118.5,151.8 116.9,156.6 118.8,160.6 C 120.8,164.5 125.6,166.1 129.6,164.2 Z"],
    hand: [140.6, 149.7], bow: BOW_BACK2,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "bigopen",
    fx: { confetti: [[30, 50, 0, "#F7C948"], [60, 30, 47, "#F79E8D"], [150, 34, 4, "#8FC7E8"], [176, 58, 51, "#A8D08D"], [44, 90, 8, "#F7C948"], [168, 96, 55, "#F79E8D"]] } },

  { id: "06C", label: "片手あっぱれ", cat: "称賛", anim: "point", wave: true, bowFirst: true,
    arms: ["M 67.3,161.4 L 75.5,175.6 C 78.2,179.7 83.8,180.8 88.0,178.1 C 92.1,175.4 93.2,169.8 90.5,165.6 L 80.7,152.6 C 78.2,148.9 73.3,147.9 69.6,150.3 C 65.9,152.8 64.9,157.7 67.3,161.4 Z", "M 131.2,163.1 L 144.2,153.2 C 148.0,150.0 148.5,144.3 145.2,140.6 C 142.0,136.8 136.3,136.3 132.6,139.6 L 120.8,150.9 C 117.4,153.8 117.0,158.8 119.9,162.2 C 122.8,165.6 127.8,166.0 131.2,163.1 Z"],
    hand: [138.4, 146.4], bow: BOW_BACK3,
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "wavy",
    fx: { sparks: [[172, 54]], notes: [[28, 48, 0.8]] } },

  /* --- 考える・分析 --- */
  { id: "07A", label: "あごに手", cat: "考える", anim: "think", bowFirst: true,
    arms: [AL.std, "M 133.4,154.0 L 128.2,138.5 C 126.4,133.9 121.1,131.7 116.5,133.6 C 111.9,135.4 109.7,140.7 111.6,145.3 L 118.6,160.0 C 120.2,164.1 124.9,166.1 129.0,164.4 C 133.1,162.8 135.1,158.1 133.4,154.0 Z"],
    hand: [119.9, 141.9], bow: BOW_BACK,
    brows: "normal", eyes: { type: "open", cx: [66.5, 125.5], cy: 119 }, cheeks: false, mouth: "wavy",
    fx: { dots: [148, 52] } },

  { id: "07B", label: "首かしげ", cat: "考える", anim: "tilt", bowFirst: true, headRotate: -10,
    arms: [AL.down, "M 120.7,163.0 L 132.2,174.5 C 136.0,177.8 141.6,177.5 144.9,173.8 C 148.2,170.0 147.9,164.4 144.2,161.1 L 131.3,151.0 C 128.0,148.1 122.9,148.4 120.0,151.7 C 117.1,155.0 117.4,160.1 120.7,163.0 Z"],
    hand: [138.2, 167.8], bow: BOW_BACK,
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: false, mouth: "wavy",
    fx: { question: true } },

  { id: "07C", label: "弓をあごに熟考", cat: "考える", anim: "think",
    arms: [AL.down, "M 132.8,152.8 L 125.2,138.4 C 122.6,134.2 117.0,132.8 112.8,135.4 C 108.6,138.0 107.2,143.6 109.8,147.8 L 119.2,161.2 C 121.5,164.9 126.4,166.1 130.2,163.8 C 133.9,161.5 135.1,156.6 132.8,152.8 Z"],
    hand: [117.5, 143.1],
    bow: { stick: "M 61.8,167.8 Q 65.8,144.0 68.6,115.0", hair: "M 66.76,168.44 Q 70.76,144.64 73.56,115.64", frog: [56.8, 160.8] },
    brows: "normal", eyes: { type: "flat" }, cheeks: false, mouth: "wavy",
    fx: { dots: [150, 52] } },

  /* --- 見守り・リズム --- */
  { id: "08A", label: "両手ふりふり", cat: "見守り", anim: "sway", bowFirst: true,
    arms: [AL.up, "M 130.4,163.7 L 144.6,155.6 C 148.8,152.9 150.0,147.4 147.2,143.2 C 144.5,139.0 139.0,137.8 134.8,140.6 L 121.6,150.3 C 117.9,152.7 116.9,157.7 119.3,161.4 C 121.7,165.1 126.7,166.1 130.4,163.7 Z"],
    hand: [139.7, 148.1], bow: BOW_BACK2,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "open",
    fx: { lines: ["M 24,102 q 8,-6 16,-2", "M 22,111 q 9,-6 18,-2", "M 160,102 q 8,-6 16,-2", "M 158,111 q 9,-6 18,-2"] } },

  { id: "08B", label: "座ってうっとり", cat: "見守り", anim: "breathe", bodyDy: 14, headDy: 14,
    arms: [AL.sitL, AL.sitR], hand: [120.7, 186.4], bow: null,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "wavy",
    fxOutside: { notes: [[30, 54, 1], [166, 42, 0.8]] } },

  { id: "08C", label: "リズムにのる", cat: "見守り", anim: "rhythm", bowFirst: true, rootRotate: 8,
    arms: ["M 77.1,149.6 L 62.5,142.4 C 57.9,140.5 52.6,142.6 50.7,147.2 C 48.8,151.8 50.9,157.1 55.5,159.0 L 70.9,164.4 C 75.0,166.1 79.7,164.2 81.4,160.1 C 83.1,156.0 81.2,151.3 77.1,149.6 Z", "M 124.3,164.8 L 140.0,169.2 C 144.9,170.2 149.7,167.1 150.7,162.3 C 151.7,157.4 148.6,152.6 143.8,151.6 L 127.7,149.2 C 123.4,148.3 119.1,151.0 118.2,155.3 C 117.3,159.6 120.0,163.9 124.3,164.8 Z"],
    hand: [141.9, 160.4], bow: BOW_BACK2,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "wavy",
    fxOutside: { notes: [[26, 60, 0.8], [170, 44, 1]] } },

  /* --- 挨拶・登場 --- */
  { id: "09A", label: "ぺこりお辞儀", cat: "挨拶", anim: "bow", bowFirst: true, rootRotate: -14,
    arms: ["M 67.6,152.2 L 57.0,164.6 C 54.0,168.6 54.8,174.2 58.8,177.2 C 62.8,180.2 68.4,179.4 71.4,175.4 L 80.4,161.8 C 83.0,158.3 82.3,153.3 78.8,150.6 C 75.3,148.0 70.3,148.7 67.6,152.2 Z", "M 119.6,161.8 L 128.6,175.4 C 131.6,179.4 137.2,180.2 141.2,177.2 C 145.2,174.2 146.0,168.6 143.0,164.6 L 132.4,152.2 C 129.7,148.7 124.7,148.0 121.2,150.6 C 117.7,153.3 117.0,158.3 119.6,161.8 Z"],
    hand: [135.8, 170.0], bow: BOW_BACK2,
    brows: "normal", eyes: { type: "flat" }, cheeks: true, mouth: "wavy" },

  { id: "09B", label: "手をふって挨拶", cat: "挨拶", anim: "wave", wave: true,
    arms: ["M 78.3,150.2 L 65.0,140.7 C 60.8,138.0 55.2,139.3 52.6,143.5 C 49.9,147.7 51.2,153.3 55.4,155.9 L 69.7,163.8 C 73.5,166.1 78.4,165.0 80.8,161.3 C 83.1,157.5 82.0,152.6 78.3,150.2 Z", "M 121.6,163.7 L 134.8,173.4 C 139.0,176.2 144.5,175.0 147.2,170.8 C 150.0,166.6 148.8,161.1 144.6,158.4 L 130.4,150.3 C 126.7,147.9 121.7,148.9 119.3,152.6 C 116.9,156.3 117.9,161.3 121.6,163.7 Z"],
    hand: [139.7, 165.9],
    bow: { stick: "M 60.2,148.3 Q 54.2,99.5 38.0,50.8", hair: "M 65.08,147.19 Q 59.08,98.39 42.88,49.69", frog: [55.2, 141.3] },
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "open",
    fx: { lines: ["M 22,104 q 8,-6 16,-2", "M 20,113 q 9,-6 18,-2"] } },

  { id: "09C", label: "ジャンプ登場", cat: "挨拶", anim: "hop", bodyDy: -12, headDy: -12,
    arms: [AL.jump, "M 121.8,151.8 L 135.0,161.2 C 139.3,163.9 144.8,162.6 147.4,158.4 C 150.1,154.1 148.8,148.6 144.6,146.0 L 130.2,138.2 C 126.5,135.9 121.5,137.0 119.2,140.8 C 116.9,144.5 118.0,149.5 121.8,151.8 Z"],
    hand: [139.8, 153.6],
    bow: { stick: "M 60.6,135.8 Q 54.6,88.3 37.6,39.5", hair: "M 65.46,134.64 Q 59.46,87.14 42.46,38.34", frog: [55.6, 128.8] },
    brows: "normal", eyes: { type: "open", cx: [70.5, 129.5], cy: 122 }, cheeks: true, mouth: "bigopen",
    fx: { sparks: [[30, 40], [176, 44]] } },

  /* --- 休憩・おやすみ --- */
  { id: "10A", label: "マグでひと息", cat: "休憩", anim: "breathe", bodyDy: 14, headDy: 14, prop: "mug",
    arms: ["M 66.5,173.9 L 71.4,189.4 C 73.2,194.1 78.4,196.4 83.0,194.6 C 87.7,192.8 90.0,187.6 88.2,183.0 L 81.5,168.1 C 79.9,164.0 75.3,162.0 71.1,163.5 C 67.0,165.1 65.0,169.7 66.5,173.9 Z", "M 118.5,168.1 L 111.8,183.0 C 110.0,187.6 112.3,192.8 117.0,194.6 C 121.6,196.4 126.8,194.1 128.6,189.4 L 133.5,173.9 C 135.0,169.7 133.0,165.1 128.9,163.5 C 124.7,162.0 120.1,164.0 118.5,168.1 Z"],
    hand: null,
    bow: { stick: "M 44,232 Q 90,230 136,228", hair: "M 44.22,237.00 Q 90.22,235.00 136.22,233.00", frog: [39, 225] },
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "wavy" },

  { id: "10B", label: "おやすみzzz", cat: "休憩", anim: "sleep", bodyDy: 14, headDy: 14,
    arms: [AL.sitL, AL.sitR], hand: [120.7, 186.4], bow: null,
    brows: "normal", eyes: { type: "flat" }, cheeks: true, mouth: "wavy",
    fxOutside: { zzz: true } },

  { id: "10C", label: "音符をぎゅっ", cat: "休憩", anim: "squeeze", propFirst: "bignote",
    arms: ["M 69.4,163.5 L 82.1,173.7 C 86.2,176.6 91.8,175.7 94.6,171.6 C 97.5,167.5 96.6,161.9 92.5,159.1 L 78.6,150.5 C 75.0,147.9 70.0,148.8 67.5,152.4 C 64.9,156.0 65.8,161.0 69.4,163.5 Z", "M 121.5,150.4 L 107.4,158.8 C 103.3,161.6 102.3,167.2 105.1,171.3 C 107.9,175.4 113.5,176.4 117.6,173.6 L 130.5,163.6 C 134.2,161.1 135.1,156.1 132.6,152.5 C 130.1,148.8 125.1,147.9 121.5,150.4 Z"],
    hand: null, bow: null,
    brows: "happy", eyes: { type: "happy" }, cheeks: true, mouth: "wavy",
    fx: { sparks: [[34, 60], [168, 56]] } },
];

/* ---------- モーション ---------- */

const STYLES = `
  [data-arco] g, [data-arco] ellipse, [data-arco] circle, [data-arco] path, [data-arco] rect, [data-arco] text { transform-box: view-box; }
  @keyframes a-breathe { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-1.6px) scaleY(1.012)} }
  @keyframes a-blink   { 0%,92%,100%{transform:scaleY(1)} 95%{transform:scaleY(.08)} }
  @keyframes a-wave    { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(11deg)} }
  @keyframes a-float   { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-7px) rotate(8deg)} }
  @keyframes a-hop     { 0%,100%{transform:translateY(0) scaleY(1)} 30%{transform:translateY(-13px) scaleY(1.04)} 55%{transform:translateY(0) scaleY(.94)} 72%{transform:translateY(-4px) scaleY(1.01)} }
  @keyframes a-droop   { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(2px) rotate(-1.5deg)} }
  @keyframes a-tilt    { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-6deg)} }
  @keyframes a-clap    { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(.86)} }
  @keyframes a-sway    { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
  @keyframes a-rhythm  { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(3deg) translateY(-5px)} }
  @keyframes a-bowdown { 0%,100%{transform:rotate(0)} 40%,60%{transform:rotate(-7deg)} }
  @keyframes a-glow    { 0%,100%{opacity:.85; transform:scale(1)} 50%{opacity:1; transform:scale(1.18)} }
  @keyframes a-punch   { 0%,100%{transform:translate(0,0) rotate(0)} 45%{transform:translate(2px,-6px) rotate(6deg)} }
  @keyframes a-push    { 0%,100%{transform:translateX(0) scale(1)} 50%{transform:translateX(3px) scale(1.02)} }
  @keyframes a-squeeze { 0%,100%{transform:scale(1)} 50%{transform:scale(1.035)} }
  @keyframes a-sleep   { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(1.5px) scaleY(.985)} }
  @keyframes a-zzz     { 0%{transform:translateY(4px); opacity:.3} 50%{opacity:1} 100%{transform:translateY(-8px); opacity:0} }
  @keyframes a-steam   { 0%,100%{transform:translateY(0); opacity:.5} 50%{transform:translateY(-4px); opacity:1} }

  [data-arco] #eyes  { animation: a-blink 4.4s ease-in-out infinite; transform-origin: 100px 122px; }
  [data-arco] #fx-out{ animation: a-float 3.6s ease-in-out infinite; transform-origin: 100px 60px; }
  [data-arco] #mug #steam1, [data-arco] #mug #steam2 { animation: a-steam 2.4s ease-in-out infinite; transform-origin: 100px 168px; }

  [data-arco="breathe"] #root { animation: a-breathe 3.4s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="point"]   #root { animation: a-breathe 2.8s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="point"]   #waver { animation: a-wave 1.15s ease-in-out infinite; transform-origin: 78px 155px; }
  [data-arco="point"]   #fx   { animation: a-float 2s ease-in-out infinite; transform-origin: 170px 40px; }
  [data-arco="hop"]     #root { animation: a-hop .74s cubic-bezier(.34,1.56,.64,1) infinite; transform-origin: 100px 219px; }
  [data-arco="hop"]     #cheeks { animation: a-glow .74s ease-in-out infinite; transform-origin: 100px 135px; }
  [data-arco="droop"]   #root { animation: a-droop 4.8s ease-in-out infinite; transform-origin: 100px 219px; }
  [data-arco="droop"]   #eyes { animation: none; }
  [data-arco="think"]   #root { animation: a-breathe 4.2s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="think"]   #fx   { animation: a-glow 1.6s ease-in-out infinite; transform-origin: 158px 52px; }
  [data-arco="tilt"]    #root { animation: a-breathe 4.4s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="tilt"]    #head { animation: a-tilt 3.6s ease-in-out infinite; transform-origin: 100px 150px; }
  [data-arco="clap"]    #root { animation: a-breathe 1.5s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="clap"]    #arms { animation: a-clap .38s ease-in-out infinite; transform-origin: 100px 156px; }
  [data-arco="sway"]    #root { animation: a-sway 1.4s ease-in-out infinite; transform-origin: 100px 219px; }
  [data-arco="rhythm"]  #root { animation: a-rhythm .8s ease-in-out infinite; transform-origin: 100px 219px; }
  [data-arco="bow"]     #root { animation: a-bowdown 2.6s ease-in-out infinite; transform-origin: 100px 219px; }
  [data-arco="wave"]    #root { animation: a-breathe 3s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="wave"]    #waver { animation: a-wave .8s ease-in-out infinite; transform-origin: 78px 155px; }
  [data-arco="punch"]   #root { animation: a-breathe 2.4s ease-in-out infinite; transform-origin: 100px 215px; }
  [data-arco="punch"]   #waver { animation: a-punch .6s ease-in-out infinite; transform-origin: 78px 155px; }
  [data-arco="push"]    #root { animation: a-push 1.1s ease-in-out infinite; transform-origin: 100px 219px; }
  [data-arco="squeeze"] #root { animation: a-squeeze 1.8s ease-in-out infinite; transform-origin: 100px 219px; }
  [data-arco="squeeze"] #cheeks { animation: a-glow 1.8s ease-in-out infinite; transform-origin: 100px 135px; }
  [data-arco="sleep"]   #root { animation: a-sleep 4.5s ease-in-out infinite; transform-origin: 100px 233px; }
  [data-arco="sleep"]   #eyes { animation: none; }
  [data-arco="sleep"]   #fx-out { animation: a-zzz 2.6s ease-in-out infinite; transform-origin: 165px 48px; }

  [data-arco="static"] * { animation: none !important; }
  @media (prefers-reduced-motion: reduce) { [data-arco] * { animation: none !important; } }
`;

export function ArcoChan({ pose, playing = true }) {
  const p = pose;
  const PropFirst = p.propFirst ? PROPS[p.propFirst] : null;
  const Prop = p.prop ? PROPS[p.prop] : null;

  /* 振る手 = アルコ本人の右手 = 画面左側 = arms[0]（弓を持つ側）
     画面右側 = アルコの左手 = バイオリン側 → 常に固定。
     弓・指差しの手がどちら側にあるかは座標から自動判定し、
     振る手と同じ側にあるものだけ #waver に入れて一緒に動かす。 */
  const waving = !!p.wave;
  const CENTER = 100;

  const bowEl = p.bow ? <Bow bow={p.bow} /> : null;
  const bowOnWavingSide = !!(p.bow && p.bow.frog[0] < CENTER); // 画面左＝振る側
  const handOnWavingSide = !!(p.hand && p.hand[0] < CENTER);

  const bowInWaver = waving && bowEl && bowOnWavingSide;
  const bowStill = bowEl && !bowInWaver;

  const wavingArm = <ArmPath d={p.arms[0]} />;  // 画面左＝アルコの右手
  const stillArm = <ArmPath d={p.arms[1]} />;   // 画面右＝アルコの左手（バイオリン側）
  const handEl = <HandPoint at={p.hand} />;

  return (
    <svg viewBox="-45 -25 290 275" width="100%" height="100%" data-arco={playing ? p.anim : "static"} role="img" aria-label={`アルコちゃん：${p.label}`}>
      <style>{STYLES}</style>
      <g id="root" transform={p.rootRotate ? `rotate(${p.rootRotate} 100 186)` : undefined}>
        {p.bowFirst && bowStill && bowEl}
        <Body dy={p.bodyDy || 0} />
        {PropFirst && <PropFirst />}

        {waving ? (
          <>
            {/* 固定側：バイオリン側の手（画面右）と、そちらにある指差しの手・弓 */}
            <g id="arm-still">
              {!handOnWavingSide && handEl}
              {stillArm}
            </g>
            {Prop && <Prop />}
            {!p.bowFirst && bowStill && bowEl}
            {/* 振る側：アルコの右手（画面左）＋その手が持つ弓・指差しの手 */}
            <g id="waver">
              {handOnWavingSide && handEl}
              {wavingArm}
              {bowInWaver && bowEl}
            </g>
          </>
        ) : (
          <>
            {handEl}
            <g id="arms">
              {wavingArm}
              {stillArm}
            </g>
            {Prop && <Prop />}
            {!p.bowFirst && bowStill && bowEl}
          </>
        )}

        <Head pose={p} />
        {p.fx && <Effects fx={p.fx} />}
      </g>
      {p.fxOutside && (
        <g id="fx-out">
          <Effects fx={p.fxOutside} />
        </g>
      )}
    </svg>
  );
}

export default ArcoChan;
