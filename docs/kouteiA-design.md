# 工程A 実装設計書：analyze_musicxml 層1拡張（精密版）

作成: 2026-07-10 ／ 承認ゲート対象 ／ 根拠: 議事録§25/§26、検出方法設計書v1.1§2-1、spec§2-5/§3、決定6点(2026-07-10)

---

# 0. スコープ

**やること**
1. 全音符の「音符属性＋遷移属性」を事前計算し **musicxml_skill_info.json v3** に保存（層1）
2. 曲/教材単位の集約を **DBに自動投入**：pitchMin/pitchMax・Score.positions[]・ScoreKey（副次調）・FeatureTag M:N・技術タグ M:N（自動付与）
3. 既存288件（曲74＋教材214）の**再分析バッチ**

**やらないこと（明示的スコープ外）**
- comparison_result.json の変更（ガードレール・§26-2）
- analysis.json の構造変更（温存・v3.2 Q6）
- PracticeItem.positions(String[]) の Int[] 化（手動運用中・admin UI連動のため別小工程A-2に分離。自動抽出したポジションはJSONとScore.positionsのみに書く）
- PracticeItem.keyTonic の上書き（admin手動が正・既存ルール踏襲）
- スタッカート系曖昧記号の確認UI（工程G。本工程は仮付与＋要確認記録まで）
- 217小課題の判定（工程C。本工程はその入力データを作るだけ）

---

# 1. 出力スキーマ：note_karte.json（音符カルテ・旧 musicxml_skill_info.json v3）

【2026-07-10 Tetsuo決定】ファイル名を **note_karte.json** に改名（「カルテ」の直感に合わせる）。
- 新規解析は note_karte.json で保存。
- 読み手は「新名 → 無ければ旧名 musicxml_skill_info.json」のフォールバックで互換（288件バッチで全て新名化されるため旧名は保険）。
- 中身は skill_info v2 の全フィールド＋以下の拡張（読み手は `.get` 方式で後方互換）。

## 1-1. per-note フィールド（v2 からの追加分）

```
── 音符属性 ──
step             : "F" 等（音名文字。休符は null）
alter            : -1/0/+1（♭/なし/♯）
octave           : 5
midi             : 77（実音。ハーモニクスは実音=sounding pitch で別途 sounding_midi も保持）
duration_beats   : 拍単位の音価（duration/divisions × 4/拍子分母）
note_type        : "quarter"/"eighth"/"16th" 等（MusicXML type。無ければ duration から導出）
is_dotted        : bool
is_grace         : bool（装飾音符）
is_tuplet        : bool（time-modification あり）
beat_offset      : 小節内オフセット（拍単位・小数。0始まり）
beat_number      : 拍番号（1始まり整数）
is_on_beat       : bool（拍頭=オフセットの小数部が0）
is_chord         : bool（重音グループの代表音符）
chord_midis      : [77, 81] 等（グループ全構成音。単音は null）
chord_intervals  : ["3度"] 等（§25: 3音以上は隣接ペア分解。オクターブ還元なし）
is_slur_start    : bool
is_slur_end      : bool
technique_tags   : ["スタッカート"] 等（この音に係る正本13タグ名）
technique_ambiguous : bool（スタッカート系曖昧記号=仮付与。工程Gで確定）

── 遷移属性（単音のみ。重音・休符・曲頭は null）──
prev_note_index  : 遷移元（直前の“単音”。休符は透過・重音はチェーン不参加=セッション確定）
interval_degree  : 符号付き度数（+3=3度上行。音名文字数で算出）
interval_semitones : 符号付き半音数
string_from / string_to : "A"/"E" 等（解決済みの弦）
string_change_kind : "same"/"adjacent"/"skip"（同一弦/隣接移弦/弦飛ばし）
position_from / position_to : 手のポジション（開放弦は直前の手ポジを維持）
position_moved   : bool
prev_duration_beats : 音価変化の判定用
rest_before_beats  : 直前休符の合計拍（なければ 0）
```

## 1-2. piece-level メタ（skill_info v3 のトップに追加）

```
piece: {
  pitch_min / pitch_max   : MIDI（走査規則は §2-3）
  positions               : [1, 3] 等（解決済みポジションの distinct・昇順）
  sub_keys                : [{tonic:"G", mode:"major", sort_order:1}]（調号変更のみ・§2-4）
  feature_tags            : ["16分音符", "3度", ...]（付与された FeatureTag 名）
  technique_tags          : ["スラー", "スタッカート", ...]（正本13名）
  needs_confirmation      : [{measure_number, pattern:"staccato_outside_slur", note_indexes:[...]}]
                            （曖昧記号の要確認キュー。工程GのUIがここから読む）
  has_multiple_voices     : bool（§2-6 制限の検知結果）
}
version: 3
```

---

# 2. 抽出規則（精密）

## 2-1. note_index の整合（最重要インバリアント）
- 既存規約を踏襲: **休符は index を消費する／重音グループは代表1音のみ index を消費**（`<chord/>` 付き2音目以降はスキップ）。
- これは analysis.json（music21・重音は pitches[] に集約）と同じ数え方 → **層1×層2×analysis の3者が同一 index で結合可能**（§26-3）。
- 実装は既存 ET走査（musicxml_skill_extractor）を拡張。**重音の2音目以降はスキップするが、その pitch は直前の代表音符の chord_midis に収集**する（現行は捨てている＝v3で修正）。

## 2-2. 拍位置の計算（決定#2）
- `<divisions>`（四分音符の分割数）と `<time>`（拍子）を測りながら走査。小節内カーソル（divisions単位）を音価ぶん進める。
- `beat_offset = カーソル / divisions × (拍子分母/4)`、`beat_number = floor(beat_offset)+1`、`is_on_beat = (小数部==0)`。
- 拍子変更（曲中の `<time>`）に追従。弱起（implicit measure）はそのまま小節内オフセットで扱う（特別処理不要）。
- `<backup>/<forward>`（多声部）を検出したら **has_multiple_voices=true として第1声部のみ処理**（バイオリン単旋律前提のv1制限。§2-6）。

## 2-3. 音域走査（§25確定）
- 対象＝全発音（**装飾音符・重音の全構成音を含む**）。
- **ハーモニクス＝実音**（analysis.json の sounding_pitch_hz を MIDI 化して使用）。
- **トリル＝上側音を加算**（本体音の1文字上の音を調号に照らして半音値化し、走査対象に含める）。
- pitchMin/pitchMax はこの走査の min/max。

## 2-4. 副次調（ScoreKey・§19-1確定）
- 検出は**譜面上の調号変更（`<key><fifths>` の2個目以降）のみ**。臨時記号のみの転調はv1対象外。
- fifths→tonic 変換は**主調と同じ mode を引き継ぐ**（例: 主調 major なら major 読み）。理由: 調号だけでは長短を判別できないため、決定的なルールに固定（限界として明記）。
- 正規化は既存 normalize_tonic（'B-'→'Bb'）を共用。主調と同一の調は登録しない（二重保持禁止）。

## 2-5. FeatureTag 付与規則（§19-2の表を実装化・閾値なし=1回で付与）
| タグ | 条件 |
|---|---|
| 8分/16分/32分音符 | 該当 type の音符が1つでも存在（それぞれ独立に付与） |
| 付点 | dot が1つでも存在 |
| 拍頭休符 | is_on_beat な休符が存在 |
| 裏拍開始 | 休符直後の音（rest_before_beats>0）が is_on_beat=false |
| 連符 | time-modification が存在 |
| 装飾音符 | grace が存在 |
| シンコペーション | 拍境界を跨ぐ tie が存在（tie先の合成音価が拍線を越える） |
| 3度/4度/5度/6度/オクターブ/10度/その他 | chord_intervals に該当（隣接ペア分解後） |
| 連続重音 | 重音グループが2連続以上 |
| クレッシェンド/デクレッシェンド | wedge（analysis.json の hairpins を利用） |

## 2-6. 技術タグ自動付与（決定#6・§18確定）
- **自動確定（music21明示要素）**: スラー(spanner)／トレモロ／トリル／モルデント(1分岐追加)／グリッサンド／ナチュラルハーモニクス／ピチカート／スピッカート(明示要素)／ポルタート(detached-legato明示)。
- **曖昧（スタッカート点）**: 決定#4どおり「スタッカート」を**仮付与**＋ per-note `technique_ambiguous=true` ＋ piece の `needs_confirmation` に {小節・パターン} を記録。工程GのUIで確定後に上書き（§18-2: 再分析は管理者確定を上書きしない→確定記録はDB側 M:N が正になる）。
- **付与先**: Score→ScoreTechniqueTag／PracticeItem→PracticeItemTechnique。**マージのみ（既存の手動タグは絶対に削除しない）**。§18-2の「管理者確定を上書きしない」を implements。

## 2-7. 遷移属性の規則（セッション確定の実装化）
- 遷移チェーンは**単音のみ**。休符=透過（rest_before_beats に反映）。**重音=チェーン不参加**（重音自身の遷移属性は null、次の単音は重音より前の単音を遷移元とする）。
- 弦・ポジは工程B実装済みの音名算術の解決結果を使用。**低信頼（position_confidence="low"）の音は遷移属性を出すが、集計側（工程C）で除外**できるよう信頼度を保持（§25 A案）。
- 開放弦は手のポジションを動かさない＝position_from/to は直前の手ポジを引き継ぐ。

---

# 3. DB投入（決定#3: analyze_musicxml 内・keyTonic投入と同じ場所）

| 対象 | 内容 | 冪等性 |
|---|---|---|
| Score | pitchMin/pitchMax/positions[] を UPDATE | 上書き（再分析=最新が正） |
| ScoreKey | 副次調を全削除→再挿入（当該scoreIdのみ） | delete+insert |
| ScoreFeatureTag | 検出タグを upsert（skipDuplicates） | **追加のみ・削除しない**（動的拡張の遡及なし原則） |
| ScoreTechniqueTag | 同上（自動確定分＋スタッカート仮） | 追加のみ・手動分保護 |
| PracticeItem | pitchMin/pitchMax のみ UPDATE | 上書き |
| PracticeItemFeatureTag / PracticeItemTechnique | upsert 追加のみ | 手動分保護 |

- FeatureTag マスタに無い名前は投入しない（動的拡張§23の管理外タグを勝手に作らない）。
- practice経路/score経路の判定は既存実装の分岐を踏襲。

---

# 4. 再分析バッチ（決定#5: ローカル一括・288件）

1. **dry-run モード**: 全件で 層1生成→投入予定値をレポート出力（DB書込なし）。異常（多声部検知・パース失敗・音域ゼロ）を先に洗い出す。
2. **apply モード**: JSON保存（ストレージ）＋DB投入。1件ずつ独立トランザクション（1件の失敗が全体を止めない）。失敗一覧を最後に報告。
3. 置き場所の規約: `{DB User.id}/{scoreId or practice/{itemId}}/musicxml_skill_info.json`（既存パスを上書き）。
4. 実行順: 教材214 → 曲74（教材側が事前練習マッチの供給側のため先）。
5. **skill_info v2→v3 の互換**: 読み手（note_integration）は `.get` 方式のため、v3化されていないファイルが混在しても壊れない。

---

# 5. テスト計画

| 種別 | 内容 |
|---|---|
| 単体 | 拍位置計算（4/4・3/4・6/8・拍子変更・弱起）／遷移チェーン（休符透過・重音不参加）／隣接ペア分解（3音和音）／シンコペ判定（拍跨ぎtie）／fifths→副次調 |
| ゴールデン | ①ハ長調音階（回帰: v2出力の互換＋v3追加フィールド）②カイザーNo.1(.mxl・スラー/スタッカート含む)③重音教材（double_stop 6件のいずれか）④転調曲があれば1件 |
| 100ケース回帰 | tests/test_position_inference_100.py（工程B資産）を再実行 |
| dry-run | 288件レポートの目視（pitchMin/Max の分布が音域として妥当か・多声部件数・失敗件数） |
| DB検証 | 投入後: pitchMin非null件数=解析成功件数／FeatureTag付与分布／ScoreKey件数／手動タグの残存確認（削除ゼロ） |

---

# 6. リスクと対策

| リスク | 対策 |
|---|---|
| 多声部（backup/forward）で拍計算が狂う | 検知して第1声部のみ＋has_multiple_voices=true＋dry-runレポートで件数把握（v1制限として明記） |
| 既存手動タグの破壊 | M:N は追加のみ・削除操作を書かない（コードレビュー観点に明記） |
| note_index のズレ | §2-1のインバリアントを単体テスト化（analysis.json の notes 数と skill_info の数の一致検証をバッチに組込み） |
| 曖昧スタッカートの誤確定 | 仮付与＋needs_confirmation 記録。DBタグは工程GのUIで上書き可能 |
| Cloud Run 未デプロイ期間の新規アップロード | v2のまま生成される→バッチ再実行 or デプロイ後に個別再解析（デプロイは工程A完了時に実施 [[project_cloud_run_deploy_procedure]]） |
| トリル上側音の調推定誤り | 音域にしか使わない（±1半音の誤差は pitchMin/Max に実害僅少）。限界として明記 |

---

# 7. 実装順序（コミット粒度）

1. **A-1**: ET拡張（拍位置・音価・chord収集・スラー境界・grace/tuplet/dot）＋単体テスト
2. **A-2**: 遷移属性（チェーン規則・度数/弦/ポジ遷移）＋単体テスト
3. **A-3**: piece集約（音域走査・positions・FeatureTag/技術タグ判定・needs_confirmation）＋ゴールデン
4. **A-4**: DB投入（Score/PracticeItem 両経路・冪等性）＋analyze_musicxml統合
5. **A-5**: 再分析バッチ（dry-run→apply）＋DB検証
6. **A-6**: Cloud Run デプロイ（別途承認）
