/**
 * Per-route, per-locale SEO metadata (title + description).
 *
 * Native industrial-engineering register in all 10 locales. Consumed by route
 * head() via buildSeo() so canonical, og:*, hreflang, and og:image stay
 * consistent — only the human-facing title/description swap per locale.
 */

import type { LocaleCode } from "./seo";

export interface LocalizedMeta {
  title: string;
  description: string;
}

type PerLocale = Record<LocaleCode, LocalizedMeta>;

export const SEO_META: Record<string, PerLocale> = {
  "/about": {
    en: {
      title: "About NEVO Industrial — Engineering the Future of Sandwich Panel Manufacturing",
      description:
        "Dubai-based industrial engineering group building sandwich panel factories, PIR/PUR production lines and raw-material supply chains for global markets.",
    },
    ar: {
      title: "عن نيفو الصناعية — هندسة مستقبل تصنيع الألواح الساندويتش",
      description:
        "مجموعة هندسية صناعية مقرها دبي، تطوّر مصانع الألواح الساندويتش وخطوط إنتاج PIR/PUR وسلاسل توريد المواد الخام للأسواق العالمية.",
    },
    tr: {
      title: "NEVO Industrial Hakkında — Sandviç Panel Üretiminin Geleceğini Mühendislikle Kuruyoruz",
      description:
        "Dubai merkezli endüstriyel mühendislik grubu; sandviç panel fabrikaları, PIR/PUR üretim hatları ve küresel pazarlar için hammadde tedarik zincirleri kuruyoruz.",
    },
    ru: {
      title: "О компании NEVO Industrial — Инжиниринг будущего производства сэндвич-панелей",
      description:
        "Промышленно-инжиниринговая группа со штаб-квартирой в Дубае: заводы сэндвич-панелей, линии PIR/PUR и цепочки поставок сырья для мировых рынков.",
    },
    pt: {
      title: "Sobre a NEVO Industrial — Engenharia do futuro da fabricação de painéis sandwich",
      description:
        "Grupo de engenharia industrial sediado em Dubai: fábricas de painéis sandwich, linhas de produção PIR/PUR e cadeias de fornecimento de matérias-primas para mercados globais.",
    },
    de: {
      title: "Über NEVO Industrial — Engineering für die Zukunft der Sandwichpanel-Fertigung",
      description:
        "Industrielle Engineering-Gruppe mit Sitz in Dubai: Sandwichpanel-Werke, PIR/PUR-Produktionslinien und Rohstoff-Lieferketten für globale Märkte.",
    },
    es: {
      title: "Acerca de NEVO Industrial — Ingeniería del futuro de la fabricación de paneles sándwich",
      description:
        "Grupo de ingeniería industrial con sede en Dubái: fábricas de paneles sándwich, líneas de producción PIR/PUR y cadenas de suministro de materias primas para mercados globales.",
    },
    fr: {
      title: "À propos de NEVO Industrial — L'ingénierie du futur de la fabrication de panneaux sandwich",
      description:
        "Groupe d'ingénierie industrielle basé à Dubaï : usines de panneaux sandwich, lignes de production PIR/PUR et chaînes d'approvisionnement en matières premières pour les marchés mondiaux.",
    },
    it: {
      title: "Chi è NEVO Industrial — Ingegneria per il futuro della produzione di pannelli sandwich",
      description:
        "Gruppo di ingegneria industriale con sede a Dubai: stabilimenti di pannelli sandwich, linee di produzione PIR/PUR e filiere di materie prime per i mercati globali.",
    },
    zh: {
      title: "关于 NEVO Industrial — 引领夹芯板制造未来的工程集团",
      description:
        "总部位于迪拜的工业工程集团,面向全球市场提供夹芯板工厂、PIR/PUR 生产线以及原材料供应链的整体解决方案。",
    },
  },

  "/contact": {
    en: {
      title: "Global Offices & Contact — Dubai · Germany · Turkey · Oman",
      description:
        "Reach NEVO Industrial engineering teams worldwide. Dubai HQ, Germany, Turkey and Oman offices — request a callback or speak with a senior engineer.",
    },
    ar: {
      title: "المكاتب العالمية والتواصل — دبي · ألمانيا · تركيا · عُمان",
      description:
        "تواصل مع فرق الهندسة في نيفو الصناعية حول العالم. المقر الرئيسي في دبي ومكاتب في ألمانيا وتركيا وعُمان — اطلب معاودة الاتصال أو تحدّث مع مهندس أول.",
    },
    tr: {
      title: "Küresel Ofisler ve İletişim — Dubai · Almanya · Türkiye · Umman",
      description:
        "NEVO Industrial mühendislik ekiplerine dünyanın her yerinden ulaşın. Dubai merkez, Almanya, Türkiye ve Umman ofisleri — geri arama isteyin veya kıdemli bir mühendisle görüşün.",
    },
    ru: {
      title: "Глобальные офисы и контакты — Дубай · Германия · Турция · Оман",
      description:
        "Свяжитесь с инженерными командами NEVO Industrial по всему миру. Штаб-квартира в Дубае, офисы в Германии, Турции и Омане — закажите обратный звонок или обсудите проект с ведущим инженером.",
    },
    pt: {
      title: "Escritórios globais e contacto — Dubai · Alemanha · Turquia · Omã",
      description:
        "Fale com as equipas de engenharia da NEVO Industrial em todo o mundo. Sede em Dubai e escritórios na Alemanha, Turquia e Omã — solicite retorno ou fale com um engenheiro sénior.",
    },
    de: {
      title: "Globale Büros & Kontakt — Dubai · Deutschland · Türkei · Oman",
      description:
        "Erreichen Sie die Engineering-Teams von NEVO Industrial weltweit. Zentrale in Dubai, Büros in Deutschland, der Türkei und im Oman — Rückruf anfordern oder mit einem leitenden Ingenieur sprechen.",
    },
    es: {
      title: "Oficinas globales y contacto — Dubái · Alemania · Turquía · Omán",
      description:
        "Contacte con los equipos de ingeniería de NEVO Industrial en todo el mundo. Sede en Dubái y oficinas en Alemania, Turquía y Omán — solicite una llamada o hable con un ingeniero senior.",
    },
    fr: {
      title: "Bureaux internationaux & contact — Dubaï · Allemagne · Turquie · Oman",
      description:
        "Contactez les équipes d'ingénierie de NEVO Industrial dans le monde entier. Siège à Dubaï, bureaux en Allemagne, Turquie et Oman — demandez un rappel ou parlez à un ingénieur senior.",
    },
    it: {
      title: "Uffici globali e contatti — Dubai · Germania · Turchia · Oman",
      description:
        "Contatta i team di ingegneria di NEVO Industrial in tutto il mondo. Sede a Dubai e uffici in Germania, Turchia e Oman — richiedi una richiamata o parla con un ingegnere senior.",
    },
    zh: {
      title: "全球办公室与联系方式 — 迪拜 · 德国 · 土耳其 · 阿曼",
      description:
        "联系 NEVO Industrial 遍布全球的工程团队。迪拜总部及德国、土耳其、阿曼办公室 — 预约回电或与资深工程师直接沟通。",
    },
  },

  "/industries": {
    en: {
      title: "Industries We Engineer For — Cold Storage, Clean Rooms, Food, Logistics",
      description:
        "Engineering-led sandwich panel and factory solutions for 12+ industries: cold storage, food, pharma clean rooms, warehousing, industrial and modular construction.",
    },
    ar: {
      title: "القطاعات التي نهندس لها — تخزين مبرّد وغرف نظيفة وأغذية ولوجستيات",
      description:
        "حلول ألواح ساندويتش ومصانع بقيادة هندسية لأكثر من 12 قطاعًا: التخزين المبرّد والأغذية والغرف النظيفة الدوائية والمستودعات والبناء الصناعي والحلول الجاهزة.",
    },
    tr: {
      title: "Mühendislik Yaptığımız Sektörler — Soğuk Depo, Temiz Oda, Gıda, Lojistik",
      description:
        "12+ sektöre yönelik mühendislik odaklı sandviç panel ve fabrika çözümleri: soğuk depolama, gıda, ilaç temiz odaları, depolama, endüstriyel ve modüler yapı.",
    },
    ru: {
      title: "Отрасли, для которых мы проектируем — Холодильные склады, чистые помещения, пищевое производство, логистика",
      description:
        "Инженерные решения по сэндвич-панелям и заводам под ключ для более чем 12 отраслей: холодильные склады, пищевая отрасль, фармацевтические чистые помещения, склады, промышленное и модульное строительство.",
    },
    pt: {
      title: "Setores para os quais projetamos — Frio, salas limpas, alimentar, logística",
      description:
        "Soluções de painéis sandwich e fábricas com base em engenharia para mais de 12 setores: frio industrial, alimentar, salas limpas farmacêuticas, armazenagem e construção industrial e modular.",
    },
    de: {
      title: "Branchen, für die wir Engineering liefern — Kühllager, Reinräume, Lebensmittel, Logistik",
      description:
        "Ingenieurgetriebene Sandwichpanel- und Fabriklösungen für 12+ Branchen: Kühllager, Lebensmittel, Pharma-Reinräume, Logistik, Industrie- und Modulbau.",
    },
    es: {
      title: "Sectores para los que ingeniamos — Frío, salas limpias, alimentación, logística",
      description:
        "Soluciones de paneles sándwich y fábricas dirigidas por ingeniería para más de 12 sectores: frío industrial, alimentación, salas limpias farmacéuticas, almacenaje y construcción industrial y modular.",
    },
    fr: {
      title: "Secteurs pour lesquels nous concevons — Froid, salles blanches, agroalimentaire, logistique",
      description:
        "Solutions de panneaux sandwich et d'usines pilotées par l'ingénierie pour plus de 12 secteurs : froid industriel, agroalimentaire, salles blanches pharma, logistique, construction industrielle et modulaire.",
    },
    it: {
      title: "Settori per cui progettiamo — Freddo, camere bianche, alimentare, logistica",
      description:
        "Soluzioni di pannelli sandwich e stabilimenti a guida ingegneristica per oltre 12 settori: freddo industriale, alimentare, camere bianche farmaceutiche, logistica, industria e costruzioni modulari.",
    },
    zh: {
      title: "我们服务的行业 — 冷链、洁净室、食品、物流",
      description:
        "以工程为核心的夹芯板与整厂解决方案,服务 12 余个行业:冷链仓储、食品加工、制药洁净室、物流仓库、工业及模块化建筑。",
    },
  },
};

/**
 * Look up localized title/description for a route/locale, falling back to EN.
 */
export function localizedMeta(path: string, lang: string): LocalizedMeta {
  const perLocale = SEO_META[path];
  if (!perLocale) throw new Error(`SEO_META missing for path: ${path}`);
  return perLocale[lang as LocaleCode] ?? perLocale.en;
}
