const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

// Complete Arabic Translation Map for all 188 courses + University Courses
const courseTranslations = {
  // University Compulsory
  '020000001': 'التفكير الناقد',
  '020000002': 'الابتكار وريادة الأعمال',
  '0200000XX': 'متطلب جامعة إجباري',
  '02-00-000XX': 'متطلب جامعة إجباري',
  '02-0X-000XX': 'متطلب جامعة اختياري',

  // Faculty Compulsory (16 courses)
  '02-24-00101': 'الجبر الخطي',
  '02-24-00102': 'حساب التفاضل والتكامل',
  '02-24-00103': 'مقدمة إلى نظم الحاسب',
  '02-24-00104': 'مقدمة إلى علوم البيانات',
  '02-24-00105': 'برمجة 1',
  '02-24-00106': 'الاحتمالات والإحصاء 1',
  '02-24-00107': 'الهياكل المحددة',
  '02-24-00108': 'هياكل البيانات والخوارزميات',
  '02-24-00109': 'مقدمة إلى الذكاء الاصطناعي',
  '02-24-00110': 'برمجة 2',
  '02-24-00201': 'الاحتمالات والإحصاء 2',
  '02-24-00202': 'مقدمة إلى قواعد البيانات',
  '02-24-00203': 'الحسابات العددية',
  '02-24-00204': 'الحوسبة السحابية',
  '02-24-00205': 'تعلم الآلة',
  '02-24-00206': 'تنقيب وتحليلات البيانات',

  // Faculty Electives (8 courses)
  '02-24-00301': 'هندسة البرمجيات',
  '02-24-00302': 'تحليل وتصميم النظم',
  '02-24-00303': 'تصميم الخوارزميات',
  '02-24-00304': 'المعالجة الموزعة',
  '02-24-00305': 'برمجة الأجهزة المحمولة',
  '02-24-00306': 'برمجة الويب',
  '02-24-00307': 'نظم التشغيل',
  '02-24-00308': 'شبكات الحاسب',

  // Program 01: Computing and Data Sciences
  '02-24-01201': 'تفاضل وتكامل متقدم',
  '02-24-01202': 'منهجية علم البيانات',
  '02-24-01203': 'أدوات وبرمجيات علم البيانات',
  '02-24-01204': 'تحليل الانحدار',
  '02-24-01205': 'تدريب ميداني 1',
  '02-24-01301': 'العمليات العشوائية',
  '02-24-01302': 'تصميم وتحليل التجارب',
  '02-24-01303': 'أدوات التصوير المرئي للبيانات',
  '02-24-01304': 'حسابات وتحليل البيانات',
  '02-24-01305': 'منهجية المسوح الإحصائية',
  '02-24-01306': 'الطرق الإحصائية كثيفة الحوسبة',
  '02-24-01307': 'تدريب ميداني 2',
  '02-24-01401': 'تحليلات البيانات الضخمة',
  '02-24-01402': 'مقدمة في الشبكات الاجتماعية',
  '02-24-01403': 'المحاكاة',
  '02-24-01404': 'مشروع تخرج 1',
  '02-24-01405': 'تحليلات البيانات الاجتماعية',
  '02-24-01406': 'تحليل البيانات الموزعة',
  '02-24-01407': 'معالجة تدفق البيانات',
  '02-24-01408': 'مشروع تخرج 2',
  '02-24-01409': 'الأمثلية المحدبة',
  '02-24-01410': 'الأمثلية غير الخطية والتوافقية',
  '02-24-01411': 'التحليل الإحصائي متعدد المتغيرات',
  '02-24-01412': 'الإحصاء البيزي',
  '02-24-01413': 'تقنيات ضغط البيانات',
  '02-24-01414': 'خوارزميات وهياكل بيانات متزامنة',
  '02-24-01415': 'نظم قواعد البيانات الموزعة',
  '02-24-01416': 'نظم قواعد البيانات المتقدمة',

  // Program 02: Business Analytics
  '02-24-02201': 'مقدمة في الأعمال',
  '02-24-02202': 'المحاسبة كنظم معلومات',
  '02-24-02203': 'تحليل وتصميم النظم',
  '02-24-02204': 'التخطيط والتحليل المالي',
  '02-24-02205': 'تدريب ميداني 1',
  '02-24-02301': 'نمذجة وتكامل عمليات الأعمال',
  '02-24-02302': 'التحليل الكمي',
  '02-24-02303': 'مستودعات البيانات وذكاء الأعمال',
  '02-24-02304': 'تمثيل البيانات مرئياً',
  '02-24-02305': 'نظم معلومات المؤسسات',
  '02-24-02306': 'التسويق الموجه بالبيانات',
  '02-24-02307': 'تدريب ميداني 2',
  '02-24-02401': 'القيادة وتحليلات الأفراد',
  '02-24-02402': 'حوكمة تكنولوجيا المعلومات والبيانات',
  '02-24-02403': 'استرجاع المعلومات',
  '02-24-02404': 'مشروع تخرج 1',
  '02-24-02405': 'تنقيب النصوص ووسائل التواصل الاجتماعي',
  '02-24-02406': 'تحليلات سلاسل الإمداد والخدمات اللوجستية',
  '02-24-02407': 'قوانين وأخلاقيات تكنولوجيا المعلومات',
  '02-24-02408': 'مشروع تخرج 2',
  '02-24-02409': 'التفاعل بين الإنسان والحاسوب',
  '02-24-02410': 'التلعيب وتطوير الألعاب',
  '02-24-02411': 'اتجاهات التكنولوجيا والابتكار',
  '02-24-02412': 'نظم المعلومات الجغرافية والتنقيب عن البيانات المكانية',
  '02-24-02413': 'إدارة مشروعات التكنولوجيا',
  '02-24-02414': 'المدن الذكية والحكومة الإلكترونية',
  '02-24-02415': 'التحول الرقمي والاقتصاد الرقمي',
  '02-24-02416': 'تحليلات التصنيع',
  '02-24-02417': 'التحليلات التنبؤية',
  '02-24-02418': 'معالجة اللغات الطبيعية والتحليل الدلالي',

  // Program 03: Intelligent Systems
  '02-24-03201': 'النظم الذكية والذكاء الحسابي',
  '02-24-03202': 'بحوث العمليات',
  '02-24-03203': 'التعرف على الأنماط',
  '02-24-03204': 'الشبكات العصبية',
  '02-24-03205': 'تدريب ميداني 1',
  '02-24-03301': 'البرمجة الذكية',
  '02-24-03302': 'التعلم العميق',
  '02-24-03303': 'نظم التحكم الحديثة',
  '02-24-03304': 'النظم المدمجة',
  '02-24-03305': 'الرؤية بالحاسب',
  '02-24-03306': 'قضايا أمان الذكاء الاصطناعي',
  '02-24-03307': 'تدريب ميداني 2',
  '02-24-03401': 'منصات الذكاء الاصطناعي',
  '02-24-03402': 'إنترنت الأشياء 1',
  '02-24-03403': 'معالجة اللغات الطبيعية',
  '02-24-03404': 'مشروع تخرج 1',
  '02-24-03405': 'التعلم المعزز',
  '02-24-03406': 'الذكاء الاصطناعي للروبوتات',
  '02-24-03407': 'الإدراك والتعرف البصري',
  '02-24-03408': 'مشروع تخرج 2',
  '02-24-03409': 'التعرف على الكلام',
  '02-24-03410': 'فهم اللغات الطبيعية',
  '02-24-03411': 'تعلم الآلة المدمج',
  '02-24-03412': 'اتجاهات تكنولوجيا الذكاء',
  '02-24-03413': 'إنترنت الأشياء 2',
  '02-24-03414': 'الذكاء الاصطناعي القائم على المعرفة',
  '02-24-03415': 'الواقع الافتراضي',
  '02-24-03416': 'نظرية الألعاب',

  // Program 04: Media Analytics
  '02-24-04201': 'الصحافة المدفوعة بالبيانات',
  '02-24-04202': 'الاتصال الجماهيري الرقمي',
  '02-24-04203': 'الإنتاج المرئي الرقمي',
  '02-24-04204': 'تحرير الأخبار والتدوين',
  '02-24-04205': 'تدريب ميداني 1',
  '02-24-04301': 'معالجة الصور',
  '02-24-04302': 'تصميم الويب وتحسين محركات البحث',
  '02-24-04303': 'صوتيات الحاسب',
  '02-24-04304': 'الرسوم البيانية وتصور البيانات',
  '02-24-04305': 'معالجة اللغات الطبيعية',
  '02-24-04306': 'معالجة الوسائط',
  '02-24-04307': 'تدريب ميداني 2',
  '02-24-04401': 'رسومات الحاسب',
  '02-24-04402': 'البث الرقمي',
  '02-24-04403': 'بحوث وتحليلات الجمهور',
  '02-24-04404': 'مشروع تخرج 1',
  '02-24-04405': 'تحليلات وسائل التواصل الاجتماعي',
  '02-24-04406': 'تحليلات الوسائط المتعددة',
  '02-24-04407': 'الرأي العام واستطلاعات الرأي الإلكترونية',
  '02-24-04408': 'مشروع تخرج 2',
  '02-24-04409': 'الوسائط التفاعلية',
  '02-24-04410': 'الصحافة الإلكترونية',
  '02-24-04411': 'التصوير الفوتوغرافي الحاسوبي',
  '02-24-04412': 'الرسوم المتحركة بالحاسب',
  '02-24-04413': 'تصميم وبرمجة ألعاب الفيديو',
  '02-24-04414': 'الواقع الافتراضي',
  '02-24-04415': 'الأدلة الجنائية للوسائط الرقمية',

  // Program 05: Healthcare Informatics and Data Analytics
  '02-24-05201': 'مقدمة في علم الأوبئة',
  '02-24-05202': 'علم التشريح وعلم وظائف الأعضاء',
  '02-24-05203': 'علم الأدوية وكيمياء العقاقير',
  '02-24-05204': 'الأخلاقيات واللوائح في الرعاية الصحية',
  '02-24-05205': 'تدريب ميداني 1',
  '02-24-05301': 'علوم الأعصاب والروبوتات',
  '02-24-05302': 'نظم المعلومات الصحية',
  '02-24-05303': 'تصميم الدواء بمساعدة الحاسوب',
  '02-24-05304': 'نظم الرعاية الصحية الوطنية والدولية',
  '02-24-05305': 'السياسات والاقتصاديات الصحية',
  '02-24-05306': 'تحليلات سوق الرعاية الصحية',
  '02-24-05307': 'تدريب ميداني 2',
  '02-24-05401': 'الصحة الإلكترونية والطب الاتصالي',
  '02-24-05402': 'النمذجة الرياضية للصحة',
  '02-24-05403': 'تقديم الرعاية الطبية والسريرية',
  '02-24-05404': 'مشروع تخرج 1',
  '02-24-05405': 'السجلات المحوسبة للأمراض',
  '02-24-05406': 'نظم دعم القرار السريري',
  '02-24-05407': 'علم النفس الصحي',
  '02-24-05408': 'مشروع تخرج 2',
  '02-24-05409': 'فيزياء الإشعاع',
  '02-24-05410': 'البيولوجيا الخلوية والجزيئية',
  '02-24-05411': 'البيولوجيا الإشعاعية',
  '02-24-05412': 'الفيسيولوجيا المرضية وبيانات المعامل',
  '02-24-05413': 'مبادئ الكيمياء الحيوية',

  // Program 06: Cybersecurity
  '02-24-06201': 'مقدمة في الأمن السيبراني',
  '02-24-06202': 'نظرية الأعداد',
  '02-24-06203': 'علم التشفير',
  '02-24-06205': 'تدريب ميداني 1',
  '02-24-06302': 'أمن نظم التشغيل',
  '02-24-06303': 'تطوير البرمجيات الآمنة',
  '02-24-06304': 'أمن الحاسب والشبكات',
  '02-24-06305': 'سلامة البيانات والمصادقة',
  '02-24-06306': 'إدارة أمن المعلومات',
  '02-24-06307': 'تدريب ميداني 2',
  '02-24-06401': 'حوسبة الشبكات الاجتماعية',
  '02-24-06402': 'أمان النظم الموزعة',
  '02-24-06403': 'الأمن البشري',
  '02-24-06404': 'مشروع تخرج 1',
  '02-24-06405': 'إدارة مخاطر الأمن السيبراني',
  '02-24-06406': 'الأدلة الجنائية الرقمية',
  '02-24-06407': 'القانون والأمن السيبراني',
  '02-24-06408': 'مشروع تخرج 2',
  '02-24-06409': 'قضايا أمان الذكاء الاصطناعي',
  '02-24-06410': 'أمن الحاسوب الاستباقي',
  '02-24-06411': 'هندسة أمان البرمجيات',
  '02-24-06412': 'البلوكشين وأمان البلوكشين',
  '02-24-06413': 'أمان الحوسبة السحابية',
  '02-24-06414': 'تحليلات الشبكات الاجتماعية',
  '02-24-06415': 'إنترنت الأشياء',
  '02-24-06416': 'الحوسبة المتنقلة'
};

// Course English Names
const courseNames = {
  '0200000XX_1': 'Critical Thinking',
  '0200000XX_2': 'Innovation & Entrepreneurship',
  '02-24-00101': 'Linear Algebra',
  '02-24-00102': 'Calculus',
  '02-24-00103': 'Introduction to Computer Systems',
  '02-24-00104': 'Introduction to Data Sciences',
  '02-24-00105': 'Programming I',
  '02-24-00106': 'Probability and Statistics I',
  '02-24-00107': 'Discrete Structures',
  '02-24-00108': 'Data Structures and Algorithms',
  '02-24-00109': 'Introduction to Artificial Intelligence',
  '02-24-00110': 'Programming II',
  '02-24-00201': 'Probability and Statistics II',
  '02-24-00202': 'Introduction to Databases',
  '02-24-00203': 'Numerical Computations',
  '02-24-00204': 'Cloud Computing',
  '02-24-00205': 'Machine Learning',
  '02-24-00206': 'Data Mining and Analytics',
  '02-24-00301': 'Software Engineering',
  '02-24-00302': 'Systems Analysis and Design',
  '02-24-00303': 'Algorithm Design',
  '02-24-00304': 'Distributed Processing',
  '02-24-00305': 'Mobile Programming',
  '02-24-00306': 'Web Programming',
  '02-24-00307': 'Operating Systems',
  '02-24-00308': 'Computer Networks',
  '02-24-01201': 'Advanced Calculus',
  '02-24-01202': 'Data Science Methodology',
  '02-24-01203': 'Data Science Tools and Software',
  '02-24-01204': 'Regression Analysis',
  '02-24-01205': 'Field Training I',
  '02-24-01301': 'Stochastic Processes',
  '02-24-01302': 'Design and Analysis of Experiments',
  '02-24-01303': 'Data Visualization Tools',
  '02-24-01304': 'Data Computation and Analysis',
  '02-24-01305': 'Survey Methodology',
  '02-24-01306': 'Computing Intensive Statistical Methods',
  '02-24-01307': 'Field Training II',
  '02-24-01401': 'Big Data Analytics',
  '02-24-01402': 'Introduction to Social Networks',
  '02-24-01403': 'Simulations',
  '02-24-01404': 'Project I',
  '02-24-01405': 'Social Data Analytics',
  '02-24-01406': 'Distributed Data Analysis',
  '02-24-01407': 'Stream Processing',
  '02-24-01408': 'Project II',
  '02-24-01409': 'Convex Optimization',
  '02-24-01410': 'Non-Linear and Combinatorial Optimization',
  '02-24-01411': 'Multivariate Statistical Analysis',
  '02-24-01412': 'Bayesian Statistics',
  '02-24-01413': 'Data Compression Techniques',
  '02-24-01414': 'Concurrent Algorithms and Data Structures',
  '02-24-01415': 'Distributed Database Systems',
  '02-24-01416': 'Advanced Database Systems',
  '02-24-02201': 'Introduction to Business',
  '02-24-02202': 'Accounting as an Information Systems',
  '02-24-02203': 'System Analysis & Design',
  '02-24-02204': 'Financial Planning and Analysis',
  '02-24-02205': 'Field Training I',
  '02-24-02301': 'Business Process Modeling and Integration',
  '02-24-02302': 'Quantitative Analysis',
  '02-24-02303': 'Data Warehousing & Business Intelligence',
  '02-24-02304': 'Data Visualization',
  '02-24-02305': 'Enterprise Information Systems',
  '02-24-02306': 'Data Driven Marketing',
  '02-24-02307': 'Field Training II',
  '02-24-02401': 'Leadership and People Analytics',
  '02-24-02402': 'Data and IT Governance',
  '02-24-02403': 'Information Retrieval',
  '02-24-02404': 'Project I',
  '02-24-02405': 'Text and Social Media Mining',
  '02-24-02406': 'Logistics and Supply Chain Analytics',
  '02-24-02407': 'Information Technology Laws and Ethics',
  '02-24-02408': 'Project II',
  '02-24-02409': 'Human Computer Interaction',
  '02-24-02410': 'Gamification and Games Development',
  '02-24-02411': 'Technology Trends and Innovation',
  '02-24-02412': 'GIS and Spatial Data Mining',
  '02-24-02413': 'Managing Technology Projects',
  '02-24-02414': 'Smart Cities and E-Government',
  '02-24-02415': 'Digital Transformation and Digital Economics',
  '02-24-02416': 'Manufacturing Analytics',
  '02-24-02417': 'Predictive Analytics',
  '02-24-02418': 'NLP and Semantic Analysis',
  '02-24-03201': 'Smart Systems and Computational Intelligence',
  '02-24-03202': 'Operations Research',
  '02-24-03203': 'Pattern Recognition',
  '02-24-03204': 'Neural Networks',
  '02-24-03205': 'Field Training I',
  '02-24-03301': 'Intelligent Programming',
  '02-24-03302': 'Deep Learning',
  '02-24-03303': 'Modern Control Systems',
  '02-24-03304': 'Embedded Systems',
  '02-24-03305': 'Computer Vision',
  '02-24-03306': 'AI Security Issues',
  '02-24-03307': 'Field Training II',
  '02-24-03401': 'AI Platforms',
  '02-24-03402': 'Internet of Things I',
  '02-24-03403': 'Natural Language Processing',
  '02-24-03404': 'Project I',
  '02-24-03405': 'Reinforcement Learning',
  '02-24-03406': 'AI for Robotics',
  '02-24-03407': 'Visual Recognition',
  '02-24-03408': 'Project II',
  '02-24-03409': 'Speech Recognition',
  '02-24-03410': 'Natural Language Understanding',
  '02-24-03411': 'Embedded Machine Learning',
  '02-24-03412': 'Intelligence Technology Trends',
  '02-24-03413': 'Internet of Things II',
  '02-24-03414': 'Knowledge-Base AI',
  '02-24-03415': 'Virtual Reality',
  '02-24-03416': 'Game Theory',
  '02-24-04201': 'Data Driven Journalism',
  '02-24-04202': 'Digital Mass Communication',
  '02-24-04203': 'Digital Video Production',
  '02-24-04204': 'News Editing and Blogging',
  '02-24-04205': 'Field Training I',
  '02-24-04301': 'Image Processing',
  '02-24-04302': 'Web Design and Search-Engine Optimization',
  '02-24-04303': 'Computer Audio',
  '02-24-04304': 'Infographics and Data Visualization',
  '02-24-04305': 'Natural Language Processing',
  '02-24-04306': 'Media Processing',
  '02-24-04307': 'Field Training II',
  '02-24-04401': 'Computer Graphics',
  '02-24-04402': 'Digital Broadcasting',
  '02-24-04403': 'Audience research and analysis',
  '02-24-04404': 'Project I',
  '02-24-04405': 'Social Media Analytics',
  '02-24-04406': 'Multimedia Analytics',
  '02-24-04407': 'Public opinion and E Surveys',
  '02-24-04408': 'Project II',
  '02-24-04409': 'Interactive Media',
  '02-24-04410': 'Online Journalism',
  '02-24-04411': 'Computational Photography',
  '02-24-04412': 'Computer Animations',
  '02-24-04413': 'Video Game Design and Programming',
  '02-24-04414': 'Virtual Reality',
  '02-24-04415': 'Digital Media Forensics',
  '02-24-05201': 'Introduction to Epidemiology',
  '02-24-05202': 'Anatomy and Physiology',
  '02-24-05203': 'Pharmacology and Chemistry of Drugs',
  '02-24-05204': 'Ethics & Regulations in Healthcare',
  '02-24-05205': 'Field Training I',
  '02-24-05301': 'Neuroscience and Robotics',
  '02-24-05302': 'Health Information Systems',
  '02-24-05303': 'Computer-Assisted Drug Design',
  '02-24-05304': 'National and International Healthcare Systems',
  '02-24-05305': 'Health Policy & Economics',
  '02-24-05306': 'Healthcare Market Analytics',
  '02-24-05307': 'Field Training II',
  '02-24-05401': 'E-health, Telehealth and Telemedicine',
  '02-24-05402': 'Mathematical Modelling for Health',
  '02-24-05403': 'Clinical & Medical Care Delivery',
  '02-24-05404': 'Project I',
  '02-24-05405': 'Computerized Disease Registries',
  '02-24-05406': 'Clinical Decision Support Systems',
  '02-24-05407': 'Health Psychology',
  '02-24-05408': 'Project II',
  '02-24-05409': 'Radiation Physics',
  '02-24-05410': 'Cellular & Molecular Biology',
  '02-24-05411': 'Radiation Biology',
  '02-24-05412': 'Pathophysiology & Lab Data',
  '02-24-05413': 'Principles of Biochemistry',
  '02-24-06201': 'Introduction to Cybersecurity',
  '02-24-06202': 'Number Theory',
  '02-24-06203': 'Cryptography',
  '02-24-06205': 'Field Training I',
  '02-24-06302': 'Operating Systems Security',
  '02-24-06303': 'Secure Software Development',
  '02-24-06304': 'Computer and Network Security',
  '02-24-06305': 'Data Integrity and Authentication',
  '02-24-06306': 'Information Security Management',
  '02-24-06307': 'Field Training II',
  '02-24-06401': 'Social Network Computing',
  '02-24-06402': 'Security of Distributed Systems',
  '02-24-06403': 'Human Security',
  '02-24-06404': 'Project I',
  '02-24-06405': 'Cybersecurity Risk Management',
  '02-24-06406': 'Digital Forensics',
  '02-24-06407': 'Law and Cybersecurity',
  '02-24-06408': 'Project II',
  '02-24-06409': 'AI Security Issues',
  '02-24-06410': 'Proactive Computer Security',
  '02-24-06411': 'Software Security Engineering',
  '02-24-06412': 'Blockchain and Security of Blockchain',
  '02-24-06413': 'Cloud Computing Security',
  '02-24-06414': 'Social Networks Analytics',
  '02-24-06415': 'Internet of Things',
  '02-24-06416': 'Mobile Computing'
};

function helperGetPrereqNames(prereqs) {
  return prereqs.map(p => ({
    code: p,
    name_en: courseNames[p] || p,
    name_ar: courseTranslations[p] || p
  }));
}

// Load dataset structure
const existingData = require('../faculty_courses_bylaw.json');

// Enrich each course in all_unique_courses
existingData.all_unique_courses.forEach(c => {
  c.name = c.name_en;
  c.name_ar = courseTranslations[c.code] || '';
  c.prerequisites_details = helperGetPrereqNames(c.prerequisites);
});

// Enrich faculty compulsory
existingData.faculty_compulsory_courses.forEach(c => {
  c.name = c.name_en;
  c.name_ar = courseTranslations[c.code] || '';
  c.prerequisites_details = helperGetPrereqNames(c.prerequisites);
});

// Enrich faculty electives
existingData.faculty_elective_courses.forEach(c => {
  c.name = c.name_en;
  c.name_ar = courseTranslations[c.code] || '';
  c.prerequisites_details = helperGetPrereqNames(c.prerequisites);
});

// Enrich each program
existingData.programs.forEach(prog => {
  for (const lvlKey of Object.keys(prog.study_plan)) {
    const lvl = prog.study_plan[lvlKey];
    for (const semKey of Object.keys(lvl)) {
      const sem = lvl[semKey];
      if (sem.courses) {
        sem.courses.forEach(c => {
          c.name = c.name_en;
          c.name_ar = courseTranslations[c.code] || (c.name_en === 'Critical Thinking' ? 'التفكير الناقد' : c.name_en === 'Innovation & Entrepreneurship' ? 'الابتكار وريادة الأعمال' : c.name_en === 'University Elective' ? 'متطلب جامعة اختياري' : c.name_en === 'Faculty Elective' ? 'متطلب كلية اختياري' : c.name_en === 'Program Elective' ? 'متطلب برنامج اختياري' : '');
          c.prerequisites_details = helperGetPrereqNames(c.prerequisites || []);
        });
      }
    }
  }

  prog.program_electives.forEach(c => {
    c.name = c.name_en;
    c.name_ar = courseTranslations[c.code] || '';
    c.prerequisites_details = helperGetPrereqNames(c.prerequisites || []);
  });
});

// Build a prerequisite dependency graph (courses dependent on this course)
const prereqGraph = {};
existingData.all_unique_courses.forEach(c => {
  prereqGraph[c.code] = {
    course_name_en: c.name_en,
    course_name_ar: c.name_ar,
    prerequisites: c.prerequisites,
    unlocks_courses: []
  };
});

existingData.all_unique_courses.forEach(c => {
  c.prerequisites.forEach(p => {
    if (prereqGraph[p]) {
      prereqGraph[p].unlocks_courses.push({
        code: c.code,
        name_en: c.name_en,
        name_ar: c.name_ar
      });
    }
  });
});

existingData.prerequisites_dependency_graph = prereqGraph;

// Save file to:
// 1. src/data/faculty_courses_bylaw.json
// 2. faculty_courses_bylaw.json (root)
// 3. faculty_courses.json (root)
// 4. src/data/faculty_courses.json

const out1 = path.join(projectRoot, 'src', 'data', 'faculty_courses_bylaw.json');
const out2 = path.join(projectRoot, 'faculty_courses_bylaw.json');
const out3 = path.join(projectRoot, 'faculty_courses.json');
const out4 = path.join(projectRoot, 'src', 'data', 'faculty_courses.json');

const jsonString = JSON.stringify(existingData, null, 2);

fs.writeFileSync(out1, jsonString, 'utf8');
fs.writeFileSync(out2, jsonString, 'utf8');
fs.writeFileSync(out3, jsonString, 'utf8');
fs.writeFileSync(out4, jsonString, 'utf8');

console.log('Saved enriched JSON to:');
console.log(' -', out1);
console.log(' -', out2);
console.log(' -', out3);
console.log(' -', out4);
console.log('Prerequisites graph populated successfully for', Object.keys(prereqGraph).length, 'courses!');
