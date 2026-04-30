import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { runMigrations } from './migrate.js';
import { stores, admins, tables, categories, menuItems } from './schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  runMigrations();

  // Check if already seeded
  const existing = db.select().from(stores).where(eq(stores.slug, 'black-marble')).get();
  if (existing) {
    console.log('⚠️  Database already seeded. Skipping.');
    return;
  }

  // 1. Create store
  const store = db.insert(stores).values({
    slug: 'black-marble',
    name: 'Black Marble',
    address: '서울 강남구 선릉로152길 21',
  }).returning().get();

  const storeId = store.id;
  console.log(`  ✅ Store created: ${store.name} (id: ${storeId})`);

  // 2. Create admin
  const adminHash = bcrypt.hashSync('admin1234', 10);
  db.insert(admins).values({
    storeId,
    username: 'admin',
    passwordHash: adminHash,
  }).run();
  console.log('  ✅ Admin created: admin / admin1234');

  // 3. Create tables (1~20)
  for (let i = 1; i <= 20; i++) {
    const tableHash = bcrypt.hashSync(`table${i}`, 10);
    db.insert(tables).values({
      storeId,
      tableNumber: i,
      passwordHash: tableHash,
    }).run();
  }
  console.log('  ✅ Tables created: 1~20');

  // 4. Create categories
  const categoryData = [
    { name: 'Appetizers', displayOrder: 1 },
    { name: 'Soup & Salad', displayOrder: 2 },
    { name: 'Prime Steaks & Chops', displayOrder: 3 },
    { name: 'Seafood', displayOrder: 4 },
    { name: 'Sides', displayOrder: 5 },
    { name: 'Desserts', displayOrder: 6 },
    { name: 'Beverages', displayOrder: 7 },
    { name: 'Red Wine', displayOrder: 8 },
    { name: 'White Wine & Rosé', displayOrder: 9 },
    { name: 'Cocktails & Spirits', displayOrder: 10 },
  ];

  const categoryIds: Record<string, number> = {};
  for (const cat of categoryData) {
    const result = db.insert(categories).values({ storeId, ...cat }).returning().get();
    categoryIds[cat.name] = result.id;
  }
  console.log(`  ✅ Categories created: ${categoryData.length}`);

  // 5. Create menu items
  const menus = [
    // Appetizers
    { categoryId: categoryIds['Appetizers'], name: '점보 쉬림프 칵테일', price: 38000, description: '대형 새우를 칵테일 소스와 함께 제공. 🍸 클래식 마티니 또는 소비뇽 블랑과 페어링', displayOrder: 1 },
    { categoryId: categoryIds['Appetizers'], name: '블랙마블 크랩 케이크', price: 42000, description: '점보 럼프 크랩미트로 만든 시그니처 크랩 케이크. 🍷 키안티 클라시코 또는 🍸 네그로니 추천', displayOrder: 2 },
    { categoryId: categoryIds['Appetizers'], name: '시즐링 캐나디안 베이컨', price: 19000, description: '두껍게 썬 캐나디안 베이컨을 철판에 구워 제공. 🍸 네그로니와 페어링', displayOrder: 3 },
    { categoryId: categoryIds['Appetizers'], name: '프레시 오이스터', price: 32000, description: '신선한 생굴 하프 쉘 (6피스). 🍷 샤블리 프리미에 크뤼 또는 🍸 클래식 마티니와 최고의 조합', displayOrder: 4 },
    // Soup & Salad
    { categoryId: categoryIds['Soup & Salad'], name: '블랙마블 샐러드', price: 32000, description: '양상추, 토마토, 양파, 크리스피 그린빈, 새우, 베이컨', displayOrder: 1 },
    { categoryId: categoryIds['Soup & Salad'], name: '비프스테이크 토마토 & 어니언', price: 22000, description: '두껍게 썬 비프스테이크 토마토와 양파 (1인)', displayOrder: 2 },
    { categoryId: categoryIds['Soup & Salad'], name: '프레시 모짜렐라 & 토마토', price: 24000, description: '신선한 모짜렐라 치즈와 비프스테이크 토마토 (1인)', displayOrder: 3 },
    { categoryId: categoryIds['Soup & Salad'], name: '찹드 샐러드', price: 28000, description: '로메인, 시금치, 완두콩, 당근, 옥수수, 오이, 아보카도, 페타치즈', displayOrder: 4 },
    { categoryId: categoryIds['Soup & Salad'], name: '아이스버그 웨지 위드 베이컨', price: 25000, description: '아이스버그 레터스 웨지에 베이컨, 하우스 비네그레트', displayOrder: 5 },
    // Prime Steaks & Chops
    { categoryId: categoryIds['Prime Steaks & Chops'], name: '포터하우스 (2인 이상)', price: 198000, description: 'USDA 프라임 드라이에이징 포터하우스, 시그니처. 🍷 나파 밸리 카베르네 소비뇽과 완벽한 페어링', displayOrder: 1 },
    { categoryId: categoryIds['Prime Steaks & Chops'], name: '프라임 NY 설로인 스테이크', price: 89000, description: 'USDA 프라임 뉴욕 스트립 설로인. 🍷 말벡(멘도사)과 클래식 페어링', displayOrder: 2 },
    { categoryId: categoryIds['Prime Steaks & Chops'], name: '프라임 립아이 스테이크', price: 109000, description: 'USDA 프라임 본인 립아이. 🍷 나파 밸리 카베르네 소비뇽 또는 샤토네프 뒤 파프 추천', displayOrder: 3 },
    { categoryId: categoryIds['Prime Steaks & Chops'], name: '프라임 필레 미뇽', price: 95000, description: 'USDA 프라임 안심 스테이크. 🍷 바롤로 DOCG와 우아한 페어링', displayOrder: 4 },
    { categoryId: categoryIds['Prime Steaks & Chops'], name: '콜로라도 립 램 찹', price: 89000, description: '콜로라도산 프라임 램 립 찹. 🍷 바롤로 또는 키안티 클라시코와 페어링 추천', displayOrder: 5 },
    { categoryId: categoryIds['Prime Steaks & Chops'], name: '토마호크 스테이크', price: 210000, description: '케이준 스타일 토마호크 립아이 (약 1kg). 🍷 샤토네프 뒤 파프 또는 🥃 블랙마블 올드 패션드와 페어링', displayOrder: 6 },
    // Seafood
    { categoryId: categoryIds['Seafood'], name: '그릴드 칠리안 씨배스', price: 68000, description: '그릴에 구운 칠레산 씨배스. 🍷 샤블리 프리미에 크뤼와 최고의 페어링', displayOrder: 1 },
    { categoryId: categoryIds['Seafood'], name: '그릴드 연어', price: 45000, description: '아스파라거스와 함께 제공되는 그릴드 연어. 🍷 피노 누아 또는 나파 밸리 샤르도네 추천', displayOrder: 2 },
    { categoryId: categoryIds['Seafood'], name: '쉬림프 스캠피', price: 52000, description: '점보 새우를 마늘 버터 소스에 볶아 라이스와 함께 제공. 🍷 리슬링(알자스)과 아름다운 조합', displayOrder: 3 },
    { categoryId: categoryIds['Seafood'], name: '시어드 옐로핀 참치', price: 58000, description: '와사비 소스와 아스파라거스를 곁들인 참치 스테이크. 🍷 피노 누아 또는 프로방스 로제 추천', displayOrder: 4 },
    // Sides
    { categoryId: categoryIds['Sides'], name: '점보 베이크드 포테이토', price: 15000, description: '대형 베이크드 감자, 사워크림 & 버터', displayOrder: 1 },
    { categoryId: categoryIds['Sides'], name: '크리미 시금치', price: 16000, description: '크림 소스에 볶은 시금치', displayOrder: 2 },
    { categoryId: categoryIds['Sides'], name: '매쉬드 포테이토', price: 15000, description: '부드러운 매쉬드 포테이토', displayOrder: 3 },
    { categoryId: categoryIds['Sides'], name: '그릴드 아스파라거스', price: 16000, description: '올리브 오일에 그릴한 아스파라거스', displayOrder: 4 },
    { categoryId: categoryIds['Sides'], name: '로브스터 맥 앤 치즈', price: 32000, description: '로브스터가 들어간 크리미 맥 앤 치즈', displayOrder: 5 },
    { categoryId: categoryIds['Sides'], name: '소테 머쉬룸', price: 18000, description: '버터에 볶은 혼합 버섯', displayOrder: 6 },
    // Desserts
    { categoryId: categoryIds['Desserts'], name: '초콜릿 무스 케이크', price: 19000, description: '진한 초콜릿 무스 케이크', displayOrder: 1 },
    { categoryId: categoryIds['Desserts'], name: '피칸 파이', price: 19000, description: '클래식 아메리칸 피칸 파이', displayOrder: 2 },
    { categoryId: categoryIds['Desserts'], name: '핫 퍼지 선데이', price: 19000, description: '바닐라 아이스크림에 핫 퍼지 소스, 홈메이드 휘핑크림', displayOrder: 3 },
    { categoryId: categoryIds['Desserts'], name: '계절 과일', price: 22000, description: '제철 신선 과일 모둠', displayOrder: 4 },
    { categoryId: categoryIds['Desserts'], name: '뉴욕 치즈케이크', price: 19000, description: '클래식 뉴욕 스타일 치즈케이크', displayOrder: 5 },
    // Beverages
    { categoryId: categoryIds['Beverages'], name: '탄산수 (S.Pellegrino)', price: 8000, description: '산펠레그리노 스파클링 워터 750ml', displayOrder: 1 },
    { categoryId: categoryIds['Beverages'], name: '생수 (Acqua Panna)', price: 8000, description: '아쿠아 파나 스틸 워터 750ml', displayOrder: 2 },
    { categoryId: categoryIds['Beverages'], name: '아이스티', price: 6000, description: '홈메이드 아이스티', displayOrder: 3 },
    { categoryId: categoryIds['Beverages'], name: '콜라 / 사이다', price: 5000, description: '코카콜라 또는 스프라이트', displayOrder: 4 },
    { categoryId: categoryIds['Beverages'], name: '에스프레소', price: 7000, description: '싱글 에스프레소', displayOrder: 5 },
    { categoryId: categoryIds['Beverages'], name: '아메리카노', price: 8000, description: '핫 또는 아이스 아메리카노', displayOrder: 6 },
    // Red Wine
    { categoryId: categoryIds['Red Wine'], name: '나파 밸리 카베르네 소비뇽', price: 89000, description: '풀바디, 블랙베리와 삼나무 향. 포터하우스·립아이와 완벽한 페어링', displayOrder: 1 },
    { categoryId: categoryIds['Red Wine'], name: '바롤로 DOCG', price: 120000, description: '이탈리아 피에몬테산. 체리·장미·타르 향. 필레 미뇽·램 찹과 페어링 추천', displayOrder: 2 },
    { categoryId: categoryIds['Red Wine'], name: '샤토네프 뒤 파프', price: 95000, description: '론 밸리 블렌드. 자두·허브·스파이스. 토마호크 스테이크와 훌륭한 조합', displayOrder: 3 },
    { categoryId: categoryIds['Red Wine'], name: '피노 누아 (오레곤)', price: 78000, description: '미디엄 바디, 라즈베리·체리 향. 연어·참치 등 해산물과도 잘 어울림', displayOrder: 4 },
    { categoryId: categoryIds['Red Wine'], name: '말벡 (멘도사)', price: 65000, description: '아르헨티나산. 자두·다크초콜릿 향. NY 설로인과 클래식 페어링', displayOrder: 5 },
    { categoryId: categoryIds['Red Wine'], name: '키안티 클라시코 리제르바', price: 72000, description: '산지오베제 100%. 체리·가죽·허브. 크랩 케이크·파스타와 페어링', displayOrder: 6 },
    { categoryId: categoryIds['Red Wine'], name: '하우스 레드 와인 (글라스)', price: 18000, description: '데일리 셀렉션 카베르네 소비뇽. 모든 스테이크와 무난한 페어링', displayOrder: 7 },
    // White Wine & Rosé
    { categoryId: categoryIds['White Wine & Rosé'], name: '샤블리 프리미에 크뤼', price: 85000, description: '부르고뉴산 샤르도네. 미네랄·시트러스. 생굴·씨배스와 최고의 페어링', displayOrder: 1 },
    { categoryId: categoryIds['White Wine & Rosé'], name: '소비뇽 블랑 (말보로)', price: 58000, description: '뉴질랜드산. 자몽·패션프루트 향. 쉬림프 칵테일·샐러드와 페어링', displayOrder: 2 },
    { categoryId: categoryIds['White Wine & Rosé'], name: '나파 밸리 샤르도네', price: 72000, description: '오크 숙성, 바닐라·버터 향. 로브스터 맥앤치즈·그릴드 연어와 페어링', displayOrder: 3 },
    { categoryId: categoryIds['White Wine & Rosé'], name: '리슬링 (알자스)', price: 62000, description: '프랑스 알자스산. 꿀·복숭아·미네랄. 쉬림프 스캠피와 아름다운 조합', displayOrder: 4 },
    { categoryId: categoryIds['White Wine & Rosé'], name: '프로방스 로제', price: 55000, description: '연한 살몬 핑크. 딸기·허브 향. 애피타이저·해산물 전반과 가볍게 페어링', displayOrder: 5 },
    { categoryId: categoryIds['White Wine & Rosé'], name: '하우스 화이트 와인 (글라스)', price: 16000, description: '데일리 셀렉션 샤르도네. 해산물·샐러드와 무난한 페어링', displayOrder: 6 },
    // Cocktails & Spirits
    { categoryId: categoryIds['Cocktails & Spirits'], name: '블랙마블 올드 패션드', price: 25000, description: '버번 위스키·앙고스투라 비터스·오렌지 필. 스테이크 전 식전주로 추천', displayOrder: 1 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '클래식 마티니', price: 23000, description: '진 또는 보드카, 드라이 베르무트. 생굴·쉬림프 칵테일과 클래식 페어링', displayOrder: 2 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '맨해튼', price: 25000, description: '라이 위스키·스위트 베르무트·비터스. 프라임 스테이크와 깊은 풍미 매칭', displayOrder: 3 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '네그로니', price: 23000, description: '진·캄파리·스위트 베르무트. 시즐링 베이컨·크랩 케이크와 페어링', displayOrder: 4 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '싱글몰트 위스키 (글렌피딕 12년)', price: 22000, description: '스페이사이드 싱글몰트. 배·꿀 향. 디저트 또는 식후주로 추천', displayOrder: 5 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '버번 위스키 (메이커스 마크)', price: 18000, description: '캐러멜·바닐라 향. 스테이크와 함께 또는 식후 니트로 추천', displayOrder: 6 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '에스프레소 마티니', price: 23000, description: '보드카·에스프레소·칼루아. 초콜릿 무스 케이크와 디저트 페어링', displayOrder: 7 },
    { categoryId: categoryIds['Cocktails & Spirits'], name: '모히토', price: 20000, description: '럼·라임·민트·소다. 해산물·샐러드와 상큼한 페어링', displayOrder: 8 },
  ];

  for (const menu of menus) {
    db.insert(menuItems).values({ storeId, ...menu }).run();
  }
  console.log(`  ✅ Menu items created: ${menus.length}`);

  console.log('🎉 Seeding complete!');
}

seed().catch(console.error);
