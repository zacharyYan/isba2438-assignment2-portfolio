import type { Localized } from "@/lib/i18n";

export type EducationItem = {
  school: string;
  degree: string;
  location: string;
  period: Localized;
};

export type ExperienceItem = {
  company: string;
  role: Localized;
  period: Localized;
  points: Localized[];
};

export type SkillGroup = {
  category: Localized;
  items: Localized;
};

export type Profile = {
  name: string;
  tagline: Localized;
  intro: Localized;
  email: string | null;
  phone: string | null;
  location: string;
  links: { label: string; url: string }[];
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillGroup[];
  languages: Localized;
  interests: Localized;
};

export const profile: Profile = {
  name: "Zhike Yan",
  tagline: {
    zh: "商业分析硕士生 · Python / R / 机器学习 / 数据可视化",
    en: "Business Analytics master's student · Python / R / Machine Learning / Data Visualization",
  },
  intro: {
    zh: "圣塔克拉拉大学（Santa Clara University）商业分析硕士生，预计 2026 年 12 月毕业。在客户流失预测、评论主题建模、数字营销效果分析等项目中积累了可复现的分析经验，并作为前端主力参与开发了一个已上线的科研学者检索平台。",
    en: "Master's student in Business Analytics at Santa Clara University (expected Dec 2026). Built reproducible analyses across customer churn, review topic modeling, and digital marketing performance, and contributed mainly to the front end of a deployed researcher search platform.",
  },
  email: "zyan3@scu.edu",
  phone: null,
  location: "San Jose, CA",
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/Zhike" },
    { label: "GitHub", url: "https://github.com/zacharyYan" },
  ],
  education: [
    {
      school: "Santa Clara University, Leavey School of Business",
      degree: "Master of Science in Business Analytics",
      location: "Santa Clara, CA",
      period: { zh: "预计 2026 年 12 月毕业", en: "Expected Dec 2026" },
    },
    {
      school: "Zhejiang Gongshang University Hangzhou College of Commerce",
      degree: "Bachelor of Economics, International Economics and Trade",
      location: "Hangzhou, China",
      period: { zh: "2025 年 6 月毕业", en: "Jun 2025" },
    },
  ],
  experience: [
    {
      company: "Zhejiang Honghan Pharmaceutical Technology Co., Ltd.",
      role: {
        zh: "国际贸易部业务助理",
        en: "Business Assistant, International Trade Department",
      },
      period: { zh: "2024 年 7 月 - 2024 年 8 月", en: "Jul 2024 - Aug 2024" },
      points: [
        {
          zh: "协调国际客户与内部团队的双语沟通，在中英文之间翻译业务需求与产品信息。",
          en: "Coordinated bilingual communication between international clients and internal teams, translating business requirements and product information between English and Chinese.",
        },
        {
          zh: "管理国际邮件往来并准备贸易单据，解决单据不完整问题，支持准确、及时的处理流程。",
          en: "Managed international email correspondence and prepared trade documents, resolving incomplete-document issues and supporting accurate, timely processing.",
        },
      ],
    },
    {
      company: "Hangzhou Hikvision Digital Technology Co., Ltd.",
      role: {
        zh: "人力资源专员实习生",
        en: "HR Specialist Intern",
      },
      period: { zh: "2023 年 7 月 - 2023 年 8 月", en: "Jul 2023 - Aug 2023" },
      points: [
        {
          zh: "支持员工培训：准备培训材料、记录反馈，维护人事档案的准确与完整。",
          en: "Supported employee training by preparing materials, recording feedback, and maintaining personnel files for accuracy and completeness.",
        },
        {
          zh: "协助招聘：发布职位、筛选简历，与用人团队协调面试安排。",
          en: "Assisted recruitment by posting job openings, screening resumes, and scheduling interviews with hiring teams.",
        },
      ],
    },
  ],
  skills: [
    {
      category: { zh: "编程与数据", en: "Programming & Data" },
      items: {
        zh: "Python, R, pandas, NumPy, scikit-learn, tidyverse, TypeScript",
        en: "Python, R, pandas, NumPy, scikit-learn, tidyverse, TypeScript",
      },
    },
    {
      category: { zh: "分析与机器学习", en: "Analytics & Machine Learning" },
      items: {
        zh: "数据清洗、特征工程、EDA、Logistic Regression、KNN、Random Forest、K-means、LDA、TF-IDF、交叉验证、模型评估",
        en: "Data cleaning, feature engineering, EDA, Logistic Regression, KNN, Random Forest, K-means, LDA, TF-IDF, cross-validation, model evaluation",
      },
    },
    {
      category: { zh: "可视化 / Web / 工具", en: "Visualization, Web & Tools" },
      items: {
        zh: "Tableau, Matplotlib, Seaborn, Microsoft Excel, React, REST APIs, GitHub",
        en: "Tableau, Matplotlib, Seaborn, Microsoft Excel, React, REST APIs, GitHub",
      },
    },
  ],
  languages: {
    zh: "中文（母语）；英语（专业工作水平）",
    en: "Mandarin (Native); English (Professional Working Proficiency)",
  },
  interests: {
    zh: "摄影 — 大学校摄影协会核心成员（2022 年 2 月 - 2022 年 6 月）",
    en: "Photography — Core Member, University Photographic Association (Feb 2022 - Jun 2022)",
  },
};
