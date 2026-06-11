// ============================================================
// アカリエ IT部門 採用KPIダッシュボード - GAS バックエンド
// スプレッドシートID: 10xqBmx1u0upNDEbp8Ly7SpxMkLwk60FyBzp97_RG1vM
// シート名: 応募者管理
// ============================================================

const SPREADSHEET_ID = '10xqBmx1u0upNDEbp8Ly7SpxMkLwk60FyBzp97_RG1vM';
const SHEET_NAME = '応募者管理';

// KPI目標定数
const KPI_TARGETS = {
  応募: 375, 書類通過: 170, 一次通過: 110, 最終通過: 40, 内定: 14, 入社: 6,
  予算: 3600000, 応募単価: 9600, 採用単価: 600000,
  書類通過率: 45.33, 一次通過率: 64.71, 最終通過率: 36.36,
};

// 月別応募目標（4月スタート）
const MONTHLY_TARGETS = {
  4:20, 5:40, 6:40, 7:40, 8:20, 9:40, 10:35, 11:10, 12:40, 1:40, 2:40, 3:10
};

// 列インデックス（0始まり）
const COL = {
  状況:0, 応募日:1, 氏名漢字:2, 氏名カナ:3, ステータス:4, 要対応日:5,
  年齢:6, 性別:7, 国籍:8, 都道府県:9, 住所詳細:10, 携帯:11, メール:12,
  媒体:13, 応募経路:14, 経験:15, 備考:16, 書類選考:17, 一次日時:18,
  一次面接:19, 最終日時:20, 最終面接:21, 適性検査:22, 内定日:23,
  内定:24, 入社日:25, 退職日:26,
};

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  try {
    const data = buildDashboardData();
    const json = JSON.stringify(data);
    return callback
      ? ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT)
      : ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const errJson = JSON.stringify({ error: err.message });
    return callback
      ? ContentService.createTextOutput(callback + '(' + errJson + ')').setMimeType(ContentService.MimeType.JAVASCRIPT)
      : ContentService.createTextOutput(errJson).setMimeType(ContentService.MimeType.JSON);
  }
}

function buildDashboardData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { targets: KPI_TARGETS, monthlyTargets: MONTHLY_TARGETS, rows: [], updatedAt: new Date().toISOString() };

  const raw = sheet.getRange(2, 1, lastRow - 1, 27).getValues();
  const rows = raw
    .filter(r => r[COL.応募日] !== '' && r[COL.応募日] !== null)
    .map(r => ({
      応募日: formatDate(r[COL.応募日]),
      年齢: Number(r[COL.年齢]) || null,
      性別: r[COL.性別],
      国籍: r[COL.国籍] || '日本',
      媒体: r[COL.媒体],
      書類選考: r[COL.書類選考],
      一次面接: r[COL.一次面接],
      最終面接: r[COL.最終面接],
      内定: r[COL.内定],
      内定日: formatDate(r[COL.内定日]),
      入社日: formatDate(r[COL.入社日]),
    }));

  return {
    targets: KPI_TARGETS,
    monthlyTargets: MONTHLY_TARGETS,
    kpi: calcKPI(rows),
    funnel: calcFunnel(rows),
    monthly: calcMonthly(rows),
    ageByMedia: calcAgeByMedia(rows),
    nationalityByMedia: calcNationalityByMedia(rows),
    updatedAt: new Date().toISOString(),
  };
}

function calcKPI(rows) {
  const 応募数   = rows.length;
  const 書類通過 = rows.filter(r => isPass(r.書類選考)).length;
  const 一次通過 = rows.filter(r => isPass(r.一次面接)).length;
  const 最終通過 = rows.filter(r => isPass(r.最終面接)).length;
  const 内定数   = rows.filter(r => isPass(r.内定)).length;
  const 入社数   = rows.filter(r => r.入社日 && r.入社日 !== '').length;
  return { 応募数, 書類通過, 一次通過, 最終通過, 内定数, 入社数,
    書類通過率: pct(書類通過, 応募数), 一次通過率: pct(一次通過, 書類通過),
    最終通過率: pct(最終通過, 一次通過), 内定率: pct(内定数, 最終通過), 入社率: pct(入社数, 内定数) };
}

function calcFunnel(rows) {
  const monthly = {};
  rows.forEach(r => {
    const key = monthKey(r.応募日);
    if (!key) return;
    if (!monthly[key]) monthly[key] = { 応募:0, 書類通過:0, 一次通過:0, 最終通過:0, 内定:0, 入社:0 };
    monthly[key].応募++;
    if (isPass(r.書類選考)) monthly[key].書類通過++;
    if (isPass(r.一次面接)) monthly[key].一次通過++;
    if (isPass(r.最終面接)) monthly[key].最終通過++;
    if (isPass(r.内定))     monthly[key].内定++;
    if (r.入社日)           monthly[key].入社++;
  });
  return { monthly };
}

function calcMonthly(rows) {
  const counts = {};
  rows.forEach(r => { const k = monthKey(r.応募日); if (k) counts[k] = (counts[k]||0)+1; });
  return counts;
}

function calcAgeByMedia(rows) {
  const brackets = ['10代','20代','30代','40代','50代','60代以上','不明'];
  const mediaSet = new Set();
  const total = {}, byMedia = {};
  rows.forEach(r => {
    const b = ageBracket(r.年齢);
    const m = r.媒体 || '不明';
    mediaSet.add(m);
    total[b] = (total[b]||0)+1;
    if (!byMedia[m]) byMedia[m] = {};
    byMedia[m][b] = (byMedia[m][b]||0)+1;
  });
  return { brackets, total, byMedia, mediaList: Array.from(mediaSet).sort() };
}

function calcNationalityByMedia(rows) {
  const natSet = new Set();
  const total = {}, byMedia = {}, byMonth = {};
  rows.forEach(r => {
    const nat = r.国籍 || '日本';
    const m = r.媒体 || '不明';
    const key = monthKey(r.応募日);
    natSet.add(nat);
    total[nat] = (total[nat]||0)+1;
    if (!byMedia[m]) byMedia[m] = {};
    byMedia[m][nat] = (byMedia[m][nat]||0)+1;
    if (key) { if (!byMonth[key]) byMonth[key] = {}; byMonth[key][nat] = (byMonth[key][nat]||0)+1; }
  });
  return { total, byMedia, byMonth, nationalityList: Array.from(natSet).sort() };
}

function isPass(val) {
  if (!val) return false;
  const s = String(val).trim();
  return ['○','◯','通過','合格','pass','Pass','TRUE','1'].includes(s);
}
function pct(n, d) { return (!d||d===0) ? 0 : Math.round((n/d)*1000)/10; }
function formatDate(val) {
  if (!val||val==='') return '';
  try { const d=new Date(val); if(isNaN(d.getTime())) return ''; return Utilities.formatDate(d,'Asia/Tokyo','yyyy-MM-dd'); } catch(e){return '';}
}
function monthKey(s) {
  if (!s||s==='') return null;
  const d=new Date(s); if(isNaN(d.getTime())) return null;
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
function ageBracket(age) {
  if (!age||isNaN(age)) return '不明';
  if (age<20) return '10代'; if (age<30) return '20代'; if (age<40) return '30代';
  if (age<50) return '40代'; if (age<60) return '50代'; return '60代以上';
}
