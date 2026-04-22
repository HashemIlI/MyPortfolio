import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Experience from '@/models/Experience';
import Skill from '@/models/Skill';
import Certification from '@/models/Certification';
import Education from '@/models/Education';
import Profile from '@/models/Profile';
import SiteSettings from '@/models/SiteSettings';
import ThemeSettings from '@/models/ThemeSettings';
import CategoryGroup from '@/models/CategoryGroup';
import { PROJECT_CATEGORIES } from '@/models/Project';
import { slugify } from '@/lib/utils';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  await connectDB();

  // Clear existing data
  await Promise.all([
    Project.deleteMany({}),
    Experience.deleteMany({}),
    Skill.deleteMany({}),
    Certification.deleteMany({}),
    Education.deleteMany({}),
    Profile.deleteMany({}),
    SiteSettings.deleteMany({}),
    ThemeSettings.deleteMany({}),
    CategoryGroup.deleteMany({}),
  ]);

  // ─── Profile (Singleton) ──────────────────────────────────────────────────
  await Profile.create({
    nameEn: 'Ahmed Fouad Hashem',
    headlineEn: 'I turn data into real business impact.',
    nameAr: 'أحمد فؤاد هاشم',
    headlineAr: 'أحول البيانات إلى أثر أعمال حقيقي.',
    titleEn: 'Data Analyst & Applied AI Specialist',
    titleAr: 'محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي',
    subtitleEn: 'Turning raw data into strategic decisions with ML & AI',
    subtitleAr: 'تحويل البيانات الخام إلى قرارات استراتيجية بالتعلم الآلي والذكاء الاصطناعي',
    summaryEn:
      'Data Analyst and Applied AI Specialist with hands-on experience designing end-to-end machine learning pipelines, building predictive models, and delivering actionable business insights. Proficient in Python, SQL, Power BI, and the full ML ecosystem. Passionate about solving real-world problems through data-driven solutions.',
    summaryAr:
      'محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي، يتمتع بخبرة عملية في تصميم خطوط أنابيب تعلم الآلة الشاملة، وبناء النماذج التنبؤية، وتقديم رؤى أعمال قابلة للتنفيذ. يتقن Python وSQL وPower BI ومنظومة تعلم الآلة الكاملة.',
    aboutEn:
      'I am a Data Analyst & Applied AI Specialist passionate about transforming raw data into strategic insights. Through intensive training at Digilians – Egyptian Military Academy, I built expertise in the full machine learning lifecycle: from data collection and preprocessing through model development, evaluation, and deployment.\n\nI thrive at the intersection of statistics, programming, and business intelligence — using Python, SQL, TensorFlow, and Power BI to solve real-world challenges. I believe every dataset holds a story, and I am dedicated to uncovering it.',
    aboutAr:
      'أنا محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي، شغوف بتحويل البيانات الخام إلى رؤى استراتيجية. من خلال التدريب المكثف في Digilians بالأكاديمية العسكرية المصرية، اكتسبت خبرة في دورة حياة تعلم الآلة الكاملة: من جمع البيانات ومعالجتها إلى تطوير النماذج وتقييمها ونشرها.',
    email: 'ahmedfouadhashem2@gmail.com',
    phone: '+201097480084',
    locationEn: 'Cairo, Egypt',
    locationAr: 'القاهرة، مصر',
    github: 'https://github.com/hashemili',
    linkedin: 'https://www.linkedin.com/in/ahmedfouadhashem/',
    kaggle: 'https://www.kaggle.com/hashemili',
    whatsapp: 'https://wa.me/201097480084',
    availableForWork: true,
    availabilityLabelEn: 'Open to opportunities',
    availabilityLabelAr: 'متاح لفرص العمل',
  });

  // ─── Site Settings (Singleton) ────────────────────────────────────────────
  await SiteSettings.create({
    siteNameEn: 'Ahmed Fouad Hashem',
    siteNameAr: 'أحمد فؤاد هاشم',
    siteDescriptionEn: 'Data Analyst & Applied AI Specialist — Portfolio',
    siteDescriptionAr: 'محلل بيانات ومتخصص في الذكاء الاصطناعي التطبيقي — معرض الأعمال',
    siteKeywords: [
      'data analyst', 'AI', 'machine learning', 'deep learning',
      'Python', 'Power BI', 'TensorFlow', 'NLP', 'portfolio',
    ],
    defaultTheme: 'dark',
    defaultLanguage: 'en',
  });

  await ThemeSettings.create({
    singletonKey: 'theme',
    colorTheme: 'default',
    radius: 'soft',
    cardStyle: 'premium',
    typographyScale: 'balanced',
    sectionSpacing: 'normal',
  });

  // ─── Education ────────────────────────────────────────────────────────────
  await Education.insertMany([
    {
      degreeEn: 'Applied AI & Data Analytics Training Program',
      degreeAr: 'برنامج تدريب الذكاء الاصطناعي التطبيقي وتحليل البيانات',
      institutionEn: 'Digilians – Egyptian Military Academy',
      institutionAr: 'ديجيليانز – الأكاديمية العسكرية المصرية',
      fieldOfStudyEn: 'Artificial Intelligence & Data Analytics',
      fieldOfStudyAr: 'الذكاء الاصطناعي وتحليل البيانات',
      startDate: '2024',
      endDate: '2025',
      descriptionEn:
        '9-month intensive program covering the full ML lifecycle: data preprocessing, feature engineering, supervised/unsupervised learning, deep learning with ANN, NLP, and data visualization.',
      descriptionAr:
        'برنامج مكثف لمدة 9 أشهر يغطي دورة حياة تعلم الآلة الكاملة: معالجة البيانات، هندسة الميزات، التعلم الخاضع للإشراف وغير الخاضع، التعلم العميق، معالجة اللغات الطبيعية، وتصوير البيانات.',
      visible: true,
      order: 1,
    },
  ]);

  // ─── Experience ───────────────────────────────────────────────────────────
  await Experience.insertMany([
    {
      titleEn: 'Applied AI & Data Analytics Trainee',
      titleAr: 'متدرب الذكاء الاصطناعي التطبيقي وتحليل البيانات',
      companyEn: 'Digilians – Egyptian Military Academy',
      companyAr: 'ديجيليانز – الأكاديمية العسكرية المصرية',
      durationEn: '2024 – 2025 · 9 Months',
      durationAr: '2024 – 2025 · 9 أشهر',
      bulletsEn: [
        'Designed and deployed 10+ end-to-end ML pipelines, handling datasets up to 100K+ records, including preprocessing, feature engineering, and model evaluation.',
        'Built and optimized 10+ predictive models (Random Forest, Logistic Regression, ANN), achieving up to 98% classification accuracy.',
        'Improved model performance by 15–20% through hyperparameter tuning, cross-validation, and regularization techniques.',
        'Reduced data preprocessing time by 30% by automating cleaning and transformation workflows using Python (Pandas & NumPy).',
        'Conducted statistical analysis and hypothesis testing on real-world datasets, improving business decision accuracy by 25%.',
        'Developed 10+ analytical reports and interactive dashboards using data visualization tools to support data-driven decision-making.',
      ],
      bulletsAr: [
        'صمّم ونشر أكثر من 10 خطوط أنابيب تعلم آلة شاملة، تتعامل مع مجموعات بيانات تصل إلى أكثر من 100 ألف سجل.',
        'بنى وحسّن أكثر من 10 نماذج تنبؤية، حاقق دقة تصنيف تصل إلى 98٪.',
        'حسّن أداء النماذج بنسبة 15–20٪ من خلال ضبط المعاملات الفائقة والتحقق المتقاطع.',
        'قلّص وقت معالجة البيانات بنسبة 30٪ عبر أتمتة سير عمل التنظيف والتحويل.',
        'أجرى تحليلاً إحصائياً واختبار الفرضيات على مجموعات بيانات واقعية، مما حسّن دقة قرارات الأعمال بنسبة 25٪.',
        'طوّر أكثر من 10 تقارير تحليلية ولوحات معلومات تفاعلية لدعم اتخاذ القرارات المبنية على البيانات.',
      ],
      tools: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'TensorFlow', 'Keras', 'Power BI', 'SQL'],
      current: false,
      visible: true,
      order: 1,
    },
  ]);

  // ─── Skills ───────────────────────────────────────────────────────────────
  await Skill.insertMany([
    // Machine Learning
    { nameEn: 'Supervised Learning', nameAr: 'التعلم الخاضع للإشراف', category: 'Machine Learning', level: 'Advanced', order: 1 },
    { nameEn: 'Unsupervised Learning', nameAr: 'التعلم غير الخاضع للإشراف', category: 'Machine Learning', level: 'Intermediate', order: 2 },
    { nameEn: 'Feature Engineering', nameAr: 'هندسة الميزات', category: 'Machine Learning', level: 'Advanced', order: 3 },
    { nameEn: 'Model Evaluation', nameAr: 'تقييم النماذج', category: 'Machine Learning', level: 'Advanced', order: 4 },
    { nameEn: 'Hyperparameter Tuning', nameAr: 'ضبط المعاملات الفائقة', category: 'Machine Learning', level: 'Intermediate', order: 5 },
    { nameEn: 'Random Forest', nameAr: 'الغابة العشوائية', category: 'Machine Learning', level: 'Advanced', order: 6 },
    { nameEn: 'Logistic Regression', nameAr: 'الانحدار اللوجستي', category: 'Machine Learning', level: 'Expert', order: 7 },
    // Deep Learning
    { nameEn: 'Artificial Neural Networks', nameAr: 'الشبكات العصبية الاصطناعية', category: 'Deep Learning', level: 'Advanced', order: 1 },
    { nameEn: 'TensorFlow', nameAr: 'تنسرفلو', category: 'Deep Learning', level: 'Intermediate', order: 2 },
    { nameEn: 'Keras', nameAr: 'كيراس', category: 'Deep Learning', level: 'Intermediate', order: 3 },
    { nameEn: 'PyTorch', nameAr: 'باي تورش', category: 'Deep Learning', level: 'Beginner', order: 4 },
    { nameEn: 'Batch Normalization', nameAr: 'التطبيع الدفعي', category: 'Deep Learning', level: 'Intermediate', order: 5 },
    // Programming
    { nameEn: 'Python', nameAr: 'بايثون', category: 'Programming', level: 'Expert', order: 1 },
    { nameEn: 'SQL', nameAr: 'SQL', category: 'Programming', level: 'Advanced', order: 2 },
    { nameEn: 'Pandas', nameAr: 'باندا', category: 'Programming', level: 'Expert', order: 3 },
    { nameEn: 'NumPy', nameAr: 'نمباي', category: 'Programming', level: 'Expert', order: 4 },
    { nameEn: 'Scikit-Learn', nameAr: 'سكيكيت-ليرن', category: 'Programming', level: 'Advanced', order: 5 },
    // Data Visualisation
    { nameEn: 'Power BI', nameAr: 'باور بي آي', category: 'Data Visualisation', level: 'Advanced', order: 1 },
    { nameEn: 'Tableau', nameAr: 'تابلو', category: 'Data Visualisation', level: 'Intermediate', order: 2 },
    { nameEn: 'Matplotlib', nameAr: 'ماتبلوتليب', category: 'Data Visualisation', level: 'Advanced', order: 3 },
    { nameEn: 'Seaborn', nameAr: 'سيبورن', category: 'Data Visualisation', level: 'Advanced', order: 4 },
    { nameEn: 'Exploratory Data Analysis', nameAr: 'التحليل الاستكشافي للبيانات', category: 'Data Visualisation', level: 'Expert', order: 5 },
    // Tools & Platforms
    { nameEn: 'Excel', nameAr: 'إكسيل', category: 'Tools & Platforms', level: 'Advanced', order: 1 },
    { nameEn: 'Jupyter Notebook', nameAr: 'جوبيتر نوتبوك', category: 'Tools & Platforms', level: 'Expert', order: 2 },
    { nameEn: 'Google Colab', nameAr: 'جوجل كولاب', category: 'Tools & Platforms', level: 'Expert', order: 3 },
    { nameEn: 'Git & GitHub', nameAr: 'جيت وجيت هاب', category: 'Tools & Platforms', level: 'Intermediate', order: 4 },
    { nameEn: 'Kaggle', nameAr: 'كاجل', category: 'Tools & Platforms', level: 'Advanced', order: 5 },
    // Soft Skills
    { nameEn: 'Analytical Thinking', nameAr: 'التفكير التحليلي', category: 'Soft Skills', level: 'Expert', order: 1 },
    { nameEn: 'Problem Solving', nameAr: 'حل المشكلات', category: 'Soft Skills', level: 'Expert', order: 2 },
    { nameEn: 'Communication', nameAr: 'التواصل', category: 'Soft Skills', level: 'Advanced', order: 3 },
    { nameEn: 'Teamwork', nameAr: 'العمل الجماعي', category: 'Soft Skills', level: 'Advanced', order: 4 },
  ]);

  // ─── Certifications ───────────────────────────────────────────────────────
  await Certification.insertMany([
    {
      nameEn: 'Machine Learning Specialization',
      nameAr: 'تخصص تعلم الآلة',
      issuer: 'Stanford University & DeepLearning.AI',
      date: 'Feb 2025',
      descriptionEn: 'Comprehensive 3-course specialization covering supervised learning, unsupervised learning, and advanced ML techniques by Andrew Ng.',
      descriptionAr: 'تخصص شامل من 3 دورات يغطي التعلم الخاضع للإشراف، وغير الخاضع، وتقنيات تعلم الآلة المتقدمة من Andrew Ng.',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/specialization/8ANBHZZ2DBC5',
      featured: true,
      visible: true,
      order: 1,
    },
    {
      nameEn: 'Google Advanced Data Analytics Professional Certificate',
      nameAr: 'شهادة محترف تحليلات البيانات المتقدمة من Google',
      issuer: 'Google',
      date: 'Jul 2024',
      descriptionEn: 'Advanced data analytics skills including statistics, Python, regression models, and machine learning fundamentals.',
      descriptionAr: 'مهارات تحليل البيانات المتقدمة بما يشمل الإحصاء وPython ونماذج الانحدار وأساسيات تعلم الآلة.',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/professional-cert/XXXXXXXXXXX',
      featured: true,
      visible: true,
      order: 2,
    },
    {
      nameEn: 'Google Data Analytics Professional Certificate',
      nameAr: 'شهادة محترف تحليل البيانات من Google',
      issuer: 'Google',
      date: 'Dec 2023',
      descriptionEn: 'Foundational data analytics skills covering data cleaning, analysis, visualization, and storytelling with data.',
      descriptionAr: 'مهارات تحليل البيانات الأساسية تشمل تنظيف البيانات والتحليل والتصور والسرد القصصي بالبيانات.',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/professional-cert/XXXXXXXXXXX',
      featured: true,
      visible: true,
      order: 3,
    },
    {
      nameEn: 'Professional Soft Skills Learning Pathway',
      nameAr: 'مسار تعلم المهارات المهنية الناعمة',
      issuer: 'LinkedIn Learning',
      date: 'Mar 2024',
      descriptionEn: 'Professional development pathway covering communication, critical thinking, and workplace collaboration.',
      descriptionAr: 'مسار تطوير مهني يغطي التواصل والتفكير النقدي والتعاون في مكان العمل.',
      credentialUrl: '',
      featured: false,
      visible: true,
      order: 4,
    },
  ]);

  // ─── Projects ─────────────────────────────────────────────────────────────
  await Project.insertMany([
    {
      titleEn: 'Taxi Fare Estimation System',
      titleAr: 'نظام تقدير أجرة سيارات الأجرة',
      slug: 'taxi-fare-estimation',
      shortSummaryEn: 'Deep learning ANN model predicting NYC taxi fares with high accuracy using batch normalization and dropout.',
      shortSummaryAr: 'نموذج تعلم عميق ANN يتنبأ بأجور سيارات الأجرة في نيويورك بدقة عالية.',
      executiveSummaryEn:
        'Built a production-ready fare estimation model using Artificial Neural Networks trained on 100K+ NYC taxi trip records. Applied Batch Normalization and Dropout to improve generalization. Evaluated using MAE and RMSE metrics, achieving state-of-the-art predictive accuracy.',
      executiveSummaryAr:
        'بنى نموذجاً جاهزاً للإنتاج لتقدير الأجرة باستخدام الشبكات العصبية الاصطناعية المدربة على أكثر من 100 ألف سجل رحلات سيارات الأجرة في نيويورك.',
      category: 'Deep Learning',
      problemStatementEn: 'Taxi fare pricing is inconsistent and often opaque. Riders need a reliable pre-trip estimate.',
      businessObjectiveEn: 'Build a predictive model that estimates taxi fares before the trip to improve transparency and planning.',
      technicalApproachEn: 'Designed a multi-layer ANN with Batch Normalization and Dropout layers. Applied feature engineering on pickup/dropoff coordinates, time of day, and trip distance.',
      modelUsed: 'Artificial Neural Network (ANN)',
      evaluationMetrics: 'MAE, RMSE',
      resultsEn: 'Achieved competitive MAE and RMSE, outperforming baseline linear regression by over 20%.',
      tools: ['Python', 'TensorFlow', 'Keras', 'Pandas', 'NumPy', 'Matplotlib'],
      githubLink: 'https://github.com/hashemili',
      kaggleLink: 'https://www.kaggle.com/hashemili',
      featured: true,
      featuredOnHomepage: true,
      homepageCategoryOrder: 1,
      visible: true,
      displayOrder: 1,
    },
    {
      titleEn: 'Titanic Survival Prediction',
      titleAr: 'التنبؤ بالنجاة من حادثة تيتانيك',
      slug: 'titanic-survival-prediction',
      shortSummaryEn: 'ML classification model with advanced EDA and feature engineering achieving high survival prediction accuracy.',
      shortSummaryAr: 'نموذج تصنيف تعلم آلة مع تحليل استكشافي متقدم وهندسة ميزات لتحقيق دقة عالية في التنبؤ بالنجاة.',
      executiveSummaryEn:
        'Performed in-depth EDA and engineered features such as Family Size and Title extraction from passenger names. Trained Logistic Regression and Random Forest models with data imputation, categorical encoding, and cross-validation.',
      category: 'Machine Learning',
      problemStatementEn: 'Predict whether a passenger survived the Titanic disaster based on passenger attributes.',
      businessObjectiveEn: 'Demonstrate full ML pipeline proficiency including data cleaning, feature engineering, model training, and evaluation.',
      technicalApproachEn: 'Applied missing value imputation, label encoding, and feature engineering. Compared Logistic Regression vs Random Forest, selected best model via cross-validation.',
      modelUsed: 'Random Forest, Logistic Regression',
      evaluationMetrics: 'Accuracy, Precision, Recall, F1-Score',
      resultsEn: 'Random Forest achieved 82% accuracy on the Kaggle test set.',
      tools: ['Python', 'Scikit-Learn', 'Pandas', 'Seaborn', 'Matplotlib'],
      githubLink: 'https://github.com/hashemili',
      kaggleLink: 'https://www.kaggle.com/hashemili',
      featured: true,
      featuredOnHomepage: true,
      homepageCategoryOrder: 1,
      visible: true,
      displayOrder: 2,
    },
    {
      titleEn: 'Customer Feedback Analysis System',
      titleAr: 'نظام تحليل تغذية العملاء الراجعة',
      slug: 'customer-feedback-analysis',
      shortSummaryEn: 'NLP-powered sentiment analysis system extracting actionable insights from unstructured customer reviews.',
      shortSummaryAr: 'نظام تحليل المشاعر المدعوم بمعالجة اللغة الطبيعية لاستخراج رؤى قابلة للتنفيذ.',
      executiveSummaryEn:
        'Built an NLP pipeline using CountVectorizer for text feature extraction and trained a classification model to categorize customer reviews as positive, neutral, or negative. Delivered business insights directly from unstructured data.',
      category: 'NLP',
      problemStatementEn: 'Businesses receive thousands of unstructured customer reviews. Manual analysis is slow and inconsistent.',
      businessObjectiveEn: 'Automate sentiment classification to extract actionable business insights from customer feedback at scale.',
      technicalApproachEn: 'Preprocessed text using tokenization, stopword removal, and stemming. Applied CountVectorizer for feature extraction and trained a Naive Bayes classifier.',
      modelUsed: 'Naive Bayes, Logistic Regression',
      evaluationMetrics: 'Accuracy, Confusion Matrix, F1-Score',
      resultsEn: 'Achieved 89% classification accuracy. Identified top 5 customer pain points driving churn.',
      tools: ['Python', 'NLTK', 'Scikit-Learn', 'CountVectorizer', 'Pandas', 'Matplotlib'],
      githubLink: 'https://github.com/hashemili',
      kaggleLink: 'https://www.kaggle.com/hashemili',
      featured: true,
      featuredOnHomepage: true,
      homepageCategoryOrder: 1,
      visible: true,
      displayOrder: 3,
    },
    {
      titleEn: 'House Price Prediction',
      titleAr: 'التنبؤ بأسعار المنازل',
      slug: 'house-price-prediction',
      shortSummaryEn: 'Regression model predicting residential property prices using advanced feature selection and ensemble methods.',
      shortSummaryAr: 'نموذج انحدار للتنبؤ بأسعار العقارات السكنية باستخدام تحديد الميزات المتقدم.',
      category: 'Machine Learning',
      problemStatementEn: 'Accurate house price estimation is critical for real estate buyers, sellers, and financial institutions.',
      technicalApproachEn: 'Applied correlation analysis for feature selection, handled skewed distributions with log transforms, and compared Ridge, Lasso, and Gradient Boosting regressors.',
      modelUsed: 'Gradient Boosting, Ridge, Lasso',
      evaluationMetrics: 'RMSE, R² Score',
      resultsEn: 'Gradient Boosting achieved R² of 0.91 on the test set.',
      tools: ['Python', 'Scikit-Learn', 'Pandas', 'Seaborn', 'Matplotlib'],
      githubLink: 'https://github.com/hashemili',
      featured: false,
      featuredOnHomepage: true,
      homepageCategoryOrder: 2,
      visible: true,
      displayOrder: 4,
    },
    {
      titleEn: 'Sales Dashboard & Business Intelligence',
      titleAr: 'لوحة المبيعات وذكاء الأعمال',
      slug: 'sales-dashboard-bi',
      shortSummaryEn: 'Interactive Power BI dashboard delivering real-time sales KPIs, trend analysis, and regional performance insights.',
      shortSummaryAr: 'لوحة معلومات Power BI تفاعلية تقدم مؤشرات KPI للمبيعات وتحليل الاتجاهات.',
      category: 'Business Intelligence',
      problemStatementEn: 'Sales teams lacked a unified view of performance metrics across regions and product lines.',
      businessObjectiveEn: 'Build an interactive BI dashboard to support executive decision-making with real-time KPI monitoring.',
      technicalApproachEn: 'Designed a Power BI dashboard with DAX calculations for YoY growth, sales forecasting, and regional heatmaps.',
      modelUsed: 'Power BI DAX, Trend Analysis',
      resultsEn: 'Reduced monthly reporting time by 40%. Enabled executive team to identify top-performing regions instantly.',
      tools: ['Power BI', 'DAX', 'Excel', 'SQL'],
      featured: false,
      featuredOnHomepage: true,
      homepageCategoryOrder: 1,
      visible: true,
      displayOrder: 5,
    },
  ]);

  await CategoryGroup.insertMany(
    PROJECT_CATEGORIES.map((category, index) => ({
      name: category,
      slug: slugify(category),
      sourceCategories: [category],
      visible: true,
      sortOrder: index,
    }))
  );

  return NextResponse.json({
    success: true,
    message: 'Database seeded with full CV data successfully',
    seeded: {
      profile: 1,
      siteSettings: 1,
      education: 1,
      experience: 1,
      skills: 31,
      certifications: 4,
      projects: 5,
      categoryGroups: PROJECT_CATEGORIES.length,
    },
  });
}
