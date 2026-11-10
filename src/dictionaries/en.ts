import type { Dictionary } from "./zh";

const en: Dictionary = {
  siteTitle: "Portfolio",
  siteDescription:
    "Zhike Yan's portfolio: business analytics, data science and machine learning projects, plus front-end development work.",
  nav: {
    home: "Home",
    projects: "Projects",
    about: "About Me",
    contact: "Contact",
  },
  home: {
    viewProjects: "View Projects",
    aboutMe: "About Me",
    featured: "Featured Projects",
    allProjects: "All projects →",
  },
  projects: {
    title: "Projects",
    count: "{n} projects in total",
    featuredBadge: "Featured",
    backToList: "← Back to projects",
    linkSource: "View source on GitHub",
    linkDemo: "Live Demo",
    linkTbd: "Project link (to be added)",
    notFoundTitle: "404 · Project not found",
    notFoundMessage:
      "This project does not exist or has been removed. Please pick one from the project list.",
    backToProjects: "Back to projects",
  },
  about: {
    title: "About Me",
    education: "Education",
    experience: "Experience",
    skills: "Skills",
    misc: "More",
    languages: "Languages",
    interests: "Interests",
  },
  contact: {
    title: "Contact Me",
    intro:
      "Submissions are validated and saved on the server. You can also reach me through:",
    email: "Email",
    phone: "Phone",
    formName: "Name",
    formEmail: "Email",
    formMessage: "Message",
    submit: "Submit",
    submitting: "Submitting…",
    success: "Submitted successfully. Your message has been saved.",
    validationError:
      "Server-side validation failed. Please fix the errors below and try again.",
    saveError:
      "Saving failed. Your submission was not written. Please try again later.",
  },
  errors: {
    nameEmpty: "Name cannot be empty (after trimming whitespace)",
    messageEmpty: "Message cannot be empty (after trimming whitespace)",
    emailWhitespace: "Email must not contain whitespace",
    emailSingleAt: "Email must contain exactly one @",
    emailLocalEmpty: "Email must have something before the @",
    emailDomainDot: "Email domain must contain a dot",
    emailDomainSegment: "Each dot-separated part of the email domain must be non-empty",
  },
  notFound: {
    title: "404 · Page not found",
    message: "The requested page does not exist.",
    backHome: "Back to home",
  },
  footer: {
    contactMe: "Contact me",
  },
};

export default en;
