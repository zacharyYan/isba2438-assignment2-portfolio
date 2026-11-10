import type { Localized } from "@/lib/i18n";

export type ProjectLinkKind = "source" | "demo";

export type ProjectLink = {
  kind: ProjectLinkKind;
  url: string;
};

export type Project = {
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  techStack: string[];
  role: Localized;
  year?: string;
  links?: ProjectLink[];
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "researchai",
    title: {
      zh: "ResearchAI — 科研学者检索平台",
      en: "ResearchAI — Academic Researcher Search Platform",
    },
    summary: {
      zh: "三人团队开发并上线的科研学者检索平台：多条件检索、筛选分页、学者画像与 Pareto 权衡图。",
      en: "A deployed researcher search platform built by a three-person team: multi-condition search, filters, pagination, researcher profiles, and a Pareto trade-off chart.",
    },
    description: {
      zh: "三人团队项目，平台已部署上线。本人主要负责 React/TypeScript 前端，参与实现姓名、主题、机构检索，以及筛选、分页与学者画像页；与队友协作对接 REST API 结果，呈现排序指标、可调权重、引用年份筛选、收藏学者与 Pareto 权衡图表。",
      en: "Three-person team project, deployed to production. Contributed mainly to the React/TypeScript front end, helping implement name, topic, and institution search, filters, pagination, and researcher profiles; worked with teammates to connect REST API results and present ranking metrics, adjustable weights, citation-year filters, saved researchers, and a Pareto trade-off chart.",
    },
    techStack: ["React", "TypeScript", "REST APIs"],
    role: {
      zh: "三人团队 · 前端主力",
      en: "Three-person team · Main front-end contributor",
    },
    // TODO(待补充): 简历提到 Live Demo 与 GitHub，但未给出具体网址
    featured: true,
  },
  {
    slug: "bank-churn-prediction",
    title: {
      zh: "Bank Customer Churn Prediction — 银行客户流失预测",
      en: "Bank Customer Churn Prediction",
    },
    summary: {
      zh: "10,000 条银行客户记录的流失预测：Random Forest 调优后测试集 ROC-AUC 达 0.862。",
      en: "Churn prediction on 10,000 bank customer records: tuned Random Forest reached a test ROC-AUC of 0.862.",
    },
    description: {
      zh: "课程作品集项目。基于 10,000 条匿名银行客户记录，重构并验证监督学习管道：数据质量检查、独热编码、标准化与分层训练/验证/测试划分；比较 Logistic Regression、KNN 与 Random Forest，经五折交叉验证调优后测试集 ROC-AUC 达 0.862；在 0.50 阈值下取得 73.2% 召回率与 53.2% 精确率，并用置换重要性识别与流失相关的客户属性。",
      en: "Course portfolio project. Reworked and validated a supervised-learning pipeline on 10,000 anonymized bank customer records, with data-quality checks, one-hot encoding, scaling, and stratified train/validation/test splits; compared Logistic Regression, KNN, and Random Forest, tuning Random Forest with five-fold cross-validation to a test ROC-AUC of 0.862; evaluated classification thresholds, achieving 73.2% recall and 53.2% precision at 0.50, and used permutation importance to identify attributes associated with churn.",
    },
    techStack: ["Python", "pandas", "scikit-learn", "Matplotlib", "Seaborn"],
    role: {
      zh: "课程作品集项目（个人）",
      en: "Course portfolio project (individual)",
    },
    links: [
      {
        kind: "source",
        url: "https://github.com/zacharyYan/bank-customer-churn-analysis",
      },
    ],
    featured: true,
  },
  {
    slug: "financial-marketing-analysis",
    title: {
      zh: "Financial Services Marketing Performance Analysis — 金融服务营销效果分析",
      en: "Financial Services Marketing Performance Analysis",
    },
    summary: {
      zh: "R 分析 52,446 条金融网页分析记录：社交渠道每会话收入最高（$392）。",
      en: "Analyzed 52,446 financial-services web-analytics records in R: social traffic produced the highest revenue per session ($392).",
    },
    description: {
      zh: "五人团队项目。在 R 中分析 52,446 条金融服务网页分析记录，涵盖数据清洗、特征工程、渠道分析与高价值会话建模；支持 Logistic 回归与三聚类 K-means 细分。团队发现社交渠道带来的每会话收入最高（$392），并据此提出关于渠道质量与站内互动的建议。",
      en: "Five-person team project. Collaborated to analyze 52,446 financial-services web-analytics records in R, including data cleaning, feature engineering, channel analysis, and high-value-session modeling; supported logistic regression and three-cluster K-means segmentation. Team findings showed social traffic produced the highest revenue per session ($392) and supported recommendations on channel quality and onsite engagement.",
    },
    techStack: ["R", "tidyverse", "Logistic Regression", "K-means", "FRED"],
    role: {
      zh: "五人团队 · 协作分析",
      en: "Five-person team · Collaborative analysis",
    },
  },
  {
    slug: "amazon-review-nlp",
    title: {
      zh: "Amazon Watch Review NLP — 评论主题建模",
      en: "Amazon Watch Review NLP and Topic Modeling",
    },
    summary: {
      zh: "96 万+ Amazon 手表评论的主题建模：识别六大客户痛点主题，质量/价值占 23.1%。",
      en: "Topic modeling on 960k+ Amazon watch reviews: six customer pain-point themes, with quality/value the largest at 23.1%.",
    },
    description: {
      zh: "课程作品集项目。对超过 960,000 条 Amazon 手表评论（可复现建模样本为 10,000 条独特低分评论）重构并验证 NLP 工作流：文本清洗、TF-IDF 与 n-gram 特征；对比 K-means 与 LDA，识别出六大客户痛点主题，其中质量/价值为最大主题（23.1%）；将结果转化为产品质量、尺码指引、部件耐用性与客服建议，同时如实记录 K-means 分离度较弱这一模型局限。",
      en: "Course portfolio project. Reworked and validated an NLP workflow using a source file of more than 960,000 Amazon watch reviews and a reproducible modeling sample of 10,000 unique low-rating reviews; applied text cleaning, TF-IDF, and n-gram features; compared K-means with LDA and identified six customer pain-point themes, with quality/value the largest dominant topic at 23.1%; translated topic results into recommendations for product quality, sizing guidance, component durability, and customer support while documenting weak K-means separation as a model limitation.",
    },
    techStack: ["Python", "NLTK", "TF-IDF", "K-means", "LDA"],
    role: {
      zh: "课程作品集项目（个人）",
      en: "Course portfolio project (individual)",
    },
    links: [
      {
        kind: "source",
        url: "https://github.com/zacharyYan/amazon-watch-review-nlp",
      },
    ],
  },
  {
    slug: "manufacturing-cost-analysis",
    title: {
      zh: "Manufacturing Consumables Cost Analysis — 制造耗材成本分析",
      en: "Manufacturing Consumables Cost Analysis",
    },
    summary: {
      zh: "挡风玻璃良率提升至 93% 的成本模型：单位耗材成本预计下降 $0.22（12.9%）。",
      en: "Cost model for raising windshield yield to 93%: consumables cost estimated to fall from $1.73 to $1.51 per unit (a $0.22, 12.9% reduction).",
    },
    description: {
      zh: "商业案例分析。建模分析将挡风玻璃良率提升至 93% 的成本影响，估算单位耗材成本从 $1.73 降至 $1.51（降低 $0.22，12.9%）；制定 30-60-90 天控制计划，衔接基线跟踪、试点行动与运营控制以维持目标良率。",
      en: "Business case analysis. Modeled the cost impact of improving windshield yield to 93%, estimating consumables cost would decline from $1.73 to $1.51 per unit—a $0.22 (12.9%) reduction; developed a 30-60-90 day control plan linking baseline tracking, pilot actions, and operating controls to sustain the target yield.",
    },
    techStack: ["Microsoft Excel", "Cost Analysis", "Process Improvement"],
    role: {
      zh: "商业案例分析",
      en: "Business case analysis",
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}
