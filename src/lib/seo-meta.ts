/**
 * Per-route, per-locale SEO metadata (title + description).
 *
 * Native industrial-engineering register in all 10 locales. Consumed by route
 * head() via buildSeo() so canonical, og:*, hreflang, and og:image stay
 * consistent — only the human-facing title/description swap per locale.
 *
 * Titles ≤ 65 chars, descriptions 140–170 chars, no keyword stuffing.
 */

import type { LocaleCode } from "./seo";

export interface LocalizedMeta {
  title: string;
  description: string;
}

type PerLocale = Record<LocaleCode, LocalizedMeta>;

export const SEO_META: Record<string, PerLocale> = {
  "/": {
    en: {
      title: "NEVO Industrial — Sandwich Panel Engineering & Supply",
      description:
        "Dubai-based engineering group: turnkey sandwich panel factories, PIR/PUR production lines and raw materials for global manufacturers.",
    },
    ar: {
      title: "نيفو الصناعية — هندسة ألواح الساندويتش وتطوير المصانع",
      description:
        "مجموعة هندسة صناعية مقرها دبي: مصانع ألواح ساندويتش جاهزة، خطوط إنتاج PIR/PUR ومواد خام واستشارات هندسية للمصنّعين حول العالم.",
    },
    tr: {
      title: "NEVO Industrial — Sandviç Panel Mühendisliği ve Fabrika Kurulumu",
      description:
        "Dubai merkezli endüstriyel mühendislik grubu: anahtar teslim sandviç panel fabrikaları, PIR/PUR üretim hatları, hammadde ve global üreticiler için danışmanlık.",
    },
    ru: {
      title: "NEVO Industrial — Инжиниринг сэндвич-панелей и заводы под ключ",
      description:
        "Промышленно-инжиниринговая группа из Дубая: заводы сэндвич-панелей под ключ, линии PIR/PUR, сырьё и консалтинг для производителей по всему миру.",
    },
    pt: {
      title: "NEVO Industrial — Engenharia de painéis sandwich e fábricas turnkey",
      description:
        "Grupo de engenharia industrial de Dubai: fábricas de painéis sandwich turnkey, linhas de produção PIR/PUR, matérias-primas e consultoria para fabricantes globais.",
    },
    de: {
      title: "NEVO Industrial — Sandwichpanel-Engineering & schlüsselfertige Werke",
      description:
        "Industrielle Engineering-Gruppe aus Dubai: schlüsselfertige Sandwichpanel-Werke, PIR/PUR-Produktionslinien, Rohstoffe und Beratung für globale Hersteller.",
    },
    es: {
      title: "NEVO Industrial — Ingeniería de paneles sándwich y fábricas llave en mano",
      description:
        "Grupo de ingeniería industrial de Dubái: fábricas de paneles sándwich llave en mano, líneas PIR/PUR, materias primas y consultoría para fabricantes globales.",
    },
    fr: {
      title: "NEVO Industrial — Ingénierie de panneaux sandwich & usines clés en main",
      description:
        "Groupe d'ingénierie industrielle basé à Dubaï : usines de panneaux sandwich clés en main, lignes PIR/PUR, matières premières et conseil pour industriels mondiaux.",
    },
    it: {
      title: "NEVO Industrial — Ingegneria di pannelli sandwich e stabilimenti chiavi in mano",
      description:
        "Gruppo di ingegneria industriale con sede a Dubai: stabilimenti di pannelli sandwich chiavi in mano, linee PIR/PUR, materie prime e consulenza per produttori globali.",
    },
    zh: {
      title: "NEVO Industrial — 夹芯板工程与整厂交付",
      description:
        "总部位于迪拜的工业工程集团:交钥匙夹芯板工厂、PIR/PUR 生产线、原材料供应及面向全球制造商的工程咨询服务。",
    },
  },

  "/about": {
    en: {
      title: "About NEVO Industrial — Engineering the Future of Sandwich Panels",
      description:
        "Dubai-based industrial engineering group building sandwich panel factories, PIR/PUR production lines and raw-material supply chains for global markets.",
    },
    ar: {
      title: "عن نيفو الصناعية — هندسة مستقبل تصنيع ألواح الساندويتش",
      description:
        "مجموعة هندسية صناعية مقرها دبي، تطوّر مصانع ألواح الساندويتش وخطوط إنتاج PIR/PUR وسلاسل توريد المواد الخام للأسواق العالمية.",
    },
    tr: {
      title: "NEVO Industrial Hakkında — Sandviç Panel Üretiminin Geleceği",
      description:
        "Dubai merkezli endüstriyel mühendislik grubu; sandviç panel fabrikaları, PIR/PUR üretim hatları ve küresel pazarlar için hammadde tedarik zincirleri kuruyoruz.",
    },
    ru: {
      title: "О NEVO Industrial — Инжиниринг будущего сэндвич-панелей",
      description:
        "Промышленно-инжиниринговая группа со штаб-квартирой в Дубае: заводы сэндвич-панелей, линии PIR/PUR и цепочки поставок сырья для мировых рынков.",
    },
    pt: {
      title: "Sobre a NEVO Industrial — Engenharia do futuro dos painéis sandwich",
      description:
        "Grupo de engenharia industrial sediado em Dubai: fábricas de painéis sandwich, linhas PIR/PUR e cadeias de fornecimento de matérias-primas para mercados globais.",
    },
    de: {
      title: "Über NEVO Industrial — Engineering für die Zukunft der Sandwichpanele",
      description:
        "Industrielle Engineering-Gruppe mit Sitz in Dubai: Sandwichpanel-Werke, PIR/PUR-Produktionslinien und Rohstoff-Lieferketten für globale Märkte.",
    },
    es: {
      title: "Acerca de NEVO Industrial — Ingeniería del futuro de los paneles sándwich",
      description:
        "Grupo de ingeniería industrial con sede en Dubái: fábricas de paneles sándwich, líneas PIR/PUR y cadenas de suministro de materias primas para mercados globales.",
    },
    fr: {
      title: "À propos de NEVO Industrial — L'ingénierie du futur des panneaux sandwich",
      description:
        "Groupe d'ingénierie industrielle basé à Dubaï : usines de panneaux sandwich, lignes PIR/PUR et chaînes d'approvisionnement pour les marchés mondiaux.",
    },
    it: {
      title: "Chi è NEVO Industrial — Ingegneria per il futuro dei pannelli sandwich",
      description:
        "Gruppo di ingegneria industriale con sede a Dubai: stabilimenti di pannelli sandwich, linee PIR/PUR e filiere di materie prime per i mercati globali.",
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
        "تواصل مع فرق الهندسة في نيفو الصناعية حول العالم. المقر في دبي ومكاتب في ألمانيا وتركيا وعُمان — اطلب معاودة الاتصال أو تحدّث مع مهندس أول.",
    },
    tr: {
      title: "Küresel Ofisler ve İletişim — Dubai · Almanya · Türkiye · Umman",
      description:
        "NEVO Industrial mühendislik ekiplerine dünyanın her yerinden ulaşın. Dubai merkez, Almanya, Türkiye ve Umman ofisleri — geri arama isteyin veya kıdemli bir mühendisle görüşün.",
    },
    ru: {
      title: "Глобальные офисы и контакты — Дубай · Германия · Турция · Оман",
      description:
        "Свяжитесь с инженерными командами NEVO Industrial по всему миру. Штаб-квартира в Дубае, офисы в Германии, Турции и Омане — обратный звонок или беседа с ведущим инженером.",
    },
    pt: {
      title: "Escritórios globais e contacto — Dubai · Alemanha · Turquia · Omã",
      description:
        "Fale com as equipas de engenharia da NEVO Industrial em todo o mundo. Sede em Dubai e escritórios na Alemanha, Turquia e Omã — solicite retorno ou fale com um engenheiro sénior.",
    },
    de: {
      title: "Globale Büros & Kontakt — Dubai · Deutschland · Türkei · Oman",
      description:
        "Erreichen Sie die Engineering-Teams von NEVO Industrial weltweit. Zentrale in Dubai, Büros in Deutschland, Türkei und Oman — Rückruf anfordern oder mit einem leitenden Ingenieur sprechen.",
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
      title:
        "Отрасли, для которых мы проектируем — Холодильные склады, чистые помещения, пищевое производство, логистика",
      description:
        "Инженерные решения по сэндвич-панелям и заводам под ключ для 12+ отраслей: холодильные склады, пищевая отрасль, фармацевтические чистые помещения, склады и модульное строительство.",
    },
    pt: {
      title: "Setores para os quais projetamos — Frio, salas limpas, alimentar, logística",
      description:
        "Soluções de painéis sandwich e fábricas com base em engenharia para mais de 12 setores: frio industrial, alimentar, salas limpas farmacêuticas, armazenagem e construção industrial e modular.",
    },
    de: {
      title:
        "Branchen, für die wir Engineering liefern — Kühllager, Reinräume, Lebensmittel, Logistik",
      description:
        "Ingenieurgetriebene Sandwichpanel- und Fabriklösungen für 12+ Branchen: Kühllager, Lebensmittel, Pharma-Reinräume, Logistik, Industrie- und Modulbau.",
    },
    es: {
      title: "Sectores para los que ingeniamos — Frío, salas limpias, alimentación, logística",
      description:
        "Soluciones de paneles sándwich y fábricas dirigidas por ingeniería para más de 12 sectores: frío industrial, alimentación, salas limpias farmacéuticas, almacenaje y construcción industrial y modular.",
    },
    fr: {
      title:
        "Secteurs pour lesquels nous concevons — Froid, salles blanches, agroalimentaire, logistique",
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

  "/solutions": {
    en: {
      title: "Solutions — Factory Development, Production Lines & Raw Materials",
      description:
        "Turnkey sandwich panel factories, high-speed PIR/PUR production lines, engineering consultancy and premium raw materials for manufacturers worldwide.",
    },
    ar: {
      title: "الحلول — تطوير المصانع وخطوط الإنتاج والمواد الخام",
      description:
        "مصانع ألواح ساندويتش جاهزة، وخطوط إنتاج PIR/PUR عالية السرعة، واستشارات هندسية ومواد خام متميزة للمصنّعين حول العالم.",
    },
    tr: {
      title: "Çözümler — Fabrika Kurulumu, Üretim Hatları ve Hammaddeler",
      description:
        "Anahtar teslim sandviç panel fabrikaları, yüksek hızlı PIR/PUR üretim hatları, mühendislik danışmanlığı ve dünya çapında üreticiler için premium hammaddeler.",
    },
    ru: {
      title: "Решения — Заводы под ключ, производственные линии и сырьё",
      description:
        "Заводы сэндвич-панелей под ключ, высокоскоростные линии PIR/PUR, инженерный консалтинг и премиум-сырьё для производителей по всему миру.",
    },
    pt: {
      title: "Soluções — Fábricas, linhas de produção e matérias-primas",
      description:
        "Fábricas de painéis sandwich chave-na-mão, linhas PIR/PUR de alta velocidade, consultoria de engenharia e matérias-primas premium para fabricantes globais.",
    },
    de: {
      title: "Lösungen — Werksentwicklung, Produktionslinien & Rohstoffe",
      description:
        "Schlüsselfertige Sandwichpanel-Werke, hochleistungsfähige PIR/PUR-Produktionslinien, Ingenieurberatung und Premium-Rohstoffe für Hersteller weltweit.",
    },
    es: {
      title: "Soluciones — Desarrollo de fábricas, líneas de producción y materias primas",
      description:
        "Fábricas llave en mano de paneles sándwich, líneas PIR/PUR de alta velocidad, consultoría de ingeniería y materias primas premium para fabricantes globales.",
    },
    fr: {
      title: "Solutions — Développement d'usines, lignes de production et matières premières",
      description:
        "Usines de panneaux sandwich clés en main, lignes PIR/PUR haute vitesse, conseil en ingénierie et matières premières premium pour industriels mondiaux.",
    },
    it: {
      title: "Soluzioni — Sviluppo stabilimenti, linee di produzione e materie prime",
      description:
        "Stabilimenti chiavi in mano di pannelli sandwich, linee PIR/PUR ad alta velocità, consulenza ingegneristica e materie prime premium per produttori globali.",
    },
    zh: {
      title: "解决方案 — 工厂建设、生产线与原材料",
      description:
        "面向全球制造商的交钥匙夹芯板工厂、高速 PIR/PUR 生产线、工程咨询以及优质原材料一体化解决方案。",
    },
  },

  "/solutions/factory-development": {
    en: {
      title: "Factory Development — Turnkey Sandwich Panel Plants",
      description:
        "End-to-end factory development for sandwich panel manufacturers: feasibility, layout, procurement, installation and commissioning under a single engineering contract.",
    },
    ar: {
      title: "تطوير المصانع — مصانع ألواح ساندويتش جاهزة بالكامل",
      description:
        "تطوير مصانع متكامل لمصنّعي ألواح الساندويتش: دراسة الجدوى، التخطيط، التوريد، التركيب والتشغيل ضمن عقد هندسي واحد.",
    },
    tr: {
      title: "Fabrika Kurulumu — Anahtar Teslim Sandviç Panel Tesisleri",
      description:
        "Sandviç panel üreticileri için uçtan uca fabrika kurulumu: fizibilite, yerleşim, tedarik, montaj ve devreye alma tek bir mühendislik sözleşmesi altında.",
    },
    ru: {
      title: "Развитие заводов — сэндвич-панельные предприятия под ключ",
      description:
        "Комплексное развитие заводов сэндвич-панелей: ТЭО, планировка, закупки, монтаж и пусконаладка в рамках одного инженерного контракта.",
    },
    pt: {
      title: "Desenvolvimento de fábricas — Unidades de painéis sandwich turnkey",
      description:
        "Desenvolvimento integral de fábricas de painéis sandwich: viabilidade, layout, aquisição, instalação e comissionamento sob um único contrato de engenharia.",
    },
    de: {
      title: "Werksentwicklung — Schlüsselfertige Sandwichpanel-Anlagen",
      description:
        "Durchgängige Werksentwicklung für Sandwichpanel-Hersteller: Machbarkeit, Layout, Beschaffung, Montage und Inbetriebnahme aus einer Hand.",
    },
    es: {
      title: "Desarrollo de fábricas — Plantas llave en mano de paneles sándwich",
      description:
        "Desarrollo integral de fábricas de paneles sándwich: viabilidad, layout, compras, instalación y puesta en marcha bajo un único contrato de ingeniería.",
    },
    fr: {
      title: "Développement d'usines — Sites clés en main de panneaux sandwich",
      description:
        "Développement complet d'usines de panneaux sandwich : faisabilité, layout, achats, installation et mise en service sous un seul contrat d'ingénierie.",
    },
    it: {
      title: "Sviluppo stabilimenti — Impianti di pannelli sandwich chiavi in mano",
      description:
        "Sviluppo integrale di stabilimenti di pannelli sandwich: fattibilità, layout, procurement, installazione e commissioning in un unico contratto ingegneristico.",
    },
    zh: {
      title: "工厂建设 — 交钥匙夹芯板整厂交付",
      description:
        "夹芯板制造商的端到端整厂开发:可行性、布局、采购、安装与调试,全部整合在同一份工程合同中。",
    },
  },

  "/solutions/production-lines": {
    en: {
      title: "Production Lines — Continuous & Discontinuous PIR/PUR Lines",
      description:
        "High-speed continuous and discontinuous sandwich panel production lines for PIR, PUR, mineral wool and EPS cores — engineered, delivered and commissioned by NEVO.",
    },
    ar: {
      title: "خطوط الإنتاج — خطوط PIR/PUR المستمرة والمتقطعة",
      description:
        "خطوط إنتاج ألواح ساندويتش عالية السرعة، مستمرة ومتقطعة، لأنوية PIR وPUR والصوف المعدني وEPS — تصميم وتوريد وتشغيل من نيفو.",
    },
    tr: {
      title: "Üretim Hatları — Sürekli ve Kesikli PIR/PUR Hatları",
      description:
        "PIR, PUR, taşyünü ve EPS çekirdekleri için yüksek hızlı sürekli ve kesikli sandviç panel üretim hatları — NEVO tarafından tasarlanır, teslim edilir ve devreye alınır.",
    },
    ru: {
      title: "Производственные линии — непрерывные и дискретные PIR/PUR",
      description:
        "Высокоскоростные непрерывные и дискретные линии сэндвич-панелей с ядрами PIR, PUR, минеральной ватой и EPS — проектирование, поставка и пусконаладка от NEVO.",
    },
    pt: {
      title: "Linhas de produção — Contínuas e descontínuas PIR/PUR",
      description:
        "Linhas contínuas e descontínuas de painéis sandwich em alta velocidade para PIR, PUR, lã mineral e EPS — projeto, entrega e comissionamento pela NEVO.",
    },
    de: {
      title: "Produktionslinien — Kontinuierliche & diskontinuierliche PIR/PUR-Linien",
      description:
        "Hochleistungslinien für kontinuierliche und diskontinuierliche Sandwichpanele mit PIR-, PUR-, Mineralwolle- und EPS-Kernen — Engineering, Lieferung und Inbetriebnahme durch NEVO.",
    },
    es: {
      title: "Líneas de producción — Continuas y discontinuas PIR/PUR",
      description:
        "Líneas continuas y discontinuas de paneles sándwich de alta velocidad para PIR, PUR, lana mineral y EPS — ingeniería, entrega y puesta en marcha por NEVO.",
    },
    fr: {
      title: "Lignes de production — Continues et discontinues PIR/PUR",
      description:
        "Lignes de panneaux sandwich haute vitesse, continues et discontinues, pour âmes PIR, PUR, laine minérale et EPS — étudiées, livrées et mises en service par NEVO.",
    },
    it: {
      title: "Linee di produzione — Continue e discontinue PIR/PUR",
      description:
        "Linee di pannelli sandwich ad alta velocità, continue e discontinue, per anime PIR, PUR, lana minerale ed EPS — ingegnerizzate, consegnate e messe in servizio da NEVO.",
    },
    zh: {
      title: "生产线 — 连续与不连续 PIR/PUR 夹芯板线",
      description:
        "适用于 PIR、PUR、岩棉及 EPS 芯材的高速连续与不连续夹芯板生产线,由 NEVO 完成工程设计、交付与调试。",
    },
  },

  "/solutions/engineering-consultancy": {
    en: {
      title: "Engineering Consultancy — Feasibility, Layout & Process Design",
      description:
        "Independent industrial engineering consultancy for sandwich panel investors: feasibility, plant layout, process design, procurement strategy and commissioning support.",
    },
    ar: {
      title: "الاستشارات الهندسية — دراسات الجدوى والتخطيط وتصميم العملية",
      description:
        "استشارات هندسية صناعية مستقلة لمستثمري ألواح الساندويتش: الجدوى، تخطيط المصنع، تصميم العملية، استراتيجية التوريد ودعم التشغيل.",
    },
    tr: {
      title: "Mühendislik Danışmanlığı — Fizibilite, Yerleşim ve Süreç Tasarımı",
      description:
        "Sandviç panel yatırımcıları için bağımsız endüstriyel mühendislik danışmanlığı: fizibilite, tesis yerleşimi, süreç tasarımı, tedarik stratejisi ve devreye alma desteği.",
    },
    ru: {
      title: "Инженерный консалтинг — ТЭО, планировка и проектирование процессов",
      description:
        "Независимый промышленный инжиниринг для инвесторов сэндвич-панелей: ТЭО, планировка завода, проектирование процессов, стратегия закупок и поддержка пусконаладки.",
    },
    pt: {
      title: "Consultoria de engenharia — Viabilidade, layout e processo",
      description:
        "Consultoria industrial independente para investidores em painéis sandwich: viabilidade, layout, engenharia de processo, estratégia de compras e apoio ao comissionamento.",
    },
    de: {
      title: "Engineering-Beratung — Machbarkeit, Layout & Prozessdesign",
      description:
        "Unabhängige industrielle Engineering-Beratung für Sandwichpanel-Investoren: Machbarkeit, Werkslayout, Prozessdesign, Beschaffungsstrategie und Inbetriebnahme-Support.",
    },
    es: {
      title: "Consultoría de ingeniería — Viabilidad, layout y proceso",
      description:
        "Consultoría industrial independiente para inversores en paneles sándwich: viabilidad, layout de planta, ingeniería de proceso, estrategia de compras y soporte al commissioning.",
    },
    fr: {
      title: "Conseil en ingénierie — Faisabilité, layout et procédés",
      description:
        "Conseil industriel indépendant pour les investisseurs en panneaux sandwich : faisabilité, layout d'usine, ingénierie procédés, stratégie d'achats et mise en service.",
    },
    it: {
      title: "Consulenza ingegneristica — Fattibilità, layout e processo",
      description:
        "Consulenza industriale indipendente per investitori di pannelli sandwich: fattibilità, layout di stabilimento, ingegneria di processo, strategia di procurement e commissioning.",
    },
    zh: {
      title: "工程咨询 — 可行性、布局与工艺设计",
      description:
        "面向夹芯板投资者的独立工业工程咨询:可行性研究、工厂布局、工艺设计、采购策略与调试支持。",
    },
  },

  "/solutions/raw-materials": {
    en: {
      title: "Raw Materials — PPGI, Galvanized Steel, PIR & PUR Chemicals",
      description:
        "Certified raw material supply for sandwich panel manufacturers: PPGI, hot-dip galvanized steel, aluminium coils and PIR/PUR chemical systems, delivered globally.",
    },
    ar: {
      title: "المواد الخام — PPGI والفولاذ المجلفن ومواد PIR وPUR",
      description:
        "توريد مواد خام معتمدة لمصنّعي ألواح الساندويتش: PPGI، الفولاذ المجلفن بالغمس الساخن، بكرات الألومنيوم وأنظمة PIR/PUR الكيميائية — تسليم عالمي.",
    },
    tr: {
      title: "Hammaddeler — PPGI, Galvanizli Çelik, PIR ve PUR Kimyasalları",
      description:
        "Sandviç panel üreticileri için sertifikalı hammadde tedariki: PPGI, sıcak daldırma galvanizli çelik, alüminyum rulo ve PIR/PUR kimyasal sistemleri — küresel teslimat.",
    },
    ru: {
      title: "Сырьё — PPGI, оцинкованная сталь, химия PIR и PUR",
      description:
        "Сертифицированное сырьё для производителей сэндвич-панелей: PPGI, горячеоцинкованная сталь, алюминиевые рулоны и химические системы PIR/PUR — поставки по всему миру.",
    },
    pt: {
      title: "Matérias-primas — PPGI, aço galvanizado, químicos PIR e PUR",
      description:
        "Fornecimento certificado de matérias-primas para fabricantes de painéis sandwich: PPGI, aço galvanizado a quente, bobinas de alumínio e sistemas químicos PIR/PUR — entrega global.",
    },
    de: {
      title: "Rohstoffe — PPGI, verzinkter Stahl, PIR- und PUR-Chemikalien",
      description:
        "Zertifizierte Rohstoffversorgung für Sandwichpanel-Hersteller: PPGI, feuerverzinkter Stahl, Aluminium-Coils und PIR/PUR-Chemikaliensysteme — weltweite Lieferung.",
    },
    es: {
      title: "Materias primas — PPGI, acero galvanizado, químicos PIR y PUR",
      description:
        "Suministro certificado de materias primas para fabricantes de paneles sándwich: PPGI, acero galvanizado en caliente, bobinas de aluminio y sistemas químicos PIR/PUR — entrega global.",
    },
    fr: {
      title: "Matières premières — PPGI, acier galvanisé, chimie PIR et PUR",
      description:
        "Approvisionnement certifié pour fabricants de panneaux sandwich : PPGI, acier galvanisé à chaud, bobines aluminium et systèmes chimiques PIR/PUR — livraison mondiale.",
    },
    it: {
      title: "Materie prime — PPGI, acciaio zincato, chimici PIR e PUR",
      description:
        "Fornitura certificata di materie prime per produttori di pannelli sandwich: PPGI, acciaio zincato a caldo, coil di alluminio e sistemi chimici PIR/PUR — consegna globale.",
    },
    zh: {
      title: "原材料 — PPGI、镀锌钢及 PIR/PUR 化学品",
      description:
        "面向夹芯板制造商的认证原材料供应:PPGI、热浸镀锌钢、铝卷及 PIR/PUR 化学体系,全球配送。",
    },
  },

  "/solutions/sandwich-panels": {
    en: {
      title: "Sandwich Panels — PIR, PUR, Rock Wool & EPS Finished Panels",
      description:
        "Finished sandwich panels engineered for cold storage, clean rooms, walls and roofs — PIR, PUR, Rock Wool and EPS cores in every thickness and finish.",
    },
    ar: {
      title: "ألواح الساندويتش — PIR وPUR والصوف الصخري وEPS جاهزة",
      description:
        "ألواح ساندويتش جاهزة مصمّمة للتخزين المبرّد والغرف النظيفة والجدران والأسقف — أنوية PIR وPUR والصوف الصخري وEPS بجميع السماكات والتشطيبات.",
    },
    tr: {
      title: "Sandviç Paneller — PIR, PUR, Taşyünü ve EPS Bitmiş Paneller",
      description:
        "Soğuk hava depoları, temiz odalar, duvar ve çatı için tasarlanmış bitmiş sandviç paneller — PIR, PUR, taşyünü ve EPS çekirdekler, her kalınlık ve yüzeyde.",
    },
    ru: {
      title: "Сэндвич-панели — Готовые панели PIR, PUR, минвата и EPS",
      description:
        "Готовые сэндвич-панели для холодильных складов, чистых помещений, стен и кровли — сердечники PIR, PUR, минеральной ваты и EPS любой толщины и покрытия.",
    },
    pt: {
      title: "Painéis sandwich — PIR, PUR, lã de rocha e EPS acabados",
      description:
        "Painéis sandwich acabados para frio, salas limpas, paredes e coberturas — núcleos PIR, PUR, lã de rocha e EPS em todas as espessuras e acabamentos.",
    },
    de: {
      title: "Sandwichpanele — PIR, PUR, Steinwolle & EPS als Fertigpanele",
      description:
        "Fertige Sandwichpanele für Kühllager, Reinräume, Wand und Dach — PIR-, PUR-, Steinwolle- und EPS-Kerne in allen Dicken und Oberflächen.",
    },
    es: {
      title: "Paneles sándwich — PIR, PUR, lana de roca y EPS acabados",
      description:
        "Paneles sándwich acabados para frío, salas limpias, muros y cubiertas — núcleos PIR, PUR, lana de roca y EPS en todos los espesores y acabados.",
    },
    fr: {
      title: "Panneaux sandwich — PIR, PUR, laine de roche et EPS finis",
      description:
        "Panneaux sandwich finis pour froid, salles blanches, bardage et couverture — âmes PIR, PUR, laine de roche et EPS, toutes épaisseurs et finitions.",
    },
    it: {
      title: "Pannelli sandwich — PIR, PUR, lana di roccia ed EPS finiti",
      description:
        "Pannelli sandwich finiti per celle frigo, camere bianche, pareti e coperture — anime PIR, PUR, lana di roccia ed EPS in tutti gli spessori e finiture.",
    },
    zh: {
      title: "夹芯板 — PIR、PUR、岩棉及 EPS 成品板",
      description:
        "面向冷库、洁净室、墙面与屋面的成品夹芯板 — PIR、PUR、岩棉及 EPS 芯材,提供各种厚度与表面处理。",
    },
  },

  "/ai-assistant": {
    en: {
      title: "NEVO AI Assistant — Instant Engineering Answers for Sandwich Panels",
      description:
        "Ask the NEVO AI Assistant about panel specs, factory sizing, PIR vs Rock Wool, cold storage design and production line configuration — 24/7, in 10 languages.",
    },
    ar: {
      title: "مساعد نيفو الذكي — إجابات هندسية فورية لألواح الساندويتش",
      description:
        "اسأل مساعد نيفو الذكي عن مواصفات الألواح وحجم المصانع ومقارنة PIR بالصوف الصخري وتصميم التخزين المبرّد وتهيئة خطوط الإنتاج — على مدار الساعة، بعشر لغات.",
    },
    tr: {
      title: "NEVO AI Asistanı — Sandviç Panel Mühendisliğinde Anlık Yanıtlar",
      description:
        "NEVO AI Asistanı'na panel spesifikasyonları, fabrika boyutlandırma, PIR–Taşyünü karşılaştırması, soğuk depo tasarımı ve hat konfigürasyonunu sorun — 7/24, 10 dilde.",
    },
    ru: {
      title: "AI-ассистент NEVO — Инженерные ответы по сэндвич-панелям",
      description:
        "Задайте AI-ассистенту NEVO вопросы о характеристиках панелей, размерах завода, PIR vs минвата, холодильных складах и настройке производственных линий — 24/7, на 10 языках.",
    },
    pt: {
      title: "Assistente IA da NEVO — Respostas instantâneas de engenharia",
      description:
        "Pergunte ao Assistente IA da NEVO sobre painéis, dimensionamento de fábricas, PIR vs lã de rocha, câmaras de frio e configuração de linhas — 24/7, em 10 idiomas.",
    },
    de: {
      title: "NEVO KI-Assistent — Sofort-Engineering-Antworten zu Sandwichpanelen",
      description:
        "Fragen Sie den NEVO KI-Assistenten zu Panelspezifikationen, Werksauslegung, PIR vs. Steinwolle, Kühllagern und Linienkonfiguration — rund um die Uhr, in 10 Sprachen.",
    },
    es: {
      title: "Asistente IA de NEVO — Respuestas instantáneas de ingeniería",
      description:
        "Pregunte al Asistente IA de NEVO sobre paneles, dimensionamiento de fábricas, PIR vs lana de roca, cámaras frigoríficas y configuración de líneas — 24/7, en 10 idiomas.",
    },
    fr: {
      title: "Assistant IA NEVO — Réponses d'ingénierie instantanées",
      description:
        "Interrogez l'assistant IA NEVO sur les panneaux, le dimensionnement d'usine, PIR vs laine de roche, le froid et la configuration des lignes — 24/7, en 10 langues.",
    },
    it: {
      title: "Assistente IA NEVO — Risposte ingegneristiche istantanee",
      description:
        "Chiedi all'assistente IA NEVO di specifiche pannelli, dimensionamento stabilimenti, PIR vs lana di roccia, celle frigo e configurazione linee — 24/7, in 10 lingue.",
    },
    zh: {
      title: "NEVO AI 助手 — 夹芯板工程问题即时解答",
      description:
        "向 NEVO AI 助手咨询板材规格、工厂产能、PIR 与岩棉对比、冷库设计与生产线配置,10 种语言全天候在线。",
    },
  },

  "/ai-project-estimator": {
    en: {
      title: "AI Project Estimator — Sandwich Panel Factory CAPEX in Minutes",
      description:
        "Estimate CAPEX, footprint, throughput and payback for a sandwich panel factory in minutes. Instant AI-powered engineering estimates from NEVO Industrial.",
    },
    ar: {
      title: "المقدّر الذكي للمشاريع — تكلفة مصنع ألواح ساندويتش خلال دقائق",
      description:
        "قدّر التكلفة الرأسمالية والمساحة والإنتاجية وفترة الاسترداد لمصنع ألواح ساندويتش خلال دقائق. تقديرات هندسية فورية بالذكاء الاصطناعي من نيفو الصناعية.",
    },
    tr: {
      title: "AI Proje Tahminleyici — Sandviç Panel Fabrikası CAPEX'i Dakikalar İçinde",
      description:
        "Bir sandviç panel fabrikasının CAPEX, alan, kapasite ve geri ödeme süresini dakikalar içinde tahmin edin. NEVO Industrial'dan yapay zekâ destekli anlık mühendislik.",
    },
    ru: {
      title: "AI-оценщик проектов — CAPEX завода сэндвич-панелей за минуты",
      description:
        "Оцените CAPEX, площадь, производительность и срок окупаемости завода сэндвич-панелей за минуты. Мгновенные инженерные расчёты AI от NEVO Industrial.",
    },
    pt: {
      title: "Estimador IA de projetos — CAPEX de fábrica em minutos",
      description:
        "Estime CAPEX, área, produção e retorno de uma fábrica de painéis sandwich em minutos. Cálculos de engenharia instantâneos, com IA, da NEVO Industrial.",
    },
    de: {
      title: "KI-Projektkalkulator — CAPEX für Sandwichpanel-Werke in Minuten",
      description:
        "Schätzen Sie CAPEX, Flächenbedarf, Durchsatz und Amortisation eines Sandwichpanel-Werks in Minuten — sofortige KI-gestützte Engineering-Auslegungen von NEVO.",
    },
    es: {
      title: "Estimador IA de proyectos — CAPEX de fábrica en minutos",
      description:
        "Estime CAPEX, superficie, capacidad y retorno de una fábrica de paneles sándwich en minutos. Cálculos de ingeniería con IA, instantáneos, de NEVO Industrial.",
    },
    fr: {
      title: "Estimateur IA de projet — CAPEX d'usine en quelques minutes",
      description:
        "Estimez CAPEX, surface, débit et retour d'une usine de panneaux sandwich en quelques minutes. Estimations d'ingénierie IA instantanées par NEVO Industrial.",
    },
    it: {
      title: "Stimatore IA di progetti — CAPEX di stabilimento in minuti",
      description:
        "Stima CAPEX, superficie, capacità e payback di uno stabilimento di pannelli sandwich in pochi minuti. Stime ingegneristiche IA immediate di NEVO Industrial.",
    },
    zh: {
      title: "AI 项目估算器 — 数分钟内评估夹芯板工厂 CAPEX",
      description:
        "数分钟内即可估算夹芯板工厂的资本支出、占地、产能与回收期,NEVO Industrial 提供的 AI 工程估算。",
    },
  },

  "/careers": {
    en: {
      title: "Careers at NEVO Industrial — Engineering, Sales & Operations",
      description:
        "Join a global industrial engineering group in Dubai. Open roles for process engineers, sales engineers, project managers and factory operations specialists.",
    },
    ar: {
      title: "الوظائف في نيفو الصناعية — الهندسة والمبيعات والعمليات",
      description:
        "انضم إلى مجموعة هندسة صناعية عالمية في دبي. وظائف شاغرة لمهندسي العمليات ومهندسي المبيعات ومدراء المشاريع ومتخصصي عمليات المصانع.",
    },
    tr: {
      title: "NEVO Industrial'da Kariyer — Mühendislik, Satış ve Operasyonlar",
      description:
        "Dubai'deki global endüstriyel mühendislik grubuna katılın. Süreç mühendisleri, satış mühendisleri, proje yöneticileri ve fabrika operasyon uzmanları için açık pozisyonlar.",
    },
    ru: {
      title: "Карьера в NEVO Industrial — Инженерия, продажи и операции",
      description:
        "Присоединяйтесь к глобальной промышленно-инжиниринговой группе в Дубае. Открытые вакансии: инженеры-технологи, инженеры продаж, руководители проектов и специалисты производства.",
    },
    pt: {
      title: "Carreiras na NEVO Industrial — Engenharia, vendas e operações",
      description:
        "Junte-se a um grupo global de engenharia industrial em Dubai. Vagas para engenheiros de processo, engenheiros de vendas, gestores de projeto e especialistas de fábrica.",
    },
    de: {
      title: "Karriere bei NEVO Industrial — Engineering, Vertrieb & Operations",
      description:
        "Werden Sie Teil einer globalen Industrial-Engineering-Gruppe in Dubai. Offene Stellen für Verfahrensingenieure, Vertriebsingenieure, Projektleiter und Werksoperations-Spezialisten.",
    },
    es: {
      title: "Empleo en NEVO Industrial — Ingeniería, ventas y operaciones",
      description:
        "Únase a un grupo global de ingeniería industrial en Dubái. Vacantes para ingenieros de proceso, ingenieros de ventas, jefes de proyecto y especialistas de operaciones.",
    },
    fr: {
      title: "Carrières chez NEVO Industrial — Ingénierie, vente & opérations",
      description:
        "Rejoignez un groupe international d'ingénierie industrielle à Dubaï. Postes ouverts : ingénieurs procédés, ingénieurs commerciaux, chefs de projet et opérations usine.",
    },
    it: {
      title: "Lavora con NEVO Industrial — Ingegneria, vendite e operations",
      description:
        "Unisciti a un gruppo globale di ingegneria industriale a Dubai. Posizioni aperte: ingegneri di processo, sales engineer, project manager e specialisti di stabilimento.",
    },
    zh: {
      title: "NEVO Industrial 招聘 — 工程、销售与运营职位",
      description:
        "加入总部位于迪拜的全球工业工程集团。工艺工程师、销售工程师、项目经理及工厂运营专家等岗位持续招聘。",
    },
  },

  "/customer-portal": {
    en: {
      title: "Customer Portal — Projects, Documents & Support",
      description:
        "Track sandwich panel projects, download engineering documentation and reach NEVO support from a single secure customer portal.",
    },
    ar: {
      title: "بوابة العملاء — المشاريع والوثائق والدعم",
      description:
        "تابع مشاريع ألواح الساندويتش وحمّل الوثائق الهندسية وتواصل مع دعم نيفو من بوابة عملاء واحدة آمنة.",
    },
    tr: {
      title: "Müşteri Portalı — Projeler, Dokümanlar ve Destek",
      description:
        "Sandviç panel projelerinizi takip edin, mühendislik dokümanlarını indirin ve NEVO desteğine tek bir güvenli müşteri portalından ulaşın.",
    },
    ru: {
      title: "Клиентский портал — Проекты, документы и поддержка",
      description:
        "Следите за проектами сэндвич-панелей, скачивайте инженерную документацию и связывайтесь с поддержкой NEVO в едином защищённом клиентском портале.",
    },
    pt: {
      title: "Portal do cliente — Projetos, documentos e suporte",
      description:
        "Acompanhe projetos de painéis sandwich, descarregue documentação de engenharia e contacte o suporte NEVO num único portal seguro.",
    },
    de: {
      title: "Kundenportal — Projekte, Dokumente & Support",
      description:
        "Verfolgen Sie Sandwichpanel-Projekte, laden Sie Engineering-Dokumente herunter und erreichen Sie den NEVO-Support in einem sicheren Kundenportal.",
    },
    es: {
      title: "Portal de clientes — Proyectos, documentos y soporte",
      description:
        "Siga proyectos de paneles sándwich, descargue documentación de ingeniería y contacte con el soporte NEVO desde un único portal seguro.",
    },
    fr: {
      title: "Portail Client — Projets, documents et support",
      description:
        "Suivez vos projets de panneaux sandwich, téléchargez la documentation d'ingénierie et joignez le support NEVO depuis un portail client unique et sécurisé.",
    },
    it: {
      title: "Portale Clienti — Progetti, documenti e supporto",
      description:
        "Segui i progetti di pannelli sandwich, scarica la documentazione ingegneristica e contatta il supporto NEVO da un unico portale sicuro.",
    },
    zh: {
      title: "客户门户 — 项目、文档与支持",
      description: "在统一安全的客户门户中跟踪夹芯板项目进度、下载工程文档并与 NEVO 支持团队沟通。",
    },
  },

  "/partner-portal": {
    en: {
      title: "Partner Portal — Distributors, Installers & Engineering Partners",
      description:
        "Access spec sheets, pricing, project pipelines and joint marketing assets in the NEVO Industrial partner portal for distributors and installers.",
    },
    ar: {
      title: "بوابة الشركاء — الموزّعون والمركّبون والشركاء الهندسيون",
      description:
        "الوصول إلى أوراق المواصفات والأسعار ومسارات المشاريع ومواد التسويق المشترك في بوابة شركاء نيفو الصناعية للموزّعين والمركّبين.",
    },
    tr: {
      title: "Partner Portalı — Distribütörler, Montajcılar ve Mühendislik Ortakları",
      description:
        "Distribütörler ve montajcılar için NEVO Industrial partner portalında teknik föyler, fiyatlar, proje pipeline'ları ve ortak pazarlama materyallerine erişin.",
    },
    ru: {
      title: "Портал партнёров — Дистрибьюторы, монтажники и инженерные партнёры",
      description:
        "Доступ к спецификациям, ценам, проектному пайплайну и совместным маркетинговым материалам в портале партнёров NEVO Industrial.",
    },
    pt: {
      title: "Portal de Parceiros — Distribuidores, instaladores e parceiros",
      description:
        "Aceda a fichas técnicas, preços, pipeline de projetos e materiais de marketing conjuntos no portal de parceiros da NEVO Industrial.",
    },
    de: {
      title: "Partnerportal — Distributoren, Monteure & Engineering-Partner",
      description:
        "Datenblätter, Preise, Projektpipelines und gemeinsame Marketingassets im NEVO Industrial Partnerportal für Distributoren und Monteure.",
    },
    es: {
      title: "Portal de Partners — Distribuidores, instaladores y socios",
      description:
        "Acceda a fichas técnicas, precios, pipeline de proyectos y materiales de marketing conjunto en el portal de partners de NEVO Industrial.",
    },
    fr: {
      title: "Portail Partenaires — Distributeurs, installateurs & partenaires",
      description:
        "Accédez aux fiches techniques, tarifs, pipeline projets et supports marketing conjoints dans le portail partenaires NEVO Industrial.",
    },
    it: {
      title: "Portale Partner — Distributori, installatori e partner",
      description:
        "Accedi a schede tecniche, prezzi, pipeline progetti e materiali di co-marketing nel portale partner di NEVO Industrial.",
    },
    zh: {
      title: "合作伙伴门户 — 经销商、安装商与工程合作伙伴",
      description:
        "在 NEVO Industrial 合作伙伴门户中获取技术规格书、价格、项目管道及联合营销资料。",
    },
  },

  "/download-center": {
    en: {
      title: "Download Center — Spec Sheets, Brochures & Technical Guides",
      description:
        "Download NEVO Industrial spec sheets, brochures, technical guides and CAD details for sandwich panels, production lines and raw materials.",
    },
    ar: {
      title: "مركز التنزيلات — أوراق المواصفات والكتيبات والأدلة الفنية",
      description:
        "حمّل أوراق مواصفات نيفو الصناعية والكتيبات والأدلة الفنية وتفاصيل CAD لألواح الساندويتش وخطوط الإنتاج والمواد الخام.",
    },
    tr: {
      title: "İndirme Merkezi — Teknik Föyler, Broşürler ve Kılavuzlar",
      description:
        "Sandviç paneller, üretim hatları ve hammaddeler için NEVO Industrial teknik föy, broşür, kılavuz ve CAD detaylarını indirin.",
    },
    ru: {
      title: "Центр загрузок — Спецификации, брошюры и технические руководства",
      description:
        "Скачивайте спецификации, брошюры, технические руководства и CAD-детали NEVO Industrial для сэндвич-панелей, линий и сырья.",
    },
    pt: {
      title: "Centro de Downloads — Fichas técnicas, brochuras e guias",
      description:
        "Descarregue fichas técnicas, brochuras, guias e detalhes CAD da NEVO Industrial para painéis sandwich, linhas de produção e matérias-primas.",
    },
    de: {
      title: "Download-Center — Datenblätter, Broschüren & technische Leitfäden",
      description:
        "Laden Sie Datenblätter, Broschüren, technische Leitfäden und CAD-Details von NEVO Industrial für Sandwichpanele, Produktionslinien und Rohstoffe herunter.",
    },
    es: {
      title: "Centro de Descargas — Fichas técnicas, folletos y guías",
      description:
        "Descargue fichas técnicas, folletos, guías técnicas y detalles CAD de NEVO Industrial para paneles sándwich, líneas de producción y materias primas.",
    },
    fr: {
      title: "Centre de téléchargement — Fiches techniques, brochures et guides",
      description:
        "Téléchargez fiches techniques, brochures, guides et détails CAD NEVO Industrial pour panneaux sandwich, lignes de production et matières premières.",
    },
    it: {
      title: "Download Center — Schede tecniche, brochure e guide",
      description:
        "Scarica schede tecniche, brochure, guide e dettagli CAD NEVO Industrial per pannelli sandwich, linee di produzione e materie prime.",
    },
    zh: {
      title: "下载中心 — 技术规格书、宣传册与技术指南",
      description:
        "下载 NEVO Industrial 的技术规格书、宣传册、技术指南及 CAD 图集,涵盖夹芯板、生产线与原材料。",
    },
  },

  "/engineering-tools": {
    en: {
      title: "Engineering Tools — Calculators & Configurators for Panel Projects",
      description:
        "A suite of engineering tools for sandwich panel projects: thickness calculator, factory layout generator, investment calculator, product configurator and more.",
    },
    ar: {
      title: "الأدوات الهندسية — حاسبات وأدوات تكوين لمشاريع الألواح",
      description:
        "مجموعة أدوات هندسية لمشاريع ألواح الساندويتش: حاسبة السماكة، مولّد تخطيط المصنع، حاسبة الاستثمار، أداة تكوين المنتج والمزيد.",
    },
    tr: {
      title: "Mühendislik Araçları — Panel Projeleri için Hesaplayıcılar",
      description:
        "Sandviç panel projeleri için mühendislik araçları: kalınlık hesaplayıcı, fabrika yerleşim üreticisi, yatırım hesaplayıcı, ürün konfigüratörü ve daha fazlası.",
    },
    ru: {
      title: "Инженерные инструменты — Калькуляторы и конфигураторы",
      description:
        "Набор инженерных инструментов для проектов сэндвич-панелей: калькулятор толщины, генератор планировки завода, инвестиционный калькулятор и конфигуратор продукта.",
    },
    pt: {
      title: "Ferramentas de engenharia — Calculadoras e configuradores",
      description:
        "Conjunto de ferramentas para projetos de painéis sandwich: calculadora de espessura, gerador de layout, calculadora de investimento e configurador de produto.",
    },
    de: {
      title: "Engineering-Tools — Rechner & Konfiguratoren für Panelprojekte",
      description:
        "Engineering-Tools für Sandwichpanel-Projekte: Dickenrechner, Werkslayout-Generator, Investitionsrechner, Produktkonfigurator und mehr.",
    },
    es: {
      title: "Herramientas de ingeniería — Calculadoras y configuradores",
      description:
        "Suite de herramientas para proyectos de paneles sándwich: calculadora de espesor, generador de layout de fábrica, calculadora de inversión y configurador de producto.",
    },
    fr: {
      title: "Outils d'ingénierie — Calculateurs et configurateurs",
      description:
        "Suite d'outils pour projets de panneaux sandwich : calculateur d'épaisseur, générateur de layout, calculateur d'investissement et configurateur de produit.",
    },
    it: {
      title: "Strumenti di ingegneria — Calcolatori e configuratori",
      description:
        "Suite di strumenti per progetti di pannelli sandwich: calcolatore di spessore, generatore di layout, calcolatore di investimento e configuratore di prodotto.",
    },
    zh: {
      title: "工程工具 — 面向夹芯板项目的计算器与配置器",
      description:
        "面向夹芯板项目的工程工具集:板厚计算器、工厂布局生成器、投资回报计算器与产品配置器等。",
    },
  },

  "/factory-layout-generator": {
    en: {
      title: "Factory Layout Generator — Instant Sandwich Panel Plant Layouts",
      description:
        "Generate optimised sandwich panel factory layouts in minutes: line footprint, storage, utilities and expansion zones sized to your capacity target.",
    },
    ar: {
      title: "مولّد تخطيط المصنع — تخطيطات مصانع ألواح فورية",
      description:
        "أنشئ تخطيطات محسّنة لمصانع ألواح الساندويتش خلال دقائق: مساحة الخط والتخزين والمرافق ومناطق التوسّع بحسب الطاقة المستهدفة.",
    },
    tr: {
      title: "Fabrika Yerleşim Üreticisi — Anlık Sandviç Panel Tesis Yerleşimi",
      description:
        "Dakikalar içinde optimize edilmiş sandviç panel fabrika yerleşimleri oluşturun: hat alanı, depolama, tesisat ve genişleme bölgeleri hedef kapasitenize göre.",
    },
    ru: {
      title: "Генератор планировки завода — Мгновенные раскладки под ключ",
      description:
        "Создавайте оптимизированные планировки заводов сэндвич-панелей за минуты: линия, склады, инженерные системы и зоны расширения под вашу мощность.",
    },
    pt: {
      title: "Gerador de layout de fábrica — Layouts instantâneos",
      description:
        "Gere layouts otimizados de fábricas de painéis sandwich em minutos: linha, armazenagem, utilidades e áreas de expansão dimensionadas à sua capacidade.",
    },
    de: {
      title: "Werkslayout-Generator — Sofortige Sandwichpanel-Layouts",
      description:
        "Erzeugen Sie optimierte Sandwichpanel-Werkslayouts in Minuten: Linienfläche, Lager, Medien und Erweiterungsbereiche passend zur Zielkapazität.",
    },
    es: {
      title: "Generador de layout de fábrica — Distribuciones instantáneas",
      description:
        "Genere layouts optimizados de fábricas de paneles sándwich en minutos: línea, almacén, utilities y zonas de expansión dimensionadas a su capacidad.",
    },
    fr: {
      title: "Générateur de layout d'usine — Plans instantanés de panneaux",
      description:
        "Générez des layouts optimisés d'usine de panneaux sandwich en quelques minutes : ligne, stockage, utilités et zones d'extension dimensionnés à votre capacité.",
    },
    it: {
      title: "Generatore di layout di stabilimento — Layout istantanei",
      description:
        "Genera layout ottimizzati di stabilimenti di pannelli sandwich in pochi minuti: linea, magazzino, utilities e aree di espansione dimensionati alla capacità.",
    },
    zh: {
      title: "工厂布局生成器 — 秒级生成夹芯板厂布局",
      description:
        "分钟级生成优化的夹芯板工厂布局:生产线占地、仓储、公用工程与扩展区,按目标产能自动匹配。",
    },
  },

  "/factory-layouts": {
    en: {
      title: "Factory Layout Library — Reference Plants from 5,000 to 50,000 m²",
      description:
        "Reference sandwich panel factory layouts from 5,000 to 50,000 m². Explore proven line arrangements, storage strategies and utility zoning by capacity.",
    },
    ar: {
      title: "مكتبة تخطيطات المصانع — مصانع مرجعية من 5000 إلى 50000 م²",
      description:
        "تخطيطات مرجعية لمصانع ألواح الساندويتش من 5000 إلى 50000 م². استكشف ترتيبات الخطوط واستراتيجيات التخزين وتقسيم المرافق حسب الطاقة.",
    },
    tr: {
      title: "Fabrika Yerleşim Kütüphanesi — 5.000–50.000 m² Referans Tesisler",
      description:
        "5.000–50.000 m² arası referans sandviç panel fabrika yerleşimleri. Kanıtlanmış hat düzenleri, depo stratejileri ve tesisat bölgeleme örneklerini keşfedin.",
    },
    ru: {
      title: "Библиотека планировок заводов — от 5 000 до 50 000 м²",
      description:
        "Референсные планировки заводов сэндвич-панелей от 5 000 до 50 000 м². Проверенные схемы линий, склады и зоны инженерных сетей по мощности.",
    },
    pt: {
      title: "Biblioteca de layouts de fábrica — 5.000 a 50.000 m²",
      description:
        "Layouts de referência de fábricas de painéis sandwich de 5.000 a 50.000 m². Arranjos de linha comprovados, estratégias de armazenagem e zoneamento de utilidades.",
    },
    de: {
      title: "Layout-Bibliothek — Referenzwerke von 5.000 bis 50.000 m²",
      description:
        "Referenzlayouts für Sandwichpanel-Werke von 5.000 bis 50.000 m². Bewährte Linienanordnungen, Lagerkonzepte und Medienzonierung nach Kapazität.",
    },
    es: {
      title: "Biblioteca de layouts — Fábricas de 5.000 a 50.000 m²",
      description:
        "Layouts de referencia de fábricas de paneles sándwich de 5.000 a 50.000 m². Distribuciones de línea probadas, almacén y zonificación de utilities por capacidad.",
    },
    fr: {
      title: "Bibliothèque de layouts d'usines — 5 000 à 50 000 m²",
      description:
        "Layouts de référence d'usines de panneaux sandwich de 5 000 à 50 000 m². Configurations de ligne éprouvées, stockage et zonage des utilités par capacité.",
    },
    it: {
      title: "Libreria di layout di stabilimento — da 5.000 a 50.000 m²",
      description:
        "Layout di riferimento di stabilimenti di pannelli sandwich da 5.000 a 50.000 m². Configurazioni di linea provate, magazzino e zonizzazione utilities per capacità.",
    },
    zh: {
      title: "工厂布局库 — 5,000 至 50,000 平方米参考工厂",
      description:
        "5,000 至 50,000 平方米夹芯板工厂参考布局:成熟产线排布、仓储策略与公用工程分区,按产能选型。",
    },
  },

  "/installation-commissioning": {
    en: {
      title: "Installation & Commissioning — On-Site Line Startup & Training",
      description:
        "On-site installation, mechanical erection, cold and hot commissioning, SAT testing and operator training for sandwich panel production lines worldwide.",
    },
    ar: {
      title: "التركيب والتشغيل — بدء الخط في الموقع وتدريب المشغّلين",
      description:
        "التركيب في الموقع والتجميع الميكانيكي والتشغيل البارد والحار واختبارات SAT وتدريب المشغّلين لخطوط ألواح الساندويتش حول العالم.",
    },
    tr: {
      title: "Montaj ve Devreye Alma — Sahada Hat Başlangıcı ve Eğitim",
      description:
        "Sandviç panel üretim hatları için sahada montaj, mekanik kurulum, soğuk-sıcak devreye alma, SAT testleri ve operatör eğitimi — dünya çapında.",
    },
    ru: {
      title: "Монтаж и пусконаладка — запуск линии и обучение операторов",
      description:
        "Монтаж на площадке, механическая сборка, холодная и горячая пусконаладка, SAT-тесты и обучение операторов для линий сэндвич-панелей по всему миру.",
    },
    pt: {
      title: "Instalação e comissionamento — Arranque de linha e formação",
      description:
        "Instalação em obra, montagem mecânica, comissionamento a frio e a quente, testes SAT e formação de operadores para linhas de painéis sandwich em todo o mundo.",
    },
    de: {
      title: "Installation & Inbetriebnahme — Vor-Ort-Anlauf & Training",
      description:
        "Montage vor Ort, mechanische Errichtung, Kalt- und Heißinbetriebnahme, SAT-Tests und Bedienerschulung für Sandwichpanel-Produktionslinien weltweit.",
    },
    es: {
      title: "Instalación y puesta en marcha — Arranque de línea y formación",
      description:
        "Instalación en obra, montaje mecánico, puesta en marcha en frío y caliente, pruebas SAT y formación de operadores para líneas de paneles sándwich en todo el mundo.",
    },
    fr: {
      title: "Installation et mise en service — Démarrage sur site & formation",
      description:
        "Installation sur site, montage mécanique, mise en service à froid et à chaud, tests SAT et formation opérateurs pour lignes de panneaux sandwich dans le monde entier.",
    },
    it: {
      title: "Installazione e commissioning — Avviamento in cantiere e training",
      description:
        "Installazione in cantiere, montaggio meccanico, commissioning a freddo e a caldo, test SAT e training operatori per linee di pannelli sandwich nel mondo.",
    },
    zh: {
      title: "安装与调试 — 现场投产与操作员培训",
      description: "面向全球夹芯板生产线的现场安装、机械施工、冷热调试、SAT 测试及操作员培训服务。",
    },
  },

  "/investment-calculator": {
    en: {
      title: "Investment Calculator — CAPEX, OPEX & Payback for Panel Plants",
      description:
        "Estimate CAPEX, OPEX, revenue and payback period for a sandwich panel factory with NEVO's investment calculator — feasibility numbers in minutes.",
    },
    ar: {
      title: "حاسبة الاستثمار — CAPEX وOPEX وفترة الاسترداد لمصانع الألواح",
      description:
        "قدّر CAPEX وOPEX والإيرادات وفترة استرداد الاستثمار لمصنع ألواح ساندويتش عبر حاسبة نيفو — أرقام جدوى خلال دقائق.",
    },
    tr: {
      title: "Yatırım Hesaplayıcı — Panel Fabrikaları için CAPEX, OPEX ve Geri Ödeme",
      description:
        "Sandviç panel fabrikası için CAPEX, OPEX, gelir ve geri ödeme süresini NEVO yatırım hesaplayıcısı ile tahmin edin — dakikalar içinde fizibilite rakamları.",
    },
    ru: {
      title: "Инвестиционный калькулятор — CAPEX, OPEX и окупаемость",
      description:
        "Оцените CAPEX, OPEX, выручку и срок окупаемости завода сэндвич-панелей с калькулятором NEVO — цифры ТЭО за минуты.",
    },
    pt: {
      title: "Calculadora de investimento — CAPEX, OPEX e payback",
      description:
        "Estime CAPEX, OPEX, receita e payback de uma fábrica de painéis sandwich com a calculadora NEVO — números de viabilidade em minutos.",
    },
    de: {
      title: "Investitionsrechner — CAPEX, OPEX & Amortisation für Panelwerke",
      description:
        "Berechnen Sie CAPEX, OPEX, Umsatz und Amortisation eines Sandwichpanel-Werks mit dem NEVO-Rechner — Machbarkeitszahlen in Minuten.",
    },
    es: {
      title: "Calculadora de inversión — CAPEX, OPEX y payback",
      description:
        "Estime CAPEX, OPEX, ingresos y payback de una fábrica de paneles sándwich con la calculadora NEVO — cifras de viabilidad en minutos.",
    },
    fr: {
      title: "Calculateur d'investissement — CAPEX, OPEX et retour",
      description:
        "Estimez CAPEX, OPEX, chiffre d'affaires et retour d'une usine de panneaux sandwich avec le calculateur NEVO — chiffres de faisabilité en minutes.",
    },
    it: {
      title: "Calcolatore di investimento — CAPEX, OPEX e payback",
      description:
        "Stima CAPEX, OPEX, ricavi e payback di uno stabilimento di pannelli sandwich con il calcolatore NEVO — numeri di fattibilità in pochi minuti.",
    },
    zh: {
      title: "投资计算器 — 夹芯板工厂 CAPEX、OPEX 与回收期",
      description:
        "使用 NEVO 投资计算器估算夹芯板工厂的 CAPEX、OPEX、收入与回收期 — 数分钟出具可行性数据。",
    },
  },

  "/investors": {
    en: {
      title: "Investors — NEVO Industrial Growth, Governance & Reports",
      description:
        "Investor information for NEVO Industrial: growth strategy, governance, financial highlights and engineering-driven positioning in the sandwich panel market.",
    },
    ar: {
      title: "المستثمرون — نمو نيفو الصناعية والحوكمة والتقارير",
      description:
        "معلومات المستثمرين في نيفو الصناعية: استراتيجية النمو، الحوكمة، أبرز المؤشرات المالية، والتموضع الهندسي في سوق ألواح الساندويتش.",
    },
    tr: {
      title: "Yatırımcılar — NEVO Industrial Büyüme, Yönetişim ve Raporlar",
      description:
        "NEVO Industrial yatırımcı bilgileri: büyüme stratejisi, kurumsal yönetişim, finansal öne çıkanlar ve sandviç panel pazarında mühendislik odaklı konumlanma.",
    },
    ru: {
      title: "Инвесторам — Развитие, управление и отчёты NEVO Industrial",
      description:
        "Информация для инвесторов NEVO Industrial: стратегия роста, корпоративное управление, финансовые показатели и инженерное позиционирование на рынке сэндвич-панелей.",
    },
    pt: {
      title: "Investidores — Crescimento, governança e relatórios NEVO",
      description:
        "Informação para investidores da NEVO Industrial: estratégia de crescimento, governança, destaques financeiros e posicionamento de engenharia no mercado.",
    },
    de: {
      title: "Investoren — Wachstum, Governance & Reports von NEVO Industrial",
      description:
        "Investor-Informationen zu NEVO Industrial: Wachstumsstrategie, Governance, Finanzkennzahlen und engineeringgetriebene Positionierung im Sandwichpanel-Markt.",
    },
    es: {
      title: "Inversores — Crecimiento, gobierno e informes NEVO",
      description:
        "Información para inversores de NEVO Industrial: estrategia de crecimiento, gobierno corporativo, hitos financieros y posicionamiento de ingeniería en el mercado.",
    },
    fr: {
      title: "Investisseurs — Croissance, gouvernance et rapports NEVO",
      description:
        "Informations investisseurs NEVO Industrial : stratégie de croissance, gouvernance, chiffres clés financiers et positionnement d'ingénierie sur le marché des panneaux.",
    },
    it: {
      title: "Investitori — Crescita, governance e report NEVO Industrial",
      description:
        "Informazioni investitori NEVO Industrial: strategia di crescita, governance, dati finanziari chiave e posizionamento ingegneristico sul mercato dei pannelli sandwich.",
    },
    zh: {
      title: "投资者关系 — NEVO Industrial 成长、治理与报告",
      description:
        "NEVO Industrial 投资者信息:成长战略、公司治理、财务要点以及在夹芯板市场的工程驱动定位。",
    },
  },

  "/knowledge-hub": {
    en: {
      title: "Knowledge Hub — Sandwich Panel & Factory Engineering Insights",
      description:
        "Articles, guides and technical deep-dives on sandwich panels, PIR vs Rock Wool, factory design, cold storage engineering and production line optimisation.",
    },
    ar: {
      title: "مركز المعرفة — رؤى هندسية في ألواح الساندويتش والمصانع",
      description:
        "مقالات وأدلة ودراسات فنية معمّقة حول ألواح الساندويتش ومقارنة PIR بالصوف الصخري وتصميم المصانع وهندسة التخزين المبرّد وتحسين خطوط الإنتاج.",
    },
    tr: {
      title: "Bilgi Merkezi — Sandviç Panel ve Fabrika Mühendisliği İçerikleri",
      description:
        "Sandviç paneller, PIR – Taşyünü karşılaştırması, fabrika tasarımı, soğuk depo mühendisliği ve üretim hattı optimizasyonu üzerine makaleler ve teknik kılavuzlar.",
    },
    ru: {
      title: "База знаний — Инженерные материалы по панелям и заводам",
      description:
        "Статьи, гайды и технические разборы по сэндвич-панелям, PIR vs минвата, проектированию заводов, холодильным складам и оптимизации линий.",
    },
    pt: {
      title: "Centro de Conhecimento — Painéis sandwich e engenharia de fábrica",
      description:
        "Artigos, guias e análises técnicas sobre painéis sandwich, PIR vs lã de rocha, projeto de fábricas, engenharia de frio e otimização de linhas.",
    },
    de: {
      title: "Knowledge Hub — Sandwichpanel- & Werksengineering-Insights",
      description:
        "Artikel, Guides und technische Deep-Dives zu Sandwichpanelen, PIR vs. Steinwolle, Werksplanung, Kühllager-Engineering und Linienoptimierung.",
    },
    es: {
      title: "Centro de conocimiento — Paneles sándwich e ingeniería de fábrica",
      description:
        "Artículos, guías y análisis técnicos sobre paneles sándwich, PIR vs lana de roca, diseño de fábricas, ingeniería de frío y optimización de líneas.",
    },
    fr: {
      title: "Centre de connaissances — Panneaux sandwich & ingénierie d'usine",
      description:
        "Articles, guides et analyses techniques sur les panneaux sandwich, PIR vs laine de roche, conception d'usines, ingénierie du froid et optimisation des lignes.",
    },
    it: {
      title: "Knowledge Hub — Pannelli sandwich e ingegneria di stabilimento",
      description:
        "Articoli, guide e approfondimenti tecnici su pannelli sandwich, PIR vs lana di roccia, progettazione stabilimenti, ingegneria del freddo e ottimizzazione linee.",
    },
    zh: {
      title: "知识中心 — 夹芯板与工厂工程洞察",
      description:
        "关于夹芯板、PIR 与岩棉对比、工厂设计、冷库工程及生产线优化的文章、指南与深度技术分析。",
    },
  },

  "/panel-thickness-calculator": {
    en: {
      title: "Panel Thickness Calculator — Optimal PIR & Rock Wool Sizing",
      description:
        "Calculate the right sandwich panel thickness by ambient, target temperature and core: PIR, PUR, Rock Wool and EPS — instant engineering-grade output.",
    },
    ar: {
      title: "حاسبة سماكة الألواح — تحديد المقاس المثالي لـ PIR والصوف الصخري",
      description:
        "احسب السماكة المناسبة لألواح الساندويتش وفق درجة الحرارة المحيطة والمستهدفة ونوع النواة: PIR وPUR والصوف الصخري وEPS — نتائج هندسية فورية.",
    },
    tr: {
      title: "Panel Kalınlığı Hesaplayıcı — PIR ve Taşyünü için Optimum Kalınlık",
      description:
        "Ortam ve hedef sıcaklık ile çekirdek türüne göre doğru sandviç panel kalınlığını hesaplayın: PIR, PUR, Taşyünü ve EPS — anlık mühendislik sonucu.",
    },
    ru: {
      title: "Калькулятор толщины панелей — Оптимальный размер PIR и минваты",
      description:
        "Рассчитайте нужную толщину сэндвич-панели по внешней и целевой температурам и типу сердечника: PIR, PUR, минвата и EPS — инженерный результат мгновенно.",
    },
    pt: {
      title: "Calculadora de espessura de painel — PIR e lã de rocha ideais",
      description:
        "Calcule a espessura ideal do painel sandwich em função da temperatura ambiente, alvo e núcleo: PIR, PUR, lã de rocha e EPS — resultado técnico instantâneo.",
    },
    de: {
      title: "Panel-Dickenrechner — Optimale PIR- & Steinwolle-Dicke",
      description:
        "Berechnen Sie die richtige Sandwichpanel-Dicke nach Umgebungs- und Zieltemperatur sowie Kernmaterial: PIR, PUR, Steinwolle und EPS — sofortige Ingenieurauswertung.",
    },
    es: {
      title: "Calculadora de espesor de panel — PIR y lana de roca óptimos",
      description:
        "Calcule el espesor idóneo del panel sándwich según temperatura ambiente, temperatura objetivo y núcleo: PIR, PUR, lana de roca y EPS — resultado técnico inmediato.",
    },
    fr: {
      title: "Calculateur d'épaisseur de panneau — PIR et laine de roche",
      description:
        "Calculez l'épaisseur idéale du panneau sandwich selon la température ambiante, la cible et l'âme : PIR, PUR, laine de roche et EPS — résultat d'ingénierie immédiat.",
    },
    it: {
      title: "Calcolatore di spessore pannello — PIR e lana di roccia ottimali",
      description:
        "Calcola lo spessore ideale del pannello sandwich in base a temperatura ambiente, target e anima: PIR, PUR, lana di roccia ed EPS — risultato tecnico immediato.",
    },
    zh: {
      title: "板厚计算器 — PIR 与岩棉夹芯板最佳厚度",
      description:
        "根据环境温度、目标温度与芯材类型(PIR、PUR、岩棉、EPS)即时计算夹芯板最佳厚度 — 工程级输出。",
    },
  },

  "/pir-vs-rock-wool": {
    en: {
      title: "PIR vs Rock Wool — Engineering Comparison for Sandwich Panels",
      description:
        "PIR vs Rock Wool sandwich panels compared on λ-value, fire class, weight, cost and typical applications — an engineering guide from NEVO Industrial.",
    },
    ar: {
      title: "PIR مقابل الصوف الصخري — مقارنة هندسية لألواح الساندويتش",
      description:
        "مقارنة بين ألواح PIR والصوف الصخري من حيث قيمة λ ودرجة الحريق والوزن والتكلفة والتطبيقات النموذجية — دليل هندسي من نيفو الصناعية.",
    },
    tr: {
      title: "PIR – Taşyünü — Sandviç Paneller için Mühendislik Karşılaştırması",
      description:
        "PIR ve taşyünü sandviç panellerinin λ değeri, yangın sınıfı, ağırlık, maliyet ve uygulama alanları üzerinden karşılaştırması — NEVO Industrial mühendislik rehberi.",
    },
    ru: {
      title: "PIR vs минеральная вата — инженерное сравнение сэндвич-панелей",
      description:
        "Сравнение PIR и минеральной ваты: λ, класс пожарной безопасности, масса, стоимость и типовые применения — инженерный гайд от NEVO Industrial.",
    },
    pt: {
      title: "PIR vs lã de rocha — Comparação técnica para painéis sandwich",
      description:
        "Comparação de painéis PIR e lã de rocha em λ, classe de fogo, peso, custo e aplicações típicas — guia de engenharia da NEVO Industrial.",
    },
    de: {
      title: "PIR vs. Steinwolle — Engineering-Vergleich für Sandwichpanele",
      description:
        "PIR vs. Steinwolle: Vergleich nach λ-Wert, Brandklasse, Gewicht, Kosten und Anwendungen — der Engineering-Leitfaden von NEVO Industrial.",
    },
    es: {
      title: "PIR vs lana de roca — Comparativa técnica para paneles sándwich",
      description:
        "Comparativa entre paneles PIR y lana de roca: λ, clase de fuego, peso, coste y aplicaciones — guía de ingeniería de NEVO Industrial.",
    },
    fr: {
      title: "PIR vs laine de roche — Comparaison ingénierie pour panneaux",
      description:
        "Comparaison des panneaux PIR et laine de roche : valeur λ, classement au feu, poids, coût et applications — guide d'ingénierie NEVO Industrial.",
    },
    it: {
      title: "PIR vs lana di roccia — Confronto ingegneristico per pannelli",
      description:
        "Confronto tra pannelli PIR e lana di roccia: valore λ, classe al fuoco, peso, costo e applicazioni — guida ingegneristica di NEVO Industrial.",
    },
    zh: {
      title: "PIR 与岩棉对比 — 夹芯板工程比较",
      description:
        "从导热系数 λ、防火等级、重量、成本及典型应用比较 PIR 与岩棉夹芯板 — NEVO Industrial 工程指南。",
    },
  },

  "/privacy": {
    en: {
      title: "Privacy Policy — How NEVO Industrial Handles Your Data",
      description:
        "How NEVO Industrial collects, uses, stores and protects personal data across our engineering platform, calculators and customer portals.",
    },
    ar: {
      title: "سياسة الخصوصية — كيف تتعامل نيفو الصناعية مع بياناتك",
      description:
        "كيف تجمع نيفو الصناعية البيانات الشخصية وتستخدمها وتخزّنها وتحميها عبر منصتنا الهندسية والحاسبات وبوابات العملاء.",
    },
    tr: {
      title: "Gizlilik Politikası — NEVO Industrial Verilerinizi Nasıl Kullanır",
      description:
        "NEVO Industrial'ın mühendislik platformu, hesaplayıcıları ve müşteri portallarında kişisel verileri nasıl topladığı, kullandığı, sakladığı ve koruduğu.",
    },
    ru: {
      title: "Политика конфиденциальности — Как NEVO Industrial работает с данными",
      description:
        "Как NEVO Industrial собирает, использует, хранит и защищает персональные данные в инженерной платформе, калькуляторах и клиентских порталах.",
    },
    pt: {
      title: "Política de Privacidade — Tratamento de dados pela NEVO",
      description:
        "Como a NEVO Industrial recolhe, utiliza, armazena e protege dados pessoais na sua plataforma de engenharia, calculadoras e portais de clientes.",
    },
    de: {
      title: "Datenschutzerklärung — Umgang von NEVO Industrial mit Daten",
      description:
        "Wie NEVO Industrial personenbezogene Daten in Engineering-Plattform, Rechnern und Kundenportalen erhebt, nutzt, speichert und schützt.",
    },
    es: {
      title: "Política de Privacidad — Cómo trata los datos NEVO Industrial",
      description:
        "Cómo NEVO Industrial recopila, utiliza, almacena y protege los datos personales en la plataforma de ingeniería, calculadoras y portales de clientes.",
    },
    fr: {
      title: "Politique de confidentialité — Traitement des données NEVO",
      description:
        "Comment NEVO Industrial collecte, utilise, conserve et protège les données personnelles sur sa plateforme d'ingénierie, ses calculateurs et ses portails clients.",
    },
    it: {
      title: "Privacy Policy — Come NEVO Industrial gestisce i tuoi dati",
      description:
        "Come NEVO Industrial raccoglie, utilizza, conserva e protegge i dati personali su piattaforma ingegneristica, calcolatori e portali clienti.",
    },
    zh: {
      title: "隐私政策 — NEVO Industrial 如何处理您的数据",
      description:
        "NEVO Industrial 如何在工程平台、计算器与客户门户中收集、使用、存储与保护您的个人数据。",
    },
  },

  "/product-configurator": {
    en: {
      title: "Product Configurator — Build Your Custom Sandwich Panel",
      description:
        "Configure sandwich panels by core, thickness, facings, colour and joint — instant technical summary and quote request from NEVO's engineering team.",
    },
    ar: {
      title: "أداة تكوين المنتج — صمّم لوح الساندويتش المخصّص لك",
      description:
        "كوّن ألواح الساندويتش حسب النواة والسماكة والصفائح واللون والوصلة — ملخّص فني فوري وطلب عرض سعر من فريق نيفو الهندسي.",
    },
    tr: {
      title: "Ürün Konfigüratörü — Özel Sandviç Panelinizi Oluşturun",
      description:
        "Sandviç panelleri çekirdek, kalınlık, yüzey, renk ve birleşim tipine göre yapılandırın — anında teknik özet ve NEVO mühendislik ekibinden teklif talebi.",
    },
    ru: {
      title: "Конфигуратор продукта — Соберите свою сэндвич-панель",
      description:
        "Настраивайте сэндвич-панели по сердечнику, толщине, покрытиям, цвету и стыку — мгновенная техническая сводка и запрос КП у инженеров NEVO.",
    },
    pt: {
      title: "Configurador de Produto — Crie o seu painel sandwich",
      description:
        "Configure painéis sandwich por núcleo, espessura, faces, cor e junta — resumo técnico instantâneo e pedido de orçamento à equipa de engenharia NEVO.",
    },
    de: {
      title: "Produktkonfigurator — Ihr individuelles Sandwichpanel",
      description:
        "Sandwichpanele nach Kern, Dicke, Decklagen, Farbe und Verbindung konfigurieren — sofortige technische Zusammenfassung und Angebotsanfrage bei NEVO.",
    },
    es: {
      title: "Configurador de producto — Diseña tu panel sándwich a medida",
      description:
        "Configure paneles sándwich por núcleo, espesor, caras, color y junta — resumen técnico instantáneo y solicitud de oferta al equipo de ingeniería NEVO.",
    },
    fr: {
      title: "Configurateur produit — Composez votre panneau sandwich",
      description:
        "Configurez vos panneaux sandwich par âme, épaisseur, faces, couleur et joint — résumé technique instantané et demande de devis à l'équipe d'ingénierie NEVO.",
    },
    it: {
      title: "Configuratore di prodotto — Crea il tuo pannello sandwich",
      description:
        "Configura pannelli sandwich per anima, spessore, facciate, colore e giunto — riepilogo tecnico istantaneo e richiesta di offerta al team ingegneristico NEVO.",
    },
    zh: {
      title: "产品配置器 — 定制您的夹芯板",
      description:
        "按芯材、厚度、面板、颜色与接缝配置夹芯板 — 即时生成技术摘要,并向 NEVO 工程团队发起报价请求。",
    },
  },

  "/project-inquiry": {
    en: {
      title: "Project Inquiry — Request a Sandwich Panel Engineering Quote",
      description:
        "Request an engineering quote for a sandwich panel project: panels, factories, production lines, raw materials or consultancy — routed to a senior engineer.",
    },
    ar: {
      title: "استفسار عن مشروع — اطلب عرضًا هندسيًا لألواح الساندويتش",
      description:
        "اطلب عرضًا هندسيًا لمشروع ألواح ساندويتش: الألواح أو المصانع أو خطوط الإنتاج أو المواد الخام أو الاستشارات — يُوجَّه مباشرةً إلى مهندس أول.",
    },
    tr: {
      title: "Proje Talebi — Sandviç Panel Mühendislik Teklifi İsteyin",
      description:
        "Sandviç panel projesi için mühendislik teklifi isteyin: paneller, fabrikalar, üretim hatları, hammaddeler veya danışmanlık — kıdemli mühendise yönlendirilir.",
    },
    ru: {
      title: "Запрос по проекту — Инженерное КП по сэндвич-панелям",
      description:
        "Запросите инженерное КП по проекту сэндвич-панелей: панели, заводы, линии, сырьё или консалтинг — обращение направляется ведущему инженеру.",
    },
    pt: {
      title: "Pedido de projeto — Orçamento de engenharia de painéis sandwich",
      description:
        "Solicite orçamento de engenharia para um projeto de painéis sandwich: painéis, fábricas, linhas, matérias-primas ou consultoria — encaminhado a um engenheiro sénior.",
    },
    de: {
      title: "Projektanfrage — Engineering-Angebot für Sandwichpanele anfordern",
      description:
        "Fordern Sie ein Engineering-Angebot für ein Sandwichpanel-Projekt an: Panele, Werke, Linien, Rohstoffe oder Beratung — direkt zum leitenden Ingenieur.",
    },
    es: {
      title: "Solicitud de proyecto — Presupuesto de ingeniería en paneles sándwich",
      description:
        "Solicite un presupuesto de ingeniería para un proyecto de paneles sándwich: paneles, fábricas, líneas, materias primas o consultoría — dirigido a un ingeniero senior.",
    },
    fr: {
      title: "Demande de projet — Devis d'ingénierie panneaux sandwich",
      description:
        "Demandez un devis d'ingénierie pour un projet de panneaux sandwich : panneaux, usines, lignes, matières premières ou conseil — traité par un ingénieur senior.",
    },
    it: {
      title: "Richiesta di progetto — Preventivo ingegneristico pannelli sandwich",
      description:
        "Richiedi un preventivo ingegneristico per un progetto di pannelli sandwich: pannelli, stabilimenti, linee, materie prime o consulenza — a cura di un ingegnere senior.",
    },
    zh: {
      title: "项目咨询 — 请求夹芯板工程报价",
      description:
        "为夹芯板项目申请工程报价:成品板、工厂、生产线、原材料或工程咨询 — 直接转交资深工程师处理。",
    },
  },

  "/quality": {
    en: {
      title: "Quality & Certifications — ISO, CE and Third-Party Audited",
      description:
        "ISO 9001, CE marking, EN and ASTM compliance across NEVO panels, lines and raw materials — with third-party audits on every major project.",
    },
    ar: {
      title: "الجودة والاعتمادات — ISO وCE ومراجعة طرف ثالث",
      description:
        "امتثال ISO 9001 وعلامة CE ومعايير EN وASTM في ألواح نيفو وخطوطها ومواد الخام — مع مراجعات طرف ثالث لكل مشروع رئيسي.",
    },
    tr: {
      title: "Kalite ve Sertifikalar — ISO, CE ve Bağımsız Denetim",
      description:
        "NEVO panelleri, hatları ve hammaddelerinde ISO 9001, CE işareti, EN ve ASTM uyumu — her büyük projede bağımsız üçüncü taraf denetimleriyle desteklenir.",
    },
    ru: {
      title: "Качество и сертификации — ISO, CE и независимый аудит",
      description:
        "Соответствие ISO 9001, CE, EN и ASTM для панелей, линий и сырья NEVO — с независимыми аудитами на каждом крупном проекте.",
    },
    pt: {
      title: "Qualidade & Certificações — ISO, CE e auditoria independente",
      description:
        "Conformidade ISO 9001, marcação CE, EN e ASTM em painéis, linhas e matérias-primas NEVO — com auditorias independentes em todos os grandes projetos.",
    },
    de: {
      title: "Qualität & Zertifikate — ISO, CE und unabhängige Audits",
      description:
        "ISO 9001, CE-Kennzeichnung, EN- und ASTM-Konformität für NEVO-Panele, Linien und Rohstoffe — mit unabhängigen Audits bei jedem Großprojekt.",
    },
    es: {
      title: "Calidad y certificaciones — ISO, CE y auditoría independiente",
      description:
        "Conformidad ISO 9001, marcado CE, EN y ASTM en paneles, líneas y materias primas NEVO — con auditorías independientes en cada gran proyecto.",
    },
    fr: {
      title: "Qualité & Certifications — ISO, CE et audit indépendant",
      description:
        "Conformité ISO 9001, marquage CE, EN et ASTM sur les panneaux, lignes et matières premières NEVO — avec audits indépendants sur chaque grand projet.",
    },
    it: {
      title: "Qualità e Certificazioni — ISO, CE e audit indipendenti",
      description:
        "Conformità ISO 9001, marcatura CE, EN e ASTM su pannelli, linee e materie prime NEVO — con audit indipendenti su ogni progetto importante.",
    },
    zh: {
      title: "质量与认证 — ISO、CE 及第三方审核",
      description:
        "NEVO 夹芯板、生产线与原材料符合 ISO 9001、CE 标识、EN 与 ASTM 标准,并对每个大型项目执行独立第三方审核。",
    },
  },

  "/research-innovation": {
    en: {
      title: "Research & Innovation — Panel Chemistry, Automation & Sustainability",
      description:
        "NEVO's R&D roadmap: next-generation PIR/PUR chemistry, line automation, digital twins, embodied carbon reduction and circular sandwich panel design.",
    },
    ar: {
      title: "البحث والابتكار — كيمياء الألواح والأتمتة والاستدامة",
      description:
        "خارطة طريق البحث والتطوير في نيفو: كيمياء PIR/PUR الجديدة، أتمتة الخطوط، التوائم الرقمية، خفض الكربون المتضمّن، والتصميم الدائري لألواح الساندويتش.",
    },
    tr: {
      title: "Araştırma ve İnovasyon — Panel Kimyası, Otomasyon ve Sürdürülebilirlik",
      description:
        "NEVO Ar-Ge yol haritası: yeni nesil PIR/PUR kimyası, hat otomasyonu, dijital ikizler, gömülü karbon azaltımı ve döngüsel sandviç panel tasarımı.",
    },
    ru: {
      title: "Исследования и инновации — Химия панелей, автоматизация, устойчивость",
      description:
        "Дорожная карта R&D NEVO: PIR/PUR-химия нового поколения, автоматизация линий, цифровые двойники, снижение embodied carbon и циркулярный дизайн панелей.",
    },
    pt: {
      title: "Investigação e Inovação — Química, automação e sustentabilidade",
      description:
        "Roteiro de I&D da NEVO: química PIR/PUR de nova geração, automação de linhas, gémeos digitais, redução de carbono incorporado e design circular de painéis.",
    },
    de: {
      title: "Forschung & Innovation — Panelchemie, Automatisierung & Nachhaltigkeit",
      description:
        "F&E-Roadmap von NEVO: neue PIR/PUR-Chemie, Linienautomatisierung, digitale Zwillinge, Reduktion des embodied carbon und zirkuläres Paneldesign.",
    },
    es: {
      title: "Investigación e Innovación — Química, automatización y sostenibilidad",
      description:
        "Hoja de ruta de I+D de NEVO: química PIR/PUR de nueva generación, automatización de líneas, gemelos digitales, reducción de carbono incorporado y diseño circular.",
    },
    fr: {
      title: "Recherche & Innovation — Chimie panneaux, automatisation, durabilité",
      description:
        "Feuille de route R&D NEVO : chimie PIR/PUR nouvelle génération, automatisation des lignes, jumeaux numériques, réduction du carbone incorporé et design circulaire.",
    },
    it: {
      title: "Ricerca e Innovazione — Chimica, automazione e sostenibilità",
      description:
        "Roadmap R&S di NEVO: chimica PIR/PUR di nuova generazione, automazione linee, digital twin, riduzione della CO₂ incorporata e design circolare dei pannelli.",
    },
    zh: {
      title: "研究与创新 — 板材化学、自动化与可持续发展",
      description:
        "NEVO 研发路线图:新一代 PIR/PUR 化学体系、生产线自动化、数字孪生、隐含碳减排与夹芯板循环设计。",
    },
  },

  "/sustainability": {
    en: {
      title: "Sustainability — Low-Carbon Panels & Responsible Manufacturing",
      description:
        "Lower-embodied-carbon PIR/PUR chemistry, recyclable steel facings, energy-efficient factories and responsible sourcing across NEVO's global operations.",
    },
    ar: {
      title: "الاستدامة — ألواح منخفضة الكربون وتصنيع مسؤول",
      description:
        "كيمياء PIR/PUR بكربون متضمّن أقل، وصفائح فولاذية قابلة للتدوير، ومصانع موفّرة للطاقة، وتوريد مسؤول عبر عمليات نيفو حول العالم.",
    },
    tr: {
      title: "Sürdürülebilirlik — Düşük Karbonlu Paneller ve Sorumlu Üretim",
      description:
        "Düşük gömülü karbonlu PIR/PUR kimyası, geri dönüştürülebilir çelik yüzeyler, enerji verimli fabrikalar ve NEVO'nun küresel operasyonlarında sorumlu tedarik.",
    },
    ru: {
      title: "Устойчивость — Низкоуглеродные панели и ответственное производство",
      description:
        "PIR/PUR-химия с меньшим embodied carbon, перерабатываемые стальные покрытия, энергоэффективные заводы и ответственные закупки в операциях NEVO.",
    },
    pt: {
      title: "Sustentabilidade — Painéis de baixo carbono e produção responsável",
      description:
        "Química PIR/PUR de menor carbono incorporado, faces de aço recicláveis, fábricas eficientes e sourcing responsável em toda a operação global da NEVO.",
    },
    de: {
      title: "Nachhaltigkeit — CO₂-arme Panele & verantwortungsvolle Fertigung",
      description:
        "PIR/PUR-Chemie mit reduziertem embodied carbon, recycelbare Stahldeckschichten, energieeffiziente Werke und verantwortungsvolle Beschaffung bei NEVO weltweit.",
    },
    es: {
      title: "Sostenibilidad — Paneles bajos en carbono y fabricación responsable",
      description:
        "Química PIR/PUR con menor carbono incorporado, caras de acero reciclables, fábricas eficientes y sourcing responsable en las operaciones globales de NEVO.",
    },
    fr: {
      title: "Durabilité — Panneaux bas carbone et production responsable",
      description:
        "Chimie PIR/PUR à carbone incorporé réduit, faces acier recyclables, usines économes en énergie et achats responsables sur l'ensemble des opérations NEVO.",
    },
    it: {
      title: "Sostenibilità — Pannelli a basso carbonio e produzione responsabile",
      description:
        "Chimica PIR/PUR a minore CO₂ incorporata, facce in acciaio riciclabili, stabilimenti efficienti e sourcing responsabile in tutte le operazioni globali di NEVO.",
    },
    zh: {
      title: "可持续发展 — 低碳夹芯板与负责任制造",
      description:
        "NEVO 全球运营中采用更低隐含碳的 PIR/PUR 化学、可回收钢面板、高能效工厂及负责任的原材料采购。",
    },
  },
};

/**
 * Look up localized title/description for a route/locale, falling back to EN.
 */
export function localizedMeta(path: string, lang: string): LocalizedMeta {
  const perLocale = SEO_META[path];
  if (!perLocale) {
    return {
      title: "NEVO Industrial",
      description:
        "Dubai-based industrial engineering. Factory development, sandwich panel production lines, PIR/PUR raw materials, engineering consultancy & finished panels for global markets.",
    };
  }
  return perLocale[lang as LocaleCode] ?? perLocale.en;
}
