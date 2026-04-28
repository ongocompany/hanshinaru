// 색인의 안축 128수 vs DB의 (poet#3343 127수 + poet#3469 1수) 1:1 매칭 검증
import postgres from 'postgres';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local','utf8');
const dbUrl = env.match(/HANSHINARU_DATABASE_URL=(.+)/)?.[1].trim();
const sql = postgres(dbUrl, { max: 2, prepare: false });

// 색인 line 508의 direct 128건 명단 (쉼표 구분 추출)
const indexRaw = `鏡浦泛舟, 高城道中小歇, 過桃源驛, 過桃源驛（卷一第2首）, 過仙遊潭, 過松澗驛, 過松澗驛（卷一第2首）, 過澄波渡, 過鐵嶺, 過楓林驛, 關東別曲, 九月十三日，因迎香使，北行途中卽事, 九日過多林驛, 金剛山, 金幱窟詩, 大雨歎, 到襄州寄通州太守, 同使上妓謠：金蓮、玉蓮, 同使上妓謠：洛中仙, 同使上妓謠：綠珠, 同使上妓謠：滿月、商山月, 同使上妓謠：巫娥, 同使上妓謠：四時紅, 同使上妓謠：西施, 同使上妓謠：新月, 同使上妓謠：燕尋玉京, 同使上妓謠：眞眞, 登州古城懷古, 登太白山, 六月三日，入鐵嶺關望和州作, 六月十三日眞珠南江泛舟, 六月十七日三陟西樓夜坐, 李起居注榮親席上作：金花, 李起居注榮親席上作：滿月, 李起居注榮親席上作：四時紅, 李起居注榮親席上作：小蠻, 李起居注榮親席上作：紅眞, 謾成, 夢見西掖同舍諸賢, 白鷗, 白文寶按部上謠：金海七點山, 白文寶按部上謠：寧海觀魚臺, 白文寶按部上謠：東萊積翠軒, 白文寶按部上謠：靈龜山宿水樓, 白文寶按部上謠：商山洛東江, 白文寶按部上謠：永嘉文華山, 白文寶按部上謠：月城瞻星臺, 白文寶按部上謠：珠浦月影臺, 白文寶按部上謠：晉陽矗石樓, 伯顏丞相訪文正公義田宅圖, 范丞相《麥舟圖》, 別母, 奉答末山堂頭惠朱李, 奉答通州太守贈別詩, 三陟西樓八詠, 松菌, 送李中父還朝, 松魚, 宿龍潭驛, 宿白嶺驛, 宿銀溪驛, 是日過孤山驛, 是日過鐵嶺, 是日馬上卽事, 是日阻雨留宿歙谷, 十日宿林丹驛, 十一日過王溪驛, 夜坐聞鴻, 永郞浦泛舟, 詠梅, 五月二十五日，自和州南行，中途遇雨，馬上有作, 瓮遷路, 王昭君, 用前韻獻尹政丞, 又次三日浦詩韻, 元帥臺詩, 元日, 遊雲巖縣亭, 二十九日馬上卽事, 再遊三日浦次板上詩, 在和州伏見批目，寄獻質齋尹大叔相國, 在和州始見二毛有感, 題灌木驛亭, 除夜, 題淸澗驛萬景臺次許獻納詩韻, 題平海望槎亭, 題寒松亭, 阻雨留通州，雨晴向高城，有作贈太守, 竹溪別曲, 贈母山崔大賢, 至順元年十月始八日，承王命赴京，發和州馬上偶作, 至順二年九月十七日，罷任如京，過順忠關, 次高城客館詩韻, 次洞山縣觀瀾亭詩韻, 次洛山詩韻, 次臨瀛公館東軒詩韻, 次安昌驛亭許正言詩韻, 次襄州公館詩韻, 次韻杆城客館詩, 次韻寄題張秀才幽居, 次韻張秀才見贈, 次韻題南同年書樓, 次韻許正言見寄, 次越松亭詩韻, 次旌善公館趙元帥詩韻, 次旌善板上韻, 次叢石亭詩韻, 次通州客舍詩韻, 次平海公館後亭詩韻, 次和州本營詩韻, 次歙谷客館詩韻, 次興富驛亭詩韻, 穿島詩, 天曆三年五月，受江陵道存撫使之命。是月三十日，發松京宿白嶺驛，夜半雨作有懷, 叢石亭宴使臣有作, 翠雲亭, 齒痛, 七月雨中發江陵府, 七月一日自蔚珍向三陟路上遇雨, 八月始四日北行泛永郞湖, 八月將赴京，又有旨仍行秋祭，南行路上有作, 葡萄酒和州隱者持以勸余, 賀金七宰, 賀李政堂, 賀尹代言, 賀尹侍中, 海棠, 和州鷹坊人羅鷹示余`;

const indexTitles = indexRaw.split(',').map(s => s.trim()).filter(Boolean);
console.log(`색인 안축 시제: ${indexTitles.length}수`);

const dbRows = await sql`
  SELECT id, title_zh, poet_id
  FROM poems
  WHERE poet_id IN (3343, 3469)
  ORDER BY id
`;
console.log(`DB poet#3343 + poet#3469 시제: ${dbRows.length}수`);
console.log(`  ├─ poet#3343 (안중근): ${dbRows.filter(r => r.poet_id === 3343).length}`);
console.log(`  └─ poet#3469 (안축):   ${dbRows.filter(r => r.poet_id === 3469).length}`);
console.log('');

const indexSet = new Set(indexTitles);
const dbTitleMap = new Map(dbRows.map(r => [r.title_zh, r]));

// DB에 있는데 색인에 없는 시
const dbNotInIndex = dbRows.filter(r => !indexSet.has(r.title_zh));
// 색인에 있는데 DB에 없는 시
const indexNotInDb = indexTitles.filter(t => !dbTitleMap.has(t));

console.log(`DB에 있는데 색인 미매칭: ${dbNotInIndex.length}수`);
dbNotInIndex.forEach(r => console.log(`  - poem#${r.id} (poet#${r.poet_id}) 「${r.title_zh}」`));
console.log('');
console.log(`색인에 있는데 DB 미매칭: ${indexNotInDb.length}수`);
indexNotInDb.forEach(t => console.log(`  - 「${t}」`));
console.log('');

// 매칭 통계
const matched = dbRows.filter(r => indexSet.has(r.title_zh));
console.log(`매칭 ${matched.length} / DB ${dbRows.length} (${(matched.length / dbRows.length * 100).toFixed(1)}%)`);
console.log(`매칭 ${matched.length} / 색인 ${indexTitles.length} (${(matched.length / indexTitles.length * 100).toFixed(1)}%)`);

await sql.end();
